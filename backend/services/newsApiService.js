const axios = require('axios');

class NewsApiService {
    constructor() {
        this.newsApis = {
            newsApi: {
                key: 'YOUR_NEWS_API_KEY', // Get from newsapi.org
                baseUrl: 'https://newsapi.org/v2',
                rateLimit: 1000 // requests per day (free tier)
            },
            finnhubNews: {
                key: 'YOUR_FINNHUB_KEY',
                baseUrl: 'https://finnhub.io/api/v1',
                rateLimit: 60
            }
        };
    }

    // Get general market news
    async getMarketNews(limit = 10) {
        try {
            const api = this.newsApis.newsApi;
            
            const response = await axios.get(`${api.baseUrl}/everything`, {
                params: {
                    q: 'stock market OR finance OR trading',
                    language: 'en',
                    sortBy: 'publishedAt',
                    pageSize: limit,
                    apiKey: api.key
                },
                timeout: 10000
            });

            return response.data.articles.map(article => ({
                title: article.title,
                description: article.description,
                url: article.url,
                source: article.source.name,
                publishedAt: article.publishedAt,
                imageUrl: article.urlToImage
            }));
        } catch (error) {
            console.error('News API error:', error.message);
            return [];
        }
    }

    // Get company-specific news
    async getCompanyNews(symbol, limit = 5) {
        try {
            const api = this.newsApis.finnhubNews;
            
            const response = await axios.get(`${api.baseUrl}/company-news`, {
                params: {
                    symbol: symbol,
                    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
                    to: new Date().toISOString().split('T')[0], // today
                    token: api.key
                },
                timeout: 10000
            });

            return response.data.slice(0, limit).map(article => ({
                title: article.headline,
                description: article.summary,
                url: article.url,
                source: article.source,
                publishedAt: new Date(article.datetime * 1000).toISOString(),
                imageUrl: article.image,
                category: article.category,
                sentiment: this.analyzeSentiment(article.headline + ' ' + article.summary)
            }));
        } catch (error) {
            console.error(`Company news error for ${symbol}:`, error.message);
            return [];
        }
    }

    // Simple sentiment analysis
    analyzeSentiment(text) {
        const positiveWords = ['gain', 'rise', 'up', 'profit', 'growth', 'increase', 'bull', 'positive'];
        const negativeWords = ['loss', 'fall', 'down', 'decline', 'drop', 'bear', 'negative', 'crash'];
        
        const lowerText = text.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }
}

module.exports = new NewsApiService();
