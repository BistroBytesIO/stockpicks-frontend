import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MarketDashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [news, setNews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('US');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMarketDashboard();
  }, []);

  const fetchMarketDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/market/dashboard');
      setMarketData(response.data.marketCategories);
      setNews(response.data.latestNews);
    } catch (err) {
      setError('Failed to fetch market data');
      console.error('Error fetching market dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (pubDate) => {
    try {
      const date = new Date(pubDate);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m`;
      } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h`;
      } else {
        return `${Math.floor(diffInMinutes / 1440)}d`;
      }
    } catch {
      return '1h';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Section - Market Categories */}
        <div className="flex-1">
          {/* Category Tabs */}
          <div className="flex space-x-4 mb-4 border-b">
            {marketData && Object.keys(marketData).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                  selectedCategory === category
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Market Items */}
          <div className="space-y-2">
            {marketData && marketData[selectedCategory]?.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 hover:bg-gray-50 rounded px-2">
                <div className="flex-1">
                  <div className="text-blue-600 font-medium text-sm hover:underline cursor-pointer">
                    {item.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-sm">{item.price}</div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-sm">{item.change}</div>
                </div>
                <div className="text-right ml-2">
                  <div className={`text-sm font-medium ${
                    item.changePercent.startsWith('+') 
                      ? 'text-green-600' 
                      : item.changePercent.startsWith('-')
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {item.changePercent}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section - Latest News */}
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Latest News</h3>
          <div className="space-y-4">
            {news.map((item, index) => (
              <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm leading-5 hover:underline"
                    >
                      {item.title}
                    </a>
                  </div>
                  <div className="text-gray-500 text-xs whitespace-nowrap">
                    {formatTimeAgo(item.pubDate)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-right">
            <a
              href="https://finance.yahoo.com/news"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
            >
              See All News →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDashboard;