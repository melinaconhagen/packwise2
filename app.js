// PackWise App — Main Logic

const App = {
  currentUser: null,
  currentView: 'home',
  currentTripId: null,

  init() {
    const saved = localStorage.getItem('packwise_session');
    if (saved) {
      this.currentUser = JSON.parse(saved);
      this.showApp();
    } else {
      this.showPage('auth-page');
    }
    this.bindEvents();
  },

  showPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  showApp() {
    this.showPage('app-page');
    this.renderNav();
    this.navigate('home');
  },

  renderNav() {
    const u = this.currentUser;
    document.getElementById('nav-username').textContent = u.username;
    document.getElementById('nav-avatar').textContent = u.username[0].toUpperCase();
  },

  navigate(view, tripId) {
    this.currentView = view;
    if (tripId) this.currentTripId = tripId;

    document.querySelectorAll('.nav-item').forEach(n => {
      n.classList.toggle('active', n.dataset.view === view);
    });

    const main = document.getElementById('main-content');
    const renders = {
      home: () => this.renderHome(),
      closet: () => this.renderCloset(),
      laundry: () => this.renderLaundry(),
      packing: () => this.renderPacking(),
    };
    if (renders[view]) renders[view]();
  },

  // ── AUTH ──────────────────────────────────────────

  signUp() {
    const email = document.getElementById('su-email').value.trim();
    const username = document.getElementById('su-username').value.trim();
    const pass = document.getElementById('su-pass').value;
    const err = document.getElementById('auth-error');

    if (!email || !username || !pass) { err.textContent = 'Please fill all fields.'; return; }
    if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }

    const users = JSON.parse(localStorage.getItem('packwise_users') || '[]');
    if (users.find(u => u.email === email)) { err.textContent = 'Email already registered.'; return; }

    const user = { id: Date.now(), email, username, pass };
    users.push(user);
    localStorage.setItem('packwise_users', JSON.stringify(users));
    localStorage.setItem('packwise_session', JSON.stringify({ id: user.id, email, username }));
    this.currentUser = { id: user.id, email, username };
    this.initUserData(user.id);
    this.showApp();
  },

  signIn() {
    const email = document.getElementById('si-email').value.trim();
    const pass = document.getElementById('si-pass').value;
    const err = document.getElementById('auth-error');

    const users = JSON.parse(localStorage.getItem('packwise_users') || '[]');
    const user = users.find(u => u.email === email && u.pass === pass);
    if (!user) { err.textContent = 'Invalid email or password.'; return; }

    localStorage.setItem('packwise_session', JSON.stringify({ id: user.id, email: user.email, username: user.username }));
    this.currentUser = { id: user.id, email: user.email, username: user.username };
    this.showApp();
  },

  signOut() {
    localStorage.removeItem('packwise_session');
    this.currentUser = null;
    this.showPage('auth-page');
  },

  initUserData(userId) {
    const key = `packwise_data_${userId}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({ trips: [], closet: [], laundry: [] }));
    }
  },

  getData() {
    const key = `packwise_data_${this.currentUser.id}`;
    return JSON.parse(localStorage.getItem(key) || '{"trips":[],"closet":[],"laundry":[]}');
  },

  saveData(data) {
    const key = `packwise_data_${this.currentUser.id}`;
    localStorage.setItem(key, JSON.stringify(data));
  },

  // ── HOME ──────────────────────────────────────────

  renderHome() {
    const data = this.getData();
    const main = document.getElementById('main-content');
    const apiKey = localStorage.getItem('packwise_apikey') || '';

    let bannerHtml = '';
    if (!apiKey) {
      bannerHtml = `<div class="api-banner">
        <span>🔑 Add your Anthropic API key to enable AI features:</span>
        <input type="password" id="api-key-input" placeholder="sk-ant-..." value="${apiKey}">
        <button onclick="App.saveApiKey()">Save</button>
      </div>`;
    }

    let tripsHtml = '';
    if (data.trips.length === 0) {
      tripsHtml = `<div class="empty-state">
        <div class="empty-icon">✈️</div>
        <div class="empty-title">No trips yet</div>
        <p>Add your first trip to get started</p>
      </div>`;
    } else {
      tripsHtml = `<div class="trips-grid">
        ${data.trips.map(t => `
          <div class="trip-card" onclick="App.navigate('packing', '${t.id}')">
            <div class="trip-dest">${t.destination}</div>
            <div class="trip-date">${t.startDate} · ${t.duration} days</div>
            <div class="trip-tags">
              ${t.activities.slice(0,3).map(a => `<span class="tag">${a}</span>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;
    }

    main.innerHTML = `
      ${bannerHtml}
      <div class="page-header">
        <div class="page-title">Welcome back, <span>${this.currentUser.username}</span></div>
        <div class="page-subtitle">Here are your upcoming adventures</div>
      </div>
      <div class="section-header">
        <div class="section-title">Your Trips</div>
        <button class="btn-secondary" onclick="App.openAddTrip()">+ Add Trip</button>
      </div>
      ${tripsHtml}`;
  },

  saveApiKey() {
    const val = document.getElementById('api-key-input').value.trim();
    if (val) { localStorage.setItem('packwise_apikey', val); this.notify('API key saved!'); this.renderHome(); }
  },

  // ── ADD TRIP MODAL ────────────────────────────────

  openAddTrip() {
    document.getElementById('add-trip-modal').classList.remove('hidden');
  },

  closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  },

  toggleActivity(el) {
    el.classList.toggle('selected');
  },

  async saveTrip() {
    const dest = document.getElementById('trip-dest').value.trim();
    const duration = document.getElementById('trip-duration').value;
    const startDate = document.getElementById('trip-start').value;
    const suitcaseL = document.getElementById('suit-l').value || 55;
    const suitcaseW = document.getElementById('suit-w').value || 35;
    const suitcaseH = document.getElementById('suit-h').value || 20;
    const activities = [...document.querySelectorAll('.activity-chip.selected')].map(c => c.textContent);

    if (!dest || !duration) { this.notify('Please fill in destination and duration.'); return; }

    const data = this.getData();
    const trip = {
      id: Date.now().toString(),
      destination: dest,
      duration: parseInt(duration),
      startDate: startDate || 'TBD',
      activities,
      suitcase: { l: parseInt(suitcaseL), w: parseInt(suitcaseW), h: parseInt(suitcaseH) },
      packingList: [],
      weatherGenerated: false
    };
    data.trips.push(trip);
    this.saveData(data);
    this.closeModal('add-trip-modal');
    this.notify(`Trip to ${dest} added!`);

    // Auto-generate packing list if closet has items
    if (data.closet.length > 0) {
      this.navigate('packing', trip.id);
      await this.generatePackingList(trip.id);
    } else {
      this.navigate('packing', trip.id);
    }
  },

  // ── PACKING LIST ──────────────────────────────────

  renderPacking() {
    const data = this.getData();
    const trip = data.trips.find(t => t.id === this.currentTripId);
    const main = document.getElementById('main-content');

    if (!trip) {
      main.innerHTML = `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-title">Select a trip</div></div>`;
      return;
    }

    const vol = trip.suitcase.l * trip.suitcase.w * trip.suitcase.h;
    const usedVol = trip.packingList.reduce((acc, day) => acc + day.outfits.length * 1500, 0);
    const pct = Math.min(100, Math.round(usedVol / vol * 100));
    const barClass = pct > 90 ? 'full' : pct > 70 ? 'near-full' : '';

    const laundry = data.laundry || [];

    let packingHtml = '';
    if (trip.packingList.length === 0) {
      packingHtml = `<div class="empty-state">
        <div class="empty-icon">✨</div>
        <div class="empty-title">Ready to pack?</div>
        <p>Click "Generate with AI" to create a personalised packing list from your closet.</p>
        <br>
        <button class="btn-primary" style="width:auto;padding:12px 28px;" onclick="App.generatePackingList('${trip.id}')">Generate with AI</button>
      </div>`;
    } else {
      const dayBlocks = trip.packingList.map((day, di) => `
        <div class="day-block">
          <div class="day-title">
            Day ${day.day}
            ${day.weather ? `<span style="font-size:13px;color:var(--taupe);font-family:'DM Sans',sans-serif;font-weight:400;">${day.weather}</span>` : ''}
          </div>
          ${day.outfits.map((outfit, oi) => `
            <div class="outfit-row">
              <span class="outfit-emoji">${outfit.emoji || '👕'}</span>
              <span class="outfit-name">${outfit.name}</span>
              ${laundry.includes(outfit.id) ? '<span style="color:var(--terracotta);font-size:11px;">In laundry</span>' : ''}
              <button class="outfit-edit" onclick="App.editOutfit('${trip.id}',${di},${oi})">✏️ edit</button>
            </div>`).join('')}
        </div>`).join('');

      packingHtml = `<div class="section-header" style="margin-bottom:1rem;">
        <div class="section-title">Day-by-Day Outfits</div>
        <button class="btn-secondary" onclick="App.generatePackingList('${trip.id}')">↻ Regenerate</button>
      </div>${dayBlocks}`;
    }

    main.innerHTML = `
      <div class="page-header">
        <div class="page-title">${trip.destination}</div>
        <div class="page-subtitle">${trip.duration} days · ${trip.startDate} · ${trip.activities.join(', ') || 'General travel'}</div>
      </div>
      <div class="packing-container">
        <div id="packing-list-area">${packingHtml}</div>
        <div>
          <div class="weather-widget" id="weather-widget">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;opacity:0.6;">Weather</div>
            <div class="weather-temp" id="weather-temp">—</div>
            <div id="weather-desc" style="font-size:12px;opacity:0.7;">Generate list to fetch weather</div>
          </div>
          <div class="suitcase-widget">
            <div class="suitcase-title">🧳 Suitcase</div>
            <div class="capacity-text">${trip.suitcase.l}×${trip.suitcase.w}×${trip.suitcase.h} cm</div>
            <div class="capacity-bar"><div class="capacity-fill ${barClass}" style="width:${pct}%"></div></div>
            <div class="capacity-text">${pct}% full · ~${Math.round(usedVol/1000)}L used of ${Math.round(vol/1000)}L</div>
            <div style="margin-top:1rem;font-size:13px;color:var(--taupe);">
              ${pct > 90 ? '⚠️ Almost full! Consider removing items.' : pct > 70 ? '🟡 Getting full.' : '✅ Plenty of space.'}
            </div>
          </div>
        </div>
      </div>`;
  },

  async generatePackingList(tripId) {
    const data = this.getData();
    const trip = data.trips.find(t => t.id === tripId);
    const closet = data.closet;
    const laundry = data.laundry || [];
    const apiKey = localStorage.getItem('packwise_apikey');

    if (!apiKey) { this.notify('Please add your Anthropic API key first!'); return; }

    const listArea = document.getElementById('packing-list-area');
    if (listArea) listArea.innerHTML = `<div class="ai-loading"><div class="spinner"></div> AI is building your packing list…</div>`;

    const availableClothes = closet.filter(c => !laundry.includes(c.id));
    const dirtyClothes = closet.filter(c => laundry.includes(c.id));

    const prompt = `You are a smart packing assistant. Create a day-by-day packing list.

Trip: ${trip.destination} for ${trip.duration} days starting ${trip.startDate}
Activities: ${trip.activities.join(', ') || 'general travel'}
Suitcase: ${trip.suitcase.l}×${trip.suitcase.w}×${trip.suitcase.h} cm (${Math.round(trip.suitcase.l*trip.suitcase.w*trip.suitcase.h/1000)}L)

Available clothing in closet:
${availableClothes.map(c => `- ${c.id}: ${c.emoji} ${c.name} (${c.type})`).join('\n') || '(closet is empty — suggest generic items)'}

${dirtyClothes.length > 0 ? `Dirty clothes (do NOT suggest these unless washed): ${dirtyClothes.map(c => c.name).join(', ')}` : ''}

Also fetch approximate weather for ${trip.destination} in ${trip.startDate} season.

Respond ONLY with valid JSON in this exact format:
{
  "weather": { "temp": "22°C", "description": "Warm and sunny", "emoji": "☀️" },
  "days": [
    {
      "day": 1,
      "weather": "Sunny, 22°C",
      "outfits": [
        { "id": "closet-item-id-or-generic", "emoji": "👕", "name": "White linen shirt + chinos", "occasion": "daywear" }
      ]
    }
  ]
}
${trip.duration > 0 ? `Create exactly ${trip.duration} day entries.` : ''}
Mix and re-use items across days. Suggest generic items if closet is empty. Keep it practical.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
      });
      const json = await res.json();
      const text = json.content[0].text;
      const clean = text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(clean);

      trip.packingList = result.days;
      trip.weather = result.weather;
      this.saveData(data);

      // Check if any dirty clothes are needed
      const dirtyNeeded = dirtyClothes.filter(c =>
        result.days.some(d => d.outfits.some(o => o.id === c.id || o.name.toLowerCase().includes(c.name.toLowerCase())))
      );

      this.renderPacking();

      if (result.weather) {
        document.getElementById('weather-temp').textContent = result.weather.emoji + ' ' + result.weather.temp;
        document.getElementById('weather-desc').textContent = result.weather.description;
      }

      if (dirtyNeeded.length > 0) {
        setTimeout(() => this.notify(`🧺 Heads up! You may need to wash: ${dirtyNeeded.map(c=>c.name).join(', ')}`, 'warning'), 800);
      }

    } catch (e) {
      console.error(e);
      if (listArea) listArea.innerHTML = `<div style="color:var(--terracotta);padding:1rem;">Failed to generate. Check your API key and try again.<br><small>${e.message}</small></div>`;
    }
  },

  editOutfit(tripId, dayIndex, outfitIndex) {
    const data = this.getData();
    const trip = data.trips.find(t => t.id === tripId);
    const outfit = trip.packingList[dayIndex].outfits[outfitIndex];
    const newName = prompt('Edit outfit:', outfit.name);
    if (newName && newName.trim()) {
      outfit.name = newName.trim();
      this.saveData(data);
      this.renderPacking();
    }
  },

  // ── CLOSET ────────────────────────────────────────

  renderCloset() {
    const data = this.getData();
    const main = document.getElementById('main-content');
    const laundry = data.laundry || [];

    const cards = data.closet.map(c => `
      <div class="clothing-card ${laundry.includes(c.id) ? 'in-laundry' : ''}" onclick="App.openClothingMenu('${c.id}')">
        <div class="clothing-emoji">${c.emoji}</div>
        <div class="clothing-name">${c.name}</div>
        <div class="clothing-type">${c.type}</div>
      </div>`).join('');

    main.innerHTML = `
      <div class="page-header">
        <div class="page-title">My Closet</div>
        <div class="page-subtitle">Manage your wardrobe for smart packing</div>
      </div>
      <div class="section-header">
        <div class="section-title">All Items (${data.closet.length})</div>
        <div style="display:flex;gap:8px;">
          <button class="btn-secondary" onclick="App.openAddClothing()">+ Add Item</button>
          <button class="btn-secondary" onclick="App.openImportModal()">↳ Import</button>
        </div>
      </div>
      <div class="closet-grid">
        ${cards}
        <div class="add-clothing-card" onclick="App.openAddClothing()">
          <div style="font-size:1.8rem;">+</div>
          <div>Add clothing</div>
        </div>
      </div>`;
  },

  openAddClothing() {
    document.getElementById('add-clothing-modal').classList.remove('hidden');
  },

  saveClothing() {
    const name = document.getElementById('cloth-name').value.trim();
    const type = document.getElementById('cloth-type').value;
    const emoji = document.getElementById('cloth-emoji').value.trim() || '👕';
    if (!name) { this.notify('Please enter a name.'); return; }
    const data = this.getData();
    data.closet.push({ id: 'c' + Date.now(), name, type, emoji });
    this.saveData(data);
    this.closeModal('add-clothing-modal');
    document.getElementById('cloth-name').value = '';
    this.renderCloset();
    this.notify(`${emoji} ${name} added to closet!`);
  },

  openClothingMenu(itemId) {
    const data = this.getData();
    const item = data.closet.find(c => c.id === itemId);
    const laundry = data.laundry || [];
    const inLaundry = laundry.includes(itemId);
    const choice = confirm(`${item.emoji} ${item.name}\n\n${inLaundry ? 'Remove from laundry?' : 'Move to laundry basket?'}\n\nCancel = delete item`);
    if (choice) {
      if (inLaundry) { data.laundry = laundry.filter(id => id !== itemId); }
      else { data.laundry = [...laundry, itemId]; }
      this.saveData(data);
      this.renderCloset();
    }
  },

  openImportModal() {
    document.getElementById('import-modal').classList.remove('hidden');
  },

  async importFromText() {
    const text = document.getElementById('import-text').value.trim();
    const apiKey = localStorage.getItem('packwise_apikey');
    if (!text) return;
    if (!apiKey) { this.notify('API key required for AI import.'); return; }

    document.getElementById('import-btn').textContent = 'Processing…';

    const prompt = `Extract clothing items from this text. Return ONLY a JSON array:
[{"name":"White t-shirt","type":"tops","emoji":"👕"},...]
Types: tops, bottoms, dresses, outerwear, shoes, accessories, swimwear, activewear
Text: ${text}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] })
      });
      const json = await res.json();
      const clean = json.content[0].text.replace(/```json|```/g, '').trim();
      const items = JSON.parse(clean);
      const data = this.getData();
      items.forEach(item => data.closet.push({ id: 'c' + Date.now() + Math.random(), ...item }));
      this.saveData(data);
      this.closeModal('import-modal');
      this.renderCloset();
      this.notify(`Added ${items.length} items to your closet!`);
    } catch (e) {
      this.notify('Import failed. Please try again.');
    }
    document.getElementById('import-btn').textContent = 'Import Items';
  },

  // ── LAUNDRY ───────────────────────────────────────

  renderLaundry() {
    const data = this.getData();
    const laundry = data.laundry || [];
    const main = document.getElementById('main-content');
    const laundryItems = data.closet.filter(c => laundry.includes(c.id));

    const itemsHtml = laundryItems.length === 0
      ? `<div class="laundry-empty"><div class="laundry-empty-icon">🧺</div><p>Your laundry basket is empty.<br>Items you mark as dirty will appear here.</p></div>`
      : `<div class="laundry-grid">${laundryItems.map(c => `
          <div class="laundry-item">
            <span>${c.emoji}</span>
            <span>${c.name}</span>
            <button class="laundry-remove" onclick="App.removeFromLaundry('${c.id}')" title="Mark as clean">✓</button>
          </div>`).join('')}
        </div>`;

    main.innerHTML = `
      <div class="page-header">
        <div class="page-title">Laundry Basket</div>
        <div class="page-subtitle">Dirty clothes won't appear in your packing suggestions</div>
      </div>
      <div class="section-header">
        <div class="section-title">${laundryItems.length} item${laundryItems.length !== 1 ? 's' : ''} to wash</div>
        ${laundryItems.length > 0 ? `<button class="btn-secondary" onclick="App.clearLaundry()">✓ All clean</button>` : ''}
      </div>
      <div class="laundry-area">${itemsHtml}</div>
      <div style="margin-top:1.5rem;padding:1rem 1.4rem;background:var(--warm-white);border-radius:12px;border:1.5px solid var(--sand);font-size:14px;color:var(--brown);">
        💡 <strong>Tip:</strong> Click any clothing item in your closet to move it to or from the laundry basket. The AI will skip dirty items when creating your packing list, or warn you if they're needed.
      </div>`;
  },

  removeFromLaundry(itemId) {
    const data = this.getData();
    data.laundry = (data.laundry || []).filter(id => id !== itemId);
    this.saveData(data);
    this.renderLaundry();
  },

  clearLaundry() {
    const data = this.getData();
    data.laundry = [];
    this.saveData(data);
    this.renderLaundry();
    this.notify('All items marked as clean!');
  },

  // ── UTILS ─────────────────────────────────────────

  notify(msg, type = '') {
    const n = document.getElementById('notification');
    n.textContent = msg;
    n.className = 'notification show ' + type;
    setTimeout(() => n.classList.remove('show'), 3500);
  },

  bindEvents() {
    document.getElementById('auth-tab-signin').addEventListener('click', () => {
      document.getElementById('auth-tab-signin').classList.add('active');
      document.getElementById('auth-tab-signup').classList.remove('active');
      document.getElementById('signin-form').style.display = 'block';
      document.getElementById('signup-form').style.display = 'none';
      document.getElementById('auth-error').textContent = '';
    });
    document.getElementById('auth-tab-signup').addEventListener('click', () => {
      document.getElementById('auth-tab-signup').classList.add('active');
      document.getElementById('auth-tab-signin').classList.remove('active');
      document.getElementById('signup-form').style.display = 'block';
      document.getElementById('signin-form').style.display = 'none';
      document.getElementById('auth-error').textContent = '';
    });
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
