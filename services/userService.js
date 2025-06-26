import { db } from '../db.js';

export async function getUserById(id) {
    await db.read();
    return db.data.users[id];
}

export async function getAllUsers() {
    await db.read();
    return db.data.users;
}

export async function addUser(user) {
    await db.read();
    db.data.users[user.id] = user;
    await db.write();
}

export async function updateUser(user) {
    await db.read();
    db.data.users[user.id] = user;
    await db.write();
}
