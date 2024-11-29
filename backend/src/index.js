require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// 创建日志目录
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 日志函数
const logToFile = (type, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${type}] ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
  fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
};

const app = express();
const PORT = process.env.PORT || 3001;

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

// 配置中间件
app.use(cors());
app.use(express.json());

// 记录所有请求
app.use((req, res, next) => {
  logToFile('REQUEST', `${req.method} ${req.url}`);
  next();
});

// 存储代币信息的缓存
let tokenCache = null;
let lastCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 获取所有代币信息
app.get('/api/tokens', async (req, res) => {
  try {
    logToFile('INFO', 'Fetching tokens...');
    
    // 检查缓存是否有效
    if (tokenCache && lastCacheTime && (Date.now() - lastCacheTime < CACHE_DURATION)) {
      logToFile('INFO', 'Returning cached tokens');
      return res.json(tokenCache);
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
    
    logToFile('API_RESPONSE', {
      status: 'success',
      data: coinInfo
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
    logToFile('DEBUG', 'First token example:', tokens[0]);

    // 更新缓存
    tokenCache = tokens;
    lastCacheTime = Date.now();

    res.json(tokens);
  } catch (error) {
    logToFile('ERROR', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    console.error('Error fetching tokens:', error);
    res.status(500).json({ 
      error: 'Failed to fetch tokens',
      details: error.message,
      type: error.name,
      apiError: error.response ? error.response.data : null
    });
  }
});

// 获取充值地址
app.get('/api/deposit-address/:coin/:network', async (req, res) => {
  try {
    const { coin, network } = req.params;
    
    // 准备请求参数
    const timestamp = Date.now();
    const queryString = `coin=${coin}&network=${network}&timestamp=${timestamp}&recvWindow=60000`;
    const signature = generateSignature(queryString);
    
    // 获取充值地址
    const response = await axios({
      method: 'GET',
      url: `${BINANCE_API_URL}/sapi/v1/capital/deposit/address`,
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      },
      params: {
        coin,
        network,
        timestamp,
        signature,
        recvWindow: 60000
      }
    });

    const depositAddress = response.data;
    
    logToFile('API_RESPONSE', depositAddress);
    
    if (!depositAddress || !depositAddress.address) {
      return res.status(404).json({ error: 'Deposit address not found' });
    }

    res.json({
      address: depositAddress.address,
      tag: depositAddress.tag,
      network: depositAddress.network,
      coin: depositAddress.coin
    });
  } catch (error) {
    logToFile('ERROR', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    });
    console.error('Error fetching deposit address:', error);
    res.status(500).json({ 
      error: 'Failed to fetch deposit address',
      details: error.message,
      type: error.name,
      apiError: error.response ? error.response.data : null
    });
  }
});

app.listen(PORT, () => {
  logToFile('INFO', `Server is running on port ${PORT}`);
  console.log(`Server is running on port ${PORT}`);
});
