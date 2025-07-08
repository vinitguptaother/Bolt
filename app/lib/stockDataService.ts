// Stock Data Service - Simulates real-time data and backend operations
export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: Date;
}

export interface MarketData {
  nifty: StockPrice;
  sensex: StockPrice;
  bankNifty: StockPrice;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  impact: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
  source: string;
  relevantStocks: string[];
}

class StockDataService {
  private subscribers: ((data: MarketData) => void)[] = [];
  private newsSubscribers: ((news: NewsItem[]) => void)[] = [];
  private currentData: MarketData;
  private newsData: NewsItem[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private newsInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.currentData = {
      nifty: { symbol: 'NIFTY', price: 19850.25, change: 125.30, changePercent: 0.63, volume: 2500000, timestamp: new Date() },
      sensex: { symbol: 'SENSEX', price: 66589.93, change: 418.60, changePercent: 0.63, volume: 1800000, timestamp: new Date() },
      bankNifty: { symbol: 'BANKNIFTY', price: 44892.15, change: -89.25, changePercent: -0.20, volume: 3200000, timestamp: new Date() }
    };
    this.initializeNews();
  }

  private initializeNews() {
    this.newsData = [
      {
        id: '1',
        title: 'RBI Keeps Repo Rate Unchanged at 6.5%, Maintains Accommodative Stance',
        summary: 'Reserve Bank of India maintains status quo on interest rates, citing inflation concerns and growth momentum.',
        category: 'monetary-policy',
        impact: 'positive',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        source: 'Economic Times',
        relevantStocks: ['HDFC BANK', 'ICICI BANK', 'SBI']
      },
      {
        id: '2',
        title: 'Reliance Industries Q3 Results Beat Estimates, Revenue Up 12%',
        summary: 'RIL reports strong quarterly performance driven by petrochemicals and retail segments.',
        category: 'earnings',
        impact: 'positive',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        source: 'Business Standard',
        relevantStocks: ['RELIANCE']
      },
      {
        id: '3',
        title: 'IT Sector Faces Headwinds as US Client Spending Slows',
        summary: 'Major IT companies report cautious outlook amid economic uncertainty in key markets.',
        category: 'sector-news',
        impact: 'negative',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        source: 'Mint',
        relevantStocks: ['TCS', 'INFOSYS', 'WIPRO', 'HCL TECH']
      }
    ];
  }

  // Subscribe to real-time market data updates
  subscribe(callback: (data: MarketData) => void) {
    this.subscribers.push(callback);
    callback(this.currentData); // Send initial data
  }

  // Subscribe to news updates
  subscribeToNews(callback: (news: NewsItem[]) => void) {
    this.newsSubscribers.push(callback);
    callback(this.newsData); // Send initial news
  }

  // Unsubscribe from updates
  unsubscribe(callback: (data: MarketData) => void) {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }

  unsubscribeFromNews(callback: (news: NewsItem[]) => void) {
    this.newsSubscribers = this.newsSubscribers.filter(sub => sub !== callback);
  }

  // Start real-time data simulation
  startRealTimeUpdates() {
    if (this.updateInterval) return;

    this.updateInterval = setInterval(() => {
      this.updateMarketData();
      this.notifySubscribers();
    }, 5000); // Update every 5 seconds

    this.newsInterval = setInterval(() => {
      this.generateRandomNews();
    }, 30000); // New news every 30 seconds
  }

