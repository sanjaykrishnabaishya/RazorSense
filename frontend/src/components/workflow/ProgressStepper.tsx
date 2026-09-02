import React from 'react';
import { Check } from 'lucide-react';
import { WorkflowStage } from '../../types/support';

export default function ProgressStepper({ stage }: { stage: WorkflowStage }) {
  const steps = [
    { id: 'find-purchase', label: 'Find Purchase' },
    { id: 'verify-details', label: 'Verify Details' },
    { id: 'analyse-issue', label: 'Analyse Issue' },
    { id: 'resolution', label: 'Resolution' }
  ];

  const currentIndex = steps.findIndex(s => s.id === stage);

  return (
    <div className="flex items-center justify-between relative w-full px-2">
      <div className="absolute top-4 left-4 right-4 h-[1px] bg-[var(--border-soft)] -z-10"></div>
      <div 
        className="absolute top-4 left-4 h-[2px] bg-[var(--primary)] -z-10 transition-all duration-500" 
        style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
      ></div>

      {steps.map((step, idx) => {
        const isPast = idx < currentIndex;
        const isActive = idx === currentIndex;
        
        return (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-[var(--surface)] px-2" aria-current={isActive ? 'step' : undefined}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors
              ${isPast ? 'bg-[var(--mint)] text-white' : 
                isActive ? 'bg-[var(--primary)] text-white' : 
                'bg-[var(--page-bg)] text-[var(--text-muted)] border border-[var(--border)]'}
            `}>
              {isPast ? <Check size={16} strokeWidth={3} /> : idx + 1}
            </div>
            <span className={`text-[12px] font-semibold ${isActive ? 'text-[var(--primary)]' : isPast ? 'text-[var(--text-secondary)]' : 'text-[var(--text-muted)]'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
