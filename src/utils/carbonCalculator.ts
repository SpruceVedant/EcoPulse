import { CalculatorInputs, FootprintData, ActionItem, DailyChallenge } from '../types';

export const DEFAULT_INPUTS: CalculatorInputs = {
  travelDistance: 15,
  transportMode: 'car',
  fuelType: 'petrol',
  electricity: 250,
  acHours: 4,
  dietType: 'mixed',
  foodDelivery: 2,
  shoppingHabit: 'moderate',
  recycling: 'sometimes',
  plasticUsage: 'sometimes',
};

export function calculateCarbonFootprint(inputs: CalculatorInputs): FootprintData {
  // 1. Transport CO2 (kg/month)
  const monthlyDistance = inputs.travelDistance * 30.4;
  let transportFactor = 0;
  
  if (inputs.transportMode === 'car') {
    if (inputs.fuelType === 'petrol') transportFactor = 0.18;
    else if (inputs.fuelType === 'diesel') transportFactor = 0.17;
    else if (inputs.fuelType === 'hybrid') transportFactor = 0.10;
    else if (inputs.fuelType === 'EV') transportFactor = 0.05;
  } else if (inputs.transportMode === 'bus') {
    transportFactor = 0.08;
  } else if (inputs.transportMode === 'metro') {
    transportFactor = 0.03;
  } else if (inputs.transportMode === 'train') {
    transportFactor = 0.04;
  } else if (inputs.transportMode === 'bike') {
    transportFactor = 0.10;
  } else {
    // walking, cycling
    transportFactor = 0;
  }
  
  const transportCO2 = Math.round(monthlyDistance * transportFactor);

  // 2. Energy CO2 (kg/month)
  // Grid electricity: 0.45 kg CO2 per kWh
  const electricityCO2 = inputs.electricity * 0.45;
  // AC usage: standard AC uses ~1.2 kW.
  const acElectricity = inputs.acHours * 1.2 * 30.4;
  const acCO2 = acElectricity * 0.45;
  const energyCO2 = Math.round(electricityCO2 + acCO2);

  // 3. Food CO2 (kg/month)
  let dietCO2 = 150; // mixed
  if (inputs.dietType === 'vegan') dietCO2 = 60;
  else if (inputs.dietType === 'vegetarian') dietCO2 = 90;
  else if (inputs.dietType === 'meat-heavy') dietCO2 = 250;

  // Food delivery: packages, transit - 1.5 kg per delivery
  const deliveryCO2 = inputs.foodDelivery * 4.3 * 1.5;
  const foodCO2 = Math.round(dietCO2 + deliveryCO2);

  // 4. Shopping CO2 (kg/month)
  let shoppingCO2 = 80; // moderate
  if (inputs.shoppingHabit === 'light') shoppingCO2 = 30;
  else if (inputs.shoppingHabit === 'heavy') shoppingCO2 = 180;

  // 5. Waste CO2 (kg/month)
  let baselineWaste = 40;
  if (inputs.recycling === 'always') baselineWaste -= 25;
  else if (inputs.recycling === 'sometimes') baselineWaste -= 10;
  
  if (inputs.plasticUsage === 'always') baselineWaste += 15;
  else if (inputs.plasticUsage === 'sometimes') baselineWaste += 5;
  
  const wasteCO2 = Math.max(5, Math.round(baselineWaste));

  const totalFootprint = transportCO2 + energyCO2 + foodCO2 + shoppingCO2 + wasteCO2;

  let carbonScore: 'Low' | 'Medium' | 'High' = 'Medium';
  if (totalFootprint < 320) {
    carbonScore = 'Low';
  } else if (totalFootprint > 650) {
    carbonScore = 'High';
  }

  return {
    totalFootprint,
    carbonScore,
    categories: {
      transport: transportCO2,
      energy: energyCO2,
      food: foodCO2,
      shopping: shoppingCO2,
      waste: wasteCO2,
    },
    inputs,
    completedAt: new Date().toISOString(),
  };
}

