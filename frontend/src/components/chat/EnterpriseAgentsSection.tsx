"use client";
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, CreditCard, Clock, Search, AlertTriangle, ArrowRight, 
  CheckCircle2, Repeat 
} from 'lucide-react';

interface HelpOptionProps {
  id: string;
  category: string;
  categoryColor: string;
  title: string;
  description: string;
  tags: string[];
  ctaText: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  gradientClass: string;
  accentBorder: string;
  spotlightColor: string;
  onClick: () => void;
  onTagClick?: (tag: string) => void;
}

function ConsumerHelpCard({
  category,
  categoryColor,
  title,
  description,
  tags,
  ctaText,
  icon: Icon,
  iconColor,
  iconBg,
  gradientClass,
  accentBorder,
  spotlightColor,
  onClick,
  onTagClick
}: HelpOptionProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={onClick}
      className={`group relative rounded-2xl p-6 sm:p-7 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between
        bg-[#090c13]/90 border border-white/[0.08] backdrop-blur-xl
        hover:border-transparent hover:shadow-[0_16px_40px_rgba(0,0,0,0.7)]
        hover:scale-[1.015] hover:z-10
        group-hover/grid:opacity-65 hover:!opacity-100
        ${accentBorder}`}
    >
      {/* Background Ambient Tint */}
      <div className={`absolute inset-0 opacity-35 transition-opacity duration-500 group-hover:opacity-65 ${gradientClass} pointer-events-none`} />

      {/* Dynamic Cursor-Tracking Radial Spotlight */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor}, transparent 65%)`
        }}
      />

      {/* Dynamic Cursor-Tracking Border Illumination */}
      <div
        className="pointer-events-none absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          border: '1.5px solid transparent',
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, ${spotlightColor.replace('0.15', '0.6').replace('0.2', '0.8').replace('0.22', '0.85')}, transparent 60%) border-box`,
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude'
        }}
      />

      {/* Top Meta Bar: Category Pill & Vibrant Colored Icon */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-4">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${categoryColor}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {category}
        </span>
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm ${iconBg} ${iconColor}`}>
          <Icon size={20} />
        </div>
      </div>

      {/* Title & Description for Real Everyday Users */}
      <div className="relative z-10 flex-1 mb-5">
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:translate-x-0.5 transition-transform">
          {title}
        </h3>
        <p className="text-xs sm:text-[13.5px] leading-relaxed text-slate-300/80 group-hover:text-slate-200 transition-colors">
          {description}
        </p>
      </div>

      {/* Helpful Feature Tags - Uniform 3 Sub-Options + More » */}
      <div className="relative z-10 flex flex-wrap gap-1.5 mb-6">
        {tags.slice(0, 3).map((tag, i) => (
          <span
            key={i}
            onClick={(e) => {
              if (onTagClick) {
                e.stopPropagation();
                onTagClick(tag);
              }
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.07] text-[11px] text-slate-300 font-medium transition-colors ${
              onTagClick ? 'hover:bg-white/[0.12] hover:border-white/20 hover:text-white cursor-pointer' : ''
            }`}
          >
            <CheckCircle2 size={11} className={`${iconColor.split(' ')[0]} shrink-0`} />
            {tag}
          </span>
        ))}
        <span
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/[0.08] hover:border-white/25 hover:bg-white/[0.08] text-[11px] text-slate-400 hover:text-white font-medium transition-colors cursor-pointer"
        >
          More »
        </span>
      </div>

      {/* Bottom Action CTA Button */}
      <div className="relative z-10 flex items-center justify-between pt-3.5 border-t border-white/[0.06]">
        <span className="text-xs font-semibold text-white/90 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
          {ctaText}
        </span>
        <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-cyan-500 group-hover:text-black group-hover:border-cyan-400 transition-all duration-300 shadow-sm">
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
}

interface EnterpriseAgentsProps {
  sendText: (text: string) => void;
  onPostPurchaseClick: () => void;
}

