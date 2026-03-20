// utils/generateCode.ts

import { redis }  from '../config/redis';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CODE_LENGTH = 7;

function toBase62(num: bigint): string {
  if (num === 0n) return BASE62[0];
  let result = '';
  while (num > 0n) {
    result = BASE62[Number(num % 62n)] + result;
    num    = num / 62n;
  }
  // Pad to CODE_LENGTH
  return result.padStart(CODE_LENGTH, '0');
}

export async function generateCode(): Promise<string> {
  // INCR is atomic — even 1000 concurrent requests
  // each get a unique number. Zero collisions possible.
  const counter = await redis.incr('relay:url:counter');
  return toBase62(BigInt(counter));
}