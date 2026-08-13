import fs from 'node:fs';
import path from 'node:path';

export interface StoredToken {
  accountId: string;
  userId: string;
  accessToken: string;
  expiresAt: string; // ISO date string (6:00 AM next day IST)
  updatedAt: string;
}

// In-memory cache
const memoryStore = new Map<string, StoredToken>();

const DATA_DIR = path.resolve(process.cwd(), 'data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

function ensureDataDirExists() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // Ignore error if in edge environment without fs
  }
}

function readFromFile(): Record<string, StoredToken> {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const content = fs.readFileSync(TOKENS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading tokens from file:', err);
  }
  return {};
}

function writeToFile(tokensMap: Record<string, StoredToken>) {
  try {
    ensureDataDirExists();
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokensMap, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tokens to file:', err);
  }
}

// Initialize memory cache from file if available
try {
  const initial = readFromFile();
  for (const [id, tokenObj] of Object.entries(initial)) {
    memoryStore.set(id, tokenObj);
  }
} catch (err) {
  // Edge runtime fallback
}

export async function getToken(accountId: string, kvBinding?: any): Promise<StoredToken | null> {
  // 1. Try KV binding if passed (Cloudflare Workers)
  if (kvBinding) {
    try {
      const val = await kvBinding.get(`token:${accountId}`, { type: 'json' });
      if (val) return val as StoredToken;
    } catch (e) {
      console.error('KV get error:', e);
    }
  }

  // 2. Try in-memory store
  const cached = memoryStore.get(accountId);
  if (cached) {
    return cached;
  }

  // 3. Try reading file
  const fileTokens = readFromFile();
  if (fileTokens[accountId]) {
    memoryStore.set(accountId, fileTokens[accountId]);
    return fileTokens[accountId];
  }

  return null;
}

export async function saveToken(tokenData: StoredToken, kvBinding?: any): Promise<void> {
  // Update memory
  memoryStore.set(tokenData.accountId, tokenData);

  // Update KV if available
  if (kvBinding) {
    try {
      await kvBinding.put(`token:${tokenData.accountId}`, JSON.stringify(tokenData));
    } catch (e) {
      console.error('KV put error:', e);
    }
  }

  // Update file system if available
  const fileTokens = readFromFile();
  fileTokens[tokenData.accountId] = tokenData;
  writeToFile(fileTokens);
}

export async function getAllTokens(kvBinding?: any): Promise<Record<string, StoredToken>> {
  const result: Record<string, StoredToken> = {};
  
  // Combine memory + file
  const fileTokens = readFromFile();
  for (const [id, tokenObj] of Object.entries(fileTokens)) {
    memoryStore.set(id, tokenObj);
  }

  for (const [id, tokenObj] of memoryStore.entries()) {
    result[id] = tokenObj;
  }

  return result;
}
