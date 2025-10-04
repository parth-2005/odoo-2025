export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export function isRole(value: string): value is Role {
  return Object.values(ROLES).includes(value as Role);
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  manager: 'Manager',
  employee: 'Employee',
};
