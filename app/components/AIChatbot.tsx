'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, TrendingUp, Search, BarChart3, Minimize2, Maximize2, Settings } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  provider?: string;
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('perplexity');
  const [showSettings, setShowSettings] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your AI trading assistant. I can help you with:\n\n• Stock information and analysis\n• Indian market insights\n• Dashboard navigation\n• Trading strategies\n\nWhat would you like to know?',
      timestamp: new Date(),
      suggestions: ['Search RELIANCE stock', 'Market outlook today', 'How to use portfolio tab', 'Best swing trading stocks'],
      provider: 'system'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const providers = [
    { id: 'perplexity', name: 'Perplexity AI', description: 'Real-time web search capabilities' },
    { id: 'openai', name: 'OpenAI GPT', description: 'Advanced reasoning and analysis' },
    { id: 'anthropic', name: 'Anthropic Claude', description: 'Thoughtful and nuanced responses' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Call the backend API to get LLM response
  const callLLMAPI = async (userMessage: string): Promise<{ content: string; suggestions?: string[]; provider?: string }> => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          provider: selectedProvider
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.response,
        suggestions: data.suggestions,
        provider: data.provider
      };
    } catch (error) {
      console.error('LLM API call failed:', error);
      return {
        content: `I apologize, but I'm having trouble connecting to the AI service right now. This could be due to:\n\n• API key not configured for ${selectedProvider}\n• Network connectivity issues\n• API service temporarily unavailable\n\nPlease check your API configuration in the settings or try again later.`,
        suggestions: ['Check API settings', 'Try different provider', 'Retry request'],
        provider: 'error'
      };
    }
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

    try {
      // Call the LLM API
      const aiResponse = await callLLMAPI(inputMessage);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: aiResponse.content,
        timestamp: new Date(),
        suggestions: aiResponse.suggestions,
        provider: aiResponse.provider
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getProviderIcon = (provider?: string) => {
    if (provider === 'perplexity') return '🔍';
    if (provider === 'openai') return '🤖';
    if (provider === 'anthropic') return '🧠';
    return '💬';
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
            <span className="text-xs bg-blue-500 px-2 py-1 rounded">
              {providers.find(p => p.id === selectedProvider)?.name || selectedProvider}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-white hover:text-gray-200 transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
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
            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-900 mb-2">AI Provider</h4>
                <div className="space-y-2">
                  {providers.map((provider) => (
                    <label key={provider.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="provider"
                        value={provider.id}
                        checked={selectedProvider === provider.id}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="text-blue-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">{provider.name}</span>
                        <p className="text-xs text-gray-600">{provider.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

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
                      {message.type === 'bot' && (
                        <span className="text-sm mt-1" title={`Powered by ${message.provider || 'AI'}`}>
                          {getProviderIcon(message.provider)}
                        </span>
                      )}
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
                      <span className="text-sm" title={`${selectedProvider} is thinking...`}>
                        {getProviderIcon(selectedProvider)}
                      </span>
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
                  placeholder={`Ask ${providers.find(p => p.id === selectedProvider)?.name || 'AI'} about stocks, markets, or dashboard...`}
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