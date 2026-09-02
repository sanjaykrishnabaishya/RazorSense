import React, { useState, useRef, useEffect } from 'react';
import { Bot, Minus, Maximize2, X, Paperclip, SendHorizontal, CheckCircle2, Loader2 } from 'lucide-react';
import { ChatMessage } from '../../types/support';

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
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-border-main p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-hero-deep flex items-center justify-center relative shadow-sm overflow-hidden">
             <img src="/robot.png" alt="Razor AI" className="w-[120%] h-[120%] object-contain" />
             <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-text-main leading-tight">Razor AI</h3>
            <p className="text-[12px] text-text-secondary">Always here to help &bull; Powered by Razorpay</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-text-muted">
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
          const bubbleClass = "p-4 text-[15px] leading-[1.45] shadow-custom-sm " + 
            (isUser 
              ? 'bg-[#F1EDFF] text-text-main rounded-2xl rounded-tr-sm border border-violet-main/10' 
              : 'bg-[#F5F7FB] text-text-main rounded-2xl rounded-tl-sm border border-border-soft');

          return (
            <div key={m.id} className={containerClass}>
              {!isUser && (
                 <div className="w-8 h-8 rounded-full bg-hero-deep flex items-center justify-center mr-3 mt-1 shrink-0 shadow-sm overflow-hidden">
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
                  <div className="bg-[#F5F7FB] border border-border-main rounded-2xl p-5 shadow-custom-sm w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <Loader2 size={16} className="text-primary animate-spin" />
                      <span className="text-[14px] font-semibold text-text-main">Searching your transactions...</span>
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

                <span className="text-[11px] text-text-muted mt-1 px-1">{m.timestamp}</span>
              </div>

              {isUser && (
                 <div className="w-8 h-8 rounded-full bg-violet-main flex items-center justify-center ml-3 mt-1 shrink-0 text-white font-bold text-[13px] shadow-sm">
                   S
                 </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="p-4 border-t border-border-main bg-white sticky bottom-0">
        <div className="flex gap-2 mb-3 overflow-x-auto custom-scrollbar pb-1">
           <QuickAction text="RefreshCcw" label="Refund" color="text-mint-dark" />
           <QuickAction text="Package" label="Replacement" color="text-violet-main" />
           <QuickAction text="PackageX" label="Wrong item" color="text-warning" />
        </div>
        <div className="relative flex items-end border border-border-main rounded-xl bg-white shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition p-1">
          <button className="p-3 text-text-secondary hover:text-primary transition rounded-lg">
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
            className="p-3 m-1 bg-primary hover:bg-primary-dark text-white rounded-lg disabled:opacity-50 transition"
          >
            <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ text, done, active }: any) {
  const textClass = done || active ? 'text-text-main' : 'text-text-muted';
  return (
    <div className="flex items-center gap-2">
      {done ? <CheckCircle2 size={16} className="text-mint-dark" /> 
       : active ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
       : <div className="w-4 h-4 border-2 border-border-main rounded-full"></div>}
      <span className={"text-[13px] " + textClass}>{text}</span>
    </div>
  );
}

function QuickAction({ label, color }: any) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-page-bg border border-border-main rounded-full text-[13px] font-semibold text-text-secondary hover:bg-white hover:border-primary transition whitespace-nowrap">
      <span className={color}>&bull;</span> {label}
    </button>
  );
}
