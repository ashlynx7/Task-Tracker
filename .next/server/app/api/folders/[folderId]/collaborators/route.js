"use strict";(()=>{var e={};e.id=804,e.ids=[804],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},6071:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>R,patchFetch:()=>A,requestAsyncStorage:()=>u,routeModule:()=>N,serverHooks:()=>c,staticGenerationAsyncStorage:()=>_});var E={};r.r(E),r.d(E,{DELETE:()=>l,POST:()=>n});var s=r(3278),a=r(5002),d=r(4877),o=r(1309),i=r(3275),T=r(3709);async function n(e,{params:t}){let r=(0,i.v6)(e);if(!r)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{folderId:E}=t,{username:s}=await e.json();if(!s||!s.trim())return o.NextResponse.json({error:"Username is required."},{status:400});let a=s.trim().toLowerCase(),d=await (0,T.pP)(`SELECT f.id, f.name, f.owner_id FROM folders f
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE f.id = ? AND (f.owner_id = ? OR fc.user_id = ?)`,[E,r.id,r.id]);if(!d)return o.NextResponse.json({error:"Folder not found or permission denied."},{status:404});let n=await (0,T.pP)("SELECT id, username, email, avatar_color FROM users WHERE LOWER(username) = ?",[a]);if(!n)return o.NextResponse.json({error:`User "@${s}" does not exist.`},{status:404});if(n.id===d.owner_id)return o.NextResponse.json({error:`@${n.username} is already the owner of this folder.`},{status:400});if(await (0,T.pP)("SELECT * FROM folder_collaborators WHERE folder_id = ? AND user_id = ?",[E,n.id]))return o.NextResponse.json({error:`@${n.username} is already a collaborator on this folder.`},{status:400});await (0,T.ht)("INSERT INTO folder_collaborators (folder_id, user_id) VALUES (?, ?)",[E,n.id]);let l=await (0,T.IO)(`SELECT u.id, u.username, u.email, u.avatar_color, fc.joined_at
     FROM folder_collaborators fc
     JOIN users u ON fc.user_id = u.id
     WHERE fc.folder_id = ?`,[E]);return o.NextResponse.json({collaborators:l,addedUser:n,message:`@${n.username} has been added as a collaborator!`})}async function l(e,{params:t}){let r=(0,i.v6)(e);if(!r)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{folderId:E}=t,{searchParams:s}=new URL(e.url),a=s.get("userId");if(!a)return o.NextResponse.json({error:"Target userId required."},{status:400});let d=await (0,T.pP)("SELECT owner_id FROM folders WHERE id = ?",[E]);return d?a!==r.id&&d.owner_id!==r.id?o.NextResponse.json({error:"Permission denied to remove this collaborator."},{status:403}):(await (0,T.ht)("DELETE FROM folder_collaborators WHERE folder_id = ? AND user_id = ?",[E,a]),o.NextResponse.json({message:"Collaborator removed successfully."})):o.NextResponse.json({error:"Folder not found."},{status:404})}let N=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/folders/[folderId]/collaborators/route",pathname:"/api/folders/[folderId]/collaborators",filename:"route",bundlePath:"app/api/folders/[folderId]/collaborators/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\folders\\[folderId]\\collaborators\\route.ts",nextConfigOutput:"",userland:E}),{requestAsyncStorage:u,staticGenerationAsyncStorage:_,serverHooks:c}=N,R="/api/folders/[folderId]/collaborators/route";function A(){return(0,d.patchFetch)({serverHooks:c,staticGenerationAsyncStorage:_})}},3275:(e,t,r)=>{r.d(t,{Gv:()=>T,HI:()=>c,V3:()=>n,WX:()=>l,c_:()=>i,oH:()=>_,rV:()=>u,v6:()=>N});var E=r(3981),s=r(7390),a=r.n(s);r(2845);let d=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",o="academiatask_session";function i(e){let t=E.ZP.genSaltSync(10);return E.ZP.hashSync(e,t)}function T(e,t){return E.ZP.compareSync(e,t)}function n(e){return a().sign(e,d,{expiresIn:"7d"})}function l(e){try{return a().verify(e,d)}catch{return null}}function N(e){try{let t=e.cookies.get(o)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return l(t)}catch{return null}}function u(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function _(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let c=o},3709:(e,t,r)=>{r.d(t,{ht:()=>A,IO:()=>c,pP:()=>R});var E=r(2048),s=r.n(E),a=r(5315),d=r.n(a);let o=require("sql.js");var i=r.n(o);let T=null,n=null,l=d().join(process.cwd(),"data"),N=d().join(l,"academiatask.sqlite");function u(){if(T)try{s().existsSync(l)||s().mkdirSync(l,{recursive:!0});let e=T.export(),t=Buffer.from(e);s().writeFileSync(N,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function _(){if(T)return T;if(n||(n=await i()({locateFile:e=>d().join(process.cwd(),"node_modules","sql.js","dist",e)})),s().existsSync(N)){let e=s().readFileSync(N);T=new n.Database(e)}else s().existsSync(l)||s().mkdirSync(l,{recursive:!0}),T=new n.Database;T.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
  `);let t=e.exec("PRAGMA table_info(tasks);")[0]?.values??[],r=t.find(e=>Array.isArray(e)&&"folder_id"===e[1]);r&&1===r[3]&&(e.run("ALTER TABLE tasks RENAME TO tasks_old;"),e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let E=e.exec("PRAGMA table_info(folders);")[0]?.values??[];E.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),E.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),u()}(T);let{ensureSeeded:e}=await r.e(254).then(r.bind(r,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(T),T}async function c(e,t=[]){let r=(await _()).prepare(e);t.length>0&&r.bind(t);let E=[];for(;r.step();)E.push(r.getAsObject());return r.free(),E}async function R(e,t=[]){let r=await c(e,t);return r.length>0?r[0]:null}async function A(e,t=[]){let r=await _();r.run(e,t);let E=r.getRowsModified();return u(),{rowsModified:E}}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),E=t.X(0,[787,783,833],()=>r(6071));module.exports=E})();