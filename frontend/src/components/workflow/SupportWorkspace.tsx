import React from 'react';
import ProgressStepper from './ProgressStepper';
import PurchaseSearch from './PurchaseSearch';
import PurchaseResults from './PurchaseResults';
import PurchaseVerification from './PurchaseVerification';
import IssueSelector from './IssueSelector';
import ChatPanel from '../chat/ChatPanel';
import { WorkflowStage, Purchase, IssueType, ChatMessage } from '../../types/support';

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
      <div className="w-full lg:w-[64%] bg-surface rounded-[16px] shadow-custom-lg border border-border-main overflow-y-auto custom-scrollbar flex flex-col p-8">
        <ProgressStepper stage={props.stage} />
        
        <div className="mt-8 flex-1">
          {props.stage === 'find-purchase' && (
            <>
              <PurchaseSearch {...props} />
              {props.results.length > 0 && <PurchaseResults {...props} />}
            </>
          )}

          {props.stage === 'verify-details' && (
            <PurchaseVerification {...props} />
          )}

          {props.stage === 'analyse-issue' && (
            <IssueSelector {...props} />
          )}
        </div>
      </div>

      {/* Right Column (36%) */}
      <div className="w-full lg:w-[36%] bg-surface rounded-[16px] shadow-custom-lg border border-border-main overflow-hidden flex flex-col h-full">
        <ChatPanel {...props} />
      </div>

    </div>
  );
}
