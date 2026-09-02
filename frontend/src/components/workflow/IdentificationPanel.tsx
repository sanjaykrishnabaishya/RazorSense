import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function IdentificationPanel() {
  return (
    <div className="mt-10 bg-gradient-to-r from-[var(--mint-soft)] to-[#E8F8FB] rounded-[16px] p-8 flex flex-col md:flex-row items-center gap-8 border border-[var(--mint)]/20 animate-in fade-in duration-500">
      
      {/* Left Text */}
      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-[19px] font-[750] text-[var(--text)]">We'll identify everything for you</h3>
          <p className="text-[14px] text-[var(--text-secondary)] mt-1">Our AI will automatically fetch and verify:</p>
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
        <MockCard top="0px" left="40px" zIndex={10} merchant="Zomato" order="#ZOM1234567890" price="₹299" date="12 Aug 2024" logoColor="bg-red-500" />
        <MockCard top="45px" left="20px" zIndex={20} merchant="amazon" order="#AMZ884512" price="₹1,499" date="5 Aug 2024" logoColor="bg-orange-500" />
        <MockCard top="90px" left="0px" zIndex={30} merchant="eBay" order="#EB12345" price="$45" date="1 Aug 2024" logoColor="bg-blue-600" />
      </div>

    </div>
  );
}

function ListItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <CheckCircle2 size={20} className="text-[var(--mint-dark)] fill-[var(--mint)]/20" />
      <span className="text-[14px] font-medium text-[var(--text)]">{text}</span>
    </li>
  );
}

function MockCard({ top, left, zIndex, merchant, order, price, date, logoColor }: any) {
  return (
    <div 
      className="absolute bg-white rounded-xl p-3 flex items-center gap-3 shadow-[var(--shadow-sm)] border border-[var(--border-soft)] w-[240px]"
      style={{ top, left, zIndex }}
    >
      <div className={`w-10 h-10 ${logoColor} rounded-md flex items-center justify-center text-white font-bold text-xs`}>
        {merchant.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className="text-[13px] font-bold text-[var(--text)]">{merchant}</div>
        <div className="text-[11px] text-[var(--text-muted)]">Order {order}</div>
        <div className="text-[11px] text-[var(--text-muted)]">{price} • {date}</div>
      </div>
    </div>
  );
}
