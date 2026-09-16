import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Clock, ExternalLink, Sparkles, Building2 } from 'lucide-react';

interface TicketReceiptProps {
  ticket: {
    ticket_id: string;
    order_id?: string;
    merchant: string;
    product?: string;
    issue?: string;
    status: string;
    action_taken: string;
    date: string;
    fraud_score?: number;
    risk_level?: string;
    policy_rule_cited?: string;
  };
  onOpenDetails: (ticket: any) => void;
}

export default function TicketReceiptCard({ ticket, onOpenDetails }: TicketReceiptProps) {
  const isResolvedOrBooked = ticket.status.includes('Scheduled') || ticket.status.includes('Approved') || ticket.status.includes('Resolved');
  const isFeedback = ticket.status.includes('Feedback') || ticket.status.includes('Logged');

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full max-w-md my-2"
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#11131c] via-[#0d0e14] to-[#0a0a0e] border border-white/[0.1] shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
        {/* Holographic accent glow at top */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 opacity-80" />
        
        {/* Card Header */}
        <div className="p-4 pb-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isResolvedOrBooked ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
              <ShieldCheck size={15} />
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-white/50 block leading-tight">
                Dispute Resolution Pass
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Verified by Sentinel Engine
              </span>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-white/90 px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08]">
            #{ticket.ticket_id}
          </span>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3 text-xs">
          {/* Merchant and Product */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-white/40 tracking-wider">
                <Building2 size={10} /> {ticket.merchant}
              </span>
              <h4 className="text-white font-semibold text-sm leading-snug mt-0.5">
                {ticket.product || 'Delivered Purchase'}
              </h4>
            </div>
            {ticket.order_id && ticket.order_id !== 'N/A' && (
              <span className="text-white/40 font-mono text-[11px] shrink-0">
                #{ticket.order_id}
              </span>
            )}
          </div>

          {/* Action Taken summary block */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-white/40 uppercase tracking-wider text-[10px] font-medium">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isResolvedOrBooked 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : isFeedback
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {ticket.status}
              </span>
            </div>
            <p className="text-white/80 text-[11.5px] leading-relaxed pt-0.5">
              {ticket.action_taken}
            </p>
          </div>

          {/* Minimal digital barcode simulation (Apple Wallet style) */}
          <div className="pt-1 flex items-center justify-between text-white/20">
            <div className="flex items-center gap-1 opacity-40">
              <div className="w-1 h-5 bg-white rounded-full"></div>
              <div className="w-0.5 h-5 bg-white rounded-full"></div>
              <div className="w-2 h-5 bg-white rounded-full"></div>
              <div className="w-1 h-5 bg-white rounded-full"></div>
              <div className="w-0.5 h-5 bg-white rounded-full"></div>
              <div className="w-1.5 h-5 bg-white rounded-full"></div>
              <div className="w-1 h-5 bg-white rounded-full"></div>
            </div>
            <span className="text-[10px] font-mono text-white/40">
              {ticket.date}
            </span>
          </div>
        </div>

        {/* Card Footer Button */}
        <div className="p-3 pt-0">
          <button
            onClick={() => onOpenDetails(ticket)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.08] text-white/90 hover:text-white text-xs font-medium transition active:scale-98 cursor-pointer"
          >
            <span>View Full Audit Dossier</span>
            <ExternalLink size={12} className="opacity-70" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
