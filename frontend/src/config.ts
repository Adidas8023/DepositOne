const config = {
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? '/api'  // 在生产环境中使用相对路径
    : 'http://localhost:3001/api' // 在开发环境中使用本地地址
};

export default config;
