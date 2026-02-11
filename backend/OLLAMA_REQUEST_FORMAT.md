# Ollama Request Format Reference

## Exact Request Format Used by Verse Backend

### HTTP Request

**Endpoint:** `POST http://localhost:11434/api/generate`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "model": "lyra-general",
  "prompt": "<full_prompt_with_context>",
  "stream": false,
  "options": {
    "temperature": 0.8,
    "top_p": 0.9,
    "top_k": 40
  }
}
```

---

## Key Requirements

### Model Name
```json
"model": "lyra-general"
```

✅ Exact string match  
✅ No `:latest` suffix  
✅ No version tags  
✅ No dynamic selection  

### Streaming
```json
"stream": false
```

✅ Explicitly disabled  
✅ Returns complete response  
✅ No SSE streaming  

---

## Implementation Location

**File:** `backend/src/modules/LyraEngine.ts`

**Method:** `callOllama(prompt: string)`

```typescript
async callOllama(prompt: string): Promise<string> {
  const url = getOllamaUrl('generate');
  
  const request: OllamaGenerateRequest = {
    model: OLLAMA_CONFIG.model,      // "lyra-general"
    prompt,
    stream: OLLAMA_CONFIG.stream,    // false
    options: OLLAMA_CONFIG.options,
  };
  
  const response = await axios.post<OllamaGenerateResponse>(
    url,
    request,
    {
      timeout: OLLAMA_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  
  return response.data.response;
}
```

---

## Response Format

**Expected Response:**
```json
{
  "model": "lyra-general",
  "created_at": "2025-12-15T10:00:00.000Z",
  "response": "<model_generated_text>",
  "done": true
}
```

**Backend Uses:** `response.data.response` (the generated text)

---

## Configuration Source

**File:** `backend/src/config/ollama.ts`

```typescript
export const OLLAMA_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model: 'lyra-general',              // Hard-coded
  stream: false,                      // Hard-coded
  
  endpoints: {
    generate: '/api/generate',
    tags: '/api/tags',
    show: '/api/show',
  },
  
  options: {
    temperature: 0.8,
    top_p: 0.9,
    top_k: 40,
  },
  
  timeout: 30000,  // 30 seconds
} as const;
```

---

## Error Handling

### Connection Refused
```
Error: Cannot connect to Ollama. Is it running on localhost:11434?
```

### Model Not Found (404)
```
Error: Local Ollama model 'lyra-general' not found.
```

### Timeout
```
Error: Ollama request failed: timeout of 30000ms exceeded
```

---

## Debug Verification

### Test Request via Debug Endpoint

```bash
curl -X POST http://localhost:3001/api/lyra/debug/confirm
```

**What It Does:**
1. Sends exact prompt: `"Say ONLY this exact string and nothing else:\nLYRA_MODEL_CONFIRMATION_92741"`
2. Uses `model: "lyra-general"`
3. Uses `stream: false`
4. Returns raw response

**Expected Response:**
```json
{
  "success": true,
  "modelResponse": "LYRA_MODEL_CONFIRMATION_92741",
  "expectedResponse": "LYRA_MODEL_CONFIRMATION_92741",
  "isMatch": true
}
```

### Test Request via Lyra Message

```bash
# 1. Start a session
curl -X POST http://localhost:3001/api/session/start \
  -H "Content-Type: application/json" \
  -d '{"metadata":{"genre":"Pop","mood":"Upbeat"}}'

# Note the sessionId from response

# 2. Send message to Lyra
curl -X POST http://localhost:3001/api/lyra/message \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<your-session-id>","message":"Hello Lyra"}'
```

---

## Verification Checklist

- [x] Model name is exactly `"lyra-general"` (no suffix)
- [x] Streaming is disabled (`stream: false`)
- [x] Request goes to `http://localhost:11434/api/generate`
- [x] No auto-pull logic exists
- [x] No model existence checks
- [x] Timeout is 30 seconds
- [x] Options include temperature, top_p, top_k
- [x] Response is non-streaming JSON

---

## Summary

The Verse backend makes **standard, non-streaming Ollama API calls** to your local `lyra-general` model with:

- ✅ Exact model name
- ✅ Non-streaming mode
- ✅ Standard generation parameters
- ✅ Proper error handling
- ✅ No auto-pull behavior

The request format is simple, correct, and deterministic.

