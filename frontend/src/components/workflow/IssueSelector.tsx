import React from 'react';
import { FileText, RefreshCcw, Package, PackageX, TriangleAlert, CreditCard, Ellipsis, ArrowRight } from 'lucide-react';
import { IssueType } from '../../types/support';

export default function IssueSelector({ selectedIssue, setSelectedIssue, setStage, setMessages }: any) {
  
  const issues = [
    { id: 'refund', label: 'Refund', desc: 'I want a refund', icon: RefreshCcw, color: 'text-[var(--mint-dark)]', bgHover: 'hover:bg-[var(--mint-soft)]' },
    { id: 'replacement', label: 'Replacement', desc: 'I want a replacement', icon: Package, color: 'text-[var(--violet)]', bgHover: 'hover:bg-[var(--violet-soft)]' },
    { id: 'wrong-item', label: 'Wrong or different item', desc: 'Received different product', icon: PackageX, color: 'text-purple-600', bgHover: 'hover:bg-purple-50' },
    { id: 'product-issue', label: 'Product issue', desc: 'Damaged / faulty', icon: TriangleAlert, color: 'text-[var(--warning)]', bgHover: 'hover:bg-[var(--warning-soft)]' },
    { id: 'payment-issue', label: 'Payment issue', desc: 'Charged twice, failed payment', icon: CreditCard, color: 'text-orange-600', bgHover: 'hover:bg-orange-50' },
    { id: 'other', label: 'Other', desc: 'Something else', icon: Ellipsis, color: 'text-[var(--primary)]', bgHover: 'hover:bg-[var(--primary-soft)]' }
  ];

  const handleSelect = (id: string) => {
    setSelectedIssue(id as IssueType);
    const msgId = Date.now().toString();
    setMessages((prev: any) => [...prev, {
      id: msgId,
      role: 'assistant',
      kind: 'text',
      text: "You selected: " + id.replace('-', ' ') + ". Can you provide more details or upload an image?",
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }]);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary-soft)] flex items-center justify-center text-[var(--primary)]">
          <FileText size={24} />
        </div>
        <div>
          <h2 className="text-[22px] font-[800] tracking-tight">What's the issue?</h2>
          <p className="text-[15px] text-[var(--text-secondary)]">Select the option that best describes your issue.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mt-4">
        {issues.map(issue => {
          const isActive = selectedIssue === issue.id;
          const containerClass = isActive 
            ? 'border-[var(--mint)] bg-[var(--mint-soft)] shadow-[inset_0_0_0_1px_var(--mint)]' 
            : 'border-[var(--border)] bg-white hover:border-[var(--primary)] ' + issue.bgHover;
            
          const iconColorClass = isActive ? 'text-[var(--mint-dark)]' : issue.color;

          return (
            <button
              key={issue.id}
              onClick={() => handleSelect(issue.id)}
              className={"flex flex-col items-center text-center p-4 rounded-[10px] border transition-all duration-200 " + containerClass}
            >
              <issue.icon size={28} className={"mb-3 " + iconColorClass} />
              <span className="text-[14px] font-bold text-[var(--text)] leading-tight">{issue.label}</span>
              <span className="text-[12px] text-[var(--text-secondary)] mt-1 leading-tight">{issue.desc}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-6">
        <button 
          onClick={() => setStage('resolution')}
          className="bg-gradient-to-b from-[var(--primary)] to-[var(--primary-dark)] text-white px-8 py-3.5 rounded-lg font-semibold text-[15px] flex items-center justify-center gap-2 transition hover:shadow-md"
        >
          Continue <ArrowRight size={18} />
        </button>
        <span className="text-[13px] text-[var(--text-muted)]">Upload evidence in chat first to continue</span>
      </div>
    </div>
  );
}
