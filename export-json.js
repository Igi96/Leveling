import { db } from './db.js';
import fs from 'fs';

// Load the current database
await db.read();

const users = Object.values(db.data.users || {});
const quests = db.data.quests || [];

const stats = [];

// Flatten all stats from each user
users.forEach(user => {
    for (const [statName, data] of Object.entries(user.stats || {})) {
        stats.push({
            userId: user.id,
            stat: statName,
            xp: data.xp,
            level: data.level
        });
    }
});

// Save all data to clean export files
fs.writeFileSync('exported-users.json', JSON.stringify(users, null, 2));
fs.writeFileSync('exported-quests.json', JSON.stringify(quests, null, 2));
fs.writeFileSync('exported-stats.json', JSON.stringify(stats, null, 2));

console.log('✅ Export complete: users, quests, and stats saved.');
