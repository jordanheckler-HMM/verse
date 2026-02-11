# Getting Started with Verse

Complete setup guide for the Verse songwriting app (frontend + backend).

## 🎯 What You're Building

Verse is a fully local desktop songwriting app with:
- **DAW-style timeline** with draggable lyric blocks
- **Lyra AI assistant** powered by local Ollama (no cloud)
- **Proposal-based workflow** - AI never auto-edits
- **Zero persistence** - session-based memory only

---

## 📋 Prerequisites

1. **Node.js** v18+ ([download](https://nodejs.org))
2. **Ollama** ([install guide](https://ollama.ai))

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Ollama & Model

```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Or with brew (macOS)
brew install ollama

# Start Ollama
ollama serve
```

Keep this terminal open or run Ollama in the background.

Verify your local model exists:

```bash
# List your Ollama models
ollama list

# Verify lyra-general is in the list
# The backend uses your existing local lyra-general model
```

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

### Step 3: Start Backend Server

```bash
npm run dev
```

You should see:
```
✓ Ollama is running
✓ Model "lyra-general" is available
✅ All checks passed - Lyra is ready!

📝 Backend is ready for songwriting!
```

Backend running at: `http://localhost:3001`

### Step 4: Install Frontend Dependencies

Open a new terminal:

```bash
cd verse-flow-main
npm install
```

### Step 5: Start Frontend

```bash
npm run dev
```

Frontend running at: `http://localhost:5173`

---

## 🖥️ Desktop Build (Tauri)

Use this when you want to run Verse as a macOS desktop app (`verse.app`).

### Additional Prerequisites

1. **Rust toolchain** (Cargo + rustc)
2. **Ollama running locally** at `http://localhost:11434`

### Desktop Development

```bash
cd verse-flow-main
npm run tauri:dev
```

`tauri:dev` builds and bundles the backend sidecar automatically, then starts the app.

### Desktop Production Build

```bash
cd verse-flow-main
npm run tauri:build
```

Build output:

`verse-flow-main/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/verse.app`

---

## ✅ Verify Everything Works

1. **Check Backend Health:**
   ```bash
   curl http://localhost:3001/health
   ```

2. **Check Lyra Status:**
   ```bash
   curl http://localhost:3001/api/lyra/health
   ```
   Should return: `{ "status": "ready", "message": "Lyra is ready" }`

3. **Open Frontend:**
   Visit `http://localhost:5173` in your browser

---

## 🎵 Using Verse

### 1. Start a Session
- Set your genre, mood, and optional style reference
- Click "Start Session"

### 2. Build Your Timeline
- Add sections: Verse, Chorus, Bridge, etc.
- Drag to reorder
- Write lyrics in each section

### 3. Collaborate with Lyra
- Ask Lyra for help in the right panel:
  - "Rewrite Chorus with more energy"
  - "Give me an alternative Verse 2"
  - "Make the Bridge darker"

### 4. Review & Apply Suggestions
- Lyra shows proposed changes
- You approve or reject
- Nothing changes without your permission

### 5. Export When Done
- Export your lyrics
- End session (all data wiped)

---

## 📁 Project Structure

```
lyra-app/
├── backend/              # Node.js/TypeScript backend
│   ├── src/
│   │   ├── server.ts
│   │   ├── modules/      # Core logic
│   │   ├── routes/       # API endpoints
│   │   └── types/        # TypeScript types
│   └── README.md         # Full API docs
│
├── verse-flow-main/      # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── lib/
│   │   │   └── api-client.ts  # Backend integration
│   │   └── types/
│   └── README.md
│
└── GETTING_STARTED.md    # This file
```

---

## 🔧 Development Workflow

### Running Both Servers

**Terminal 1 - Ollama:**
```bash
ollama serve
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd verse-flow-main
npm run dev
```

### Making Changes

**Backend Changes:**
- Edit files in `backend/src/`
- Server auto-reloads (ts-node-dev)
- Check logs in Terminal 2

**Frontend Changes:**
- Edit files in `verse-flow-main/src/`
- Vite auto-reloads browser
- Check browser console

---

## 🔌 API Integration

The frontend connects to the backend via the API client at:
`verse-flow-main/src/lib/api-client.ts`

Example usage in your components:

```typescript
import { apiClient } from '@/lib/api-client';

// In your component
const handleStartSession = async () => {
  const sessionId = await apiClient.startSession({
    genre: 'Pop',
    mood: 'Upbeat',
  });
  setSessionId(sessionId);
};

const handleAddSection = async () => {
  const section = await apiClient.addSection(
    sessionId,
    'verse',
    'Verse 1'
  );
  setSections([...sections, section]);
};

const handleAskLyra = async (message: string) => {
  const response = await apiClient.sendLyraMessage(sessionId, message);
  // Handle response with suggestion
};
```

---

## ⚠️ Common Issues

### "Cannot connect to Ollama"

**Solution:**
```bash
# Check if Ollama is running
curl http://localhost:11434

# Start it if not running
ollama serve
```

### "Model not found"

**Solution:**
```bash
# List installed models
ollama list

# Install your model
ollama pull lyra-general

# Or update backend/src/config/ollama.ts with a different model
```

### Backend CORS errors

**Solution:**
Check `backend/src/server.ts` includes your frontend URL:
```typescript
app.use(cors({
  origin: ['http://localhost:5173'],
}));
```

### Port conflicts

**Solution:**
```bash
# Backend (default 3001)
PORT=3002 npm run dev

# Frontend (default 5173) - edit vite.config.ts
```

---

## 📚 Documentation

- **Backend API:** See `backend/README.md` for full API documentation
- **Frontend Components:** See `verse-flow-main/src/components/`
- **Type Definitions:** See `backend/src/types/index.ts`

---

## 🎨 Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Browser (http://localhost:5173)                │
│  ┌──────────────────────────────────────────┐  │
│  │  React Frontend (verse-flow-main)        │  │
│  │  • Timeline UI                           │  │
│  │  • Lyra Panel                            │  │
│  │  • API Client                            │  │
│  └──────────────────┬───────────────────────┘  │
└────────────────────│────────────────────────────┘
                     │ HTTP REST
                     ▼
┌─────────────────────────────────────────────────┐
│  Node.js Backend (http://localhost:3001)        │
│  ┌──────────────────────────────────────────┐  │
│  │  Express Server                          │  │
│  │  • Session Manager (in-memory)           │  │
│  │  • Timeline Engine                       │  │
│  │  • Lyra Engine                           │  │
│  │  • Suggestion Pipeline                   │  │
│  └──────────────────┬───────────────────────┘  │
└────────────────────│────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────┐
│  Ollama (http://localhost:11434)                │
│  • lyra-general model (Qwen3 4B)                │
│  • Runs locally                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔒 Privacy Notes

- ✅ All data stays on your machine
- ✅ No cloud API calls
- ✅ No analytics or tracking
- ✅ No accounts required
- ✅ Session data wiped on exit
- ✅ Ollama runs 100% locally

---

## 🚀 Next Steps

1. **Explore the API:** Read `backend/README.md`
2. **Customize Lyra:** Edit `backend/src/modules/LyraEngine.ts` to change prompts
3. **Add Features:** Use the modular architecture to extend functionality
4. **Integrate UI:** Connect frontend components to backend API

---

## 💡 Tips

- **Lyra Prompt Tips:** Be specific (e.g., "Rewrite Verse 1" not "make it better")
- **Section Labels:** Use descriptive names (e.g., "Chorus 2 (Alt)")
- **Multiple Takes:** Duplicate sections to try variations
- **Session Management:** End sessions to clear memory and start fresh

---

## 🎵 Happy Songwriting!

You now have a fully local, AI-powered songwriting workspace. Your creativity, your control, your machine.

For questions, check:
- Backend docs: `backend/README.md`
- API client: `verse-flow-main/src/lib/api-client.ts`
- Type definitions: `backend/src/types/index.ts`
