import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function IdentificationPanel() {
  return (
    <div className="mt-10 bg-gradient-to-r from-[var(--mint-soft)] to-[#E8F8FB] rounded-[16px] p-8 flex flex-col md:flex-row items-center gap-8 border border-mint/20 animate-in fade-in duration-500">
      
      {/* Left Text */}
      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-[19px] font-[750] text-text-main">We'll identify everything for you</h3>
          <p className="text-[14px] text-text-secondary mt-1">Our AI will automatically fetch and verify:</p>
        </div>
        
        <ul className="space-y-3">
          <ListItem text="Which company you purchased from" />
          <ListItem text="Product or service details" />
          <ListItem text="Payment details from Razorpay" />
          <ListItem text="Whether the item matches your order" />
        </ul>
      </div>

      {/* Right Cards Stack */}
      <div className="w-full md:w-[280px] h-[180px] relative hidden md:block">
        <MockCard top="0px" left="40px" zIndex={10} merchant="Zomato" logo="/logos/zomato.svg" order="#ZOM1234567890" price="Ã¢â€šÂ¹299" date="12 Aug 2024" />
        <MockCard top="45px" left="20px" zIndex={20} merchant="Amazon" logo="/logos/amazon.svg" order="#AMZ884512" price="Ã¢â€šÂ¹1,499" date="5 Aug 2024" />
        <MockCard top="90px" left="0px" zIndex={30} merchant="eBay" logo="/logos/ebay.svg" order="#EB12345" price="$45" date="1 Aug 2024" />
      </div>

    </div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle2 size={20} className="text-mint-dark fill-[var(--color-mint)]/20" />
      <span className="text-[14px] font-medium text-text-main">{text}</span>
    </li>
  );
}

function MockCard({ top, left, zIndex, merchant, logo, order, price, date }: any) {
  return (
    <div 
      className="absolute bg-white rounded-xl p-3 flex items-center gap-3 shadow-custom-sm border border-border-soft w-[240px]"
      style={{ top, left, zIndex }}
    >
      <div className="w-10 h-10 rounded-md flex items-center justify-center border border-gray-100 overflow-hidden bg-white p-1 shrink-0">
        <img src={logo} alt={merchant} className="w-full h-full object-contain" />
      </div>
      <div>
        <div className="text-[13px] font-bold text-text-main">{merchant}</div>
        <div className="text-[11px] text-text-muted">Order {order}</div>
        <div className="text-[11px] text-text-muted">{price} &bull; {date}</div>
      </div>
    </div>
  );
}
