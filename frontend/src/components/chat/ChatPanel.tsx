import React, { useState, useRef, useEffect } from 'react';
import { Bot, Minus, Maximize2, X, Paperclip, SendHorizontal, CheckCircle2, Loader2 } from 'lucide-react';
import { ChatMessage } from '../../types/support';
import { motion } from 'framer-motion';

export default function ChatPanel(props: any) {
  const { messages, setMessages, selectedPurchase } = props;
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput('');
    
    setMessages((prev: any) => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      kind: 'text',
      text: userMsg,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, stage: 'find-purchase' }) // pass actual stage if possible
      });
      const data = await res.json();
      
      setMessages((prev: any) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        kind: 'text',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);

      if (data.action === 'trigger_search') {
        props.setQuery(data.search_query || 'zomato');
        props.setIsSearching(true);
        setTimeout(() => {
          props.setIsSearching(false);
          props.setResults([
            { id: '1', merchant: 'Zomato', date: '12 Aug 2024', amount: 299, currency: 'INR', item: 'Truffle Mushroom Pasta', status: 'delivered', orderId: '#ZOM1234567890' },
            { id: '2', merchant: 'Zomato', date: '5 Aug 2024', amount: 450, currency: 'INR', item: 'Margherita Pizza', status: 'delivered', orderId: '#ZOM9876543210' }
          ]);
        }, 1500);
      }
      
      if (data.action === 'trigger_verify') {
        props.setStage('verify-details');
      }

      if (data.action === 'request_upload' || data.action === 'show_resolution') {
        props.setStage('analyse-issue');
        if (data.action === 'request_upload') props.setSelectedIssue('product');
      }
    } catch (e) {
      setMessages((prev: any) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        kind: 'text',
        text: 'Sorry, my backend is currently offline. Please ensure the FastAPI server is running.',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative">
      
      {/* Header */}
      <div className="sticky top-0 bg-transparent border-b border-white/[0.05] p-4 flex items-center justify-between z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-hero-deep flex items-center justify-center relative shadow-sm overflow-hidden">
             <img src="/robot.png" alt="Razor AI" className="w-[120%] h-[120%] object-contain" />
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-white leading-tight">Razor AI</h3>
            <p className="text-[12px] text-white/60">Always here to help &bull; Powered by Razorpay</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-white/40">
          <button className="p-1.5 hover:bg-gray-100 rounded-md transition"><Minus size={16} /></button>
          <button className="p-1.5 hover:bg-gray-100 rounded-md transition"><Maximize2 size={14} /></button>
          <button className="p-1.5 hover:bg-gray-100 rounded-md transition"><X size={16} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {messages.map((m: ChatMessage) => {
          const isUser = m.role === 'user';
          const containerClass = "flex " + (isUser ? 'justify-end' : 'justify-start');
          const innerContainerClass = "flex flex-col max-w-[78%] " + (isUser ? 'items-end' : 'items-start');
          const bubbleClass = "p-4 text-[15px] leading-[1.45] shadow-[0_0_20px_rgba(0,0,0,0.5)] " + 
            (isUser 
              ? 'bg-indigo-500/20 text-white rounded-2xl rounded-tr-sm border border-indigo-500/30' 
              : 'bg-[#030303] text-white rounded-2xl rounded-tl-sm border border-white/[0.02]');

          return (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 200, damping: 20 }}
              className={containerClass}
            >
              {!isUser && (
                 <div className="w-8 h-8 rounded-full bg-[var(--hero-deep)] flex items-center justify-center mr-3 mt-1 shrink-0 shadow-sm overflow-hidden">
                   <img src="/robot.png" alt="Bot" className="w-[120%] h-[120%] object-contain" />
                 </div>
              )}
              
              <div className={innerContainerClass}>
                {m.kind === 'text' && (
                  <div className={bubbleClass}>
                    {m.text}
                  </div>
                )}
                
                {m.kind === 'progress' && (
                  <div className="bg-[#030303] border border-white/[0.05] rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.5)] w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Loader2 size={16} className="text-primary animate-spin" />
                      <span className="text-[14px] font-semibold text-white">Searching your transactions...</span>
                    </div>
                    <div className="h-1.5 bg-border-main rounded-full mb-4 overflow-hidden">
                      <div className="h-full bg-primary w-3/4 animate-pulse rounded-full"></div>
                    </div>
                    <div className="space-y-2">
                      <ProgressRow text="Checking your payments on Razorpay" done />
                      <ProgressRow text="Matching with Merchant" done />
                      <ProgressRow text="Fetching order details" active />
                      <ProgressRow text="Verifying item information" />
                    </div>
                  </div>
                )}

                <span className="text-[11px] text-white/40 mt-1 px-1">{m.timestamp}</span>
              </div>

              {isUser && (
                 <div className="w-8 h-8 rounded-full bg-violet-main flex items-center justify-center ml-3 mt-1 shrink-0 text-white font-bold text-[13px] shadow-sm">
                   S
                 </div>
              )}
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-4 border-t border-white/[0.05] bg-transparent sticky bottom-0 backdrop-blur-md">
        <div className="relative flex items-end border border-white/[0.05] rounded-xl bg-[#030303]/60 shadow-[0_0_20px_rgba(0,0,0,0.5)] focus-within:border-white/20 transition p-1">
          <button className="p-3 text-white/60 hover:text-white transition rounded-lg">
            <Paperclip size={20} />
          </button>
          <textarea 
            placeholder="Type your message here..."
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
            className="p-3 m-1 bg-white hover:bg-white/90 text-black rounded-lg disabled:opacity-50 transition"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ text, done, active }: any) {
  const textClass = done || active ? 'text-white' : 'text-white/40';
  return (
    <div className="flex items-center gap-2">
      {done ? <CheckCircle2 size={16} className="text-mint-dark" /> 
       : active ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
       : <div className="w-4 h-4 border-2 border-white/[0.05] rounded-full"></div>}
      <span className={"text-[13px] " + textClass}>{text}</span>
    </div>
  );
}

function QuickAction({ label, color }: any) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#030303] border border-white/[0.05] rounded-full text-[13px] font-semibold text-white/60 hover:bg-[#111] hover:border-primary transition whitespace-nowrap">
      <span className={color}>&bull;</span> {label}
    </button>
  );
}
