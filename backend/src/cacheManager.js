const CACHE_DURATION = 30 * 60 * 1000; // 30分钟缓存

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.lastApiFetchTime = null; // 添加最后一次 API 获取时间追踪
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    this.lastApiFetchTime = Date.now(); // 记录 API 获取时间
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > CACHE_DURATION;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: cached.data,
      fromCache: true,
      lastCacheTime: cached.timestamp,
      lastApiTime: this.lastApiFetchTime // 返回最后一次 API 获取时间
    };
  }

  getLastApiTime() {
    return this.lastApiFetchTime;
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
    this.lastApiFetchTime = null;
  }
}

// 为每个交易所创建一个缓存实例
const exchangeCaches = {
  binance: new CacheManager(),
  okx: new CacheManager(),
  bitget: new CacheManager(),
  mexc: new CacheManager()
};

module.exports = {
  exchangeCaches,
  CACHE_DURATION
}; 