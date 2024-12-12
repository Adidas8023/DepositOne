const axios = require('axios');
const crypto = require('crypto');

// 币安 API 配置
const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET;
const BINANCE_API_URL = 'https://api.binance.com';

// 生成签名
const generateSignature = (queryString) => {
  return crypto
    .createHmac('sha256', BINANCE_API_SECRET)
    .update(queryString)
    .digest('hex');
};

// 存储代币信息的缓存
let tokenCache = null;
let lastCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 处理日志数据，限制数组长度
const limitLogData = (data, limit = 5) => {
  if (Array.isArray(data)) {
    return {
      total_length: data.length,
      first_items: data.slice(0, limit),
      message: `Showing first ${limit} items of ${data.length} total items`
    };
  }
  return data;
};

// 获取所有代币信息
async function getAllTokens(logToFile) {
  try {
    logToFile('INFO', 'Fetching tokens...');
    
    // 检查缓存是否有效
    if (tokenCache && lastCacheTime && (Date.now() - lastCacheTime < CACHE_DURATION)) {
      logToFile('INFO', 'Returning cached tokens');
      return {
        tokens: tokenCache,
        fromCache: true,
        lastCacheTime
      };
    }

    logToFile('INFO', 'Calling Binance API...');
    
    // 准备请求参数
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&recvWindow=60000`;
    const signature = generateSignature(queryString);
    
    // 获取所有币种信息
    const response = await axios({
      method: 'GET',
      url: `${BINANCE_API_URL}/sapi/v1/capital/config/getall`,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      },
      params: {
        timestamp,
        signature,
        recvWindow: 60000
      }
    });

    const coinInfo = response.data;
    
    // 记录限制后的API响应数据
    logToFile('API_RESPONSE', {
      status: 'success',
      data: limitLogData(coinInfo)
    });
    
    if (!coinInfo || !Array.isArray(coinInfo)) {
      throw new Error(`Invalid API response: ${JSON.stringify(coinInfo)}`);
    }

    const tokens = coinInfo
      .filter(coin => !coin.isLegalMoney)
      .map(coin => ({
        symbol: coin.coin,
        name: coin.name,
        networks: (coin.networkList || [])
          .filter(network => network.depositEnable)
          .map(network => ({
            network: network.network,
            isDefault: network.isDefault,
            depositDesc: network.depositDesc,
            minConfirm: network.minConfirm,
            depositEnable: network.depositEnable
          }))
      }))
      .filter(token => token.networks.length > 0);

    logToFile('INFO', `Processed ${tokens.length} tokens`);
    // 记录限制后的处理结果示例
    logToFile('DEBUG', {
      message: 'First tokens example',
      data: limitLogData(tokens)
    });

    // 更新缓存
    tokenCache = tokens;
    lastCacheTime = Date.now();

    return {
      tokens,
      fromCache: false,
      lastCacheTime
    };
  } catch (error) {
    throw error;
  }
}

// 获取充值地址
async function getDepositAddress(coin, network, logToFile) {
  try {
    // 处理币种和网络格式
    const formattedCoin = coin.toUpperCase();
    const formattedNetwork = network.toUpperCase();
    
    // 准备请求参数
    const timestamp = Date.now();
    const queryString = `coin=${formattedCoin}&network=${formattedNetwork}&timestamp=${timestamp}&recvWindow=60000`;
    const signature = generateSignature(queryString);
    
    // 获取充值地址
    const response = await axios({
      method: 'GET',
      url: `${BINANCE_API_URL}/sapi/v1/capital/deposit/address`,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      },
      params: {
        coin: formattedCoin,
        network: formattedNetwork,
        timestamp,
        signature,
        recvWindow: 60000
      }
    });

    const depositAddress = response.data;
    
    logToFile('API_RESPONSE', depositAddress);
    
    if (!depositAddress || !depositAddress.address) {
      throw new Error('Deposit address not found');
    }

    return {
      address: depositAddress.address,
      tag: depositAddress.tag || null,
      network: depositAddress.network,
      coin: depositAddress.coin
    };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllTokens,
  getDepositAddress
}; 