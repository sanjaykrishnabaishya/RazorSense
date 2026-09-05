import React, { useState } from 'react';
import { Search, Sparkles, CheckCircle2, FileText, RefreshCcw, Package, PackageX, AlertTriangle, CreditCard, MoreHorizontal, ChevronDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import AdvancedSearchModal from './AdvancedSearchModal';

export default function PurchaseSearch(props: any) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearch = async () => {
    if (props.sendText) {
       props.sendText(`Please find my orders matching: ${props.query || 'recent orders'}`);
    }
  };

  const handleAdvancedSearchSubmit = async (data: any) => {
    let msg = "Find my order. ";
    if (data.merchant) msg += `Merchant: ${data.merchant}. `;
    if (data.orderId) msg += `Order ID: ${data.orderId}. `;
    if (data.date) msg += `Date: ${data.date}. `;
    
    if (props.sendText) {
       props.sendText(msg);
    }
    setIsAdvancedOpen(false);
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* 1. Search Header */}
      <div className="flex gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
          <Search size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Let's find your purchase</h2>
          <p className="text-white/50 text-[15px]">Enter any detail you remember. We'll locate your transaction across all merchants.</p>
        </div>
      </div>

      {/* 2. Search Input */}
      <div>
        <div className="flex border border-white/[0.08] rounded-xl overflow-hidden bg-black/40 focus-within:border-white/20 transition-colors shadow-sm">
          <div className="pl-4 flex items-center justify-center">
            <Search size={18} className="text-white/40" />
          </div>
          <input 
            type="text"
            className="flex-1 bg-transparent px-3 py-4 text-white focus:outline-none placeholder-white/30 text-[15px]"
            placeholder="Order ID / Transaction ID / Merchant name (e.g. Zomato, Amazon, eBay) / Email / Phone"
            value={props.query}
            onChange={(e) => props.setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSearch}
            className="bg-white hover:bg-gray-200 text-black px-6 font-semibold flex items-center gap-2 transition-colors border-l border-white/10"
          >
            Find My Purchase <ArrowRight size={16} />
          </motion.button>
        </div>
        <button 
          onClick={() => setIsAdvancedOpen(true)}
          className="text-blue-400 text-[13px] font-medium mt-3 flex items-center gap-1 hover:text-blue-300 transition-colors"
        >
          Can't find the details? Try advanced search <ChevronDown size={14} />
        </button>
      </div>

      <AdvancedSearchModal 
        isOpen={isAdvancedOpen} 
        onClose={() => setIsAdvancedOpen(false)} 
        onSearch={handleAdvancedSearchSubmit} 
      />

      {/* 3. AI Identification Panel */}
      <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-8 relative overflow-hidden flex flex-col md:flex-row gap-8 justify-between">
        
        <div className="flex-1 z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
              <Sparkles size={16} className="text-emerald-400" />
            </div>
            <h3 className="text-[17px] font-bold text-white">We'll identify everything for you</h3>
          </div>
          <p className="text-white/60 text-[14px] mb-5">Our AI will automatically fetch and verify:</p>
          
          <div className="space-y-3">
            {[
              "Which company you purchased from",
              "Product or service details",
              "Payment details from Razorpay",
              "Whether the item matches your order"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span className="text-[14px] text-white/80">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Issue Selector */}
      <div className="mt-4">
        <div className="flex gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-1">What's the issue?</h2>
            <p className="text-white/50 text-[14px]">Select the option that best describes your issue.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <IssueTile 
            icon={RefreshCcw} title="Refund" desc="I want a refund" 
            active={props.selectedIssue === 'refund'} 
            onClick={() => props.setSelectedIssue('refund')} 
            color="text-emerald-400"
          />
          <IssueTile 
            icon={Package} title="Replacement" desc="I want a replacement" 
            active={props.selectedIssue === 'replacement'} 
            onClick={() => props.setSelectedIssue('replacement')} 
            color="text-blue-400"
          />
          <IssueTile 
            icon={PackageX} title="Wrong or different item" desc="Received different product" 
            active={props.selectedIssue === 'wrong_item'} 
            onClick={() => props.setSelectedIssue('wrong_item')} 
            color="text-purple-400"
          />
          <IssueTile 
            icon={AlertTriangle} title="Return" desc="Return this item" 
            active={props.selectedIssue === 'product'} 
            onClick={() => props.setSelectedIssue('product')} 
            color="text-orange-400"
          />
          <IssueTile 
            icon={CreditCard} title="Payment issue" desc="Charged twice, failed payment, etc." 
            active={props.selectedIssue === 'payment'} 
            onClick={() => props.setSelectedIssue('payment')} 
            color="text-red-400"
          />
          <IssueTile 
            icon={MoreHorizontal} title="Other" desc="Something else" 
            active={props.selectedIssue === 'other'} 
            onClick={() => props.setSelectedIssue('other')} 
            color="text-white/60"
          />
        </div>
      </div>

    </div>
  );
}

function IssueTile({ icon: Icon, title, desc, active, onClick, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center h-full
        ${active 
          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
          : 'bg-[#111] border-white/[0.05] hover:bg-white/[0.04] hover:border-white/20'}`}
    >
      <Icon size={24} className={`mb-3 ${color}`} />
      <h4 className="text-[13px] font-bold text-white leading-tight mb-1">{title}</h4>
      <p className="text-[10px] text-white/50 leading-tight">{desc}</p>
    </button>
  );
}
