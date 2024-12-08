const config = {
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://test-ivory-phi.vercel.app/api'  // 后端 API 的 Vercel URL
    : 'http://localhost:3001/api' // 在开发环境中使用本地地址
};

export default config;
