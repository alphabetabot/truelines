const AUTH_ERROR_MESSAGES = {
  'Invalid login credentials': 'Incorrect email or password. Try again or reset your password.',
  'Email not confirmed': 'Confirm your email before signing in. Check your inbox for the confirmation link.',
  'User already registered': 'An account with this email already exists. Sign in instead.',
  'Password should be at least 6 characters': 'Use a password with at least 6 characters.',
  'Signup requires a valid password': 'Use a password with at least 6 characters.',
  'Unable to validate email address: invalid format': 'Enter a valid email address.',
}

export function getAuthErrorMessage(error) {
  if (!error) return 'Something went wrong. Please try again.'
  const msg = error.message || String(error)
  if (AUTH_ERROR_MESSAGES[msg]) return AUTH_ERROR_MESSAGES[msg]
  if (/rate limit/i.test(msg)) return 'Too many attempts. Wait a few minutes and try again.'
  if (/network|fetch/i.test(msg)) return 'Network error. Check your connection and try again.'
  return msg
}
