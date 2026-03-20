
export function getTTL(expiresIn: '1h' | '24h' | '7d' | '30d'): Date {
  const now = Date.now();
  const map = {
    '1h':  1  * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d':  7  * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
  };
  return new Date(now + map[expiresIn]);
}