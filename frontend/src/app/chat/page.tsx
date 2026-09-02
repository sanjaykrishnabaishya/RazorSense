"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShieldCheck, ChevronRight, RefreshCcw, PackageX, 
  AlertTriangle, CreditCard, Paperclip, Send, Bot, Scan, 
  CheckCircle2, Box, Zap, Sparkles, ServerCrash, CreditCard as CardIcon
} from 'lucide-react';

export default function ImmersiveDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [orderFound, setOrderFound] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  type Message = {
    id: string;
    role: 'user' | 'ai' | 'system';
    content: string;
    isAction?: boolean;
    timestamp: string;
  };

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'ai', 
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      content: 'Greetings. I am RazorSense Neural Engine. I can autonomously resolve disputes, analyze evidence, and process refunds.\n\nPlease enter your transaction ID or describe your issue to begin.' 
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearch = () => {
    if(!searchQuery) return;
    setOrderFound(true);
    setActiveStep(2);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'system',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      content: 'Transaction locked. Merchant: Zomato. Risk assessment initiated.'
    }]);
  };

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg = chatInput;
    const newId = Date.now().toString();
    
    setMessages(prev => [...prev, { 
      id: newId,
      role: 'user', 
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      content: userMsg 
    }]);
    setChatInput('');
    setActiveStep(3);
    
    // Add loading action
    const loadingId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { 
      id: loadingId,
      role: 'ai', 
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      isAction: true, 
      content: 'Analyzing neural pathways and cross-referencing merchant policies...' 
    }]);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: searchQuery || "UNKNOWN",
          message: userMsg,
          chat_history: messages.map(m => ({ role: m.role, content: m.content })).filter(m => m.role !== 'system')
        })
      });
      
      const data = await response.json();
      
      setMessages(prev => prev.map(m => {
        if (m.id === loadingId) {
          return {
            ...m,
            content: data.status === 'decided' ? `Final Decision: ${data.decision}` : data.reply,
            isAction: data.status === 'decided'
          };
        }
        return m;
      }));
      
    } catch (error) {
      setMessages(prev => prev.map(m => {
        if (m.id === loadingId) {
          return {
            ...m,
            content: 'Neural connection lost. Ensure FastAPI backend is running on port 8000.',
            isAction: false
          };
        }
        return m;
      }));
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] text-white font-sans selection:bg-cyan-500/30 flex overflow-hidden">
      
      {/* Background Animated Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px] mix-blend-screen animate-pulse duration-10000"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-900/10 blur-[120px] mix-blend-screen"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-cyan-900/10 blur-[120px] mix-blend-screen"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-white/5 bg-black/40 backdrop-blur-xl z-10 flex flex-col items-center lg:items-start py-8">
        <div className="flex items-center gap-3 px-6 mb-12">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400 blur-md opacity-50 rounded-full"></div>
            <ShieldCheck className="relative text-cyan-400 z-10" size={32} />
          </div>
          <span className="hidden lg:block font-bold text-xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">RazorSense</span>
        </div>
        
        <div className="w-full flex flex-col gap-2 px-3">
          <SidebarItem icon={Box} label="Active Disputes" active />
          <SidebarItem icon={ServerCrash} label="Root Cause Engine" />
          <SidebarItem icon={Scan} label="Vision Analysis" />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 lg:p-8 z-10 h-screen overflow-hidden">
        
        {/* Left Column: Context & Evidence */}
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
          
          <header className="mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-widest uppercase mb-3">
              <Sparkles size={12} /> AI Resolution Pipeline
            </div>
            <h1 className="text-3xl lg:text-4xl font-light tracking-tight mb-2">
              Autonomous <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Dispute Control</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-md">Our neural engine securely processes claims, analyzes multimedia evidence, and resolves disputes instantly.</p>
          </header>

          {/* Timeline Stepper */}
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex justify-between relative">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/5 -translate-y-1/2 z-0"></div>
              <div className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500 -translate-y-1/2 z-0 transition-all duration-1000" style={{ width: `${((activeStep - 1) / 3) * 100}%` }}></div>
              
              {['Detect', 'Verify', 'Analyze', 'Resolve'].map((step, idx) => {
                const isActive = activeStep >= idx + 1;
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500
                      ${isActive ? 'bg-cyan-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'bg-gray-800 text-gray-500 border border-white/10'}
                    `}>
                      {isActive ? <CheckCircle2 size={16} /> : idx + 1}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-cyan-400' : 'text-gray-500'}`}>{step}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Search / Context Panel */}
          <motion.div layout className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-6 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
              <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <Search size={16} className="text-cyan-400" /> Locate Transaction
              </h3>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Enter Order ID, Email, or Transaction Hash..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  onClick={handleSearch}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black px-6 py-3 rounded-xl font-semibold text-sm transition shadow-[0_0_20px_rgba(6,182,212,0.3)]"
                >
                  Fetch
                </button>
              </div>
            </div>

            <AnimatePresence>
              {orderFound && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-6 bg-gradient-to-r from-blue-900/10 to-transparent"
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 font-bold text-xl">
                      Z
                    </div>
                    <div>
                      <h4 className="font-semibold text-white">Zomato Delivery</h4>
                      <p className="text-xs text-gray-400">Order ID: #{searchQuery || 'ZOM-882910'} • 2 hrs ago</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="font-mono text-cyan-400 font-semibold">₹499.00</p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 justify-end"><CheckCircle2 size={10} className="text-green-500"/> Payment Verified</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">AI Verification Checklist</div>
                    <VerificationItem text="Merchant identity cryptographically verified" />
                    <VerificationItem text="Payment gateway transaction matched" />
                    <VerificationItem text="User purchase history analyzed for fraud risk" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Quick Issue Chips */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
             <IssueChip icon={RefreshCcw} label="Refund Request" />
             <IssueChip icon={PackageX} label="Missing Item" />
             <IssueChip icon={AlertTriangle} label="Damaged Goods" />
             <IssueChip icon={CardIcon} label="Double Charge" />
          </div>

        </div>

        {/* Right Column: AI Neural Interface (Chat) */}
        <div className="w-full lg:w-[480px] h-[calc(100vh-4rem)] flex flex-col bg-[#0A0D14]/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
          
          {/* Neural Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-white/5 to-transparent border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 blur-md opacity-40 rounded-full animate-pulse"></div>
                <div className="w-10 h-10 bg-gray-900 border border-cyan-500/30 rounded-full flex items-center justify-center relative z-10">
                  <Bot size={18} className="text-cyan-400" />
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-sm text-gray-100">RazorSense AI</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Neural Link Active</span>
                </div>
              </div>
            </div>
            <button className="text-gray-500 hover:text-white transition"><Scan size={18} /></button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div 
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className={`flex flex-col ${m.role === 'user' ? 'items-end' : m.role === 'system' ? 'items-center' : 'items-start'} gap-1`}
                >
                  {m.role === 'system' ? (
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest my-2 flex items-center gap-2">
                      <div className="w-4 h-[1px] bg-gray-600"></div>
                      {m.content}
                      <div className="w-4 h-[1px] bg-gray-600"></div>
                    </div>
                  ) : (
                    <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-lg
                      ${m.role === 'user' 
                        ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-sm' 
                        : m.isAction
                          ? 'bg-white/5 border border-white/10 text-gray-300 rounded-tl-sm'
                          : 'bg-[#151A26] border border-white/5 text-gray-200 rounded-tl-sm'
                      }
                    `}>
                      {m.content}

                      {/* Animated Action Block inside AI message */}
                      {m.isAction && (
                        <div className="mt-4 bg-black/40 border border-white/5 rounded-xl p-4">
                           <div className="flex items-center justify-between mb-3">
                             <span className="text-xs text-cyan-400 font-medium flex items-center gap-2">
                               <Zap size={12} className="animate-pulse" /> Processing logic branch...
                             </span>
                             <div className="w-3 h-3 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                           </div>
                           <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-cyan-500"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                              ></motion.div>
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                  {m.role !== 'system' && <span className="text-[10px] text-gray-500 px-2">{m.timestamp}</span>}
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gradient-to-t from-[#0A0D14] to-transparent">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative flex items-end gap-2 bg-[#1A1F2C] border border-white/10 rounded-2xl p-2 shadow-inner">
                <button className="p-3 text-gray-400 hover:text-cyan-400 transition bg-black/20 rounded-xl">
                  <Paperclip size={18} />
                </button>
                <textarea 
                  placeholder="Describe your issue or upload evidence..." 
                  className="flex-1 bg-transparent text-sm text-white focus:outline-none py-3 resize-none max-h-32 min-h-[44px] custom-scrollbar"
                  rows={1}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button 
                  onClick={handleSend}
                  className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] transition"
                >
                  <Send size={18} className="ml-0.5" />
                </button>
              </div>
            </div>
            <div className="text-center mt-3">
              <span className="text-[9px] text-gray-500 uppercase tracking-widest">End-to-End Encrypted AI Processing</span>
            </div>
          </div>

        </div>
      </main>

      {/* Global CSS for scrollbars */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 rounded-xl transition ${active ? 'bg-white/10 text-white border border-white/5 shadow-inner' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
      <Icon size={20} className={active ? "text-cyan-400" : ""} />
      <span className="hidden lg:block text-sm font-medium">{label}</span>
    </button>
  );
}

function VerificationItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 bg-black/20 p-2.5 rounded-lg border border-white/5">
      <div className="bg-green-500/20 rounded-full p-0.5 mt-0.5"><CheckCircle2 size={12} className="text-green-500" /></div>
      <span className="text-xs text-gray-300 leading-tight">{text}</span>
    </div>
  );
}

function IssueChip({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <button className="flex flex-col items-center justify-center gap-2 p-4 bg-white/[0.02] border border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 rounded-2xl transition group text-center">
      <Icon size={24} className="text-gray-500 group-hover:text-cyan-400 transition" />
      <span className="text-[11px] font-semibold text-gray-300 group-hover:text-white">{label}</span>
    </button>
  );
}
