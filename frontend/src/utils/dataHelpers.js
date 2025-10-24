// Utility functions for handling fallback values and data validation

/**
 * Get a safe string value with fallback
 * @param {any} value - The value to check
 * @param {string} fallback - The fallback value to use
 * @returns {string} - The value or fallback
 */
export const getSafeString = (value, fallback = 'তথ্য নেই') => {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  return String(value);
};

/**
 * Get a safe number value with fallback
 * @param {any} value - The value to check
 * @param {number} fallback - The fallback value to use
 * @returns {number} - The value or fallback
 */
export const getSafeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || isNaN(Number(value))) {
    return fallback;
  }
  return Number(value);
};

/**
 * Get a safe date string with fallback
 * @param {any} dateValue - The date value to check
 * @param {string} fallback - The fallback value to use
 * @returns {string} - The formatted date or fallback
 */
export const getSafeDate = (dateValue, fallback = 'তারিখ নেই') => {
  if (!dateValue) return fallback;
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return fallback;
    return date.toLocaleDateString('bn-BD');
  } catch {
    return fallback;
  }
};

/**
 * Get safe book title with fallback
 * @param {any} title - The book title
 * @returns {string} - The title or fallback
 */
export const getSafeBookTitle = (title) => getSafeString(title, 'অজানা বই');

/**
 * Get safe author name with fallback
 * @param {any} author - The author name
 * @returns {string} - The author or fallback
 */
export const getSafeAuthor = (author) => getSafeString(author, 'অজানা লেখক');

/**
 * Get safe user name with fallback
 * @param {any} name - The user name
 * @returns {string} - The name or fallback
 */
export const getSafeUserName = (name) => getSafeString(name, 'অজানা ব্যবহারকারী');

/**
 * Get safe category name with fallback
 * @param {any} category - The category name
 * @returns {string} - The category or fallback
 */
export const getSafeCategoryName = (category) => getSafeString(category, 'অজানা বিভাগ');

/**
 * Get safe email with fallback
 * @param {any} email - The email address
 * @returns {string} - The email or fallback
 */
export const getSafeEmail = (email) => getSafeString(email, 'ইমেইল নেই');

/**
 * Get safe phone with fallback
 * @param {any} phone - The phone number
 * @returns {string} - The phone or fallback
 */
export const getSafePhone = (phone) => getSafeString(phone, 'ফোন নেই');

/**
 * Get safe status display
 * @param {any} status - The status value
 * @returns {string} - The status or fallback
 */
export const getSafeStatus = (status) => getSafeString(status, 'অজানা অবস্থা');

/**
 * Format safe currency (for future use)
 * @param {any} amount - The amount
 * @returns {string} - The formatted amount
 */
export const getSafeCurrency = (amount, fallback = '০ টাকা') => {
  const num = getSafeNumber(amount, 0);
  return `${num.toLocaleString('bn-BD')} টাকা`;
};

/**
 * Get safe array length
 * @param {any} array - The array
 * @returns {number} - The length or 0
 */
export const getSafeArrayLength = (array) => {
  if (!Array.isArray(array)) return 0;
  return array.length;
};

export default {
  getSafeString,
  getSafeNumber,
  getSafeDate,
  getSafeBookTitle,
  getSafeAuthor,
  getSafeUserName,
  getSafeCategoryName,
  getSafeEmail,
  getSafePhone,
  getSafeStatus,
  getSafeCurrency,
  getSafeArrayLength
};
