import React from 'react';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function RazorSenseLogo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
    xl: 'w-14 h-14'
  };

  const textSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-extrabold',
    lg: 'text-2xl font-extrabold',
    xl: 'text-3xl font-extrabold'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`flex items-center gap-3 select-none cursor-pointer filter drop-shadow-[0_4px_16px_rgba(6,182,212,0.2)] ${className}`}
    >
      {/* Clean crisp brand icon */}
      <div className={`relative ${iconSizes[size]} shrink-0 flex items-center justify-center`}>
        <img
          src="/razorsense_logo.png"
          alt="RazorSense"
          className="w-full h-full object-contain"
        />
      </div>

      {showText && (
        <span className={`tracking-tight text-white ${textSizes[size]}`}>
          RazorSense
        </span>
      )}
    </motion.div>
  );
}
