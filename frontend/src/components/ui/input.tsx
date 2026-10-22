import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leading?: React.ReactNode
  trailing?: React.ReactNode
  invalid?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', leading, trailing, invalid, ...props }, ref) => {
    if (leading || trailing) {
      return (
        <div
          className={cn(
            'flex h-10 w-full items-center rounded-xl border border-line bg-[#09111d] text-sm text-ink transition-colors focus-within:border-emerald-400/50 focus-within:ring-2 focus-within:ring-emerald-400/[0.08]',
            invalid && 'border-rose/50 focus-within:border-rose/70 focus-within:ring-rose/10',
            className,
          )}
        >
          {leading && <span className="pl-3 text-xs text-faint">{leading}</span>}
          <input
            ref={ref}
            type={type}
            className={cn(
              'h-full min-w-0 flex-1 bg-transparent px-3 text-sm text-ink outline-none placeholder:text-faint/70 disabled:cursor-not-allowed disabled:opacity-50',
              leading && 'pl-2',
              trailing && 'pr-2',
            )}
            {...props}
          />
          {trailing && <span className="pr-3 text-xs text-faint">{trailing}</span>}
        </div>
      )
    }
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'h-10 w-full rounded-xl border border-line bg-[#09111d] px-3 text-sm text-ink outline-none transition-colors placeholder:text-faint/70 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/[0.08] disabled:cursor-not-allowed disabled:opacity-50',
          invalid && 'border-rose/50 focus:border-rose/70 focus:ring-rose/10',
          className,
        )}
        aria-invalid={invalid || undefined}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[88px] w-full resize-y rounded-xl border border-line bg-[#09111d] px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-faint/70 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/[0.08]',
        className,
      )}
      {...props}
    />
  ),
)
Textarea.displayName = 'Textarea'

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('mb-2 flex items-center justify-between gap-2 text-[12px] font-semibold text-ink/90', className)}
      {...props}
    />
  ),
)
Label.displayName = 'Label'

const FieldHint = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('mt-1.5 text-[11px] leading-relaxed text-faint', className)} {...props} />
)

const FieldError = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('mt-1.5 text-[11px] font-medium text-rose', className)} role="alert" {...props} />
)

const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full appearance-none rounded-xl border border-line bg-[#09111d] bg-[url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 fill=%27none%27 viewBox=%270 0 24 24%27%3E%3Cpath stroke=%27%238ea0b5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.8%27 d=%27m6 9 6 6 6-6%27/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_12px_center] bg-no-repeat px-3 pr-9 text-sm text-ink outline-none transition-colors focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/[0.08]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
)
Select.displayName = 'Select'

export { Input, Textarea, Label, FieldHint, FieldError, Select }
