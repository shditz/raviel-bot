const { spawn } = require('child_process');
const path = require('path');

function start() {
    console.log('🚀 Starting Raviel Bot...');
    const child = spawn('node', ['index.js'], {
        cwd: __dirname,
        stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    });

    child.on('exit', (code) => {
        if (code === 0) {
            console.log('🔄 Bot requested restart. Restarting now...');
            start();
        } else if (code === 1) {
            console.log('⏹️ Bot requested shutdown.');
            process.exit(0);
        } else if (code === 130) {
            console.log('⏹️ Bot stopped manually (SIGINT).');
            process.exit(0);
        } else {
            console.error(`⚠️ Bot crashed with code ${code}. Restarting in 5 seconds...`);
            setTimeout(start, 5000);
        }
    });

    child.on('error', (err) => {
        console.error('❌ Failed to start bot:', err);
    });
}

start();
