export const ROLES = {
  USER: 'USER',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
};

export const ITEM_STATUS = {
  LOST: 'LOST',
  FOUND: 'FOUND',
  RETURNED: 'RETURNED',
  CLOSED: 'CLOSED',
};

export const CLAIM_STATUS = {
  PENDING: 'PENDING',
  UNDER_REVIEW: 'UNDER_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  READY_FOR_HANDOVER: 'READY_FOR_HANDOVER',
  COMPLETED: 'COMPLETED',
};

export const REPORT_TYPE = {
  LOST: 'LOST',
  FOUND: 'FOUND',
};

export const CLAIM_STATUS_CONFIG = {
  PENDING: { label: 'Chờ xử lý', color: 'yellow' },
  UNDER_REVIEW: { label: 'Đang xem xét', color: 'blue' },
  APPROVED: { label: 'Đã duyệt', color: 'green' },
  REJECTED: { label: 'Từ chối', color: 'red' },
  READY_FOR_HANDOVER: { label: 'Chờ bàn giao', color: 'purple' },
  COMPLETED: { label: 'Đã bàn giao', color: 'gray' },
};

export const ITEM_STATUS_CONFIG = {
  LOST: { label: 'Đã mất', color: 'red' },
  FOUND: { label: 'Nhặt được', color: 'green' },
  RETURNED: { label: 'Đã trả', color: 'blue' },
  CLOSED: { label: 'Đã đóng', color: 'gray' },
};

export const STORAGE_KEYS = {
  USERS: 'unifind_users',
  ITEMS: 'unifind_items',
  CLAIMS: 'unifind_claims',
  CATEGORIES: 'unifind_categories',
  LOCATIONS: 'unifind_locations',
  NOTIFICATIONS: 'unifind_notifications',
  HANDOVERS: 'unifind_handovers',
  AUDIT_LOGS: 'unifind_audit_logs',
  CURRENT_USER: 'unifind_current_user',
  INITIALIZED: 'unifind_initialized',
};
