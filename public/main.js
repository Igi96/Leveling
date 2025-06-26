// main.js
let currentUserId = null;

// Utility Functions
function getTitleByLevel(level) {
  if (level >= 30) return 'Master';
  if (level >= 20) return 'Expert';
  if (level >= 10) return 'Adept';
  if (level >= 5) return 'Apprentice';
  return 'Novice';
}

function getStatIcon(stat) {
  const icons = {
    'STR': '⚔️',
    'DEX': '🏃',
    'INT': '🧠',
    'WIS': '📚',
    'CHA': '💬',
    'VIT': '❤️',
    'LUK': '🍀'
  };
  return icons[stat] || '📊';
}

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const targetTab = e.target.dataset.tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    
    // Update active panel
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    document.getElementById(`${targetTab}-panel`).classList.add('active');
  });
});

// Modal Controls
const questModal = document.getElementById('questModal');
const showQuestFormBtn = document.getElementById('showQuestForm');
const closeQuestModalBtn = document.getElementById('closeQuestModal');

showQuestFormBtn.addEventListener('click', () => {
  questModal.classList.add('active');
  document.getElementById('questUser').value = currentUserId;
});

closeQuestModalBtn.addEventListener('click', () => {
  questModal.classList.remove('active');
  document.getElementById('createQuestForm').reset();
  document.getElementById('questError').textContent = '';
});

// Admin Panel Controls
const adminPanel = document.getElementById('adminPanel');
const adminToggleBtn = document.getElementById('adminToggle');
const closeAdminBtn = document.getElementById('closeAdmin');

adminToggleBtn.addEventListener('click', () => {
  adminPanel.classList.add('active');
});

closeAdminBtn.addEventListener('click', () => {
  adminPanel.classList.remove('active');
});

// Main Load Function
async function loadUsersAndQuests() {
  const [resUsers, resQuests] = await Promise.all([
    fetch('/users'),
    fetch('/quests')
  ]);

  const users = await resUsers.json();
  const quests = await resQuests.json();

  const userSelector = document.getElementById('userSelector');
  
  // Populate user selector
  userSelector.innerHTML = '';
  Object.entries(users).forEach(([id, user]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = user.name;
    userSelector.appendChild(option);
  });

  // Set current user
  if (!currentUserId || !users[currentUserId]) {
    currentUserId = Object.keys(users)[0];
  }
  userSelector.value = currentUserId;

  const user = users[currentUserId];
  if (!user) return;

  // Update header info
  document.getElementById('playerLevel').textContent = user.level;
  document.getElementById('playerTitle').textContent = getTitleByLevel(user.level);

  // Update Stats Tab
  updateStatsPanel(user);

  // Update Quests
  const userQuests = quests.filter(q => String(q.userId) === String(currentUserId));
  updateQuestsPanel(userQuests);

  // Update Admin Quest List
  updateAdminQuestList(quests, users);
}

function updateStatsPanel(user) {
  // Calculate HP and MP
  const maxHp = 1000 + (user.stats.VIT?.level || 1) * 100;
  const maxMp = 200 + (user.stats.INT?.level || 1) * 50;
  
  // Update HP/MP bars
  document.getElementById('hpBar').style.width = '100%';
  document.getElementById('mpBar').style.width = '100%';
  document.getElementById('hpText').textContent = `${maxHp}/${maxHp}`;
  document.getElementById('mpText').textContent = `${maxMp}/${maxMp}`;
  
  // Update stats grid
  const statsGrid = document.getElementById('statsGrid');
  statsGrid.innerHTML = '';
  
  Object.entries(user.stats).forEach(([stat, data]) => {
    const statCard = document.createElement('div');
    statCard.className = 'stat-card';
    statCard.innerHTML = `
      <div class="stat-icon">${getStatIcon(stat)}</div>
      <div class="stat-name">${stat}</div>
      <div class="stat-level">${data.level}</div>
      <div class="stat-xp">${data.xp} XP</div>
    `;
    statsGrid.appendChild(statCard);
  });
}

