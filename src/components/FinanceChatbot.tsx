import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/finance';
import { useFinanceData } from '@/hooks/useFinanceData';
import { processQuestion } from '@/lib/chatEngine';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { DataStats } from './DataStats';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot } from 'lucide-react';

export function FinanceChatbot() {
  const { holdings, trades, isLoading, error } = useFinanceData();
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && holdings.length > 0 && messages.length === 0) {
      // Add welcome message
      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `👋 Welcome to the Finance Data Assistant!\n\nI've loaded **${holdings.length.toLocaleString()}** holdings and **${trades.length.toLocaleString()}** trades for analysis.\n\nYou can ask me questions like:\n• "Total holdings for Garfield"\n• "Which funds performed best?"\n• "Show me trade types breakdown"\n• "What's the P&L for Ytum?"\n\nHow can I help you today?`,
        timestamp: new Date(),
      }]);
    }
  }, [isLoading, holdings, trades, messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (input: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Process the question and generate response
    setTimeout(() => {
      const response = processQuestion(input, holdings, trades);
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 300);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/30">
        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-foreground">Finance Data Assistant</h1>
          <p className="text-xs text-muted-foreground">
            Ask questions about your holdings and trades
          </p>
        </div>
      </div>

      {/* Data Stats */}
      {!isLoading && <DataStats holdings={holdings} trades={trades} />}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Loading financial data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
