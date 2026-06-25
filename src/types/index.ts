export type UserRole = "admin" | "user";

export interface Contractor {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  abbreviation: string;
  vergi_no: string | null;
  monthly_fee: number;
  contract_start_date: string | null;
  contract_end_date: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  share_percentage: number;
  is_active: boolean;
  created_at: string;
}

export interface KasaSettlement {
  id: string;
  year: number;
  month: number;
  total_distributed: number | null;
  notes: string | null;
  settled_at: string;
}

export interface SiteFeePeriod {
  id: string;
  site_id: string;
  effective_from: string;
  monthly_fee: number;
  note: string | null;
  created_at: string;
}

export interface MonthlyPayment {
  id: string;
  site_id: string;
  site?: Site;
  year: number;
  month: number;
  amount: number;
  paid_at: string | null;
  payment_method: "nakit" | "havale" | null;
  notes: string | null;
  created_at: string;
}

export interface CompanyExpense {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  expense_date: string;
  paid_by: "kasa" | "ortak1" | "ortak2";
  reimbursed: boolean;
  reimbursed_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ReceiptItem {
  no: number;
  description: string;
  amount_islenen: number;
  amount_odenen: number;
}

export interface Receipt {
  id: string;
  site_id: string;
  site?: Site;
  receipt_no: string;
  serial_no: string;
  sequence_no: number;
  date: string;
  category: string | null;
  contractor_id: string | null;
  contractor?: Contractor;
  payment_description: string | null;
  items: ReceiptItem[];
  total_islenen: number;
  total_odenen: number;
  amount_words: string | null;
  customer_code: string | null;
  created_at: string;
  created_by: string | null;
}

export interface ProfitReport {
  site_id: string;
  site_name: string;
  total_islenen: number;
  total_odenen: number;
  profit: number;
  receipt_count: number;
}
