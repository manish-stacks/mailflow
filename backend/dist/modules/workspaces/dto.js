"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateMemberLoginDto = exports.UpdateMemberDto = exports.InviteMemberDto = exports.UpdateWorkspaceDto = exports.CreateWorkspaceDto = void 0;
const class_validator_1 = require("class-validator");
class CreateWorkspaceDto {
    name;
    timezone;
}
exports.CreateWorkspaceDto = CreateWorkspaceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkspaceDto.prototype, "timezone", void 0);
class UpdateWorkspaceDto {
    name;
    timezone;
}
exports.UpdateWorkspaceDto = UpdateWorkspaceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateWorkspaceDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateWorkspaceDto.prototype, "timezone", void 0);
class InviteMemberDto {
    email;
    role;
}
exports.InviteMemberDto = InviteMemberDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['admin', 'editor', 'viewer']),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "role", void 0);
class UpdateMemberDto {
    role;
    status;
    firstName;
    lastName;
}
exports.UpdateMemberDto = UpdateMemberDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['admin', 'editor', 'viewer']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'disabled']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "lastName", void 0);
/**
 * Creates the login outright instead of emailing an invite — for agencies that
 * hand over credentials directly. `sendCredentials` mails the password once;
 * the user is flagged to change it on first sign-in either way.
 */
class CreateMemberLoginDto {
    email;
    firstName;
    lastName;
    password;
    role;
    sendCredentials;
}
exports.CreateMemberLoginDto = CreateMemberLoginDto;
__decorate([
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateMemberLoginDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateMemberLoginDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateMemberLoginDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    (0, class_validator_1.MaxLength)(72),
    __metadata("design:type", String)
], CreateMemberLoginDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['admin', 'editor', 'viewer']),
    __metadata("design:type", String)
], CreateMemberLoginDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateMemberLoginDto.prototype, "sendCredentials", void 0);
