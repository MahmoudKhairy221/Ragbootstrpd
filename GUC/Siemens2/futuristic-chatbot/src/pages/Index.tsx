import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Bot } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const Index: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm a futuristic AI chatbot interface. In production, I would connect to your AI backend to provide intelligent responses. You can integrate with Lovable AI, OpenAI, or any other AI service."
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const LoadingIndicator = () => (
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 bg-primary-gradient shadow-neon">
        <Bot className="w-5 h-5" />
      </div>
      <div className="backdrop-blur-glass rounded-modern px-6 py-4 max-w-[80%] animate-fade-in bg-card border border-border/50 shadow-glass">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-bounce-dot-1"></div>
          <div className="w-2 h-2 rounded-full bg-secondary animate-bounce-dot-2"></div>
          <div className="w-2 h-2 rounded-full bg-accent animate-bounce-dot-3"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Three-layer background */}
      {/* Fixed gradient mesh overlay */}
      <div className="fixed inset-0 bg-mesh-gradient opacity-50 pointer-events-none"></div>
      
      {/* Floating purple orb */}
      <div className="absolute w-24 h-24 rounded-full blur-[120px] opacity-60 bg-primary animate-float top-20 left-20"></div>
      
      {/* Floating cyan orb */}
      <div className="absolute w-24 h-24 rounded-full blur-[120px] opacity-60 bg-secondary animate-float-delayed bottom-20 right-20"></div>

      {/* Header */}
      <header className="sticky top-0 backdrop-blur-glass bg-card border-b border-border/50 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-gradient rounded-modern">
              <Sparkles className="w-8 h-8 text-primary animate-glow-pulse" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-primary-gradient bg-clip-text text-transparent">Futuristic AI Chat</h1>
              <p className="text-foreground/70 text-sm">Powered by advanced AI technology</p>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto px-6 py-8">
        <div className="flex-1 space-y-6 overflow-y-auto scrollbar-hide">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role}
              content={message.content}
            />
          ))}
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="backdrop-blur-glass bg-card border-t border-border/50 p-4 mt-8">
          <div className="flex gap-4 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message here... (Enter to send, Shift+Enter for new line)"
              className="w-full bg-background/50 backdrop-blur-sm border border-border/50 rounded-modern px-4 py-3 text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none min-h-[80px]"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-primary-gradient text-white px-6 py-3 rounded-modern font-semibold transition-all duration-300 hover:shadow-neon hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center gap-2 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
