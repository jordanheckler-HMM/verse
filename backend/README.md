# Verse Backend

**Local-only backend server for Verse songwriting app**

Verse is a fully local desktop songwriting application with AI collaboration. This backend manages sessions, timeline sections, and integrates with Ollama for AI-powered lyric assistance through Lyra, your AI co-writer.

## 🎯 Core Principles

- **100% Local**: No cloud, no analytics, no accounts
- **Zero Persistence**: All data lives in memory, destroyed on session end
- **Proposal-Only AI**: Lyra never auto-edits, only suggests
- **Creative Freedom**: No song structure rules enforced
- **Privacy First**: Your lyrics never leave your machine

## 📋 Requirements

### System Requirements
- **Node.js**: v18 or higher
- **Ollama**: Latest version
- **Operating System**: macOS, Linux, or Windows

### Install Ollama

#### macOS/Linux
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Or using brew (macOS)
brew install ollama
```

#### Windows
Download from [ollama.ai](https://ollama.ai)

### Model Configuration

The backend is configured to use the local model `lyra-general`. This model should already exist on your system.

> **Note**: The backend uses your existing local `lyra-general` model and will never attempt to download or pull it.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start Ollama

```bash
# Start Ollama service (if not already running)
ollama serve
```

Keep this running in a separate terminal.

### 3. Start the Backend

```bash
# Development mode (with hot reload)
npm run dev

# Or build and run production
npm run build
npm start
```

The backend will start on `http://localhost:3001`

### 4. Verify Setup

Check the startup logs for:
```
Using Ollama model: lyra-general
Ollama endpoint: http://localhost:11434
Streaming: disabled

✓ Ollama is running
✓ Backend will use local model: lyra-general
✅ Configuration complete - Lyra is ready!
```

Or visit: `http://localhost:3001/api/lyra/health`

## 📁 Project Structure

```
backend/
├── src/
│   ├── server.ts              # Express server setup
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── modules/
│   │   ├── SessionManager.ts  # Session lifecycle management
│   │   ├── TimelineEngine.ts  # Section CRUD operations
│   │   ├── LyraEngine.ts      # Ollama AI integration
│   │   └── SuggestionPipeline.ts  # Approval workflow
│   ├── routes/
│   │   ├── session.ts         # Session endpoints
│   │   ├── timeline.ts        # Timeline/section endpoints
│   │   ├── lyra.ts           # AI collaboration endpoints
│   │   └── approval.ts       # Suggestion approval endpoints
│   └── config/
│       └── ollama.ts         # Ollama configuration
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Documentation

### Base URL
`http://localhost:3001`

---

## Session Endpoints

### Start Session
Creates a new songwriting session.

**POST** `/api/session/start`

**Request Body:**
```json
{
  "metadata": {
    "genre": "Pop",
    "mood": "Upbeat",
    "styleReference": "Think early Taylor Swift" // optional
  }
}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Session created successfully"
}
```

---

### End Session
Destroys all session data from memory.

**POST** `/api/session/end`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response:**
```json
{
  "message": "Session ended successfully"
}
```

---

### Get Session
Retrieves current session data.

**GET** `/api/session/:sessionId`

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": {
    "genre": "Pop",
    "mood": "Upbeat"
  },
  "sections": [...],
  "conversationHistory": [...],
  "createdAt": "2025-12-15T10:00:00.000Z"
}
```

---

## Timeline Endpoints

### Add Section
Adds a new section to the timeline.

**POST** `/api/timeline/section`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "type": "verse",
  "label": "Verse 1"
}
```

**Section Types:** `verse`, `chorus`, `prechorus`, `bridge`, `hook`, `outro`, `intro`

**Response:**
```json
{
  "id": "section-uuid",
  "type": "verse",
  "label": "Verse 1",
  "lyrics": "",
  "order": 0
}
```

---

### Update Section
Updates section lyrics or label.

**PUT** `/api/timeline/section/:sectionId`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "lyrics": "Walking down the street\nFeeling incomplete",
  "label": "Verse 1 (Updated)"
}
```

---

### Delete Section
Removes a section from the timeline.

**DELETE** `/api/timeline/section/:sectionId?sessionId=xxx`

---

### Reorder Sections
Changes the order of sections in the timeline.

**POST** `/api/timeline/reorder`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "sectionIds": ["id1", "id2", "id3"]
}
```

---

### Duplicate Section
Creates a copy of an existing section.

**POST** `/api/timeline/section/:sectionId/duplicate`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Get All Sections
Retrieves all sections for a session.

**GET** `/api/timeline/sections?sessionId=xxx`

---

## Lyra AI Endpoints

### Send Message
Sends a message to Lyra. Returns proposals only - never auto-applies.

