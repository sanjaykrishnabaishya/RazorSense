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
        className="absolute top-4 left-4 h-[2px] bg-primary -z-10 transition-all duration-500" 
        style={{ width: ((currentIndex / (steps.length - 1)) * 100) + '%' }}
      ></div>

      {steps.map((step, idx) => {
        const isPast = idx < currentIndex;
        const isActive = idx === currentIndex;
        
        let circleClass = 'bg-[#030303] text-white/40 border border-white/[0.05]';
        if (isPast) circleClass = 'bg-mint text-white';
        else if (isActive) circleClass = 'bg-primary text-white';
        
        let textClass = 'text-white/40';
        if (isActive) textClass = 'text-primary';
        else if (isPast) textClass = 'text-white/60';

        return (
          <div key={step.id} className="flex flex-col items-center gap-2 bg-[#0a0a0a]/80 backdrop-blur-2xl px-2" aria-current={isActive ? 'step' : undefined}>
            <div className={"w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-colors " + circleClass}>
              {isPast ? <Check size={16} strokeWidth={3} /> : idx + 1}
            </div>
            <span className={"text-[12px] font-semibold " + textClass}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
