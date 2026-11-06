"use strict";(()=>{var e={};e.id=495,e.ids=[495],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},6984:(e,t,E)=>{E.r(t),E.d(t,{originalPathname:()=>A,patchFetch:()=>L,requestAsyncStorage:()=>c,routeModule:()=>N,serverHooks:()=>R,staticGenerationAsyncStorage:()=>u});var r={};E.r(r),E.d(r,{GET:()=>l,POST:()=>_});var s=E(3278),a=E(5002),d=E(4877),i=E(1309),T=E(3275),o=E(3709),n=E(250);async function l(e){let t=(0,T.v6)(e);if(!t)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:E}=new URL(e.url),r=E.get("folder_id"),s=E.get("search")?.trim().toLowerCase()||"",a=E.get("status")||"all",d="true"===E.get("deleted"),n=`
    SELECT t.id, t.title, t.description, t.due_date, t.is_completed, t.completed_at, t.time_logged_seconds, t.folder_id, t.created_by, t.created_at, t.deleted_at,
           f.name as folder_name, f.color_hex as folder_color,
           u.username as creator_username,
           (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count,
           (SELECT COUNT(*) FROM task_attachments ta WHERE ta.task_id = t.id) as attachment_count
    FROM tasks t
    LEFT JOIN folders f ON t.folder_id = f.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE (
      (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
      OR f.owner_id = ?
      OR f.id IN (SELECT folder_id FROM folder_collaborators WHERE user_id = ?)
    )
      AND ${d?'t.deleted_at IS NOT NULL AND t.deleted_at >= datetime("now", "-7 days")':"(t.deleted_at IS NULL OR t.deleted_at = '')"}
  `,l=[t.id,t.id,t.id];r&&"all"!==r&&(n+=" AND t.folder_id = ?",l.push(r)),"pending"===a?n+=" AND t.is_completed = 0":"completed"===a&&(n+=" AND t.is_completed = 1"),s&&(n+=" AND (LOWER(t.title) LIKE ? OR LOWER(t.description) LIKE ?)",l.push(`%${s}%`,`%${s}%`)),n+=" ORDER BY t.due_date ASC, t.created_at ASC";let _=await (0,o.IO)(n,l);return i.NextResponse.json({tasks:_})}async function _(e){let t=(0,T.v6)(e);if(!t)return i.NextResponse.json({error:"Unauthorized"},{status:401});try{let{title:E,description:r,due_date:s,folder_id:a}=await e.json();if(!E||!E.trim())return i.NextResponse.json({error:"Task title is required."},{status:400});if(!s)return i.NextResponse.json({error:"A valid due date and time is mandatory."},{status:400});let d=null;if(a){if(!await (0,o.pP)(`SELECT f.id, f.name, f.color_hex FROM folders f
         LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
         WHERE f.id = ? AND (f.owner_id = ? OR fc.user_id = ?)`,[a,t.id,t.id]))return i.NextResponse.json({error:"Selected folder not found or permission denied."},{status:404});d=a}let T=`task_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,l=new Date(s).toISOString();await (0,o.ht)(`INSERT INTO tasks (id, title, description, due_date, is_completed, folder_id, created_by)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,[T,E.trim(),(r||"").trim(),l,d,t.id]),d&&await (0,n.p)({folderId:d,taskId:T,actorId:t.id,type:"task_created",message:`${t.username} created task "${E.trim()}".`});let _=await (0,o.pP)(`SELECT t.*, f.name as folder_name, f.color_hex as folder_color,
              u.username as creator_username, 0 as comment_count
       FROM tasks t
       LEFT JOIN folders f ON t.folder_id = f.id
       LEFT JOIN users u ON t.created_by = u.id
       WHERE t.id = ?`,[T]);return i.NextResponse.json({task:_,message:"Task created successfully!"})}catch(e){return console.error("Error creating task:",e),i.NextResponse.json({error:"Failed to create task."},{status:500})}}let N=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/tasks/route",pathname:"/api/tasks",filename:"route",bundlePath:"app/api/tasks/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\tasks\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:c,staticGenerationAsyncStorage:u,serverHooks:R}=N,A="/api/tasks/route";function L(){return(0,d.patchFetch)({serverHooks:R,staticGenerationAsyncStorage:u})}},3275:(e,t,E)=>{E.d(t,{Gv:()=>o,HI:()=>u,V3:()=>n,WX:()=>l,c_:()=>T,oH:()=>c,rV:()=>N,v6:()=>_});var r=E(3981),s=E(7390),a=E.n(s);E(2845);let d=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",i="academiatask_session";function T(e){let t=r.ZP.genSaltSync(10);return r.ZP.hashSync(e,t)}function o(e,t){return r.ZP.compareSync(e,t)}function n(e){return a().sign(e,d,{expiresIn:"7d"})}function l(e){try{return a().verify(e,d)}catch{return null}}function _(e){try{let t=e.cookies.get(i)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return l(t)}catch{return null}}function N(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function c(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let u=i},3709:(e,t,E)=>{E.d(t,{ht:()=>A,IO:()=>u,pP:()=>R});var r=E(2048),s=E.n(r),a=E(5315),d=E.n(a);let i=require("sql.js");var T=E.n(i);let o=null,n=null,l=d().join(process.cwd(),"data"),_=d().join(l,"academiatask.sqlite");function N(){if(o)try{s().existsSync(l)||s().mkdirSync(l,{recursive:!0});let e=o.export(),t=Buffer.from(e);s().writeFileSync(_,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function c(){if(o)return o;if(n||(n=await T()({locateFile:e=>d().join(process.cwd(),"node_modules","sql.js","dist",e)})),s().existsSync(_)){let e=s().readFileSync(_);o=new n.Database(e)}else s().existsSync(l)||s().mkdirSync(l,{recursive:!0}),o=new n.Database;o.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
  `);let t=e.exec("PRAGMA table_info(tasks);")[0]?.values??[],E=t.find(e=>Array.isArray(e)&&"folder_id"===e[1]);E&&1===E[3]&&(e.run("ALTER TABLE tasks RENAME TO tasks_old;"),e.run(`
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
    `),e.run(`
      INSERT INTO tasks (id, title, description, due_date, is_completed, time_logged_seconds, folder_id, created_by, created_at, completed_at)
      SELECT id, title, description, due_date, is_completed, time_logged_seconds, folder_id, created_by, created_at, completed_at
      FROM tasks_old;
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let r=e.exec("PRAGMA table_info(folders);")[0]?.values??[];r.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),r.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),N()}(o);let{ensureSeeded:e}=await E.e(254).then(E.bind(E,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(o),o}async function u(e,t=[]){let E=(await c()).prepare(e);t.length>0&&E.bind(t);let r=[];for(;E.step();)r.push(E.getAsObject());return E.free(),r}async function R(e,t=[]){let E=await u(e,t);return E.length>0?E[0]:null}async function A(e,t=[]){let E=await c();E.run(e,t);let r=E.getRowsModified();return N(),{rowsModified:r}}},250:(e,t,E)=>{E.d(t,{p:()=>s});var r=E(3709);async function s({folderId:e,taskId:t,actorId:E,type:s,message:a}){if(e)for(let d of(await (0,r.IO)(`SELECT owner_id as user_id FROM folders WHERE id = ? AND owner_id != ?
     UNION
     SELECT user_id FROM folder_collaborators WHERE folder_id = ? AND user_id != ?`,[e,E,e,E]))){let e=`notif_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;await (0,r.ht)(`INSERT INTO notifications (id, recipient_id, actor_id, task_id, type, message)
       VALUES (?, ?, ?, ?, ?, ?)`,[e,d.user_id,E,t,s,a])}}}};var t=require("../../../webpack-runtime.js");t.C(e);var E=e=>t(t.s=e),r=t.X(0,[787,783,833],()=>E(6984));module.exports=r})();