/**
 * Ollama configuration
 * All settings for local Ollama integration
 */

export const OLLAMA_CONFIG = {
  // Base URL for Ollama API
  baseUrl: 'http://localhost:11434',
  
  // Model name as specified in requirements
  model: 'lyra-general',
  
  // API endpoints
  endpoints: {
    generate: '/api/generate',
    tags: '/api/tags',
    show: '/api/show',
  },
  
  // Generation options
  options: {
    temperature: 0.8,  // Creative but controlled
    top_p: 0.9,
    top_k: 40,
  },
  
  // Timeout for requests (30 seconds)
  timeout: 30000,
  
  // Whether to stream responses (disabled per requirements)
  stream: false,
} as const;

/**
 * Constructs full URL for Ollama endpoint
 */
export function getOllamaUrl(endpoint: keyof typeof OLLAMA_CONFIG.endpoints): string {
  return `${OLLAMA_CONFIG.baseUrl}${OLLAMA_CONFIG.endpoints[endpoint]}`;
}

