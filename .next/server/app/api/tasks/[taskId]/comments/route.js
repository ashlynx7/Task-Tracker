"use strict";(()=>{var e={};e.id=460,e.ids=[460],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},7996:(e,t,E)=>{E.r(t),E.d(t,{originalPathname:()=>A,patchFetch:()=>L,requestAsyncStorage:()=>l,routeModule:()=>N,serverHooks:()=>R,staticGenerationAsyncStorage:()=>u});var r={};E.r(r),E.d(r,{GET:()=>_,POST:()=>c});var s=E(3278),a=E(5002),d=E(4877),i=E(1309),T=E(3275),o=E(3709),n=E(250);async function _(e,{params:t}){let E=(0,T.v6)(e);if(!E)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:r}=t;if(!await (0,o.pP)(`SELECT t.id, t.title, t.folder_id, t.created_by FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ? OR fc.user_id = ?
     )`,[r,E.id,E.id,E.id]))return i.NextResponse.json({error:"Task not found or access denied."},{status:404});let s=await (0,o.IO)(`SELECT c.id, c.task_id, c.author_id, c.content, c.created_at,
            u.username as author_username, u.avatar_color as author_avatar_color,
            CASE WHEN c.author_id = ? THEN 1 ELSE 0 END as is_author
     FROM comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.task_id = ?
     ORDER BY c.created_at ASC`,[E.id,r]);return i.NextResponse.json({comments:s})}async function c(e,{params:t}){let E=(0,T.v6)(e);if(!E)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:r}=t,{content:s}=await e.json();if(!s||!s.trim())return i.NextResponse.json({error:"Comment text is required."},{status:400});let a=await (0,o.pP)(`SELECT t.id, t.title, t.folder_id, t.created_by FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ? OR fc.user_id = ?
     )`,[r,E.id,E.id,E.id]);if(!a)return i.NextResponse.json({error:"Task not found or access denied."},{status:404});let d=`comm_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,_=s.trim();await (0,o.ht)("INSERT INTO comments (id, task_id, author_id, content) VALUES (?, ?, ?, ?)",[d,r,E.id,_]);let c=await (0,o.pP)(`SELECT c.id, c.task_id, c.author_id, c.content, c.created_at,
            u.username as author_username, u.avatar_color as author_avatar_color,
            1 as is_author
     FROM comments c
     JOIN users u ON c.author_id = u.id
     WHERE c.id = ?`,[d]);return a.folder_id&&await (0,n.p)({folderId:a.folder_id,taskId:r,actorId:E.id,type:"comment",message:`${E.username} commented on "${a.title}".`}),i.NextResponse.json({comment:c,message:"Comment posted!"})}let N=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/tasks/[taskId]/comments/route",pathname:"/api/tasks/[taskId]/comments",filename:"route",bundlePath:"app/api/tasks/[taskId]/comments/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\tasks\\[taskId]\\comments\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:l,staticGenerationAsyncStorage:u,serverHooks:R}=N,A="/api/tasks/[taskId]/comments/route";function L(){return(0,d.patchFetch)({serverHooks:R,staticGenerationAsyncStorage:u})}},3275:(e,t,E)=>{E.d(t,{Gv:()=>o,HI:()=>u,V3:()=>n,WX:()=>_,c_:()=>T,oH:()=>l,rV:()=>N,v6:()=>c});var r=E(3981),s=E(7390),a=E.n(s);E(2845);let d=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",i="academiatask_session";function T(e){let t=r.ZP.genSaltSync(10);return r.ZP.hashSync(e,t)}function o(e,t){return r.ZP.compareSync(e,t)}function n(e){return a().sign(e,d,{expiresIn:"7d"})}function _(e){try{return a().verify(e,d)}catch{return null}}function c(e){try{let t=e.cookies.get(i)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return _(t)}catch{return null}}function N(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function l(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let u=i},3709:(e,t,E)=>{E.d(t,{ht:()=>A,IO:()=>u,pP:()=>R});var r=E(2048),s=E.n(r),a=E(5315),d=E.n(a);let i=require("sql.js");var T=E.n(i);let o=null,n=null,_=d().join(process.cwd(),"data"),c=d().join(_,"academiatask.sqlite");function N(){if(o)try{s().existsSync(_)||s().mkdirSync(_,{recursive:!0});let e=o.export(),t=Buffer.from(e);s().writeFileSync(c,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function l(){if(o)return o;if(n||(n=await T()({locateFile:e=>d().join(process.cwd(),"node_modules","sql.js","dist",e)})),s().existsSync(c)){let e=s().readFileSync(c);o=new n.Database(e)}else s().existsSync(_)||s().mkdirSync(_,{recursive:!0}),o=new n.Database;o.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let r=e.exec("PRAGMA table_info(folders);")[0]?.values??[];r.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),r.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),N()}(o);let{ensureSeeded:e}=await E.e(254).then(E.bind(E,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(o),o}async function u(e,t=[]){let E=(await l()).prepare(e);t.length>0&&E.bind(t);let r=[];for(;E.step();)r.push(E.getAsObject());return E.free(),r}async function R(e,t=[]){let E=await u(e,t);return E.length>0?E[0]:null}async function A(e,t=[]){let E=await l();E.run(e,t);let r=E.getRowsModified();return N(),{rowsModified:r}}},250:(e,t,E)=>{E.d(t,{p:()=>s});var r=E(3709);async function s({folderId:e,taskId:t,actorId:E,type:s,message:a}){if(e)for(let d of(await (0,r.IO)(`SELECT owner_id as user_id FROM folders WHERE id = ? AND owner_id != ?
     UNION
     SELECT user_id FROM folder_collaborators WHERE folder_id = ? AND user_id != ?`,[e,E,e,E]))){let e=`notif_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;await (0,r.ht)(`INSERT INTO notifications (id, recipient_id, actor_id, task_id, type, message)
       VALUES (?, ?, ?, ?, ?, ?)`,[e,d.user_id,E,t,s,a])}}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var E=e=>t(t.s=e),r=t.X(0,[787,783,833],()=>E(7996));module.exports=r})();