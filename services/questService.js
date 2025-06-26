import { db } from '../db.js';

export async function getAllQuests() {
    await db.read();
    return db.data.quests;
}

export async function getQuestById(id) {
    await db.read();
    return db.data.quests.find(q => q.id.toString() === id.toString());
}

export async function addQuest(quest) {
    await db.read();
    db.data.quests.push(quest);
    await db.write();
}

export async function markQuestComplete(id) {
    await db.read();
    const quest = db.data.quests.find(q => q.id.toString() === id.toString());
    if (quest) {
        quest.completed = true;
        await db.write();
    }
}
