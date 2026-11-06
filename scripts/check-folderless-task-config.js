const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'lib', 'db.ts');
const content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('folder_id TEXT')) {
  console.error('Missing folder_id field definition.');
  process.exit(1);
}

if (content.includes('folder_id TEXT NOT NULL')) {
  console.error('Tasks still require a folder, but folderless tasks should be allowed.');
  process.exit(1);
}

console.log('Folderless task configuration looks correct.');
