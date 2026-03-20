"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    info: (message, ...args) => {
        console.log(JSON.stringify({ level: 'info', message, ...args }));
    },
    error: (message, ...args) => {
        console.error(JSON.stringify({ level: 'error', message, ...args }));
    },
    warn: (message, ...args) => {
        console.warn(JSON.stringify({ level: 'warn', message, ...args }));
    },
    debug: (message, ...args) => {
        console.debug(JSON.stringify({ level: 'debug', message, ...args }));
    },
};
