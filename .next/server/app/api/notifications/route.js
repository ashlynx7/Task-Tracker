"use strict";(()=>{var e={};e.id=996,e.ids=[996],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},4864:(e,t,E)=>{E.r(t),E.d(t,{originalPathname:()=>A,patchFetch:()=>R,requestAsyncStorage:()=>_,routeModule:()=>l,serverHooks:()=>u,staticGenerationAsyncStorage:()=>c});var i={};E.r(i),E.d(i,{GET:()=>o,PATCH:()=>N});var a=E(3278),r=E(5002),s=E(4877),d=E(1309),n=E(3275),T=E(3709);async function o(e){let t=(0,n.v6)(e);if(!t)return d.NextResponse.json({error:"Unauthorized"},{status:401});let E=Number(new URL(e.url).searchParams.get("timezoneOffsetMinutes")),i=Number.isFinite(E)&&840>=Math.abs(E)?Math.trunc(E):0,a=new Date(Date.now()-6e4*i),r=[a.getUTCFullYear(),String(a.getUTCMonth()+1).padStart(2,"0"),String(a.getUTCDate()).padStart(2,"0")].join("-"),s=Date.UTC(a.getUTCFullYear(),a.getUTCMonth(),a.getUTCDate()),o=new Date(s+6e4*i).toISOString(),N=new Date(s+864e5+6e4*i).toISOString(),l=`deadline_${t.id}_${r}_`;await (0,T.ht)(`DELETE FROM notifications
     WHERE recipient_id = ? AND task_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM tasks t
         JOIN folders f ON f.id = t.folder_id
         WHERE t.id = notifications.task_id
       )`,[t.id]),await (0,T.ht)("DELETE FROM notifications WHERE recipient_id = ? AND type = 'deadline' AND id NOT LIKE ?",[t.id,`${l}%`]);let _=await (0,T.IO)(`SELECT DISTINCT t.id, t.title, t.due_date
     FROM tasks t
     JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE (f.owner_id = ? OR fc.user_id = ?)
       AND t.is_completed = 0
       AND t.due_date >= ?
       AND t.due_date < ?
     ORDER BY datetime(t.due_date) ASC`,[t.id,t.id,o,N]),c=new Set(_.map(e=>e.id)),u=await (0,T.IO)(`SELECT id, task_id FROM notifications
     WHERE recipient_id = ? AND type = 'deadline' AND id LIKE ?`,[t.id,`${l}%`]),A=new Set(u.map(e=>e.id));for(let e of u)c.has(e.task_id)||await (0,T.ht)("DELETE FROM notifications WHERE id = ? AND recipient_id = ?",[e.id,t.id]);for(let e of _){let E=`${l}${e.id}`;A.has(E)||await (0,T.ht)(`INSERT INTO notifications (id, recipient_id, task_id, type, message)
       VALUES (?, ?, ?, 'deadline', ?)`,[E,t.id,e.id,Number.isNaN(new Date(e.due_date).getTime())?`Due today: "${e.title}".`:`Due today at ${new Date(e.due_date).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",hour12:!0})}: "${e.title}".`])}let R=await (0,T.IO)(`SELECT n.id, n.task_id, n.type, n.message, n.created_at, n.is_read
     FROM notifications n
     LEFT JOIN tasks t ON t.id = n.task_id
     WHERE n.recipient_id = ?
     ORDER BY CASE WHEN n.type = 'deadline' THEN 0 ELSE 1 END,
              CASE WHEN n.type = 'deadline' THEN datetime(t.due_date) END ASC,
              datetime(n.created_at) DESC
     LIMIT 50`,[t.id]);return d.NextResponse.json({notifications:R})}async function N(e){let t=(0,n.v6)(e);if(!t)return d.NextResponse.json({error:"Unauthorized"},{status:401});let E=await e.json();if(!0===E.all)await (0,T.ht)("UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0",[t.id]);else{if("string"!=typeof E.id)return d.NextResponse.json({error:"A notification id or all=true is required."},{status:400});await (0,T.ht)("UPDATE notifications SET is_read = 1 WHERE id = ? AND recipient_id = ?",[E.id,t.id])}return d.NextResponse.json({message:"Notifications updated."})}let l=new a.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/notifications/route",pathname:"/api/notifications",filename:"route",bundlePath:"app/api/notifications/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\notifications\\route.ts",nextConfigOutput:"",userland:i}),{requestAsyncStorage:_,staticGenerationAsyncStorage:c,serverHooks:u}=l,A="/api/notifications/route";function R(){return(0,s.patchFetch)({serverHooks:u,staticGenerationAsyncStorage:c})}},3275:(e,t,E)=>{E.d(t,{Gv:()=>T,HI:()=>u,V3:()=>o,WX:()=>N,c_:()=>n,oH:()=>c,rV:()=>_,v6:()=>l});var i=E(3981),a=E(7390),r=E.n(a);E(2845);let s=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",d="academiatask_session";function n(e){let t=i.ZP.genSaltSync(10);return i.ZP.hashSync(e,t)}function T(e,t){return i.ZP.compareSync(e,t)}function o(e){return r().sign(e,s,{expiresIn:"7d"})}function N(e){try{return r().verify(e,s)}catch{return null}}function l(e){try{let t=e.cookies.get(d)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return N(t)}catch{return null}}function _(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function c(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let u=d},3709:(e,t,E)=>{E.d(t,{ht:()=>R,IO:()=>u,pP:()=>A});var i=E(2048),a=E.n(i),r=E(5315),s=E.n(r);let d=require("sql.js");var n=E.n(d);let T=null,o=null,N=s().join(process.cwd(),"data"),l=s().join(N,"academiatask.sqlite");function _(){if(T)try{a().existsSync(N)||a().mkdirSync(N,{recursive:!0});let e=T.export(),t=Buffer.from(e);a().writeFileSync(l,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function c(){if(T)return T;if(o||(o=await n()({locateFile:e=>s().join(process.cwd(),"node_modules","sql.js","dist",e)})),a().existsSync(l)){let e=a().readFileSync(l);T=new o.Database(e)}else a().existsSync(N)||a().mkdirSync(N,{recursive:!0}),T=new o.Database;T.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let i=e.exec("PRAGMA table_info(folders);")[0]?.values??[];i.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),i.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),_()}(T);let{ensureSeeded:e}=await E.e(254).then(E.bind(E,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(T),T}async function u(e,t=[]){let E=(await c()).prepare(e);t.length>0&&E.bind(t);let i=[];for(;E.step();)i.push(E.getAsObject());return E.free(),i}async function A(e,t=[]){let E=await u(e,t);return E.length>0?E[0]:null}async function R(e,t=[]){let E=await c();E.run(e,t);let i=E.getRowsModified();return _(),{rowsModified:i}}}};var t=require("../../../webpack-runtime.js");t.C(e);var E=e=>t(t.s=e),i=t.X(0,[787,783,833],()=>E(4864));module.exports=i})();