import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Calendar, ChevronLeft, ChevronRight, PlusCircle, HelpCircle, X, ArrowRight, Building2 } from 'lucide-react';

interface Ticket {
  ticket_id: string;
  order_id?: string;
  merchant: string;
  product?: string;
  issue: string;
  status: string;
  action_taken: string;
  date: string;
  [key: string]: any;
}

interface TicketHistoryWidgetProps {
  tickets: Ticket[];
  onSelectTicket: (ticket: Ticket) => void;
  onRaiseNewIssue: () => void;
  onEscalateTicket: (ticket: Ticket) => void;
}

export default function TicketHistoryWidget({
  tickets = [],
  onSelectTicket,
  onRaiseNewIssue,
  onEscalateTicket
}: TicketHistoryWidgetProps) {
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Filter tickets by date (handles both "YYYY-MM-DD" and text like "16 Sep")
  const filteredTickets = useMemo(() => {
    if (!dateFilter.trim()) return tickets;
    
    let targetStr = dateFilter.trim().toLowerCase();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      try {
        const [year, month, day] = dateFilter.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const dayStr = String(dateObj.getDate());
        const monthShort = dateObj.toLocaleString('en-US', { month: 'short' });
        targetStr = `${dayStr} ${monthShort}`.toLowerCase();
      } catch {}
    }

    return tickets.filter(t => {
      const ticketDate = (t.date || '').toLowerCase();
      return ticketDate.includes(targetStr);
    });
  }, [tickets, dateFilter]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedTickets = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, activePage, pageSize]);

  const handleDateChange = (val: string) => {
    setDateFilter(val);
    setCurrentPage(1);
  };

  const clearFilter = () => {
    setDateFilter('');
    setCurrentPage(1);
  };

  return (
    <div className="w-full max-w-2xl bg-[#0a0d14]/95 border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-white font-semibold text-[13.5px] tracking-tight">
                Active Support Tickets & Dispute Dossiers
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
                {filteredTickets.length} {filteredTickets.length === 1 ? 'Record' : 'Records'}
              </span>
            </div>
            <p className="text-[11px] text-white/40 mt-0.5">
              Cryptographically verified by RazorSense Sentinel Engine
            </p>
          </div>
        </div>

        {/* Action: Raise a New Issue */}
        <button
          onClick={onRaiseNewIssue}
          className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 hover:border-cyan-400/60 text-cyan-200 text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
          title="Raise a new support grievance"
        >
          <PlusCircle size={13} className="text-cyan-300" />
          <span>Raise a New Issue</span>
        </button>
      </div>

      {/* Date Filter Bar */}
      <div className="flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Calendar size={13} className="text-slate-400 shrink-0" />
          <span className="text-[11px] text-slate-400 shrink-0 font-medium">Filter by Date:</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-lg px-2 py-0.5 text-xs text-white focus:outline-none focus:border-cyan-400/60 cursor-pointer font-mono [color-scheme:dark]"
            title="Select date (DD/MM/YYYY)"
          />
          {dateFilter && (
            <button
              onClick={clearFilter}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/10 text-xs flex items-center gap-1 cursor-pointer transition"
              title="Clear date filter"
            >
              <X size={12} />
              <span className="text-[10px]">Reset</span>
            </button>
          )}
        </div>

        {totalPages > 1 && (
          <span className="text-[11px] text-slate-400 font-mono shrink-0">
            Page {activePage} of {totalPages}
          </span>
        )}
      </div>

      {/* Tickets List */}
      <div className="space-y-2.5">
        {paginatedTickets.length === 0 ? (
          <div className="py-8 text-center bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <p className="text-white/50 text-xs font-medium">
              {dateFilter ? 'No tickets found matching the selected date.' : 'No active support tickets found.'}
            </p>
            {dateFilter && (
              <button
                onClick={clearFilter}
                className="mt-2 text-xs text-cyan-400 hover:underline cursor-pointer"
              >
                Clear date filter
              </button>
            )}
          </div>
        ) : (
          paginatedTickets.map((t, i) => {
            const isResolved = t.status?.includes('Resolved') || t.status?.includes('Approved') || t.status?.includes('Scheduled');
            const isFeedback = t.status?.includes('Feedback') || t.status?.includes('Logged');
            const isSafety = t.status?.includes('Safety') || t.status?.includes('Investigation') || t.status?.includes('Rider');
            
            const statusColor = isResolved 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
              : isSafety 
              ? 'bg-purple-500/10 text-purple-300 border-purple-500/25'
              : isFeedback
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
              : 'bg-blue-500/10 text-blue-400 border-blue-500/25';

            return (
              <motion.div
                key={t.ticket_id || i}
                whileHover={{ scale: 1.01, y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="p-3.5 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl border border-white/[0.06] hover:border-cyan-400/30 transition-all shadow-sm flex flex-col gap-2.5 group"
              >
                {/* Header: ID, Merchant, Status */}
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-[13px] group-hover:text-cyan-200 transition-colors font-mono">
                        #{t.ticket_id}
                      </span>
                      <span className="text-white/40 text-[11px] truncate flex items-center gap-1">
                        <Building2 size={10} /> {t.merchant} {t.product && t.product !== 'N/A' ? `(${t.product})` : ''}
                      </span>
                    </div>
                    <p className="text-white/70 text-xs mt-1 line-clamp-1">
                      {t.issue}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${statusColor}`}>
                    {t.status}
                  </span>
                </div>

                {/* Footer Actions: Date, View Full Dossier, and Human Escalation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-white/[0.04] text-[11px]">
                  <span className="text-white/40 font-mono text-[10.5px]">{t.date}</span>
                  
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    {/* Reopen / Review Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEscalateTicket(t);
                      }}
                      className="text-amber-300/80 hover:text-amber-200 flex items-center gap-1 transition-colors cursor-pointer hover:underline text-[10.5px]"
                      title="Open review for this ticket if not satisfied"
                    >
                      <HelpCircle size={12} className="text-amber-400" />
                      <span>Not satisfied?</span>
                    </button>

                    {/* View Dossier Action */}
                    <button
                      onClick={() => onSelectTicket(t)}
                      className="text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform cursor-pointer text-[11px]"
                    >
                      <span>View Full Audit Dossier</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination Navigation (< 1 2 3 >) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2 border-t border-white/[0.06]">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={activePage === 1}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition text-xs cursor-pointer flex items-center gap-1"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>

          {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition cursor-pointer flex items-center justify-center ${
                activePage === pageNum
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold shadow-sm'
                  : 'bg-white/[0.03] text-slate-400 hover:text-white hover:bg-white/[0.08] border border-white/5'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={activePage === totalPages}
            className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition text-xs cursor-pointer flex items-center gap-1"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
