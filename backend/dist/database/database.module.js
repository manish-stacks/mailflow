"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const entities_1 = require("./entities");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    type: 'mysql',
                    host: config.get('MYSQL_HOST'),
                    port: +config.get('MYSQL_PORT', '3306'),
                    username: config.get('MYSQL_USER'),
                    password: config.get('MYSQL_PASSWORD'),
                    database: config.get('MYSQL_DATABASE'),
                    entities: entities_1.ALL_ENTITIES,
                    synchronize: false, // schema.sql is the source of truth
                    timezone: 'Z',
                    charset: 'utf8mb4',
                    logging: config.get('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
                    extra: { connectionLimit: 20 },
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature(entities_1.ALL_ENTITIES),
        ],
        exports: [typeorm_1.TypeOrmModule],
    })
], DatabaseModule);
