# 🎯 Dial It In - Find Your Wavelength

> A daily spectrum challenge game for Reddit. Are you on the same wavelength as the community?

## 🎮 What is Dial It In?

**Dial It In** is a daily social guessing game where you position concepts on a spectrum between two opposites. Think of it like a mental calibration test - can you predict where the Reddit community will place things?

Each day brings 3 fresh rounds with a new spectrum. You'll see prompts like:

- "Where does 'Liking your own posts' sit between **Harmless** and **Cancel-worthy**?"
- "Is 'Pineapple on pizza' closer to **Genius** or **Crime Against Humanity**?"

Use the interactive dial to place your guess, submit all 3 rounds, then wait until **8pm** to see how you did. Your score is based on how close you were to the community median - the ultimate test of whether you can read the hive mind!

## 🎯 How to Play

### First Time? Start with the Tutorial

New players get a quick practice round to learn the mechanics:

1. See a simple spectrum: **Cold ↔ Hot**
2. Position "A Cup of Coffee" on the dial
3. Get instant feedback on your guess
4. Jump into the real game!

### Playing the Daily Game

1. **View Today's Spectrum** - Two opposing concepts (e.g., "Harmless" ↔ "Cancel-worthy")
2. **Read the Clue** - A concept to position (e.g., "Liking your own posts")
3. **Move the Dial** - Drag the slider from 0-100 to place your guess
4. **Submit** - Lock in your answer and move to the next round
5. **Complete 3 Rounds** - No peeking at results yet!
6. **Wait Until 8pm** - Results unlock at 8pm on the day you played
7. **See Your Results** - Swipe through each round to see how you did
8. **Share Your Score** - Copy your results to share in Reddit comments

### Scoring

- **Max score per round:** 100 points (closer = more points)
- **Max total score:** 300 points across 3 rounds
- **Target:** The community median (calculated from all players after 8pm)
- **Streak bonus:** Maintain your streak by scoring 210+ points (70% average)

## ✨ Key Features

- 🎯 **Daily Challenges** - Fresh spectrums every day
- 🔒 **Time-Locked Results** - Results unlock at 8pm for everyone simultaneously
- 🏆 **Hall of Fame** - Compete on leaderboards (Daily, All-Time, Streaks)
- 🔥 **Streak System** - Build your daily streak by scoring 210+ points
- 🗳️ **Vote on Spectrums** - Help choose tomorrow's spectrum by voting on community submissions
- 🧪 **Submit Your Ideas** - Create your own spectrums in the Spectrum Lab
- 💾 **Auto-Save** - Your progress saves automatically - play across devices
- � **Mobile-FGirst** - Optimized for touch with haptic feedback and sound effects
- � **Enhanced Sharing** - Copy beautiful results with emoji visualizations

## 🌟 What Makes It Special?

### The 8pm Unlock

Results are locked until 8pm on the day you play. This creates:

- **Anticipation** - "I need to come back to see my score!"
- **Shared Experience** - Everyone discovers results together
- **Community Moment** - Sparks discussion and comparison
- **Fair Scoring** - All players scored against the same community median

### Community-Driven

- **Community Median Target** - Your score is based on where everyone else guessed
- **Daily Spectrum Selection** - Top-voted community submissions become tomorrow's game
- **User-Generated Content** - Submit your own spectrum ideas
- **Voting System** - One vote per submission to keep it fair

### Beautiful Design

- **Physical Dial Aesthetic** - Realistic rotating needle with spectrum gradient
- **Smooth Animations** - Satisfying interactions with haptic feedback
- **Glassmorphism UI** - Modern frosted glass effects
- **Mobile-Optimized** - Touch-friendly with sound and vibration

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

First-time players get a practice round with "Cold ↔ Hot" spectrum and "A Cup of Coffee" to learn the mechanics.

### Hall of Fame

Competitive leaderboards with multiple categories:

- Daily champions
- All-time high scores
- Longest streaks

### Spectrum Lab

Submit your own spectrum ideas with sample clues. Community votes help prioritize which get added to the game.

### Voting Gallery

Browse and vote on community submissions. Top-voted spectrums are automatically selected at 8pm for the next day's game.

### State Persistence

- Auto-saves every second to localStorage
- Syncs to server (Redis) for cross-device play
- Real-time sync across browser tabs
- Grace period to finish previous day's incomplete games

### Mobile Experience

- Touch-optimized slider controls
- Haptic feedback (15ms vibration)
- Sound effects for interactions
- Responsive design for all screen sizes

## 📝 Recent Updates

- ✅ Removed moderator approval workflow - community voting now drives spectrum selection
- ✅ Results unlock at 8pm on game creation day
- ✅ Enhanced mobile-responsive voting gallery
- ✅ Interactive tutorial for first-time players
- ✅ Copy-to-clipboard sharing with emoji visualizations
- ✅ Improved haptic feedback and sound effects
- ✅ Daily spectrum auto-selection from top-voted submissions

## 📄 License

BSD-3-Clause

---

**Built with [Devvit](https://developers.reddit.com/) - Reddit's developer platform**
