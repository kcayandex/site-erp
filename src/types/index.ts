export type UserRole = "admin" | "user";

export interface Site {
  id: string;
  name: string;
  address: string;
  abbreviation: string;
  vergi_no: string | null;
  is_active: boolean;
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
  total_odened: number;
  profit: number;
  receipt_count: number;
}
