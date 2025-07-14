// API Keys Configuration
// Add your API keys here or use environment variables

module.exports = {
    // Stock Market APIs
    alphaVantage: {
        key: process.env.ALPHA_VANTAGE_KEY || 'IL28ALGXR7KMJ3ZB',
        name: 'Alpha Vantage',
        website: 'https://www.alphavantage.co/',
        freeLimit: '5 requests per minute, 500 per day',
        features: ['Real-time quotes', 'Historical data', 'Technical indicators']
    },
    
    finnhub: {
        key: process.env.FINNHUB_KEY || 'YOUR_FINNHUB_KEY',
        name: 'Finnhub',
        website: 'https://finnhub.io/',
        freeLimit: '60 requests per minute',
        features: ['Real-time quotes', 'Company news', 'Earnings data']
    },
    
    iexCloud: {
        key: process.env.IEX_KEY || 'YOUR_IEX_KEY',
        name: 'IEX Cloud',
        website: 'https://iexcloud.io/',
        freeLimit: '100 requests per month',
        features: ['Real-time quotes', 'Company data', 'Market data']
    },
    
    polygon: {
        key: process.env.POLYGON_KEY || 'YOUR_POLYGON_KEY',
        name: 'Polygon.io',
        website: 'https://polygon.io/',
        freeLimit: '5 requests per minute',
        features: ['Real-time quotes', 'Historical data', 'Market data']
    },
    
    // News APIs
    newsApi: {
        key: process.env.NEWS_API_KEY || 'YOUR_NEWS_API_KEY',
        name: 'NewsAPI',
        website: 'https://newsapi.org/',
        freeLimit: '1000 requests per day',
        features: ['Market news', 'Company news', 'Global news']
    },
    
    // Cryptocurrency APIs (optional)
    coinGecko: {
        key: null, // CoinGecko is free without API key
        name: 'CoinGecko',
        website: 'https://www.coingecko.com/',
        freeLimit: '50 requests per minute',
        features: ['Crypto prices', 'Market data', 'Historical data']
    },
    
    // Economic Data APIs (optional)
    fredApi: {
        key: process.env.FRED_API_KEY || 'YOUR_FRED_KEY',
        name: 'FRED (Federal Reserve Economic Data)',
        website: 'https://fred.stlouisfed.org/',
        freeLimit: 'No limit',
        features: ['Economic indicators', 'Interest rates', 'GDP data']
    }
};

// Helper function to check which APIs are configured
function getConfiguredApis() {
    const configured = [];
    const notConfigured = [];
    
    for (const [apiName, config] of Object.entries(module.exports)) {
        if (typeof config === 'object' && config.key) {
            if (config.key.startsWith('YOUR_') || !config.key) {
                notConfigured.push({
                    name: apiName,
                    displayName: config.name,
                    website: config.website
                });
            } else {
                configured.push({
                    name: apiName,
                    displayName: config.name,
                    features: config.features
                });
            }
        }
    }
    
    return { configured, notConfigured };
}

module.exports.getConfiguredApis = getConfiguredApis;
