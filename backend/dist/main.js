"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    // rawBody: true lets Nest capture the raw request buffer (req.rawBody) for every
    // request WITHOUT us manually calling express.json() ourselves. Manually scoping our
    // own express.json() (even to just /api/webhooks) makes Nest think body-parsing is
    // already handled by the app and it silently skips registering its own global JSON
    // parser — which broke req.body on every other route (e.g. /api/auth/register).
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { rawBody: true });
    const config = app.get(config_1.ConfigService);
    app.setGlobalPrefix('api', {
        // Public endpoints hit by mail clients and providers stay outside /api.
        exclude: ['tracking/open/:token', 'tracking/click/:token', 'storage/(.*)'],
    });
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: config.get('corsOrigins'),
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'x-workspace-id'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.set('trust proxy', 1);
    const port = config.get('port');
    await app.listen(port);
    new common_1.Logger('Bootstrap').log(`API listening on http://localhost:${port}/api`);
}
bootstrap();
