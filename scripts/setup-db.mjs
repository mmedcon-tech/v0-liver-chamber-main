import { execSync } from 'child_process';

console.log('Generating Prisma client...');
execSync('npx prisma generate', { stdio: 'inherit', cwd: process.cwd() });

console.log('Pushing schema to SQLite...');
execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', cwd: process.cwd() });

console.log('Database setup complete.');
