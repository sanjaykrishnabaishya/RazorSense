"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ImmersivePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-blue-950/40 via-[#030303] to-[#030303] text-white font-sans selection:bg-white/30 overflow-hidden flex flex-col">
      
      {/* Dynamic Glowing Mouse Follower */}
      <motion.div 
        className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-transparent rounded-full mix-blend-screen pointer-events-none blur-[120px] z-0"
        animate={{
          x: mousePosition.x - 300,
          y: mousePosition.y - 300,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.8 }}
      />
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 px-10 flex justify-between items-center z-50 bg-transparent">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="relative flex items-center justify-center animate-pulse drop-shadow-[0_0_15px_rgba(59,130,246,0.8)] transition-all duration-500 hover:scale-110 hover:drop-shadow-[0_0_25px_rgba(0,191,255,1)]">
            <img src="/logo.png" alt="RazorSense Logo" className="w-10 h-10 object-contain drop-shadow-xl mix-blend-screen" style={{ filter: 'contrast(1.2) saturate(1.5)' }} />
          </div>
          RazorSense
        </div>
        <button 
          onClick={() => router.push('/chat')}
          className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] cursor-pointer"
        >
          Launch Chat →
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center z-10 px-6">
        <div className="text-center flex flex-col items-center mt-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-widest uppercase text-white/70 mb-10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
            RazorSense Engine v2.0 Live
          </div>
          
          <h1 className="text-[5rem] md:text-[8rem] font-[800] tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/30 mb-8 drop-shadow-2xl text-center">
            Resolve.
            <br />
            <span className="italic font-light opacity-85">Instantly.</span>
          </h1>
          
          <button 
            onClick={() => router.push('/chat')}
            className="flex items-center gap-3 px-10 py-5 bg-white text-black hover:bg-gray-100 rounded-full font-bold text-xl transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.6)] hover:scale-105 active:scale-95 cursor-pointer"
          >
            Get Assistance <ArrowRight size={24} />
          </button>
        </div>
      </section>
    </div>
  );
}
