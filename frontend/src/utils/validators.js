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
 * Validates Vietnamese phone numbers: starts with (0 or +84) followed by (3, 5, 7, 8, 9) and 8 digits
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  return phoneRegex.test(phone.trim().replace(/\s+/g, ''));
}

/**
 * Validates address length (minimum 10 characters per Design.md 7.5)
 * @param {string} address
 * @returns {boolean}
 */
export function isValidAddress(address) {
  if (!address || typeof address !== 'string') return false;
  return address.trim().length >= 10;
}

