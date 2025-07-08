// API Service - Manages API configurations and data fetching with real external APIs
export interface APIConfiguration {
  id: string;
  name: string;
  provider: string;
  category: string;
  apiKey: string;
  endpoint: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error' | 'testing';
  lastUpdate: string;
  latency: string;
  requestsToday: number;
  rateLimit: string;
  headers?: { [key: string]: string };
  parameters?: { [key: string]: string };
  createdAt: Date;
  lastTested: Date;
}

export interface APIResponse {
  success: boolean;
  data?: any;
  error?: string;
  latency: number;
  timestamp: Date;
}

class APIService {
  private apis: APIConfiguration[] = [];
  private subscribers: ((apis: APIConfiguration[]) => void)[] = [];
  private dataCache: { [apiId: string]: any } = {};
  private updateIntervals: { [apiId: string]: NodeJS.Timeout } = {};

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultAPIs();
  }

  // Subscribe to API updates
  subscribe(callback: (apis: APIConfiguration[]) => void) {
    this.subscribers.push(callback);
    callback(this.apis);
  }

  unsubscribe(callback: (apis: APIConfiguration[]) => void) {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  // Add new API configuration
  async addAPI(config: Omit<APIConfiguration, 'id' | 'status' | 'lastUpdate' | 'latency' | 'requestsToday' | 'createdAt' | 'lastTested'>): Promise<APIConfiguration> {
    // Validate API key is provided for APIs that require it
    if (this.requiresAPIKey(config.provider) && !config.apiKey?.trim()) {
      throw new Error(`API key is required for ${config.provider}. Please add your API key before testing the connection.`);
    }

    const newAPI: APIConfiguration = {
      id: Date.now().toString(),
      status: 'disconnected',
      lastUpdate: 'Never',
      latency: '0ms',
      requestsToday: 0,
      createdAt: new Date(),
      lastTested: new Date(),
      rateLimit: '1000/hour',
      ...config
    };

    this.apis.push(newAPI);
    this.saveToStorage();
    this.notifySubscribers();

    // Test the API connection only if API key is provided
    if (config.apiKey?.trim()) {
      await this.testAPIConnection(newAPI.id);
    }

    return newAPI;
  }

  // Add API without validation (for initialization)
  private addAPIWithoutValidation(config: Omit<APIConfiguration, 'id' | 'status' | 'lastUpdate' | 'latency' | 'requestsToday' | 'createdAt' | 'lastTested'>): APIConfiguration {
    const newAPI: APIConfiguration = {
      id: Date.now().toString(),
      status: 'disconnected',
      lastUpdate: config.apiKey?.trim() ? 'Never' : 'API Key Required',
      latency: '0ms',
      requestsToday: 0,
      createdAt: new Date(),
      lastTested: new Date(),
      rateLimit: '1000/hour',
      ...config
    };

    this.apis.push(newAPI);
    this.saveToStorage();
    this.notifySubscribers();
    return newAPI;
  }

  // Check if provider requires API key
  private requiresAPIKey(provider: string): boolean {
    const providersRequiringKeys = [
      'alpha vantage', 'newsapi', 'yahoo', 'tradingview', 
      'financial modeling prep', 'fmp', 'coingecko'
    ];
    return providersRequiringKeys.includes(provider.toLowerCase());
  }

  // Update API configuration
  async updateAPI(id: string, updates: Partial<APIConfiguration>): Promise<boolean> {
    const apiIndex = this.apis.findIndex(api => api.id === id);
    if (apiIndex === -1) return false;

    this.apis[apiIndex] = { ...this.apis[apiIndex], ...updates };
    this.saveToStorage();
    this.notifySubscribers();

    // Re-test connection if critical fields changed and API key is present
    if ((updates.apiKey || updates.endpoint) && this.apis[apiIndex].apiKey?.trim()) {
      await this.testAPIConnection(id);
    }

    return true;
  }

  // Delete API configuration
  deleteAPI(id: string): boolean {
    const index = this.apis.findIndex(api => api.id === id);
    if (index === -1) return false;

    // Stop any running intervals
    if (this.updateIntervals[id]) {
      clearInterval(this.updateIntervals[id]);
      delete this.updateIntervals[id];
    }

    this.apis.splice(index, 1);
    delete this.dataCache[id];
    this.saveToStorage();
    this.notifySubscribers();
    return true;
  }

  // Test API connection
  async testAPIConnection(id: string): Promise<APIResponse> {
    const api = this.apis.find(a => a.id === id);
    if (!api) {
      return { success: false, error: 'API not found', latency: 0, timestamp: new Date() };
    }

    // Check if API key is required and missing
    if (this.requiresAPIKey(api.provider) && !api.apiKey?.trim()) {
      const error = `API key is required for ${api.provider}. Please add your API key to test the connection.`;
      api.status = 'disconnected';
      api.lastUpdate = 'API Key Required';
      this.saveToStorage();
      this.notifySubscribers();
      return { success: false, error, latency: 0, timestamp: new Date() };
    }

    const startTime = Date.now();
    
    try {
      // Update status to testing
      api.status = 'testing';
      this.notifySubscribers();

      const response = await this.makeRealAPICall(api);
      const latency = Date.now() - startTime;

      // Update API status and metrics
      api.status = response.success ? 'connected' : 'error';
      api.latency = `${latency}ms`;
      api.lastUpdate = new Date().toLocaleString();
      api.lastTested = new Date();

      if (response.success) {
        this.dataCache[id] = response.data;
        this.startDataUpdates(id);
      }

      this.saveToStorage();
      this.notifySubscribers();

      return { ...response, latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      
      api.status = 'error';
      api.latency = `${latency}ms`;
      api.lastUpdate = 'Error';
      api.lastTested = new Date();

      this.saveToStorage();
      this.notifySubscribers();

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency,
        timestamp: new Date()
      };
    }
  }

  // Make real API call based on configuration
  private async makeRealAPICall(api: APIConfiguration): Promise<APIResponse> {
    try {
      const headers: { [key: string]: string } = {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Stock-Dashboard/1.0',
        ...api.headers
      };

      // Add API key based on provider and category
      if (api.apiKey) {
        this.addAuthenticationHeaders(api, headers);
      }

      let url = this.buildAPIUrl(api);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const processedData = this.processAPIResponse(api, data);

      return {
        success: true,
        data: processedData,
        latency: 0,
        timestamp: new Date()
      };

    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout - API took too long to respond');
        }
        throw error;
      }
      throw new Error('Unknown error occurred during API call');
    }
  }

  // Add authentication headers based on API provider
  private addAuthenticationHeaders(api: APIConfiguration, headers: { [key: string]: string }) {
    switch (api.provider.toLowerCase()) {
      case 'alpha vantage':
        headers['apikey'] = api.apiKey;
        break;
      case 'newsapi':
        headers['X-API-Key'] = api.apiKey;
        break;
      case 'yahoo':
        headers['X-RapidAPI-Key'] = api.apiKey;
        headers['X-RapidAPI-Host'] = 'yahoo-finance15.p.rapidapi.com';
        break;
      case 'nse india':
        headers['Authorization'] = `Bearer ${api.apiKey}`;
        break;
      case 'tradingview':
        headers['Authorization'] = `Bearer ${api.apiKey}`;
        break;
      case 'financial modeling prep':
      case 'fmp':
        // FMP uses API key as query parameter, handled in buildAPIUrl
        break;
      case 'coingecko':
        headers['x-cg-demo-api-key'] = api.apiKey;
        break;
      default:
        headers['Authorization'] = `Bearer ${api.apiKey}`;
    }
  }

  // Build API URL with proper endpoints and parameters
  private buildAPIUrl(api: APIConfiguration): string {
    let url = api.endpoint;
    const params = new URLSearchParams();

    switch (api.category) {
      case 'market-data':
        url = this.buildMarketDataUrl(api, params);
        break;
      case 'news':
        url = this.buildNewsUrl(api, params);
        break;
      case 'technical-analysis':
        url = this.buildTechnicalUrl(api, params);
        break;
      case 'fundamental-analysis':
        url = this.buildFundamentalUrl(api, params);
        break;
      case 'economic-data':
        url = this.buildEconomicUrl(api, params);
        break;
      case 'crypto':
        url = this.buildCryptoUrl(api, params);
        break;
    }

    // Add API key as query parameter for certain providers
    if (api.apiKey && ['financial modeling prep', 'fmp', 'alpha vantage'].includes(api.provider.toLowerCase())) {
      params.set('apikey', api.apiKey);
    }

    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  }

  // Build market data URLs
  private buildMarketDataUrl(api: APIConfiguration, params: URLSearchParams): string {
    switch (api.provider.toLowerCase()) {
      case 'alpha vantage':
        params.set('function', 'GLOBAL_QUOTE');
        params.set('symbol', 'RELIANCE.BSE');
        return `${api.endpoint}/query`;
      
      case 'yahoo':
        return `${api.endpoint}/v8/finance/chart/^NSEI`;
      
      case 'nse india':
        return `${api.endpoint}/api/equity-stockIndices?index=NIFTY%2050`;
      
      case 'financial modeling prep':
      case 'fmp':
        return `${api.endpoint}/v3/quote/RELIANCE.NS`;
      
      default:
        return api.endpoint;
    }
  }

  // Build news URLs
  private buildNewsUrl(api: APIConfiguration, params: URLSearchParams): string {
    switch (api.provider.toLowerCase()) {
      case 'newsapi':
        params.set('q', 'indian stock market OR nifty OR sensex');
        params.set('language', 'en');
        params.set('sortBy', 'publishedAt');
        params.set('pageSize', '20');
        return `${api.endpoint}/everything`;
      
      case 'times internet':
        params.set('category', 'markets');
        return `${api.endpoint}/news`;
      
      default:
        return api.endpoint;
    }
  }

  // Build technical analysis URLs
  private buildTechnicalUrl(api: APIConfiguration, params: URLSearchParams): string {
    switch (api.provider.toLowerCase()) {
      case 'alpha vantage':
        params.set('function', 'RSI');
        params.set('symbol', 'RELIANCE.BSE');
        params.set('interval', 'daily');
        params.set('time_period', '14');
        return `${api.endpoint}/query`;
      
      case 'tradingview':
        return `${api.endpoint}/v1/indicators`;
      
      default:
        return api.endpoint;
    }
  }

  // Build fundamental analysis URLs
  private buildFundamentalUrl(api: APIConfiguration, params: URLSearchParams): string {
    switch (api.provider.toLowerCase()) {
      case 'financial modeling prep':
      case 'fmp':
        return `${api.endpoint}/v3/ratios/RELIANCE.NS`;
      
      case 'alpha vantage':
        params.set('function', 'OVERVIEW');
        params.set('symbol', 'RELIANCE.BSE');
        return `${api.endpoint}/query`;
      
      default:
        return api.endpoint;
    }
  }

  // Build economic data URLs
  private buildEconomicUrl(api: APIConfiguration, params: URLSearchParams): string {
    switch (api.provider.toLowerCase()) {
      case 'reserve bank of india':
      case 'rbi':
        return `${api.endpoint}/v1/indicators/inflation`;
      
      case 'alpha vantage':
        params.set('function', 'REAL_GDP');
        params.set('interval', 'annual');
        return `${api.endpoint}/query`;
      
      default:
        return api.endpoint;
    }
  }

  // Build crypto URLs
  private buildCryptoUrl(api: APIConfiguration, params: URLSearchParams): string {
    switch (api.provider.toLowerCase()) {
      case 'coingecko':
        params.set('ids', 'bitcoin,ethereum');
        params.set('vs_currencies', 'inr');
        params.set('include_24hr_change', 'true');
        return `${api.endpoint}/v3/simple/price`;
      
      default:
        return api.endpoint;
    }
  }

  // Process API response based on provider format
  private processAPIResponse(api: APIConfiguration, rawData: any): any {
    try {
      switch (api.provider.toLowerCase()) {
        case 'alpha vantage':
          return this.processAlphaVantageData(api, rawData);
        
        case 'newsapi':
          return this.processNewsAPIData(rawData);
        
        case 'yahoo':
          return this.processYahooFinanceData(rawData);
        
        case 'nse india':
          return this.processNSEData(rawData);
        
        case 'financial modeling prep':
        case 'fmp':
          return this.processFMPData(rawData);
        
        case 'coingecko':
          return this.processCoinGeckoData(rawData);
        
        default:
          return rawData;
      }
    } catch (error) {
      console.warn(`Error processing ${api.provider} data:`, error);
      return rawData;
    }
  }

  // Process Alpha Vantage API responses
  private processAlphaVantageData(api: APIConfiguration, data: any): any {
    if (data['Error Message']) {
      throw new Error(data['Error Message']);
    }

    if (data['Note']) {
      throw new Error('API call frequency limit reached');
    }

    if (api.category === 'market-data' && data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: quote['10. change percent'].replace('%', ''),
        volume: parseInt(quote['06. volume']),
        timestamp: new Date()
      };
    }

    if (api.category === 'technical-analysis' && data['Technical Analysis: RSI']) {
      const rsiData = data['Technical Analysis: RSI'];
      const latestDate = Object.keys(rsiData)[0];
      return {
        rsi: parseFloat(rsiData[latestDate]['RSI']),
        date: latestDate,
        timestamp: new Date()
      };
    }

    return data;
  }

  // Process NewsAPI responses
  private processNewsAPIData(data: any): any {
    if (data.status === 'error') {
      throw new Error(data.message);
    }

    return {
      articles: data.articles?.map((article: any) => ({
        id: article.url,
        title: article.title,
        summary: article.description,
        content: article.content,
        source: article.source.name,
        publishedAt: article.publishedAt,
        url: article.url,
        category: 'market-news',
        impact: 'neutral'
      })) || [],
      totalResults: data.totalResults,
      timestamp: new Date()
    };
  }

  // Process Yahoo Finance responses
  private processYahooFinanceData(data: any): any {
    if (data.chart?.error) {
      throw new Error(data.chart.error.description);
    }

    const result = data.chart?.result?.[0];
    if (!result) {
      throw new Error('No data available');
    }

    const meta = result.meta;
    return {
      symbol: meta.symbol,
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.previousClose,
      changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
      volume: meta.regularMarketVolume,
      timestamp: new Date(meta.regularMarketTime * 1000)
    };
  }

  // Process NSE India responses
  private processNSEData(data: any): any {
    if (data.data && Array.isArray(data.data)) {
      return data.data.map((item: any) => ({
        symbol: item.index,
        price: item.last,
        change: item.change,
        changePercent: item.pChange,
        timestamp: new Date()
      }));
    }
    return data;
  }

  // Process Financial Modeling Prep responses
  private processFMPData(data: any): any {
    if (Array.isArray(data) && data.length > 0) {
      const item = data[0];
      return {
        symbol: item.symbol,
        price: item.price,
        change: item.change,
        changePercent: item.changesPercentage,
        volume: item.volume,
        marketCap: item.marketCap,
        timestamp: new Date()
      };
    }
    return data;
  }

  // Process CoinGecko responses
  private processCoinGeckoData(data: any): any {
    return Object.keys(data).map(coinId => ({
      id: coinId,
      price: data[coinId].inr,
      change24h: data[coinId].inr_24h_change,
      timestamp: new Date()
    }));
  }

  // Start automatic data updates for connected APIs
  private startDataUpdates(apiId: string) {
    // Clear existing interval
    if (this.updateIntervals[apiId]) {
      clearInterval(this.updateIntervals[apiId]);
      delete this.updateIntervals[apiId];
    }

    // Start new interval for data updates
    this.updateIntervals[apiId] = setInterval(async () => {
      try {
        const api = this.apis.find(a => a.id === apiId);
        if (!api || api.status !== 'connected') {
          if (this.updateIntervals[apiId]) {
            clearInterval(this.updateIntervals[apiId]);
            delete this.updateIntervals[apiId];
          }
          return;
        }

        // Skip update if API key is missing
        if (this.requiresAPIKey(api.provider) && !api.apiKey?.trim()) {
          console.warn(`Skipping update for ${api.name}: API key is missing`);
          api.status = 'disconnected';
          api.lastUpdate = 'API Key Required';
          this.saveToStorage();
          this.notifySubscribers();
          
          if (this.updateIntervals[apiId]) {
            clearInterval(this.updateIntervals[apiId]);
            delete this.updateIntervals[apiId];
          }
          return;
        }

        const response = await this.makeRealAPICall(api);
        if (response.success) {
          this.dataCache[apiId] = response.data;
          api.requestsToday += 1;
          api.lastUpdate = new Date().toLocaleString();
          this.saveToStorage();
          this.notifySubscribers();
        } else {
          console.warn(`API call failed for ${api.name}:`, response.error);
          api.status = 'error';
          api.lastUpdate = 'Error';
          this.saveToStorage();
          this.notifySubscribers();
          
          if (this.updateIntervals[apiId]) {
            clearInterval(this.updateIntervals[apiId]);
            delete this.updateIntervals[apiId];
          }
        }
      } catch (error) {
        console.error(`Error in data update interval for API ${apiId}:`, error);
        
        const api = this.apis.find(a => a.id === apiId);
        if (api) {
          api.status = 'error';
          api.lastUpdate = 'Error';
          this.saveToStorage();
          this.notifySubscribers();
        }
        
        if (this.updateIntervals[apiId]) {
          clearInterval(this.updateIntervals[apiId]);
          delete this.updateIntervals[apiId];
        }
      }
    }, 60000); // Update every 60 seconds to respect rate limits
  }

  // Get cached data for an API
  getCachedData(apiId: string): any {
    return this.dataCache[apiId];
  }

  // Get all APIs
  getAllAPIs(): APIConfiguration[] {
    return this.apis;
  }

  // Get APIs by category
  getAPIsByCategory(category: string): APIConfiguration[] {
    return this.apis.filter(api => api.category === category);
  }

  // Get connected APIs
  getConnectedAPIs(): APIConfiguration[] {
    return this.apis.filter(api => api.status === 'connected');
  }

  // Initialize default APIs with real endpoints
  private initializeDefaultAPIs() {
    try {
      if (this.apis.length === 0) {
        const defaultAPIs = [
          {
            name: 'Alpha Vantage Market Data',
            provider: 'Alpha Vantage',
            category: 'market-data',
            apiKey: '', // User needs to add their API key
            endpoint: 'https://www.alphavantage.co',
            description: 'Real-time and historical stock market data'
          },
          {
            name: 'NewsAPI Financial News',
            provider: 'NewsAPI',
            category: 'news',
            apiKey: '', // User needs to add their API key
            endpoint: 'https://newsapi.org/v2',
            description: 'Latest financial news and market updates'
          }
        ];

        defaultAPIs.forEach(api => {
          this.addAPIWithoutValidation(api);
        });
      }
    } catch (error) {
      console.error('Error initializing default APIs:', error);
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('api_configurations', JSON.stringify(this.apis));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
      }
    }
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('api_configurations');
        if (stored) {
          this.apis = JSON.parse(stored);
        }
      } catch (error) {
        console.error('Error loading API configurations:', error);
        this.apis = [];
      }
    }
  }

  private notifySubscribers() {
    try {
      this.subscribers.forEach(callback => callback(this.apis));
    } catch (error) {
      console.error('Error notifying subscribers:', error);
    }
  }

  // Test all APIs
  async testAllAPIs(): Promise<void> {
    const promises = this.apis.map(api => this.testAPIConnection(api.id));
    await Promise.all(promises);
  }

  // Get API statistics
  getAPIStats() {
    const total = this.apis.length;
    const connected = this.apis.filter(api => api.status === 'connected').length;
    const totalRequests = this.apis.reduce((sum, api) => sum + api.requestsToday, 0);
    const avgLatency = this.apis.length > 0 
      ? Math.round(this.apis.reduce((sum, api) => sum + parseInt(api.latency), 0) / this.apis.length)
      : 0;

    return {
      total,
      connected,
      totalRequests,
      avgLatency,
      uptime: connected > 0 ? Math.round((connected / total) * 100) : 0
    };
  }

  // Clean up method to stop all intervals
  cleanup() {
    Object.values(this.updateIntervals).forEach(interval => {
      clearInterval(interval);
    });
    this.updateIntervals = {};
  }
}

export const apiService = new APIService();