const axios = require('axios');
const crypto = require('crypto');
const { exchangeCaches } = require('./cacheManager');

// MEXC API 配置
const MEXC_API_KEY = process.env.MECX_API_KEY;
const MEXC_API_SECRET = process.env.MECX_API_SECRET;
const MEXC_API_URL = process.env.MECX_API_URL || 'https://api.mexc.com';

/**
 * 生成签名
 * @param {Object} params - 请求参数
 * @returns {string} - 签名
 */
function generateSignature(params) {
  // 1. 将所有参数按字母顺序排序并转换为查询字符串
  const queryString = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');

  // 2. 使用 HMAC SHA256 生成签名
  const signature = crypto
    .createHmac('sha256', MEXC_API_SECRET)
    .update(queryString)
    .digest('hex');

  return signature;
}

/**
 * 发送签名请求
 * @param {string} method - 请求方法
 * @param {string} endpoint - API 端点
 * @param {Object} params - 请求参数
 * @returns {Promise} - API 响应
 */
async function sendSignedRequest(method, endpoint, params = {}, logToFile) {
  try {
    // 添加时间戳
    const timestamp = Date.now();
    const allParams = {
      ...params,
      timestamp
    };

    // 生成签名
    const signature = generateSignature(allParams);

    // 构建请求配置
    const config = {
      method: 'GET',
      url: `${MEXC_API_URL}${endpoint}`,
      headers: {
        'X-MEXC-APIKEY': MEXC_API_KEY
      },
      params: {
        ...allParams,
        signature
      }
    };

    // 记录请求信息
    logToFile('DEBUG', {
      message: 'Sending request',
      method: 'GET',
      url: config.url,
      headers: config.headers,
      params: config.params
    });

    // 发送请求
    const response = await axios(config);

    // 记录响应
    logToFile('DEBUG', {
      message: 'Received response',
      status: response.status,
      data: response.data
    });

    return response.data;
  } catch (error) {
    logToFile('ERROR', {
      message: 'Request failed',
      error: error.message,
      response: error.response?.data,
      request: {
        method: 'GET',
        endpoint,
        params
      }
    });
    throw error;
  }
}

/**
 * 获取所有代币信息
 * @param {Function} logToFile - 日志函数
 * @returns {Promise<Object>} - 代币信息
 */
async function getAllTokens(logToFile) {
  try {
    // 1. 检查缓存
    const cacheKey = 'tokens';
    const cached = exchangeCaches.mexc.get(cacheKey);
    if (cached) {
      logToFile('INFO', 'Using cached token data');
      return {
        tokens: cached.data,
        fromCache: true,
        lastCacheTime: cached.lastCacheTime,
        lastApiTime: cached.lastApiTime
      };
    }

    // 2. 调用 API
    logToFile('INFO', 'Fetching tokens from MEXC');
    const response = await sendSignedRequest(
      'GET',
      '/api/v3/capital/config/getall',
      {},
      logToFile
    );

    // 3. 处理响应数据，只保留可充值的网络
    const tokens = response
      .filter(coin => Array.isArray(coin.networkList) && coin.networkList.length > 0)
      .map(coin => ({
        symbol: coin.coin,
        name: coin.name,
        networks: coin.networkList
          .filter(network => network.depositEnable) // 只保留可充值的网络
          .map(network => ({
            network: network.network,
            depositEnable: network.depositEnable,
            withdrawEnable: network.withdrawEnable,
            depositDesc: network.depositDesc || null,
            withdrawDesc: network.withdrawDesc || null,
            minConfirm: network.minConfirm,
            withdrawFee: network.withdrawFee,
            withdrawMin: network.withdrawMin,
            withdrawMax: network.withdrawMax
          }))
      }))
      .filter(token => token.networks.length > 0); // 只保留至少有一个可充值网络的代币

    // 4. 更新缓存
    exchangeCaches.mexc.set(cacheKey, tokens);
    const lastApiTime = Date.now();

    logToFile('INFO', `Processed ${tokens.length} tokens with deposit-enabled networks`);
    return {
      tokens,
      fromCache: false,
      lastCacheTime: lastApiTime,
      lastApiTime: lastApiTime
    };
  } catch (error) {
    logToFile('ERROR', {
      message: 'Failed to fetch tokens',
      error: error.message
    });
    throw error;
  }
}

/**
 * 获取充值地址
 * @param {string} coin - 代币符号
 * @param {string} network - 网络名称
 * @param {Function} logToFile - 日志函数
 * @returns {Promise<Object>} - 充值地址信息
 */
async function getDepositAddress(coin, network, logToFile) {
  try {
    // 1. 验证代币和网络是否支持
    const { tokens } = await getAllTokens(logToFile);
    const tokenInfo = tokens.find(t => t.symbol.toUpperCase() === coin.toUpperCase());
    
    if (!tokenInfo) {
      throw new Error(`Token ${coin} not found`);
    }

    // 2. 获取充值地址列表
    const params = {
      coin: coin.toUpperCase()
    };

    logToFile('INFO', `Requesting deposit addresses for ${coin}`);
    const addresses = await sendSignedRequest(
      'GET',
      '/api/v3/capital/deposit/address',
      params,
      logToFile
    );

    // 3. 在返回的地址列表中查找匹配的网络
    const addressInfo = addresses.find(addr => addr.network.includes(network));
    if (!addressInfo) {
      const availableNetworks = addresses.map(addr => addr.network).join(', ');
      throw new Error(`Network ${network} not found for ${coin}. Available networks: ${availableNetworks}`);
    }

    return {
      address: addressInfo.address,
      tag: addressInfo.memo || null,
      network: addressInfo.network,
      coin: coin.toUpperCase()
    };
  } catch (error) {
    logToFile('ERROR', {
      message: 'Failed to get deposit address',
      error: error.message,
      coin,
      network
    });
    throw error;
  }
}

module.exports = {
  getAllTokens,
  getDepositAddress
}; 