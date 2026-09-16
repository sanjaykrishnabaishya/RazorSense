"use client";
import React, { useState, useEffect } from 'react';
import ChatPanel from '../../components/chat/ChatPanel';
import { ChatMessage } from '../../types/support';
import { Plus } from 'lucide-react';
import RazorSenseLogo from '../../components/common/RazorSenseLogo';

export default function RazorSenseApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;

    let targetX = window.innerWidth / 2;
    let targetY = 200;
    let currentX = targetX;
    let currentY = targetY;
    let rafId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      glow.style.opacity = '0.75';
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      glow.style.transform = `translate3d(${currentX - 350}px, ${currentY - 350}px, 0)`;
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className={`min-h-screen bg-[#06070a] text-white flex flex-col font-sans selection:bg-cyan-500/20 relative ${messages.length > 0 ? 'h-screen max-h-screen overflow-hidden' : 'overflow-y-auto'}`}>
      
      {/* Interactive Cursor-Following Ambient Light */}
      <div
        id="cursor-glow"
        className="pointer-events-none fixed top-0 left-0 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.15)_0%,rgba(99,102,241,0.06)_40%,transparent_70%)] blur-[90px] opacity-60 transition-opacity duration-300 z-0 will-change-transform"
      />
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[260px] bg-gradient-to-b from-blue-600/10 via-cyan-600/5 to-transparent blur-[90px]" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(#ffffff06_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />

      {/* Seamless Top Bar: Logo & Name at Top Left, Zero Black Border or Bar */}
      <div className="w-full pl-2 sm:pl-3 md:pl-4 pr-4 sm:pr-6 pt-4 pb-2 flex items-center justify-between z-20">
        <div
          onClick={() => setMessages([])}
          className="cursor-pointer flex items-center"
          title="RazorSense Home"
        >
          <RazorSenseLogo size="md" />
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white text-xs font-semibold transition active:scale-95 cursor-pointer shadow-sm"
            title="Start a new resolution session"
          >
            <Plus size={14} />
            <span>New Resolution</span>
          </button>
        )}
      </div>

      {/* Main Content Area - Seamless Expansive Container */}
      <main className={`flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col z-10 relative ${messages.length > 0 ? 'py-3 min-h-0' : 'pt-2 pb-20'}`}>
        <ChatPanel messages={messages} setMessages={setMessages} />
      </main>

    </div>
  );
}
