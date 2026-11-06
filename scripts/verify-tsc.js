const { execSync } = require('child_process');
const cwd = 'C:/Users/linda/Downloads/Website Draft/TaskTracker - Copy - Copy';
const cmd = '"' + cwd + '/node_modules/.bin/tsc.cmd" --noEmit';
execSync(cmd, { cwd, stdio: 'inherit', shell: 'cmd.exe' });
