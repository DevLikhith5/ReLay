

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';


import { randomBytes } from 'crypto';

function generateUniqueId(): bigint {

  const bytes = randomBytes(6);
  return BigInt('0x' + bytes.toString('hex'));
}


function toBase62(num: bigint): string {
  if (num === 0n) return BASE62[0];
  let result = '';
  while (num > 0n) {
    result = BASE62[Number(num % 62n)] + result;
    num = num / 62n;
  }
  return result;
}


function generateCode(): string {
  const id   = generateUniqueId();
  const code = toBase62(id);

  return code.padStart(7, '0').slice(0, 7);
}

export { generateCode };