export function generate7DayActionPlan(highestCategory: string): ActionItem[] {
  const plans: Record<string, Omit<ActionItem, 'id' | 'completed'>[]> = {
    transport: [
      { day: 1, title: 'Switch to Public Transit', description: 'Take the bus or metro for your transit instead of driving.', co2Saved: 8, difficulty: 'Medium', points: 50, category: 'transport' },
      { day: 2, title: 'Walk for Short Commutes', description: 'Power-walk or walk to any destination under 1.5 kilometers.', co2Saved: 2, difficulty: 'Easy', points: 20, category: 'transport' },
      { day: 3, title: 'Vehicle Efficiency Audit', description: 'Check and inflate your tires to improve fuel efficiency by up to 3%.', co2Saved: 3, difficulty: 'Easy', points: 25, category: 'transport' },
      { day: 4, title: 'Organize a Carpool', description: 'Coordinate with a colleague or neighbor to share your daily drive.', co2Saved: 10, difficulty: 'Medium', points: 60, category: 'transport' },
      { day: 5, title: 'Adopt Smooth Eco-Driving', description: 'Avoid rapid acceleration and hard braking to save up to 15% fuel.', co2Saved: 4, difficulty: 'Easy', points: 30, category: 'transport' },
      { day: 6, title: 'Remote Meeting Mode', description: 'Propose virtual attendance for one meeting to cancel short-haul trips.', co2Saved: 15, difficulty: 'Easy', points: 40, category: 'transport' },
      { day: 7, title: 'Complete Car-Free Day', description: 'Do not use any combustion vehicles today. Commit to active travel.', co2Saved: 18, difficulty: 'Hard', points: 100, category: 'transport' },
    ],
    food: [
      { day: 1, title: 'Plant-Based Monday', description: 'Opt for hearty vegan or vegetarian recipes for all main meals today.', co2Saved: 5, difficulty: 'Easy', points: 30, category: 'food' },
      { day: 2, title: 'Fridge Audit & Cookoff', description: 'Plan a meal solely using existing ingredients in your fridge to block waste.', co2Saved: 3, difficulty: 'Medium', points: 40, category: 'food' },
      { day: 3, title: 'Ditch the Delivery', description: 'Cook a fresh, simple home dinner instead of ordering food with packaging.', co2Saved: 2, difficulty: 'Easy', points: 20, category: 'food' },
      { day: 4, title: 'Dairy Alternative Shift', description: 'Swap cow\'s milk for oat, almond, or soy milk options.', co2Saved: 1.5, difficulty: 'Easy', points: 20, category: 'food' },
      { day: 5, title: 'Buy Local Produce Only', description: 'Source ingredients solely manufactured or harvested in your region.', co2Saved: 4, difficulty: 'Medium', points: 50, category: 'food' },
      { day: 6, title: 'Initiate Food Composting', description: 'Separate organic scraps from trash and start compost bins.', co2Saved: 3, difficulty: 'Hard', points: 70, category: 'food' },
      { day: 7, title: 'Total Plant-Based Day', description: 'Cleanse your footprint by consuming nothing but plant-derived meals today.', co2Saved: 7, difficulty: 'Hard', points: 100, category: 'food' },
    ],
    energy: [
      { day: 1, title: 'Vanquish Phantom Power', description: 'Shutdown and unplug power strips and idle gadgets when not in use.', co2Saved: 2, difficulty: 'Easy', points: 20, category: 'energy' },
      { day: 2, title: 'AC Cooling Sabbatical', description: 'Switch off the AC for 3 active hours and enjoy natural breezes.', co2Saved: 4, difficulty: 'Easy', points: 30, category: 'energy' },
      { day: 3, title: 'Cold-Water Laundry Cycle', description: 'Run washing machines on eco cold washes to save water-heating energy.', co2Saved: 3, difficulty: 'Easy', points: 20, category: 'energy' },
      { day: 4, title: 'Natural Line-Drying', description: 'Air-dry your clothes on racks instead of starting electric tumble dryers.', co2Saved: 5, difficulty: 'Medium', points: 40, category: 'energy' },
      { day: 5, title: 'The 26°C AC Adjustment', description: 'Raise your air conditioner thermostat target to a comfortable 26°C.', co2Saved: 3, difficulty: 'Easy', points: 30, category: 'energy' },
      { day: 6, title: 'Upgrade to Smart LED', description: 'Identify and replace old incandescent bulbs with power-saver LEDs.', co2Saved: 2, difficulty: 'Medium', points: 40, category: 'energy' },
      { day: 7, title: 'Hour of Clean Solitude', description: 'Unplug and power down all home electronics for an hour of quiet read time.', co2Saved: 6, difficulty: 'Medium', points: 80, category: 'energy' },
    ],
    shopping: [
      { day: 1, title: 'Audit Digital Subscriptions', description: 'Decline physical catalog delivery lists and cancel automatic retail box setups.', co2Saved: 3, difficulty: 'Medium', points: 40, category: 'shopping' },
      { day: 2, title: 'Zero Purchases Day', description: 'Practice patience and avoid ordering any physical luxury item today.', co2Saved: 6, difficulty: 'Easy', points: 40, category: 'shopping' },
      { day: 3, title: 'Durable Quality Check', description: 'Adopt the "buy it for life" filter when vetting any active shopping items.', co2Saved: 2, difficulty: 'Easy', points: 15, category: 'shopping' },
      { day: 4, title: 'Mending Over Replacing', description: 'Glue, stitch, or repair an existing garment/device rather than replacing it.', co2Saved: 4, difficulty: 'Medium', points: 50, category: 'shopping' },
      { day: 5, title: 'Give Back Pre-loved Items', description: 'Clear cupboards and catalog 3 lightweight items for thrift donation.', co2Saved: 5, difficulty: 'Medium', points: 60, category: 'shopping' },
      { day: 6, title: 'Package-Free Grocery Run', description: 'Use lightweight bags or custom glass jars for loose ingredients shopping.', co2Saved: 2, difficulty: 'Easy', points: 20, category: 'shopping' },
      { day: 7, title: 'Full Shop Sabbatical', description: 'Complete a full week without using any e-commerce apps or shopping checkouts.', co2Saved: 15, difficulty: 'Hard', points: 100, category: 'shopping' },
    ],
    waste: [
      { day: 1, title: 'Ditch Small Disposable Plastic', description: 'Pack double-walled flasks and custom canvas sacks for errands today.', co2Saved: 2.5, difficulty: 'Easy', points: 25, category: 'waste' },
      { day: 2, title: 'Organize Recycling Cells', description: 'Create and label tidy separate boxes for compost, glass, and card pieces.', co2Saved: 3, difficulty: 'Medium', points: 35, category: 'waste' },
      { day: 3, title: 'Replace Tree Towels', description: 'Ditch throwaway papers; adopt organic reusable napkins for spills.', co2Saved: 1.5, difficulty: 'Easy', points: 15, category: 'waste' },
      { day: 4, title: 'Reheat with Vigilance', description: 'Inspect expiry dates on containers and eat leftovers as delicious appetizers.', co2Saved: 2, difficulty: 'Easy', points: 20, category: 'waste' },
      { day: 5, title: 'Creative Container Reuse', description: 'Wash and repurpose plastic or glass food packaging before throwing away.', co2Saved: 2, difficulty: 'Easy', points: 25, category: 'waste' },
      { day: 6, title: 'Drop Off E-Waste', description: 'Deliver archaic batteries or devices to regional dropboxes for recovery.', co2Saved: 4, difficulty: 'Hard', points: 60, category: 'waste' },
      { day: 7, title: 'Zero Trash Generation', description: 'Sort, reassemble, or organic-compost all wastes. Produce zero landfill garbage.', co2Saved: 10, difficulty: 'Hard', points: 100, category: 'waste' },
    ],
  };

  const selectedList = plans[highestCategory.toLowerCase()] || plans.energy;
  return selectedList.map((item, index) => ({
    ...item,
    id: `${highestCategory}-${index + 1}`,
    completed: false,
  }));
}

