import React, { useState, useRef, useEffect } from 'react';
import { Bot, Minus, Maximize2, X, Paperclip, SendHorizontal, CheckCircle2, Loader2 } from 'lucide-react';
import { ChatMessage } from '../../types/support';

export default function ChatPanel({ messages, setMessages, selectedPurchase }: any) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
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

    setTimeout(() => {
      setMessages((prev: any) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        kind: 'text',
        text: 'Got it! I am processing your request through the RazorSense neural engine.',
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-[var(--border)] p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[var(--hero-deep)] flex items-center justify-center relative shadow-sm">
             <Bot size={20} className="text-[var(--cyan)]" />
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text)] leading-tight">Razor AI</h3>
            <p className="text-[12px] text-[var(--text-secondary)]">Always here to help &bull; Powered by Razorpay</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[var(--text-muted)]">
          <button className="p-1.5 hover:bg-gray-100 rounded-md transition"><Minus size={16} /></button>
          <button className="p-1.5 hover:bg-gray-100 rounded-md transition"><Maximize2 size={14} /></button>
          <button className="p-1.5 hover:bg-gray-100 rounded-md transition"><X size={16} /></button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
        {messages.map((m: ChatMessage) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
               <div className="w-8 h-8 rounded-full bg-[var(--hero-deep)] flex items-center justify-center mr-3 mt-1 shrink-0 shadow-sm">
                 <Bot size={16} className="text-[var(--cyan)]" />
               </div>
            )}
            
            <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[78%]`}>
              {m.kind === 'text' && (
                <div className={`p-4 text-[15px] leading-[1.45] shadow-[var(--shadow-sm)]
                  ${m.role === 'user' 
                    ? 'bg-[#F1EDFF] text-[var(--text)] rounded-2xl rounded-tr-sm border border-[var(--violet)]/10' 
                    : 'bg-[#F5F7FB] text-[var(--text)] rounded-2xl rounded-tl-sm border border-[var(--border-soft)]'}
                `}>
                  {m.text}
                </div>
              )}
              
              {m.kind === 'progress' && (
                <div className="bg-[#F5F7FB] border border-[var(--border)] rounded-2xl p-5 shadow-[var(--shadow-sm)] w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <Loader2 size={16} className="text-[var(--primary)] animate-spin" />
                    <span className="text-[14px] font-semibold text-[var(--text)]">Searching your transactions...</span>
                  </div>
                  <div className="h-1.5 bg-[var(--border)] rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-[var(--primary)] w-3/4 animate-pulse rounded-full"></div>
                  </div>
                  <div className="space-y-2">
                    <ProgressRow text="Checking your payments on Razorpay" done />
                    <ProgressRow text="Matching with Merchant" done />
                    <ProgressRow text="Fetching order details" active />
                    <ProgressRow text="Verifying item information" />
                  </div>
                </div>
              )}

              <span className="text-[11px] text-[var(--text-muted)] mt-1 px-1">{m.timestamp}</span>
            </div>

            {m.role === 'user' && (
               <div className="w-8 h-8 rounded-full bg-[var(--violet)] flex items-center justify-center ml-3 mt-1 shrink-0 text-white font-bold text-[13px] shadow-sm">
                 S
               </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-4 border-t border-[var(--border)] bg-white sticky bottom-0">
        <div className="flex gap-2 mb-3 overflow-x-auto custom-scrollbar pb-1">
           <QuickAction text="RefreshCcw" label="Refund" color="text-[var(--mint-dark)]" />
           <QuickAction text="Package" label="Replacement" color="text-[var(--violet)]" />
           <QuickAction text="PackageX" label="Wrong item" color="text-[var(--warning)]" />
        </div>
        <div className="relative flex items-end border border-[var(--border)] rounded-xl bg-white shadow-sm focus-within:border-[var(--primary)] focus-within:ring-1 focus-within:ring-[var(--primary)] transition p-1">
          <button className="p-3 text-[var(--text-secondary)] hover:text-[var(--primary)] transition rounded-lg">
            <Paperclip size={20} />
          </button>
          <textarea 
            placeholder="Type your message here..."
            className="flex-1 max-h-32 min-h-[44px] py-3 text-[15px] focus:outline-none resize-none custom-scrollbar"
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
            className="p-3 m-1 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-lg disabled:opacity-50 transition"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ text, done, active }: any) {
  return (
    <div className="flex items-center gap-2">
      {done ? <CheckCircle2 size={16} className="text-[var(--mint-dark)]" /> 
       : active ? <div className="w-4 h-4 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
       : <div className="w-4 h-4 border-2 border-[var(--border)] rounded-full"></div>}
      <span className={`text-[13px] ${done || active ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>{text}</span>
    </div>
  );
}

function QuickAction({ label, color }: any) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--page-bg)] border border-[var(--border)] rounded-full text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-white hover:border-[var(--primary)] transition whitespace-nowrap">
      <span className={color}>&bull;</span> {label}
    </button>
  );
}
