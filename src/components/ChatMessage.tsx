import { Message } from '@/types/finance';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === 'assistant';
  
  // Simple markdown-like parsing for bold text
  const parseContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={cn(
        'flex gap-3 p-4 rounded-lg',
        isAssistant 
          ? 'bg-muted/50' 
          : 'bg-primary/10'
      )}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isAssistant 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground mb-1">
          {isAssistant ? 'Finance Assistant' : 'You'}
        </div>
        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {parseContent(message.content)}
        </div>
      </div>
    </div>
  );
}
