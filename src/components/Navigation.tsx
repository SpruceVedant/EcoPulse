import { useState } from 'react';
import { Leaf, LayoutDashboard, Calculator, MessageSquare, CalendarRange, Flame, HelpCircle, Eye, Menu, X, LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface NavigationProps {
  currentScreen: string;
  setScreen: (screen: string) => void;
  hasData: boolean;
  streak: number;
  points: number;
  user: any;
  onSignIn: () => void;
  onSignOut: () => void;
}

export default function Navigation({ currentScreen, setScreen, hasData, streak, points, user, onSignIn, onSignOut }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Home', icon: Leaf, requiresData: false },
    { id: 'calculator', label: 'Calculator', icon: Calculator, requiresData: false },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresData: true },
    { id: 'coach', label: 'AI Coach', icon: MessageSquare, requiresData: true },
    { id: 'action-plan', label: 'Action Plan', icon: CalendarRange, requiresData: true },
    { id: 'simulator', label: 'What-If', icon: Eye, requiresData: true },
    { id: 'gamification', label: 'Eco Arena', icon: Flame, requiresData: false },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between">
      {/* Brand Logo */}
      <button 
        onClick={() => setScreen('landing')} 
        className="flex items-center gap-2.5 text-left active:scale-95 transition-transform"
        id="nav-logo-btn"
      >
        <div className="p-2 rounded-xl bg-gradient-to-br from-[#4edea3] to-[#4cd7f6] flex items-center justify-center glow-emerald shadow-lg shadow-emerald-500/15">
          <Leaf className="w-5 h-5 text-[#003824]" />
        </div>
        <div>
          <span className="font-sans font-bold text-lg text-white tracking-tight">EcoPulse</span>
          <span className="block text-[10px] text-[#4edea3] font-mono tracking-wider font-semibold uppercase">AI Carbon Intelligence</span>
        </div>
      </button>

      {/* Desktop Menu */}
      <div className="hidden lg:flex items-center gap-1.5 bg-white/5 border border-white/5 p-1 rounded-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id;
          const disabled = item.requiresData && !hasData;

          return (
            <button
              key={item.id}
              onClick={() => !disabled && setScreen(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/20 font-medium'
                  : disabled
                  ? 'text-white/20 cursor-not-allowed'
                  : 'text-white/70 hover:text-white hover:bg-white/5'
              }`}
              title={disabled ? "Please complete the Carbon Calculator first" : ""}
              disabled={disabled}
              id={`nav-${item.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
              {disabled && (
                <span className="text-[9px] font-mono border border-white/10 px-1 rounded text-white/40">Lock</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Points & Flame Metrics & User Profile */}
      <div className="hidden sm:flex items-center gap-2.5">
        <div className="flex items-center gap-1.5 bg-[#4cd7f6]/10 border border-[#4cd7f6]/20 px-3 py-1.5 rounded-lg text-xs font-mono text-[#4cd7f6]" id="nav-points-badge">
          <span>{points} pts</span>
        </div>
        <button 
          onClick={() => setScreen('gamification')}
          className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-mono text-amber-400 active:scale-95 transition-transform"
          id="nav-streak-badge"
        >
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
          <span>{streak} Days</span>
        </button>

        {/* User Auth Section */}
        {user ? (
          <div className="flex items-center gap-2 pl-3 border-l border-white/10" id="nav-user-profile">
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  className="w-7 h-7 rounded-full border border-[#4edea3]/30"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-white/70">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
              <span className="hidden xl:inline text-xs font-semibold text-white/80 max-w-[90px] truncate" title={user.email || ''}>
                {user.displayName || user.email?.split('@')[0]}
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-rose-500/30 hover:bg-rose-500/10 text-white/50 hover:text-rose-400 transition-all cursor-pointer"
              title="Sign Out"
              id="desktop-logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onSignIn}
            className="flex items-center gap-1.5 bg-[#4edea3]/10 hover:bg-[#4edea3]/20 border border-[#4edea3]/30 hover:border-[#4edea3]/50 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-[#4edea3] transition-all active:scale-95 cursor-pointer pl-3 border-l border-white/10"
            id="desktop-login-btn"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </div>

      {/* Mobile Menu Trigger */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
        className="lg:hidden p-2 text-white/80 hover:text-white active:scale-90 transition-transform"
        id="mobile-nav-toggle"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full glass-panel border-b border-white/10 lg:hidden p-4 flex flex-col gap-2 transition-all">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            const disabled = item.requiresData && !hasData;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!disabled) {
                    setScreen(item.id);
                    setMobileMenuOpen(false);
                  }
                }}
                className={`flex items-center justify-between w-full p-3 rounded-xl text-left border transition-all ${
                  isActive
                    ? 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/20'
                    : disabled
                    ? 'opacity-40 cursor-not-allowed border-transparent text-white/50'
                    : 'text-white/80 border-transparent hover:bg-white/5 hover:text-white'
                }`}
                disabled={disabled}
                id={`drawer-nav-${item.id}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                {disabled && (
                  <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-1.5 rounded py-0.5 text-white/40">Calculator Req.</span>
                )}
              </button>
            );
          })}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            <span className="text-xs text-white/50">Your Score Metrics</span>
            <div className="flex items-center gap-2">
              <span className="bg-[#4cd7f6]/10 border border-[#4cd7f6]/25 px-2.5 py-1 rounded text-xs font-mono text-[#4cd7f6]">{points} pts</span>
              <span className="bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded text-xs font-mono text-amber-400 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                {streak} Streak
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10" id="mobile-user-profile">
            <span className="text-xs text-white/50">Your Profile</span>
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'User'} 
                      className="w-6 h-6 rounded-full border border-[#4edea3]/30"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center border border-white/10 text-white/70">
                      <UserIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-white/80">{user.displayName || user.email?.split('@')[0]}</span>
                </div>
                <button
                  onClick={() => {
                    onSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/30 text-rose-400 px-2.5 py-1 rounded text-xs transition-all cursor-pointer"
                  id="mobile-logout-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onSignIn();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 bg-[#4edea3]/10 hover:bg-[#4edea3]/20 border border-[#4edea3]/20 hover:border-[#4edea3]/30 text-[#4edea3] px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer"
                id="mobile-login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
