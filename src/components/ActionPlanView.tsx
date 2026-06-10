import { ActionItem } from '../types';
import { Sparkles, CheckSquare, Calendar, ChevronRight, Award, Trophy, Info } from 'lucide-react';

interface ActionPlanViewProps {
  highestCategory: string;
  planItems: ActionItem[];
  onToggleAction: (itemId: string) => void;
  points: number;
}

export default function ActionPlanView({ highestCategory, planItems, onToggleAction, points }: ActionPlanViewProps) {
  const completedCount = planItems.filter((i) => i.completed).length;
  const totalCO2Saved = planItems.filter((i) => i.completed).reduce((sum, item) => sum + item.co2Saved, 0);
  const earnedPoints = planItems.filter((i) => i.completed).reduce((sum, item) => sum + item.points, 0);

  const categoryLabels: Record<string, string> = {
    transport: 'Transport Commutes',
    food: 'Food & Nutrition Sourcing',
    energy: 'Home Energy & Heating',
    shopping: 'Retail Purchases',
    waste: 'Garbage & Single Use-Plastics',
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy':
        return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400';
      case 'Medium':
        return 'bg-cyan-500/10 border border-cyan-500/20 text-[#4cd7f6]';
      case 'Hard':
        return 'bg-amber-500/10 border border-amber-500/20 text-amber-500';
      default:
        return 'bg-white/5 text-white/50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" id="action-plan-module">
      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
        {/* Progress Card */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 border-t border-white/10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20 mb-3">
              <Calendar className="w-3.5 h-3.5 text-[#4edea3]" />
              <span className="text-[10px] font-mono text-[#4edea3] uppercase font-semibold">WEEKLY STRATEGY PLAN</span>
            </div>
            
            <h3 className="text-xl font-sans font-bold text-white tracking-tight">
              7-Day Reduction Plan for <span className="text-[#4edea3] capitalize">{categoryLabels[highestCategory.toLowerCase()] || highestCategory}</span>
            </h3>
            <p className="text-xs text-white/50 mt-1 max-w-xl">
              Custom-tailored schedule focusing on your high emission nodes. Toggle completion checkboxes to register eco points and update challenges.
            </p>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-2">
              <span>Weekly Completion Rate</span>
              <span>{completedCount} of 7 tasks cleared ({Math.round((completedCount / 7) * 100)}%)</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] h-full rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / 7) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Summary Card */}
        <div className="glass-panel rounded-3xl p-6 border-t border-white/10 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">EVALUATED CO2 SAVINGS</span>
              <span className="text-3xl font-extrabold text-[#4cd7f6] font-mono">{totalCO2Saved} kg</span>
              <span className="text-xs text-white/40 block">emissions saved this week</span>
            </div>

            <div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">CUMULATIVE EARNED POINTS</span>
              <span className="text-2xl font-bold text-amber-400 font-mono">+{earnedPoints} pts</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <span className="text-[10px] font-mono text-white/40 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
              Complete tasks to achieve Badges
            </span>
          </div>
        </div>
      </div>

      {/* 7 Daily Cards List */}
      <div className="space-y-4 text-left">
        <h4 className="text-sm font-bold text-white/80 uppercase font-mono tracking-wider flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-[#4edea3]" />
          Daily Schedule Breakdown
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleAction(item.id)}
              className={`glass-panel p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-start gap-4 hover:-translate-y-0.5 ${
                item.completed
                  ? 'bg-emerald-950/20 border-[#4edea3]/40'
                  : 'hover:border-white/20'
              }`}
              id={`action-item-${item.id}`}
            >
              <div 
                className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-1 flex-shrink-0 transition-all ${
                  item.completed
                    ? 'bg-[#4edea3] border-[#4edea3] text-[#003824]'
                    : 'border-white/20 bg-white/5 text-transparent'
                }`}
              >
                <CheckSquare className="w-4 h-4 stroke-[3]" />
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-mono text-white/40 uppercase font-semibold">Day {item.day}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${getDifficultyBadge(item.difficulty)}`}>
                      {item.difficulty}
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className={`text-base font-bold transition-all ${item.completed ? 'text-[#4edea3] line-through opacity-80' : 'text-white'}`}>
                    {item.title}
                  </h5>
                  <p className="text-xs text-white/50 leading-relaxed mt-1">{item.description}</p>
                </div>

                <div className="flex items-center gap-3 pt-2 font-mono text-xs">
                  <span className="text-[#4cd7f6] bg-[#4cd7f6]/5 px-2 py-0.5 rounded border border-[#4cd7f6]/10">
                    -{item.co2Saved} kg CO₂
                  </span>
                  <span className="text-amber-400 bg-amber-400/5 px-2 py-0.5 rounded border border-amber-400/10">
                    +{item.points} pts
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
