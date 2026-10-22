import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { AddInstallmentDialog } from './AddInstallmentDialog'

function renderDialog(onSave = vi.fn()) {
  render(<AddInstallmentDialog open onOpenChange={vi.fn()} saving={false} onSave={onSave} />)
  return onSave
}

describe('AddInstallmentDialog', () => {
  it('shows an accessible form and blocks an empty submission', () => {
    const onSave = renderDialog()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Add an installment plan' })).toBeInTheDocument()
    expect(screen.getByLabelText('Purchase name')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Add to tracker' }))

    expect(screen.getByText('Give this purchase a name.')).toBeInTheDocument()
    expect(screen.getByText('Enter a purchase total above zero.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('converts the form values into a tracker payload', () => {
    const onSave = renderDialog()

    fireEvent.change(screen.getByLabelText('Purchase name'), { target: { value: 'Studio headphones' } })
    fireEvent.change(screen.getByLabelText(/Merchant/), { target: { value: 'Headphone Hub' } })
    fireEvent.change(screen.getByLabelText('Purchase total'), { target: { value: '30000' } })
    fireEvent.change(screen.getByLabelText('Upfront payment'), { target: { value: '3000' } })
    fireEvent.change(screen.getByLabelText('Monthly installment'), { target: { value: '4500' } })
    fireEvent.change(screen.getByLabelText('Tenure'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Already paid'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Next due date'), { target: { value: '2026-12-01' } })
    fireEvent.change(screen.getByLabelText('Annual interest'), { target: { value: '0' } })
    fireEvent.change(screen.getByLabelText(/Notes/), { target: { value: 'No-cost EMI' } })

    fireEvent.click(screen.getByRole('button', { name: 'Add to tracker' }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      name: 'Studio headphones',
      merchant: 'Headphone Hub',
      total_amount: 30000,
      upfront_payment: 3000,
      monthly_installment: 4500,
      tenure_months: 6,
      paid_installments: 2,
      next_due_date: '2026-12-01',
      annual_rate_pct: 0,
      notes: 'No-cost EMI',
    })
  })

  it('rejects an upfront payment that consumes the whole purchase', () => {
    const onSave = renderDialog()

    fireEvent.change(screen.getByLabelText('Purchase name'), { target: { value: 'Phone' } })
    fireEvent.change(screen.getByLabelText('Purchase total'), { target: { value: '50000' } })
    fireEvent.change(screen.getByLabelText('Upfront payment'), { target: { value: '50000' } })
    fireEvent.change(screen.getByLabelText('Monthly installment'), { target: { value: '5000' } })

    fireEvent.click(screen.getByRole('button', { name: 'Add to tracker' }))

    expect(screen.getByText('The upfront payment must be less than the total.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })
})
