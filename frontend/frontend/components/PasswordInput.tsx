'use client'

import { useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
  inputClassName?: string
  /** Id of the element describing this input (e.g. the requirements list). */
  describedBy?: string
  invalid?: boolean
  id?: string
}

/**
 * Password field with an accessible show/hide toggle.
 *
 * The toggle is a real `<button type="button">` so it is reachable by keyboard,
 * exposes its state through `aria-pressed`, and never submits the form.
 */
export default function PasswordInput({
  value,
  onChange,
  label,
  placeholder,
  autoComplete = 'current-password',
  required = true,
  inputClassName = '',
  describedBy,
  invalid = false,
  id,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const generatedId = useId()
  const inputId = id ?? `password-${generatedId}`

  return (
    <div>
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold uppercase tracking-wider mb-1"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-1 block w-full px-4 py-3 rounded-lg text-sm transition-all duration-200 password-input ${inputClassName}`}
          style={{
            border: `1px solid ${invalid ? '#ef4444' : 'var(--border)'}`,
            paddingRight: '3rem',
          }}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
        />

        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={visible}
          title={visible ? `Hide ${label}` : `Show ${label}`}
          className="password-toggle absolute top-1/2 right-0 -translate-y-1/2 mr-1 flex items-center justify-center h-9 w-9 rounded-md transition-colors duration-200"
          style={{ color: 'var(--text-muted)' }}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
