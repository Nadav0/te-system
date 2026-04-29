export interface User {
  id: string
  email: string
  full_name: string
  role: 'employee' | 'manager' | 'finance'
  department?: string
  manager_id?: string
}

export interface ExpenseItem {
  id: string
  report_id: string
  date: string
  category: string
  description: string
  amount: number
  receipt_url?: string
  policy_violation: boolean
  violation_detail?: string
}

export interface ExpenseReport {
  id: string
  employee_id: string
  travel_request_id?: string
  title: string
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  currency: string
  total_amount: number
  has_violations: boolean
  submitted_at?: string
  reviewed_by?: string
  review_note?: string
  created_at: string
  employee?: User
  reviewer?: User
  items: ExpenseItem[]
}

export interface TravelRequest {
  id: string
  employee_id: string
  destination: string
  purpose: string
  departure_date: string
  return_date: string
  estimated_budget: number
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  reviewed_by?: string
  review_note?: string
  submitted_at?: string
  created_at: string
  employee?: User
  reviewer?: User
}

export interface PolicyRule {
  id: string
  category: string
  max_amount_per_item?: number
  max_amount_per_day?: number
  requires_receipt_above?: number
  description: string
  active: boolean
}
