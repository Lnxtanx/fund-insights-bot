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
        return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={cn(
        'py-6 px-4 md:px-0',
        isAssistant ? 'bg-muted/40' : 'bg-transparent'
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-4">
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
            isAssistant 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground border border-border'
          )}
        >
          {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>
        <div className="flex-1 min-w-0 pt-1">
          <div className="text-[15px] text-foreground whitespace-pre-wrap leading-relaxed">
            {parseContent(message.content)}
          </div>
        </div>
      </div>
    </div>
  );
}
