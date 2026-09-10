"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Membership = exports.WorkspaceId = exports.CurrentUser = exports.Roles = exports.ROLES_KEY = exports.RequirePermission = exports.ADMIN_PERMISSION_KEY = exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
/** Platform-admin permission required for a route. A super admin bypasses this check entirely. */
exports.ADMIN_PERMISSION_KEY = 'adminPermission';
const RequirePermission = (permission) => (0, common_1.SetMetadata)(exports.ADMIN_PERMISSION_KEY, permission);
exports.RequirePermission = RequirePermission;
exports.ROLES_KEY = 'roles';
const Roles = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.Roles = Roles;
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return data ? req.user?.[data] : req.user;
});
/** Injects the resolved workspace id (validated by WorkspaceGuard). */
exports.WorkspaceId = (0, common_1.createParamDecorator)((_d, ctx) => {
    return ctx.switchToHttp().getRequest().workspaceId;
});
exports.Membership = (0, common_1.createParamDecorator)((_d, ctx) => {
    return ctx.switchToHttp().getRequest().membership;
});
