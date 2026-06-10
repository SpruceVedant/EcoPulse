export interface CalculatorInputs {
  travelDistance: number; // km/day
  transportMode: 'car' | 'bus' | 'metro' | 'train' | 'bike' | 'walking' | 'cycling';
  fuelType: 'petrol' | 'diesel' | 'EV' | 'hybrid' | 'N/A';
  electricity: number; // kWh/month
  acHours: number; // hours/day
  dietType: 'vegan' | 'vegetarian' | 'mixed' | 'meat-heavy';
  foodDelivery: number; // times/week
  shoppingHabit: 'light' | 'moderate' | 'heavy';
  recycling: 'always' | 'sometimes' | 'never';
  plasticUsage: 'always' | 'sometimes' | 'never';
}

export interface FootprintData {
  totalFootprint: number; // kg CO2/month
  carbonScore: 'Low' | 'Medium' | 'High';
  categories: {
    transport: number;
    food: number;
    energy: number;
    shopping: number;
    waste: number;
  };
  inputs: CalculatorInputs;
  completedAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  timestamp: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: string;
}

export interface ActionItem {
  id: string;
  day: number;
  title: string;
  description: string;
  co2Saved: number; // kg CO2
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  completed: boolean;
  category: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  points: number;
  co2Saved: number;
  completed: boolean;
}
