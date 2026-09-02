"use client";
import React, { useState } from 'react';
import { Search, CheckCircle2, ChevronRight, RefreshCcw, PackageX, AlertTriangle, CreditCard, MoreHorizontal, Paperclip, Send, Bot, Shield, Globe, Zap, X, Minus, Maximize2, Package } from 'lucide-react';

export default function RazorSensePortal() {
  const [selectedIssue, setSelectedIssue] = useState<string | null>('refund');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  
  const [messages, setMessages] = useState([
    { role: 'ai', time: '10:24 AM', content: 'Hi! I\'m Razor, your AI support assistant.\nI can help you with refunds, replacements and any payment issue across all merchants.\n\nJust tell me what happened or share any details like order ID, merchant name, or what you bought.' },
    { role: 'user', time: '10:25 AM', content: 'I want a refund. I ordered wireless earphones from Zomato but received a different product.' },
    { role: 'ai', time: '10:25 AM', isAction: true, content: 'Got it! Let me find your purchase.\nI\'ll check your Razorpay transactions and match it with Zomato.' }
  ]);

  const issues = [
    { id: 'refund', icon: RefreshCcw, label: 'Refund', desc: 'I want a refund' },
    { id: 'replacement', icon: Package, label: 'Replacement', desc: 'I want a replacement' },
    { id: 'wrong', icon: PackageX, label: 'Wrong or different item', desc: 'Received different product' },
    { id: 'product', icon: AlertTriangle, label: 'Product issue', desc: 'Damaged / faulty' },
    { id: 'payment', icon: CreditCard, label: 'Payment issue', desc: 'Charged twice, failed payment, etc.' },
    { id: 'other', icon: MoreHorizontal, label: 'Other', desc: 'Something else' }
  ];

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { role: 'user', time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), content: chatInput }]);
    setChatInput('');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans flex flex-col">
      {/* Top Banner Area */}
      <div className="bg-[#0B132B] text-white pt-12 pb-32 px-8 relative overflow-hidden">
        {/* Background Gradients & Glows */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-900/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-purple-900/40 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/20">
              <span className="text-purple-400">✨</span> AI Support
            </div>
            <h1 className="text-5xl font-extrabold leading-tight mb-4 tracking-tight">
              Tell us the issue,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">we'll handle the rest.</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-md">
              Our AI will find your purchase, understand the issue, verify details with the merchant and help you with a <strong>refund, replacement or resolution.</strong>
            </p>
            
            <div className="flex flex-wrap gap-6 text-sm font-medium text-gray-200">
              <div className="flex items-center gap-2"><Zap className="text-green-400" size={20}/> Finds your purchase automatically</div>
              <div className="flex items-center gap-2"><Shield className="text-green-400" size={20}/> Verifies with merchant & payment records</div>
              <div className="flex items-center gap-2"><ClockIcon className="text-white" size={20}/> Fast resolution 24/7</div>
            </div>
          </div>
          
          <div className="hidden lg:flex justify-end items-center relative">
            <div className="absolute left-0 top-1/4 -rotate-12 transform">
              <p className="font-writing text-blue-200 text-lg">One chat.<br/>All your payments.<br/>Any merchant.</p>
              <svg className="w-12 h-12 text-blue-300 ml-4 mt-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </div>
            {/* Mock Robot & Logos representation */}
            <div className="relative w-72 h-72">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-pulse blur-xl"></div>
              <Bot size={180} className="text-white drop-shadow-2xl absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              
              {/* Floating Logos */}
              <div className="absolute -right-12 top-4 bg-red-500 text-white font-bold px-3 py-1 rounded shadow-lg transform rotate-6">zomato</div>
              <div className="absolute right-0 top-20 bg-white text-gray-900 font-bold px-3 py-1 rounded shadow-lg transform -rotate-6">amazon</div>
              <div className="absolute -right-8 top-36 bg-white text-blue-600 font-bold px-3 py-1 rounded shadow-lg transform rotate-3">ebay</div>
              <div className="absolute right-12 bottom-4 bg-orange-500 text-white font-bold px-3 py-1 rounded shadow-lg transform -rotate-12">swiggy</div>
              <p className="absolute -right-4 bottom-[-20px] text-gray-400 text-sm italic">... and 1000+ more</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="max-w-7xl mx-auto w-full -mt-24 z-20 relative px-4 pb-12 flex-1 flex flex-col lg:flex-row gap-6">
        
        {/* LEFT PANEL - Form/Stepper */}
        <div className="bg-white rounded-2xl shadow-xl flex-1 border border-gray-100 overflow-hidden flex flex-col">
          {/* Stepper */}
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
            {['Find Purchase', 'Verify Details', 'Analyse Issue', 'Resolution'].map((step, idx) => (
              <div key={step} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {idx + 1}
                </div>
                <span className={`text-sm font-medium hidden sm:block ${idx === 0 ? 'text-blue-600' : 'text-gray-400'}`}>{step}</span>
              </div>
            ))}
          </div>

          <div className="p-8 overflow-y-auto flex-1">
            {/* Search Box */}
            <div className="mb-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-1"><Search size={24} /></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Let's find your purchase</h2>
                  <p className="text-gray-500 text-sm">Enter any detail you remember. We'll locate your transaction across all merchants.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Order ID / Transaction ID / Merchant name (e.g. Zomato, Amazon, eBay) / Email / Phone"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="bg-[#0B132B] hover:bg-blue-900 text-white px-6 py-3 rounded-lg font-medium text-sm whitespace-nowrap flex items-center gap-2 transition">
                  Find My Purchase <ChevronRight size={16} />
                </button>
              </div>
              <button className="text-blue-600 text-sm font-medium mt-3 flex items-center gap-1 hover:underline">
                Can't find the details? Try advanced search <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-[#F4FBFA] border border-[#E0F2F1] rounded-xl p-6 mb-8 flex flex-col md:flex-row gap-8 relative overflow-hidden">
              <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-green-500">✨</div>
                  <h3 className="font-bold text-gray-900">We'll identify everything for you</h3>
                </div>
                <p className="text-gray-600 text-sm mb-4">Our AI will automatically fetch and verify:</p>
                <ul className="space-y-3 text-sm text-gray-700 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500 fill-green-100" size={18}/> Which company you purchased from</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500 fill-green-100" size={18}/> Product or service details</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500 fill-green-100" size={18}/> Payment details from Razorpay</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="text-green-500 fill-green-100" size={18}/> Whether the item matches your order</li>
                </ul>
              </div>
              
              {/* Floating Cards Graphic */}
              <div className="hidden md:block w-64 relative">
                <div className="absolute top-0 right-0 bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 w-56 z-30 transform hover:-translate-y-1 transition cursor-pointer">
                  <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center text-white font-bold text-xs">z</div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Zomato</p>
                    <p className="text-[10px] text-gray-400">Order #ZOM1234567890<br/>₹299 • 12 Aug 2024</p>
                  </div>
                </div>
                <div className="absolute top-10 right-4 bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 w-56 z-20 opacity-80 scale-95">
                  <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center text-white font-bold text-xs">a</div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Amazon</p>
                    <p className="text-[10px] text-gray-400">Order #AMZ884512<br/>₹1,499 • 5 Aug 2024</p>
                  </div>
                </div>
                <div className="absolute top-20 right-8 bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 w-56 z-10 opacity-60 scale-90">
                  <div className="w-8 h-8 text-blue-600 border rounded flex items-center justify-center font-bold text-xs">eBay</div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">eBay</p>
                    <p className="text-[10px] text-gray-400">Order #EB12345<br/>$45 • 1 Aug 2024</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Selection */}
            <div>
              <div className="flex items-start gap-4 mb-4">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mt-1"><FileTextIcon size={24} /></div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">What's the issue?</h2>
                  <p className="text-gray-500 text-sm">Select the option that best describes your issue.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {issues.map((issue) => {
                  const isSelected = selectedIssue === issue.id;
                  const Icon = issue.icon;
                  return (
                    <div 
                      key={issue.id}
                      onClick={() => setSelectedIssue(issue.id)}
                      className={`cursor-pointer rounded-xl p-4 border transition flex flex-col items-center text-center
                        ${isSelected ? 'border-green-500 bg-[#F4FBFA]' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}
                      `}
                    >
                      <Icon className={`mb-3 ${isSelected ? 'text-green-600' : 'text-blue-600'}`} size={28} />
                      <h4 className="font-bold text-sm text-gray-900 mb-1">{issue.label}</h4>
                      <p className="text-xs text-gray-500 leading-tight">{issue.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Footer Action */}
          <div className="px-8 py-4 border-t border-gray-100 flex items-center gap-4 bg-gray-50/50">
            <button className="bg-gray-200 text-gray-400 cursor-not-allowed px-8 py-3 rounded-lg font-medium text-sm flex items-center gap-2">
              Continue <ChevronRight size={16} />
            </button>
            <span className="text-gray-400 text-sm">Find your purchase first to continue</span>
          </div>
        </div>

        {/* RIGHT PANEL - Chatbot */}
        <div className="w-full lg:w-[450px] bg-white rounded-2xl shadow-xl flex flex-col border border-gray-100 overflow-hidden shrink-0">
          {/* Chat Header */}
          <div className="bg-[#F8F9FB] border-b border-gray-100 px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#0B132B] rounded-full flex items-center justify-center">
                <Bot className="text-white" size={20}/>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight">Razor AI</h3>
                <p className="text-xs text-gray-500">Always here to help • Powered by Razorpay</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-gray-400">
              <button className="p-1.5 hover:bg-gray-200 rounded"><Minus size={16}/></button>
              <button className="p-1.5 hover:bg-gray-200 rounded"><Maximize2 size={16}/></button>
              <button className="p-1.5 hover:bg-gray-200 rounded"><X size={16}/></button>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {m.role === 'ai' ? (
                  <div className="w-8 h-8 bg-[#0B132B] rounded-full flex items-center justify-center shrink-0 mt-1">
                    <Bot className="text-white" size={16}/>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center shrink-0 mt-1 text-white text-xs font-bold">
                    S
                  </div>
                )}
                
                <div className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div className={`p-4 text-sm leading-relaxed whitespace-pre-wrap shadow-sm
                    ${m.role === 'user' 
                      ? 'bg-purple-100 text-purple-900 rounded-2xl rounded-tr-sm' 
                      : m.isAction 
                        ? 'bg-gray-50 text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-2xl rounded-tl-sm'
                    }
                  `}>
                    {m.content}
                    
                    {/* Render action block if present */}
                    {m.isAction && (
                      <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm w-full">
                        <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-3">
                          <Search size={16} /> Searching your transactions...
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mb-4 overflow-hidden">
                          <div className="bg-blue-600 h-full w-[60%] rounded-full animate-pulse"></div>
                        </div>
                        <ul className="space-y-2 text-xs text-gray-500">
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 size={14}/> Checking your payments on Razorpay</li>
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 size={14}/> Matching with Zomato</li>
                          <li className="flex items-center gap-2 text-blue-600"><div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> Fetching order details</li>
                          <li className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-gray-300 ml-[1px]"></div> Verifying item information</li>
                        </ul>
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{m.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Replies & Input */}
          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F4FBFA] text-green-700 border border-green-200 rounded-full text-xs font-medium whitespace-nowrap hover:bg-green-50 transition">
                <RefreshCcw size={12}/> Refund
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-medium whitespace-nowrap hover:bg-purple-100 transition">
                <Package size={12}/> Replacement
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-full text-xs font-medium whitespace-nowrap hover:bg-orange-100 transition">
                <AlertTriangle size={12}/> Wrong item
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-medium whitespace-nowrap hover:bg-blue-100 transition">
                <CreditCard size={12}/> Payment issue
              </button>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-1 pr-1.5">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                <Paperclip size={18} />
              </button>
              <input 
                type="text" 
                placeholder="Type your message here..." 
                className="flex-1 bg-transparent text-sm focus:outline-none py-2"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-gray-500 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
          <div className="w-4 h-4 bg-blue-600 rotate-45 rounded-sm"></div> Razorpay
        </div>
        
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          <div className="flex items-start gap-3">
            <Shield className="text-gray-400 shrink-0" size={24}/>
            <div>
              <p className="font-bold text-gray-700">Secure & Private</p>
              <p className="text-xs">Your data is safe with bank-grade security</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Globe className="text-gray-400 shrink-0" size={24}/>
            <div>
              <p className="font-bold text-gray-700">Works with all merchants</p>
              <p className="text-xs">From Zomato to eBay to any business</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Zap className="text-gray-400 shrink-0" size={24}/>
            <div>
              <p className="font-bold text-gray-700">Trusted by millions</p>
              <p className="text-xs">Powering payments for businesses across the world</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Missing icons mocked inline to prevent import errors if they aren't exported by lucide-react standard
function ClockIcon(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
}
function FileTextIcon(props: any) {
  return <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>;
}
