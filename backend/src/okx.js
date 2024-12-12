const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// OKX API 配置
const OKX_API_KEY = process.env.OKX_API_KEY;
const OKX_API_SECRET = process.env.OKX_API_SECRET;
const OKX_PASSPHRASE = process.env.OKX_PASSPHRASE;
const OKX_API_URL = 'https://www.okx.com';

// 创建日志目录和文件
const logDir = path.join(__dirname, '../logs');
const logFile = path.join(logDir, 'okx.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// OKX 专用日志函数
const logToOKXFile = (type, message) => {
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

// 生成 OKX API 签名
const generateOKXSignature = (timestamp, method, requestPath, body = '') => {
  const message = timestamp + method + requestPath + body;
  return crypto
    .createHmac('sha256', OKX_API_SECRET)
    .update(message)
    .digest('base64');
};

// 获取所有代币信息
async function getAllTokens() {
  try {
    logToOKXFile('INFO', 'Fetching OKX tokens...');
    
    const timestamp = new Date().toISOString();
    const method = 'GET';
    const requestPath = '/api/v5/asset/currencies';
    const signature = generateOKXSignature(timestamp, method, requestPath);
    
    const response = await axios({
      method,
      url: `${OKX_API_URL}${requestPath}`,
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE
      }
    });

    if (!response.data || !response.data.data) {
      throw new Error('Invalid API response format');
    }

    const coinInfo = response.data.data;
    
    logToOKXFile('API_RESPONSE', {
      status: 'success',
      data: limitLogData(coinInfo)
    });

    // 按币种分组
    const groupedCoins = coinInfo.reduce((acc, coin) => {
      if (!acc[coin.ccy]) {
        acc[coin.ccy] = {
          symbol: coin.ccy,
          name: coin.name,
          networks: []
        };
      }
      
      // 只添加可充值的网络
      if (coin.canDep) {
        acc[coin.ccy].networks.push({
          network: coin.chain,
          isDefault: false, // OKX 不提供默认网络信息
          depositDesc: '',
          minConfirm: parseInt(coin.minDepArrivalConfirm) || 0,
          depositEnable: coin.canDep
        });
      }
      
      return acc;
    }, {});

    // 转换为数组格式
    const tokens = Object.values(groupedCoins)
      .filter(token => token.networks.length > 0);

    logToOKXFile('INFO', `Processed ${tokens.length} tokens`);
    logToOKXFile('DEBUG', {
      message: 'First tokens example',
      data: limitLogData(tokens)
    });

    return tokens;
  } catch (error) {
    logToOKXFile('ERROR', {
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
    const timestamp = new Date().toISOString();
    const method = 'GET';
    const requestPath = `/api/v5/asset/deposit-address?ccy=${coin}`;
    const signature = generateOKXSignature(timestamp, method, requestPath);

    logToOKXFile('INFO', `Fetching deposit address for ${coin} on ${network}`);

    const response = await axios({
      method,
      url: `${OKX_API_URL}${requestPath}`,
      headers: {
        'OK-ACCESS-KEY': OKX_API_KEY,
        'OK-ACCESS-SIGN': signature,
        'OK-ACCESS-TIMESTAMP': timestamp,
        'OK-ACCESS-PASSPHRASE': OKX_PASSPHRASE
      }
    });

    const addressInfo = response.data.data.find(addr => addr.chain.includes(network));
    
    logToOKXFile('API_RESPONSE', {
      coin,
      network,
      addressInfo: limitLogData(response.data.data)
    });

    if (!addressInfo) {
      throw new Error('Deposit address not found');
    }

    return {
      address: addressInfo.addr,
      tag: addressInfo.memo || null,
      network: addressInfo.chain,
      coin: addressInfo.ccy,
      needTag: Boolean(addressInfo.memo)
    };
  } catch (error) {
    logToOKXFile('ERROR', {
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