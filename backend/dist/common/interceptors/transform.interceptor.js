"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
/** Uniform envelope: { success, data, meta } — skipped for raw responses (tracking pixels, redirects). */
let TransformInterceptor = class TransformInterceptor {
    intercept(ctx, next) {
        return next.handle().pipe((0, rxjs_1.map)((body) => {
            if (body && typeof body === 'object' && '__raw' in body)
                return body.__raw;
            if (body && typeof body === 'object' && 'data' in body && 'meta' in body) {
                return { success: true, ...body };
            }
            return { success: true, data: body ?? null };
        }));
    }
};
exports.TransformInterceptor = TransformInterceptor;
exports.TransformInterceptor = TransformInterceptor = __decorate([
    (0, common_1.Injectable)()
], TransformInterceptor);
