/**
 * Shared password policy for Mauqa-Finder.
 *
 * The rules here mirror the server-side Supabase Auth policy so the UI can
 * give immediate feedback, while the server stays the source of truth.
 *
 * Server-side equivalent (Supabase Dashboard > Authentication > Providers >
 * Email, or the Management API `password_*` fields):
 *
 *   password_min_length          = 8
 *   password_required_characters = <see>SUPABASE_PASSWORD_REQUIRED_CHARACTERS>
 *   password_hibp_enabled        = true
 *
 * NOTE: `password_required_characters` is a colon-separated list of *literal*
 * character sets (GoTrue uses `strings.ContainsAny`). Every set must match at
 * least one character, so `A-Z` does NOT mean "an uppercase letter" - it would
 * mean "one of the literal characters A, - or Z".
 */

/** bcrypt hashes at most 72 bytes, so longer passwords are silently truncated. */
export const PASSWORD_MAX_LENGTH = 72

export const PASSWORD_MIN_LENGTH = 8

/**
 * Characters accepted as "special". `:` and `\` are deliberately excluded so
 * the value can be embedded in the colon-separated server config as-is, and
 * quotes are excluded so the value can be pasted into shell/JSON commands
 * without escaping.
 */
export const SPECIAL_CHARACTERS = '!@#$%^&*()-_=+[]{};.,<>/?~'

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'

/** Exact value to paste into Supabase's `password_required_characters`. */
export const SUPABASE_PASSWORD_REQUIRED_CHARACTERS = [
  UPPERCASE,
  LOWERCASE,
  DIGITS,
  SPECIAL_CHARACTERS,
].join(':')

export type PasswordRuleId = 'length' | 'uppercase' | 'lowercase' | 'number' | 'special'

export interface PasswordRule {
  id: PasswordRuleId
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: 'length',
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A-Z)',
    test: (password) => containsAny(password, UPPERCASE),
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a-z)',
    test: (password) => containsAny(password, LOWERCASE),
  },
  {
    id: 'number',
    label: 'One number (0-9)',
    test: (password) => containsAny(password, DIGITS),
  },
  {
    id: 'special',
    label: `One special character (${SPECIAL_CHARACTERS})`,
    test: (password) => containsAny(password, SPECIAL_CHARACTERS),
  },
]

export interface PasswordRuleResult {
  id: PasswordRuleId
  label: string
  met: boolean
}

export interface PasswordCheck {
  valid: boolean
  rules: PasswordRuleResult[]
  metCount: number
  total: number
  length: number
  tooLong: boolean
}

export function containsAny(value: string, set: string): boolean {
  for (const char of set) {
    if (value.includes(char)) return true
  }
  return false
}

/** Evaluates the password against every rule in the policy. */
export function checkPassword(password: string): PasswordCheck {
  const rules = PASSWORD_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }))
  const metCount = rules.filter((rule) => rule.met).length
  const tooLong = password.length > PASSWORD_MAX_LENGTH

  return {
    valid: metCount === rules.length && !tooLong,
    rules,
    metCount,
    total: rules.length,
    length: password.length,
    tooLong,
  }
}

export type PasswordStrengthLevel =
  | 'empty'
  | 'very-weak'
  | 'weak'
  | 'fair'
  | 'strong'
  | 'very-strong'

export interface PasswordStrength {
  level: PasswordStrengthLevel
  /** 0 (empty) to 4 (very strong). */
  score: number
  label: string
  /** 0-100, used for the meter width. */
  percent: number
  color: string
}

const STRENGTH_LEVELS = {
  'very-weak': { label: 'Very weak', color: '#ef4444', percent: 20 },
  weak: { label: 'Weak', color: '#f59e0b', percent: 40 },
  fair: { label: 'Fair', color: '#eab308', percent: 60 },
  strong: { label: 'Strong', color: '#10b981', percent: 80 },
  'very-strong': { label: 'Very strong', color: '#059669', percent: 100 },
} as const

/**
 * Advisory strength rating. It deliberately never blocks submission on its
 * own - `checkPassword` decides validity - it only drives the meter.
 */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { level: 'empty', score: 0, label: '', percent: 0, color: 'var(--border)' }
  }

  const check = checkPassword(password)
  if (check.tooLong) {
    return { level: 'very-weak', score: 0, ...STRENGTH_LEVELS['very-weak'] }
  }

  let points = check.metCount
  if (password.length >= 12) points += 1
  if (password.length >= 16) points += 1

  const score =
    points <= 1 ? 0 : points <= 2 ? 1 : points <= 4 ? 2 : points <= 5 ? 3 : 4
  const level = (['very-weak', 'weak', 'fair', 'strong', 'very-strong'] as const)[score]

  return { level, score, ...STRENGTH_LEVELS[level] }
}
