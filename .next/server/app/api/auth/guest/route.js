"use strict";(()=>{var e={};e.id=143,e.ids=[143],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},2969:(e,t,E)=>{E.r(t),E.d(t,{originalPathname:()=>c,patchFetch:()=>A,requestAsyncStorage:()=>l,routeModule:()=>N,serverHooks:()=>_,staticGenerationAsyncStorage:()=>u});var r={};E.r(r),E.d(r,{POST:()=>o});var s=E(3278),a=E(5002),T=E(4877),i=E(1309),d=E(3709),n=E(3275);async function o(e){try{let t=await (0,d.pP)("SELECT id, username, email, avatar_color FROM users WHERE LOWER(username) = LOWER(?)",["alex_cs"]);if(!t)return i.NextResponse.json({error:"Guest account is unavailable."},{status:404});let E={id:t.id,username:t.username,email:t.email,avatar_color:t.avatar_color||"#3E4B8E"},r=(0,n.V3)(E),s=i.NextResponse.redirect(new URL("/dashboard",e.url));return s.cookies.set(n.HI,r,{httpOnly:!0,secure:!0,sameSite:"lax",path:"/",maxAge:604800}),s}catch(e){return console.error("Guest login error:",e),i.NextResponse.json({error:"Unable to continue as guest."},{status:500})}}let N=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/auth/guest/route",pathname:"/api/auth/guest",filename:"route",bundlePath:"app/api/auth/guest/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\auth\\guest\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:l,staticGenerationAsyncStorage:u,serverHooks:_}=N,c="/api/auth/guest/route";function A(){return(0,T.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:u})}},3275:(e,t,E)=>{E.d(t,{Gv:()=>n,HI:()=>c,V3:()=>o,WX:()=>N,c_:()=>d,oH:()=>_,rV:()=>u,v6:()=>l});var r=E(3981),s=E(7390),a=E.n(s);E(2845);let T=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",i="academiatask_session";function d(e){let t=r.ZP.genSaltSync(10);return r.ZP.hashSync(e,t)}function n(e,t){return r.ZP.compareSync(e,t)}function o(e){return a().sign(e,T,{expiresIn:"7d"})}function N(e){try{return a().verify(e,T)}catch{return null}}function l(e){try{let t=e.cookies.get(i)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return N(t)}catch{return null}}function u(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function _(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let c=i},3709:(e,t,E)=>{E.d(t,{ht:()=>R,IO:()=>c,pP:()=>A});var r=E(2048),s=E.n(r),a=E(5315),T=E.n(a);let i=require("sql.js");var d=E.n(i);let n=null,o=null,N=T().join(process.cwd(),"data"),l=T().join(N,"academiatask.sqlite");function u(){if(n)try{s().existsSync(N)||s().mkdirSync(N,{recursive:!0});let e=n.export(),t=Buffer.from(e);s().writeFileSync(l,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function _(){if(n)return n;if(o||(o=await d()({locateFile:e=>T().join(process.cwd(),"node_modules","sql.js","dist",e)})),s().existsSync(l)){let e=s().readFileSync(l);n=new o.Database(e)}else s().existsSync(N)||s().mkdirSync(N,{recursive:!0}),n=new o.Database;n.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let r=e.exec("PRAGMA table_info(folders);")[0]?.values??[];r.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),r.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),u()}(n);let{ensureSeeded:e}=await E.e(254).then(E.bind(E,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(n),n}async function c(e,t=[]){let E=(await _()).prepare(e);t.length>0&&E.bind(t);let r=[];for(;E.step();)r.push(E.getAsObject());return E.free(),r}async function A(e,t=[]){let E=await c(e,t);return E.length>0?E[0]:null}async function R(e,t=[]){let E=await _();E.run(e,t);let r=E.getRowsModified();return u(),{rowsModified:r}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var E=e=>t(t.s=e),r=t.X(0,[787,783,833],()=>E(2969));module.exports=r})();