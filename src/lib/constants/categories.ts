export const RECEIPT_CATEGORIES = [
  "Staff Salary",
  "Charted Accountant Fee",
  "Pool Chemicals",
  "Pool Maintenance",
  "Elevator Control",
  "Elevator Repairs",
  "Cleaning Expenses",
  "Garden Expenses",
  "Building Maintenance & Repairs",
  "Generator Maintenance",
  "New Fixtures",
  "Management Company Fee",
  "Other Expenses",
] as const

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number]
