"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignsModule = void 0;
const common_1 = require("@nestjs/common");
const analytics_module_1 = require("../analytics/analytics.module");
const apikeys_module_1 = require("../apikeys/apikeys.module");
const segments_module_1 = require("../segments/segments.module");
const senders_module_1 = require("../senders/senders.module");
const suppression_module_1 = require("../suppression/suppression.module");
const campaign_dispatch_service_1 = require("./campaign-dispatch.service");
const campaigns_controller_1 = require("./campaigns.controller");
const campaigns_service_1 = require("./campaigns.service");
let CampaignsModule = class CampaignsModule {
};
exports.CampaignsModule = CampaignsModule;
exports.CampaignsModule = CampaignsModule = __decorate([
    (0, common_1.Module)({
        imports: [segments_module_1.SegmentsModule, senders_module_1.SendersModule, analytics_module_1.AnalyticsModule, suppression_module_1.SuppressionModule, apikeys_module_1.ApiKeysModule],
        controllers: [campaigns_controller_1.CampaignsController],
        providers: [campaigns_service_1.CampaignsService, campaign_dispatch_service_1.CampaignDispatchService],
        exports: [campaigns_service_1.CampaignsService, campaign_dispatch_service_1.CampaignDispatchService],
    })
], CampaignsModule);
