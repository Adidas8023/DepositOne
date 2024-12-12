# 🌟 DepositOne - Your Universal Crypto Deposit Assistant

[中文文档](README_zh.md)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.x-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue)

## 🚀 What is DepositOne?

DepositOne is your one-stop solution for managing cryptocurrency deposits across multiple exchanges. No more juggling between different exchange interfaces or worrying about network compatibility!

### ✨ Key Features

- 🔄 **Multi-Exchange Support**
  - Binance
  - OKX
  - Bitget
  - Huobi
  - _More coming soon!_

- 🎨 **Beautiful UI/UX**
  - Modern, clean interface
  - Responsive design for all devices
  - Dark/Light theme with smooth transitions
  - Intuitive token search and filtering

- 🛡️ **Security & Performance**
  - No API keys required
  - Local caching for better performance
  - Real-time network status

- 🔍 **Smart Search**
  - Instant token search
  - Network compatibility checking
  - Quick access to preset popular tokens (BTC, ETH, USDT, etc.)

## 🛠️ Tech Stack

- **Frontend**:
  - React with TypeScript
  - Ant Design Components
  - Axios for API requests
  - Responsive design principles

- **Backend**:
  - Node.js
  - Express
  - RESTful API architecture
  - Cache management

## 🚦 Getting Started

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/deposit-one.git
   cd deposit-one
   ```

2. **Install Dependencies**
   ```bash
   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install
   ```

3. **Configure Environment**
   ```bash
   # Create .env file in backend directory with following content:
   # Server port configuration
   PORT=3001
   
   # Cache configuration (optional)
   # Currently only Binance API responses are cached
   CACHE_DURATION=300000  # Binance API cache duration in milliseconds
   
   # Exchange API configuration (if needed)
   # BINANCE_API_KEY=your_binance_api_key
   # BINANCE_API_SECRET=your_binance_api_secret
   # OKX_API_KEY=your_okx_api_key
   # OKX_API_SECRET=your_okx_api_secret
   # OKX_PASSPHRASE=your_okx_passphrase
   # BITGET_API_KEY=your_bitget_api_key
   # BITGET_API_SECRET=your_bitget_api_secret
   # BITGET_PASSPHRASE=your_bitget_passphrase
   ```

4. **Start Development Servers**
   ```bash
   # Start frontend (from frontend directory)
   npm start

   # Start backend (from backend directory)
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## 🎯 Usage

1. **Select Exchange**
   - Choose your preferred exchange from the top navigation
   - Currently supports Binance, OKX, and Bitget

2. **Search for Tokens**
   - Use the search bar to find tokens
   - Browse popular tokens section
   - View supported networks for each token

3. **Generate Deposit Address**
   - Select your desired token
   - Choose the network
   - Copy the generated address and memo (if required)
   - Verify network status before depositing

## 🎨 Themes

DepositOne comes with two beautiful themes:

- 🌞 **Light Theme**: Clean, professional look for daytime use
- 🌙 **Dark Theme**: Easy on the eyes for night owls

Theme automatically adapts to system preferences and can be toggled via the switch in header

## 📱 Mobile Support

DepositOne is fully responsive and works great on:
- 📱 Smartphones
- 📱 Tablets
- 💻 Desktops
- 🖥️ Large Displays

## 🤝 Development

Project Structure:
```
+ deposit-one/
+ ├ frontend/              # React TypeScript frontend
+ │   ├── src/
+ │   │   ├── App.tsx       # Main application component
+ │   │   └── App.css       # Styles
+ │   └── package.json
+ │
+ ├── backend/              # Node.js backend
+ │   ├── src/
+ │   │   ├── index.js     # Entry point
+ │   │   ├── binance.js   # Binance API integration
+ │   │   ├── okx.js       # OKX API integration
+ │   │   └── bitget.js    # Bitget API integration
+ │   ├── logs/            # Application logs
+ │   │   ├── app.log      # General application logs
+ │   │   ├── bitget.log   # Bitget specific logs
+ │   │   └── okx.log      # OKX specific logs
+ │   └── package.json
+ ```

## 🐛 Known Issues

- Huobi integration is currently disabled
- Some networks may show delayed status updates
- Mobile layout optimization in progress
- API errors are logged in backend/logs/app.log
- Exchange-specific errors are logged in their respective log files

## 🙋‍♂️ Need Help?

- Check the project structure above
- Review the configuration section
- Ensure all dependencies are installed

---

Made with ❤️ for the Crypto Community
