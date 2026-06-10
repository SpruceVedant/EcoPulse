import { useState, useEffect } from 'react';
import { FootprintData } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Leaf, Eye, HelpCircle, ArrowRight, ShieldCheck, Flame, Scale, TrendingDown } from 'lucide-react';

interface WhatIfSimulatorProps {
  data: FootprintData;
  onUnlockBadge: (badgeId: string) => void;
}

export default function WhatIfSimulator({ data, onUnlockBadge }: WhatIfSimulatorProps) {
  const beforeFootprint = data.totalFootprint;

  // Simulator values
  const [publicTransitDays, setPublicTransitDays] = useState(0); // 0 to 7 days/week
  const [meatMealsReduced, setMeatMealsReduced] = useState(0); // 0 to 14 meals/week
  const [acHoursReduced, setAcHoursReduced] = useState(0); // 0 to 12 hours/day
  const [shoppingReduction, setShoppingReduction] = useState(0); // 0 to 100%
  const [recycleMore, setRecycleMore] = useState(false); // boolean

  // Computed live savings
  const [savingsList, setSavingsList] = useState({
    transit: 0,
    diet: 0,
    ac: 0,
    shopping: 0,
    waste: 0,
  });

  useEffect(() => {
    // 1. Calculate Public Transit Savings
    let transitSavings = 0;
    if (data.inputs.transportMode === 'car' && data.inputs.travelDistance > 0) {
      // replace portion of travel with public transit (factor diff: car - 0.05)
      let carFactor = 0.18;
      if (data.inputs.fuelType === 'diesel') carFactor = 0.17;
      else if (data.inputs.fuelType === 'hybrid') carFactor = 0.10;
      else if (data.inputs.fuelType === 'EV') carFactor = 0.05;

      const publicTransitFactor = 0.05;
      const carCommuteDistance = data.inputs.travelDistance * 30.4;
      const proportion = publicTransitDays / 7;
      transitSavings = carCommuteDistance * proportion * Math.max(0, carFactor - publicTransitFactor);
    } else if (data.inputs.travelDistance > 0 && data.inputs.transportMode !== 'walking' && data.inputs.transportMode !== 'cycling') {
      // if bus/metro, maybe walking/cycling (transit savings: factor diff: current - 0)
      let baseFactor = 0.08; // bus
      if (data.inputs.transportMode === 'metro') baseFactor = 0.03;
      else if (data.inputs.transportMode === 'train') baseFactor = 0.04;
      else if (data.inputs.transportMode === 'bike') baseFactor = 0.10;

      const commuteDistance = data.inputs.travelDistance * 30.4;
      const proportion = publicTransitDays / 7;
      // assume they walk/cycle instead
      transitSavings = commuteDistance * proportion * baseFactor;
    }

    // 2. Meat reduction savings: ~1.5 kg per meal swapped
    const dietSavings = meatMealsReduced * 4.3 * 1.5;

    // 3. AC savings: 1.2 kW * hours * 0.45 factor
    const acSavings = Math.min(
      data.categories.energy, // cannot save more than entire energy load
      acHoursReduced * 1.2 * 30.4 * 0.45
    );

    // 4. Shopping reduction: proportion of baseline shopping
    const shoppingSavings = data.categories.shopping * (shoppingReduction / 100);

    // 5. Waste savings: recycling adjustment
    let wasteSavings = 0;
    if (recycleMore) {
      if (data.inputs.recycling === 'never') {
        wasteSavings = 25; // Shifting to sorting always
      } else if (data.inputs.recycling === 'sometimes') {
        wasteSavings = 15;
      } else {
        wasteSavings = 5; // already always, minor extra composting
      }
    }

    const newSavings = {
      transit: Math.round(transitSavings),
      diet: Math.round(dietSavings),
      ac: Math.round(acSavings),
      shopping: Math.round(shoppingSavings),
      waste: Math.round(wasteSavings),
    };

    setSavingsList(newSavings);

    const totalSaved = newSavings.transit + newSavings.diet + newSavings.ac + newSavings.shopping + newSavings.waste;
    // Badge condition: Save over 150 kg in What-if simulator
    if (totalSaved >= 150) {
      onUnlockBadge('b5'); // Unlock Carbon Slash Master badge
    }

  }, [publicTransitDays, meatMealsReduced, acHoursReduced, shoppingReduction, recycleMore, data]);

  const totalSavedValue = savingsList.transit + savingsList.diet + savingsList.ac + savingsList.shopping + savingsList.waste;
  const afterFootprint = Math.max(10, Math.round(beforeFootprint - totalSavedValue));
  const percentSaved = Math.round((totalSavedValue / beforeFootprint) * 100) || 0;

  // Chart comparative data
  const chartData = [
    { name: 'Current Footprint', value: beforeFootprint, color: '#fbbf24' },
    { name: 'Simulated Goal', value: afterFootprint, color: '#4edea3' },
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 px-4" id="what-if-simulator-module">
      {/* Title */}
      <div className="text-left mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4cd7f6]/10 border border-[#4cd7f6]/20 mb-3">
          <Eye className="w-3.5 h-3.5 text-[#4cd7f6]" />
          <span className="text-[10px] font-mono text-[#4cd7f6] uppercase font-semibold">Projections Laboratory</span>
        </div>
        <h2 className="text-3xl font-bold text-white font-sans tracking-tight">Interactive Carbon Simulator</h2>
        <p className="text-white/50 text-sm mt-1 max-w-xl">
          Test lifestyle adjustments dynamically and visualize your estimated emission offsets in real-time. Turn dials to unlock special badges!
        </p>
      </div>

      {/* Main Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
        
        {/* Left Col: Dials & Sliders Controllers */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border-t border-white/10 space-y-6">
            <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2 pb-3 border-b border-white/5">
              <Scale className="w-4 h-4 text-[#4cd7f6]" />
              Adjust Lifestyle Commitments
            </h3>

            {/* Slider 1: Public transit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="text-white/90">Public Transit Commutes</label>
                <span className="text-[#4cd7f6] font-mono font-bold">{publicTransitDays} days / week</span>
              </div>
              <input
                type="range"
                min="0"
                max="7"
                step="1"
                value={publicTransitDays}
                onChange={(e) => setPublicTransitDays(parseInt(e.target.value))}
                className="w-full accent-[#4cd7f6] bg-white/5 h-2 rounded cursor-pointer"
                id="transit-slider"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                Swapping road commutes with subway/bus transit cuts travel emissions index for those days. (Saves ~{savingsList.transit} kg CO₂ / mo)
              </p>
            </div>

            {/* Slider 2: Meat Reduction */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="text-white/90">Reduce Meat Meals</label>
                <span className="text-[#4edea3] font-mono font-bold">{meatMealsReduced} meals / week</span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={meatMealsReduced}
                onChange={(e) => setMeatMealsReduced(parseInt(e.target.value))}
                className="w-full accent-[#4edea3] bg-white/5 h-2 rounded cursor-pointer"
                id="meat-meals-slider"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                Swapping red beef or dairy portions with vegetable recipes drops agricultural footprint metrics. (Saves ~{savingsList.diet} kg CO₂ / mo)
              </p>
            </div>

            {/* Slider 3: Air Conditioning hours */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="text-white/90">Reduce Air Conditioner Usage</label>
                <span className="text-purple-400 font-mono font-bold">-{acHoursReduced} hour / day</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                step="0.5"
                value={acHoursReduced}
                onChange={(e) => setAcHoursReduced(parseFloat(e.target.value))}
                className="w-full accent-purple-400 bg-white/5 h-2 rounded cursor-pointer"
                id="ac-hours-reduced"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                Dampening active HVAC ventilation compressor cycles decreases home electrical draw burden. (Saves ~{savingsList.ac} kg CO₂ / mo)
              </p>
            </div>

            {/* Slider 4: Online shopping reduction */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <label className="text-white/90">Reduce Online Shopping Volume</label>
                <span className="text-amber-500 font-mono font-bold">-{shoppingReduction}% spending</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={shoppingReduction}
                onChange={(e) => setShoppingReduction(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-white/5 h-2 rounded cursor-pointer"
                id="shopping-slider"
              />
              <p className="text-[10px] text-white/40 leading-relaxed">
                Restricting acquisition of discretionary items offsets manufacturing and long-haul delivery freights. (Saves ~{savingsList.shopping} kg CO₂ / mo)
              </p>
            </div>

            {/* Checkbox 5: Recycling Habits */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="flex items-center justify-between gap-3 cursor-pointer group" id="checkbox-recycle-label">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={recycleMore}
                    onChange={(e) => setRecycleMore(e.target.checked)}
                    className="w-4.5 h-4.5 border-white/10 rounded accent-[#4edea3] mt-0.5 cursor-pointer"
                    id="recycle-more-toggle"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white/90 block group-hover:text-white transition-colors">
                      Increase recycling sorting habit
                    </span>
                    <span className="text-[10px] text-white/40 block mt-0.5">
                      Ensure full separation of metal tins, plastic films, and vegetable remains.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-[#4edea3] font-bold">+{savingsList.waste} kg offset</span>
              </label>
            </div>

          </div>
        </div>

        {/* Right Col: Projections Summary Graphic Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Results Card */}
          <div className="glass-panel rounded-3xl p-6 border-t border-white/10 relative overflow-hidden text-center flex flex-col justify-between h-full min-h-[300px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4edea3]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div>
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">PROJECTION OUTCOME</span>
              <div className="flex items-center justify-center gap-4.5 my-4">
                <div className="text-left">
                  <span className="text-[10px] font-mono text-white/40 block">BEFORE:</span>
                  <span className="text-2xl font-bold text-white/60 font-mono">{beforeFootprint} kg</span>
                </div>
                <div className="h-8 w-[2px] bg-white/10" />
                <div className="text-left">
                  <span className="text-[10px] font-mono text-white/40 block">AFTER:</span>
                  <span className="text-4xl font-extrabold text-[#4edea3] font-mono">{afterFootprint} kg</span>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#4edea3]/10 border border-[#4edea3]/10 text-xs text-[#4edea3] font-bold mb-4">
                <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                <span>SAVED: {totalSavedValue} kg CO₂ / mo ({percentSaved}%)</span>
              </div>
            </div>

            {/* Recharts Bar Comparison */}
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.2)" 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.2)" 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1c20', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '11px' }}
                    cursor={false}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    <Cell fill="#fbbf24" />
                    <Cell fill="#4edea3" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Simulated feedback */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10.5px] text-white/50 leading-relaxed font-sans italic">
                {totalSavedValue > 150 
                  ? "🎉 Outstanding commitment! You've unlocked the Carbon Slash Master Badge." 
                  : totalSavedValue > 60 
                  ? "Great job! Keep increasing options to hit your custom 150 kg reduction badge." 
                  : "Try sliding some indicators above to design a healthier, zero-carbon future."}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
