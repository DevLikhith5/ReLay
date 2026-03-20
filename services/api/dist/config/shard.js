"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SHARD_DB_MAP = exports.SHARDS = exports.RING_SIZE = exports.VIRTUAL_NODES = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.VIRTUAL_NODES = parseInt(process.env.VIRTUAL_NODES || "100");
exports.RING_SIZE = parseInt(process.env.RING_SIZE || "36000");
exports.SHARDS = (process.env.SHARDS || "").split(",").map(s => s.trim()).filter(Boolean);
if (exports.SHARDS.length === 0) {
    throw new Error("SHARDS not configured in .env");
}
exports.SHARD_DB_MAP = {};
exports.SHARDS.forEach((shard, index) => {
    const envKey = `SHARD_${index}`;
    const dbUrl = process.env[envKey];
    if (!dbUrl) {
        throw new Error(`Missing DB URL for ${envKey}`);
    }
    exports.SHARD_DB_MAP[shard] = dbUrl;
});
