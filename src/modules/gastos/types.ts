export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  description: string | null;
  spent_at: string;
  recurring: boolean;
  created_at: string;
}

export interface NewExpenseInput {
  category_id: string;
  amount: number;
  spent_at: string;
  description?: string;
  recurring?: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  created_at: string;
}
