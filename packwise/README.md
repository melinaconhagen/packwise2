# PackWise 🧳

**Pack smart. Travel light.**

A beautiful AI-powered travel packing app that helps you pack perfectly — never under or over.

---

## Features

- **Accounts** — Sign up with email & username, stays logged in
- **My Trips** — Add trips with destination, duration, dates, activities & suitcase size
- **AI Packing Lists** — AI generates day-by-day outfit plans from your closet
- **Suitcase Capacity Tracker** — Visual fill indicator based on your suitcase measurements
- **Weather-Aware** — AI accounts for local weather when planning outfits
- **Edit Outfits** — Customise any day's outfit after AI generates the draft
- **My Closet** — Add clothes manually or paste shopping orders for AI to extract items
- **Laundry Basket** — Mark dirty clothes; AI won't suggest them (or will warn you if needed)

---

## Setup

### 1. Upload to GitHub Pages

1. Create a new GitHub repository (e.g. `packwise`)
2. Upload all these files keeping the folder structure:
   ```
   index.html
   css/style.css
   js/app.js
   README.md
   ```
3. Go to **Settings → Pages → Source → main branch → / (root)**
4. Your site will be live at `https://yourusername.github.io/packwise`

### 2. Get an Anthropic API Key (for AI features)

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. When you first open the app, paste your API key in the yellow banner at the top
4. The key is saved in your browser — you only need to do this once

> **Note:** Your API key is stored only in your browser's localStorage and is never sent anywhere except directly to Anthropic's API.

---

## How It Works

### Adding Clothes to Your Closet
- Click **My Closet → + Add Item** to add items one by one
- Click **↳ Import** to paste a shopping order or any text — AI extracts all clothing items automatically

### Planning a Trip
1. From Home, click **+ Add Trip**
2. Fill in destination, duration, dates, activities, and suitcase size
3. PackWise will take you to your packing list and generate it automatically

### Packing List
- AI creates a full outfit for every day, choosing from your closet
- The suitcase widget shows how full your bag will be
- Click **✏️ edit** on any outfit to change it
- Click **↻ Regenerate** to get a fresh AI suggestion

### Laundry Basket
- Click any item in your closet to move it to the laundry basket
- Dirty clothes are skipped by the AI when planning outfits
- If a dirty item is needed for a trip, you'll get a warning notification

---

## Tech Stack

- Pure HTML, CSS, JavaScript — no frameworks needed
- Data stored in browser `localStorage` (no server needed)
- AI powered by [Anthropic Claude API](https://anthropic.com)
- Google Fonts: Cormorant Garamond + DM Sans

---

## Privacy

All your data (account, closet, trips) is stored **locally in your browser**. Nothing is sent to any server except your packing requests to Anthropic's API (which only includes your closet and trip details, not your account info).
