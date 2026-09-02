import React from 'react';
import { motion } from 'framer-motion';

export default function MerchantOrbit() {
  const floatTransition = (delay: number) => ({
    y: ["-10px", "10px"],
    transition: {
      y: {
        duration: 2.5 + Math.random(),
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
        delay: delay
      }
    }
  });

  return (
    <div className="relative w-full max-w-[400px] h-[300px] flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center -mr-16 mt-8">
        
        {/* Core Robot */}
        <motion.div 
          animate={{ y: ["-10px", "10px"] }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          className="relative z-20 w-[220px] h-[220px] rounded-full bg-hero-deep border border-border-main/20 flex items-center justify-center shadow-custom-lg overflow-hidden"
        >
          <img src="/robot.png" alt="AI Bot" className="w-[110%] h-[110%] object-contain mt-4" />
        </motion.div>

        {/* Speech Bubble */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
          className="absolute -top-16 -left-10 bg-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg z-30"
        >
          <p className="text-[13px] font-semibold text-primary-dark">Hi! I’m Razor</p>
          <p className="text-[11px] text-text-secondary leading-tight max-w-[140px] mt-0.5">I can help you with refunds, replacements and any payment issue across all merchants.</p>
          {/* Handwritten Annotation */}
          <div className="absolute -right-20 top-14 text-white text-[12px] rotate-6 opacity-80 flex flex-col items-start font-mono whitespace-nowrap drop-shadow-md">
            <span>One chat.</span>
            <span>All your payments.</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-main -mt-1 ml-2"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </motion.div>

        {/* Orbiting Elements */}
        <div className="absolute inset-0 z-10">
           <OrbitalNode logo="/logos/zomato.svg" name="Zomato" className="top-10 -left-6" delay={0.1} />
           <OrbitalNode logo="/logos/amazon.svg" name="Amazon" className="bottom-12 -left-2" delay={0.4} />
           <OrbitalNode logo="/logos/ebay.svg" name="eBay" className="-top-4 right-10" delay={0.7} />
           <OrbitalNode logo="/logos/swiggy.svg" name="Swiggy" className="bottom-10 right-4" delay={0.2} />
           <OrbitalNode logo="/logos/steam.svg" name="Steam" className="top-1/2 -right-8" delay={0.9} />
           <OrbitalNode logo="/logos/nike.svg" name="Nike" className="bottom-[-10px] left-1/2" delay={0.5} />
        </div>
      </div>
    </div>
  );
}

function OrbitalNode({ logo, name, className, delay }: { logo: string, name: string, className: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1, y: ["-10px", "10px"] }}
      transition={{ 
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay, type: "spring" },
        y: { duration: 2.5 + delay, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay } 
      }}
      className={`absolute ${className} w-12 h-12 bg-white rounded-xl shadow-custom-sm border border-border-main p-2.5 flex items-center justify-center hover:scale-110 transition-transform`}
    >
      <img src={logo} alt={name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
    </motion.div>
  );
}
