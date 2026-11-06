"use strict";(()=>{var e={};e.id=873,e.ids=[873],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},3345:(e,t,E)=>{E.r(t),E.d(t,{originalPathname:()=>c,patchFetch:()=>A,requestAsyncStorage:()=>_,routeModule:()=>l,serverHooks:()=>u,staticGenerationAsyncStorage:()=>N});var r={};E.r(r),E.d(r,{POST:()=>o});var a=E(3278),s=E(5002),d=E(4877),i=E(1309),T=E(3709),n=E(3275);async function o(e){try{let{identifier:t,password:E}=await e.json();if(!t||!E)return i.NextResponse.json({error:"Username/email and password are required."},{status:400});let r=t.trim().toLowerCase(),a={alex:"alex_cs",alex_cs:"alex_cs","alex@college.edu":"alex_cs",jordan:"jordan_dev",jordan_dev:"jordan_dev","jordan@college.edu":"jordan_dev"}[r]||r,s=await (0,T.pP)("SELECT id, username, email, password_hash, avatar_color FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",[a,a]);if(!s){let e={alex_cs:{username:"alex_cs",email:"alex@college.edu",password_hash:"$2a$10$D8wJ7fUCPyHfUW4HhGg5M.m0tHqj9Q/1g7l0Hz8JQxVg2a8W9xIuG"},jordan_dev:{username:"jordan_dev",email:"jordan@college.edu",password_hash:"$2a$10$D8wJ7fUCPyHfUW4HhGg5M.m0tHqj9Q/1g7l0Hz8JQxVg2a8W9xIuG"}}[String(a)];if(e&&"password123"===E){let t={id:"alex_cs"===e.username?"user_alex":"user_jordan",username:e.username,email:e.email,avatar_color:"alex_cs"===e.username?"#3E4B8E":"#10b981"},E=(0,n.V3)(t),r=i.NextResponse.json({user:t,message:"Logged in successfully!"});return r.cookies.set(n.HI,E,{httpOnly:!0,secure:!0,sameSite:"lax",path:"/",maxAge:604800}),r}return i.NextResponse.json({error:"Invalid username or password."},{status:401})}if(!(0,n.Gv)(E,s.password_hash))return i.NextResponse.json({error:"Invalid username or password."},{status:401});let d={id:s.id,username:s.username,email:s.email,avatar_color:s.avatar_color||"#3E4B8E"},o=(0,n.V3)(d),l=i.NextResponse.json({user:d,message:"Logged in successfully!"});return l.cookies.set(n.HI,o,{httpOnly:!0,secure:!0,sameSite:"lax",path:"/",maxAge:604800}),l}catch(e){return console.error("Login error:",e),i.NextResponse.json({error:"Internal server error while logging in."},{status:500})}}let l=new a.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/auth/login/route",pathname:"/api/auth/login",filename:"route",bundlePath:"app/api/auth/login/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\auth\\login\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:_,staticGenerationAsyncStorage:N,serverHooks:u}=l,c="/api/auth/login/route";function A(){return(0,d.patchFetch)({serverHooks:u,staticGenerationAsyncStorage:N})}},3275:(e,t,E)=>{E.d(t,{Gv:()=>n,HI:()=>c,V3:()=>o,WX:()=>l,c_:()=>T,oH:()=>u,rV:()=>N,v6:()=>_});var r=E(3981),a=E(7390),s=E.n(a);E(2845);let d=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",i="academiatask_session";function T(e){let t=r.ZP.genSaltSync(10);return r.ZP.hashSync(e,t)}function n(e,t){return r.ZP.compareSync(e,t)}function o(e){return s().sign(e,d,{expiresIn:"7d"})}function l(e){try{return s().verify(e,d)}catch{return null}}function _(e){try{let t=e.cookies.get(i)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return l(t)}catch{return null}}function N(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function u(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let c=i},3709:(e,t,E)=>{E.d(t,{ht:()=>R,IO:()=>c,pP:()=>A});var r=E(2048),a=E.n(r),s=E(5315),d=E.n(s);let i=require("sql.js");var T=E.n(i);let n=null,o=null,l=process.env.VERCEL||process.env.NEXT_PUBLIC_VERCEL_ENV?"/tmp/academiatask":d().join(process.cwd(),"data"),_=d().join(l,"academiatask.sqlite");function N(){if(n)try{a().existsSync(l)||a().mkdirSync(l,{recursive:!0});let e=n.export(),t=Buffer.from(e);a().writeFileSync(_,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function u(){if(n)return n;if(o||(o=await T()({locateFile:e=>d().join(process.cwd(),"node_modules","sql.js","dist",e)})),a().existsSync(_)){let e=a().readFileSync(_);n=new o.Database(e)}else a().existsSync(l)||a().mkdirSync(l,{recursive:!0}),n=new o.Database;n.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let r=e.exec("PRAGMA table_info(folders);")[0]?.values??[];r.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),r.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),N()}(n);let{ensureSeeded:e}=await E.e(254).then(E.bind(E,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(n),n}async function c(e,t=[]){let E=(await u()).prepare(e);t.length>0&&E.bind(t);let r=[];for(;E.step();)r.push(E.getAsObject());return E.free(),r}async function A(e,t=[]){let E=await c(e,t);return E.length>0?E[0]:null}async function R(e,t=[]){let E=await u();E.run(e,t);let r=E.getRowsModified();return N(),{rowsModified:r}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var E=e=>t(t.s=e),r=t.X(0,[787,783,833],()=>E(3345));module.exports=r})();