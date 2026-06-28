export type Category = 'exercise' | 'food' | 'social' | 'event' | 'task';
export type NudgeCategory = 'todo' | 'social' | 'health' | 'errand';
export type PlanSection = 'exercise' | 'meals' | 'todos' | 'social' | 'events';
export type FinanceCategory = 'food' | 'transport' | 'going_out' | 'health_beauty' | 'shopping' | 'subscriptions' | 'bills' | 'income' | 'other';

export interface UserProfile {
  id: string;
  content: string;
  updated_at: string;
}

export interface Week {
  id: string;
  week_start: string;
  created_at: string;
}

export interface CalendarEntry {
  id: string;
  week_id: string;
  day: string;
  time: string | null;
  category: Category;
  title: string;
  notes: string | null;
  completed: boolean;
}

export interface Todo {
  id: string;
  week_id: string;
  title: string;
  due_day: string | null;
  completed: boolean;
}

export interface Nudge {
  id: string;
  week_id: string;
  message: string;
  category: NudgeCategory;
  triggered_at: string;
  dismissed: boolean;
}

export interface SectionInput {
  id: string;
  week_id: string;
  section: PlanSection;
  raw_input: string;
  created_at: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  exercise: 'bg-green-100 text-green-800 border-green-200',
  food: 'bg-amber-100 text-amber-800 border-amber-200',
  social: 'bg-pink-100 text-pink-800 border-pink-200',
  event: 'bg-purple-100 text-purple-800 border-purple-200',
  task: 'bg-blue-100 text-blue-800 border-blue-200',
};

export const CATEGORY_DOT: Record<Category, string> = {
  exercise: 'bg-green-500',
  food: 'bg-amber-400',
  social: 'bg-pink-500',
  event: 'bg-purple-500',
  task: 'bg-blue-500',
};

export interface FixedExpense {
  name: string;
  amount: number;
  category: FinanceCategory;
}

export interface FinanceProfile {
  id: string;
  monthly_take_home: number;
  fixed_expenses: FixedExpense[];
  updated_at: string;
}

export interface Transaction {
  id: string;
  week_id: string;
  date: string;
  amount: number;
  description: string;
  raw_description: string;
  category: FinanceCategory;
  confirmed: boolean;
  created_at: string;
}

export interface ParsedTransaction {
  date: string;
  amount: number;
  description: string;
  raw_description: string;
  category: FinanceCategory;
  confirmed: boolean;
}

export const FINANCE_CATEGORY_COLORS: Record<FinanceCategory, string> = {
  food: 'bg-amber-100 text-amber-800',
  transport: 'bg-sky-100 text-sky-800',
  going_out: 'bg-pink-100 text-pink-800',
  health_beauty: 'bg-rose-100 text-rose-800',
  shopping: 'bg-purple-100 text-purple-800',
  subscriptions: 'bg-indigo-100 text-indigo-800',
  bills: 'bg-orange-100 text-orange-800',
  income: 'bg-green-100 text-green-800',
  other: 'bg-gray-100 text-gray-800',
};

export const FINANCE_CATEGORY_DOT: Record<FinanceCategory, string> = {
  food: 'bg-amber-400',
  transport: 'bg-sky-500',
  going_out: 'bg-pink-500',
  health_beauty: 'bg-rose-500',
  shopping: 'bg-purple-500',
  subscriptions: 'bg-indigo-500',
  bills: 'bg-orange-500',
  income: 'bg-green-500',
  other: 'bg-gray-400',
};

export const FINANCE_CATEGORY_LABELS: Record<FinanceCategory, string> = {
  food: 'Food',
  transport: 'Transport',
  going_out: 'Going Out',
  health_beauty: 'Health & Beauty',
  shopping: 'Shopping',
  subscriptions: 'Subscriptions',
  bills: 'Bills',
  income: 'Income',
  other: 'Other',
};

export const FINANCE_CATEGORIES: FinanceCategory[] = [
  'food', 'transport', 'going_out', 'health_beauty',
  'shopping', 'subscriptions', 'bills', 'income', 'other',
];

export const PLAN_SECTIONS: { key: PlanSection; label: string; prompt: string }[] = [
  { key: 'exercise', label: 'Exercise', prompt: 'What movement do you want this week?' },
  { key: 'meals', label: 'Meals', prompt: 'What are you thinking for food this week?' },
  { key: 'todos', label: 'To-dos & Errands', prompt: 'What do you need to get done?' },
  { key: 'social', label: 'Social', prompt: 'Who do you want to see or connect with?' },
  { key: 'events', label: 'Events & Commitments', prompt: 'Any fixed events or appointments?' },
];
