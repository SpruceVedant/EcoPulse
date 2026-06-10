import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import LandingPage from './components/LandingPage';
import CarbonCalculator from './components/CarbonCalculator';
import DashboardView from './components/DashboardView';
import AiCoach from './components/AiCoach';
import ActionPlanView from './components/ActionPlanView';
import WhatIfSimulator from './components/WhatIfSimulator';
import GamificationView from './components/GamificationView';

import { FootprintData, Badge, ActionItem, DailyChallenge } from './types';
import { INITIAL_BADGES, INITIAL_CHALLENGES, generate7DayActionPlan } from './utils/carbonCalculator';
import { Leaf, Award, X, Sparkles, Cloud, CloudLightning } from 'lucide-react';

// Firebase imports
import { auth, db, googleProvider, OperationType, handleFirestoreError } from './utils/firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';

export default function App() {
  const [currentScreen, setScreen] = useState<string>('landing');
  const [footprintData, setFootprintData] = useState<FootprintData | null>(null);
  
  // Gamification metrics
  const [streak, setStreak] = useState<number>(3); // Onboarding defaults
  const [points, setPoints] = useState<number>(120);
  const [badges, setBadges] = useState<Badge[]>([...INITIAL_BADGES]);
  const [planItems, setPlanItems] = useState<ActionItem[]>([]);
  const [challenges, setChallenges] = useState<DailyChallenge[]>([...INITIAL_CHALLENGES]);

  // Firebase auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Alert/achievement notifications modal
  const [notification, setNotification] = useState<{ title: string; desc: string; icon: string } | null>(null);

  // Trigger achievement toast notification
  const triggerNotification = (title: string, desc: string, icon: string = 'Award') => {
    setNotification({ title, desc, icon });
    setTimeout(() => setNotification(null), 4500);
  };

  // Helper to sync points and streak to Firestore
  const syncUserPointsAndStreak = async (uPoints: number, uStreak: number) => {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), {
          uid: auth.currentUser.uid,
          points: uPoints,
          streak: uStreak,
          email: auth.currentUser.email || '',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${auth.currentUser.uid}`);
      }
    }
  };

  // Helper to save a single footprint to Firestore
  const saveFootprintToFirestore = async (uid: string, footprintId: string, footprint: FootprintData) => {
    try {
      await setDoc(doc(db, 'users', uid, 'footprints', footprintId), {
        userId: uid,
        totalFootprint: footprint.totalFootprint,
        carbonScore: footprint.carbonScore,
        completedAt: footprint.completedAt,
        categories: footprint.categories,
        inputs: footprint.inputs
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}/footprints/${footprintId}`);
    }
  };

  // Load from localStorage on mount & listen to Firebase Auth
  useEffect(() => {
    // 1. Initial Local Cache Load
    try {
      const storedFootprint = localStorage.getItem('ecopulse_footprint');
      const storedPoints = localStorage.getItem('ecopulse_points');
      const storedStreak = localStorage.getItem('ecopulse_streak');
      const storedBadges = localStorage.getItem('ecopulse_badges');
      const storedPlan = localStorage.getItem('ecopulse_plans');
      const storedChallenges = localStorage.getItem('ecopulse_challenges');

      if (storedFootprint) {
        const parsed = JSON.parse(storedFootprint) as FootprintData;
        setFootprintData(parsed);

        // Read history or initialize if it doesn't exist
        const storedHistoryStr = localStorage.getItem('ecopulse_history');
        if (!storedHistoryStr) {
          const now = new Date();
          const initializedHistory: FootprintData[] = [];
          for (let i = 5; i > 0; i--) {
            const pastDate = new Date();
            pastDate.setMonth(now.getMonth() - i);
            const factor = 1 + (0.07 * i);
            initializedHistory.push({
              totalFootprint: Math.round(parsed.totalFootprint * factor),
              carbonScore: parsed.carbonScore,
              categories: {
                transport: Math.round(parsed.categories.transport * factor),
                food: Math.round(parsed.categories.food * factor),
                energy: Math.round(parsed.categories.energy * factor),
                shopping: Math.round(parsed.categories.shopping * factor),
                waste: Math.round(parsed.categories.waste * factor),
              },
              inputs: { ...parsed.inputs },
              completedAt: pastDate.toISOString(),
            });
          }
          initializedHistory.push(parsed);
          localStorage.setItem('ecopulse_history', JSON.stringify(initializedHistory));
        }

        // Populate weekly actions based on highest category
        if (storedPlan) {
          setPlanItems(JSON.parse(storedPlan));
        } else {
          const highestObj = Object.entries(parsed.categories).reduce(
            (max, [key, val]) => (val > max.value ? { category: key, value: val } : max),
            { category: 'energy', value: -1 }
          );
          setPlanItems(generate7DayActionPlan(highestObj.category));
        }
      }

      if (storedPoints) setPoints(parseInt(storedPoints));
      if (storedStreak) setStreak(parseInt(storedStreak));
      if (storedBadges) setBadges(JSON.parse(storedBadges));
      if (storedChallenges) setChallenges(JSON.parse(storedChallenges));
    } catch (e) {
      console.error("Failed to load local cached eco pulse state:", e);
    }

    // 2. Firebase Auth Synchronizer
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthLoading(true);
      if (user) {
        setCurrentUser(user);
        
        // Synchronize state with Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            // User profile exists on cloud! Sync from cloud to local
            const userData = userDocSnap.data();
            
            const cloudPoints = userData.points ?? 120;
            const cloudStreak = userData.streak ?? 3;
            setPoints(cloudPoints);
            setStreak(cloudStreak);
            localStorage.setItem('ecopulse_points', cloudPoints.toString());
            localStorage.setItem('ecopulse_streak', cloudStreak.toString());
            
            // Get footprint history subcollection
            const footprintSnap = await getDocs(collection(db, 'users', user.uid, 'footprints'));
            const cloudHistory: FootprintData[] = [];
            footprintSnap.forEach((doc) => {
              cloudHistory.push(doc.data() as FootprintData);
            });
            cloudHistory.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
            
            if (cloudHistory.length > 0) {
              const activeFootprint = cloudHistory[cloudHistory.length - 1];
              setFootprintData(activeFootprint);
              localStorage.setItem('ecopulse_footprint', JSON.stringify(activeFootprint));
              localStorage.setItem('ecopulse_history', JSON.stringify(cloudHistory));
            } else {
              setFootprintData(null);
              localStorage.removeItem('ecopulse_footprint');
              localStorage.removeItem('ecopulse_history');
            }
            
            // Get Badges
            const badgesSnap = await getDocs(collection(db, 'users', user.uid, 'badges'));
            const cloudBadgesMap: Record<string, Badge> = {};
            badgesSnap.forEach((doc) => {
              cloudBadgesMap[doc.id] = doc.data() as Badge;
            });
            const mergedBadges = INITIAL_BADGES.map((b) => {
              if (cloudBadgesMap[b.id]) {
                return { ...b, ...cloudBadgesMap[b.id] };
              }
              return b;
            });
            setBadges(mergedBadges);
            localStorage.setItem('ecopulse_badges', JSON.stringify(mergedBadges));
            
            // Get Plan Items
            const plansSnap = await getDocs(collection(db, 'users', user.uid, 'plans'));
            const cloudPlans: ActionItem[] = [];
            plansSnap.forEach((doc) => {
              cloudPlans.push(doc.data() as ActionItem);
            });
            if (cloudPlans.length > 0) {
              setPlanItems(cloudPlans);
              localStorage.setItem('ecopulse_plans', JSON.stringify(cloudPlans));
            } else {
              setPlanItems([]);
              localStorage.removeItem('ecopulse_plans');
            }
            
            // Get Challenges
            const challengesSnap = await getDocs(collection(db, 'users', user.uid, 'challenges'));
            const cloudChallengesMap: Record<string, DailyChallenge> = {};
            challengesSnap.forEach((doc) => {
              cloudChallengesMap[doc.id] = doc.data() as DailyChallenge;
            });
            const mergedChallenges = INITIAL_CHALLENGES.map((c) => {
              if (cloudChallengesMap[c.id]) {
                return { ...c, ...cloudChallengesMap[c.id] };
              }
              return c;
            });
            setChallenges(mergedChallenges);
            localStorage.setItem('ecopulse_challenges', JSON.stringify(mergedChallenges));
            
            triggerNotification('Cloud Sync Complete', `Welcome back, ${user.displayName || 'Eco Warrior'}! Your progression was loaded from the cloud.`, 'ShieldCheck');
          } else {
            // High-fidelity local onboarding to cloud migration
            // Create profile
            const currentPoints = parseInt(localStorage.getItem('ecopulse_points') || '120');
            const currentStreak = parseInt(localStorage.getItem('ecopulse_streak') || '3');
            
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              points: currentPoints,
              streak: currentStreak,
              email: user.email || '',
              updatedAt: new Date().toISOString()
            });

            // Sync current active footprint & history if they exist
            const storedHistoryStr = localStorage.getItem('ecopulse_history');
            const localHistory: FootprintData[] = storedHistoryStr ? JSON.parse(storedHistoryStr) : [];
            const localActiveFootprintStr = localStorage.getItem('ecopulse_footprint');
            const localActiveFootprint = localActiveFootprintStr ? JSON.parse(localActiveFootprintStr) : null;

            const finalHistory = [...localHistory];
            if (finalHistory.length === 0 && localActiveFootprint) {
              finalHistory.push(localActiveFootprint);
            }

            for (let idx = 0; idx < finalHistory.length; idx++) {
              const item = finalHistory[idx];
              const fid = item.completedAt ? item.completedAt.replace(/[^a-zA-Z0-9_\-]+/g, '_') : `footprint_${idx}`;
              await setDoc(doc(db, 'users', user.uid, 'footprints', fid), {
                userId: user.uid,
                totalFootprint: item.totalFootprint,
                carbonScore: item.carbonScore,
                completedAt: item.completedAt,
                categories: item.categories,
                inputs: item.inputs
              });
            }

            // Sync badges
            let currentBadges = [...badges];
            try {
              const bCache = localStorage.getItem('ecopulse_badges');
              if (bCache) currentBadges = JSON.parse(bCache);
            } catch (err) {}
            for (const b of currentBadges) {
              await setDoc(doc(db, 'users', user.uid, 'badges', b.id), b);
            }

            // Sync current plans
            let currentPlans = [...planItems];
            try {
              const pCache = localStorage.getItem('ecopulse_plans');
              if (pCache) currentPlans = JSON.parse(pCache);
            } catch (err) {}
            for (const p of currentPlans) {
              await setDoc(doc(db, 'users', user.uid, 'plans', p.id), p);
            }

            // Sync challenges
            let currentChallenges = [...challenges];
            try {
              const cCache = localStorage.getItem('ecopulse_challenges');
              if (cCache) currentChallenges = JSON.parse(cCache);
            } catch (err) {}
            for (const c of currentChallenges) {
              await setDoc(doc(db, 'users', user.uid, 'challenges', c.id), c);
            }

            triggerNotification('Account Linked successfully!', 'Your existing calculations and badges have been backed up to the cloud.', 'ShieldCheck');
          }
        } catch (err) {
          console.error("Cloud linking error:", err);
          triggerNotification('Sync Interrupted', 'Offline caching preserved. Check your internet connectivity.', 'AlertTriangle');
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Safe manual Google Authentication trigger
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error("Google Authentication error:", err);
      triggerNotification('Sign In Action Cancelled', 'The Google login popup was either blocked or closed.', 'AlertTriangle');
    }
  };

  // Safe manual Logout trigger
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear client session cache
      localStorage.clear();
      // Reset layout states back to baseline
      setFootprintData(null);
      setPoints(120);
      setStreak(3);
      setBadges([...INITIAL_BADGES]);
      setPlanItems([]);
      setChallenges([...INITIAL_CHALLENGES]);
      setScreen('landing');
      triggerNotification('Signed Out Successfully', 'Cleared all local session memory. Feel free to recalculate anytime!');
    } catch (err) {
      console.error("Sign Out error:", err);
    }
  };

  // Save changes to localStorage on adjustments
  const saveState = (
    updatedFootprint: FootprintData | null,
    updatedPoints: number,
    updatedStreak: number,
    updatedBadges: Badge[],
    updatedPlan: ActionItem[],
    updatedChallenges: DailyChallenge[]
  ) => {
    try {
      if (updatedFootprint) localStorage.setItem('ecopulse_footprint', JSON.stringify(updatedFootprint));
      localStorage.setItem('ecopulse_points', updatedPoints.toString());
      localStorage.setItem('ecopulse_streak', updatedStreak.toString());
      localStorage.setItem('ecopulse_badges', JSON.stringify(updatedBadges));
      localStorage.setItem('ecopulse_plans', JSON.stringify(updatedPlan));
      localStorage.setItem('ecopulse_challenges', JSON.stringify(updatedChallenges));
    } catch (e) {
      console.warn("Storage update failed:", e);
    }
  };


  // Handle calculation updates
  const handleCalculationComplete = async (result: FootprintData) => {
    setFootprintData(result);
    setScreen('dashboard');

    // Update history in localStorage
    let currentHistory: FootprintData[] = [];
    try {
      const storedHistoryStr = localStorage.getItem('ecopulse_history');
      if (storedHistoryStr) {
        currentHistory = JSON.parse(storedHistoryStr);
      } else {
        // Seed history if none exists
        const now = new Date();
        for (let i = 5; i > 0; i--) {
          const pastDate = new Date();
          pastDate.setMonth(now.getMonth() - i);
          const factor = 1 + (0.07 * i);
          currentHistory.push({
            totalFootprint: Math.round(result.totalFootprint * factor),
            carbonScore: result.carbonScore,
            categories: {
              transport: Math.round(result.categories.transport * factor),
              food: Math.round(result.categories.food * factor),
              energy: Math.round(result.categories.energy * factor),
              shopping: Math.round(result.categories.shopping * factor),
              waste: Math.round(result.categories.waste * factor),
            },
            inputs: { ...result.inputs },
            completedAt: pastDate.toISOString(),
          });
        }
      }
      currentHistory.push(result);
      localStorage.setItem('ecopulse_history', JSON.stringify(currentHistory));
    } catch (e) {
      console.error("Failed to update history array in localStorage:", e);
    }

    // Generate dynamic plan
    const highestObj = Object.entries(result.categories).reduce(
      (max, [key, val]) => (val > max.value ? { category: key, value: val } : max),
      { category: 'energy', value: -1 }
    );
    const newPlanList = generate7DayActionPlan(highestObj.category);
    setPlanItems(newPlanList);

    // Evaluate badges updates
    let updatedBadges = [...badges];
    let pointsBonus = 0;

    // Badge 1: Compas Cartographer (Calculate footprint)
    const mapBadge = updatedBadges.find((b) => b.id === 'b1');
    if (mapBadge && !mapBadge.unlocked) {
      mapBadge.unlocked = true;
      mapBadge.unlockedAt = new Date().toISOString();
      pointsBonus += 50;
      triggerNotification('Badge Unlocked: Carbon Cartographer!', 'Completed first carbon footprint calculation! (+50 pts)');
    }

    // Badge 2: Low impact legend (Achievement score is Low)
    if (result.carbonScore === 'Low') {
      const shieldBadge = updatedBadges.find((b) => b.id === 'b2');
      if (shieldBadge && !shieldBadge.unlocked) {
        shieldBadge.unlocked = true;
        shieldBadge.unlockedAt = new Date().toISOString();
        pointsBonus += 100;
        triggerNotification('Badge Unlocked: Low Impact Legend!', 'Attained a rated carbon profile score. Outstanding! (+100 pts)');
      }
    }

    const newPoints = points + pointsBonus + 30; // standard calculation points
    setPoints(newPoints);
    setBadges(updatedBadges);

    saveState(result, newPoints, streak, updatedBadges, newPlanList, challenges);

    if (auth.currentUser) {
      const fid = result.completedAt.replace(/[^a-zA-Z0-9_\-]+/g, '_');
      await saveFootprintToFirestore(auth.currentUser.uid, fid, result);
      
      // Sync badges to cloud
      for (const b of updatedBadges) {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'badges', b.id), b);
      }
      // Sync plan to cloud
      for (const p of newPlanList) {
        await setDoc(doc(db, 'users', auth.currentUser.uid, 'plans', p.id), p);
      }
      await syncUserPointsAndStreak(newPoints, streak);
    }

    triggerNotification('Evaluation Saved!', 'Your footprint inputs were saved successfully.');
  };

  // Badge Unlock Event dispatchers
  const handleUnlockBadgeDirectly = async (badgeId: string) => {
    const updated = badges.map((b) => {
      if (b.id === badgeId && !b.unlocked) {
        triggerNotification(`Badge Unlocked: ${b.name}!`, `${b.description} (+50 pts)`);
        const np = points + 50;
        setPoints(np);
        const updatedBadge = { ...b, unlocked: true, unlockedAt: new Date().toISOString() };
        
        if (auth.currentUser) {
          setDoc(doc(db, 'users', auth.currentUser.uid, 'badges', badgeId), updatedBadge);
          syncUserPointsAndStreak(np, streak);
        }
        saveState(footprintData, np, streak, badges.map(x => x.id === badgeId ? updatedBadge : x), planItems, challenges);
        return updatedBadge;
      }
      return b;
    });
    setBadges(updated);
  };

  // Toggle action item checklists
  const handleToggleAction = async (itemId: string) => {
    let ptsAdjustment = 0;
    const updated = planItems.map((item) => {
      if (item.id === itemId) {
        const nextState = !item.completed;
        ptsAdjustment = nextState ? item.points : -item.points;
        const updatedItem = { ...item, completed: nextState };
        if (auth.currentUser) {
          setDoc(doc(db, 'users', auth.currentUser.uid, 'plans', itemId), updatedItem);
        }
        return updatedItem;
      }
      return item;
    });

    setPlanItems(updated);

    const newPoints = Math.max(0, points + ptsAdjustment);
    setPoints(newPoints);

    // Evaluate Badge 6: completed at least 3 actions
    const completedActs = updated.filter((i) => i.completed).length;
    let updatedBadges = [...badges];
    if (completedActs >= 3) {
      const actionBadge = updatedBadges.find((b) => b.id === 'b6');
      if (actionBadge && !actionBadge.unlocked) {
        actionBadge.unlocked = true;
        actionBadge.unlockedAt = new Date().toISOString();
        triggerNotification('Badge Unlocked: Action Pack Champion!', 'Completed three action items! (+50 pts)');
        const finalPoints = newPoints + 50;
        setPoints(finalPoints);
        if (auth.currentUser) {
          await setDoc(doc(db, 'users', auth.currentUser.uid, 'badges', 'b6'), actionBadge);
          await syncUserPointsAndStreak(finalPoints, streak);
        }
        saveState(footprintData, finalPoints, streak, updatedBadges, updated, challenges);
        setBadges(updatedBadges);
        return;
      }
    }

    if (auth.currentUser) {
      await syncUserPointsAndStreak(newPoints, streak);
    }
    saveState(footprintData, newPoints, streak, updatedBadges, updated, challenges);
  };

  // Handle Completing Daily Challenges
  const handleCompleteChallenge = async (id: string) => {
    let addedPoints = 0;
    let tempPoints = points;
    let updatedBadges = [...badges];
    
    const updated = challenges.map((c) => {
      if (c.id === id && !c.completed) {
        addedPoints = c.points;
        triggerNotification('Challenge Finished!', `Completed "${c.title}"! (+${c.points} pts)`);
        
        const completedCh = { ...c, completed: true };
        if (auth.currentUser) {
          setDoc(doc(db, 'users', auth.currentUser.uid, 'challenges', id), completedCh);
        }
        
        // Unlock Badge 4 : Green Streak Pioneer (if streak starts/completes challenge)
        const strBadge = updatedBadges.find((b) => b.id === 'b4');
        if (strBadge && !strBadge.unlocked) {
          strBadge.unlocked = true;
          strBadge.unlockedAt = new Date().toISOString();
          triggerNotification('Badge Unlocked: Green Streak Pioneer!', 'Unlocked for finishing a challenge! (+50 pts)');
          tempPoints += 50;
          if (auth.currentUser) {
            setDoc(doc(db, 'users', auth.currentUser.uid, 'badges', 'b4'), strBadge);
          }
        }
        return completedCh;
      }
      return c;
    });

    setChallenges(updated);
    setBadges(updatedBadges);
    
    const finalPoints = tempPoints + addedPoints;
    setPoints(finalPoints);

    if (auth.currentUser) {
      await syncUserPointsAndStreak(finalPoints, streak);
    }
    saveState(footprintData, finalPoints, streak, updatedBadges, planItems, updated);
  };

  // Daily Streak Increments
  const handleClaimDailyStreak = async () => {
    const updatedStreak = streak + 1;
    setStreak(updatedStreak);

    const updatedPoints = points + 20;
    setPoints(updatedPoints);

    triggerNotification('Daily Streak Claimed!', 'Logged daily carbon checkpoint (+20 pts). Active streak is now ' + updatedStreak + ' Days!');
    
    if (auth.currentUser) {
      await syncUserPointsAndStreak(updatedPoints, updatedStreak);
    }
    saveState(footprintData, updatedPoints, updatedStreak, badges, planItems, challenges);
  };

  // Cloud Reset Handlers
  const handleHistoryResetCloud = async () => {
    if (auth.currentUser) {
      try {
        const footprintSnap = await getDocs(collection(db, 'users', auth.currentUser.uid, 'footprints'));
        const batch = writeBatch(db);
        footprintSnap.forEach((doc) => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        triggerNotification('Cloud Data Reset', 'All remote historical logs have been permanently deleted.', 'CloudLightning');
      } catch (err) {
        console.error("Cloud purge failed: ", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#111318] text-[#e2e2e8] font-sans flex flex-col justify-between selection:bg-[#4edea3]/30 selection:text-white">
      
      {/* Navigation Layer */}
      <Navigation
        currentScreen={currentScreen}
        setScreen={setScreen}
        hasData={!!footprintData}
        streak={streak}
        points={points}
        user={currentUser}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Cloud Backup Promotion Banner (Visible when user isn't authenticated yet has local data) */}
      {!currentUser && !authLoading && footprintData && (
        <div className="mx-auto w-full max-w-7xl px-4 md:px-8 mt-5">
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#4edea3]/8 to-[#4cd7f6]/8 border border-[#4edea3]/20 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg shadow-emerald-500/5">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-[#4edea3]/10 text-[#4edea3] shrink-0">
                <Cloud className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-white tracking-tight">Sync Data to Cloud</span>
                <span className="block text-[11px] text-white/60 leading-normal mt-0.5 max-w-2xl">
                  Your carbon calculations and Eco Arena challenges are saved locally. Sign in with Google to back them up securely and preserve your statistics across all devices.
                </span>
              </div>
            </div>
            <button
              onClick={handleSignIn}
              className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] text-[#003824] font-semibold text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 h-9"
              id="banner-login-btn"
            >
              <span>Back Up Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Responsive Sandbox Area */}
      <main className="flex-1">
        {currentScreen === 'landing' && (
          <LandingPage setScreen={setScreen} hasData={!!footprintData} />
        )}

        {currentScreen === 'calculator' && (
          <CarbonCalculator 
            onCalculationComplete={handleCalculationComplete} 
            previousData={footprintData}
          />
        )}

        {currentScreen === 'dashboard' && footprintData && (
          <DashboardView 
            data={footprintData} 
            setScreen={setScreen} 
            onHistoryReset={handleHistoryResetCloud}
          />
        )}

        {currentScreen === 'coach' && (
          <AiCoach 
            footprintData={footprintData} 
            onUnlockBadge={handleUnlockBadgeDirectly}
          />
        )}

        {currentScreen === 'action-plan' && footprintData && (
          <ActionPlanView
            highestCategory={
              Object.entries(footprintData.categories).reduce((a, b) => (a[1] > b[1] ? a : b))[0]
            }
            planItems={planItems}
            onToggleAction={handleToggleAction}
            points={points}
          />
        )}

        {currentScreen === 'simulator' && footprintData && (
          <WhatIfSimulator data={footprintData} onUnlockBadge={handleUnlockBadgeDirectly} />
        )}

        {currentScreen === 'gamification' && (
          <GamificationView
            streak={streak}
            points={points}
            badges={badges}
            challenges={challenges}
            onCompleteChallenge={handleCompleteChallenge}
            onClaimDailyStreak={handleClaimDailyStreak}
          />
        )}
      </main>

      {/* Toast Notification Pop-up Dialog */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 glass-panel-accent p-4.5 rounded-2xl max-w-sm flex items-start gap-3 shadow-lg shadow-emerald-500/10 border-[#4edea3]/30 animate-in fade-in slide-in-from-bottom-5">
          <div className="p-2 bg-[#4edea3]/10 text-[#4edea3] rounded-xl self-start">
            <Award className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-sm font-bold text-white font-sans">{notification.title}</h4>
            <p className="text-xs text-white/75 mt-0.5 leading-relaxed">{notification.desc}</p>
          </div>
          <button 
            onClick={() => setNotification(null)} 
            className="p-1 text-white/30 hover:text-white rounded cursor-pointer"
            id="close-toast-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Humble Footer */}
      <footer className="py-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40 font-mono">
          <div className="flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-[#4edea3] animate-pulse" />
            <span>EcoPulse Platform • Climate-Tech Initiative</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Server Side Gemini Integration Pilot</span>
            <span>v1.0.3</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
