import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

// Set the adapter and default data
const adapter = new JSONFile('db.json')
const defaultData = { users: {}, quests: [] }
const db = new Low(adapter, defaultData)

async function initDB() {
  await db.read()
  await db.write() // Ensures db.json is written if not present
}

export { db, initDB }

