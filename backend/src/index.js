require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const binanceAPI = require('./binance');
const okxAPI = require('./okx');
const bitgetAPI = require('./bitget');
const mecxAPI = require('./mecx');
const { exchangeCaches } = require('./cacheManager');

// 创建日志目录并清空日志文件
const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// 清空日志文件
fs.writeFileSync(path.join(logDir, 'app.log'), '');
fs.writeFileSync(path.join(logDir, 'bitget.log'), '');
fs.writeFileSync(path.join(logDir, 'okx.log'), '');
fs.writeFileSync(path.join(logDir, 'mecx.log'), '');

// 日志函数
const logToFile = (type, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${type}] ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
  fs.appendFileSync(path.join(logDir, 'app.log'), logMessage);
};

// 为每个交易所创建特定的日志函数
const logToBitget = (type, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${type}] ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
  fs.appendFileSync(path.join(logDir, 'bitget.log'), logMessage);
};

const logToOkx = (type, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${type}] ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
  fs.appendFileSync(path.join(logDir, 'okx.log'), logMessage);
};

const logToMexc = (type, message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} [${type}] ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
  fs.appendFileSync(path.join(logDir, 'mecx.log'), logMessage);
};

const app = express();
const PORT = process.env.PORT || 3001;

// 配置中间件
app.use(cors());
app.use(express.json());

// 记录所有请求
app.use((req, res, next) => {
  logToFile('REQUEST', `${req.method} ${req.url}`);
  next();
});

// 获取所有交易所的代币信息
app.get('/api/tokens/:exchange', async (req, res) => {
  try {
    const { exchange } = req.params;
    const { forceRefresh } = req.query;
    let result;

    // 如果是强制刷新，先清除缓存
    if (forceRefresh === 'true') {
      const cacheKey = 'tokens';
      switch (exchange.toLowerCase()) {
        case 'binance':
          exchangeCaches.binance.invalidate(cacheKey);
          break;
        case 'okx':
          exchangeCaches.okx.invalidate(cacheKey);
          break;
        case 'bitget':
          exchangeCaches.bitget.invalidate(cacheKey);
          break;
        case 'mecx':
          exchangeCaches.mexc.invalidate(cacheKey);
          break;
      }
    }

    switch (exchange.toLowerCase()) {
      case 'binance':
        result = await binanceAPI.getAllTokens(logToFile);
        break;
      case 'okx':
        result = await okxAPI.getAllTokens(logToOkx);
        break;
      case 'bitget':
        result = await bitgetAPI.getAllTokens(logToBitget);
        break;
      case 'mecx':
        result = await mecxAPI.getAllTokens(logToMexc);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported exchange' });
    }

    // 统一返回格式
    res.json({
      tokens: result.tokens,
      fetchTime: result.fromCache ? 
        new Date(result.lastCacheTime).toISOString() : // 如果是缓存数据，返回缓存时间
        new Date(result.lastApiTime || Date.now()).toISOString(), // 如果是新数据，返回API获取时间
      fromCache: result.fromCache || false,
      lastApiTime: result.lastApiTime ? new Date(result.lastApiTime).toISOString() : null // 添加最后一次API获取时间
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
app.get('/api/deposit-address/:exchange/:coin/:network', async (req, res) => {
  try {
    const { exchange, coin, network } = req.params;
    let depositAddress;

    switch (exchange.toLowerCase()) {
      case 'binance':
        depositAddress = await binanceAPI.getDepositAddress(coin, network, logToFile);
        break;
      case 'okx':
        depositAddress = await okxAPI.getDepositAddress(coin, network, logToOkx);
        break;
      case 'bitget':
        depositAddress = await bitgetAPI.getDepositAddress(coin, network, logToBitget);
        break;
      case 'mecx':
        depositAddress = await mecxAPI.getDepositAddress(coin, network, logToMexc);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported exchange' });
    }

    res.json(depositAddress);
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
