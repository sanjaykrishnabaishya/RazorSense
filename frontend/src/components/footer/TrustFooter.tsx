import React from 'react';
import { ShieldCheck, Globe2, Zap } from 'lucide-react';

export default function TrustFooter() {
  return (
    <footer className="w-full bg-white border-t border-border-main py-6 mt-auto z-10 relative">
      <div className="max-w-[1440px] mx-auto px-4 lg:px-11 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Logo Placeholder */}
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-primary rotate-45 transform"></div>
          <span className="font-[800] text-[18px] tracking-tight text-[var(--hero-deep)]">Razor<span className="text-primary">Sense</span></span>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
          <TrustItem 
            icon={ShieldCheck} 
            title="Secure & Private" 
            desc="Your data is safe with bank-grade security" 
          />
          <TrustItem 
            icon={Globe2} 
            title="Works with all merchants" 
            desc="From Zomato to eBay to any business" 
          />
          <TrustItem 
            icon={Zap} 
            title="Trusted by millions" 
            desc="Powering payments for businesses across the world" 
          />
        </div>
        
      </div>
    </footer>
  );
}

function TrustItem({ icon: Icon, title, desc }: any) {
  return (
    <div className="flex items-center gap-3">
      <Icon size={24} className="text-text-secondary shrink-0" strokeWidth={1.5} />
      <div className="flex flex-col">
        <span className="text-[13px] font-bold text-text-main">{title}</span>
        <span className="text-[12px] text-text-muted">{desc}</span>
      </div>
    </div>
  );
}