export default function EnterpriseAgentsSection({ sendText, onPostPurchaseClick }: EnterpriseAgentsProps) {
  return (
    <section className="w-full mt-4 mb-8">
      {/* Consumer-Friendly Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-6 px-4">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight mb-2"
        >
          What can we help you with?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-lg mx-auto"
        >
          Select an issue below or type directly above to get instant resolution for your orders or purchases and payments.
        </motion.p>
      </div>

      {/* Interactive Grid Container with Cursor Spotlight & Peer Dimming - 6 Cards */}
      <div className="group/grid w-full space-y-4">
        {/* Row 1: Core Financial & Product Protection (Pillars 1, 2, 3, 4) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Post-Purchase Support (Pillar 2) */}
          <ConsumerHelpCard
            id="refund-replacement"
            category="Post-Purchase"
            categoryColor="bg-cyan-500/15 border-cyan-500/30 text-cyan-300"
            title="Post-Purchase Support"
            description="Item arrived damaged, spoiled, wrong, or missing from your delivery? Request an immediate replacement, return pickup, or refund."
            tags={["Refund", "Replacement", "Wrong Item", "Missing Item", "Return", "Exchange"]}
            ctaText="Get Help with an Item"
            icon={Package}
            iconColor="text-cyan-400 group-hover:text-cyan-300"
            iconBg="bg-cyan-500/10 border-cyan-500/25 group-hover:bg-cyan-500/20 group-hover:border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
            gradientClass="bg-gradient-to-br from-cyan-600/20 via-blue-950/20 to-transparent"
            accentBorder="hover:border-cyan-400/40"
            spotlightColor="rgba(6, 182, 212, 0.22)"
            onClick={onPostPurchaseClick}
            onTagClick={(tag) => {
              const tagMap: Record<string, string> = {
                'Refund': 'I want a refund for my order',
                'Replacement': 'I want to replace an item from my order',
                'Wrong Item': 'I received the wrong item in my delivery',
                'Missing Item': 'An item is missing from my delivery / order package',
                'Return': 'I want to return an item',
                'Exchange': 'I want to exchange my item',
              };
              sendText(tagMap[tag] || tag);
            }}
          />

          {/* Card 2: Payment & Billing Issues (Pillars 1 & 3) */}
          <ConsumerHelpCard
            id="payment-billing"
            category="Payments & Billing"
            categoryColor="bg-purple-500/15 border-purple-500/30 text-purple-300"
            title="Payment & Billing Issues"
            description="Money debited but order failed, duplicate charges, pending bank refunds, or unauthorized transactions on your account."
            tags={[
              "Money Debited but Order Failed",
              "Charged Twice / Double Debit",
              "Refund Not Received in Bank",
              "Delivery Driver Demanded Extra Cash",
              "Unrecognized Charge"
            ]}
            ctaText="Fix Payment Issue"
            icon={CreditCard}
            iconColor="text-purple-400 group-hover:text-purple-300"
            iconBg="bg-purple-500/10 border-purple-500/25 group-hover:bg-purple-500/20 group-hover:border-purple-400/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]"
            gradientClass="bg-gradient-to-br from-purple-600/20 via-indigo-950/20 to-transparent"
            accentBorder="hover:border-purple-400/40"
            spotlightColor="rgba(168, 85, 247, 0.22)"
            onClick={() => sendText("I have a payment or billing issue with my order")}
            onTagClick={(tag) => sendText(tag)}
          />

          {/* Card 3: Subscriptions */}
          <ConsumerHelpCard
            id="subscriptions"
            category="Subscriptions"
            categoryColor="bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
            title="Subscriptions"
            description="Cancel recurring auto-debits or handle subscriptions for OTT platforms, music streaming apps, E-sports gaming, Job and Networking Apps and other tools or apps"
            tags={[
              "Cancel Auto-Debit",
              "Manage OTT & Apps",
              "Subscription Refund",
              "Change Billing Plan",
              "Accidental Subscription"
            ]}
            ctaText="Manage Subscriptions"
            icon={Repeat}
            iconColor="text-emerald-400 group-hover:text-emerald-300"
            iconBg="bg-emerald-500/10 border-emerald-500/25 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
            gradientClass="bg-gradient-to-br from-emerald-600/20 via-teal-950/20 to-transparent"
            accentBorder="hover:border-emerald-400/40"
            spotlightColor="rgba(16, 185, 129, 0.22)"
            onClick={() => sendText("I want to manage or cancel my recurring subscriptions")}
            onTagClick={(tag) => sendText(tag)}
          />
        </div>

        {/* Row 2: Search Purchases, Tickets, Others */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConsumerHelpCard
            id="order-discovery"
            category="Find Purchases"
            categoryColor="bg-blue-500/15 border-blue-500/30 text-blue-300"
            title="Find Any Order or Receipt"
            description="Can't find a purchase? Search and track orders across Swiggy, Meesho, Zomato, Amazon, and Blinkit in one place."
            tags={["Track Active Delivery", "Search Past Orders", "Multi-Store Receipts"]}
            ctaText="Find My Purchase"
            icon={Search}
            iconColor="text-blue-400 group-hover:text-blue-300"
            iconBg="bg-blue-500/10 border-blue-500/25 group-hover:bg-blue-500/20 group-hover:border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
            gradientClass="bg-gradient-to-br from-blue-600/20 via-sky-950/20 to-transparent"
            accentBorder="hover:border-blue-400/40"
            spotlightColor="rgba(59, 130, 246, 0.2)"
            onClick={() => sendText("Find my purchase")}
            onTagClick={(tag) => sendText(tag)}
          />

          <ConsumerHelpCard
            id="ticket-history"
            category="Support History"
            categoryColor="bg-amber-500/15 border-amber-500/30 text-amber-300"
            title="My Support Tickets"
            description="View previously reported issues, check the status of ongoing inquiries, and review official resolution details."
            tags={["Check Ticket Status", "Review Outcomes", "Past Complaints"]}
            ctaText="View My Tickets"
            icon={Clock}
            iconColor="text-amber-400 group-hover:text-amber-300"
            iconBg="bg-amber-500/10 border-amber-500/25 group-hover:bg-amber-500/20 group-hover:border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
            gradientClass="bg-gradient-to-br from-amber-600/20 via-orange-950/20 to-transparent"
            accentBorder="hover:border-amber-400/40"
            spotlightColor="rgba(245, 158, 11, 0.2)"
            onClick={() => sendText("Can you show me my recent support tickets and dispute dossiers?")}
            onTagClick={() => sendText("Can you show me my recent support tickets and dispute dossiers?")}
          />

          <ConsumerHelpCard
            id="others"
            category="Other Issues"
            categoryColor="bg-rose-500/15 border-rose-500/30 text-rose-300"
            title="Others"
            description="Delivery delays, rider behavior, damaged packages, app glitches, or any other issue not listed above."
            tags={[
              "Delivery Delay or Order Stuck",
              "Delivery Partner Misbehavior",
              "Driver Demanded Extra Cash",
              "App or Technical Glitch",
              "Damaged or Tampered Package",
              "Something Else"
            ]}
            ctaText="Get Help"
            icon={AlertTriangle}
            iconColor="text-rose-400 group-hover:text-rose-300"
            iconBg="bg-rose-500/10 border-rose-500/25 group-hover:bg-rose-500/20 group-hover:border-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
            gradientClass="bg-gradient-to-br from-rose-600/20 via-red-950/20 to-transparent"
            accentBorder="hover:border-rose-400/40"
            spotlightColor="rgba(244, 63, 94, 0.2)"
            onClick={() => sendText("I have an issue that is not listed here")}
            onTagClick={(tag) => sendText(tag === "Something Else" ? "I have an issue that is not listed here" : tag)}
          />
        </div>
      </div>
    </section>
  );
}
