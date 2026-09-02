"use client";
import React, { useState } from 'react';
import { Send, Upload, ShieldCheck, User } from 'lucide-react';

export default function BuyerChat() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Hi there! I am RazorSense Support. I see you have an issue with Order #1046. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');

    // Simulate AI thinking and replying
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'I understand this is frustrating. Could you please upload a clear photo of the item so I can process this immediately?' 
      }]);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh]">
        
        {/* Header */}
        <header className="bg-blue-600 text-white p-4 flex items-center gap-3">
          <div className="bg-white p-2 rounded-full">
            <ShieldCheck className="text-blue-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-lg">RazorSense Support</h2>
            <p className="text-blue-100 text-xs flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              AI Agent Online
            </p>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0
                ${m.role === 'user' ? 'bg-gray-800' : 'bg-blue-100'}
              `}>
                {m.role === 'user' ? <User size={16} className="text-white" /> : <ShieldCheck size={16} className="text-blue-600" />}
              </div>
              <div className={`p-3 rounded-2xl max-w-[80%] shadow-sm text-sm
                ${m.role === 'user' ? 'bg-gray-800 text-white rounded-tr-none' : 'bg-white border border-gray-200 rounded-tl-none'}
              `}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-100 flex items-center gap-2">
          <button className="p-3 text-gray-400 hover:text-blue-600 transition bg-gray-50 hover:bg-blue-50 rounded-full">
            <Upload size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="p-3 bg-blue-600 text-white hover:bg-blue-700 transition rounded-full shadow-md"
          >
            <Send size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}
