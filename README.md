# 🎯 Dial It In - Find Your Wavelength

> A daily spectrum challenge game for Reddit. Are you on the same wavelength as the community?

## 🎮 What is Dial It In?

**Dial It In** is a daily social guessing game where you position concepts on a spectrum between two opposites. Think of it like a mental calibration test - can you predict where the community consensus lies?

Each day brings 3 fresh rounds with a new spectrum. You'll see prompts like:

- "Where does 'Liking your own posts' sit between **Harmless** and **Cancel-worthy**?"
- "Is 'Pineapple on pizza' closer to **Genius** or **Crime Against Humanity**?"

Use the interactive dial to place your guess, submit all 3 rounds, then wait until **8pm** to see how you did. Your score is based on how close you were to a hidden target position - the ultimate test of whether you can read the collective wavelength!

## 🎯 How to Play

### First Time? Start with the Tutorial

New players get a quick interactive practice round to learn the mechanics:

1. See a simple, universally understood spectrum: **Cold ↔ Hot**
2. Position "A Cup of Coffee" on the dial by dragging the slider
3. Lock in your guess and get instant feedback
4. Learn how scoring works before jumping into the real game!

### Playing the Daily Game

1. **View Today's Spectrum** - Two opposing concepts (e.g., "Harmless" ↔ "Cancel-worthy")
2. **Read the Clue** - A concept to position (e.g., "Liking your own posts")
3. **Move the Dial** - Drag the slider from 0-100 to place your guess
   - The physical dial needle rotates smoothly as you adjust
   - Haptic feedback and sound effects enhance the experience
   - Your position auto-saves every second
4. **Submit** - Lock in your answer and move to the next round
5. **Complete 3 Rounds** - No peeking at results yet!
6. **Wait Until 8pm** - Results unlock at 8pm on the day you played
7. **See Your Results** - View each round's reveal with visual dial positions
   - 🟡 Yellow needle: Your guess
   - 🟢 Green needle: The target position
   - 🔵 Blue needle: Reddit community average
8. **Share Your Score** - Copy beautiful emoji visualizations to share in comments

### Scoring System

- **Max score per round:** 100 points
- **Max total score:** 300 points across 3 rounds
- **Scoring formula:** Quadratic falloff based on distance from target
  - Close guesses (within 10 points): 90-100 points
  - Good guesses (within 20 points): 60-90 points
  - Far guesses (30+ points away): 0-60 points
- **Streak system:** Maintain your streak by scoring 210+ points (70% average)
- **Target position:** A hidden value that creates the challenge - not the community median!

## ✨ Key Features

- 🎯 **Daily Challenges** - Fresh spectrums every day at midnight UTC
- 🔒 **Time-Locked Results** - Results unlock at 8pm on the day you play for everyone simultaneously
- 🏆 **Hall of Fame** - Compete on dual leaderboards (Daily Champions & All-Time Legends)
- 🔥 **Streak System** - Build your daily streak by scoring 210+ points consistently
- 🗳️ **Community Voting** - Vote on user-submitted spectrums to shape tomorrow's game
- 🧪 **Spectrum Lab** - Submit your own spectrum ideas with 3 sample clues
- 💾 **Auto-Save & Cross-Device Sync** - Progress saves to localStorage and Redis automatically
- 📱 **Mobile-First Design** - Optimized for touch with haptic feedback (15ms vibrations) and sound effects
- 🎨 **Beautiful Sharing** - Copy emoji-rich results with visual dial positions and stats
- 🎓 **Interactive Tutorial** - First-time players get a practice round with instant feedback
- ⏰ **Grace Period** - Finish yesterday's incomplete game before starting today's
- 🔄 **Real-Time Sync** - BroadcastChannel API syncs game state across browser tabs

## 🌟 What Makes It Special?

### The 8pm Unlock Mechanic

Results are locked until 8pm on the day you play, creating a unique anticipation loop:

- **Anticipation** - Players return throughout the day wondering how they did
- **Shared Experience** - Everyone discovers results at the same moment
- **Community Moment** - Sparks discussion and comparison in comments
- **Fair Play** - No one can see results before completing their game

### Community-Driven Content

- **Voting System** - Players vote on community-submitted spectrums (one vote per submission)
- **Auto-Selection** - Top-voted submissions automatically become tomorrow's game at 8pm
- **User-Generated** - Submit your own spectrum ideas with 3 sample clues in the Spectrum Lab
- **Creator Credit** - Spectrum creators are credited when their ideas are featured

### Physical Dial Experience

