/**
 * Validates email address format
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password length (minimum 6 characters according to SRS/Prompt)
 * @param {string} password
 * @returns {boolean}
 */
export function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6;
}

/**
 * Validates Vietnamese phone numbers: starts with 03, 05, 07, 08, 09 followed by 8 digits
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^(0[35789])[0-9]{8}$/;
  return phoneRegex.test(phone.trim().replace(/\s+/g, ''));
}
