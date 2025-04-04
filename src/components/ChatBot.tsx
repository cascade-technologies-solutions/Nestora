
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    text: "Hi there! How can I help you with your property search today?",
    isUser: false,
    timestamp: new Date(),
  },
];

const responses = [
  {
    keywords: ["hi", "hello", "hey"],
    response: "Hello! How can I assist with your property search today?",
  },
  {
    keywords: ["property", "properties", "home", "house"],
    response: "We have a great selection of properties in Hubli. You can use the filters above to narrow down your search!",
  },
  {
    keywords: ["price", "cost", "expensive", "cheap", "budget"],
    response: "Our properties range from affordable options to luxury estates. You can filter by price using our search panel.",
  },
  {
    keywords: ["location", "area", "where"],
    response: "We have properties in several prime locations in Hubli including Vidyanagar, Keshwapur, Navanagar, Unkal and Gokul Road.",
  },
  {
    keywords: ["contact", "agent", "help", "assistance", "call"],
    response: "You can reach our agents at contact@estateology.com or call us at +91 9876543210. We're happy to help!",
  },
  {
    keywords: ["commercial", "office", "shop", "business"],
    response: "We offer commercial properties suitable for offices, shops, and other business needs. Check our Commercial filter to see options.",
  },
  {
    keywords: ["land", "plot", "acre"],
    response: "We have various land plots available for development or investment. Use the Land filter to see current options.",
  },
  {
    keywords: ["luxury", "premium", "villa", "penthouse"],
    response: "Our luxury properties offer premium amenities and exclusive locations. Browse our Luxury collection for high-end options.",
  },
  {
    keywords: ["thank", "thanks"],
    response: "You're welcome! Don't hesitate to reach out if you need any more assistance.",
  }
];

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const toggleChat = () => {
    if (!isOpen) {
      setIsOpen(true);
      setIsMinimized(false);
    } else {
      setIsMinimized(!isMinimized);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    
    // Simulate bot thinking and typing
    setTimeout(() => {
      const botResponse = getBotResponse(input);
      const botMessage: Message = {
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 800);
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Find a matching response based on keywords
    for (const item of responses) {
      if (item.keywords.some(keyword => input.includes(keyword))) {
        return item.response;
      }
    }
    
    // Default response if no keywords match
    return "I'm not sure how to respond to that. Can you ask about our properties, locations, or services?";
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {isOpen && (
        <div 
          className={cn(
            "fixed right-6 bottom-20 z-50 bg-white rounded-lg shadow-lg w-80 flex flex-col transition-all duration-300 ease-in-out border border-gray-200",
            isMinimized ? "h-14" : "h-96"
          )}
        >
          {/* Chat header */}
          <div className="bg-Nestora-blue text-white p-3 rounded-t-lg flex justify-between items-center cursor-pointer" onClick={toggleChat}>
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Estateology Assistant</h3>
            </div>
            <div className="flex items-center gap-2">
              <ChevronDown className={cn("h-5 w-5 transition-transform", isMinimized ? "rotate-180" : "")} />
              <button onClick={(e) => { e.stopPropagation(); closeChat(); }} className="focus:outline-none">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Chat body */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={cn(
                      "mb-3 max-w-[80%]",
                      message.isUser ? "ml-auto" : "mr-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "p-3 rounded-lg",
                        message.isUser
                          ? "bg-Nestora-blue text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      )}
                    >
                      {message.text}
                    </div>
                    <p className={cn(
                      "text-xs mt-1 text-gray-500",
                      message.isUser ? "text-right" : "text-left"
                    )}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center mb-3">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-tl-none">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat input */}
              <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 flex">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-Nestora-blue"
                />
                <Button 
                  type="submit" 
                  className="bg-Nestora-blue hover:bg-Nestora-blue/90 rounded-l-none rounded-r-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </div>
      )}
      
      {/* Chat toggle button */}
      <Button
        onClick={toggleChat}
        className={cn(
            "fixed bottom-20 right-6 p-3 rounded-full z-50 bg-Nestora-blue hover:bg-Nestora-blue/90 text-white shadow-lg animate-vibrate",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        size="icon"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </>
  );
};

export default ChatBot;
