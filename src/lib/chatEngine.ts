import { Holding, Trade } from '@/types/finance';
import { calculateGlobalStats, formatGlobalStats } from './dataProcessor';
import { generateIndex, searchContext } from './ragEngine';

// API Key handled on server

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// State to track if data is indexed
let isIndexed = false;

export async function initializeKnowledgeBase(
  holdings: Holding[],
  trades: Trade[],
  onProgress: (p: number) => void
) {
  if (isIndexed) return;
  console.log("Starting RAG Indexing...");
  await generateIndex(holdings, trades, onProgress);
  isIndexed = true;
  console.log("RAG Indexing Complete");
}

function buildHybridSystemPrompt(globalStatsStr: string, retrievedContext: string): string {
  return `You are a financial analyst assistant. 
You are provided with two types of data context:

1. GLOBAL PORTFOLIO STATS (High-level totals):
${globalStatsStr}

2. RELEVANT DATA ROWS (Specific details found for this query):
${retrievedContext}

INSTRUCTIONS:
- Use "Global Stats" for high-level questions (e.g., "Total P&L", "How many funds?").
- Use "Relevant Data Rows" for specific details (e.g., "P&L for Fund X", "Trades in Jan").
- If the answer is not in the provided context, state that you don't have enough data.
- Be concise and precise.
`;
}

export async function processQuestionWithAI(
  question: string,
  holdings: Holding[],
  trades: Trade[],
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  // API Key check handled on server

  // 1. Calculate Global Stats (Cheap & Fast)
  // We re-calc this every time or could cache it, but it's fast enough.
  const globalStats = calculateGlobalStats(holdings, trades);
  const globalStatsStr = formatGlobalStats(globalStats);

  // 2. Retrieve Relevant Context (Vector Search)
  let retrievedRows = "No specific rows found.";
  if (isIndexed) {
    retrievedRows = await searchContext(question, 30); // Top 30 rows
  } else {
    return "⚠️ System is still indexing data. Please wait a moment...";
  }

  // 3. Build Prompt
  const systemPrompt = buildHybridSystemPrompt(globalStatsStr, retrievedRows);

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4),
    { role: 'user', content: question }
  ];

  try {
    // Only using gpt-4o-mini or turbo is fine now because context is small!
    // Only using gpt-4o-mini or turbo is fine now because context is small!
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // or gpt-4-turbo
        messages: messages,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error(err);
      if (response.status === 429) return "⚠️ Rate limit exceeded (even with RAG). Check quota.";
      return "⚠️ AI Error.";
    }

    const data = await response.json();

    // Log Token Usage to Console for Developer Monitoring
    if (data.usage) {
      console.log("--------------- AI TOKEN USAGE ---------------");
      console.log(`Prompt Tokens (Input): ${data.usage.prompt_tokens}`);
      console.log(`Completion Tokens (Output): ${data.usage.completion_tokens}`);
      console.log(`Total Tokens: ${data.usage.total_tokens}`);
      console.log("----------------------------------------------");
    }

    return data.choices?.[0]?.message?.content || "No response.";

  } catch (error) {
    console.error('AI Request Failed', error);
    return "⚠️ Connection Error.";
  }
}

// Legacy stub
export function processQuestion(q: string, h: Holding[], t: Trade[]): string {
  return "Use async version.";
}


