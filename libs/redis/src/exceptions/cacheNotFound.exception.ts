export class CacheNotFoundException extends Error {
  constructor(key: string) {
    super(`Cache not found: ${key}`);
    this.name = 'CacheNotFoundException';
  }
}
