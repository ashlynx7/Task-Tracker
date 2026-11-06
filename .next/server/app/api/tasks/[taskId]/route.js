"use strict";(()=>{var e={};e.id=483,e.ids=[483],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},8893:e=>{e.exports=require("buffer")},4770:e=>{e.exports=require("crypto")},2048:e=>{e.exports=require("fs")},5315:e=>{e.exports=require("path")},6162:e=>{e.exports=require("stream")},1764:e=>{e.exports=require("util")},4146:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>L,patchFetch:()=>A,requestAsyncStorage:()=>u,routeModule:()=>c,serverHooks:()=>f,staticGenerationAsyncStorage:()=>R});var E={};s.r(E),s.d(E,{DELETE:()=>N,GET:()=>l,PATCH:()=>_});var d=s(3278),r=s(5002),a=s(4877),i=s(1309),o=s(3275),n=s(3709),T=s(250);async function l(e,{params:t}){let s=(0,o.v6)(e);if(!s)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:E}=t,d=await (0,n.pP)(`SELECT t.*, f.name as folder_name, f.color_hex as folder_color,
            u.username as creator_username
     FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ?
       OR f.id IN (SELECT folder_id FROM folder_collaborators WHERE user_id = ?)
     )`,[E,s.id,s.id,s.id]);return d?i.NextResponse.json({task:d}):i.NextResponse.json({error:"Task not found or access denied."},{status:404})}async function _(e,{params:t}){let s=(0,o.v6)(e);if(!s)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:E}=t,d=await e.json(),r=""===d.folder_id||null===d.folder_id?null:d.folder_id??null;if(!0===d.restore)return await (0,n.pP)("SELECT id, deleted_at FROM tasks WHERE id = ? AND created_by = ?",[E,s.id])?(await (0,n.ht)("UPDATE tasks SET deleted_at = NULL WHERE id = ?",[E]),i.NextResponse.json({message:"Task restored successfully!"})):i.NextResponse.json({error:"Task not found or permission denied."},{status:404});let a=await (0,n.pP)(`SELECT t.id, t.title, t.folder_id, t.is_completed, t.completed_at, t.time_logged_seconds,
            f.owner_id
     FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ? OR fc.user_id = ?
     )`,[E,s.id,s.id,s.id]);if(!a)return i.NextResponse.json({error:"Task not found or permission denied."},{status:404});let l=""===a.folder_id||null===a.folder_id?null:a.folder_id;if(void 0!==d.folder_id&&r!==l&&r&&!await (0,n.pP)(`SELECT f.id
         FROM folders f
         WHERE f.id = ?
           AND (f.owner_id = ? OR EXISTS (
             SELECT 1 FROM folder_collaborators fc WHERE fc.folder_id = f.id AND fc.user_id = ?
           ))`,[r,s.id,s.id]))return i.NextResponse.json({error:"Destination folder not found or permission denied."},{status:403});if(void 0!==d.title&&d.title.trim()&&await (0,n.ht)("UPDATE tasks SET title = ? WHERE id = ?",[d.title.trim(),E]),void 0!==d.description&&await (0,n.ht)("UPDATE tasks SET description = ? WHERE id = ?",[d.description.trim(),E]),void 0!==d.due_date){let e=new Date(d.due_date).toISOString();await (0,n.ht)("UPDATE tasks SET due_date = ? WHERE id = ?",[e,E])}if(void 0!==d.time_logged_seconds){let e=Number.isFinite(Number(d.time_logged_seconds))?Math.max(0,Number(d.time_logged_seconds)):0;await (0,n.ht)("UPDATE tasks SET time_logged_seconds = ? WHERE id = ?",[e,E])}if(void 0!==d.is_completed){let e=d.is_completed?1:0;if(e!==a.is_completed){let t=1===e?new Date().toISOString():null;await (0,n.ht)("UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ?",[e,t,E]),a.folder_id&&await (0,T.p)({folderId:a.folder_id,taskId:E,actorId:s.id,type:1===e?"task_completed":"task_reopened",message:`${s.username} ${1===e?"completed":"reopened"} "${a.title}".`})}}void 0!==d.folder_id&&r!==l&&await (0,n.ht)("UPDATE tasks SET folder_id = ? WHERE id = ?",[null===r?"":r,E]);let _=await (0,n.pP)(`SELECT t.*, f.name as folder_name, f.color_hex as folder_color,
            u.username as creator_username,
            (SELECT COUNT(*) FROM comments c WHERE c.task_id = t.id) as comment_count
     FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = ?`,[E]);return i.NextResponse.json({task:_,message:"Task updated successfully!"})}async function N(e,{params:t}){let s=(0,o.v6)(e);if(!s)return i.NextResponse.json({error:"Unauthorized"},{status:401});let{taskId:E}=t,d=await e.json().catch(()=>({})),r=!!(d.permanent||d.force||!0===d.permanent),a=await (0,n.pP)(`SELECT t.id, t.title, t.folder_id, t.created_by FROM tasks t
     LEFT JOIN folders f ON t.folder_id = f.id
     LEFT JOIN folder_collaborators fc ON f.id = fc.folder_id
     WHERE t.id = ? AND (
       (t.folder_id IS NULL OR t.folder_id = '') AND t.created_by = ?
       OR f.owner_id = ? OR fc.user_id = ?
     )`,[E,s.id,s.id,s.id]);return a?r?await (0,n.pP)("SELECT id, title FROM tasks WHERE id = ?",[E])?(await (0,n.ht)("DELETE FROM comments WHERE task_id = ?",[E]),await (0,n.ht)("DELETE FROM task_attachments WHERE task_id = ?",[E]),await (0,n.ht)("DELETE FROM tasks WHERE id = ?",[E]),i.NextResponse.json({message:"Task permanently deleted."})):i.NextResponse.json({error:"Task not found."},{status:404}):(a.folder_id&&await (0,T.p)({folderId:a.folder_id,taskId:null,actorId:s.id,type:"task_deleted",message:`${s.username} deleted task "${a.title}".`}),1!==(await (0,n.ht)("UPDATE tasks SET deleted_at = ? WHERE id = ? AND deleted_at IS NULL",[new Date().toISOString(),E])).rowsModified)?i.NextResponse.json({error:"Task already deleted or not found."},{status:409}):i.NextResponse.json({message:"Task archived successfully. It can be restored from history for 7 days."}):i.NextResponse.json({error:"Task not found or permission denied."},{status:404})}let c=new d.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/tasks/[taskId]/route",pathname:"/api/tasks/[taskId]",filename:"route",bundlePath:"app/api/tasks/[taskId]/route"},resolvedPagePath:"C:\\Users\\linda\\Downloads\\Website Draft\\TaskTracker - Copy - Copy\\src\\app\\api\\tasks\\[taskId]\\route.ts",nextConfigOutput:"",userland:E}),{requestAsyncStorage:u,staticGenerationAsyncStorage:R,serverHooks:f}=c,L="/api/tasks/[taskId]/route";function A(){return(0,a.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:R})}},3275:(e,t,s)=>{s.d(t,{Gv:()=>n,HI:()=>u,V3:()=>T,WX:()=>l,c_:()=>o,oH:()=>c,rV:()=>N,v6:()=>_});var E=s(3981),d=s(7390),r=s.n(d);s(2845);let a=process.env.JWT_SECRET||"academiatask_super_secret_jwt_key_2026",i="academiatask_session";function o(e){let t=E.ZP.genSaltSync(10);return E.ZP.hashSync(e,t)}function n(e,t){return E.ZP.compareSync(e,t)}function T(e){return r().sign(e,a,{expiresIn:"7d"})}function l(e){try{return r().verify(e,a)}catch{return null}}function _(e){try{let t=e.cookies.get(i)?.value||e.headers.get("authorization")?.replace("Bearer ","");if(!t)return null;return l(t)}catch{return null}}function N(e){if(!e||0===e.trim().length)return{valid:!1,message:"Username is required."};let t=e.trim();return t.length<3||t.length>20?{valid:!1,message:"Username must be between 3 and 20 characters."}:/^[a-zA-Z0-9_]+$/.test(t)?{valid:!0}:{valid:!1,message:"Username can only contain letters, numbers, and underscores."}}function c(e){return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)}let u=i},3709:(e,t,s)=>{s.d(t,{ht:()=>f,IO:()=>u,pP:()=>R});var E=s(2048),d=s.n(E),r=s(5315),a=s.n(r);let i=require("sql.js");var o=s.n(i);let n=null,T=null,l=process.env.VERCEL||process.env.NEXT_PUBLIC_VERCEL_ENV?"/tmp/academiatask":a().join(process.cwd(),"data"),_=a().join(l,"academiatask.sqlite");function N(){if(n)try{d().existsSync(l)||d().mkdirSync(l,{recursive:!0});let e=n.export(),t=Buffer.from(e);d().writeFileSync(_,t)}catch(e){console.error("Failed to save SQLite database to disk:",e)}}async function c(){if(n)return n;if(T||(T=await o()({locateFile:e=>a().join(process.cwd(),"node_modules","sql.js","dist",e)})),d().existsSync(_)){let e=d().readFileSync(_);n=new T.Database(e)}else d().existsSync(l)||d().mkdirSync(l,{recursive:!0}),n=new T.Database;n.run("PRAGMA foreign_keys = ON;"),function(e){e.run(`
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
  `);let t=e.exec("PRAGMA table_info(tasks);")[0]?.values??[],s=t.find(e=>Array.isArray(e)&&"folder_id"===e[1]);s&&1===s[3]&&(e.run("ALTER TABLE tasks RENAME TO tasks_old;"),e.run(`
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
    `),e.run("DROP TABLE tasks_old;")),t.some(e=>Array.isArray(e)&&"completed_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN completed_at DATETIME;"),t.some(e=>Array.isArray(e)&&"time_logged_seconds"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN time_logged_seconds INTEGER DEFAULT 0;");let E=e.exec("PRAGMA table_info(folders);")[0]?.values??[];E.some(e=>Array.isArray(e)&&"parent_id"===e[1])||e.run("ALTER TABLE folders ADD COLUMN parent_id TEXT REFERENCES folders(id) ON DELETE SET NULL;"),E.some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE folders ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);"),e.run("CREATE INDEX IF NOT EXISTS idx_folders_deleted ON folders(deleted_at);"),(e.exec("PRAGMA table_info(tasks);")[0]?.values??[]).some(e=>Array.isArray(e)&&"deleted_at"===e[1])||e.run("ALTER TABLE tasks ADD COLUMN deleted_at DATETIME;"),e.run("CREATE INDEX IF NOT EXISTS idx_tasks_deleted ON tasks(deleted_at);"),N()}(n);let{ensureSeeded:e}=await s.e(254).then(s.bind(s,2254));return await e(),function(e){let t=new Date(Date.now()-6048e5).toISOString();e.run("DELETE FROM task_attachments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM comments WHERE task_id IN (SELECT id FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?)",[t]),e.run("DELETE FROM tasks WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t]),e.run("DELETE FROM folders WHERE deleted_at IS NOT NULL AND deleted_at <= ?",[t])}(n),n}async function u(e,t=[]){let s=(await c()).prepare(e);t.length>0&&s.bind(t);let E=[];for(;s.step();)E.push(s.getAsObject());return s.free(),E}async function R(e,t=[]){let s=await u(e,t);return s.length>0?s[0]:null}async function f(e,t=[]){let s=await c();s.run(e,t);let E=s.getRowsModified();return N(),{rowsModified:E}}},250:(e,t,s)=>{s.d(t,{p:()=>d});var E=s(3709);async function d({folderId:e,taskId:t,actorId:s,type:d,message:r}){if(e)for(let a of(await (0,E.IO)(`SELECT owner_id as user_id FROM folders WHERE id = ? AND owner_id != ?
     UNION
     SELECT user_id FROM folder_collaborators WHERE folder_id = ? AND user_id != ?`,[e,s,e,s]))){let e=`notif_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;await (0,E.ht)(`INSERT INTO notifications (id, recipient_id, actor_id, task_id, type, message)
       VALUES (?, ?, ?, ?, ?, ?)`,[e,a.user_id,s,t,d,r])}}}};var t=require("../../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),E=t.X(0,[787,783,833],()=>s(4146));module.exports=E})();