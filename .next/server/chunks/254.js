"use strict";exports.id=254,exports.ids=[254],exports.modules={2254:(e,t,r)=>{r.d(t,{ensureSeeded:()=>o});var a=r(3709),s=r(3275);async function o(){if(await (0,a.pP)("SELECT id FROM users LIMIT 1"))return;let e=(0,s.c_)("password123"),t=new Date,r=(e,r=17,a=0)=>{let s=new Date(t.getTime()+864e5*e);return s.setHours(r,a,0,0),s.toISOString()},o=e=>new Date(t.getTime()-36e5*e).toISOString();await (0,a.ht)(`
    INSERT INTO users (id, username, email, password_hash, avatar_color) VALUES 
    ('user_alex', 'alex_cs', 'alex@college.edu', ?, '#3E4B8E'),
    ('user_jordan', 'jordan_dev', 'jordan@college.edu', ?, '#10b981'),
    ('user_sarah', 'sarah_bio', 'sarah@college.edu', ?, '#ec4899')
  `,[e,e,e]),await (0,a.ht)(`
    INSERT INTO folders (id, name, color_hex, owner_id) VALUES 
    ('folder_general', 'Development & Sprints', '#3E4B8E', 'user_alex'),
    ('folder_cs101', 'CS 101: Data Structures', '#2563eb', 'user_alex'),
    ('folder_math240', 'MATH 240: Linear Algebra', '#d97706', 'user_alex'),
    ('folder_capstone', 'CS 490: Capstone Project', '#7c3aed', 'user_alex')
  `),await (0,a.ht)(`
    INSERT INTO folder_collaborators (folder_id, user_id) VALUES 
    ('folder_general', 'user_jordan'),
    ('folder_capstone', 'user_jordan')
  `),await (0,a.ht)(`
    INSERT INTO tasks (id, title, description, due_date, is_completed, folder_id, created_by) VALUES
    ('task_1', 'Implement Real-time Multiplayer Cursors', 'To improve our collaborative experience, we need to set up the WebSocket layer that will efficiently transmit cursor X/Y coordinates to all connected users. It is essential to debounce the broadcasting process to prevent overwhelming the server with too many requests.

Refer to the attached Figma document for comprehensive details on cursor behavior and tooltip naming conventions. The cursor movement interpolation should be smooth and seamless, aiming for a rendering rate of 60 frames per second on the canvas to guarantee a fluid user experience.', ?, 0, 'folder_general', 'user_alex'),
    ('task_2', 'Prepare investor presentation slides', 'Design and structure the 12-slide investor deck focusing on core unit economics, academic engagement retention rates, and peer co-working benchmarks.', ?, 0, 'folder_general', 'user_alex'),
    ('task_3', 'User interviews — round 3', 'Conduct structured 30-minute qualitative interviews with 6 student study leaders to assess in-task comment responsiveness.', ?, 0, 'folder_general', 'user_jordan'),
    ('task_4', 'Binary Search Tree Implementation', 'Implement insert, delete, and in-order traversal in C++ with unit tests.', ?, 0, 'folder_cs101', 'user_alex'),
    ('task_5', 'Academic Integrity Syllabus Quiz', 'Review syllabus and complete the 10-question compliance quiz.', ?, 1, 'folder_general', 'user_alex')
  `,[new Date(t.getTime()+432e5).toISOString(),r(4,17,0),r(7,14,0),r(10,23,59),o(48)]),await (0,a.ht)(`
    INSERT INTO comments (id, task_id, author_id, content, created_at) VALUES
    ('comm_1', 'task_1', 'user_jordan', 'Hey Alex, I uploaded the initial draft of our WebSocket sync protocol and Redis channel.', ?),
    ('comm_2', 'task_1', 'user_alex', 'Awesome work Jordan! I will review the cursor throttle debounce and React hook tonight.', ?),
    ('comm_3', 'task_1', 'user_jordan', 'Sounds great, let us sync during our morning standup.', ?)
  `,[o(4),o(2),o(1)]),console.log("AcademiaTask database successfully seeded with mockup tasks!")}}};