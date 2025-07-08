'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, TrendingUp, Search, BarChart3, Minimize2, Maximize2 } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your AI trading assistant. I can help you with:\n\n• Stock information and analysis\n• Indian market insights\n• Dashboard navigation\n• Trading strategies\n\nWhat would you like to know?',
      timestamp: new Date(),
      suggestions: ['Search RELIANCE stock', 'Market outlook today', 'How to use portfolio tab', 'Best swing trading stocks']
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mock AI responses based on user input
  const generateAIResponse = (userMessage: string): { content: string; suggestions?: string[] } => {
    const message = userMessage.toLowerCase();

    // Stock search queries
    if (message.includes('reliance') || message.includes('ril')) {
      return {
        content: `📊 **RELIANCE (RIL) - Quick Info**\n\n💰 **Current Price:** ₹2,485.75 (+1.44%)\n📈 **Market Cap:** ₹16.8L Cr\n🏭 **Sector:** Oil & Gas\n\n**Key Metrics:**\n• P/E Ratio: 24.8\n• ROE: 15.2%\n• Debt/Equity: 0.35\n• Dividend Yield: 0.8%\n\n**Technical:** RSI at 65 (Bullish), Recent breakout confirmed\n**Fundamental:** Strong Q2 results, petrochemical margins improving\n\n*Would you like detailed analysis or add to portfolio?*`,
        suggestions: ['Detailed RELIANCE analysis', 'Add RELIANCE to portfolio', 'Compare with ONGC', 'RELIANCE technical chart']
      };
    }

    if (message.includes('tcs') || message.includes('tata consultancy')) {
      return {
        content: `💻 **TCS - Quick Info**\n\n💰 **Current Price:** ₹3,720.45 (-0.69%)\n📈 **Market Cap:** ₹13.5L Cr\n🏭 **Sector:** IT Services\n\n**Key Metrics:**\n• P/E Ratio: 29.6\n• ROE: 42.8%\n• Debt/Equity: 0.02\n• Dividend Yield: 3.2%\n\n**Technical:** RSI at 45 (Neutral), Consolidation phase\n**Fundamental:** Excellent governance, strong cash flows\n\n*IT sector facing headwinds due to US slowdown concerns*`,
        suggestions: ['IT sector outlook', 'TCS vs INFOSYS', 'Add TCS to watchlist', 'Q3 earnings preview']
      };
    }

    if (message.includes('hdfc') && message.includes('bank')) {
      return {
        content: `🏦 **HDFC BANK - Quick Info**\n\n💰 **Current Price:** ₹1,545.30 (+1.23%)\n📈 **Market Cap:** ₹11.8L Cr\n🏭 **Sector:** Banking\n\n**Key Metrics:**\n• P/E Ratio: 18.6\n• ROE: 16.8%\n• Book Value: ₹552\n• Dividend Yield: 1.2%\n\n**Technical:** RSI at 68 (Bullish), Breakout confirmed\n**Fundamental:** Best-in-class bank, merger synergies\n\n*Banking sector showing strength on stable rates*`,
        suggestions: ['Banking sector analysis', 'HDFC merger impact', 'Compare with ICICI', 'Add to long-term portfolio']
      };
    }

    // Market outlook queries
    if (message.includes('market') && (message.includes('today') || message.includes('outlook') || message.includes('trend'))) {
      return {
        content: `📈 **Indian Market Outlook**\n\n**Today's Sentiment:** Bullish\n**NIFTY 50:** 19,850 (+0.63%)\n**SENSEX:** 66,590 (+0.63%)\n\n**Key Highlights:**\n• Banking stocks leading gains\n• FII buying continues (+₹2,500 Cr)\n• RBI policy supportive\n• Auto sector strong on festive demand\n\n**Sectors to Watch:**\n✅ Banking & Finance\n✅ Auto & Auto Components\n⚠️ IT Services (cautious)\n❌ Pharma (weak)\n\n*Market momentum likely to continue with stock-specific action*`,
        suggestions: ['Best sectors today', 'FII/DII activity', 'Nifty technical levels', 'Top gainers today']
      };
    }

    // Dashboard navigation
    if (message.includes('portfolio') && (message.includes('how') || message.includes('use') || message.includes('create'))) {
      return {
        content: `📁 **Portfolio Management Guide**\n\n**To create a new portfolio:**\n1. Go to Portfolio tab\n2. Click "Create New Portfolio"\n3. Set name, risk level, strategy\n4. Add stocks with purchase details\n\n**Features:**\n• Multiple portfolio tracking\n• P&L calculation\n• Parameter monitoring\n• Performance analytics\n\n**Pro Tip:** Use different portfolios for different strategies (Long-term, Swing, Intraday)\n\n*Would you like help with any specific portfolio feature?*`,
        suggestions: ['Add stock to portfolio', 'Portfolio performance tracking', 'Risk management tips', 'Diversification strategy']
      };
    }

    if (message.includes('screener') || message.includes('filter') || message.includes('find stocks')) {
      return {
        content: `🔍 **Stock Screener Guide**\n\n**Available Filters:**\n• Market Cap (Large/Mid/Small)\n• P/E Ratio range\n• Sector selection\n• Price change filters\n• Volume analysis\n• Technical patterns\n\n**Preset Screens:**\n• Momentum Stocks (23 stocks)\n• Value Picks (18 stocks)\n• Breakout Candidates (31 stocks)\n• Dividend Aristocrats (15 stocks)\n\n*Use screener to find stocks matching your criteria*`,
        suggestions: ['Show momentum stocks', 'Value stock criteria', 'Breakout patterns', 'Dividend stocks list']
      };
    }

    // Trading strategies
    if (message.includes('swing') || message.includes('trading strategy')) {
      return {
        content: `📊 **Swing Trading Strategy**\n\n**Best Timeframe:** 2-15 days\n**Success Rate:** 73%\n**Avg Risk-Reward:** 1:2.8\n\n**Current Opportunities:**\n• TATA STEEL - Cup & Handle (87% confidence)\n• BAJAJ FINANCE - Ascending Triangle (82%)\n• MARUTI - Flag Pattern (75%)\n\n**Key Rules:**\n• Max 5% portfolio per trade\n• Minimum 1:2 risk-reward\n• Trail stop after 50% target\n• Review every 2 days\n\n*Check Swing Trading tab for detailed setups*`,
        suggestions: ['Current swing setups', 'Risk management rules', 'Best swing stocks', 'Technical patterns guide']
      };
    }

    if (message.includes('intraday') || message.includes('day trading')) {
      return {
        content: `⚡ **Intraday Trading Insights**\n\n**Market Momentum:** Bullish (85% strength)\n**Best Time Slots:**\n• 9:15-10:30 AM (High volatility)\n• 2:30-3:30 PM (Closing moves)\n\n**Active Signals:**\n• HDFC BANK - BUY (92% confidence)\n• RELIANCE - SELL (78% confidence)\n• ICICI BANK - BUY (88% confidence)\n\n**Tips:**\n• Never risk >2% per trade\n• Avoid lunch hour (12-1 PM)\n• Use stop losses always\n\n*Check Intraday tab for live signals*`,
        suggestions: ['Live intraday signals', 'Best intraday stocks', 'Risk management', 'Market timing tips']
      };
    }

    // AI Analysis
    if (message.includes('ai') && (message.includes('analysis') || message.includes('prediction'))) {
      return {
        content: `🤖 **AI Analysis Overview**\n\n**Model Performance:**\n• Accuracy: 87.3%\n• Success Rate: 73%\n• Predictions Today: 156\n\n**Market Sentiment:** Bullish (78% confidence)\n\n**Top AI Recommendations:**\n1. RELIANCE - BUY (89% confidence)\n2. HDFC BANK - ACCUMULATE (85%)\n3. INFOSYS - HOLD (72%)\n\n**Pattern Recognition:**\n• Cup & Handle: 12 stocks\n• Ascending Triangle: 8 stocks\n• Bull Flag: 6 stocks\n\n*Visit AI Analysis tab for detailed insights*`,
        suggestions: ['AI stock recommendations', 'Pattern recognition', 'Market predictions', 'AI model performance']
      };
    }

    // Economic indicators
    if (message.includes('rbi') || message.includes('interest rate') || message.includes('inflation')) {
      return {
        content: `🏛️ **Economic Indicators**\n\n**RBI Policy:**\n• Repo Rate: 6.5% (Unchanged)\n• Stance: Accommodative\n• Next Review: Feb 8, 2024\n\n**Key Metrics:**\n• CPI Inflation: 5.02%\n• GDP Growth: 7.6%\n• Forex Reserves: $595 Bn\n\n**Impact on Markets:**\n✅ Banking sector positive\n✅ Rate-sensitive stocks benefit\n⚠️ Monitor inflation trends\n\n*Stable policy environment supports equity markets*`,
        suggestions: ['Banking sector impact', 'Rate sensitive stocks', 'Inflation hedge stocks', 'GDP growth stocks']
      };
    }

    // Default responses for general queries
    if (message.includes('help') || message.includes('what can you do')) {
      return {
        content: `🤖 **I can help you with:**\n\n📊 **Stock Information:**\n• Real-time prices & analysis\n• Fundamental & technical data\n• Company financials\n\n📈 **Market Insights:**\n• Daily market outlook\n• Sector analysis\n• Economic indicators\n\n🧭 **Dashboard Navigation:**\n• Portfolio management\n• Stock screener\n• Trading strategies\n• AI analysis tools\n\n*Just ask me anything about stocks or markets!*`,
        suggestions: ['Search a stock', 'Market outlook', 'Portfolio help', 'Trading strategies']
      };
    }

    // Fallback response
    return {
      content: `I understand you're asking about "${userMessage}". Let me help you with that!\n\nI can provide information about:\n• Specific stocks (try "RELIANCE info")\n• Market analysis\n• Dashboard features\n• Trading strategies\n\nCould you be more specific about what you'd like to know?`,
      suggestions: ['Search RELIANCE', 'Market trends today', 'How to use screener', 'Best trading strategies']
    };
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputMessage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
    handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all z-50 animate-pulse"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <div className="glass-effect rounded-xl shadow-2xl h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 rounded-t-xl bg-blue-600 text-white">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span className="font-semibold">AI Trading Assistant</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${
                    message.type === 'user' 
                      ? 'bg-blue-600 text-white rounded-l-lg rounded-tr-lg' 
                      : 'bg-gray-100 text-gray-900 rounded-r-lg rounded-tl-lg'
                  } p-3`}>
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && <Bot className="h-4 w-4 mt-1 text-blue-600" />}
                      {message.type === 'user' && <User className="h-4 w-4 mt-1" />}
                      <div className="flex-1">
                        <div className="whitespace-pre-line text-sm">{message.content}</div>
                        {message.suggestions && (
                          <div className="mt-2 space-y-1">
                            {message.suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="block w-full text-left text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-r-lg rounded-tl-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about stocks, markets, or dashboard..."
                  className="flex-1 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIChatbot;