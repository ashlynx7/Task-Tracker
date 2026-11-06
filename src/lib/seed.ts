import { execute, queryOne } from './db';
import { hashPassword } from './auth';

export async function ensureSeeded() {
  const existingUser = await queryOne('SELECT id FROM users LIMIT 1');
  if (existingUser) {
    return; // Already initialized
  }

  const defaultPasswordHash = hashPassword('password123');
  const now = new Date();

  // Helper date generators
  const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString();
  const daysFromNow = (d: number, hour = 17, min = 0) => {
    const target = new Date(now.getTime() + d * 86400 * 1000);
    target.setHours(hour, min, 0, 0);
    return target.toISOString();
  };
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();

  // 1. Create Alex and Jordan
  await execute(`
    INSERT INTO users (id, username, email, password_hash, avatar_color) VALUES 
    ('user_alex', 'alex_cs', 'alex@college.edu', ?, '#3E4B8E'),
    ('user_jordan', 'jordan_dev', 'jordan@college.edu', ?, '#10b981'),
    ('user_sarah', 'sarah_bio', 'sarah@college.edu', ?, '#ec4899')
  `, [defaultPasswordHash, defaultPasswordHash, defaultPasswordHash]);

  // 2. Create Folders for Alex
  await execute(`
    INSERT INTO folders (id, name, color_hex, owner_id) VALUES 
    ('folder_general', 'Development & Sprints', '#3E4B8E', 'user_alex'),
    ('folder_cs101', 'CS 101: Data Structures', '#2563eb', 'user_alex'),
    ('folder_math240', 'MATH 240: Linear Algebra', '#d97706', 'user_alex'),
    ('folder_capstone', 'CS 490: Capstone Project', '#7c3aed', 'user_alex')
  `);

  // 3. Add Jordan as Collaborator on Capstone Project folder
  await execute(`
    INSERT INTO folder_collaborators (folder_id, user_id) VALUES 
    ('folder_general', 'user_jordan'),
    ('folder_capstone', 'user_jordan')
  `);

  // 4. Create Initial Tasks matching exact items from the reference mockup
  await execute(`
    INSERT INTO tasks (id, title, description, due_date, is_completed, folder_id, created_by) VALUES
    ('task_1', 'Implement Real-time Multiplayer Cursors', 'To improve our collaborative experience, we need to set up the WebSocket layer that will efficiently transmit cursor X/Y coordinates to all connected users. It is essential to debounce the broadcasting process to prevent overwhelming the server with too many requests.\n\nRefer to the attached Figma document for comprehensive details on cursor behavior and tooltip naming conventions. The cursor movement interpolation should be smooth and seamless, aiming for a rendering rate of 60 frames per second on the canvas to guarantee a fluid user experience.', ?, 0, 'folder_general', 'user_alex'),
    ('task_2', 'Prepare investor presentation slides', 'Design and structure the 12-slide investor deck focusing on core unit economics, academic engagement retention rates, and peer co-working benchmarks.', ?, 0, 'folder_general', 'user_alex'),
    ('task_3', 'User interviews — round 3', 'Conduct structured 30-minute qualitative interviews with 6 student study leaders to assess in-task comment responsiveness.', ?, 0, 'folder_general', 'user_jordan'),
    ('task_4', 'Binary Search Tree Implementation', 'Implement insert, delete, and in-order traversal in C++ with unit tests.', ?, 0, 'folder_cs101', 'user_alex'),
    ('task_5', 'Academic Integrity Syllabus Quiz', 'Review syllabus and complete the 10-question compliance quiz.', ?, 1, 'folder_general', 'user_alex')
  `, [
    hoursFromNow(12),      // Due today/tomorrow
    daysFromNow(4, 17, 0), // June 14
    daysFromNow(7, 14, 0), // June 7
    daysFromNow(10, 23, 59),
    hoursAgo(48)           // Completed task
  ]);

  // 5. Create Comments on Task 1
  await execute(`
    INSERT INTO comments (id, task_id, author_id, content, created_at) VALUES
    ('comm_1', 'task_1', 'user_jordan', 'Hey Alex, I uploaded the initial draft of our WebSocket sync protocol and Redis channel.', ?),
    ('comm_2', 'task_1', 'user_alex', 'Awesome work Jordan! I will review the cursor throttle debounce and React hook tonight.', ?),
    ('comm_3', 'task_1', 'user_jordan', 'Sounds great, let us sync during our morning standup.', ?)
  `, [hoursAgo(4), hoursAgo(2), hoursAgo(1)]);

  console.log('AcademiaTask database successfully seeded with mockup tasks!');
}
