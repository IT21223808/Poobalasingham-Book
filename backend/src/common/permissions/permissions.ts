import { UserRole } from '../../users/user-role.enum';

export enum AppPermission {
  DASHBOARD = 'dashboard',
  CATALOG = 'catalog',
  PRODUCTS = 'products',
  INVENTORY = 'inventory',
  LOCATIONS = 'locations',
  PURCHASING = 'purchasing',
  ORDERS = 'orders',
  CUSTOMERS = 'customers',
  SUPPLIERS = 'suppliers',
  FINANCE = 'finance',
  REPORTS = 'reports',
  POS = 'pos',
  SETTINGS = 'settings',
}

export const ROLE_PERMISSIONS: Record<
  UserRole,
  AppPermission[]
> = {
  // =====================================
  // OWNER
  // =====================================

  [UserRole.OWNER]: Object.values(AppPermission),

  // =====================================
  // MANAGER
  // =====================================

  [UserRole.MANAGER]: [
    AppPermission.DASHBOARD,
    AppPermission.CATALOG,
    AppPermission.PRODUCTS,
    AppPermission.INVENTORY,
    AppPermission.ORDERS,
    AppPermission.CUSTOMERS,
    AppPermission.REPORTS,
    AppPermission.POS,
  ],

  // =====================================
  // CASHIER
  // =====================================

  [UserRole.CASHIER]: [
    AppPermission.DASHBOARD,
    AppPermission.CATALOG,
    AppPermission.PRODUCTS,
    AppPermission.ORDERS,
    AppPermission.CUSTOMERS,
    AppPermission.POS,
  ],

  // =====================================
  // LEGACY ROLES
  // =====================================

  [UserRole.ADMIN]: [
    AppPermission.DASHBOARD,
    AppPermission.CATALOG,
    AppPermission.PRODUCTS,
    AppPermission.INVENTORY,
    AppPermission.LOCATIONS,
    AppPermission.PURCHASING,
    AppPermission.ORDERS,
    AppPermission.CUSTOMERS,
    AppPermission.SUPPLIERS,
    AppPermission.FINANCE,
    AppPermission.REPORTS,
    AppPermission.POS,
    AppPermission.SETTINGS,
  ],

  [UserRole.STAFF]: [
    AppPermission.DASHBOARD,
    AppPermission.CATALOG,
    AppPermission.PRODUCTS,
    AppPermission.ORDERS,
    AppPermission.CUSTOMERS,
    AppPermission.POS,
  ],

  [UserRole.USER]: [], 
};