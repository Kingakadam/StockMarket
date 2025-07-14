const axios = require('axios');
const alphaVantageService = require('./alphaVantageService');

class MultiApiService {
    constructor() {
        // API Keys and configurations
        this.apis = {
            alphaVantage: {
                key: 'IL28ALGXR7KMJ3ZB',
                baseUrl: 'https://www.alphavantage.co/query',
                rateLimit: 5, // requests per minute
                lastRequest: 0,
                requestCount: 0
            },
            finnhub: {
                key: 'YOUR_FINNHUB_KEY', // Get free key from finnhub.io
                baseUrl: 'https://finnhub.io/api/v1',
                rateLimit: 60, // requests per minute
                lastRequest: 0,
                requestCount: 0
            },
            iex: {
                key: 'YOUR_IEX_KEY', // Get free key from iexcloud.io
                baseUrl: 'https://cloud.iexapis.com/stable',
                rateLimit: 100, // requests per month (free tier)
                lastRequest: 0,
                requestCount: 0
            },
            polygon: {
                key: 'YOUR_POLYGON_KEY', // Get free key from polygon.io
                baseUrl: 'https://api.polygon.io',
                rateLimit: 5, // requests per minute (free tier)
                lastRequest: 0,
                requestCount: 0
            }
        };
        
        this.primaryApi = 'alphaVantage';
        this.fallbackApis = ['finnhub', 'iex', 'polygon'];
    }

    // Rate limiting helper
    async checkRateLimit(apiName) {
        const api = this.apis[apiName];
        const now = Date.now();
        const timeSinceLastRequest = now - api.lastRequest;
        const minInterval = (60 * 1000) / api.rateLimit; // milliseconds between requests

        if (timeSinceLastRequest < minInterval) {
            const waitTime = minInterval - timeSinceLastRequest;
            console.log(`Rate limiting ${apiName}: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        api.lastRequest = Date.now();
        api.requestCount++;
    }

    // Alpha Vantage implementation (existing)
    async getStockFromAlphaVantage(symbol) {
        try {
            await this.checkRateLimit('alphaVantage');
            return await alphaVantageService.getStockQuote(symbol);
        } catch (error) {
            console.error(`Alpha Vantage error for ${symbol}:`, error.message);
            throw error;
        }
    }

    // Finnhub implementation
    async getStockFromFinnhub(symbol) {
        try {
            await this.checkRateLimit('finnhub');
            const api = this.apis.finnhub;
            
            const response = await axios.get(`${api.baseUrl}/quote`, {
                params: {
                    symbol: symbol,
                    token: api.key
                },
                timeout: 10000
            });

            const data = response.data;
            
            return {
                symbol: symbol,
                name: `${symbol} Corporation`, // Finnhub doesn't provide company name in quote
                price: data.c, // current price
                change: data.d, // change
                changePercent: `${(data.dp || 0).toFixed(2)}%`, // change percent
                isPositive: (data.d || 0) >= 0,
                volume: 0, // Not available in basic quote
                previousClose: data.pc,
                open: data.o,
                high: data.h,
                low: data.l,
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error(`Finnhub error for ${symbol}:`, error.message);
            throw error;
        }
    }

    // IEX Cloud implementation
    async getStockFromIEX(symbol) {
        try {
            await this.checkRateLimit('iex');
            const api = this.apis.iex;
            
            const response = await axios.get(`${api.baseUrl}/stock/${symbol}/quote`, {
                params: {
                    token: api.key
                },
                timeout: 10000
            });

            const data = response.data;
            
            return {
                symbol: data.symbol,
                name: data.companyName,
                price: data.latestPrice,
                change: data.change,
                changePercent: `${(data.changePercent * 100).toFixed(2)}%`,
                isPositive: data.change >= 0,
                volume: data.latestVolume,
                previousClose: data.previousClose,
                open: data.open,
                high: data.high,
                low: data.low,
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error(`IEX error for ${symbol}:`, error.message);
            throw error;
        }
    }

    // Polygon.io implementation
    async getStockFromPolygon(symbol) {
        try {
            await this.checkRateLimit('polygon');
            const api = this.apis.polygon;
            
            const response = await axios.get(`${api.baseUrl}/v2/aggs/ticker/${symbol}/prev`, {
                params: {
                    adjusted: 'true',
                    apikey: api.key
                },
                timeout: 10000
            });

            const data = response.data.results[0];
            
            return {
                symbol: symbol,
                name: `${symbol} Corporation`,
                price: data.c, // close price
                change: data.c - data.o, // close - open
                changePercent: `${(((data.c - data.o) / data.o) * 100).toFixed(2)}%`,
                isPositive: (data.c - data.o) >= 0,
                volume: data.v,
                previousClose: data.o,
                open: data.o,
                high: data.h,
                low: data.l,
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error(`Polygon error for ${symbol}:`, error.message);
            throw error;
        }
    }

    // Main method with fallback logic
    async getStockQuote(symbol) {
        const errors = [];
        
        // Try primary API first
        try {
            console.log(`Fetching ${symbol} from primary API: ${this.primaryApi}`);
            return await this.getStockFromAlphaVantage(symbol);
        } catch (error) {
            errors.push(`${this.primaryApi}: ${error.message}`);
            console.log(`Primary API failed, trying fallbacks...`);
        }

        // Try fallback APIs
        for (const apiName of this.fallbackApis) {
            try {
                console.log(`Trying fallback API: ${apiName}`);
                
                switch (apiName) {
                    case 'finnhub':
                        return await this.getStockFromFinnhub(symbol);
                    case 'iex':
                        return await this.getStockFromIEX(symbol);
                    case 'polygon':
                        return await this.getStockFromPolygon(symbol);
                    default:
                        continue;
                }
            } catch (error) {
                errors.push(`${apiName}: ${error.message}`);
                console.log(`${apiName} failed, trying next...`);
            }
        }

        // All APIs failed
        throw new Error(`All APIs failed for ${symbol}. Errors: ${errors.join(', ')}`);
    }

    // Get multiple quotes with load balancing
    async getMultipleQuotes(symbols) {
        const quotes = [];
        const apiUsage = {};
        
        for (const symbol of symbols) {
            try {
                const quote = await this.getStockQuote(symbol);
                quotes.push(quote);
                
                // Track API usage
                const usedApi = this.getLastUsedApi();
                apiUsage[usedApi] = (apiUsage[usedApi] || 0) + 1;
                
            } catch (error) {
                console.error(`Failed to fetch ${symbol}:`, error.message);
            }
        }
        
        console.log('API Usage Summary:', apiUsage);
        return quotes;
    }

    // Get API status and usage
    getApiStatus() {
        const status = {};
        
        for (const [name, api] of Object.entries(this.apis)) {
            status[name] = {
                requestCount: api.requestCount,
                lastRequest: new Date(api.lastRequest).toISOString(),
                rateLimit: `${api.rateLimit} requests/minute`,
                available: true // You can add health checks here
            };
        }
        
        return status;
    }

    // Helper to track which API was last used
    getLastUsedApi() {
        return this.primaryApi; // Simplified - you can enhance this
    }

    // Switch primary API
    switchPrimaryApi(apiName) {
        if (this.apis[apiName]) {
            this.primaryApi = apiName;
            console.log(`Switched primary API to: ${apiName}`);
        } else {
            throw new Error(`Unknown API: ${apiName}`);
        }
    }
}

module.exports = new MultiApiService();
