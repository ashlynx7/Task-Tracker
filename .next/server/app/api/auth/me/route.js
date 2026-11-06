"use strict";(()=>{var e={};e.id=788,e.ids=[788],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},5972:(e,E,t)=>{t.r(E),t.d(E,{originalPathname:()=>A,patchFetch:()=>c,requestAsyncStorage:()=>l,routeModule:()=>N,serverHooks:()=>u,staticGenerationAsyncStorage:()=>_});var r={};t.r(r),t.d(r,{GET:()=>o});var s=t(3278),a=t(5002),T=t(4877),i=t(1309),d=t(3275),n=t(3709);async function o(e){let E=(0,d.v6)(e);if(!E)return i.NextResponse.json({user:null},{status:401});let t=await (0,n.pP)("SELECT id, username, email, avatar_color, created_at FROM users WHERE id = ?",[E.id]);return t?i.NextResponse.json({user:t}):i.NextResponse.json({user:null},{status:401})}let N=new s.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/auth/me/route",pathname:"/api/auth/me",filename:"route",bundlePath:"app/api/auth/me/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\auth\\me\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:l,staticGenerationAsyncStorage:_,serverHooks:u}=N,A="/api/auth/me/route";function c(){return(0,T.patchFetch)({serverHooks:u,staticGenerationAsyncStorage:_})}},3275:(e,E,t)=>{t.d(E,{Gv:()=>n,HI:()=>A,V3:()=>o,WX:()=>N,c_:()=>d,oH:()=>u,rV:()=>_,v6:()=>l});var r=t(3981),s=t(7390),a=t.n(s);t(2845);let T=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",i="academiatask_session";function d(e){let E=r.ZP.genSaltSync(10);return r.ZP.hashSync(e,E)}function n(e,E){return r.ZP.compareSync(e,E)}function o(e){return a().sign(e,T,{expiresIn:"7d"})}function N(e){try{return a().verify(e,T)}catch{return null}}function l(e){try{let E=e.cookies.get(i)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!E)return null;return N(E)}catch{return null}}function _(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let E=e.trim();return E.length<3||E.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(E)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function u(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let A=i},3709:(e,E,t)=>{t.d(E,{ht:()=>R,IO:()=>A,pP:()=>c});var r=t(2048),s=t.n(r),a=t(5315),T=t.n(a);let i=require("sql.js");var d=t.n(i);let n=null,o=null,N=T().join(process.cwd(),"data"),l=T().join(N,"academiatask.sqlite");function _(){if(n)try{s().existsSync(N)||s().mkdirSync(N,{recursive:!0});let e=n.export(),E=Buffer.from(e);s().writeFileSync(l,E)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function u(){if(n)return n;if(o||(o=await d()({locateFile:e=>T().join(process.cwd(),"node_modules","sql.js","dist",e)})),s().existsSync(l)){let e=s().readFileSync(l);n=new o.Database(e)}else s().existsSync(N)||s().mkdirSync(N,{recursive:!0}),n=new o.Database;n.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
  `);let E=e.exec("PRAGMA table_info(tasks);")[0]?.values??[],t=E.find(e=>Array.isArray(e)&&"folder_id"===e[1]);t&&1===t[3]&&(e.run("ALTER TABLE tasks RENAME TO tasks_old;"),e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),E.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),E.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let r=e.exec("PRAGMA table_info(folders);")[0]?.values??[];r.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),r.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),_()}(n);let{ensureSeeded:e}=await t.e(254).then(t.bind(t,2254));return await e(),function(e){let E=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[E]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[E]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[E]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[E])}(n),n}async function A(e,E=[]){let t=(await u()).prepare(e);E.length>0&&t.bind(E);let r=[];for(;t.step();)r.push(t.getAsObject());return t.free(),r}async function c(e,E=[]){let t=await A(e,E);return t.length>0?t[0]:null}async function R(e,E=[]){let t=await u();t.run(e,E);let r=t.getRowsModified();return _(),{rowsModified:r}}}};var E=require("../../../../webpack-runtime.js");E.C(e);var t=e=>E(E.s=e),r=E.X(0,[787,783,833],()=>t(5972));module.exports=r})();