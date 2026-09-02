import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SendHorizontal, Paperclip, Loader2, CheckCircle2, RefreshCcw, Package, PackageX, AlertTriangle, CreditCard, Search } from 'lucide-react';
import { ChatMessage } from '../../types/support';
import PurchaseSearch from '../workflow/PurchaseSearch';

export default function ChatPanel({ messages, setMessages }: { messages: ChatMessage[], setMessages: any }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Widget state (Simulated global state for the purchase widget)
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selectedIssue, setSelectedIssue] = useState('refund');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendText = (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      kind: 'text',
      text: text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    setMessages((prev: any) => [...prev, userMsg]);
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      if (text.toLowerCase().includes('find') || text.toLowerCase().includes('search') || text.toLowerCase().includes('purchase')) {
        setMessages((prev: any) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          kind: 'widget_search', // custom kind for widget
          text: 'Sure, I can help you find that. You can search below:',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      } else {
        setMessages((prev: any) => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          kind: 'text',
          text: `I'm analyzing your request regarding "${text}". Could you provide an Order ID or let me search your recent transactions?`,
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      }
    }, 800);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendText(input);
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative w-full h-[calc(100vh-120px)]">
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col relative z-10">
        
        {messages.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center -mt-10"
          >
            <motion.div 
              animate={{ y: ["-10px", "10px"] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="w-48 h-48 mb-6"
            >
              {/* Fallback to /robot.png if krish.png is not ready */}
              <img src="/krish.png" alt="Krish AI" className="w-full h-full object-contain" onError={(e) => e.currentTarget.src='/robot.png'} />
            </motion.div>
            
            <h2 className="text-[32px] font-[800] text-white mb-2 tracking-tight">Hi! I'm Krish 👋</h2>
            <p className="text-white/50 mb-10 text-[16px]">Tell me what happened, and I'll look into it for you.</p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-3xl px-2">
              <IssuePrompt icon={RefreshCcw} label="I want a refund" onClick={() => sendText("I want a refund for a recent purchase")} color="text-emerald-400" />
              <IssuePrompt icon={Package} label="I need a replacement" onClick={() => sendText("I need a replacement")} color="text-blue-400" />
              <IssuePrompt icon={PackageX} label="Received wrong item" onClick={() => sendText("I received the wrong item")} color="text-purple-400" />
              <IssuePrompt icon={AlertTriangle} label="Product was damaged" onClick={() => sendText("My product was damaged")} color="text-orange-400" />
              <IssuePrompt icon={CreditCard} label="Payment issue" onClick={() => sendText("I have a payment issue")} color="text-red-400" />
              <IssuePrompt icon={Search} label="Find a purchase" onClick={() => sendText("Can you help me find a purchase?")} color="text-cyan-400" />
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6 pb-20">
            {messages.map((m: any) => {
              const isUser = m.role === 'user';
              return (
                <motion.div 
                  key={m.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 mt-1 shrink-0 overflow-hidden border border-white/10">
                       <img src="/krish.png" alt="Bot" className="w-[120%] h-[120%] object-contain" onError={(e) => e.currentTarget.src='/robot.png'} />
                     </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                    {m.kind === 'text' && (
                      <div className={`p-4 text-[15px] leading-[1.5] shadow-lg ${isUser ? 'bg-white text-black rounded-2xl rounded-tr-sm font-medium' : 'bg-[#111] text-white rounded-2xl rounded-tl-sm border border-white/[0.05]'}`}>
                        {m.text}
                      </div>
                    )}

                    {m.kind === 'widget_search' && (
                      <div className="flex flex-col gap-3 w-full">
                        <div className="p-4 text-[15px] leading-[1.5] shadow-lg bg-[#111] text-white rounded-2xl rounded-tl-sm border border-white/[0.05] self-start max-w-fit">
                          {m.text}
                        </div>
                        <div className="w-[800px] max-w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl mt-2">
                          <PurchaseSearch 
                            query={query} setQuery={setQuery}
                            results={results} setResults={setResults}
                            selectedIssue={selectedIssue} setSelectedIssue={setSelectedIssue}
                            setStage={() => {}} // dummy
                          />
                        </div>
                      </div>
                    )}

                    <span className="text-[11px] text-white/30 mt-1.5 px-1">{m.timestamp}</span>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="p-4 bg-transparent sticky bottom-0 z-20">
        <div className="relative flex items-end border border-white/[0.1] rounded-2xl bg-[#0a0a0a]/80 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] focus-within:border-white/30 transition-colors p-1.5 mx-auto max-w-3xl">
          <button className="p-3 text-white/40 hover:text-white transition rounded-xl">
            <Paperclip size={20} />
          </button>
          <textarea 
            placeholder="Message Krish..."
            className="flex-1 max-h-32 min-h-[44px] py-3 text-[15px] bg-transparent focus:outline-none resize-none custom-scrollbar text-white placeholder-white/30"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-3 m-1 bg-white hover:bg-gray-200 text-black rounded-xl disabled:opacity-30 transition-all shadow-sm"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
        <p className="text-center text-white/30 text-[11px] mt-3">RazorSense AI can make mistakes. Please verify important information.</p>
      </div>
    </div>
  );
}

function IssuePrompt({ icon: Icon, label, onClick, color }: any) {
  return (
    <motion.button 
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex flex-col items-center justify-center p-5 rounded-2xl border border-white/[0.05] bg-[#111]/50 backdrop-blur-sm transition-colors text-center h-full hover:border-white/20"
    >
      <Icon size={24} className={`mb-3 ${color}`} />
      <span className="text-[13px] font-semibold text-white/90">{label}</span>
    </motion.button>
  );
}
