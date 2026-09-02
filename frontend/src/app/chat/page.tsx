"use client";
import React, { useState } from 'react';
import HeroSection from '../../components/hero/HeroSection';
import SupportWorkspace from '../../components/workflow/SupportWorkspace';
import { WorkflowStage, Purchase, IssueType, ChatMessage } from '../../types/support';
import { initialMessages } from '../../data/mockData';

export default function RazorSenseApp() {
  const [stage, setStage] = useState<WorkflowStage>('find-purchase');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Purchase[]>([]);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<IssueType>('refund');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  // Synchronized state handlers will go here
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-950/60 via-[#030303] to-[#030303] flex flex-col font-sans selection:bg-cyan-500/30">
      <HeroSection />
      
      {/* Overlapping Main Workspace */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 lg:px-11 -mt-[76px] z-10 mb-12 drop-shadow-sm">
        <SupportWorkspace 
          stage={stage} setStage={setStage}
          query={query} setQuery={setQuery}
          isSearching={isSearching} setIsSearching={setIsSearching}
          results={results} setResults={setResults}
          selectedPurchase={selectedPurchase} setSelectedPurchase={setSelectedPurchase}
          selectedIssue={selectedIssue} setSelectedIssue={setSelectedIssue}
          messages={messages} setMessages={setMessages}
        />
      </main>

    </div>
  );
}
