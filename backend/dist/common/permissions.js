"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ADMIN_PERMISSIONS = void 0;
/**
 * Delegable platform-staff permissions. A true super admin (users.is_super_admin)
 * always has every one of these implicitly — this list only matters for staff
 * accounts that are admins but not full super admins.
 */
exports.ADMIN_PERMISSIONS = [
    'workspaces.view',
    'workspaces.manage', // change package, suspend/reactivate, provision new clients
    'plans.manage',
    'payments.view',
    'impersonate',
];
