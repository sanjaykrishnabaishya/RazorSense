import React from 'react';
import ProgressStepper from './ProgressStepper';
import PurchaseSearch from './PurchaseSearch';
import PurchaseResults from './PurchaseResults';
import PurchaseVerification from './PurchaseVerification';
import IssueSelector from './IssueSelector';
import ChatPanel from '../chat/ChatPanel';
import { WorkflowStage, Purchase, IssueType, ChatMessage } from '../../types/support';
import { motion } from 'framer-motion';

interface Props {
  stage: WorkflowStage;
  setStage: (s: WorkflowStage) => void;
  query: string;
  setQuery: (q: string) => void;
  isSearching: boolean;
  setIsSearching: (s: boolean) => void;
  results: Purchase[];
  setResults: (r: Purchase[]) => void;
  selectedPurchase: Purchase | null;
  setSelectedPurchase: (p: Purchase | null) => void;
  selectedIssue: IssueType;
  setSelectedIssue: (i: IssueType) => void;
  messages: ChatMessage[];
  setMessages: (m: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
}

export default function SupportWorkspace(props: Props) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full h-[760px]">
      
      {/* Left Column (64%) */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="w-full lg:w-[64%] overflow-y-auto custom-scrollbar flex flex-col pt-8 pr-4"
      >
        <div className="flex-1">
          {props.stage === 'find-purchase' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <PurchaseSearch {...props} />
              {props.results.length > 0 && <PurchaseResults {...props} />}
            </motion.div>
          )}

          {props.stage === 'verify-details' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <PurchaseVerification {...props} />
            </motion.div>
          )}

          {props.stage === 'analyse-issue' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
              <IssueSelector {...props} />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Right Column (36%) */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
        className="w-full lg:w-[36%] bg-[#0a0a0a]/80 backdrop-blur-2xl rounded-[16px] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/[0.05] overflow-hidden flex flex-col h-full"
      >
        <ChatPanel {...props} />
      </motion.div>

    </div>
  );
}
