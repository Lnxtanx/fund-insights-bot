import { Holding, Trade } from '@/types/finance';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface EmbeddedItem {
    id: string;
    text: string;
    embedding: number[];
    metadata: any;
}

// Simple in-memory vector store
let vectorStore: EmbeddedItem[] = [];

// Cosine Similarity
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Generate Embedding for a single string
async function getEmbedding(text: string): Promise<number[]> {
    if (!OPENAI_API_KEY) throw new Error("Missing API Key");

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            input: text,
            model: 'text-embedding-3-small'
        })
    });

    if (!response.ok) {
        throw new Error(`Embedding API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
}

// IndexedDB Config
const DB_NAME = 'FinanceBotDB';
const STORE_NAME = 'vectors';
const DB_VERSION = 1;

// Helper to open DB
function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (e) => {
            const db = (e.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
    });
}

// Helper to save vectors
async function saveVectorsToDB(items: EmbeddedItem[]) {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Clear old store first to avoid stale data (optional but safer for dev)
    // store.clear(); 
    items.forEach(item => store.put(item));
    return new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Helper to load vectors
async function loadVectorsFromDB(): Promise<EmbeddedItem[]> {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Batch Generation to avoid rate limits (Process 10 at a time)
export async function generateIndex(holdings: Holding[], trades: Trade[], onProgress: (progress: number) => void) {
    // 1. Try to load from Cache first
    try {
        const cached = await loadVectorsFromDB();
        const expectedCount = holdings.length + trades.length;

        // Simple cache validation: if counts roughly match, we assume it's same data.
        // In production, we should hash the input data to verify integrity.
        if (cached.length > 0 && Math.abs(cached.length - expectedCount) < 5) {
            console.log("Loaded embeddings from cache (IndexedDB). Skipping API calls.");
            vectorStore = cached;
            onProgress(100);
            return;
        }
    } catch (e) {
        console.warn("Failed to load cache", e);
    }

    // 2. If not in cache, Generate Fresh
    vectorStore = [];
    const items: { text: string; metadata: any }[] = [];

    // specific formatting for embedding to capture meaning
    holdings.forEach((h, i) => {
        items.push({
            text: `Holding Fund: ${h.PortfolioName}, Security: ${h.SecurityTypeName}, MV: ${h.MV_Base}, PL: ${h.PL_YTD}`,
            metadata: { type: 'holding', original: h }
        });
    });

    trades.forEach((t, i) => {
        items.push({
            text: `Trade Fund: ${t.PortfolioName}, Type: ${t.TradeTypeName}, Date: ${t.TradeDate}, Qty: ${t.Quantity}, Price: ${t.Price}`,
            metadata: { type: 'trade', original: t }
        });
    });

    const total = items.length;
    const BATCH_SIZE = 50;

    for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = items.slice(i, i + BATCH_SIZE);

        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    input: batch.map(b => b.text),
                    model: 'text-embedding-3-small'
                })
            });

            if (response.ok) {
                const data = await response.json();
                data.data.forEach((emb: any, idx: number) => {
                    vectorStore.push({
                        id: `${i + idx}`,
                        text: batch[idx].text,
                        embedding: emb.embedding,
                        metadata: batch[idx].metadata
                    });
                });
            } else {
                console.error('Batch embedding failed', await response.text());
            }
        } catch (e) {
            console.error('Embedding error', e);
        }

        onProgress(Math.min(100, Math.round(((i + BATCH_SIZE) / total) * 100)));
    }

    // 3. Save to Cache after generation
    try {
        await saveVectorsToDB(vectorStore);
        console.log("Saved embeddings to cache.");
    } catch (e) {
        console.error("Failed to save to cache", e);
    }
}

export async function searchContext(query: string, topK: number = 20): Promise<string> {
    const queryEmbedding = await getEmbedding(query);

    const scored = vectorStore.map(item => ({
        ...item,
        score: cosineSimilarity(queryEmbedding, item.embedding)
    }));

    // Sort by similarity desc
    scored.sort((a, b) => b.score - a.score);

    const topResults = scored.slice(0, topK);

    // OPTIMIZATION: Return the concise text representation we created for embedding
    // instead of the full raw JSON. This saves massive amounts of tokens.
    return topResults.map(r => `- ${r.text}`).join('\n');
}