export const INITIAL_BADGES = [
  { id: 'b1', name: 'Carbon Cartographer', description: 'Complete your first EcoPulse footprint calculation.', icon: 'Compass', unlocked: false, category: 'general' },
  { id: 'b2', name: 'Low Impact Legend', description: 'Achieve an estimated monthly carbon score of "Low".', icon: 'ShieldAlert', unlocked: false, category: 'general' },
  { id: 'b3', name: 'Eco Conversationalist', description: 'Engage with your AI Eco-Coach for customized advice.', icon: 'MessageCircleCode', unlocked: false, category: 'ai' },
  { id: 'b4', name: 'Green Streak Pioneer', description: 'Complete a full day challenge and start your streak code.', icon: 'Flame', unlocked: false, category: 'streaks' },
  { id: 'b5', name: 'Carbon Slash Master', description: 'Unlock a WHAT-IF calculation saving more than 150 kg of CO2.', icon: 'TrendingDown', unlocked: false, category: 'whatif' },
  { id: 'b6', name: 'Action Pack Champion', description: 'Complete at least three actions in your 7-Day Carbon Plan.', icon: 'CheckSquare', unlocked: false, category: 'action' },
];

export const INITIAL_CHALLENGES: DailyChallenge[] = [
  { id: 'dc1', title: 'Power-down Sentry', description: 'Walk around your workspace and unplug 3 vampire power sockets right now.', points: 15, co2Saved: 1.5, completed: false },
  { id: 'dc2', title: 'Active Transit Venture', description: 'Leave the car or scooter keys behind. Walk or bicycle for a brief errand.', points: 30, co2Saved: 2.8, completed: false },
  { id: 'dc3', title: 'Zero Waste Feast', description: 'Eat at least one complete plate of lunch with absolutely zero discarded remnants.', points: 25, co2Saved: 2.0, completed: false },
];
