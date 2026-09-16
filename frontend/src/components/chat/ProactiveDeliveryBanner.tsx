import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageCheck, RefreshCw, HelpCircle, X, ShieldAlert, Utensils, Shirt } from 'lucide-react';

interface ProactiveBannerProps {
  sendText: (text: string) => void;
  token?: string;
  apiUrl?: string;
}

export default function ProactiveDeliveryBanner({ sendText, token, apiUrl }: ProactiveBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const API = apiUrl || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://127.0.0.1:8000' : 'https://razorsense-backend.onrender.com');
    
    fetch(`${API}/api/orders/recent-deliveries`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && Array.isArray(data) && data.length > 0) {
          const physicalOrFood = data.filter(o => 
            ['Swiggy', 'Meesho', 'Zomato', 'Blinkit', 'Zepto', 'Amazon', 'Myntra', 'Flipkart'].includes(o.merchant)
          );
          setRecentOrders(physicalOrFood.length > 0 ? physicalOrFood : data.slice(0, 3));
        } else {
          setRecentOrders([
            {
              order_id: 'ORD-5915',
              merchant: 'Swiggy',
              product: 'Cold Coffee & Dark Chocolate Brownie',
              amount: 290.0,
              order_date: '2026-09-15',
              status: 'Delivered',
              payment_mode: 'CRED UPI'
            },
            {
              order_id: 'ORD-6714',
              merchant: 'Meesho',
              product: 'Floral Print Georgette Saree with Blouse Piece',
              amount: 620.0,
              order_date: '2026-09-14',
              status: 'Delivered',
              payment_mode: 'Cash on Delivery'
            }
          ]);
        }
      })
      .catch(() => {
        setRecentOrders([
          {
            order_id: 'ORD-5915',
            merchant: 'Swiggy',
            product: 'Cold Coffee & Dark Chocolate Brownie',
            amount: 290.0,
            order_date: '2026-09-15',
            status: 'Delivered',
            payment_mode: 'CRED UPI'
          },
          {
            order_id: 'ORD-6714',
            merchant: 'Meesho',
            product: 'Floral Print Georgette Saree with Blouse Piece',
            amount: 620.0,
            order_date: '2026-09-14',
            status: 'Delivered',
            payment_mode: 'Cash on Delivery'
          }
        ]);
      });
  }, [apiUrl]);

  if (!isVisible || recentOrders.length === 0) return null;

  const currentOrder = recentOrders[selectedIndex] || recentOrders[0];
  const isFood = ['Swiggy', 'Zomato', 'Blinkit', 'Zepto'].includes(currentOrder.merchant);
  const isFashion = ['Meesho', 'Myntra'].includes(currentOrder.merchant);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-4xl mx-auto"
      >
        {/* Clean Glass Layered Plate */}
        <div className="glass-3d rounded-2xl p-4 relative overflow-hidden group">
          {/* Subtle top edge line */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {/* Subtle bottom accent line */}
          <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

          {/* Top Tabs Switcher */}
          <div className="flex items-center justify-between gap-2 mb-3.5 pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mr-1 shrink-0 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Recent Deliveries:
              </span>
              <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/5">
                {recentOrders.map((ord, idx) => {
                  const isSwiggy = ord.merchant?.toLowerCase() === 'swiggy';
                  const isMeesho = ord.merchant?.toLowerCase() === 'meesho';
                  const isSelected = selectedIndex === idx;

                  // Subtle, tasteful, non-bright merchant colors
                  const colorClasses = isSwiggy
                    ? isSelected
                      ? 'bg-amber-500/20 text-amber-200 border-amber-500/40 shadow-sm'
                      : 'text-amber-300/70 hover:text-amber-200 hover:bg-amber-500/10 border-amber-500/15'
                    : isMeesho
                    ? isSelected
                      ? 'bg-pink-500/20 text-pink-200 border-pink-500/40 shadow-sm'
                      : 'text-pink-300/70 hover:text-pink-200 hover:bg-pink-500/10 border-pink-500/15'
                    : isSelected
                    ? 'bg-white/[0.12] text-white border-white/20 shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border-transparent';

                  return (
                    <button
                      key={ord.order_id}
                      onClick={() => setSelectedIndex(idx)}
                      className={`relative px-3 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border ${colorClasses}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: isSwiggy ? '#d97706' : isMeesho ? '#db2777' : '#0284c7' }}
                      />
                      <span>{ord.merchant}</span>
                      <span className="text-[10px] opacity-75 font-mono">₹{Math.round(ord.amount)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-white/10 shrink-0 cursor-pointer"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          {/* Current Selected Order Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isFood
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : isFashion
                  ? 'bg-pink-500/10 border-pink-500/20 text-pink-300'
                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
              }`}>
                {isFood ? <Utensils size={18} /> : isFashion ? <Shirt size={18} /> : <PackageCheck size={18} />}
              </div>
              
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Delivered
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">#{currentOrder.order_id}</span>
                </div>
                <h4 className="text-white font-medium text-[13.5px] mt-1 truncate">
                  {currentOrder.product}
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-2">
                  <span>{currentOrder.merchant}</span>
                  <span>•</span>
                  <span>₹{Math.round(currentOrder.amount)} via {currentOrder.payment_mode || 'Online'}</span>
                </p>
              </div>
            </div>

            {/* Quick Actions with Pop-up Hover Effects & Tasteful Colors */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {isFood ? (
                <>
                  <button
                    onClick={() => sendText(`I have an issue with my ${currentOrder.merchant} order ${currentOrder.order_id} (${currentOrder.product})`)}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 text-amber-200 text-xs font-semibold transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(245,158,11,0.2)] active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Utensils size={12} className="text-amber-300" />
                    <span>Food Issue</span>
                  </button>
                  <button
                    onClick={() => sendText(`The delivery rider for my ${currentOrder.merchant} order ${currentOrder.order_id} misbehaved with me.`)}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-400/30 hover:border-rose-400/50 text-rose-300 text-xs font-semibold transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(244,63,94,0.2)] active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <ShieldAlert size={12} />
                    <span>Rider Grievance</span>
                  </button>
                </>
              ) : isFashion ? (
                <>
                  <button
                    onClick={() => sendText(`I want to replace order ${currentOrder.order_id} (${currentOrder.product})`)}
                    className="px-3.5 py-1.5 rounded-xl glass-3d-btn-blue text-cyan-100 text-xs font-semibold transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(6,182,212,0.2)] active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} />
                    <span>1-Tap Replace</span>
                  </button>
                  <button
                    onClick={() => sendText(`I want to return order ${currentOrder.order_id} (${currentOrder.product})`)}
                    className="px-3.5 py-1.5 rounded-xl bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 hover:border-violet-500/50 text-violet-200 text-xs font-semibold transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(139,92,246,0.2)] active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} className="text-violet-300" />
                    <span>Return</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => sendText(`I need assistance with order ${currentOrder.order_id} (${currentOrder.product})`)}
                    className="px-3.5 py-1.5 rounded-xl glass-3d-btn-blue text-cyan-100 text-xs font-semibold transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                  >
                    <span>Get Help</span>
                  </button>
                </>
              )}

              <button
                onClick={() => sendText(`Can you show me the receipt and details for order ${currentOrder.order_id}?`)}
                className="p-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 hover:border-sky-500/50 text-sky-200 transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 shadow-sm cursor-pointer flex items-center justify-center"
                title="View order details"
              >
                <HelpCircle size={15} className="text-sky-300" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
