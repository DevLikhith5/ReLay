"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCode = generateCode;
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const crypto_1 = require("crypto");
function generateUniqueId() {
    const bytes = (0, crypto_1.randomBytes)(6);
    return BigInt('0x' + bytes.toString('hex'));
}
function toBase62(num) {
    if (num === 0n)
        return BASE62[0];
    let result = '';
    while (num > 0n) {
        result = BASE62[Number(num % 62n)] + result;
        num = num / 62n;
    }
    return result;
}
function generateCode() {
    const id = generateUniqueId();
    const code = toBase62(id);
    return code.padStart(7, '0').slice(0, 7);
}
