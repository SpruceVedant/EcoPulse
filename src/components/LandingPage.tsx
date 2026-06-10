import { Compass, MessageSquareCode, Eye, CalendarRange, Trophy, Leaf, Zap, ArrowRight, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  setScreen: (screen: string) => void;
  hasData: boolean;
}

export default function LandingPage({ setScreen, hasData }: LandingPageProps) {
  const features = [
    {
      title: 'Carbon Calculator',
      description: 'Answer lifestyle questions via a multi-step audit to estimate your carbon emissions.',
      icon: Compass,
      color: 'from-emerald-500/20 to-emerald-400/10',
      textColor: 'text-emerald-400',
      actionScreen: 'calculator',
    },
    {
      title: 'AI Eco Coach',
      description: 'A chatbot powered by intelligence to suggest practical habits for reduction.',
      icon: MessageSquareCode,
      color: 'from-cyan-500/20 to-cyan-400/10',
      textColor: 'text-cyan-400',
      actionScreen: 'coach',
    },
    {
      title: 'What-If Simulator',
      description: 'Interact with sliders to test transit, diet, and AC efficiency variables live.',
      icon: Eye,
      color: 'from-teal-500/20 to-teal-400/10',
      textColor: 'text-teal-400',
      actionScreen: 'simulator',
    },
    {
      title: 'Action Plan',
      description: 'Commit to weekly schedules of tasks customized for your highest carbon elements.',
      icon: CalendarRange,
      color: 'from-indigo-500/20 to-indigo-400/10',
      textColor: 'text-indigo-400',
      actionScreen: 'action-plan',
    },
    {
      title: 'Green Challenges',
      description: 'Engage with daily actions, win unique credentials, and build a lasting streak.',
      icon: Trophy,
      color: 'from-amber-500/20 to-amber-400/10',
      textColor: 'text-amber-400',
      actionScreen: 'gamification',
    },
  ];

  return (
    <div className="relative py-12 md:py-24 px-4 overflow-hidden" id="landing-page">
      {/* Background radial glowing gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#4edea3]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-1/4 w-[400px] h-[400px] bg-[#4cd7f6]/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Landing Hero Container */}
      <div className="max-w-5xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6 backdrop-blur-md">
          <Leaf className="w-4 h-4 text-[#4edea3]" />
          <span className="text-[11px] font-mono font-semibold tracking-wider text-[#4edea3] uppercase">INTELLIGENT INSIGHT PLATFORM</span>
        </div>

        <h1 className="font-sans font-extrabold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto">
          Understand Your Carbon Footprint. <span className="bg-gradient-to-r from-[#4edea3] via-[#4cd7f6] to-[#adc6ff] bg-clip-text text-transparent">Reduce It With AI.</span>
        </h1>

        <p className="font-sans text-white/70 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed mb-10">
          Track your lifestyle impact, discover hidden carbon habits, and get personalized weekly actions to reduce your emissions. Made for modern, data-focused climate action.
        </p>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button
            onClick={() => setScreen('calculator')}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] text-[#003824] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 hover:brightness-105 hover:shadow-cyan-500/10 transition-all font-sans cursor-pointer group"
            id="landing-calc-btn"
          >
            <Zap className="w-5 h-5 fill-[#003824]" />
            <span>Calculate My Footprint</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button
            onClick={() => setScreen(hasData ? 'dashboard' : 'calculator')}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              hasData 
                ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' 
                : 'bg-white/5 text-white/50 border-white/10 hover:border-white/20'
            }`}
            id="landing-dashboard-btn"
          >
            <span>View Dashboard</span>
          </button>
        </div>

        {/* Platform Features Grid */}
        <div className="text-left">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-8 pb-4 border-b border-white/5">
            <div>
              <h2 className="font-sans font-bold text-2xl text-white tracking-tight">Interactive Platform Modules</h2>
              <p className="text-white/50 text-sm mt-1">Explore custom tools built to analyze and decrease greenhouse effects.</p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-2 text-xs font-mono text-[#4edea3]">
              <ShieldCheck className="w-4 h-4" />
              <span>Full local preservation & calculations</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const IconComponent = feat.icon;
              const disabled = feat.actionScreen !== 'calculator' && feat.actionScreen !== 'gamification' && !hasData;

              return (
                <div
                  key={feat.title}
                  onClick={() => !disabled && setScreen(feat.actionScreen)}
                  className={`glass-panel p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${
                    disabled 
                      ? 'opacity-60 cursor-not-allowed border-white/5 hover:border-white/10' 
                      : 'hover:border-white/20 hover:bg-white/[0.08] cursor-pointer hover:-translate-y-1'
                  }`}
                  id={`feature-card-${feat.textColor}`}
                >
                  {/* Subtle inner background accent glow */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feat.color} rounded-full blur-[30px] opacity-20 pointer-events-none group-hover:scale-125 transition-transform`} />

                  <div className="relative z-10">
                    <div className={`p-3 rounded-xl bg-white/5 border border-white/10 w-fit mb-4 ${feat.textColor} relative`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <h3 className="font-sans font-bold text-lg text-white group-hover:text-[#4edea3] transition-colors">{feat.title}</h3>
                    <p className="text-white/60 text-sm mt-2 leading-relaxed">
                      {feat.description}
                    </p>
                    
                    <div className="mt-5 flex items-center justify-between text-xs font-mono">
                      {disabled ? (
                        <span className="text-white/30 border border-white/10 px-2 py-0.5 rounded">Unlock via calculator</span>
                      ) : (
                        <span className={`${feat.textColor} group-hover:underline flex items-center gap-1`}>
                          Open module
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
