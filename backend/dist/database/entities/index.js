"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_ENTITIES = void 0;
__exportStar(require("./base.entity"), exports);
__exportStar(require("./user.entity"), exports);
__exportStar(require("./workspace.entity"), exports);
__exportStar(require("./contact.entity"), exports);
__exportStar(require("./sender.entity"), exports);
__exportStar(require("./campaign.entity"), exports);
__exportStar(require("./misc.entity"), exports);
__exportStar(require("./billing.entity"), exports);
__exportStar(require("./payment.entity"), exports);
const user_entity_1 = require("./user.entity");
const workspace_entity_1 = require("./workspace.entity");
const contact_entity_1 = require("./contact.entity");
const sender_entity_1 = require("./sender.entity");
const campaign_entity_1 = require("./campaign.entity");
const misc_entity_1 = require("./misc.entity");
const billing_entity_1 = require("./billing.entity");
const payment_entity_1 = require("./payment.entity");
exports.ALL_ENTITIES = [
    user_entity_1.User, user_entity_1.RefreshToken, workspace_entity_1.Workspace, workspace_entity_1.WorkspaceMember,
    contact_entity_1.Contact, contact_entity_1.ContactList, contact_entity_1.ContactListMember, contact_entity_1.Segment,
    sender_entity_1.SenderIdentity, sender_entity_1.SenderDomain,
    campaign_entity_1.EmailTemplate, campaign_entity_1.Campaign, campaign_entity_1.CampaignRecipient, campaign_entity_1.CampaignEvent, campaign_entity_1.TrackedLink,
    misc_entity_1.Unsubscribe, misc_entity_1.Suppression, misc_entity_1.UploadedFile, misc_entity_1.ImportJob, misc_entity_1.ApiKey, misc_entity_1.AuditLog, misc_entity_1.AiUsage,
    billing_entity_1.Plan, billing_entity_1.Subscription, billing_entity_1.UsagePeriod, billing_entity_1.EmailConnection, payment_entity_1.Payment,
];
