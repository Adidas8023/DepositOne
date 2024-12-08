const config = {
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://test-eta-ecru-16.vercel.app/api'  // 使用完整的生产环境 URL
    : 'http://localhost:3001/api' // 在开发环境中使用本地地址
};

export default config;
