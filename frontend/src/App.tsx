import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Layout, 
  Input, 
  Card, 
  Button, 
  Modal, 
  message, 
  Typography, 
  Space, 
  Tag, 
  ConfigProvider,
  theme,
  Row,
  Col,
  Alert,
  Tabs,
  Switch,
  Divider
} from 'antd';
import { 
  ReloadOutlined, 
  CopyOutlined, 
  FireOutlined,
  WalletOutlined,
  SunOutlined,
  MoonOutlined,
  LockOutlined
} from '@ant-design/icons';
import axios from 'axios';
import debounce from 'lodash.debounce'; // 引入 debounce 函数
import './App.css';

// 导入交易所 Logo
import BinanceLogo from './components/icons/BinanceLogo';
import OKXLogo from './components/icons/OKXLogo';
import BitgetLogo from './components/icons/BitgetLogo';
import HTXLogo from './components/icons/HTXLogo';
import KrakenLogo from './components/icons/KrakenLogo';
import KucoinLogo from './components/icons/KucoinLogo';
import CoinbaseLogo from './components/icons/CoinbaseLogo';
import GateioLogo from './components/icons/GateioLogo';
import MEXCLogo from './components/icons/MEXCLogo';

const { Header, Content } = Layout;
const { Text, Title } = Typography;

interface Network {
  network: string;
  address?: string;
  tag?: string;
  isDefault?: boolean;
  depositDesc: string;
  minConfirm: number;
  depositEnable: boolean;
  needTag?: boolean;
}

interface Token {
  symbol: string;
  name: string;
  networks: Network[];
}

interface ApiResponse {
  tokens: Token[];
  fetchTime: string;
  fromCache: boolean;
}

