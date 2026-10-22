import type {
  Dashboard,
  EMIResult,
  InstallmentCollection,
  InstallmentInput,
  InstallmentPlan,
  Profile,
  PurchaseAssessment,
  PurchasePlan,
  PurchasePlanInput,
  SimulationInput,
  SimulationResult,
} from '@/types/api'

const API_BASE = (import.meta.env.VITE_API_URL || '/api/v1').replace(/\/$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ErrorDetail = {
  msg?: string
  message?: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
  } catch {
    throw new ApiError(
      'The local API is unreachable. Make sure the FastAPI server is running.',
      0,
    )
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body: { detail?: string | ErrorDetail[]; message?: string } = await response.json()
      if (typeof body.detail === 'string') {
        message = body.detail
      } else if (Array.isArray(body.detail)) {
        message = body.detail.map((item) => item.msg || item.message).filter(Boolean).join('. ') || message
      } else if (body.message) {
        message = body.message
      }
    } catch {
      // Keep the status-based fallback for non-JSON responses.
    }
    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export type ProfileInput = Pick<
  Profile,
  | 'name'
  | 'monthly_income'
  | 'current_savings'
  | 'essential_expenses'
  | 'discretionary_expenses'
  | 'existing_debt_payments'
  | 'emergency_fund_target'
  | 'planned_purchase_amount'
  | 'expected_purchase_date'
>

export interface EMIInput {
  principal: number
  annual_rate_pct: number
  tenure_months: number
  processing_fee_pct?: number
  processing_fee_fixed?: number
}

export interface PurchaseAssessmentInput {
  amount?: number
  target_date?: string
  title?: string
}

export const api = {
  getProfile: () => request<Profile>('/profile'),
  updateProfile: (payload: ProfileInput) =>
    request<Profile>('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  restoreDemoProfile: () => request<Profile>('/profile/demo', { method: 'POST' }),
  getDashboard: () => request<Dashboard>('/dashboard'),
  simulate: (payload: SimulationInput) =>
    request<SimulationResult>('/scenarios/simulate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  assessPurchase: (payload: PurchaseAssessmentInput) =>
    request<PurchaseAssessment>('/purchases/assess', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPurchasePlans: () => request<PurchasePlan[]>('/purchases/plans'),
  savePurchasePlan: (payload: PurchasePlanInput) =>
    request<PurchasePlan>('/purchases/plans', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deletePurchasePlan: (planId: number) =>
    request<void>(`/purchases/plans/${planId}`, { method: 'DELETE' }),
  calculateEMI: (payload: EMIInput) =>
    request<EMIResult>('/emi/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getInstallments: () => request<InstallmentCollection>('/installments'),
  createInstallment: (payload: InstallmentInput) =>
    request<InstallmentPlan>('/installments', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  payInstallment: (planId: number) =>
    request<InstallmentPlan>(`/installments/${planId}/pay`, { method: 'PATCH' }),
  deleteInstallment: (planId: number) =>
    request<void>(`/installments/${planId}`, { method: 'DELETE' }),
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}