- **Realistic Mechanics** - Rotating needle with smooth animations mimics a physical dial
- **Spectrum Gradient** - Visual color gradient from teal → yellow → orange → red
- **Haptic Feedback** - 15ms vibrations on mobile when moving the dial
- **Sound Effects** - Audio cues for dial movement, locking in guesses, and results
- **Touch-Optimized** - Designed for mobile-first interaction with responsive controls

### Smart State Management

- **Auto-Save** - Game state saves every second to localStorage
- **Server Sync** - Progress syncs to Redis for cross-device play
- **Tab Sync** - BroadcastChannel API keeps multiple tabs in sync in real-time
- **Grace Period** - Incomplete games from previous days can be finished before starting today's
- **Date Validation** - Smart detection of day boundaries prevents state conflicts

## 🚀 Getting Started (For Developers)

### Prerequisites

- Node.js 22.2.0 or higher
- Reddit account for Devvit development

### Quick Start

```bash
# Install dependencies
npm install

# Login to Devvit
npm run login

# Start development server
npm run dev
```

### Available Commands

```bash
npm run dev      # Development mode (hot reload)
npm run build    # Build for production
npm run deploy   # Deploy to Reddit
npm run launch   # Publish for review
npm run check    # Run linting and type checks
```

### Project Structure

```
src/
├── client/          # React frontend
│   ├── game/       # Game screens (gameplay, results, reveal)
│   ├── splash/     # Main menu
│   ├── hof/        # Hall of Fame leaderboard
│   ├── lab/        # Spectrum Lab (submit ideas)
│   ├── vote/       # Voting gallery
│   ├── onboarding/ # Tutorial
│   └── hooks/      # React hooks (state, sound, theme)
├── server/          # Express backend
│   ├── core/       # Business logic
│   └── index.ts    # API endpoints
└── shared/          # Shared types and logic
    ├── types.ts    # Type definitions
    ├── gameLogic.ts # Scoring functions
    └── data/       # Default spectrums
```

### Key API Endpoints

- `GET /api/daily-game` - Fetch today's game
- `POST /api/guess` - Submit a guess
- `POST /api/save-game-state` - Save progress
- `GET /api/leaderboard` - Hall of Fame data
- `GET /api/user-stats` - Personal stats
- `GET /api/spectrum-lab` - View submissions
- `POST /api/spectrum-lab` - Submit new spectrum
- `POST /api/spectrum-lab/vote` - Vote on submission

## 🎨 Features in Detail

### Interactive Tutorial

First-time players get a practice round with "Cold ↔ Hot" spectrum and "A Cup of Coffee" to learn the mechanics with instant feedback.

### Hall of Fame

Competitive leaderboards with two categories:

- **Daily Champions** - Top scorers for today (resets at midnight)
- **All-Time Legends** - Cumulative high scores across all games

Each entry shows rank, username, and score with special badges for top 3 positions.

### Spectrum Lab

Submit your own spectrum ideas with:

- Left and right labels (e.g., "Cold" ↔ "Hot")
- Three sample clues to demonstrate how it works
- Visual dial preview as you type
- Submissions go to community voting

### Voting Gallery

Browse and vote on community submissions with:

- Sort options: Top, New, Rising
- Visual dial previews for each spectrum
- One vote per submission (upvote or downvote)
- Badges for trending and near-approval submissions
- Top-voted spectrums auto-selected at 8pm

### State Persistence

- **localStorage** - Auto-saves every second for instant recovery
- **Redis** - Server-side persistence for cross-device play
- **BroadcastChannel** - Real-time sync across browser tabs
- **Grace Period** - Finish yesterday's incomplete games
- **Date Validation** - Smart handling of day boundaries

### Mobile Experience

- Touch-optimized slider controls with large hit areas
- Haptic feedback (15ms vibration) on dial movement
- Sound effects for dial movement, locking, and results
- Responsive design adapts to all screen sizes
- Glassmorphism UI with frosted glass effects

## 📝 Recent Updates

- ✅ Removed moderator approval workflow - community voting now drives spectrum selection
- ✅ Results unlock at 8pm on game creation day (hybrid consensus timing)
- ✅ Enhanced mobile-responsive voting gallery with sort options
- ✅ Interactive tutorial for first-time players with practice round
- ✅ Copy-to-clipboard sharing with emoji visualizations and dial positions
- ✅ Improved haptic feedback (15ms) and sound effects
- ✅ Daily spectrum auto-selection from top-voted submissions at 8pm
- ✅ BroadcastChannel API for real-time cross-tab synchronization

## 📄 License

BSD-3-Clause

---

**Built with [Devvit](https://developers.reddit.com/) - Reddit's developer platform**
