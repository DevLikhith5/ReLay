export const logger = {
  info: (message: any, ...args: any[]) => {
    console.log(JSON.stringify({ level: 'info', message, ...args }));
  },
  error: (message: any, ...args: any[]) => {
    console.error(JSON.stringify({ level: 'error', message, ...args }));
  },
  warn: (message: any, ...args: any[]) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...args }));
  },
  debug: (message: any, ...args: any[]) => {
    console.debug(JSON.stringify({ level: 'debug', message, ...args }));
  },
};
