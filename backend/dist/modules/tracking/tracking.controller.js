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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackingController = void 0;
const common_1 = require("@nestjs/common");
const decorators_1 = require("../../common/decorators");
const tracking_service_1 = require("./tracking.service");
let TrackingController = class TrackingController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async open(token, req, res) {
        // Always return the pixel, even for a bad token — never leak validity.
        this.svc.open(token, { ip: req.ip, userAgent: req.headers['user-agent'] }).catch(() => null);
        res.setHeader('Content-Type', 'image/gif');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.end(tracking_service_1.PIXEL);
    }
    async click(token, req, res) {
        const url = await this.svc.click(token, { ip: req.ip, userAgent: req.headers['user-agent'] }).catch(() => null);
        return res.redirect(302, url || `${process.env.APP_BASE_URL || 'http://localhost:3000'}/link-expired`);
    }
};
exports.TrackingController = TrackingController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('open/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "open", null);
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('click/:token'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], TrackingController.prototype, "click", null);
exports.TrackingController = TrackingController = __decorate([
    (0, common_1.Controller)('tracking'),
    __metadata("design:paramtypes", [tracking_service_1.TrackingService])
], TrackingController);
