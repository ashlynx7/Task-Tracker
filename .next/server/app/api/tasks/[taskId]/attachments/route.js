"use strict";(()=>{var e={};e.id=110,e.ids=[110],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},4384:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>p,patchFetch:()=>S,requestAsyncStorage:()=>f,routeModule:()=>L,serverHooks:()=>I,staticGenerationAsyncStorage:()=>O});var r={};a.r(r),a.d(r,{GET:()=>R,POST:()=>A});var E=a(3278),s=a(5002),i=a(4877),d=a(1309),n=a(3275),o=a(3709),T=a(250),l=a(2048),_=a.n(l),N=a(5315),c=a.n(N);let u=c().join(process.cwd(),"data","uploads");async function R(e,{params:t}){let a=(0,n.v6)(e);if(!a)return d.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:r}=t;if(!await (0,o.pP)(`SELECT t.id, t.title, t.folder_id, t.created_by FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ? OR fc.user_id = ?
     )`,[r,a.id,a.id,a.id]))return d.NextResponse.json({error:"Task not found or access denied."},{status:404});let E=await (0,o.IO)(`SELECT a.id, a.task_id, a.user_id, a.file_name, a.file_size, a.file_type, a.created_at,
            u.username as uploader_username, u.avatar_color as uploader_avatar_color,
            CASE WHEN a.user_id = ? THEN 1 ELSE 0 END as is_uploader
     FROM task_attachments a
     JOIN users u ON a.user_id = u.id
     WHERE a.task_id = ?
     ORDER BY a.created_at DESC`,[a.id,r]);return d.NextResponse.json({attachments:E})}async function A(e,{params:t}){let a=(0,n.v6)(e);if(!a)return d.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:r}=t,E=await (0,o.pP)(`SELECT t.id, t.title, t.folder_id, t.created_by FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ? OR fc.user_id = ?
     )`,[r,a.id,a.id,a.id]);if(!E)return d.NextResponse.json({error:"Task not found or access denied."},{status:404});try{let t=await e.formData(),s=[...t.getAll("files"),...t.getAll("file")].filter(e=>e instanceof File&&e.size>0);if(0===s.length)return d.NextResponse.json({error:"No files provided for upload."},{status:400});let i=c().join(u,r);_().existsSync(i)||_().mkdirSync(i,{recursive:!0});let n=[];for(let e of s){if(e.size>26214400)return d.NextResponse.json({error:`File "${e.name}" exceeds 25MB limit.`},{status:400});let t=`att_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,s=c().basename(e.name).replace(/[^a-zA-Z0-9._-]/g,"_"),l=`${t}_${s}`,N=c().join(i,l),u=await e.arrayBuffer(),R=Buffer.from(u);_().writeFileSync(N,R);let A=e.type||"application/octet-stream";await (0,o.ht)(`INSERT INTO task_attachments (id, task_id, user_id, file_name, file_path, file_size, file_type)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,[t,r,a.id,e.name,l,e.size,A]);let L=await (0,o.pP)(`SELECT a.id, a.task_id, a.user_id, a.file_name, a.file_size, a.file_type, a.created_at,
                u.username as uploader_username, u.avatar_color as uploader_avatar_color,
                1 as is_uploader
         FROM task_attachments a
         JOIN users u ON a.user_id = u.id
         WHERE a.id = ?`,[t]);L&&(n.push(L),E.folder_id&&await (0,T.p)({folderId:E.folder_id,taskId:r,actorId:a.id,type:"attachment",message:`${a.username} uploaded "${e.name}" to "${E.title}".`}))}return d.NextResponse.json({attachments:n,message:`Successfully uploaded ${n.length} file(s).`})}catch(e){return console.error("File upload error:",e),d.NextResponse.json({error:e.message||"File upload failed."},{status:500})}}let L=new E.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/tasks/[taskId]/attachments/route",pathname:"/api/tasks/[taskId]/attachments",filename:"route",bundlePath:"app/api/tasks/[taskId]/attachments/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\tasks\\[taskId]\\attachments\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:f,staticGenerationAsyncStorage:O,serverHooks:I}=L,p="/api/tasks/[taskId]/attachments/route";function S(){return(0,i.patchFetch)({serverHooks:I,staticGenerationAsyncStorage:O})}},3275:(e,t,a)=>{a.d(t,{Gv:()=>o,HI:()=>u,V3:()=>T,WX:()=>l,c_:()=>n,oH:()=>c,rV:()=>N,v6:()=>_});var r=a(3981),E=a(7390),s=a.n(E);a(2845);let i=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",d="academiatask_session";function n(e){let t=r.ZP.genSaltSync(10);return r.ZP.hashSync(e,t)}function o(e,t){return r.ZP.compareSync(e,t)}function T(e){return s().sign(e,i,{expiresIn:"7d"})}function l(e){try{return s().verify(e,i)}catch{return null}}function _(e){try{let t=e.cookies.get(d)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return l(t)}catch{return null}}function N(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function c(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let u=d},3709:(e,t,a)=>{a.d(t,{ht:()=>A,IO:()=>u,pP:()=>R});var r=a(2048),E=a.n(r),s=a(5315),i=a.n(s);let d=require("sql.js");var n=a.n(d);let o=null,T=null,l=i().join(process.cwd(),"data"),_=i().join(l,"academiatask.sqlite");function N(){if(o)try{E().existsSync(l)||E().mkdirSync(l,{recursive:!0});let e=o.export(),t=Buffer.from(e);E().writeFileSync(_,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function c(){if(o)return o;if(T||(T=await n()({locateFile:e=>i().join(process.cwd(),"node_modules","sql.js","dist",e)})),E().existsSync(_)){let e=E().readFileSync(_);o=new T.Database(e)}else E().existsSync(l)||E().mkdirSync(l,{recursive:!0}),o=new T.Database;o.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
  `);let t=e.exec("PRAGMA table_info(tasks);")[0]?.values??[],a=t.find(e=>Array.isArray(e)&&"folder_id"===e[1]);a&&1===a[3]&&(e.run("ALTER TABLE tasks RENAME TO tasks_old;"),e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let r=e.exec("PRAGMA table_info(folders);")[0]?.values??[];r.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),r.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),N()}(o);let{ensureSeeded:e}=await a.e(254).then(a.bind(a,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(o),o}async function u(e,t=[]){let a=(await c()).prepare(e);t.length>0&&a.bind(t);let r=[];for(;a.step();)r.push(a.getAsObject());return a.free(),r}async function R(e,t=[]){let a=await u(e,t);return a.length>0?a[0]:null}async function A(e,t=[]){let a=await c();a.run(e,t);let r=a.getRowsModified();return N(),{rowsModified:r}}},250:(e,t,a)=>{a.d(t,{p:()=>E});var r=a(3709);async function E({folderId:e,taskId:t,actorId:a,type:E,message:s}){if(e)for(let i of(await (0,r.IO)(`SELECT owner_id as user_id FROM folders WHERE id = ? AND owner_id != ?
     UNION
     SELECT user_id FROM folder_collaborators WHERE folder_id = ? AND user_id != ?`,[e,a,e,a]))){let e=`notif_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;await (0,r.ht)(`INSERT INTO notifications (id, recipient_id, actor_id, task_id, type, message)
       VALUES (?, ?, ?, ?, ?, ?)`,[e,i.user_id,a,t,E,s])}}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[787,783,833],()=>a(4384));module.exports=r})();