import React from 'react';

export default function MerchantOrbit() {
  return (
    <div className="relative w-full h-[300px] flex items-center justify-center pointer-events-none">
      
      {/* Robot Center */}
      <div className="relative z-20 flex flex-col items-center">
        {/* Floating Animation Wrapper */}
        <div className="animate-[float_6s_ease-in-out_infinite]">
          <div className="w-32 h-32 flex items-center justify-center relative overflow-visible drop-shadow-[0_0_20px_rgba(66,232,255,0.4)]">
             <img src="/robot.png" alt="Razor AI Bot" className="w-[180px] h-[180px] object-contain max-w-none ml-2 mt-4" />
          </div>
        </div>

        {/* Speech Bubble */}
        <div className="absolute -top-16 -left-10 bg-white rounded-2xl rounded-br-sm px-4 py-3 shadow-lg transform -rotate-2 z-30">
          <p className="text-[13px] font-semibold text-primary-dark">Hi! Iâ€™m Razor</p>
          <p className="text-[11px] text-text-secondary leading-tight max-w-[140px] mt-0.5">I can help you with refunds, replacements and any payment issue across all merchants.</p>
          {/* Handwritten Annotation */}
          <div className="absolute -right-20 top-14 text-white text-[12px] rotate-6 opacity-80 flex flex-col items-start font-mono whitespace-nowrap drop-shadow-md">
            <span>One chat.</span>
            <span>All your payments.</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-main -mt-1 ml-2"><path d="m9 18 6-6-6-6"/></svg>
          </div>
        </div>
      </div>

      {/* Orbiting Tiles */}
      <div className="absolute inset-0 z-10 hidden lg:block">
         <MerchantTile logo="/logos/zomato.png" name="zomato" top="10%" left="60%" delay="0s" rotate="12deg" />
         <MerchantTile logo="/logos/amazon.png" name="amazon" top="30%" left="75%" delay="1s" rotate="-5deg" />
         <MerchantTile logo="/logos/ebay.png" name="eBay" top="15%" left="85%" delay="2s" rotate="8deg" />
         <MerchantTile logo="/logos/swiggy.png" name="swiggy" top="50%" left="65%" delay="0.5s" rotate="-12deg" />
         <MerchantTile logo="/logos/steam.png" name="steam" top="60%" left="80%" delay="1.5s" rotate="15deg" />
         
         <div className="absolute bottom-[20%] right-[5%] text-[12px] text-text-muted font-mono opacity-60">... and 1000+ more</div>
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

function MerchantTile({ logo, name, top, left, delay, rotate }: any) {
  return (
    <div 
      className={"absolute w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-white/20 animate-[float_8s_ease-in-out_infinite] overflow-hidden p-2.5"}
      style={{ top, left, animationDelay: delay, transform: "rotate(" + rotate + ")" }}
    >
      <img src={logo} alt={name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
    </div>
  );
}
