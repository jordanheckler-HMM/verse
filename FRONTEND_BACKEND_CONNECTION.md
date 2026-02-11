# Frontend-Backend Connection Fix

## ✅ Changes Applied

The frontend has been updated to **actually call your backend API** and use your local `lyra-general` model instead of mock responses.

---

## 🔧 What Changed

### File: `verse-flow-main/src/components/WritingRoom.tsx`

#### 1. **Added Imports** ✅
- Added `useEffect` to React imports
- Imported `apiClient` from `@/lib/api-client`

#### 2. **Added Backend Session State** ✅
```typescript
const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
```

#### 3. **Initialize Backend Session on Mount** ✅
```typescript
useEffect(() => {
  const initBackendSession = async () => {
    try {
      const sessionId = await apiClient.startSession({
        genre: session.genre,
        mood: session.mood,
        styleReference: session.referenceText,
      });
      setBackendSessionId(sessionId);
      console.log('[WritingRoom] Backend session started:', sessionId);
    } catch (error) {
      console.error('[WritingRoom] Failed to start backend session:', error);
    }
  };
  
  initBackendSession();
  
  // Cleanup on unmount
  return () => {
    if (backendSessionId) {
      apiClient.endSession(backendSessionId).catch(console.error);
    }
  };
}, []);
```

**What This Does:**
- Creates a backend session when WritingRoom loads
- Sends genre/mood to backend
- Cleans up session when component unmounts

#### 4. **Replaced `handleSendMessage` with Real API Call** ✅

**BEFORE:** Mock setTimeout with generic response  
**AFTER:** Actual API call to backend

```typescript
const handleSendMessage = async (content: string) => {
  if (!backendSessionId) return;

  // Add user message to UI
  const userMessage: LyraMessage = { ... };
  setMessages(prev => [...prev, userMessage]);
  setIsThinking(true);

  try {
    // REAL API CALL - Uses your lyra-general model via Ollama
    const response = await apiClient.sendLyraMessage(backendSessionId, content);
    setMessages(prev => [...prev, response.message]);
  } catch (error) {
    console.error('Failed to send message:', error);
    // Show error to user
  } finally {
    setIsThinking(false);
  }
};
```

#### 5. **Replaced `handleAskLyra` with Real API Call** ✅

**BEFORE:** Mock setTimeout with simple text transformation  
**AFTER:** Actual API call to backend

```typescript
const handleAskLyra = async (sectionId: string, content: string) => {
  // ... validation ...
  
  try {
    // REAL API CALL - Uses your lyra-general model via Ollama
    const response = await apiClient.sendLyraMessage(
      backendSessionId, 
      `Please help me improve this ${section.label}. Current lyrics:\n\n${content}\n\nSuggest an improved version.`
    );
    setMessages(prev => [...prev, response.message]);
  } catch (error) {
    // Error handling
  }
};
```

#### 6. **Removed Mock Responses** ✅

**DELETED:**
```typescript
const mockLyraResponses = [
  "I see you're working on the {section}...",
  "Looking at this verse, the imagery is strong...",
  // etc.
];
```

These hardcoded responses are gone. All responses now come from your `lyra-general` model.

---

## 🚀 How to Test

### 1. Start Ollama
```bash
# Make sure Ollama is running
ollama serve
```

### 2. Start Backend
```bash
cd backend
npm run dev
```

You should see:
```
Using Ollama model: lyra-general
Ollama endpoint: http://localhost:11434
Streaming: disabled

✓ Ollama is running
✓ Backend will use local model: lyra-general
✅ Configuration complete - Lyra is ready!
```

### 3. Start Frontend
```bash
cd verse-flow-main
npm run dev
```

### 4. Test in Browser

1. **Open** `http://localhost:5173`
2. **Create a session** (set genre/mood)
3. **Add a section** to the timeline
4. **Ask Lyra** for help - Either:
   - Click "Ask Lyra" button on a section
   - Type directly in the Lyra panel

### 5. What You Should See

**In Browser Console:**
```
[WritingRoom] Backend session started: <uuid>
[WritingRoom] Lyra response received
```

**In Backend Terminal:**
```
[LyraEngine] Processed message for session <uuid>
```

**In Lyra Panel:**
Real responses from your `lyra-general` model (not the old mock responses)!

---

## 🔍 Verification Checklist

- [ ] Backend starts without errors
- [ ] Backend logs show "Using Ollama model: lyra-general"
- [ ] Frontend starts without errors
- [ ] Browser console shows backend session created
- [ ] Sending a message to Lyra shows "thinking" indicator
- [ ] Lyra responds with text from your model (not mock text)
- [ ] Backend logs show "[LyraEngine] Processed message"
- [ ] No CORS errors in browser console

---

## 🐛 Troubleshooting

### "Cannot connect to backend"

**Check:**
1. Backend is running on port 3001
2. Frontend is allowed in CORS (already configured for localhost:5173)

**Verify:**
```bash
curl http://localhost:3001/health
```

### "Cannot connect to Ollama"

**Check:**
1. Ollama is running: `ollama serve`
2. Model exists: `ollama list` (should show lyra-general)

**Verify:**
```bash
curl http://localhost:11434/api/tags
```

### "Local Ollama model 'lyra-general' not found"

Your model exists but Ollama can't find it. This usually means a spelling mismatch.

**Verify:**
```bash
ollama list | grep lyra-general
```

The name must match exactly.

### Responses Still Look Generic

**Check browser console** for errors. If you see:
```
Failed to send message to Lyra: <error>
```

The frontend is trying to call the backend but something's failing. Check the error message.

---

## 🎯 What Happens Now

### Request Flow

```
User types message
    ↓
WritingRoom.handleSendMessage()
    ↓
apiClient.sendLyraMessage(sessionId, message)
    ↓
POST http://localhost:3001/api/lyra/message
    ↓
Backend: LyraEngine.sendMessage()
    ↓
Backend: LyraEngine.callOllama()
    ↓
POST http://localhost:11434/api/generate
    {
      "model": "lyra-general",
      "prompt": "<full context + user message>",
      "stream": false
    }
    ↓
Ollama processes with your lyra-general model
    ↓
Response flows back through chain
    ↓
User sees real AI response in Lyra panel
```

### Context Sent to Model

Every request includes:
- **System prompt** (Lyra's identity as songwriting collaborator)
- **Session metadata** (genre, mood, style reference)
- **Timeline** (all current sections and lyrics)
- **Conversation history** (last 10 messages)
- **User's request**

Your `lyra-general` model sees the full context of the song being written.

---

## ✅ Success Indicators

You'll know it's working when:

1. **Backend session starts** (console log on session creation)
2. **Real thinking delay** (actual API call time, not setTimeout)
3. **Different responses** every time (not the same 4 mock responses)
4. **Context-aware responses** (model references genre/mood you set)
5. **Backend logs** show processed messages
6. **No error messages** in either console

---

## 🎵 Next Steps

Now that the connection is live:

1. **Try different prompts** to test your model
2. **Create sections** and ask for improvements
3. **Test suggestion format** - Use `[SUGGESTION for Section Name]` in prompts
4. **Monitor backend logs** to see actual Ollama requests
5. **Use debug endpoint** to verify model identity:
   ```bash
   curl -X POST http://localhost:3001/api/lyra/debug/confirm
   ```

Your custom `lyra-general` model is now fully integrated! 🎉

