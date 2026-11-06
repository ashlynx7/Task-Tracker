"use strict";(()=>{var e={};e.id=327,e.ids=[327],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},8979:(e,t,E)=>{E.r(t),E.d(t,{originalPathname:()=>A,patchFetch:()=>L,requestAsyncStorage:()=>u,routeModule:()=>_,serverHooks:()=>R,staticGenerationAsyncStorage:()=>c});var r={};E.r(r),E.d(r,{DELETE:()=>N,PATCH:()=>l});var s=E(3278),d=E(5002),a=E(4877),i=E(1309),o=E(3275),n=E(3709),T=E(250);async function l(e,{params:t}){let E=(0,o.v6)(e);if(!E)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{folderId:r}=t,{name:s,color_hex:d,restore:a}=await e.json();if(!await (0,n.pP)(`SELECT f.id FROM folders f
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE f.id = ? AND (f.owner_id = ? OR fc.user_id = ?)`,[r,E.id,E.id]))return i.NextResponse.json({error:"Folder not found or permission denied."},{status:404});if(!0===a)return await (0,n.ht)("UPDATE folders SET deleted_at = NULL WHERE id = ?",[r]),await (0,n.ht)("UPDATE tasks SET deleted_at = NULL WHERE folder_id = ? AND deleted_at IS NOT NULL",[r]),i.NextResponse.json({message:"Folder restored successfully!"});s&&s.trim()&&await (0,n.ht)("UPDATE folders SET name = ? WHERE id = ?",[s.trim(),r]),d&&await (0,n.ht)("UPDATE folders SET color_hex = ? WHERE id = ?",[d,r]);let T=await (0,n.pP)("SELECT * FROM folders WHERE id = ?",[r]);return i.NextResponse.json({folder:T,message:"Folder updated successfully!"})}async function N(e,{params:t}){let E=(0,o.v6)(e);if(!E)return i.NextResponse.json({error:"Unauthorized"},{status:401});try{let{folderId:r}=t,s=await e.json().catch(()=>({})),d=!!(s.permanent||s.force||!0===s.permanent),a=await (0,n.pP)("SELECT owner_id, name FROM folders WHERE id = ?",[r]);if(!a)return i.NextResponse.json({error:"Folder not found."},{status:404});if(d){if(a.owner_id!==E.id)return i.NextResponse.json({error:"Only the folder owner can permanently delete it."},{status:403});return await (0,n.ht)("DELETE FROM folder_collaborators WHERE folder_id = ?",[r]),await (0,n.ht)("DELETE FROM tasks WHERE folder_id = ?",[r]),await (0,n.ht)("DELETE FROM folders WHERE id = ?",[r]),i.NextResponse.json({message:"Folder permanently deleted."})}if(a.owner_id===E.id){await (0,T.p)({folderId:r,taskId:null,actorId:E.id,type:"folder_deleted",message:`${E.username} deleted folder "${a.name}".`});let e=await (0,n.ht)("UPDATE folders SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",[new Date().toISOString(),r]);if(await (0,n.ht)("UPDATE tasks SET deleted_at = ? WHERE folder_id = ? AND deleted_at IS NULL",[new Date().toISOString(),r]),1!==e.rowsModified)return i.NextResponse.json({error:"Folder could not be deleted."},{status:409});return i.NextResponse.json({message:"Folder archived successfully. It can be restored from history for 7 days."})}if(!await (0,n.pP)("SELECT folder_id FROM folder_collaborators WHERE folder_id = ? AND user_id = ?",[r,E.id]))return i.NextResponse.json({error:"You do not have access to this folder."},{status:403});let o=await (0,n.ht)("DELETE FROM folder_collaborators WHERE folder_id = ? AND user_id = ?",[r,E.id]);if(1!==o.rowsModified)return i.NextResponse.json({error:"Could not leave the shared folder."},{status:409});return i.NextResponse.json({message:"You have left the shared folder."})}catch(e){return console.error("Error deleting folder:",e),i.NextResponse.json({error:"Failed to delete folder."},{status:500})}}let _=new s.AppRouteRouteModule({definition:{kind:d.x.APP_ROUTE,page:"/api/folders/[folderId]/route",pathname:"/api/folders/[folderId]",filename:"route",bundlePath:"app/api/folders/[folderId]/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\folders\\[folderId]\\route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:u,staticGenerationAsyncStorage:c,serverHooks:R}=_,A="/api/folders/[folderId]/route";function L(){return(0,a.patchFetch)({serverHooks:R,staticGenerationAsyncStorage:c})}},3275:(e,t,E)=>{E.d(t,{Gv:()=>n,HI:()=>c,V3:()=>T,WX:()=>l,c_:()=>o,oH:()=>u,rV:()=>_,v6:()=>N});var r=E(3981),s=E(7390),d=E.n(s);E(2845);let a=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",i="academiatask_session";function o(e){let t=r.ZP.genSaltSync(10);return r.ZP.hashSync(e,t)}function n(e,t){return r.ZP.compareSync(e,t)}function T(e){return d().sign(e,a,{expiresIn:"7d"})}function l(e){try{return d().verify(e,a)}catch{return null}}function N(e){try{let t=e.cookies.get(i)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return l(t)}catch{return null}}function _(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function u(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let c=i},3709:(e,t,E)=>{E.d(t,{ht:()=>A,IO:()=>c,pP:()=>R});var r=E(2048),s=E.n(r),d=E(5315),a=E.n(d);let i=require("sql.js");var o=E.n(i);let n=null,T=null,l=a().join(process.cwd(),"data"),N=a().join(l,"academiatask.sqlite");function _(){if(n)try{s().existsSync(l)||s().mkdirSync(l,{recursive:!0});let e=n.export(),t=Buffer.from(e);s().writeFileSync(N,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function u(){if(n)return n;if(T||(T=await o()({locateFile:e=>a().join(process.cwd(),"node_modules","sql.js","dist",e)})),s().existsSync(N)){let e=s().readFileSync(N);n=new T.Database(e)}else s().existsSync(l)||s().mkdirSync(l,{recursive:!0}),n=new T.Database;n.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let r=e.exec("PRAGMA table_info(folders);")[0]?.values??[];r.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),r.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),_()}(n);let{ensureSeeded:e}=await E.e(254).then(E.bind(E,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(n),n}async function c(e,t=[]){let E=(await u()).prepare(e);t.length>0&&E.bind(t);let r=[];for(;E.step();)r.push(E.getAsObject());return E.free(),r}async function R(e,t=[]){let E=await c(e,t);return E.length>0?E[0]:null}async function A(e,t=[]){let E=await u();E.run(e,t);let r=E.getRowsModified();return _(),{rowsModified:r}}},250:(e,t,E)=>{E.d(t,{p:()=>s});var r=E(3709);async function s({folderId:e,taskId:t,actorId:E,type:s,message:d}){if(e)for(let a of(await (0,r.IO)(`SELECT owner_id as user_id FROM folders WHERE id = ? AND owner_id != ?
     UNION
     SELECT user_id FROM folder_collaborators WHERE folder_id = ? AND user_id != ?`,[e,E,e,E]))){let e=`notif_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;await (0,r.ht)(`INSERT INTO notifications (id, recipient_id, actor_id, task_id, type, message)
       VALUES (?, ?, ?, ?, ?, ?)`,[e,a.user_id,E,t,s,d])}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var E=e=>t(t.s=e),r=t.X(0,[787,783,833],()=>E(8979));module.exports=r})();