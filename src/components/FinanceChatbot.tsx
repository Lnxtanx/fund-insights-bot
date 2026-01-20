import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/finance';
import { useFinanceData } from '@/hooks/useFinanceData';
import { processQuestionWithAI, initializeKnowledgeBase } from '@/lib/chatEngine';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { DataStats } from './DataStats';
import { Loader2, Sparkles, Database } from 'lucide-react';

interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function FinanceChatbot() {
  const { holdings, trades, isLoading, error } = useFinanceData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistoryMessage[]>([]);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize RAG Index
  useEffect(() => {
    if (!isLoading && holdings.length > 0) {
      initializeKnowledgeBase(holdings, trades, (p) => {
        setIndexingProgress(p);
      });
    }
  }, [isLoading, holdings, trades]);

  useEffect(() => {
    if (!isLoading && holdings.length > 0 && messages.length === 0) {
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `👋 Welcome! I'm your **AI-powered Finance Data Assistant**.

I've loaded **${holdings.length.toLocaleString()}** holdings and **${trades.length.toLocaleString()}** trades for analysis.

Powered by GPT-4, I can understand natural language questions about your portfolio. Try asking:
• "What's the overall portfolio performance?"
• "Which funds are performing the best?"
• "Tell me about the security type breakdown"
• "How many trades were there this period?"

How can I help you today?`,
        timestamp: new Date(),
      }]);
    }
  }, [isLoading, holdings, trades, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = async (input: string) => {
    if (indexingProgress < 100) {
      // Optional: Block sending until ready, or just show warning
      // For now allowing it, chatEngine handles unindexed state safely.
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);

    try {
      // Convert chat history to format expected by API
      const historyForAI = chatHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      const response = await processQuestionWithAI(
        input,
        holdings,
        trades,
        historyForAI
      );

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update chat history for context
      setChatHistory(prev => [
        ...prev,
        { role: 'user' as const, content: input },
        { role: 'assistant' as const, content: response }
      ].slice(-6)); // Keep last 3 exchanges

    } catch (err) {
      console.error('Error processing question:', err);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error processing your question. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-center py-3 border-b border-border gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">AI Finance Assistant</h1>
        <span className="text-xs text-muted-foreground bg-primary/10 px-2 py-0.5 rounded-full">GPT-4 RAG</span>
        {indexingProgress < 100 && (
          <div className="flex items-center gap-1 text-xs text-blue-500 animate-pulse">
            <Database className="w-3 h-3" />
            Index: {indexingProgress}%
          </div>
        )}
      </header>

      {/* Data Stats */}
      {!isLoading && <DataStats holdings={holdings} trades={trades} />}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto" ref={scrollRef}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Loading financial data...</p>
          </div>
        ) : (
          <div>
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isThinking && (
              <div className="py-6 px-4 md:px-0 bg-muted/40">
                <div className="max-w-3xl mx-auto flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1 flex items-center">
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading || isThinking || indexingProgress < 100} />
    </div>
  );
}
