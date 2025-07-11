import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message, provider = 'perplexity' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let apiKey: string | undefined;
    let apiUrl: string;
    let requestBody: any;
    let headers: any;

    // Configure API based on provider
    switch (provider.toLowerCase()) {
      case 'perplexity':
        apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
        apiUrl = 'https://api.perplexity.ai/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        requestBody = {
          model: 'sonar-small-online',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specializing in Indian stock market analysis and trading. Provide accurate, concise, and actionable insights about stocks, market trends, and investment strategies. Use real-time data when available and cite sources when possible.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          top_p: 0.9,
          stream: false
        };
        break;

      case 'openai':
        apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        apiUrl = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        };
        requestBody = {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant specializing in Indian stock market analysis and trading. Provide accurate, concise, and actionable insights about stocks, market trends, and investment strategies.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        };
        break;

      case 'anthropic':
        apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
        apiUrl = 'https://api.anthropic.com/v1/messages';
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        };
        requestBody = {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `You are a helpful AI assistant specializing in Indian stock market analysis and trading. User question: ${message}`
            }
          ]
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported provider' },
          { status: 400 }
        );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for ${provider}` },
        { status: 500 }
      );
    }

    // Make API call to LLM provider
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`${provider} API error:`, response.status, errorText);
      return NextResponse.json(
        { error: `${provider} API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract response based on provider
    let aiResponse: string;
    let suggestions: string[] = [];

    switch (provider.toLowerCase()) {
      case 'perplexity':
        aiResponse = data.choices?.[0]?.message?.content || 'No response received';
        // Generate suggestions based on the response
        suggestions = generateSuggestions(message, aiResponse);
        break;

      case 'openai':
        aiResponse = data.choices?.[0]?.message?.content || 'No response received';
        suggestions = generateSuggestions(message, aiResponse);
        break;

      case 'anthropic':
        aiResponse = data.content?.[0]?.text || 'No response received';
        suggestions = generateSuggestions(message, aiResponse);
        break;

      default:
        aiResponse = 'Unsupported provider response format';
    }

    return NextResponse.json({
      response: aiResponse,
      suggestions,
      provider
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateSuggestions(userMessage: string, aiResponse: string): string[] {
  const message = userMessage.toLowerCase();
  const response = aiResponse.toLowerCase();

  // Generate contextual suggestions based on the conversation
  const suggestions: string[] = [];

  if (message.includes('stock') || message.includes('share')) {
    suggestions.push('Show me technical analysis');
    suggestions.push('What are the fundamentals?');
    suggestions.push('Compare with sector peers');
  }

  if (message.includes('market') || message.includes('nifty') || message.includes('sensex')) {
    suggestions.push('Market outlook for next week');
    suggestions.push('Best sectors to invest');
    suggestions.push('FII/DII activity today');
  }

  if (message.includes('buy') || message.includes('sell') || message.includes('invest')) {
    suggestions.push('Risk management tips');
    suggestions.push('Portfolio allocation advice');
    suggestions.push('Exit strategy suggestions');
  }

  if (response.includes('technical') || response.includes('chart')) {
    suggestions.push('Show me chart patterns');
    suggestions.push('RSI and MACD analysis');
    suggestions.push('Support and resistance levels');
  }

  // Default suggestions if none match
  if (suggestions.length === 0) {
    suggestions.push('Market trends today');
    suggestions.push('Best stocks to buy');
    suggestions.push('Portfolio review');
    suggestions.push('Risk assessment');
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
}