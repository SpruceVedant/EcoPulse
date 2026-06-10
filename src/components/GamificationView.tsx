import { Badge, DailyChallenge } from '../types';
import { Trophy, Flame, Target, Compass, MessageCircleCode, ShieldAlert, CheckSquare, TrendingDown, Eye, CheckCircle, Award } from 'lucide-react';

interface GamificationViewProps {
  streak: number;
  points: number;
  badges: Badge[];
  challenges: DailyChallenge[];
  onCompleteChallenge: (challengeId: string) => void;
  onClaimDailyStreak: () => void;
}

export default function GamificationView({
  streak,
  points,
  badges,
  challenges,
  onCompleteChallenge,
  onClaimDailyStreak,
}: GamificationViewProps) {
  // Map string icon name to Lucide icons
  const getBadgeIcon = (iconName: string, unlocked: boolean) => {
    const iconProps = { className: `w-6 h-6 ${unlocked ? 'text-[#4edea3]' : 'text-white/20'}` };
    switch (iconName) {
      case 'Compass':
        return <Compass {...iconProps} />;
      case 'ShieldAlert':
        return <ShieldAlert {...iconProps} />;
      case 'MessageCircleCode':
        return <MessageCircleCode {...iconProps} />;
      case 'Flame':
        return <Flame {...iconProps} />;
      case 'TrendingDown':
        return <TrendingDown {...iconProps} />;
      case 'CheckSquare':
        return <CheckSquare {...iconProps} />;
      default:
        return <Award {...iconProps} />;
    }
  };

  // Compute Eco score level
  const totalEcoScore = 150 + points + streak * 15;
  const currentLevel = Math.floor(totalEcoScore / 100);
  const nextLevelPoints = (currentLevel + 1) * 100;
  const progressRatio = Math.min(100, Math.round(((totalEcoScore % 100) / 100) * 100));

  const getRankName = (lvl: number) => {
    if (lvl <= 1) return 'Eco Recruit';
    if (lvl === 2) return 'Active Preserver';
    if (lvl === 3) return 'Forest Guardian';
    if (lvl === 4) return 'Carbon Alchemist';
    return 'Planet Savior';
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4" id="eco-arena-module">
      
      {/* Overview Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-left">
        
        {/* Tier Level and Level Progress */}
        <div className="md:col-span-2 glass-panel rounded-3xl p-6 border-t border-white/10 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-3">
              <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
              <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold">ECO PULSE LEAGUE</span>
            </div>

            <div className="flex items-center justify-between text-left">
              <div>
                <h3 className="text-xl font-sans font-extrabold text-white">
                  Rank: <span className="text-amber-400">{getRankName(currentLevel)}</span>
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Tier determined by total eco score. Build points by completing daily challenges and action plans.
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-white font-mono bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-2xl block">
                  Lvl {currentLevel}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between text-xs font-mono text-white/50 mb-2">
              <span>Next Rank Progress ({totalEcoScore} / {nextLevelPoints} exp)</span>
              <span>{progressRatio}% Completed</span>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-amber-400 to-[#4edea3] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressRatio}%` }}
              />
            </div>
          </div>
        </div>

        {/* Daily Streak Claim Card */}
        <div className="glass-panel rounded-3xl p-6 border-t border-white/10 flex flex-col justify-between relative overflow-hidden text-center group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all" />
          
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">ACTIVE STREAK</span>
            <div className="inline-flex items-center justify-center gap-2 my-2.5">
              <Flame className="w-10 h-10 text-amber-500 fill-amber-500 animate-pulse" />
              <span className="text-4xl font-extrabold text-white font-mono">{streak} Days</span>
            </div>
            <p className="text-[11px] text-white/50 leading-relaxed mb-4">
              Commit to ecological tasks daily to log credentials. Reset triggers if missing 24 hours.
            </p>
          </div>

          <button
            onClick={onClaimDailyStreak}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-[#4edea3] text-[#003824] text-xs font-bold shadow-lg shadow-amber-500/10 hover:brightness-105 active:scale-95 transition-all cursor-pointer"
            id="claim-streak-btn"
          >
            Claim Daily Streak (+20 pts)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
        
        {/* Left Side: Daily Challenges List */}
        <div className="lg:col-span-3 space-y-4">
          <h4 className="text-xs font-bold text-white/60 font-mono uppercase tracking-widest flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-[#4edea3]" />
            Active Daily Challenges
          </h4>

          {challenges.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.completed && onCompleteChallenge(item.id)}
              className={`glass-panel p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                item.completed
                  ? 'bg-emerald-950/20 border-[#4edea3]/30 cursor-not-allowed opacity-80'
                  : 'hover:border-white/20 cursor-pointer active:scale-[0.99]'
              }`}
              id={`challenge-item-${item.id}`}
            >
              <div 
                className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-1 flex-shrink-0 transition-all ${
                  item.completed
                    ? 'bg-[#4edea3] border-[#4edea3] text-[#003824]'
                    : 'border-white/20 bg-white/5 text-transparent'
                }`}
              >
                <CheckCircle className="w-4 h-4 stroke-[3]" />
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h5 className={`text-base font-bold text-white ${item.completed ? 'opacity-50 line-through' : ''}`}>
                    {item.title}
                  </h5>
                  {item.completed ? (
                    <span className="text-[10px] font-mono text-[#4edea3] bg-[#4edea3]/5 px-2 py-0.5 rounded border border-[#4edea3]/20">
                      Completed
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-white/30 border border-white/5 px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/50 leading-relaxed mt-1">{item.description}</p>
                
                <div className="flex items-center gap-2.5 pt-3 font-mono text-xs">
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

        {/* Right Side: Badges Collections */}
        <div className="lg:col-span-2 space-y-4">
          <h4 className="text-xs font-bold text-white/60 font-mono uppercase tracking-widest flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-[#4cd7f6]" />
            Your Badges Collection
          </h4>

          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`glass-panel p-4 rounded-2xl border transition-all relative overflow-hidden text-center flex flex-col items-center justify-center gap-3 ${
                  badge.unlocked
                    ? 'border-[#4edea3]/30 bg-gradient-to-br from-[#1a1c20] to-[#122c22]/10 glow-emerald'
                    : 'opacity-40 border-white/5 bg-[#14161a]'
                }`}
                id={`badge-cell-${badge.id}`}
                title={badge.unlocked ? `Unlocked! ${badge.description}` : `Locked: ${badge.description}`}
              >
                {/* Active glow */}
                {badge.unlocked && (
                  <div className="absolute top-0 right-0 w-12 h-12 bg-[#4edea3]/5 rounded-full blur-[20px] pointer-events-none" />
                )}

                <div className={`p-3 rounded-full border bg-white/5 ${badge.unlocked ? 'border-[#4edea3]/20' : 'border-white/10'}`}>
                  {getBadgeIcon(badge.icon, badge.unlocked)}
                </div>

                <div>
                  <h5 className="text-xs font-bold text-white capitalize leading-tight">{badge.name}</h5>
                  <p className="text-[10px] text-white/50 leading-tight mt-1 hidden sm:block max-w-[120px] mx-auto">
                    {badge.description}
                  </p>
                </div>

                {badge.unlocked ? (
                  <span className="text-[9px] font-mono text-[#4edea3] tracking-wider uppercase font-semibold">Unlocked</span>
                ) : (
                  <span className="text-[9px] font-mono text-white/30 truncate max-w-[100px]">Locked</span>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
