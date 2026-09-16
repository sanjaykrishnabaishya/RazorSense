import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Check, Truck, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

interface InlineResolutionProps {
  order?: any;
  sendText: (text: string) => void;
}

export default function InlineResolutionCard({ order, sendText }: InlineResolutionProps) {
  const [selectedReason, setSelectedReason] = useState('Wrong Size / Fit');
  const [selectedSlot, setSelectedSlot] = useState('Tomorrow (10 AM - 2 PM)');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const reasons = [
    'Wrong Size / Fit',
    'Fabric / Stitching Defect',
    'Wrong Item Delivered',
    'Color Mismatch'
  ];

  const slots = [
    'Tomorrow (10 AM - 2 PM)',
    'Tomorrow (2 PM - 6 PM)',
    'Day After Tomorrow'
  ];

  const handleConfirm = () => {
    setIsSubmitted(true);
    const orderRef = order?.order_id || 'ORD-6714';
    const prodRef = order?.product || 'Floral Print Georgette Saree';
    sendText(`Please confirm doorstep exchange for ${orderRef} (${prodRef}). Reason: ${selectedReason}. Pickup Slot: ${selectedSlot}.`);
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md my-2 p-4 rounded-2xl bg-[#0c121e] border border-blue-500/30 text-white shadow-xl flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Doorstep Exchange Slotted</h4>
          <p className="text-white/60 text-xs">Pickup: {selectedSlot} • Registered Address</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-md my-2 rounded-2xl bg-gradient-to-b from-[#12141e] via-[#0d0f16] to-[#0a0a0e] border border-white/[0.1] shadow-2xl p-4.5 space-y-4 text-xs"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
            <Truck size={14} />
          </div>
          <div>
            <h4 className="text-white font-semibold text-sm leading-tight">
              1-Tap Doorstep Exchange
            </h4>
            <span className="text-white/40 text-[11px]">
              {order?.product || 'Floral Print Georgette Saree'} • {order?.merchant || 'Meesho'}
            </span>
          </div>
        </div>
        <span className="text-emerald-400 font-bold text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          Free QC Handover
        </span>
      </div>

      {/* Step 1: Reason Selection */}
      <div className="space-y-1.5">
        <span className="text-[10.5px] uppercase font-bold text-white/40 tracking-wider block">
          1. Select Reason:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {reasons.map(r => (
            <button
              key={r}
              onClick={() => setSelectedReason(r)}
              className={`py-2 px-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                selectedReason === r
                  ? 'bg-blue-600/20 border-blue-500/60 text-white font-medium'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span className="truncate">{r}</span>
              {selectedReason === r && <Check size={12} className="text-blue-400 shrink-0 ml-1" />}
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Pickup Slot */}
      <div className="space-y-1.5">
        <span className="text-[10.5px] uppercase font-bold text-white/40 tracking-wider block">
          2. Courier Pickup Window:
        </span>
        <div className="flex flex-col gap-1.5">
          {slots.map(s => (
            <button
              key={s}
              onClick={() => setSelectedSlot(s)}
              className={`py-2 px-3 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                selectedSlot === s
                  ? 'bg-blue-600/20 border-blue-500/60 text-white font-medium'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={12} className={selectedSlot === s ? 'text-blue-400' : 'text-white/40'} />
                <span>{s}</span>
              </div>
              {selectedSlot === s && <Check size={12} className="text-blue-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Address confirmation */}
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-white/50 text-[11px]">
        <MapPin size={13} className="text-blue-400 shrink-0" />
        <span className="truncate">Courier will collect from your registered default home address</span>
      </div>

      {/* Confirm Button */}
      <button
        onClick={handleConfirm}
        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
      >
        <Sparkles size={13} />
        <span>Confirm Free Doorstep Exchange (1-Tap)</span>
      </button>
    </motion.div>
  );
}