const App: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [depositAddress, setDepositAddress] = useState('');
  const [depositTag, setDepositTag] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [searchText, setSearchText] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('Binance');
  const [lastFetchTime, setLastFetchTime] = useState<string>('');
  const [isFromCache, setIsFromCache] = useState(false);
  
  // 添加前端数据缓存
  const [tokenCache, setTokenCache] = useState<Record<string, {
    tokens: Token[];
    fetchTime: string;
    fromCache: boolean;
    timestamp: number;
  }>>({});

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // 使用 useMemo 创建 axios 实例
  const api = useMemo(() => axios.create({
    baseURL: 'http://localhost:3001/api'
  }), []); // 空依赖数组，因为 baseURL 是常量

  // 获取代币列表
  const fetchTokens = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // 检查前端缓存
      const now = Date.now();
      const cachedData = tokenCache[selectedExchange.toLowerCase()];
      if (!forceRefresh && cachedData && (now - cachedData.timestamp) < 30000) { // 30秒前端缓存
        setTokens(cachedData.tokens);
        setLastFetchTime(cachedData.fetchTime);
        setIsFromCache(true);
        setLoading(false);
        return;
      }

      const response = await api.get(`/tokens/${selectedExchange.toLowerCase()}`, {
        params: { forceRefresh }
      });
      const data: ApiResponse = response.data;
      const sortedTokens = data.tokens.sort((a: Token, b: Token) => 
        a.symbol.localeCompare(b.symbol)
      );
      
      // 更新前端缓存
      setTokenCache(prev => ({
        ...prev,
        [selectedExchange.toLowerCase()]: {
          tokens: sortedTokens,
          fetchTime: data.fetchTime,
          fromCache: data.fromCache,
          timestamp: now
        }
      }));

      setTokens(sortedTokens);
      setLastFetchTime(data.fetchTime);
      setIsFromCache(data.fromCache);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      message.error('Failed to fetch tokens');
    } finally {
      setLoading(false);
    }
  }, [selectedExchange, api, tokenCache]);

  // 修改交易所切换处理
  const handleExchangeChange = useCallback((exchange: string) => {
    setSelectedExchange(exchange);
    setSearchText('');
    // 如果有缓存数据，立即显示
    const cachedData = tokenCache[exchange.toLowerCase()];
    if (cachedData) {
      setTokens(cachedData.tokens);
      setLastFetchTime(cachedData.fetchTime);
      setIsFromCache(true);
    }
    // 然后在后台更新数据
    fetchTokens(false);
  }, [fetchTokens, tokenCache]);

  // 刷新按钮点击处理
  const handleRefresh = useCallback(() => {
    setSearchText(''); // 清空搜索内容
    fetchTokens(true); // 强制刷新数据
  }, [fetchTokens]);

  // 初始加载和API配置更新时获取数据
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  // 热门代币列表（这里是示例，实际应该从后端获取）
  const popularTokens = [
    'BTC', 'ETH', 'USDT', 'BNB', 'XRP', 
    'SOL', 'DOGE', 'MATIC', 'DOT', 'SHIB'
  ];

  const getPopularTokens = () => {
    return tokens.filter(token => popularTokens.includes(token.symbol));
  };

  // 过滤代币列表
  const filteredTokens = useMemo(() => {
    if (!searchText) return tokens;
    const searchLower = searchText.toLowerCase().trim();
    
    // 如果搜索词完全匹配 symbol，优先显示
    const exactSymbolMatches = tokens.filter(token => 
      token.symbol.toLowerCase() === searchLower
    );

    // 果搜索词是 symbol 的开头，次优先显示
    const startWithSymbolMatches = tokens.filter(token => 
      token.symbol.toLowerCase().startsWith(searchLower) &&
      !exactSymbolMatches.includes(token)
    );

    // 其他包含搜索词的结果
    const otherMatches = tokens.filter(token => {
      const symbolMatch = token.symbol.toLowerCase().includes(searchLower);
      const nameMatch = token.name.toLowerCase().includes(searchLower);
      return (symbolMatch || nameMatch) && 
             !exactSymbolMatches.includes(token) && 
             !startWithSymbolMatches.includes(token);
    });

    return [...exactSymbolMatches, ...startWithSymbolMatches, ...otherMatches];
  }, [tokens, searchText]);

  // 搜索框变化处理
  const handleSearch = useCallback((value: string) => {
    setSearchText(value);
  }, []);

  // 防抖处理搜索
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      handleSearch(value);
    }, 300),
    [handleSearch]
  );

  // 搜索框变化处理
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value); // 立即更新输入框的值
    debouncedSearch(value); // 防抖处理实际索
  }, [debouncedSearch]);

  // 取充值地址
  const getDepositAddress = async (coin: string, network: string) => {
    try {
      const response = await api.get(`/deposit-address/${selectedExchange.toLowerCase()}/${coin}/${network}`);
      return response.data;
    } catch (error) {
      console.error('Error getting deposit address:', error);
      message.error('Failed to get deposit address');
      return null;
    }
  };

  // 处理代币选择
  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    setModalVisible(true);
    setSelectedNetwork('');
    setDepositAddress('');
    setDepositTag('');
  };

  // 处理网络选择
  const handleNetworkSelect = async (network: string) => {
    if (!selectedToken || !network) {
      message.error('Please select a valid network');
      return;
    }

    setSelectedNetwork(network);
    setDepositAddress('');
    setDepositTag('');

    try {
      const result = await getDepositAddress(selectedToken.symbol, network);
      if (result) {
        setDepositAddress(result.address);
        setDepositTag(result.tag || '');
      }
    } catch (error) {
      console.error('Error getting deposit address:', error);
      message.error('Failed to get deposit address. Please try again.');
    }
  };

  // 复制地址
  const copyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    message.success('Address copied to clipboard');
  };

  // 复制 Tag
  const copyTag = () => {
    navigator.clipboard.writeText(depositTag);
    message.success('Memo/Tag copied to clipboard');
  };

  // 添加记忆化的 TokenCard 组件
  const MemoizedTokenCard = React.memo(({ token, isDarkMode, onSelect }: {
    token: Token;
    isDarkMode: boolean;
    onSelect: (token: Token) => void;
  }) => (
    <Card
      hoverable
      style={{
        height: '100%',
        background: isDarkMode ? '#141414' : undefined,
        border: isDarkMode ? '1px solid #303030' : undefined,
        transition: 'all 0.3s ease'
      }}
      onClick={() => onSelect(token)}
      className={`token-card ${isDarkMode ? 'dark-mode' : ''}`}
    >
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '8px'
      }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <Text strong style={{ 
            fontSize: '16px',
            margin: 0,
            color: isDarkMode ? '#fff' : '#000'
          }}>
            {token.symbol}
          </Text>
          <Text style={{ 
            fontSize: '14px',
            color: isDarkMode ? '#888' : '#666',
            display: 'block'
          }}>
            {token.name}
          </Text>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginTop: 'auto'
        }}>
          {token.networks
            .sort((a, b) => {
              if (a.isDefault && !b.isDefault) return -1;
              if (!a.isDefault && b.isDefault) return 1;
              return 0;
            })
            .slice(0, 4)
            .map((network) => (
              <Tag 
                key={network.network}
                color="default"
                className="network-tag"
              >
                <span className="network-tag-text">
                  {network.network}
                </span>
              </Tag>
            ))}
          {token.networks.length > 4 && (
            <Tag 
              className="network-tag"
              style={{ 
                backgroundColor: isDarkMode ? '#303030' : '#f0f0f0',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'
              }}
            >
              <span className="network-tag-text">
                +{token.networks.length - 4}
              </span>
            </Tag>
          )}
        </div>
      </div>
    </Card>
  ));

  // 添加延迟加载的列表组件
  const TokenList = React.memo(({ tokens, isDarkMode, onSelect }: {
    tokens: Token[];
    isDarkMode: boolean;
    onSelect: (token: Token) => void;
  }) => {
    const [visibleTokens, setVisibleTokens] = useState<Token[]>([]);
    
    useEffect(() => {
      // 先显示前20个代币
      setVisibleTokens(tokens.slice(0, 20));
      
      // 延迟加载剩余代币
      if (tokens.length > 20) {
        const timer = setTimeout(() => {
          setVisibleTokens(tokens);
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [tokens]);

    return (
      <Row gutter={[16, 16]}>
        {visibleTokens.map((token) => (
          <Col xs={24} sm={12} md={8} lg={6} xl={3} key={token.symbol}>
            <MemoizedTokenCard
              token={token}
              isDarkMode={isDarkMode}
              onSelect={onSelect}
            />
          </Col>
        ))}
      </Row>
    );
  });

  // 创建交易所 Tab 项
  const exchangeTabs = [
    {
      key: 'Binance',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BinanceLogo style={{ width: '20px', height: '20px' }} />
          <span>Binance</span>
        </div>
      )
    },
    {
      key: 'OKX',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <OKXLogo style={{ width: '20px', height: '20px' }} isDarkMode={isDarkMode} />
          <span>OKX</span>
        </div>
      )
    },
    {
      key: 'Bitget',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BitgetLogo style={{ width: '20px', height: '20px' }} />
          <span>Bitget</span>
        </div>
      )
    },
    {
      key: 'Mecx',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MEXCLogo style={{ width: '20px', height: '20px' }} />
          <span>MEXC</span>
        </div>
      )
    },
    {
      key: 'HTX',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
          <HTXLogo style={{ width: '14px', height: '20px' }} />
          <span>HTX</span>
          <LockOutlined style={{ fontSize: '14px', marginLeft: '4px' }} />
        </div>
      ),
      disabled: true
    },
    {
      key: 'Kraken',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
          <KrakenLogo style={{ width: '20px', height: '20px' }} />
          <span>Kraken</span>
          <LockOutlined style={{ fontSize: '14px', marginLeft: '4px' }} />
        </div>
      ),
      disabled: true
    },
    {
      key: 'Kucoin',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
          <KucoinLogo style={{ width: '20px', height: '20px' }} />
          <span>KuCoin</span>
          <LockOutlined style={{ fontSize: '14px', marginLeft: '4px' }} />
        </div>
      ),
      disabled: true
    },
    {
      key: 'Coinbase',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
          <CoinbaseLogo style={{ width: '20px', height: '20px' }} />
          <span>Coinbase</span>
          <LockOutlined style={{ fontSize: '14px', marginLeft: '4px' }} />
        </div>
      ),
      disabled: true
    },
    {
      key: 'Gateio',
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
          <GateioLogo style={{ width: '20px', height: '20px' }} />
          <span>Gate.io</span>
          <LockOutlined style={{ fontSize: '14px', marginLeft: '4px' }} />
        </div>
      ),
      disabled: true
    }
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorBgContainer: isDarkMode ? '#141414' : '#fff',
          colorBgElevated: isDarkMode ? '#1f1f1f' : '#fff',
          colorBgLayout: isDarkMode ? '#000000' : '#f0f2f5',
          colorBgBase: isDarkMode ? '#000000' : '#fff',
        },
      }}
    >
      <Layout className={`app-container ${isDarkMode ? 'dark-mode' : ''}`}>
        <Header className={`header ${isDarkMode ? 'dark-mode' : ''}`}>
          <div className="logo">
            <WalletOutlined className="logo-icon" />
            <Title level={4} className="logo-text">Deposit<span style={{ color: '#9dff00' }}>One</span></Title>
          </div>
          <Tabs
            activeKey={selectedExchange}
            onChange={handleExchangeChange}
            className="exchange-tabs"
            items={exchangeTabs}
          />
          <div className="header-right">
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren={<SunOutlined />}
              unCheckedChildren={<MoonOutlined />}
              className="theme-switch"
            />
          </div>
        </Header>

        {/* 主要内容区域 */}
        <Content className={`content ${isDarkMode ? 'dark-mode' : ''}`}>
          <div className={`search-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <div className="search-actions">
              <div className="search-input-wrapper">
                <Input.Search
                  placeholder={`Search ${selectedExchange} tokens by name or symbol...`}
                  onChange={handleSearchChange}
                  value={searchText}
                  allowClear
                  className={`search-input ${isDarkMode ? 'dark-mode' : ''}`}
                  enterButton
                />
              </div>
              {selectedExchange === 'Mecx' && (
                <Alert
                  message={
                    <div style={{ fontSize: '12px' }}>
                      <div>Notice / 注意</div>
                    </div>
                  }
                  description={
                    <div style={{ fontSize: '12px' }}>
                      <div>Due to MEXC API limitations, deposit addresses can only be retrieved after they have been created on the exchange website first.</div>
                      <div style={{ marginTop: '4px' }}>由于 MEXC 接口限制，需要先在交易所网站创建充值地址后才能获取。</div>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ 
                    marginRight: 16,
                    marginLeft: 16,
                    flex: 1
                  }}
                />
              )}
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                className="action-button"
                loading={loading}
              >
                Refresh
              </Button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Text className="total-tokens" style={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)'
                }}>
                  Total tokens: {filteredTokens.length}
                </Text>
                {lastFetchTime && (
                  <Text style={{ 
                    fontSize: '12px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    Last API fetch: {new Date(lastFetchTime).toLocaleString()}
                    {isFromCache && (
                      <Tag color="orange" style={{ marginLeft: '4px', fontSize: '10px', lineHeight: '14px' }}>
                        Cached
                      </Tag>
                    )}
                  </Text>
                )}
              </div>
            </div>
          </div>

          {/* 热门代币推荐区域 */}
          {!searchText && (
            <div className="popular-tokens-container" style={{ background: isDarkMode ? '#141414' : '#fff' }}>
              <Title level={4} style={{ marginBottom: 16 }}>
                <FireOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                Popular {selectedExchange} Tokens
              </Title>
              <Row gutter={[16, 16]}>
                {getPopularTokens().map((token) => (
                  <Col xs={24} sm={12} md={8} lg={6} xl={3} key={token.symbol}>
                    <MemoizedTokenCard
                      token={token}
                      isDarkMode={isDarkMode}
                      onSelect={handleTokenSelect}
                    />
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* 所有代币列表 */}
          <div className="all-tokens-container" style={{ background: isDarkMode ? '#141414' : '#fff' }}>
            <Title level={4} style={{ margin: '24px 0 16px' }}>
              {searchText ? 'Search Results' : `All ${selectedExchange} Tokens`}
            </Title>
            <TokenList
              tokens={filteredTokens}
              isDarkMode={isDarkMode}
              onSelect={handleTokenSelect}
            />
          </div>

          {/* 充值地址弹窗 */}
          <Modal
            title={selectedToken ? `Deposit ${selectedToken.symbol}` : ''}
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={[
              <Button
                key="submit"
                type="primary"
                onClick={() => setModalVisible(false)}
                className="action-button"
              >
                Confirm
              </Button>,
            ]}
            className={`deposit-modal ${isDarkMode ? 'dark-mode' : ''}`}
          >
            {selectedToken && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8 }}>Select Network</div>
                  <Space wrap>
                    {selectedToken.networks.map(network => (
                      <Button
                        key={network.network}
                        type={selectedNetwork === network.network ? 'primary' : 'default'}
                        onClick={() => handleNetworkSelect(network.network)}
                        className={isDarkMode ? 'dark-mode' : ''}
                      >
                        {network.network}
                        {network.isDefault && (
                          <Tag color="success" style={{ marginLeft: 4 }}>
                            Default
                          </Tag>
                        )}
                      </Button>
                    ))}
                  </Space>
                </div>

                {selectedNetwork && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ marginBottom: 8 }}>Deposit Address</div>
                      <div className={`address-card ${isDarkMode ? 'dark-mode' : ''}`}>
                        <div className={`address-text ${isDarkMode ? 'dark-mode' : ''}`}>
                          {depositAddress}
                        </div>
                        <Button
                          className="copy-button"
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={copyAddress}
                        />
                      </div>
                      
                      {/* 添加二维码显示 */}
                      <div style={{ 
                        marginTop: 16, 
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <Divider>Scan QR Code</Divider>
                        <div style={{
                          padding: 16,
                          background: '#fff',
                          borderRadius: 8,
                          display: 'inline-block'
                        }}>
                          <QRCodeSVG
                            value={depositAddress}
                            size={200}
                            level="H"
                            includeMargin={true}
                            style={{
                              display: 'block'
                            }}
                          />
                        </div>
                        <Text type="secondary" style={{ marginTop: 8 }}>
                          Scan to get the deposit address
                        </Text>
                      </div>
                    </div>

                    {(depositTag || selectedToken?.networks.find(n => n.network === selectedNetwork)?.needTag) && (
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <Text type={!depositTag ? "danger" : undefined}>
                            Memo/Tag {!depositTag ? "(Required but not provided)" : "(Required)"}
                          </Text>
                        </div>
                        <div className={`address-card ${isDarkMode ? 'dark-mode' : ''}`}>
                          <div className={`memo-text ${isDarkMode ? 'dark-mode' : ''}`}>
                            {depositTag || 'Please contact support to get the correct memo/tag'}
                          </div>
                          {depositTag && (
                            <Button
                              className="copy-button"
                              type="text"
                              icon={<CopyOutlined />}
                              onClick={copyTag}
                            />
                          )}
                        </div>
                        {!depositTag && (
                          <Alert
                            message="Warning"
                            description="Depositing without a correct memo/tag may result in loss of funds."
                            type="warning"
                            showIcon
                            style={{ marginTop: 8 }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Modal>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
