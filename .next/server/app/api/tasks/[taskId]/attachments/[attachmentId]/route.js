"use strict";(()=>{var e={};e.id=603,e.ids=[603],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},4237:(e,t,E)=>{E.r(t),E.d(t,{originalPathname:()=>f,patchFetch:()=>p,requestAsyncStorage:()=>L,routeModule:()=>R,serverHooks:()=>O,staticGenerationAsyncStorage:()=>I});var s={};E.r(s),E.d(s,{DELETE:()=>A,GET:()=>u});var a=E(3278),r=E(5002),n=E(4877),i=E(1309),d=E(3275),T=E(3709),o=E(2048),l=E.n(o),N=E(5315),c=E.n(N);let _=c().join(process.cwd(),"data","uploads");async function u(e,{params:t}){let E=(0,d.v6)(e);if(!E)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:s,attachmentId:a}=t;if(!await (0,T.pP)(`SELECT t.id, f.owner_id FROM tasks t
     JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (f.owner_id = ? OR fc.user_id = ?)`,[s,E.id,E.id]))return i.NextResponse.json({error:"Task not found or access denied."},{status:404});let r=await (0,T.pP)("SELECT * FROM task_attachments WHERE id = ? AND task_id = ?",[a,s]);if(!r)return i.NextResponse.json({error:"Attachment not found."},{status:404});let n=c().join(_,s,r.file_path);if(!l().existsSync(n))return i.NextResponse.json({error:"File on disk not found."},{status:404});let o=l().readFileSync(n),N="1"===e.nextUrl.searchParams.get("download");return new i.NextResponse(o,{headers:{"Content-Type":r.file_type||"application/octet-stream","Content-Disposition":`${N?"attachment":"inline"}; filename="${encodeURIComponent(r.file_name)}"`,"Content-Length":o.length.toString()}})}async function A(e,{params:t}){let E=(0,d.v6)(e);if(!E)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:s,attachmentId:a}=t,r=await (0,T.pP)(`SELECT a.*, f.owner_id as folder_owner_id 
     FROM task_attachments a
     JOIN tasks t ON a.task_id = t.id
     JOIN folders f ON t.folder_id = f.id
     WHERE a.id = ? AND a.task_id = ?`,[a,s]);if(!r)return i.NextResponse.json({error:"Attachment not found."},{status:404});if(r.user_id!==E.id&&r.folder_owner_id!==E.id)return i.NextResponse.json({error:"Permission denied to delete this attachment."},{status:403});let n=c().join(_,s,r.file_path);try{l().existsSync(n)&&l().unlinkSync(n)}catch(e){console.warn("Failed to remove attachment file from disk:",e)}return await (0,T.ht)("DELETE FROM task_attachments WHERE id = ?",[a]),i.NextResponse.json({success:!0,message:"Attachment deleted."})}let R=new a.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/tasks/[taskId]/attachments/[attachmentId]/route",pathname:"/api/tasks/[taskId]/attachments/[attachmentId]",filename:"route",bundlePath:"app/api/tasks/[taskId]/attachments/[attachmentId]/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\tasks\\[taskId]\\attachments\\[attachmentId]\\route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:L,staticGenerationAsyncStorage:I,serverHooks:O}=R,f="/api/tasks/[taskId]/attachments/[attachmentId]/route";function p(){return(0,n.patchFetch)({serverHooks:O,staticGenerationAsyncStorage:I})}},3275:(e,t,E)=>{E.d(t,{Gv:()=>T,HI:()=>u,V3:()=>o,WX:()=>l,c_:()=>d,oH:()=>_,rV:()=>c,v6:()=>N});var s=E(3981),a=E(7390),r=E.n(a);E(2845);let n=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",i="academiatask_session";function d(e){let t=s.ZP.genSaltSync(10);return s.ZP.hashSync(e,t)}function T(e,t){return s.ZP.compareSync(e,t)}function o(e){return r().sign(e,n,{expiresIn:"7d"})}function l(e){try{return r().verify(e,n)}catch{return null}}function N(e){try{let t=e.cookies.get(i)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return l(t)}catch{return null}}function c(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function _(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let u=i},3709:(e,t,E)=>{E.d(t,{ht:()=>R,IO:()=>u,pP:()=>A});var s=E(2048),a=E.n(s),r=E(5315),n=E.n(r);let i=require("sql.js");var d=E.n(i);let T=null,o=null,l=process.env.VERCEL||process.env.NEXT_PUBLIC_VERCEL_ENV?"/tmp/academiatask":n().join(process.cwd(),"data"),N=n().join(l,"academiatask.sqlite");function c(){if(T)try{a().existsSync(l)||a().mkdirSync(l,{recursive:!0});let e=T.export(),t=Buffer.from(e);a().writeFileSync(N,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function _(){if(T)return T;if(o||(o=await d()({locateFile:e=>n().join(process.cwd(),"node_modules","sql.js","dist",e)})),a().existsSync(N)){let e=a().readFileSync(N);T=new o.Database(e)}else a().existsSync(l)||a().mkdirSync(l,{recursive:!0}),T=new o.Database;T.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let s=e.exec("PRAGMA table_info(folders);")[0]?.values??[];s.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),s.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),c()}(T);let{ensureSeeded:e}=await E.e(254).then(E.bind(E,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(T),T}async function u(e,t=[]){let E=(await _()).prepare(e);t.length>0&&E.bind(t);let s=[];for(;E.step();)s.push(E.getAsObject());return E.free(),s}async function A(e,t=[]){let E=await u(e,t);return E.length>0?E[0]:null}async function R(e,t=[]){let E=await _();E.run(e,t);let s=E.getRowsModified();return c(),{rowsModified:s}}}};var t=require("../../../../../../webpack-runtime.js");t.C(e);var E=e=>t(t.s=e),s=t.X(0,[787,783,833],()=>E(4237));module.exports=s})();