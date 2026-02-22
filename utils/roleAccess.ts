export const normalizeRole = (role?: string) =>
  String(role || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');

export const ROLE_GROUPS = {
  business: ['admin', 'accountant', 'staff', 'super_admin'],
  client: ['client'],
  app: ['admin', 'accountant', 'staff', 'client', 'super_admin'],
  payments: ['admin', 'accountant', 'client', 'super_admin'],
  reports: ['admin', 'accountant', 'super_admin'],
  inventoryManage: ['admin', 'accountant', 'super_admin'],
  settings: ['admin', 'super_admin'],
  support: ['admin', 'accountant', 'staff', 'client', 'super_admin'],
};

export const hasRole = (role: string | undefined, allowedRoles: string[]) =>
  allowedRoles.includes(normalizeRole(role));

export const getRoleLabel = (role?: string) => normalizeRole(role || 'user');
