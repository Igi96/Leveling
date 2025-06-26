import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

// Load the database
const adapter = new JSONFile('db.json');
const db = new Low(adapter, { users: {}, quests: [] });

await db.read();

console.log('🔧 Starting data cleanup...\n');

// Track changes
let questsFixed = 0;
let questsRemoved = 0;
let usersUpdated = 0;

// 1. Fix quest data issues
console.log('📝 Fixing quest data issues:');

// Create a new quests array for cleaned data
const cleanedQuests = [];

for (const quest of db.data.quests) {
    let shouldKeep = true;
    let questModified = false;

    // Fix invalid stat "DED"
    if (quest.stat === 'DED') {
        console.log(`  ❌ Removing quest "${quest.title}" - invalid stat "DED"`);
        shouldKeep = false;
        questsRemoved++;
    }

    // Fix negative XP
    if (quest.xp < 0) {
        console.log(`  ❌ Removing quest "${quest.title}" - negative XP (${quest.xp})`);
        shouldKeep = false;
        questsRemoved++;
    }

    // Add missing statGain property
    if (shouldKeep && (quest.statGain === undefined || quest.statGain === null)) {
        quest.statGain = 1; // Default value
        questModified = true;
        console.log(`  ✅ Added missing statGain (1) to quest "${quest.title}"`);
    }

    // Ensure statGain is not negative
    if (shouldKeep && quest.statGain < 0) {
        quest.statGain = Math.abs(quest.statGain);
        questModified = true;
        console.log(`  ✅ Fixed negative statGain for quest "${quest.title}"`);
    }

    // Validate stat is in allowed list
    const validStats = ['STR', 'DEX', 'INT', 'WIS', 'CHA', 'VIT', 'LUK'];
    if (shouldKeep && !validStats.includes(quest.stat)) {
        console.log(`  ❌ Removing quest "${quest.title}" - invalid stat "${quest.stat}"`);
        shouldKeep = false;
        questsRemoved++;
    }

    if (shouldKeep) {
        cleanedQuests.push(quest);
        if (questModified) questsFixed++;
    }
}

// 2. Update user level calculations
console.log('\n👤 Recalculating user levels:');

for (const [userId, user] of Object.entries(db.data.users)) {
    const oldLevel = user.level;
    
    // Recalculate level as sum of all stat levels
    const newLevel = Object.values(user.stats).reduce((sum, stat) => sum + stat.level, 0);
    
    if (oldLevel !== newLevel) {
        user.level = newLevel;
        usersUpdated++;
        console.log(`  ✅ Updated ${user.name}'s level: ${oldLevel} → ${newLevel}`);
    }

    // Ensure all stats have both xp and level properties
    let userModified = false;
    for (const [statName, statData] of Object.entries(user.stats)) {
        if (typeof statData === 'number') {
            // Convert old format to new format
            user.stats[statName] = {
                xp: 0,
                level: statData
            };
            userModified = true;
        } else if (!statData.hasOwnProperty('xp') || !statData.hasOwnProperty('level')) {
            // Ensure both properties exist
            user.stats[statName] = {
                xp: statData.xp || 0,
                level: statData.level || 1
            };
            userModified = true;
        }
    }

    if (userModified) {
        console.log(`  ✅ Fixed stat structure for ${user.name}`);
    }
}

// 3. Update the database with cleaned data
db.data.quests = cleanedQuests;

// 4. Create backup before saving
import fs from 'fs';
const backupName = `db.backup.${Date.now()}.json`;
fs.writeFileSync(backupName, JSON.stringify(db.data, null, 2));
console.log(`\n💾 Created backup: ${backupName}`);

// 5. Save cleaned data
await db.write();

// 6. Summary
console.log('\n📊 Cleanup Summary:');
console.log(`  • Quests fixed: ${questsFixed}`);
console.log(`  • Quests removed: ${questsRemoved}`);
console.log(`  • Users updated: ${usersUpdated}`);
console.log(`  • Total quests remaining: ${cleanedQuests.length}`);
console.log('\n✅ Data cleanup complete!');

// 7. Display current data state
console.log('\n📋 Current Data State:');
console.log('\nUsers:');
for (const [id, user] of Object.entries(db.data.users)) {
    console.log(`  ${user.name} (Level ${user.level})`);
    for (const [stat, data] of Object.entries(user.stats)) {
        console.log(`    ${stat}: Level ${data.level} (${data.xp} XP)`);
    }
}

console.log('\nQuests by completion status:');
const completedQuests = cleanedQuests.filter(q => q.completed).length;
const pendingQuests = cleanedQuests.filter(q => !q.completed).length;
console.log(`  Completed: ${completedQuests}`);
console.log(`  Pending: ${pendingQuests}`);
console.log(`  Total: ${cleanedQuests.length}`);
