# 🌟 DepositOne - 统一加密货币充值助手

[English](README.md)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue)

## 🚀 什么是 DepositOne？

DepositOne 是一个统一的加密货币充值管理解决方案。让您不再需要在不同的交易所界面之间切换，也不用担心网络兼容性问题！

### ✨ 核心功能

- 🔄 **多交易所支持**
  - 币安 Binance
  - 欧易 OKX
  - 比特币 Bitget
  
- 🎨 **精美的用户界面**
  - 现代简洁的界面设计
  - 自适应各种设备尺寸
  - 明暗主题无缝切换
  - 直观的代币搜索和筛选

- 🛡️ **安全与性能**
  - 无需 API 密钥
  - 本地缓存提升性能
  - 实时网络状态监控

- 🔍 **智能搜索**
  - 即时代币搜索
  - 网络兼容性检查
  - 快速访问热门代币

## 🛠️ 技术栈

- **前端**:
  - React + TypeScript
  - Ant Design 组件库
  - Axios 请求处理
  - 响应式设计

- **后端**:
  - Node.js
  - Express
  - RESTful API 架构
  - 缓存管理

## 🚦 快速开始

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/deposit-one.git
   cd deposit-one
   ```

2. **安装依赖**
   ```bash
   # 安装前端依赖
   cd frontend
   npm install

   # 安装后端依赖
   cd ../backend
   npm install
   ```

3. **配置环境变量**
   ```bash
   # 在后端目录创建 .env 文件，内容如下：
   # 服务器端口配置
   PORT=3001
   
   # 缓存配置（可选）
   CACHE_DURATION=300000  # 缓存时间，单位毫秒
   
   # 交易所 API 配置（如果需要）
   # BINANCE_API_KEY=你的币安API密钥
   # BINANCE_API_SECRET=你的币安API密钥
   # OKX_API_KEY=你的欧易API密钥
   # OKX_API_SECRET=你的欧易API密钥
   # OKX_PASSPHRASE=你的欧易API密码
   # BITGET_API_KEY=你的Bitget API密钥
   # BITGET_API_SECRET=你的Bitget API密钥
   # BITGET_PASSPHRASE=你的Bitget API密码
   ```

4. **启动开发服务器**
   ```bash
   # 启动前端（在 frontend 目录下）
   npm start

   # 启动后端（在 backend 目录下）
   npm run dev
   ```

5. **访问应用**
   - 前端: http://localhost:3000
   - 后端: http://localhost:3001

## 🎯 使用指南

1. **选择交易所**
   - 从顶部导航栏选择您想要使用的交易所
   - 目前支持币安、欧易和 Bitget

2. **搜索代币**
   - 使用搜索栏查找代币
   - 浏览热门代币区域
   - 查看支持的网络

3. **生成充值地址**
   - 选择目标代币
   - 选择网络
   - 复制生成的地址和备注（如需要）
   - 验证网络状态后再充值

## 🎨 主题设置

DepositOne 提供两种精美主题：

- 🌞 **明亮主题**：适合日间使用的清爽专业外观
- 🌙 **暗黑主题**：适合夜间使用的护眼模式

主题会自动适应系统偏好，也可手动切换

## 📱 移动端支持

DepositOne 完全响应式，支持各种设备：
- 📱 智能手机
- 📱 平板电脑
- 💻 笔记本电脑
- 🖥️ 台式显示器

## 🔧 开发说明

项目结构：
```
deposit-one/
├── frontend/              # React TypeScript 前端
│   ├── src/
│   │   ├── App.tsx       # 主应用组件
│   │   └── App.css       # 样式文件
│   └── package.json
│
├── backend/              # Node.js 后端
│   ├── src/
│   │   ├── index.js     # 入口文件
│   │   ├── binance.js   # 币安 API 集成
│   │   ├── okx.js       # 欧易 API 集成
│   │   └── bitget.js    # Bitget API 集成
│   └── package.json
```

## 🐛 已知问题

- 火币集成功能暂时禁用
- 部分网络状态更新可能有延迟
- 移动端布局优化进行中

## 🙋‍♂️ 需要帮助？

- 查看上方项目结构
- 检查配置部分
- 确保所有依赖都已安装

---

用 ❤️ 为加密货币社区打造 