import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Layout, 
  Input, 
  List, 
  Card, 
  Button, 
  Modal, 
  message, 
  Typography, 
  Space, 
  Tag, 
  Form,
  ConfigProvider,
  theme,
  Select,
  Row,
  Col,
  Alert,
  Tabs,
  Switch
} from 'antd';
import { 
  ReloadOutlined, 
  CopyOutlined, 
  SearchOutlined, 
  InfoCircleOutlined, 
  FireOutlined,
  SettingOutlined,
  WalletOutlined,
  BulbOutlined,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import axios from 'axios';
import debounce from 'lodash.debounce'; // 引入 debounce 函数
import './App.css';
import config from './config';

const { Header, Content } = Layout;
const { Search } = Input;
const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface Network {
  network: string;
  address: string;
  tag?: string;
  isDefault?: boolean;
  depositDesc: string;
  minConfirm: number;
  depositEnable: boolean;
}

interface Token {
  symbol: string;
  name: string;
  networks: Network[];
}

interface NetworkInfo {
  network: string;
  address: string;
  tag?: string;
}

interface ApiConfig {
  apiKey: string;
  apiSecret: string;
}

const App: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [networks, setNetworks] = useState<Network[]>([]);
  const [depositAddress, setDepositAddress] = useState('');
  const [depositTag, setDepositTag] = useState('');
  const [apiConfigModalVisible, setApiConfigModalVisible] = useState(false);
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
    const savedConfig = localStorage.getItem('apiConfig');
    return savedConfig ? JSON.parse(savedConfig) : null;
  });
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [searchText, setSearchText] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('Binance');

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

  // API 配置表单
  const [form] = Form.useForm();

  // 创建一个全局的 axios 实例
  const api = axios.create({
    baseURL: config.apiBaseUrl
  });

  // 更新 API 实例的 headers
  const updateApiHeaders = useCallback((config: ApiConfig) => {
    if (config) {
      api.defaults.headers.common['X-API-KEY'] = config.apiKey;
      api.defaults.headers.common['X-API-SECRET'] = config.apiSecret;
    }
  }, []);

  // 获取代币列表
  const fetchTokens = useCallback(async () => {
    if (!apiConfig) {
      setApiConfigModalVisible(true);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/tokens');
      const sortedTokens = response.data.sort((a: Token, b: Token) => 
        a.symbol.localeCompare(b.symbol)
      );
      setTokens(sortedTokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        message.error('Invalid API credentials. Please check your API configuration.');
        setApiConfigModalVisible(true);
      } else {
        message.error('Failed to fetch tokens');
      }
    } finally {
      setLoading(false);
    }
  }, [apiConfig]);

  // 刷新按钮点击处理
  const handleRefresh = useCallback(() => {
    setSearchText(''); // 清空搜索内容
    fetchTokens(); // 重新获取数据
  }, [fetchTokens]);

  // 初始加载和API配置更新时获取数据
  useEffect(() => {
    if (apiConfig) {
      fetchTokens();
    }
  }, [apiConfig, fetchTokens]);

  // 只在组件挂载时加载配置
  useEffect(() => {
    const savedConfig = localStorage.getItem('apiConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setApiConfig(config);
      updateApiHeaders(config);
    }
  }, []); // 移除 updateApiHeaders 依赖

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

    // 如果搜索词是 symbol 的开头，次优先显示
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
    debouncedSearch(value); // 防抖处理实际的搜索
  }, [debouncedSearch]);

  // 获取充值地址
  const getDepositAddress = async (coin: string, network: string) => {
    try {
      const response = await api.get(`/deposit-address/${coin}/${network}`);
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
    setNetworks(token.networks);
    setModalVisible(true);
    setSelectedNetwork('');
    setDepositAddress('');
    setDepositTag('');
  };

  // 处理网络选择
  const handleNetworkSelect = async (network: string) => {
    if (selectedToken) {
      setSelectedNetwork(network);
      const result = await getDepositAddress(selectedToken.symbol, network);
      if (result) {
        setDepositAddress(result.address);
        setDepositTag(result.tag || '');
      } else {
        setDepositAddress('');
        setDepositTag('');
      }
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

  const handleApiConfigSubmit = async (values: ApiConfig) => {
    try {
      // 更新 API headers
      updateApiHeaders(values);
      
      // 保存配置
      setApiConfig(values);
      localStorage.setItem('apiConfig', JSON.stringify(values));
      message.success('API configuration saved successfully');
      setApiConfigModalVisible(false);
      
      // 使用新的配置获取数据
      await fetchTokens();
    } catch (error) {
      console.error('Error saving API config:', error);
      message.error('Failed to save API configuration');
    }
  };

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
            onChange={setSelectedExchange}
            className="exchange-tabs"
            items={[
              { label: 'Binance', key: 'Binance' },
              { label: 'OKX', key: 'OKX' },
              { label: 'Bitget', key: 'Bitget' },
              { label: 'Huobi', key: 'Huobi' },
            ]}
          />
          <div className="header-right">
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren={<SunOutlined />}
              unCheckedChildren={<MoonOutlined />}
              className="theme-switch"
            />
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={() => setApiConfigModalVisible(true)}
              className="setting-button"
            />
          </div>
        </Header>

        {/* 主要内容区域 */}
        <Content className={`content ${isDarkMode ? 'dark-mode' : ''}`}>
          {/* API 配置弹窗 */}
          <Modal
            title="API Configuration"
            open={apiConfigModalVisible}
            onCancel={() => setApiConfigModalVisible(false)}
            footer={null}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleApiConfigSubmit}
            >
              <Form.Item
                label={
                  <span style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)' }}>
                    API Key
                  </span>
                }
                name="apiKey"
                rules={[{ required: true, message: 'Please input your API key!' }]}
              >
                <Input.Password placeholder="Enter your API key" />
              </Form.Item>

              <Form.Item
                label={
                  <span style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.85)' }}>
                    API Secret
                  </span>
                }
                name="apiSecret"
                rules={[{ required: true, message: 'Please input your API secret!' }]}
              >
                <Input.Password placeholder="Enter your API secret" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Save Configuration
                </Button>
              </Form.Item>
            </Form>
          </Modal>

          {selectedExchange === 'Binance' ? (
            <>
              <div className={`search-container ${isDarkMode ? 'dark-mode' : ''}`}>
                <div className="search-actions">
                  <div className="search-input-wrapper">
                    <Input.Search
                      placeholder="Search tokens by name or symbol..."
                      onChange={handleSearchChange}
                      value={searchText}
                      allowClear
                      className={`search-input ${isDarkMode ? 'dark-mode' : ''}`}
                      enterButton
                    />
                  </div>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={handleRefresh}
                    className="action-button"
                    loading={loading}
                  >
                    Refresh
                  </Button>
                  <Text className="total-tokens" style={{ 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)'
                  }}>
                    Total tokens: {filteredTokens.length}
                  </Text>
                </div>
              </div>

              {/* 热门代币推荐区域 */}
              {!searchText && (
                <div className="popular-tokens-container" style={{ background: isDarkMode ? '#141414' : '#fff' }}>
                  <Title level={4} style={{ marginBottom: 16 }}>
                    <FireOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
                    You Might Wanna Deposit
                  </Title>
                  <Row gutter={[16, 16]}>
                    {getPopularTokens().map((token) => (
                      <Col xs={24} sm={12} md={8} lg={6} xl={3} key={token.symbol}>
                        <Card
                          hoverable
                          style={{
                            height: '100%',
                            background: isDarkMode ? '#141414' : undefined,
                            border: isDarkMode ? '1px solid #303030' : undefined,
                            transition: 'all 0.3s ease'
                          }}
                          onClick={() => handleTokenSelect(token)}
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
                                  // 确保默认网络排在最前面
                                  if (a.isDefault && !b.isDefault) return -1;
                                  if (!a.isDefault && b.isDefault) return 1;
                                  return 0;
                                })
                                .slice(0, 4)
                                .map((network) => (
                                  <Tag 
                                    key={network.network}
                                    color="default"
                                    style={{ 
                                      margin: 0,
                                      borderRadius: '4px'
                                    }}
                                  >
                                    {network.network}
                                  </Tag>
                                ))}
                              {token.networks.length > 4 && (
                                <Tag 
                                  style={{ 
                                    margin: 0,
                                    borderRadius: '4px',
                                    backgroundColor: isDarkMode ? '#303030' : '#f0f0f0',
                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'
                                  }}
                                >
                                  +{token.networks.length - 4}
                                </Tag>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )}

              {/* 所有代币列表 */}
              <div className="all-tokens-container" style={{ background: isDarkMode ? '#141414' : '#fff' }}>
                <Title level={4} style={{ margin: '24px 0 16px' }}>
                  {searchText ? 'Search Results' : 'All Tokens'}
                </Title>
                <Row gutter={[16, 16]}>
                  {filteredTokens.map((token) => (
                    <Col xs={24} sm={12} md={8} lg={6} xl={3} key={token.symbol}>
                      <Card
                        hoverable
                        style={{
                          height: '100%',
                          background: isDarkMode ? '#141414' : undefined,
                          border: isDarkMode ? '1px solid #303030' : undefined,
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => handleTokenSelect(token)}
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
                                // 确保默认网络排在最前面
                                if (a.isDefault && !b.isDefault) return -1;
                                if (!a.isDefault && b.isDefault) return 1;
                                return 0;
                              })
                              .slice(0, 4)
                              .map((network) => (
                                <Tag 
                                  key={network.network}
                                  color="default"
                                  style={{ 
                                    margin: 0,
                                    borderRadius: '4px'
                                  }}
                                >
                                  {network.network}
                                </Tag>
                              ))}
                            {token.networks.length > 4 && (
                              <Tag 
                                style={{ 
                                  margin: 0,
                                  borderRadius: '4px',
                                  backgroundColor: isDarkMode ? '#303030' : '#f0f0f0',
                                  color: isDarkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'
                                }}
                              >
                                +{token.networks.length - 4}
                              </Tag>
                            )}
                          </div>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </>
          ) : (
            <div className={`coming-soon-container ${isDarkMode ? 'dark-mode' : ''}`}>
              <div className="coming-soon-content">
                <img 
                  src={`/images/${selectedExchange.toLowerCase()}-logo.svg`} 
                  alt={`${selectedExchange} Logo`}
                  className="exchange-logo"
                />
                <Title level={2}>Coming Soon</Title>
                <Text>We will integrate {selectedExchange} exchange very soon!</Text>
              </div>
            </div>
          )}
        </Content>

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
                  </div>

                  {depositTag && (
                    <div>
                      <div style={{ marginBottom: 8 }}>Memo (Required)</div>
                      <div className={`address-card ${isDarkMode ? 'dark-mode' : ''}`}>
                        <div className={`memo-text ${isDarkMode ? 'dark-mode' : ''}`}>
                          {depositTag}
                        </div>
                        <Button
                          className="copy-button"
                          type="text"
                          icon={<CopyOutlined />}
                          onClick={copyTag}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
