export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SHIPPING: 'SHIPPING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  RETURNING: 'RETURNING',
  RETURNED: 'RETURNED',
  RETURN_REJECTED: 'RETURN_REJECTED',
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: 'Chờ xử lý',
  [ORDER_STATUS.PROCESSING]: 'Đang xử lý',
  [ORDER_STATUS.SHIPPING]: 'Đang giao',
  [ORDER_STATUS.COMPLETED]: 'Hoàn thành',
  [ORDER_STATUS.CANCELLED]: 'Đã hủy',
  [ORDER_STATUS.RETURN_REQUESTED]: 'Yêu cầu trả hàng',
  [ORDER_STATUS.RETURNING]: 'Đang trả hàng',
  [ORDER_STATUS.RETURNED]: 'Đã trả hàng',
  [ORDER_STATUS.RETURN_REJECTED]: 'Trả hàng bị từ chối',
};

export const ORDER_STATUS_CLASSES = {
  [ORDER_STATUS.PENDING]: 'bg-amber-100 text-amber-800',
  [ORDER_STATUS.PROCESSING]: 'bg-blue-100 text-blue-800',
  [ORDER_STATUS.SHIPPING]: 'bg-violet-100 text-violet-800',
  [ORDER_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [ORDER_STATUS.CANCELLED]: 'bg-red-100 text-red-800',
  [ORDER_STATUS.RETURN_REQUESTED]: 'bg-orange-100 text-orange-800',
  [ORDER_STATUS.RETURNING]: 'bg-purple-100 text-purple-800',
  [ORDER_STATUS.RETURNED]: 'bg-gray-100 text-gray-800',
  [ORDER_STATUS.RETURN_REJECTED]: 'bg-red-100 text-red-700',
};

/**
 * Valid order state machine transitions according to SRS FR-06 & Return Flow:
 * PENDING -> PROCESSING -> SHIPPING -> COMPLETED
 * PENDING / PROCESSING can transition to CANCELLED
 * SHIPPING can only transition to COMPLETED (cannot be cancelled once shipped)
 * COMPLETED can transition to RETURN_REQUESTED
 * RETURN_REQUESTED can transition to RETURNING (approved) or RETURN_REJECTED (rejected)
 * RETURN_REJECTED: khách có thể gửi yêu cầu mới -> RETURN_REQUESTED
 * RETURNING can only transition to RETURNED
 * RETURNED / CANCELLED / RETURN_REJECTED (terminal, trừ khi gửi lại) are terminal states
 */
export const VALID_ORDER_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.SHIPPING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SHIPPING]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [ORDER_STATUS.RETURN_REQUESTED],
  [ORDER_STATUS.RETURN_REQUESTED]: [ORDER_STATUS.RETURNING, ORDER_STATUS.RETURN_REJECTED, ORDER_STATUS.RETURNED],
  [ORDER_STATUS.RETURN_REJECTED]: [ORDER_STATUS.RETURN_REQUESTED], // Cho phép gửi lại
  [ORDER_STATUS.RETURNING]: [ORDER_STATUS.RETURNED],
  [ORDER_STATUS.RETURNED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

export const SORT_OPTIONS = [
  { value: '', label: 'Mặc định' },
  { value: 'price_asc', label: 'Giá: Thấp đến Cao' },
  { value: 'price_desc', label: 'Giá: Cao đến Thấp' },
  { value: 'stock_desc', label: 'Tồn kho nhiều nhất' },
  { value: 'rating_desc', label: 'Đánh giá cao nhất' },
];

/**
 * Free shipping threshold in VND (Design.md 7.4)
 */
export const FREE_SHIP_THRESHOLD = 300000;

/**
 * Category metadata mapping per Design.md 2.7.4 (v2.1 Fashion)
 * Matches category name / slug to icon emoji, card bg and sticker bg
 */
export const CATEGORY_META = {
  'Áo thun': {
    emoji: '👕',
    bg: 'bg-primary-50',
    sticker: 'bg-primary-100',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  'Áo thun & Polo': {
    emoji: '👕',
    bg: 'bg-primary-50',
    sticker: 'bg-primary-100',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  'Áo sơ mi': {
    emoji: '👔',
    bg: 'bg-secondary-50',
    sticker: 'bg-secondary-100',
    border: 'border-secondary-200',
    text: 'text-secondary-700',
  },
  'Áo sơ mi & Áo kiểu': {
    emoji: '👔',
    bg: 'bg-secondary-50',
    sticker: 'bg-secondary-100',
    border: 'border-secondary-200',
    text: 'text-secondary-700',
  },
  'Quần': {
    emoji: '👖',
    bg: 'bg-primary-50',
    sticker: 'bg-primary-200',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  'Quần & Chân váy': {
    emoji: '👖',
    bg: 'bg-primary-50',
    sticker: 'bg-primary-200',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  'Váy đầm': {
    emoji: '👗',
    bg: 'bg-secondary-50',
    sticker: 'bg-secondary-200',
    border: 'border-secondary-200',
    text: 'text-secondary-700',
  },
  'Váy & Đầm': {
    emoji: '👗',
    bg: 'bg-secondary-50',
    sticker: 'bg-secondary-200',
    border: 'border-secondary-200',
    text: 'text-secondary-700',
  },
  'Áo khoác': {
    emoji: '🧥',
    bg: 'bg-primary-50',
    sticker: 'bg-primary-100',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  'Áo khoác & Hoodie': {
    emoji: '🧥',
    bg: 'bg-primary-50',
    sticker: 'bg-primary-100',
    border: 'border-primary-200',
    text: 'text-primary-700',
  },
  // Fallbacks for legacy/general categories — entries above already cover all variants
};

export const DEFAULT_CATEGORY_META = {
  emoji: '🏷️',
  bg: 'bg-primary-50',
  sticker: 'bg-primary-100',
  border: 'border-primary-200',
  text: 'text-primary-700',
};

export function getCategoryMeta(name) {
  if (!name) return DEFAULT_CATEGORY_META;
  const lower = name.toLowerCase();

  // Fashion categories mapping (Design.md 2.7.4)
  if (lower.includes('áo thun') || lower.includes('polo') || lower.includes('t-shirt') || lower.includes('tee')) {
    return CATEGORY_META['Áo thun & Polo'];
  }
  if (lower.includes('sơ mi') || lower.includes('áo kiểu') || lower.includes('shirt')) {
    return CATEGORY_META['Áo sơ mi & Áo kiểu'];
  }
  if (lower.includes('quần') || lower.includes('chân váy') || lower.includes('jeans') || lower.includes('kaki') || lower.includes('short')) {
    return CATEGORY_META['Quần & Chân váy'];
  }
  if (lower.includes('váy') || lower.includes('đầm') || lower.includes('dress') || lower.includes('skirt')) {
    return CATEGORY_META['Váy & Đầm'];
  }
  if (lower.includes('khoác') || lower.includes('hoodie') || lower.includes('jacket') || lower.includes('sweater') || lower.includes('cardigan')) {
    return CATEGORY_META['Áo khoác & Hoodie'];
  }

  // Fallback mappings

  // Fashion categories mapping (Design.md 2.7.4)
  if (lower.includes('áo thun') || lower.includes('polo') || lower.includes('t-shirt') || lower.includes('tee')) {
    return CATEGORY_META['Áo thun & Polo'];
  }
  if (lower.includes('sơ mi') || lower.includes('áo kiểu') || lower.includes('shirt')) {
    return CATEGORY_META['Áo sơ mi & Áo kiểu'];
  }
  if (lower.includes('quần') || lower.includes('chân váy') || lower.includes('jeans') || lower.includes('kaki') || lower.includes('short')) {
    return CATEGORY_META['Quần & Chân váy'];
  }
  if (lower.includes('váy') || lower.includes('đầm') || lower.includes('dress') || lower.includes('skirt')) {
    return CATEGORY_META['Váy & Đầm'];
  }
  if (lower.includes('khoác') || lower.includes('hoodie') || lower.includes('jacket') || lower.includes('sweater') || lower.includes('cardigan')) {
    return CATEGORY_META['Áo khoác & Hoodie'];
  }

  // Fallback mappings


  return DEFAULT_CATEGORY_META;
}
