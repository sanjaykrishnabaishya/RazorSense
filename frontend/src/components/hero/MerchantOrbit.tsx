import React from 'react';
import { Bot, ShoppingBag, ShoppingCart, Coffee, Video, Gamepad2, Package } from 'lucide-react';

export default function MerchantOrbit() {
  return (
    <div className="relative w-full h-[300px] flex items-center justify-center pointer-events-none">
      
      {/* Robot Center */}
      <div className="relative z-20 flex flex-col items-center">
        {/* Floating Animation Wrapper */}
        <div className="animate-[float_6s_ease-in-out_infinite]">
          <div className="w-32 h-32 bg-white rounded-3xl shadow-[0_0_40px_rgba(66,232,255,0.3)] flex items-center justify-center relative overflow-hidden border-b-4 border-gray-200">
             {/* Robot Face Screen */}
             <div className="w-24 h-16 bg-[#041025] rounded-xl flex items-center justify-center gap-3 relative overflow-hidden">
                {/* Eyes */}
                <div className="w-4 h-2 bg-[var(--cyan)] rounded-full animate-pulse shadow-[0_0_10px_rgba(66,232,255,0.8)]"></div>
                <div className="w-4 h-2 bg-[var(--cyan)] rounded-full animate-pulse shadow-[0_0_10px_rgba(66,232,255,0.8)]"></div>
             </div>
             {/* Chest Mark */}
             <div className="absolute bottom-2 w-8 h-1 bg-[var(--primary)] rounded-full opacity-50"></div>
          </div>
        </div>

        {/* Speech Bubble */}
        <div className="absolute -top-12 -left-32 bg-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg transform -rotate-2">
          <p className="text-[13px] font-semibold text-[var(--primary-dark)]">Hi! I’m Razor</p>
          <p className="text-[11px] text-[var(--text-secondary)] leading-tight max-w-[140px] mt-0.5">I can help you with refunds, replacements and any payment issue across all merchants.</p>
          {/* Handwritten Annotation */}
          <div className="absolute -right-20 top-14 text-white text-[12px] rotate-6 opacity-80 flex flex-col items-start font-mono">
            <span>One chat.</span>
            <span>All your payments.</span>
            <span>Any merchant.</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--cyan)] -mt-1 ml-2"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </div>

      {/* Orbiting Tiles (Simulated) */}
      <div className="absolute inset-0 z-10 hidden lg:block">
         <MerchantTile icon={ShoppingBag} color="bg-red-500" name="zomato" top="10%" left="60%" delay="0s" rotate="12deg" />
         <MerchantTile icon={ShoppingCart} color="bg-orange-500" name="amazon" top="30%" left="75%" delay="1s" rotate="-5deg" />
         <MerchantTile icon={Package} color="bg-blue-600" name="eBay" top="15%" left="85%" delay="2s" rotate="8deg" />
         <MerchantTile icon={Coffee} color="bg-orange-600" name="swiggy" top="50%" left="65%" delay="0.5s" rotate="-12deg" />
         <MerchantTile icon={Gamepad2} color="bg-purple-600" name="steam" top="60%" left="80%" delay="1.5s" rotate="15deg" />
         
         <div className="absolute bottom-[20%] right-[5%] text-[12px] text-[var(--text-muted)] font-mono opacity-60">... and 1000+ more</div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}} />
    </div>
  );
}

function MerchantTile({ icon: Icon, color, name, top, left, delay, rotate }: any) {
  return (
    <div 
      className={`absolute w-14 h-14 ${color} rounded-2xl flex items-center justify-center shadow-lg border border-white/20 animate-[float_8s_ease-in-out_infinite]`}
      style={{ top, left, animationDelay: delay, transform: `rotate(${rotate})` }}
    >
      <Icon size={24} className="text-white" />
    </div>
  );
}
