"use client";
import React, { useState } from 'react';
import ChatPanel from '../../components/chat/ChatPanel';
import { WorkflowStage, Purchase, IssueType, ChatMessage } from '../../types/support';

export default function RazorSenseApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950/60 via-[#030303] to-[#030303] flex flex-col font-sans selection:bg-cyan-500/30">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 px-10 flex justify-between items-center z-50 bg-transparent pointer-events-none">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>
          RazorSense
        </div>
      </nav>

      {/* Main Chat Interface */}
      <main className="flex-1 w-full max-w-[900px] mx-auto px-4 lg:px-0 flex flex-col pt-24 pb-8 z-10 relative">
        <ChatPanel messages={messages} setMessages={setMessages} />
      </main>

    </div>
  );
}
