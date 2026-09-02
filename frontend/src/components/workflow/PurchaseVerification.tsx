import React from 'react';
import { ShieldCheck, Check, ArrowRight } from 'lucide-react';

export default function PurchaseVerification({ selectedPurchase, setStage }: any) {
  if (!selectedPurchase) return null;

  const amountStr = (selectedPurchase.currency === 'INR' ? 'â‚¹' : '$') + selectedPurchase.amount;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-mint-soft flex items-center justify-center text-mint-dark">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-[22px] font-[800] tracking-tight">Purchase Verified</h2>
          <p className="text-[15px] text-text-secondary">We found your transaction and verified it cryptographically.</p>
        </div>
      </div>

      <div className="bg-white border border-border-main rounded-xl p-6 shadow-custom-sm mt-2">
        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
          <Detail label="Merchant" value={selectedPurchase.merchant} verified />
          <Detail label="Item" value={selectedPurchase.item} />
          <Detail label="Amount" value={amountStr} />
          <Detail label="Date" value={selectedPurchase.date} />
          <Detail label="Order ID" value={selectedPurchase.orderId} mask />
          <Detail label="Transaction" value={selectedPurchase.transactionId} mask verified />
        </div>
      </div>

      <button 
        onClick={() => setStage('analyse-issue')}
        className="mt-4 bg-gradient-to-b from-[var(--color-primary)] to-[var(--primary-dark)] text-white px-8 py-3.5 rounded-lg font-semibold text-[15px] flex items-center justify-center gap-2 transition hover:shadow-md self-start"
      >
        Confirm this purchase <ArrowRight size={18} />
      </button>
    </div>
  );
}

function Detail({ label, value, mask, verified }: any) {
  let displayValue = value;
  if (mask && value.startsWith('pay_')) {
    displayValue = 'pay_â€¢â€¢â€¢â€¢' + value.slice(-4);
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] text-text-muted font-medium uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[15px] font-semibold text-text-main">{displayValue}</span>
        {verified && <Check size={14} className="text-mint-dark" />}
      </div>
    </div>
  );
}
