"use client";
import React, { useState, useEffect } from 'react';
import ChatPanel from '../../components/chat/ChatPanel';
import { ChatMessage } from '../../types/support';
import { Home } from 'lucide-react';

export default function RazorSenseApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen bg-[#030303] flex flex-col font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Mouse-tracking animated gradient */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(29, 78, 216, 0.15), transparent 80%)`
        }}
      />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 px-10 flex justify-between items-center z-50 bg-transparent">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2 text-white">
          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          RazorSense
        </div>
        
        {messages.length > 0 && (
          <button 
            onClick={() => setMessages([])}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-[14px] font-medium transition-colors backdrop-blur-md border border-white/10"
          >
            <Home size={16} />
            Home
          </button>
        )}
      </nav>

      {/* Main Chat Interface */}
      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 lg:px-0 flex flex-col pt-24 pb-8 z-10 relative">
        <ChatPanel messages={messages} setMessages={setMessages} />
      </main>

    </div>
  );
}
