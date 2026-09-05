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
    <div className="min-h-screen bg-gradient-to-br from-[#0b0c10] via-[#0b1021] to-[#150a21] flex flex-col font-sans selection:bg-indigo-500/30 relative overflow-hidden">
      
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
          <div className="relative flex items-center justify-center animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_25px_rgba(0,191,255,1)]">
            <img src="/logo.png" alt="RazorSense Logo" className="w-10 h-10 object-contain drop-shadow-xl mix-blend-screen" style={{ filter: 'contrast(1.2) saturate(1.5)' }} />
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
      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 lg:px-0 flex flex-col pt-24 pb-20 z-10 relative">
        <ChatPanel messages={messages} setMessages={setMessages} />
      </main>

    </div>
  );
}
