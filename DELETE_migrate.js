import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join } from 'path';

// Define path to db.json
const file = join('./db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, { users: {}, quests: [] });

await db.read();

if (!db.data || !db.data.users) {
    console.error('No user data found!');
    process.exit(1);
}

console.log('Migrating users...');

for (const user of Object.values(db.data.users)) {
    delete user.xp;
}

for (const [id, user] of Object.entries(db.data.users)) {
    for (const statKey of Object.keys(user.stats)) {
        const val = user.stats[statKey];

        if (typeof val === 'number') {
            // Convert old numeric stat to object format
            user.stats[statKey] = {
                xp: 0,
                level: val
            };
            console.log(`✔ Updated ${user.name}'s ${statKey} stat`);
        }
    }
}

await db.write();
console.log('✅ Migration complete!');

