import { useState } from 'react';
import { CalculatorInputs, FootprintData } from '../types';
import { DEFAULT_INPUTS, calculateCarbonFootprint } from '../utils/carbonCalculator';
import { ClipboardList, Car, Zap, Utensils, Trash2, ArrowLeft, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

interface CarbonCalculatorProps {
  onCalculationComplete: (data: FootprintData) => void;
  previousData: FootprintData | null;
}

export default function CarbonCalculator({ onCalculationComplete, previousData }: CarbonCalculatorProps) {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<CalculatorInputs>(
    previousData ? previousData.inputs : { ...DEFAULT_INPUTS }
  );

  const stepsInfo = [
    { id: 1, title: 'Transport', icon: Car, desc: 'Daily commute & vehicle variables' },
    { id: 2, title: 'Home Energy', icon: Zap, desc: 'Electricity & heating/cooling utilities' },
    { id: 3, title: 'Food & Diet', icon: Utensils, desc: 'Eating patterns & carrier frequency' },
    { id: 4, title: 'Waste Habits', icon: Trash2, desc: 'Shopping, packaging & sorting habits' },
  ];

  const handleInputChange = <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => {
    setInputs((prev) => {
      const updated = { ...prev, [key]: value };
      // Reset fuel type if transport mode shifts away from car
      if (key === 'transportMode' && value !== 'car') {
        updated.fuelType = 'N/A';
      } else if (key === 'transportMode' && value === 'car' && prev.fuelType === 'N/A') {
        updated.fuelType = 'petrol';
      }
      return updated;
    });
  };

  const handleNext = () => {
    if (step < stepsInfo.length) {
      setStep(step + 1);
    } else {
      const result = calculateCarbonFootprint(inputs);
      onCalculationComplete(result);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4" id="carbon-calculator-module">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#4edea3]" />
          <span className="text-[10px] font-mono text-[#4edea3] uppercase font-semibold">Lifestyle Audit</span>
        </div>
        <h2 className="text-3xl font-bold text-white font-sans tracking-tight">EcoPulse footprint Audit</h2>
        <p className="text-white/50 text-sm mt-1 max-w-lg mx-auto">
          Complete the 4-phase audit to evaluate your monthly CO₂ footprint, identify high emission points and build a reduction plan.
        </p>
      </div>

      {/* Steps Indicator Progress Meter */}
      <div className="glass-panel rounded-2xl p-4 md:p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-white/5">
        <div className="flex w-full items-center justify-between relative">
          {/* Progress connector line */}
          <div className="absolute top-5 left-[10%] right-[10%] h-[2px] bg-white/5 -z-0 hidden md:block" />
          <div 
            className="absolute top-5 left-[10%] h-[2px] bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] -z-0 transition-all duration-300 hidden md:block" 
            style={{ width: `${((step - 1) / (stepsInfo.length - 1)) * 80}%` }}
          />

          {stepsInfo.map((s, idx) => {
            const StepIcon = s.icon;
            const isCompleted = step > s.id;
            const isActive = step === s.id;

            return (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className="flex flex-col items-center gap-2 relative z-10 focus:outline-none flex-1 group"
                id={`step-indicator-${s.id}`}
              >
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-[#4edea3] text-[#003824] scale-95 shadow-lg shadow-emerald-500/10' 
                      : isActive 
                      ? 'bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] text-[#003824] font-bold scale-105 shadow-md shadow-cyan-500/10'
                      : 'bg-[#1e2024] text-white/40 border border-white/5 group-hover:text-white/60 group-hover:border-white/10'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 stroke-[2.5]" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <div className="text-center hidden sm:block">
                  <span className={`block text-xs font-semibold ${isActive ? 'text-[#4edea3]' : 'text-white/50'}`}>{s.title}</span>
                  <span className="text-[9px] text-white/30 font-mono">Step {s.id}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Area in Modern Glass Cards */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border-t border-white/10 shadow-xl glow-emerald mb-8 transition-all duration-300">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#4edea3] mb-6 flex items-center gap-2 pb-3 border-b border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] inline-block animate-pulse" />
          {stepsInfo[step - 1].title} Details — {stepsInfo[step - 1].desc}
        </h3>

        {/* STEP 1: TRANSPORT */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Transport Mode</label>
              <p className="text-xs text-white/50 mb-4">Choose your principal method of daily transit.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['car', 'bus', 'metro', 'train', 'bike', 'walking', 'cycling'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleInputChange('transportMode', mode)}
                    className={`p-3 rounded-xl border text-sm capitalize font-medium transition-all cursor-pointer ${
                      inputs.transportMode === mode
                        ? 'border-[#4edea3] bg-[#4edea3]/5 text-[#4edea3]'
                        : 'border-white/5 bg-[#181a1e] text-white/70 hover:border-white/10 hover:text-white'
                    }`}
                    id={`mode-select-${mode}`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {inputs.transportMode === 'car' && (
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Fuel Type</label>
                <p className="text-xs text-white/50 mb-3">Which power source handles propulsion for your car?</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['petrol', 'diesel', 'EV', 'hybrid'] as const).map((fuel) => (
                    <button
                      key={fuel}
                      type="button"
                      onClick={() => handleInputChange('fuelType', fuel)}
                      className={`p-3 rounded-xl border text-sm uppercase font-mono transition-all cursor-pointer ${
                        inputs.fuelType === fuel
                          ? 'border-[#4cd7f6] bg-[#4cd7f6]/5 text-[#4cd7f6]'
                          : 'border-white/5 bg-[#181a1e] text-white/70 hover:border-white/10 hover:text-white'
                      }`}
                      id={`fuel-select-${fuel}`}
                    >
                      {fuel}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/90">Daily COMMUTE Distance</label>
                <span className="text-sm font-mono text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded font-bold">
                  {inputs.travelDistance} km/day
                </span>
              </div>
              <p className="text-xs text-white/50 mb-4">Estimate total roundtrip travel done on average daily.</p>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={inputs.travelDistance}
                onChange={(e) => handleInputChange('travelDistance', parseInt(e.target.value))}
                className="w-full accent-[#4edea3] bg-white/5 h-2 rounded cursor-pointer"
                id="distance-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1.5">
                <span>0 km</span>
                <span>50 km</span>
                <span>100 km</span>
                <span>150+ km</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: HOME ENERGY */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/90">Monthly Electricity Consumption</label>
                <span className="text-sm font-mono text-[#4cd7f6] bg-[#4cd7f6]/10 px-2.5 py-0.5 rounded font-bold">
                  {inputs.electricity} kWh
                </span>
              </div>
              <p className="text-xs text-white/50 mb-4">Reference average home power utility statements.</p>
              <input
                type="range"
                min="20"
                max="800"
                step="20"
                value={inputs.electricity}
                onChange={(e) => handleInputChange('electricity', parseInt(e.target.value))}
                className="w-full accent-[#4cd7f6] bg-white/5 h-2 rounded cursor-pointer"
                id="electricity-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1.5">
                <span>Eco (20 kWh)</span>
                <span>Average (300 kWh)</span>
                <span>High (800+ kWh)</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/90">Air Conditioner (AC) Usage</label>
                <span className="text-sm font-mono text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded font-bold">
                  {inputs.acHours} hrs/day
                </span>
              </div>
              <p className="text-xs text-white/50 mb-4">Estimated direct running duration inside rooms.</p>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={inputs.acHours}
                onChange={(e) => handleInputChange('acHours', parseInt(e.target.value))}
                className="w-full accent-[#4edea3] bg-white/5 h-2 rounded cursor-pointer"
                id="ac-hours-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1.5">
                <span>0 hours</span>
                <span>8 hours</span>
                <span>16 hours</span>
                <span>24 hours</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: FOOD & DIET */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Diet Classification</label>
              <p className="text-xs text-white/50 mb-4">Primary nutritional preferences on regular days.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'vegan', label: 'Vegan (Strict Plant-based)', desc: 'No animal ingredients. Lowest carbon factor.' },
                  { key: 'vegetarian', label: 'Vegetarian (Agro & Dairy)', desc: 'No meat, includes eggs and cheese products.' },
                  { key: 'mixed', label: 'Mixed (Regular Combo)', desc: 'Balanced vegetables, grain, fish, and fowl pieces.' },
                  { key: 'meat-heavy', label: 'Meat-Heavy (High Red Beef)', desc: 'Regular dairy and red meats. Highest footprint index.' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleInputChange('dietType', item.key as any)}
                    className={`p-4 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                      inputs.dietType === item.key
                        ? 'border-[#4edea3] bg-[#4edea3]/5'
                        : 'border-white/5 bg-[#181a1e] hover:border-white/10'
                    }`}
                    id={`diet-select-${item.key}`}
                  >
                    <span className={`text-sm font-bold capitalize ${inputs.dietType === item.key ? 'text-[#4edea3]' : 'text-white/80'}`}>
                      {item.label}
                    </span>
                    <span className="text-xs text-white/50">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-white/90">E-Commerce Food Deliveries</label>
                <span className="text-sm font-mono text-[#4cd7f6] bg-[#4cd7f6]/10 px-2 py-0.5 rounded font-bold">
                  {inputs.foodDelivery} orders/week
                </span>
              </div>
              <p className="text-xs text-white/50 mb-4">Includes transit packing elements and container counts.</p>
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={inputs.foodDelivery}
                onChange={(e) => handleInputChange('foodDelivery', parseInt(e.target.value))}
                className="w-full accent-[#4cd7f6] bg-white/5 h-2 rounded cursor-pointer"
                id="delivery-slider"
              />
              <div className="flex justify-between text-[10px] font-mono text-white/30 mt-1.5">
                <span>0 times</span>
                <span>4 times</span>
                <span>8 times</span>
                <span>14+ times</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: CONSUMPTION & RECYCLING */}
        {step === 4 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">Shopping Frequency</label>
              <p className="text-xs text-white/50 mb-3">Average acquisition of new gadgets, garments, or retail items.</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'light', label: 'Minimalist / Light', desc: 'Sustained buying' },
                  { key: 'moderate', label: 'Moderate / Normal', desc: 'Standard shopping' },
                  { key: 'heavy', label: 'Heavy / Passionate', desc: 'Frequent trends' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleInputChange('shoppingHabit', item.key as any)}
                    className={`p-3.5 rounded-xl border text-center flex flex-col gap-1.5 transition-all cursor-pointer ${
                      inputs.shoppingHabit === item.key
                        ? 'border-[#4edea3] bg-[#4edea3]/5'
                        : 'border-white/5 bg-[#181a1e] hover:border-white/10'
                    }`}
                    id={`shopping-select-${item.key}`}
                  >
                    <span className={`text-sm font-bold ${inputs.shoppingHabit === item.key ? 'text-[#4edea3]' : 'text-white/80'}`}>
                      {item.label}
                    </span>
                    <span className="text-[10px] text-white/50">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Recycling Sort Habits</label>
                <p className="text-xs text-white/50 mb-3">Consistent separation of papers, glass, and compost scraps.</p>
                <div className="flex flex-col gap-2">
                  {(['always', 'sometimes', 'never'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleInputChange('recycling', r)}
                      className={`p-2.5 rounded-xl border text-left text-sm capitalize font-medium transition-all flex items-center justify-between cursor-pointer ${
                        inputs.recycling === r
                          ? 'border-[#4edea3] bg-[#4edea3]/5 text-[#4edea3]'
                          : 'border-white/5 bg-[#181a1e] text-white/70 hover:border-white/10'
                      }`}
                      id={`recycling-select-${r}`}
                    >
                      <span>{r}</span>
                      <span className="text-[10px] font-mono text-white/30">
                        {r === 'always' ? 'High emission rescue' : r === 'sometimes' ? 'Moderate saves' : 'No offset effect'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Single-Use Plastics Habit</label>
                <p className="text-xs text-white/50 mb-3">Aquisition rate of bottled water, packets, and loose disposables.</p>
                <div className="flex flex-col gap-2">
                  {(['always', 'sometimes', 'never'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleInputChange('plasticUsage', p)}
                      className={`p-2.5 rounded-xl border text-left text-sm capitalize font-medium transition-all flex items-center justify-between cursor-pointer ${
                        inputs.plasticUsage === p
                          ? 'border-[#4cd7f6] bg-[#4cd7f6]/5 text-[#4cd7f6]'
                          : 'border-white/5 bg-[#181a1e] text-white/70 hover:border-white/10'
                      }`}
                      id={`plastic-select-${p}`}
                    >
                      <span>{p}</span>
                      <span className="text-[10px] font-mono text-white/30">
                        {p === 'always' ? 'Add high carbon burden' : p === 'sometimes' ? 'Mild impact' : 'Waste free benchmark'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Actions Panel */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          disabled={step === 1}
          className={`px-5 py-3 rounded-lg border text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            step === 1
              ? 'opacity-30 cursor-not-allowed border-white/5 text-white/40'
              : 'border-white/10 bg-white/5 hover:bg-white/10 text-white'
          }`}
          id="calc-back-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] text-[#003824] font-bold text-sm flex items-center gap-2 active:scale-95 transition-all cursor-pointer hover:brightness-105"
          id="calc-next-btn"
        >
          <span>{step === stepsInfo.length ? 'Calculate footprint' : 'Next Step'}</span>
          {step === stepsInfo.length ? <CheckCircle2 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
