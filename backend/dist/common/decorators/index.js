"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Membership = exports.WorkspaceId = exports.CurrentUser = exports.Roles = exports.ROLES_KEY = exports.Public = exports.IS_PUBLIC_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.IS_PUBLIC_KEY = 'isPublic';
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
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
