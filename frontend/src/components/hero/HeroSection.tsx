import React from 'react';
import { Sparkles, Zap, ShieldCheck, Clock3 } from 'lucide-react';
import MerchantOrbit from './MerchantOrbit';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative w-full h-[450px] bg-hero overflow-hidden">
      {/* Background Gradients */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="absolute top-0 right-[10%] w-[600px] h-[600px] bg-gradient-to-br from-[var(--color-violet-main)] to-[var(--color-cyan-main)] rounded-full mix-blend-screen opacity-20 blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-primary rounded-full mix-blend-screen opacity-30 blur-[100px]"></div>
      </motion.div>

      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-4 lg:px-11 h-full flex flex-col md:flex-row items-center pt-8">
        
        {/* Left Copy */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="w-full lg:w-[60%] flex flex-col items-start gap-4 -mt-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-semibold">
            <Sparkles size={14} className="text-yellow-400" /> AI Support & Vision Diagnostics
          </div>
          
          <h1 className="text-[48px] leading-[1.05] font-[800] tracking-tight text-white max-w-[600px]">
            Tell us the issue,<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B760FF] to-[#42E8FF]">we'll handle the rest.</span>
          </h1>
          
          <p className="text-[17px] text-white/40 max-w-[500px] mt-2 leading-relaxed">
            RazorSense AI will find your purchase, understand the issue using Vision AI (detecting wear & tear vs. deepfakes), verify details with the merchant, and execute a resolution.
          </p>

          <div className="flex items-center gap-6 mt-4 hidden md:flex">
            <Feature icon={Zap} text="Finds your purchase automatically" />
            <Feature icon={ShieldCheck} text="Verifies with merchant & payment records" />
            <Feature icon={Clock3} text="Fast resolution 24/7" />
          </div>
        </motion.div>

        {/* Right Illustration */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="w-full lg:w-[40%] h-full flex items-center justify-end relative mt-10 md:mt-0"
        >
           <MerchantOrbit />
        </motion.div>

      </div>
    </section>
  );
}

function Feature({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-start gap-2 max-w-[140px]">
      <Icon size={20} className="text-cyan-main shrink-0 mt-0.5" />
      <span className="text-[13px] text-white/40 leading-tight">{text}</span>
    </div>
  );
}
