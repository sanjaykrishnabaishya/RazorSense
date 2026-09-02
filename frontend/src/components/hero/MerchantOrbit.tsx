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
          className="relative z-20 w-[220px] h-[220px] flex items-center justify-center overflow-visible"
        >
          <img src="/robot.png" alt="AI Bot" className="w-[120%] h-[120%] object-contain mt-4 mix-blend-screen" />
        </motion.div>

        {/* Speech Bubble */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: -2 }}
          transition={{ duration: 0.5, delay: 0.8, type: "spring" }}
          className="absolute -top-24 -left-20 bg-[#111] border border-white/10 rounded-2xl rounded-br-sm px-5 py-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] z-50 min-w-[200px]"
        >
          <p className="text-[14px] font-semibold text-white">Hi! I’m Krish 👋</p>
          <p className="text-[12px] text-white/60 leading-tight mt-1">I’m here to help you sort things out. Tell me what happened, and I’ll look into it for you.</p>
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
      className={`absolute ${className} w-12 h-12 bg-[#111] rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/[0.05] p-2.5 flex items-center justify-center hover:scale-110 transition-transform`}
    >
      <img src={logo} alt={name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
    </motion.div>
  );
}
