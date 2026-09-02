import React from 'react';
import { Purchase } from '../../types/support';

export default function PurchaseResults({ results, selectedPurchase, setSelectedPurchase, setStage }: any) {
  const handleSelect = (p: Purchase) => {
    setSelectedPurchase(p);
    setTimeout(() => setStage('verify-details'), 400); // Advance automatically
  };

  const getLogo = (merchant: string) => {
    const domainMap: Record<string, string> = {
      'Zomato': 'zomato',
      'Amazon': 'amazon',
      'Nike': 'nike'
    };
    return "/logos/" + (domainMap[merchant] || merchant.toLowerCase()) + ".svg";
  };

  return (
    <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <h3 className="text-[14px] font-semibold text-text-secondary mb-3">Select the matching transaction</h3>
      <div className="flex flex-col gap-2">
        {results.map((p: Purchase, idx: number) => {
          const isSelected = selectedPurchase?.id === p.id;
          const containerClass = isSelected
            ? 'border-primary bg-primary-soft'
            : 'border-border-soft bg-white hover:border-border-main';
            
          const indicatorClass = isSelected
            ? 'border-primary bg-primary'
            : 'border-border-main';

          return (
            <div 
              key={p.id}
              onClick={() => handleSelect(p)}
              className={"flex items-center p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm relative overflow-hidden " + containerClass}
            >
              {idx === 0 && <div className="absolute top-0 right-0 bg-mint text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">BEST MATCH</div>}
              
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center mr-4 p-1 overflow-hidden shrink-0">
                <img src={getLogo(p.merchant)} alt={p.merchant} className="w-full h-full object-contain" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerHTML = '<span class="font-bold text-gray-500">' + p.merchant.charAt(0) + '</span>';
                }} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[15px] leading-tight">{p.item}</p>
                <p className="text-[13px] text-text-secondary">{p.merchant} &bull; Order {p.orderId}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-[15px]">{p.currency === 'INR' ? 'Ã¢â€šÂ¹' : '$'}{p.amount}</p>
                <p className="text-[12px] text-text-muted">{p.date}</p>
              </div>
              
              <div className="ml-4 mr-2">
                <div className={"w-5 h-5 rounded-full border flex items-center justify-center " + indicatorClass}>
                  {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
