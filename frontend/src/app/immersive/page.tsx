"use client";
import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Bot, ArrowRight, Sparkles, Shield, Cpu, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ImmersivePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -50]);
  const router = useRouter();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-[200vh] bg-[#030303] text-white font-sans selection:bg-white/30 overflow-hidden">
      
      {/* Dynamic Glowing Mouse Follower */}
      <motion.div 
        className="fixed top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/10 to-transparent rounded-full mix-blend-screen pointer-events-none blur-[120px] z-0"
        animate={{
          x: mousePosition.x - 300,
          y: mousePosition.y - 300,
        }}
        transition={{ type: "tween", ease: "backOut", duration: 0.8 }}
      />
      
      {/* Dark gradient overlay at the bottom for scroll depth */}
      <div className="fixed bottom-0 w-full h-[30vh] bg-gradient-to-t from-[#030303] to-transparent pointer-events-none z-20"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 px-10 flex justify-between items-center z-50 backdrop-blur-xl border-b border-white/[0.04] bg-[#030303]/50">
        <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
          <div className="w-8 h-8 bg-white text-black rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]">
            <Sparkles size={16} />
          </div>
          RazorSense<span className="text-white/40">.AI</span>
        </div>
        <button 
          onClick={() => router.push('/chat')}
          className="px-6 py-2.5 bg-white/5 hover:bg-white text-white hover:text-black rounded-full font-semibold text-sm transition-all duration-500 backdrop-blur-md border border-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
        >
          Launch App
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center pt-20 z-10 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-center flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-widest uppercase text-white/70 mb-10 backdrop-blur-md hover:bg-white/10 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
            RazorSense Engine v2.0 Live
          </div>
          
          <h1 className="text-[5rem] md:text-[9rem] font-[800] tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white via-white/90 to-white/20 mb-6 drop-shadow-2xl text-center">
            Resolve.
            <br />
            <span className="italic font-light opacity-80">Instantly.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-white/50 max-w-2xl mx-auto font-light tracking-wide leading-relaxed">
            The world's first autonomous AI support engine for fintech. Zero wait times. Absolute precision.
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 2 }}
          className="absolute bottom-12 flex flex-col items-center gap-4"
        >
          <span className="text-[10px] tracking-[0.2em] uppercase text-white/30 font-semibold">Scroll to explore</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white/50 to-transparent animate-pulse"></div>
        </motion.div>
      </section>

      {/* Bento Grid Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <motion.div style={{ y: y1 }} className="md:col-span-2 h-[450px] bg-white/[0.02] border border-white/[0.05] rounded-[32px] p-12 relative overflow-hidden group backdrop-blur-sm hover:bg-white/[0.04] transition-colors duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-8 border border-indigo-500/30">
                <Cpu size={32} className="text-indigo-400" />
              </div>
              <h3 className="text-4xl font-semibold mb-4 tracking-tight">Neural Decision Engine</h3>
              <p className="text-white/50 text-xl max-w-md leading-relaxed font-light">Our proprietary LLM analyzes transaction history, user intent, and merchant policies in milliseconds.</p>
            </div>
            
            {/* Abstract Decorative Element */}
            <div className="absolute -bottom-20 -right-20 w-96 h-96 border border-white/5 rounded-full group-hover:scale-110 transition-transform duration-1000 ease-out flex items-center justify-center">
               <div className="w-72 h-72 border border-white/5 rounded-full flex items-center justify-center">
                 <div className="w-48 h-48 border border-white/5 rounded-full"></div>
               </div>
            </div>
          </motion.div>

          <motion.div style={{ y: y2 }} className="h-[450px] bg-white/[0.02] border border-white/[0.05] rounded-[32px] p-12 relative overflow-hidden group backdrop-blur-sm hover:bg-white/[0.04] transition-colors duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-8 border border-emerald-500/30">
                <Shield size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-3xl font-semibold mb-4 tracking-tight">Cryptographic Proof</h3>
              <p className="text-white/50 text-lg leading-relaxed font-light">Every resolution is verified on-chain against payment gateways.</p>
            </div>
          </motion.div>
          
          <motion.div style={{ y: y1 }} className="h-[450px] bg-white/[0.02] border border-white/[0.05] rounded-[32px] p-12 relative overflow-hidden group backdrop-blur-sm hover:bg-white/[0.04] transition-colors duration-700">
            <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-0"></div>
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center mb-8 border border-fuchsia-500/30">
                <ImageIcon size={32} className="text-fuchsia-400" />
              </div>
              <h3 className="text-3xl font-semibold mb-4 tracking-tight">Vision AI</h3>
              <p className="text-white/50 text-lg leading-relaxed font-light">Upload photos of damaged goods. Our vision model detects deepfakes instantly.</p>
            </div>
          </motion.div>

          <motion.div style={{ y: y2 }} className="md:col-span-2 h-[450px] bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10 rounded-[32px] p-12 relative overflow-hidden group backdrop-blur-md flex flex-col md:flex-row items-center justify-between">
            <div className="relative z-10 max-w-md">
              <h3 className="text-4xl md:text-5xl font-bold mb-4 tracking-tighter">Ready to experience it?</h3>
              <p className="text-white/60 text-xl mb-10 font-light">Enter the workspace and let Razor handle the rest.</p>
              <button 
                onClick={() => router.push('/chat')}
                className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                Enter Workspace <ArrowRight size={20} />
              </button>
            </div>
            
            <div className="relative z-10 w-64 h-64 mt-10 md:mt-0 flex-shrink-0">
              <div className="absolute inset-0 border-[2px] border-white/20 rounded-full animate-[spin_10s_linear_infinite] border-t-white/80"></div>
              <div className="absolute inset-4 border-[2px] border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse] border-b-white/60"></div>
              <div className="absolute inset-8 bg-white/5 rounded-full backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.1)] group-hover:bg-white/10 transition-colors duration-500">
                <Bot size={56} className="text-white" />
              </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-white/10 transition-colors duration-1000"></div>
          </motion.div>

        </div>
      </section>

    </div>
  );
}
