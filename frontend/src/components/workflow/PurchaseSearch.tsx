import React from 'react';
import { Search, Zap, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';
import { mockPurchases } from '../../data/mockData';

export default function PurchaseSearch({ query, setQuery, isSearching, setIsSearching, setResults, setMessages }: any) {
  const handleSearch = () => {
    if (!query.trim()) return;
    setIsSearching(true);
    
    // Add searching progress message to chat
    const msgId = Date.now().toString();
    setMessages((prev: any) => [...prev, {
      id: msgId,
      role: 'assistant',
      kind: 'progress',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);

    setTimeout(() => {
      setIsSearching(false);
      setResults(mockPurchases);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
          <Zap size={24} />
        </div>
        <div>
          <h2 className="text-[22px] font-[800] tracking-tight">Let's find your purchase</h2>
          <p className="text-[15px] text-[var(--text-secondary)]">Enter any detail you remember. We'll locate your transaction across all merchants.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mt-2">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Order ID / Transaction ID / Merchant name (e.g. Zomato, Amazon) / Email / Phone"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-[var(--border)] rounded-lg text-[15px] focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button 
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="bg-gradient-to-b from-[var(--primary)] to-[var(--primary-dark)] text-white px-8 py-3.5 rounded-lg font-semibold text-[15px] flex items-center justify-center gap-2 disabled:opacity-70 transition hover:shadow-md whitespace-nowrap"
        >
          {isSearching ? <Loader2 size={18} className="animate-spin" /> : <>Find My Purchase <ArrowRight size={18} /></>}
        </button>
      </div>

      <button className="text-[14px] text-[var(--primary)] font-medium flex items-center gap-1 w-fit mt-1">
        Can't find the details? Try advanced search <ChevronDown size={16} />
      </button>
    </div>
  );
}
