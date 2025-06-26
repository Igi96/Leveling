import express from 'express';
import { randomUUID } from 'crypto';
import { db, initDB } from './db.js';
import User from './models/user.js';
import Quest from './models/quest.js';
import { getXPForStatLevel } from './utils/leveling.js';

const app = express();

app.use(express.json());
app.get('/users', async (req, res) => {
  await db.read();
  res.json(db.data.users);
});
app.get('/quests', async (req, res) => {
  await db.read();
  res.json(db.data.quests);
});


// Beginning
app.use(express.static('public'));


// Create User 
app.post('/create-user', async (req, res) => {
  const { name } = req.body;
  const id = randomUUID();
  const user = new User(name);
  user.id = id;
  
  // Storing user- data
  await db.read();
  db.data.users[id] = user;
  await db.write();

  res.json(user);
});


// Gain XP
app.post('/gain-xp', async (req, res) => {
  const { id, amount } = req.body;
  await db.read();
  const user = db.data.users[id];
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Example: manually gain INT XP
  user.stats.INT.xp += amount;

  await db.write();
  res.json(user);
});


// Quest Creation
app.post('/quests', async (req, res) => {
  const { title, description, stat, xp, userId, statGain } = req.body;

  // Checking if it is not negative
  if (xp < 0 || statGain < 0) {
    return res.status(400).json({ error: 'XP and Stat Gain must be non-negative values.' });
}

  // Validate stat is one of the allowed stats
  const validStats = ['STR', 'DEX', 'INT', 'WIS', 'CHA', 'VIT', 'LUK'];
  if (!validStats.includes(stat)) {
    return res.status(400).json({ error: `Invalid stat: ${stat}` });
}
  
  const quest = new Quest(title, description, stat, xp, userId);

  // Storing the quest-data
  await db.read();
  db.data.quests.push(quest);
  await db.write();

  res.json(quest);
});

//Quest Completion
app.post('/quests/:id/complete', async (req, res) => {
  const questId = parseInt(req.params.id);
  await db.read();
  const quest = db.data.quests.find(q => q.id === questId);

  if (!quest) return res.status(404).json({ error: 'Quest not found' });
  if (quest.completed) return res.status(400).json({ message: 'Already completed' });

  const user = db.data.users[quest.userId];
  if (!user) return res.status(404).json({ error: 'User not found' });

  quest.completed = true;

  // Add stat XP
  const statObj = user.stats[quest.stat];
  statObj.xp += quest.statGain;

  // Check for stat level-up
  while (statObj.xp >= getXPForStatLevel(statObj.level)) {
    statObj.xp -= getXPForStatLevel(statObj.level);
    statObj.level++;
  }
  
  user.level = Object.values(user.stats).reduce((sum, s) => sum + s.level, 0)

  await db.write();

  res.json({ message: 'Quest completed!', newXP: user.xp, newLevel: user.level });
});

initDB().then(() => {
  app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
  });
});
