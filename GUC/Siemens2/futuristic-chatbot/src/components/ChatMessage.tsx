import React from 'react';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex items-start gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
        isUser 
          ? 'bg-gradient-to-br from-secondary to-accent' 
          : 'bg-primary-gradient shadow-neon'
      }`}>
        {isUser ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>

      {/* Message Bubble */}
      <div className={`backdrop-blur-glass rounded-modern px-6 py-4 max-w-[80%] animate-fade-in ${
        isUser 
          ? 'bg-primary/20 border border-primary/30 shadow-glass' 
          : 'bg-card border border-border/50 shadow-glass'
      }`}>
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
