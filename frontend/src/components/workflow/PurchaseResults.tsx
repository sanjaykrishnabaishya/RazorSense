import React from 'react';
import { Purchase } from '../../types/support';

export default function PurchaseResults({ results, selectedPurchase, setSelectedPurchase, setStage }: any) {
  const handleSelect = (p: Purchase) => {
    setSelectedPurchase(p);
    setTimeout(() => setStage('verify-details'), 400); // Advance automatically
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h3 className="text-[14px] font-semibold text-[var(--text-secondary)] mb-3">Select the matching transaction</h3>
      <div className="flex flex-col gap-2">
        {results.map((p: Purchase, idx: number) => (
          <div 
            key={p.id}
            onClick={() => handleSelect(p)}
            className={\`flex items-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm relative overflow-hidden
              \${selectedPurchase?.id === p.id 
                ? 'border-[var(--primary)] bg-[var(--primary-soft)]' 
                : 'border-[var(--border-soft)] bg-white hover:border-[var(--border)]'}
            \`}
          >
            {idx === 0 && <div className="absolute top-0 right-0 bg-[var(--mint)] text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">BEST MATCH</div>}
            
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-500 mr-4">
              {p.merchant.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-[15px] leading-tight">{p.item}</p>
              <p className="text-[13px] text-[var(--text-secondary)]">{p.merchant} • Order {p.orderId}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-[15px]">{p.currency === 'INR' ? '₹' : '$'}{p.amount}</p>
              <p className="text-[12px] text-[var(--text-muted)]">{p.date}</p>
            </div>
            
            <div className="ml-4 mr-2">
              <div className={\`w-5 h-5 rounded-full border flex items-center justify-center
                \${selectedPurchase?.id === p.id ? 'border-[var(--primary)] bg-[var(--primary)]' : 'border-[var(--border)]'}
              \`}>
                {selectedPurchase?.id === p.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
