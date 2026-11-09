import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

const POSTGRES_URL =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  '';
const usePostgres = POSTGRES_URL.length > 0;

/* -------------------------------------------------------------------------- */
/* Postgres (Vercel + Supabase)                                               */
/* -------------------------------------------------------------------------- */

type PgPool = import('pg').Pool;

let pgPool: PgPool | null = null;
let pgInit: Promise<void> | null = null;
let pgReady = false;

const PG_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    avatar_color TEXT DEFAULT '#3E4B8E',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#3E4B8E',
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS folder_collaborators (
    folder_id TEXT NOT NULL REFERENCES folders(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (folder_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date TIMESTAMPTZ NOT NULL,
    is_completed INTEGER DEFAULT 0,
    time_logged_seconds INTEGER DEFAULT 0,
    folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
    created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS task_attachments (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    is_read INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_folder ON tasks(folder_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);
  CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
  CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);
  CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
  CREATE INDEX IF NOT EXISTS idx_attachments_task ON task_attachments(task_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at);

  ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
  ALTER TABLE folder_collaborators ENABLE ROW LEVEL SECURITY;
  ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
`;

function toPgPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

async function cleanupSoftDeletedRecordsPg(pool: PgPool) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await pool.query(
    'DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= $1)',
    [cutoff]
  );
  await pool.query(
    'DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= $1)',
    [cutoff]
  );
  await pool.query('DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= $1', [cutoff]);
  await pool.query('DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= $1', [cutoff]);
}

function normalizePgUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    url.searchParams.delete('sslmode');
    url.searchParams.delete('supa');
    url.searchParams.delete('pgbouncer');
    return url.toString();
  } catch {
    return rawUrl;
  }
}

async function ensurePostgres(): Promise<PgPool> {
  if (pgReady && pgPool) {
    return pgPool;
  }

  if (!pgInit) {
    pgInit = (async () => {
      const { Pool } = await import('pg');
      const pool = new Pool({
        connectionString: normalizePgUrl(POSTGRES_URL),
        max: 5,
        ssl: { rejectUnauthorized: false },
      });

      pool.on('error', (err) => {
        console.error('Unexpected Postgres pool error:', err);
      });

      await pool.query(PG_SCHEMA);
      await cleanupSoftDeletedRecordsPg(pool);

      pgPool = pool;
      pgReady = true;

      const { ensureSeeded } = await import('./seed');
      await ensureSeeded();
    })().catch((err) => {
      pgInit = null;
      pgPool = null;
      pgReady = false;
      throw err;
    });
  }

  await pgInit;
  if (!pgPool) {
    throw new Error('Postgres pool failed to initialize.');
  }
  return pgPool;
}

/* -------------------------------------------------------------------------- */
/* SQLite (local development fallback)                                        */
/* -------------------------------------------------------------------------- */

let dbInstance: Database | null = null;
let SQL: SqlJsStatic | null = null;

const isServerlessRuntime = Boolean(process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV);
const DATA_DIR = isServerlessRuntime ? '/tmp/academiatask' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'academiatask.sqlite');

function saveDb(): void {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

async function getSqliteDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file: string) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
    });
  }

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Run initial schema
  initSchema(dbInstance);

  // Lazy seed
  const { ensureSeeded } = await import('./seed');
  await ensureSeeded();
  cleanupSoftDeletedRecords(dbInstance);

  return dbInstance;
}

function cleanupSoftDeletedRecords(db: Database) {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  db.run('DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)', [cutoff]);
  db.run('DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)', [cutoff]);
  db.run('DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?', [cutoff]);
  db.run('DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?', [cutoff]);
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_color TEXT DEFAULT '#3E4B8E',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color_hex TEXT NOT NULL DEFAULT '#3E4B8E',
      owner_id TEXT NOT NULL,
      parent_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS folder_collaborators (
      folder_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (folder_id, user_id),
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      due_date DATETIME NOT NULL,
      is_completed INTEGER DEFAULT 0,
      time_logged_seconds INTEGER DEFAULT 0,
      folder_id TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME,
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_attachments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_id TEXT NOT NULL,
      actor_id TEXT,
      task_id TEXT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_read INTEGER DEFAULT 0,
      FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
    CREATE INDEX IF NOT EXISTS idx_tasks_folder ON tasks(folder_id);
    CREATE INDEX IF NOT EXISTS idx_comments_task ON comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_attachments_task ON task_attachments(task_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_recipient_created ON notifications(recipient_id, created_at);
  `);

  const taskColumns: unknown[] = db.exec('PRAGMA table_info(tasks);')[0]?.values ?? [];
  const folderIdColumn = taskColumns.find((column: unknown) => Array.isArray(column) && column[1] === 'folder_id') as unknown[] | undefined;
  if (folderIdColumn && folderIdColumn[3] === 1) {
    db.run('ALTER TABLE tasks RENAME TO tasks_old;');
    db.run(`
      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        due_date DATETIME NOT NULL,
        is_completed INTEGER DEFAULT 0,
        time_logged_seconds INTEGER DEFAULT 0,
        folder_id TEXT,
        created_by TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    db.run(`
      INSERT INTO tasks (id, title, description, due_date, is_completed, time_logged_seconds, folder_id, created_by, created_at, completed_at)
      SELECT id, title, description, due_date, is_completed, time_logged_seconds, folder_id, created_by, created_at, completed_at
      FROM tasks_old;
    `);
    db.run('DROP TABLE tasks_old;');
  }
  if (!taskColumns.some((column: unknown) => Array.isArray(column) && column[1] === 'completed_at')) {
    db.run('ALTER TABLE tasks ADD COLUMN completed_at DATETIME;');
  }
  if (!taskColumns.some((column: unknown) => Array.isArray(column) && column[1] === 'time_logged_seconds')) {
    db.run('ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;');
  }

  const folderColumns: unknown[] = db.exec('PRAGMA table_info(folders);')[0]?.values ?? [];
  if (!folderColumns.some((column: unknown) => Array.isArray(column) && column[1] === 'parent_id')) {
    db.run('ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;');
  }
  if (!folderColumns.some((column: unknown) => Array.isArray(column) && column[1] === 'deleted_at')) {
    db.run('ALTER TABLE folders ADD COLUMN deleted_at DATETIME;');
  }
  db.run('CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);');

  const taskColumnsAfterMigration: unknown[] = db.exec('PRAGMA table_info(tasks);')[0]?.values ?? [];
  if (!taskColumnsAfterMigration.some((column: unknown) => Array.isArray(column) && column[1] === 'deleted_at')) {
    db.run('ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;');
  }
  db.run('CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);');

  saveDb();
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Execute a SELECT query and return typed row objects
 */
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (usePostgres) {
    const pool = await ensurePostgres();
    const result = await pool.query(toPgPlaceholders(sql), params);
    return result.rows as T[];
  }

  const db = await getSqliteDb();
  const stmt = db.prepare(sql);

  if (params.length > 0) {
    stmt.bind(params);
  }

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

/**
 * Execute a SELECT query that returns at most one row
 */
export async function queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT, UPDATE, or DELETE query and persist changes
 */
export async function execute(sql: string, params: any[] = []): Promise<{ rowsModified: number }> {
  if (usePostgres) {
    const pool = await ensurePostgres();
    const result = await pool.query(toPgPlaceholders(sql), params);
    return { rowsModified: result.rowCount ?? 0 };
  }

  const db = await getSqliteDb();
  db.run(sql, params);
  const rowsModified = db.getRowsModified();
  saveDb();
  return { rowsModified };
}
