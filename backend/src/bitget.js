const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Bitget API 配置
const BITGET_API_KEY = process.env.BITGET_API_KEY;
const BITGET_API_SECRET = process.env.BITGET_API_SECRET;
const BITGET_PASSPHRASE = process.env.BITGET_PASSPHRASE;
const BITGET_API_URL = 'https://api.bitget.com';

// 创建日志目录和文件
const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'bitget.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Bitget 专用日志函数
const logToBitgetFile = (type, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${type}] ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
  fs.appendFileSync(logFile, logMessage);
};

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

// 生成 Bitget API 签名
const generateBitgetSignature = (timestamp, method, requestPath, body = '') => {
  const message = timestamp + method + requestPath + body;
  return crypto
    .createHmac('sha256', BITGET_API_SECRET)
    .update(message)
    .digest('base64');
};

// 获取所有代币信息
async function getAllTokens() {
  try {
    logToBitgetFile('INFO', 'Fetching Bitget tokens...');
    
    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = '/api/spot/v1/public/currencies';
    const signature = generateBitgetSignature(timestamp, method, requestPath);
    
    const response = await axios({
      method,
      url: `${BITGET_API_URL}${requestPath}`,
      headers: {
        'ACCESS-KEY': BITGET_API_KEY,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': BITGET_PASSPHRASE,
        'Content-Type': 'application/json'
      }
    });

    const coinInfo = response.data.data;
    
    logToBitgetFile('API_RESPONSE', {
      status: 'success',
      data: limitLogData(coinInfo)
    });

    const tokens = coinInfo
      .filter(coin => coin.chains && coin.chains.length > 0)
      .map(coin => ({
        symbol: coin.coinName,
        name: coin.coinDisplayName || coin.coinName,
        networks: coin.chains
          .filter(chain => chain.rechargeable === 'true')
          .map(chain => ({
            network: chain.chain,
            isDefault: false,
            depositDesc: '',
            minConfirm: parseInt(chain.depositConfirm) || 0,
            depositEnable: chain.rechargeable === 'true',
            needTag: chain.needTag === 'true'
          }))
      }))
      .filter(token => token.networks.length > 0);

    logToBitgetFile('INFO', `Processed ${tokens.length} tokens`);
    logToBitgetFile('DEBUG', {
      message: 'First tokens example',
      data: limitLogData(tokens)
    });

    return tokens;
  } catch (error) {
    logToBitgetFile('ERROR', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw error;
  }
}

// 获取充值地址
async function getDepositAddress(coin, network) {
  try {
    // 确保网络参数不为空
    if (!network) {
      throw new Error('Network parameter is required');
    }

    const timestamp = Date.now().toString();
    const method = 'GET';
    const requestPath = `/api/spot/v1/wallet/deposit-address?coin=${coin}&chain=${network}`;
    const signature = generateBitgetSignature(timestamp, method, requestPath);

    logToBitgetFile('INFO', `Fetching deposit address for ${coin} on ${network}`);

    const response = await axios({
      method,
      url: `${BITGET_API_URL}${requestPath}`,
      headers: {
        'ACCESS-KEY': BITGET_API_KEY,
        'ACCESS-SIGN': signature,
        'ACCESS-TIMESTAMP': timestamp,
        'ACCESS-PASSPHRASE': BITGET_PASSPHRASE,
        'Content-Type': 'application/json'
      }
    });

    const addressInfo = response.data.data;
    
    logToBitgetFile('API_RESPONSE', {
      coin,
      network,
      addressInfo
    });

    if (!addressInfo || !addressInfo.address) {
      throw new Error('Deposit address not found');
    }

    return {
      address: addressInfo.address,
      tag: addressInfo.tag || null,
      network: addressInfo.chain,
      coin: addressInfo.coin,
      needTag: Boolean(addressInfo.tag)
    };
  } catch (error) {
    logToBitgetFile('ERROR', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    throw error;
  }
}

module.exports = {
  getAllTokens,
  getDepositAddress
}; 