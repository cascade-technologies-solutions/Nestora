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
    text: "Hi there! Welcome to Nestora. How can we help you with your construction, renovation, waterproofing, fabrication, or real estate project today?",
    isUser: false,
    timestamp: new Date(),
  },
];

const responses = [
  {
    keywords: ["hi", "hello", "hey"],
    response: "Hello! Welcome to Nestora. How can we assist you with our engineering, construction, or real estate services today?",
  },
  {
    keywords: ["service", "services", "divisions", "what do you do"],
    response: "Nestora provides expert solutions across 7 divisions: 1. Construction Works, 2. Renovation & Repair, 3. Waterproofing, 4. Metal Fabrication, 5. Earthmoving, 6. Real Estate, and 7. Corporation Official Works.",
  },
  {
    keywords: ["construction", "build", "building", "civil"],
    response: "Our construction division handles residential and commercial buildings, civil works, and site development from design blueprints to structural execution.",
  },
  {
    keywords: ["renovation", "repair", "remodel", "upgrade", "fix", "crack"],
    response: "We execute complete residential and commercial upgrades, layout remodelling, structural restorations, and plaster repairs.",
  },
  {
    keywords: ["waterproofing", "leakage", "seepage", "leak", "dampness", "roof"],
    response: "We apply professional chemical, polyurethane, and membrane waterproofing systems for terraces, roofs, walls, and bathrooms.",
  },
  {
    keywords: ["fabrication", "welding", "gate", "steel", "metal", "truss"],
    response: "Our fabrication workshop delivers custom metal works, steel roof trusses, gates, security grilles, and heavy structural framing.",
  },
  {
    keywords: ["earthmoving", "excavation", "levelling", "clearance", "site clearing", "soil"],
    response: "We execute land levelling, site clearing, foundation excavation, and general earthmoving works using modern equipment.",
  },
  {
    keywords: ["corporation", "municipal", "document", "official", "paperwork", "tax"],
    response: "We provide assistance and coordination for corporation-related property documentation, applications, and official municipal processes (no direct legal representation or government affiliation).",
  },
  {
    keywords: ["real estate", "property", "buy", "sell", "plots", "villa", "apartment", "house"],
    response: "Our property division lists verified commercial structures, apartments, and land plots in Hubli. Explore our Real Estate page for listings!",
  },
  {
    keywords: ["contact", "agent", "help", "call", "email", "address", "phone", "enquiry"],
    response: "Please navigate to our Contact page. There, you can submit a detailed enquiry form or find our office phone and email options if configured.",
  },
  {
    keywords: ["thank", "thanks", "ok", "cool"],
    response: "You're welcome! Let us know if you have any other project requirements or questions.",
  }
];

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
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

    const userMessage: Message = {
      text: input,
      isUser: true,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    
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
    
    for (const item of responses) {
      if (item.keywords.some(keyword => input.includes(keyword))) {
        return item.response;
      }
    }
    
    return "I'm not sure how to respond to that. You can ask about our construction, waterproofing, renovation, fabrication, earthmoving, or real estate divisions, or check our Contact page to write to us.";
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
              <h3 className="font-medium text-sm">Nestora Assistant</h3>
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
              <div className="flex-1 overflow-y-auto p-4 text-xs">
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
                        "p-2.5 rounded-lg leading-relaxed",
                        message.isUser
                          ? "bg-Nestora-blue text-white rounded-tr-none"
                          : "bg-gray-100 text-gray-800 rounded-tl-none"
                      )}
                    >
                      {message.text}
                    </div>
                    <p className={cn(
                      "text-[10px] mt-1 text-gray-400",
                      message.isUser ? "text-right" : "text-left"
                    )}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex items-center mb-3">
                    <div className="bg-gray-100 text-gray-800 p-2.5 rounded-lg rounded-tl-none">
                      <div className="flex space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
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
                  className="flex-1 border border-gray-300 rounded-l-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-Nestora-blue text-xs"
                />
                <Button 
                  type="submit" 
                  className="bg-Nestora-blue hover:bg-Nestora-blue/90 rounded-l-none rounded-r-lg px-3"
                >
                  <Send className="h-3.5 w-3.5" />
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
