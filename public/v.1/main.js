// main.js
const questList = document.getElementById('questList');
let currentUserId = null;

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

async function loadUsersAndQuests() {
  const [resUsers, resQuests] = await Promise.all([
    fetch('/users'),
    fetch('/quests')
  ]);

  const users = await resUsers.json();
  const quests = await resQuests.json();

  const userSelector = document.getElementById('userSelector');
  const playerProfile = document.getElementById('playerProfile');
  const playerQuests = document.getElementById('playerQuests');
  const questUserSelector = document.getElementById('questUser');
  playerQuests.innerHTML = '';

  // Populate selectors
  userSelector.innerHTML = '';
  questUserSelector.innerHTML = '';
  
  Object.entries(users).forEach(([id, user]) => {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = user.name;
    userSelector.appendChild(option);
    
    const option2 = option.cloneNode(true);
    questUserSelector.appendChild(option2);
  });

  // Set default if none selected
  if (!currentUserId || !users[currentUserId]) {
    currentUserId = Object.keys(users)[0];
  }
  userSelector.value = currentUserId;

  const user = users[currentUserId];
  const title = getTitleByLevel(user.level);

  // Calculate HP and MP based on stats
  const hp = 1000 + (user.stats.VIT?.level || 1) * 100;
  const mp = 200 + (user.stats.INT?.level || 1) * 50;

  // Format player profile with status bars
  playerProfile.innerHTML = `
    <div class="player-header">
      <h3>${user.name}</h3>
      <div class="level-info">
        <div class="level-number">${user.level}</div>
        <div class="level-label">LEVEL</div>
      </div>
      <div class="title-info">
        <span class="title-label">TITLE:</span>
        <span class="title-value">${title}</span>
      </div>
    </div>
    
    <div class="bars-section">
      <div class="bar-container">
        <div class="bar-wrapper">
          <div class="bar-icon">❤️</div>
          <div class="bar-track hp-bar">
            <div class="bar-fill hp-bar-fill" style="width: 100%"></div>
          </div>
          <div class="bar-value hp-value">${hp}/${hp}</div>
        </div>
      </div>
      <div class="bar-container">
        <div class="bar-wrapper">
          <div class="bar-icon">💧</div>
          <div class="bar-track mp-bar">
            <div class="bar-fill mp-bar-fill" style="width: 100%"></div>
          </div>
          <div class="bar-value mp-value">${mp}/${mp}</div>
        </div>
      </div>
    </div>
    
    <div class="stats-grid">
      ${Object.entries(user.stats)
        .map(([stat, data]) => `
          <div class="stat-item">
            <div class="stat-icon">${getStatIcon(stat)}</div>
            <div class="stat-info">
              <span class="stat-label">${stat}:</span>
              <span class="stat-value">${data.level}</span>
            </div>
            <div class="stat-xp">${data.xp} XP</div>
          </div>
        `).join('')}
    </div>
  `;

  // Filter and display quests
  const userQuests = quests.filter(q => String(q.userId) === String(currentUserId));

  playerQuests.innerHTML = '';
  if (userQuests.length === 0) {
    playerQuests.innerHTML = '<li class="empty-state"><em>No quests available.</em></li>';
  } else {
    userQuests.forEach(quest => {
      const li = document.createElement('li');
      li.className = quest.completed ? 'completed' : '';
      li.innerHTML = `
        <div class="quest-content">
          <strong>${quest.title}</strong>
          <div class="quest-details">
            ${getStatIcon(quest.stat)} ${quest.stat} +${quest.statGain} | ${quest.xp} XP
          </div>
          <div class="quest-description">${quest.description}</div>
        </div>
        ${quest.completed ? '<span class="completed-badge">✅ COMPLETED</span>' : ''}
      `;

      if (!quest.completed) {
        const btn = document.createElement('button');
        btn.className = 'complete-button';
        btn.innerHTML = '✅ COMPLETE';
        btn.type = 'button';
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          btn.innerHTML = 'Processing...';
          const res = await fetch(`/quests/${quest.id}/complete`, { method: 'POST' });
          if (res.ok) {
            // Add completion animation
            li.style.animation = 'questComplete 0.5s ease';
            setTimeout(() => loadUsersAndQuests(), 500);
          } else {
            btn.disabled = false;
            btn.innerHTML = '✅ COMPLETE';
          }
        });
        li.appendChild(btn);
      }

      playerQuests.appendChild(li);
    });
  }

  // Update all quests list
  questList.innerHTML = '';
  quests.forEach(quest => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="quest-content">
        <strong>${quest.title}</strong>
        <div class="quest-details">
          ${getStatIcon(quest.stat)} ${quest.stat} +${quest.statGain} | ${quest.xp} XP | User: ${users[quest.userId]?.name || 'Unknown'}
        </div>
        ${quest.completed ? '<span class="completed-badge">✅ COMPLETED</span>' : ''}
      </div>
    `;
    questList.appendChild(li);
  });
}

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

  e.target.reset();
  button.disabled = false;
  button.textContent = 'CREATE QUEST';
  loadUsersAndQuests();
});

document.getElementById('userSelector').addEventListener('change', (e) => {
  currentUserId = e.target.value;
  loadUsersAndQuests();
});

// Add quest completion animation
const style = document.createElement('style');
style.textContent = `
  @keyframes questComplete {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); background: rgba(0, 255, 136, 0.2); }
    100% { transform: scale(1); }
  }
`;
document.head.appendChild(style);

// Initial load
loadUsersAndQuests();