  // Stop real-time updates
  stopRealTimeUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    if (this.newsInterval) {
      clearInterval(this.newsInterval);
      this.newsInterval = null;
    }
  }

  private updateMarketData() {
    // Simulate realistic market movements
    const updatePrice = (current: StockPrice) => {
      const volatility = 0.002; // 0.2% volatility
      const randomChange = (Math.random() - 0.5) * 2 * volatility;
      const newPrice = current.price * (1 + randomChange);
      const change = newPrice - current.price;
      const changePercent = (change / current.price) * 100;
      
      return {
        ...current,
        price: Math.round(newPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: current.volume + Math.floor(Math.random() * 10000),
        timestamp: new Date()
      };
    };

    this.currentData = {
      nifty: updatePrice(this.currentData.nifty),
      sensex: updatePrice(this.currentData.sensex),
      bankNifty: updatePrice(this.currentData.bankNifty)
    };
  }

  private generateRandomNews() {
    const newsTemplates = [
      {
        title: 'FII Activity Shows Strong Buying Interest in Banking Sector',
        summary: 'Foreign institutional investors continue to show confidence in Indian banking stocks.',
        category: 'market-flows',
        impact: 'positive' as const,
        source: 'CNBC TV18',
        relevantStocks: ['HDFC BANK', 'ICICI BANK', 'AXIS BANK']
      },
      {
        title: 'Auto Sales Data Shows Festive Season Boost',
        summary: 'Automobile manufacturers report strong sales figures for the festive period.',
        category: 'sector-news',
        impact: 'positive' as const,
        source: 'Moneycontrol',
        relevantStocks: ['MARUTI SUZUKI', 'TATA MOTORS', 'BAJAJ AUTO']
      },
      {
        title: 'Crude Oil Prices Impact Energy Sector Outlook',
        summary: 'Rising crude oil prices affect margins for oil marketing companies.',
        category: 'sector-news',
        impact: 'negative' as const,
        source: 'Economic Times',
        relevantStocks: ['RELIANCE', 'ONGC', 'IOC']
      }
    ];

    const randomNews = newsTemplates[Math.floor(Math.random() * newsTemplates.length)];
    const newNewsItem: NewsItem = {
      id: Date.now().toString(),
      ...randomNews,
      timestamp: new Date()
    };

    this.newsData.unshift(newNewsItem);
    if (this.newsData.length > 10) {
      this.newsData = this.newsData.slice(0, 10);
    }

    this.notifyNewsSubscribers();
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.currentData));
  }

  private notifyNewsSubscribers() {
    this.newsSubscribers.forEach(callback => callback(this.newsData));
  }

  // Get current market data
  getCurrentData(): MarketData {
    return this.currentData;
  }

  // Get current news
  getCurrentNews(): NewsItem[] {
    return this.newsData;
  }

  // Simulate API calls for stock search
  async searchStocks(query: string): Promise<any[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stockDatabase = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Limited', sector: 'Oil & Gas', price: 2485.75 },
      { symbol: 'TCS', name: 'Tata Consultancy Services Limited', sector: 'IT Services', price: 3720.45 },
      { symbol: 'HDFC', name: 'HDFC Bank Limited', sector: 'Banking', price: 1545.30 },
      { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT Services', price: 1420.75 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', sector: 'Banking', price: 985.20 },
      { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking', price: 598.45 },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecom', price: 1125.80 },
      { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG', price: 445.30 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'Banking', price: 1545.30 },
      { symbol: 'LT', name: 'Larsen & Toubro Limited', sector: 'Construction', price: 3245.60 }
    ];

    return stockDatabase.filter(stock => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Get detailed stock information
  async getStockDetails(symbol: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return mock detailed data based on symbol
    const baseData = {
      symbol,
      lastUpdated: new Date().toISOString(),
      fundamentals: {
        'Revenue growth (YoY)': Math.round((Math.random() * 20 + 5) * 10) / 10,
        'PE ratio': Math.round((Math.random() * 40 + 10) * 10) / 10,
        'ROE': Math.round((Math.random() * 25 + 10) * 10) / 10,
        'Debt/Equity': Math.round((Math.random() * 1 + 0.1) * 100) / 100,
        'Dividend Yield': Math.round((Math.random() * 4 + 0.5) * 10) / 10
      },
      technical: {
        'RSI': Math.round(Math.random() * 40 + 30),
        'MACD': Math.random() > 0.5 ? 'Bullish' : 'Bearish',
        'Support': Math.round(Math.random() * 100 + 2000),
        'Resistance': Math.round(Math.random() * 100 + 2200)
      }
    };

    return baseData;
  }
}

export const stockDataService = new StockDataService();