**POST** `/api/lyra/message`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Rewrite Verse 1 with more energy"
}
```

**Response:**
```json
{
  "message": {
    "id": "msg-uuid",
    "role": "lyra",
    "content": "I can help with that! Here's a more energetic version:",
    "timestamp": "2025-12-15T10:00:00.000Z",
    "suggestion": {
      "id": "suggestion-uuid",
      "targetSectionId": "section-uuid",
      "originalContent": "Walking down the street...",
      "suggestedContent": "Racing through the city lights...",
      "status": "pending",
      "createdAt": "2025-12-15T10:00:00.000Z"
    }
  },
  "suggestion": { /* same as above */ }
}
```

---

### Check Lyra Health
Verifies Ollama connection and model availability.

**GET** `/api/lyra/health`

**Response:**
```json
{
  "status": "ready",
  "message": "Lyra is ready"
}
```

**Possible Status Values:**
- `ready` - Everything working
- `offline` - Cannot connect to Ollama
- `model_missing` - Ollama running but model not installed

---

## Approval Endpoints

### Apply Suggestion
Applies a pending suggestion to the timeline.

**POST** `/api/approval/apply`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "suggestionId": "suggestion-uuid"
}
```

**Response:**
```json
{
  "message": "Suggestion applied successfully",
  "section": {
    "id": "section-uuid",
    "type": "verse",
    "label": "Verse 1",
    "lyrics": "Racing through the city lights...",
    "order": 0
  }
}
```

---

### Reject Suggestion
Rejects a pending suggestion.

**POST** `/api/approval/reject`

**Request Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "suggestionId": "suggestion-uuid"
}
```

---

### Get Pending Suggestions
Lists all pending suggestions for a session.

**GET** `/api/approval/pending?sessionId=xxx`

---

## 🎨 Frontend Integration

A minimal API client is provided in `verse-flow-main/src/lib/api-client.ts`.

### Example Usage

```typescript
import { apiClient } from '@/lib/api-client';

// Start a session
const sessionId = await apiClient.startSession({
  genre: 'Pop',
  mood: 'Upbeat',
});

// Add a section
const section = await apiClient.addSection(sessionId, 'verse', 'Verse 1');

// Update with lyrics
await apiClient.updateSection(sessionId, section.id, {
  lyrics: 'Your amazing lyrics here',
});

// Ask Lyra for help
const response = await apiClient.sendLyraMessage(
  sessionId,
  'Make this verse more energetic'
);

// Apply suggestion if provided
if (response.suggestion) {
  await apiClient.applySuggestion(sessionId, response.suggestion.id);
}

// End session when done
await apiClient.endSession(sessionId);
```

## 🔧 Configuration

### Ollama Settings

Edit `src/config/ollama.ts` to customize:

```typescript
export const OLLAMA_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: 'lyra-general',
  options: {
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40,
  },
  timeout: 30000,
};
```

### Server Port

Set via environment variable:

```bash
PORT=3001 npm run dev
```

Or modify `src/server.ts`:

```typescript
const PORT = process.env.PORT || 3001;
```

## 🧪 Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Type checking only
npm run type-check
```

### Adding New Features

1. **Define types** in `src/types/index.ts`
2. **Implement module** in `src/modules/`
3. **Create routes** in `src/routes/`
4. **Register routes** in `src/server.ts`

## ⚠️ Troubleshooting

### Ollama Connection Issues

**Problem:** `Cannot connect to Ollama`

**Solutions:**
```bash
# Check if Ollama is running
curl http://localhost:11434

# Start Ollama
ollama serve

# Check Ollama status (macOS/Linux)
ps aux | grep ollama
```

---

### Model Not Found

**Problem:** `Local Ollama model 'lyra-general' not found`

**Solution:**
The backend requires the local `lyra-general` model to exist on your system. Verify it exists:
```bash
# List installed models
ollama list

# Your lyra-general model should appear in the list
```

If the model doesn't exist, ensure you've created it with your custom Modelfile.

---

### CORS Errors

**Problem:** Frontend cannot connect to backend

**Solution:**
Ensure your frontend URL is in the CORS allowlist in `src/server.ts`:

```typescript
app.use(cors({
  origin: [
    'http://localhost:5173',  // Add your frontend URL here
  ],
}));
```

---

### Port Already in Use

**Problem:** `Port 3001 is already in use`

**Solution:**
```bash
# Use different port
PORT=3002 npm run dev

# Or kill process using port 3001
lsof -ti:3001 | xargs kill
```

## 🔒 Privacy & Security

### What This Backend Does NOT Do:

- ❌ Send data to the cloud
- ❌ Store data to disk
- ❌ Track usage analytics
- ❌ Require authentication
- ❌ Log your lyrics
- ❌ Share data with third parties

### What IS Stored:

- ✅ Session data in RAM (deleted on session end)
- ✅ Console logs (development only, can be disabled)

## 📝 Architecture Notes

### In-Memory Storage

All data is stored in JavaScript `Map` objects. When the server restarts or a session ends, **all data is permanently lost**. This is by design.

### Suggestion Approval Workflow

```
User asks Lyra → Lyra generates suggestion → Suggestion marked "pending"
                                                    ↓
                                          User reviews in UI
                                                    ↓
                                        Apply ← → Reject
                                          ↓           ↓
                                  Update section   Mark rejected
```

Suggestions **NEVER** auto-apply. Explicit user approval is required.

## 🤝 Contributing

This is a local-first, privacy-focused project. When contributing:

1. Maintain zero cloud dependencies
2. Keep all data in-memory
3. Never auto-apply AI suggestions
4. Document all API changes
5. Test with Ollama locally

## 📄 License

MIT

---

## 🎵 Happy Songwriting!

Your lyrics, your machine, your creative control.

For questions or issues, check the troubleshooting section or review the API documentation above.

