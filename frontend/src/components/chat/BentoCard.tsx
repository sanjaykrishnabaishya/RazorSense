import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface SubOption {
  label: string;
  prompt: string;
}

interface BentoCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  onClick: () => void;
  cardClass: string;
  iconColor: string;
}

export default function BentoCard({
  icon: Icon,
  title,
  desc,
  onClick,
  cardClass,
  iconColor
}: BentoCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      className={`group relative overflow-hidden p-4 rounded-2xl ${cardClass} flex flex-col justify-between cursor-pointer border border-white/10 hover:border-cyan-400/40 hover:shadow-[0_12px_28px_-6px_rgba(0,0,0,0.8),0_0_20px_rgba(6,182,212,0.15)] transition-colors duration-200`}
    >
      {/* Subtle Top Specular Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {/* Card Header & Description */}
      <div>
        <div className="flex items-center justify-between mb-2 w-full">
          <div className={`w-8 h-8 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center ${iconColor} group-hover:scale-105 transition-transform`}>
            <Icon size={17} />
          </div>
          <div className="flex items-center gap-1 text-white/30 group-hover:text-white/70 transition-colors">
            <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
        
        <div>
          <h4 className="text-white font-semibold text-[13.5px] leading-snug mb-1 group-hover:text-cyan-200 transition-colors">
            {title}
          </h4>
          <p className="text-slate-400 text-[11.5px] leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
