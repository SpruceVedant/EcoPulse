import { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { FootprintData } from '../types';
import { TrendingDown, TreePine, Car, Smartphone, Zap, Sparkles, AlertTriangle, ArrowRight, CheckCircle, Calendar, Trash2, ShieldCheck, Trophy, LineChart as LineIcon, Download } from 'lucide-react';

interface DashboardViewProps {
  data: FootprintData;
  setScreen: (screen: string) => void;
  onHistoryReset?: () => void;
}

export default function DashboardView({ data, setScreen, onHistoryReset }: DashboardViewProps) {
  const { totalFootprint, carbonScore, categories } = data;

  const [activeTab, setActiveTab] = useState<'breakdown' | 'trends'>('breakdown');
  const [historyData, setHistoryData] = useState<FootprintData[]>([]);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ecopulse_history');
      if (stored) {
        setHistoryData(JSON.parse(stored));
      } else if (data) {
        // Seed history if none exists in localStorage
        const now = new Date();
        const initializedHistory: FootprintData[] = [];
        for (let i = 5; i > 0; i--) {
          const pastDate = new Date();
          pastDate.setMonth(now.getMonth() - i);
          const factor = 1 + (0.07 * i);
          initializedHistory.push({
            totalFootprint: Math.round(data.totalFootprint * factor),
            carbonScore: data.carbonScore,
            categories: {
              transport: Math.round(data.categories.transport * factor),
              food: Math.round(data.categories.food * factor),
              energy: Math.round(data.categories.energy * factor),
              shopping: Math.round(data.categories.shopping * factor),
              waste: Math.round(data.categories.waste * factor),
            },
            inputs: { ...data.inputs },
            completedAt: pastDate.toISOString(),
          });
        }
        initializedHistory.push(data);
        localStorage.setItem('ecopulse_history', JSON.stringify(initializedHistory));
        setHistoryData(initializedHistory);
      }
    } catch (e) {
      console.warn("Failed to load historical carbon data:", e);
    }
  }, [data]);

  const handleResetHistory = () => {
    try {
      localStorage.removeItem('ecopulse_history');
      // Set to modern empty and allow useEffect above to freshly seed with active calculation
      setHistoryData([]);
      setShowConfirmReset(false);
      if (onHistoryReset) {
        onHistoryReset();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadCSV = () => {
    if (formattedTrendsData.length === 0) return;

    // Headers
    const headers = [
      'Date',
      'Completed At',
      'Total Footprint (kg CO2)',
      'Reduction Target (kg CO2)',
      'Transport (kg CO2)',
      'Food (kg CO2)',
      'Energy (kg CO2)',
      'Shopping (kg CO2)',
      'Waste (kg CO2)'
    ];

    // Map rows
    const rows = formattedTrendsData.map(item => [
      item.dateLabel,
      item.rawCompletedAt,
      item['Total CO₂'],
      item['Reduction Target'],
      item.Transport,
      item.Food,
      item.Energy,
      item.Shopping,
      item.Waste
    ]);

    // Construct CSV Content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const valStr = String(val);
        if (valStr.includes(',') || valStr.includes('"') || valStr.includes('\n')) {
          return `"${valStr.replace(/"/g, '""')}"`;
        }
        return valStr;
      }).join(','))
    ].join('\n');

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ecopulse_carbon_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortedRawTrends = historyData.map((item) => {
    const d = new Date(item.completedAt);
    return {
      dateLabel: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Total CO₂': item.totalFootprint,
      'Transport': item.categories.transport,
      'Food': item.categories.food,
      'Energy': item.categories.energy,
      'Shopping': item.categories.shopping,
      'Waste': item.categories.waste,
      rawCompletedAt: item.completedAt,
    };
  }).sort((a, b) => new Date(a.rawCompletedAt).getTime() - new Date(b.rawCompletedAt).getTime());

  const baselineCO2 = sortedRawTrends[0]?.['Total CO₂'] || totalFootprint;
  const formattedTrendsData = sortedRawTrends.map((item, idx) => {
    const targetVal = Math.round(baselineCO2 * (1 - 0.05 * idx));
    return {
      ...item,
      'Reduction Target': targetVal,
    };
  });

  // Prepare chart data
  const chartData = [
    { name: 'Transport', value: categories.transport, color: '#4cd7f6' },
    { name: 'Food', value: categories.food, color: '#4edea3' },
    { name: 'Energy', value: categories.energy, color: '#adc6ff' },
    { name: 'Shopping', value: categories.shopping, color: '#71a1ff' },
    { name: 'Waste', value: categories.waste, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  // Identify highest contributor
  const highestCategoryObj = Object.entries(categories).reduce(
    (max, [key, val]) => (val > max.value ? { category: key, value: val } : max),
    { category: 'energy', value: -1 }
  );

  const keyLabels: Record<string, string> = {
    transport: 'Transportation Commutes',
    food: 'Food Consumption & Sourcing',
    energy: 'Home Electrical & HVAC',
    shopping: 'Product & Luxury Shopping',
    waste: 'Packaging & Single-Use Waste',
  };

  // Generate equivalent values
  const kmEquivalent = Math.round(totalFootprint / 0.18);
  const treeEquivalent = Math.round(totalFootprint / 1.8); // 1 tree handles ~1.8 kg/month
  const phoneEquivalent = Math.round(totalFootprint / 0.006); // typical charge emits ~6g

  // Target values
  const reductionTarget = Math.round(totalFootprint * 0.85); // 15% reduction
  const expectedSaving = totalFootprint - reductionTarget;

  // Generate localized dynamic insight based on carbon emissions
  const getDynamicInsight = () => {
    const mainCat = highestCategoryObj.category;
    if (mainCat === 'transport') {
      return {
        title: 'Commute Emissions Peak Identified',
        text: 'Your transport emissions are elevated due to daily fuel combustion. Initiating what-if transport shifts or adopting remote meetings can single-handedly slash your carbon footprint by up to 25% this week.',
        action: 'Try public transit or active walk routines for all commutes under 2 km.',
      };
    } else if (mainCat === 'food') {
      return {
        title: 'Nutritional Carbon Footprint elevated',
        text: 'Meat sourcing and packaged delivery constitute your biggest emissions. Emphasizing plant-based meals and skipping delivery once a week can lower food-related footprints by up to 35%.',
        action: 'Commit to Meatless Monday challenges to trigger carbon-saving streaks.',
      };
    } else if (mainCat === 'energy') {
      return {
        title: 'Vampire Loads & Cooling Spikes',
        text: 'Electricity usage and cooling drive your primary emissions factor. Minor thermostat tuning and unplugging phantom appliances yields large carbon offsets with zero structural lifestyle changes.',
        action: 'Turn AC thermostats up by just 2°C (target 26°C) to drop cooling burdens.',
      };
    } else if (mainCat === 'shopping') {
      return {
        title: 'High-Volume Goods Consumption',
        text: 'Retail material acquisition represents a notable portion of your footprint. Extending device lifespans, choosing package-free groceries, or exploring thrift shops can offset manufacturing transport emissions.',
        action: 'Focus on buy-for-life durability lists before checkouts.',
      };
    } else {
      return {
        title: 'Single-Use Packaging Accumulation',
        text: 'Trash production and plastic carrier volumes have cumulative emission consequences. Enhancing recycling sorting efficiency redirects items away from toxic landfill decay.',
        action: 'Always route containers and glass pieces into colored bin separators.',
      };
    }
  };

  const insight = getDynamicInsight();

  // Status Colors
  const scoreColors = {
    Low: { bg: 'bg-[#4edea3]/10', border: 'border-[#4edea3]/20', text: 'text-[#4edea3]', label: 'Eco Champion (Low)' },
    Medium: { bg: 'bg-[#4cd7f6]/10', border: 'border-[#4cd7f6]/20', text: 'text-[#4cd7f6]', label: 'Moderate Footprint' },
    High: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', label: 'High Emission Alert' },
  };

  const scoreStyle = scoreColors[carbonScore];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" id="dashboard-module">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-mono text-white/50 tracking-widest uppercase block">PLATFORM OVERVIEW</span>
          <h2 className="text-3xl font-bold text-white font-sans tracking-tight mt-1">Emission Insights Hub</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('calculator')}
            className="px-4.5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs font-medium hover:bg-white/10 transition-all cursor-pointer"
            id="recalculate-dashboard-btn"
          >
            Recalculate Footprint
          </button>
          <button
            onClick={() => setScreen('coach')}
            className="px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] text-[#003824] text-xs font-bold shadow-lg shadow-emerald-500/15 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            id="chat-dashboard-btn"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Chat with AI Coach</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Metric Card 1: Footprint Circular Display */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col items-center justify-between border-t border-white/10 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4edea3]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-full">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-4">MONTHLY INTENSITY</span>
            
            <div className="relative w-44 h-44 mx-auto flex items-center justify-center mb-4">
              {/* Outer circular indicator ring */}
              <div className="absolute inset-0 rounded-full border-4 border-white/5" />
              <div className={`absolute inset-0 rounded-full border-4 ${carbonScore === 'Low' ? 'border-[#4edea3]' : carbonScore === 'Medium' ? 'border-[#4cd7f6]' : 'border-rose-500'} opacity-30 blur-sm`} />
              
              <div className="z-10">
                <span className="block text-4xl font-extrabold text-white tracking-tight font-mono">{totalFootprint}</span>
                <span className="block text-xs font-mono text-white/60 mt-1 uppercase font-semibold">kg CO₂ / month</span>
              </div>
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${scoreStyle.bg} ${scoreStyle.border} ${scoreStyle.text} text-xs font-semibold mb-2`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              <span>{scoreStyle.label}</span>
            </div>
          </div>

          <div className="w-full mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-white/50">
            <span>Score Class Rating</span>
            <span className="font-mono text-white tracking-wide">
              {carbonScore === 'Low' ? 'Outstanding' : carbonScore === 'Medium' ? 'Actionable' : 'Critical Shift Need'}
            </span>
          </div>
        </div>

        {/* Metric Card 2: Highest Emission Contributor */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between border-t border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#4cd7f6]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-4">BIGGEST CONTRIBUTORS</span>
            <div className="flex items-center gap-3.5 mb-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white/90">Primary Outlier Category</h4>
                <p className="text-base font-bold text-white mt-0.5">{keyLabels[highestCategoryObj.category] || highestCategoryObj.category}</p>
              </div>
            </div>
            
            <p className="text-xs text-white/60 leading-relaxed">
              Your highest emissions stem from {highestCategoryObj.category}. This segment releases {highestCategoryObj.value} kg CO₂ / month, accounting for {Math.round((highestCategoryObj.value / totalFootprint) * 100)}% of your total footprint.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5">
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider block mb-2">Target Reduction Step (15%)</span>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-white/50 block">Target limit:</span>
                <span className="text-sm font-bold text-[#4edea3] font-mono">{reductionTarget} kg/mo</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-white/50 block">Monthly saving:</span>
                <span className="text-sm font-bold text-[#4cd7f6] font-mono">{expectedSaving} kg/mo</span>
              </div>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] h-full rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        </div>

        {/* Metric Card 3: Equivalency Comparisons */}
        <div className="glass-panel rounded-3xl p-6 flex flex-col justify-between border-t border-white/10">
          <div>
            <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-4">CARBON EQUIVALENTS</span>
            <h3 className="text-sm font-bold text-white mb-4">Your Footprint is equivalent to:</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                <div className="p-2 bg-[#4cd7f6]/10 text-[#4cd7f6] rounded-lg">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Driving Passenger Car</span>
                  <span className="text-sm font-bold text-white font-mono">{kmEquivalent.toLocaleString()} kilometers</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                <div className="p-2 bg-[#4edea3]/10 text-[#4edea3] rounded-lg">
                  <TreePine className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Trees Absorb Over 1 Year</span>
                  <span className="text-sm font-bold text-white font-mono">{treeEquivalent.toLocaleString()} mature forest trees</span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/5">
                <div className="p-2 bg-[#adc6ff]/10 text-[#adc6ff] rounded-lg">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs text-white/50 block">Smartphone Fully Charged</span>
                  <span className="text-sm font-bold text-white font-mono">{phoneEquivalent.toLocaleString()} battery cycles</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-tabs Selection */}
      <div className="flex border-b border-white/5 mb-8 text-left" id="dashboard-sub-tabs">
        <button
          onClick={() => setActiveTab('breakdown')}
          className={`pb-3.5 px-6 font-sans text-sm font-semibold relative transition-all cursor-pointer ${
            activeTab === 'breakdown'
              ? 'text-[#4edea3]'
              : 'text-white/40 hover:text-white/70'
          }`}
          id="tab-btn-breakdown"
        >
          <span className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Current Breakdown
          </span>
          {activeTab === 'breakdown' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] rounded-full animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('trends')}
          className={`pb-3.5 px-6 font-sans text-sm font-semibold relative transition-all cursor-pointer ${
            activeTab === 'trends'
              ? 'text-[#4cd7f6]'
              : 'text-white/40 hover:text-white/70'
          }`}
          id="tab-btn-trends"
        >
          <span className="flex items-center gap-2">
            <LineIcon className="w-4 h-4" />
            Carbon Trends
          </span>
          {activeTab === 'trends' && (
            <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-[#4edea3] to-[#4cd7f6] rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {activeTab === 'breakdown' ? (
        /* Visual Charts Grid row */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 text-left" id="breakdown-tab-content">
          {/* Pie Chart Panel */}
          <div className="glass-panel rounded-3xl p-6 border-t border-white/10" id="pie-chart-card">
            <h3 className="text-sm font-bold text-white mb-2 font-sans tracking-tight">Category Contribution Share</h3>
            <p className="text-xs text-white/50 mb-6">Percentage segment distribution of your current monthly outputs.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 h-64">
              <div className="w-full sm:w-1/2 h-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1c20', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }} 
                      itemStyle={{ color: '#ffffff', fontSize: '12px' }}
                      formatter={(value: any) => [`${value} kg CO₂`, 'Emissions']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="w-full sm:w-1/2 flex flex-col justify-center gap-3">
                {chartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-md" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-white/80 font-medium">{item.name}</span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <span className="text-white font-bold">{item.value} kg</span>
                      <span className="text-white/40 block text-[9px]">{Math.round((item.value / totalFootprint) * 100)}% share</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bar Chart Panel */}
          <div className="glass-panel rounded-3xl p-6 border-t border-white/10" id="bar-chart-card">
            <h3 className="text-sm font-bold text-white mb-2 font-sans tracking-tight">Direct Emissions Breakdown</h3>
            <p className="text-xs text-white/50 mb-6">Direct comparative values of emissions measured in raw kg CO₂.</p>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: -20, bottom: 5 }}
                >
                  <XAxis 
                    dataKey="name" 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="rgba(255,255,255,0.3)" 
                    tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1c20', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    formatter={(value: any) => [`${value} kg CO₂`, 'Emissions']}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* Carbon Trends sub-tab view */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 text-left" id="trends-tab-content">
          
          {/* Bento Column 1: Statistics and dynamic highlights */}
          <div className="glass-panel rounded-3xl p-6 border-t border-white/10 flex flex-col justify-between" id="trends-stats-card">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-mono text-[#4cd7f6] uppercase tracking-widest block mb-2 font-semibold">REDUCTION PROGRESS</span>
                <h4 className="text-base font-bold text-white tracking-tight leading-snug">Carbon Audit History</h4>
                <p className="text-xs text-white/50 mt-1 leading-relaxed">
                  Referencing your carbon baseline measurements against recent calculation milestones.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span className="text-[10px] text-white/40 block">BASELINE RECORD:</span>
                    <span className="text-sm font-bold text-white font-mono">
                      {historyData[0] ? `${historyData[0].totalFootprint} kg CO₂` : `${totalFootprint} kg CO₂`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/40 block">CURRENT AUDIT:</span>
                    <span className="text-sm font-bold text-[#4cd7f6] font-mono">
                      {totalFootprint} kg CO₂
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div>
                    <span className="text-[10px] text-white/40 block">NET REDUCTION:</span>
                    <span className={`text-sm font-bold font-mono ${
                      historyData[0] && totalFootprint <= historyData[0].totalFootprint
                        ? 'text-[#4edea3]'
                        : 'text-rose-400'
                    }`}>
                      {historyData[0] 
                        ? `${Math.abs(historyData[0].totalFootprint - totalFootprint)} kg` 
                        : '0 kg'
                      }
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/40 block">TOTAL AUDITS:</span>
                    <span className="text-sm font-bold text-amber-400 font-mono">
                      {historyData.length} Completed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Micro commentary block */}
            <div className="mt-5 pt-4 border-t border-white/5 space-y-4">
              <p className="text-xs text-white/60 leading-relaxed italic">
                {historyData[0] && totalFootprint < historyData[0].totalFootprint ? (
                  <span className="text-[#4edea3] block">
                    🎁 Excellent dedication! You have trimmed your carbon footprint by{' '}
                    <strong>
                      {Math.round(
                        ((historyData[0].totalFootprint - totalFootprint) /
                          historyData[0].totalFootprint) *
                          100
                      )}
                      %
                    </strong>{' '}
                    compared to your initial baseline evaluation.
                  </span>
                ) : historyData[0] && totalFootprint > historyData[0].totalFootprint ? (
                  <span className="text-rose-400 block">
                    ⚠️ Footprint warning: your latest score is slightly higher than your original baseline. Use the what-if simulator to adjust sliders immediately!
                  </span>
                ) : (
                  <span className="text-white/50 block">
                    ⚖️ Balanced outputs: Your inputs match key baseline ratings. Complete future calculator audits to catalog progress runs.
                  </span>
                )}
              </p>

              {/* Inline reset and download workflow */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadCSV}
                  className="text-[10px] font-mono text-white/50 hover:text-[#4edea3] bg-white/[0.02] border border-white/5 hover:border-[#4edea3]/20 transition-all flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg"
                  id="download-history-csv"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download CSV Data
                </button>

                {!showConfirmReset ? (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="text-[10px] font-mono text-white/30 hover:text-rose-400 transition-all flex items-center gap-1.5 cursor-pointer hover:bg-white/5 py-1 px-2.5 rounded-lg border border-transparent hover:border-white/5"
                    id="trigger-history-reset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset Historical Log
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-[#1a1315] border border-rose-500/20 p-2 rounded-xl">
                    <span className="text-[9.5px] font-mono text-rose-400 flex-1">Confirm clearing logs?</span>
                    <button
                      onClick={handleResetHistory}
                      className="px-2 py-1 rounded bg-rose-500 hover:bg-rose-600 text-white font-mono text-[9px] font-semibold transition-all cursor-pointer"
                      id="confirm-history-reset"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-white/70 font-mono text-[9px] transition-all cursor-pointer"
                      id="cancel-history-reset"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bento Column 2: Recharts Line Chart */}
          <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border-t border-white/10 flex flex-col justify-between" id="trends-chart-card">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 mb-2">
                <Trophy className="w-3 h-3 text-amber-500 fill-amber-500/10" />
                <span className="text-[9px] font-mono text-amber-400 uppercase font-semibold">Emission Trajectory</span>
              </div>
              <h3 className="text-sm font-bold text-white font-sans tracking-tight">Timeline Progress Trajectory</h3>
              <p className="text-xs text-white/50 mb-6">Historical line chart tracking total footprint (kg CO₂) alongside category metrics over time.</p>
            </div>

            <div className="h-64 w-full">
              {formattedTrendsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedTrendsData} margin={{ top: 10, right: 15, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis 
                      dataKey="dateLabel" 
                      stroke="rgba(255,255,255,0.2)" 
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.2)" 
                      tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1c20', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '11px' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontFamily: 'monospace' }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    {/* Trajectory Lines */}
                    <Line 
                      type="monotone" 
                      dataKey="Total CO₂" 
                      name="Actual CO₂"
                      stroke="#fbbf24" 
                      strokeWidth={3.5} 
                      dot={{ fill: '#fbbf24', r: 4 }} 
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Reduction Target" 
                      name="Reduction Target"
                      stroke="#10b981" 
                      strokeWidth={2.5} 
                      strokeDasharray="5 5"
                      dot={{ fill: '#10b981', r: 3 }} 
                      activeDot={{ r: 5 }} 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Transport" 
                      stroke="#4cd7f6" 
                      strokeWidth={1.5} 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Food" 
                      stroke="#4edea3" 
                      strokeWidth={1.5} 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Energy" 
                      stroke="#adc6ff" 
                      strokeWidth={1.5} 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Shopping" 
                      stroke="#71a1ff" 
                      strokeWidth={1.5} 
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Waste" 
                      stroke="#f59e0b" 
                      strokeWidth={1.5} 
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-white/40 text-xs font-mono">
                  Loading trajectory metrics...
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* AI Eco Insight Panel */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border-t border-white/10 relative overflow-hidden glowing-cyan mb-8" id="dashboard-ai-insights">
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#4cd7f6]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex-1 text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4cd7f6]/10 border border-[#4cd7f6]/20 mb-3.5">
              <Sparkles className="w-3.5 h-3.5 text-[#4cd7f6]" />
              <span className="text-[10px] font-mono text-[#4cd7f6] uppercase font-semibold">ECO AI PILOT GENERATED</span>
            </div>
            
            <h3 className="font-sans font-bold text-xl text-white tracking-tight leading-snug mb-2">
              {insight.title}
            </h3>
            
            <p className="text-white/70 text-sm leading-relaxed mb-4">
              {insight.text}
            </p>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 text-xs text-[#4edea3] flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span><strong>Action recommendation:</strong> {insight.action}</span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <button
              onClick={() => setScreen('coach')}
              className="px-6 py-3.5 rounded-xl border border-[#4cd7f6]/20 bg-[#4cd7f6]/10 text-[#4cd7f6] font-bold text-sm hover:bg-[#4cd7f6]/20 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Analyze on AI Coach</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