function updateQuestsPanel(quests) {
  const questList = document.getElementById('playerQuests');
  questList.innerHTML = '';
  
  if (quests.length === 0) {
    questList.innerHTML = '<li style="text-align: center; padding: 30px; color: rgba(215, 249, 255, 0.5);">No active quests</li>';
    return;
  }
  
  quests.forEach(quest => {
    if (quest.completed) return;
    
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="quest-title">${quest.title}</div>
      <div class="quest-info">${getStatIcon(quest.stat)} ${quest.stat} +${quest.statGain} | ${quest.xp} XP</div>
      <div class="quest-desc">${quest.description}</div>
    `;
    
    const completeBtn = document.createElement('button');
    completeBtn.className = 'complete-btn';
    completeBtn.textContent = 'COMPLETE';
    completeBtn.addEventListener('click', async () => {
      completeBtn.disabled = true;
      completeBtn.textContent = 'COMPLETING...';
      
      const res = await fetch(`/quests/${quest.id}/complete`, { method: 'POST' });
      if (res.ok) {
        li.style.animation = 'questComplete 0.5s ease';
        setTimeout(() => loadUsersAndQuests(), 500);
      } else {
        completeBtn.disabled = false;
        completeBtn.textContent = 'COMPLETE';
      }
    });
    
    li.appendChild(completeBtn);
    questList.appendChild(li);
  });
}

function updateAdminQuestList(quests, users) {
  const adminQuestList = document.getElementById('questList');
  adminQuestList.innerHTML = '';
  
  quests.forEach(quest => {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${quest.title}</strong><br>
      ${quest.stat} +${quest.statGain} | ${quest.xp} XP | User: ${users[quest.userId]?.name || 'Unknown'}
      ${quest.completed ? ' <span style="color: #00ff88;">[Completed]</span>' : ''}
    `;
    adminQuestList.appendChild(li);
  });
}

// Form Handlers
document.getElementById('createUserForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('userName').value;
  const button = e.target.querySelector('button');
  
  button.disabled = true;
  button.textContent = 'CREATING...';
  
  await fetch('/create-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  
  document.getElementById('userName').value = '';
  button.disabled = false;
  button.textContent = 'CREATE';
  loadUsersAndQuests();
});

document.getElementById('createQuestForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorBox = document.getElementById('questError');
  const button = e.target.querySelector('button[type="submit"]');
  errorBox.textContent = '';

  const statGain = parseFloat(document.getElementById('questStatGain').value);
  const xp = parseInt(document.getElementById('questXP').value);

  if (xp < 0 || statGain < 0) {
    errorBox.textContent = 'XP and Stat Gain must be non-negative.';
    return;
  }

  button.disabled = true;
  button.textContent = 'CREATING...';

  const quest = {
    title: document.getElementById('questTitle').value,
    description: document.getElementById('questDesc').value,
    stat: document.getElementById('questStat').value,
    xp,
    statGain,
    userId: document.getElementById('questUser').value
  };

  const res = await fetch('/quests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quest)
  });

  if (!res.ok) {
    const data = await res.json();
    errorBox.textContent = data.error || 'Something went wrong.';
    button.disabled = false;
    button.textContent = 'CREATE QUEST';
    return;
  }

  questModal.classList.remove('active');
  e.target.reset();
  button.disabled = false;
  button.textContent = 'CREATE QUEST';
  loadUsersAndQuests();
});

document.getElementById('userSelector').addEventListener('change', (e) => {
  currentUserId = e.target.value;
  loadUsersAndQuests();
});

// Close modals on outside click
questModal.addEventListener('click', (e) => {
  if (e.target === questModal) {
    questModal.classList.remove('active');
    document.getElementById('createQuestForm').reset();
    document.getElementById('questError').textContent = '';
  }
});

// Initial load
loadUsersAndQuests();