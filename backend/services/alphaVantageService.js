const axios = require('axios');

class AlphaVantageService {
    constructor() {
        this.apiKey = 'IL28ALGXR7KMJ3ZB';
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.requestCount = 0;
        this.lastRequestTime = 0;
    }

    // Rate limiting: Alpha Vantage allows 5 requests per minute for free tier
    async rateLimitedRequest(url) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        // If less than 12 seconds since last request, wait
        if (timeSinceLastRequest < 12000) {
            const waitTime = 12000 - timeSinceLastRequest;
            console.log(`Rate limiting: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequestTime = Date.now();
        this.requestCount++;
        
        try {
            const response = await axios.get(url, { timeout: 10000 });
            return response.data;
        } catch (error) {
            console.error('Alpha Vantage API error:', error.message);
            throw error;
        }
    }

    // Get real-time stock quote
    async getStockQuote(symbol) {
        const url = `${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
        
        try {
            const data = await this.rateLimitedRequest(url);
            
            if (data['Error Message']) {
                throw new Error(`Invalid symbol: ${symbol}`);
            }
            
            if (data['Note']) {
                throw new Error('API call frequency limit reached. Please try again later.');
            }
            
            const quote = data['Global Quote'];
            if (!quote) {
                throw new Error(`No data found for symbol: ${symbol}`);
            }
            
            return {
                symbol: quote['01. symbol'],
                name: this.getCompanyName(symbol), // We'll need to map this
                price: parseFloat(quote['05. price']),
                change: parseFloat(quote['09. change']),
                changePercent: quote['10. change percent'].replace('%', ''),
                isPositive: parseFloat(quote['09. change']) >= 0,
                volume: parseInt(quote['06. volume']),
                previousClose: parseFloat(quote['08. previous close']),
                open: parseFloat(quote['02. open']),
                high: parseFloat(quote['03. high']),
                low: parseFloat(quote['04. low']),
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error.message);
            throw error;
        }
    }

    // Get multiple stock quotes
    async getMultipleQuotes(symbols) {
        const quotes = [];
        
        for (const symbol of symbols) {
            try {
                const quote = await this.getStockQuote(symbol);
                quotes.push(quote);
            } catch (error) {
                console.error(`Failed to fetch ${symbol}:`, error.message);
                // Continue with other symbols even if one fails
            }
        }
        
        return quotes;
    }

    // Search for stocks
    async searchStocks(keywords) {
        const url = `${this.baseUrl}?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${this.apiKey}`;
        
        try {
            const data = await this.rateLimitedRequest(url);
            
            if (data['Error Message']) {
                throw new Error('Search failed');
            }
            
            const matches = data['bestMatches'] || [];
            return matches.slice(0, 10).map(match => ({
                symbol: match['1. symbol'],
                name: match['2. name'],
                type: match['3. type'],
                region: match['4. region'],
                currency: match['8. currency']
            }));
        } catch (error) {
            console.error('Error searching stocks:', error.message);
            throw error;
        }
    }

    // Get intraday data for charts
    async getIntradayData(symbol, interval = '5min') {
        const url = `${this.baseUrl}?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}&apikey=${this.apiKey}`;
        
        try {
            const data = await this.rateLimitedRequest(url);
            
            if (data['Error Message']) {
                throw new Error(`Invalid symbol: ${symbol}`);
            }
            
            const timeSeries = data[`Time Series (${interval})`];
            if (!timeSeries) {
                throw new Error(`No intraday data found for ${symbol}`);
            }
            
            const chartData = Object.entries(timeSeries)
                .slice(0, 100) // Last 100 data points
                .map(([timestamp, values]) => ({
                    timestamp,
                    open: parseFloat(values['1. open']),
                    high: parseFloat(values['2. high']),
                    low: parseFloat(values['3. low']),
                    close: parseFloat(values['4. close']),
                    volume: parseInt(values['5. volume'])
                }))
                .reverse(); // Chronological order
            
            return chartData;
        } catch (error) {
            console.error(`Error fetching intraday data for ${symbol}:`, error.message);
            throw error;
        }
    }

    // Helper function to get company names (you can expand this)
    getCompanyName(symbol) {
        const companyNames = {
            'AAPL': 'Apple Inc.',
            'GOOGL': 'Alphabet Inc.',
            'MSFT': 'Microsoft Corporation',
            'TSLA': 'Tesla, Inc.',
            'AMZN': 'Amazon.com Inc.',
            'META': 'Meta Platforms Inc.',
            'NVDA': 'NVIDIA Corporation',
            'NFLX': 'Netflix Inc.',
            'AMD': 'Advanced Micro Devices Inc.',
            'INTC': 'Intel Corporation',
            'CRM': 'Salesforce Inc.',
            'ORCL': 'Oracle Corporation',
            'IBM': 'International Business Machines',
            'PYPL': 'PayPal Holdings Inc.',
            'ADBE': 'Adobe Inc.',
            'UBER': 'Uber Technologies Inc.',
            'SPOT': 'Spotify Technology S.A.',
            'SNAP': 'Snap Inc.',
            'TWTR': 'Twitter Inc.',
            'SQ': 'Block Inc.',
            'SHOP': 'Shopify Inc.',
            'ZM': 'Zoom Video Communications',
            'DOCU': 'DocuSign Inc.',
            'ROKU': 'Roku Inc.',
            'PINS': 'Pinterest Inc.'
        };
        
        return companyNames[symbol] || `${symbol} Corporation`;
    }

    // Get popular stocks list
    getPopularStocks() {
        return [
            'AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN', 
            'META', 'NVDA', 'NFLX', 'AMD', 'INTC'
        ];
    }
}

module.exports = new AlphaVantageService();
