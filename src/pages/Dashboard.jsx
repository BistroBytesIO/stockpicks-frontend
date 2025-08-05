import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { stockPickApi } from '../services/api';
import StockChartsGrid from '../components/StockChartsGrid';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stockPicks, setStockPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [newsData, setNewsData] = useState({});
  const [newsLoading, setNewsLoading] = useState(true);
  const [activeNewsTab, setActiveNewsTab] = useState('topStories');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all data in parallel to avoid duplicate calls
        const [picksData, blogResponse, newsResponse] = await Promise.all([
          stockPickApi.getStockPicks(),
          fetch('http://localhost:8080/api/blog/posts'),
          fetch('http://localhost:8080/api/news/all-categories')
        ]);

        // Handle stock picks
        setStockPicks(picksData);

        // Handle blog posts
        if (blogResponse.ok) {
          const posts = await blogResponse.json();
          setBlogPosts(posts.slice(0, 3)); // Show only the latest 3 posts
        }
        setBlogLoading(false);

        // Handle news data
        if (newsResponse.ok) {
          const news = await newsResponse.json();
          setNewsData(news);
        }
        setNewsLoading(false);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setBlogLoading(false);
        setNewsLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const syncResponse = await stockPickApi.syncFromGoogleSheets();
      const updatedPicks = await stockPickApi.getStockPicks();
      setStockPicks(updatedPicks);
      
      // Show appropriate message based on sync results
      if (syncResponse.newPicksCount > 0) {
        alert(`✅ ${syncResponse.message}`);
      } else {
        alert(`ℹ️ ${syncResponse.message}`);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('Error syncing stock picks. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const calculatePerformance = (pick) => {
    if (!pick.currentPrice || !pick.entryPrice) return null;
    const change = pick.currentPrice - pick.entryPrice;
    const percentage = ((change / pick.entryPrice) * 100).toFixed(2);
    return { change: change.toFixed(2), percentage };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex justify-center items-center min-h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-xl text-gray-600">
              Your personalized stock picks and market insights
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Picks</p>
                  <p className="text-2xl font-bold text-gray-900">{stockPicks.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">BUY Signals</p>
                  <p className="text-2xl font-bold text-green-600">
                    {stockPicks.filter(pick => pick.pickType === 'BUY').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">SELL Signals</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stockPicks.filter(pick => pick.pickType === 'SELL').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stock Picks Section - Takes 2/3 of the width */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Latest Stock Picks</h2>
                    <button
                      onClick={handleSync}
                      disabled={syncing}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm ${
                        syncing
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white hover:shadow-md transform hover:-translate-y-0.5'
                      }`}
                    >
                      {syncing ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Syncing...
                        </div>
                      ) : (
                        'Sync Latest Picks'
                      )}
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Symbol</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Company</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Type</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Entry Price</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Current Price</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Performance</th>
                        <th className="text-left py-4 px-6 font-bold text-gray-900">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stockPicks.length > 0 ? (
                        stockPicks.map((pick) => {
                          const performance = calculatePerformance(pick);
                          return (
                            <tr key={pick.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-4 px-6 font-bold text-gray-900">{pick.symbol}</td>
                              <td className="py-4 px-6 text-gray-700">{pick.companyName}</td>
                              <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                  pick.pickType === 'BUY' ? 'bg-green-100 text-green-800' :
                                  pick.pickType === 'SELL' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {pick.pickType}
                                </span>
                              </td>
                              <td className="py-4 px-6 text-gray-700 font-medium">${pick.entryPrice.toFixed(2)}</td>
                              <td className="py-4 px-6 text-gray-700 font-medium">
                                {pick.currentPrice ? `$${pick.currentPrice.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-4 px-6">
                                {performance ? (
                                  <div className={`font-bold ${
                                    parseFloat(performance.change) >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {parseFloat(performance.change) >= 0 ? '+' : ''}${performance.change} ({performance.percentage}%)
                                  </div>
                                ) : (
                                  <span className="text-gray-500">-</span>
                                )}
                              </td>
                              <td className="py-4 px-6 text-gray-700">
                                {new Date(pick.pickDate).toLocaleDateString()}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                              <p className="text-lg font-medium">No stock picks available yet</p>
                              <p className="text-sm">Check back soon for the latest recommendations!</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* News & Analysis Section - Takes 1/3 of the width */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">Market News & Analysis</h2>
                </div>
                <div className="p-6 space-y-6">
                  {blogLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : blogPosts.length > 0 ? (
                    blogPosts.map((post) => (
                      <div key={post.id} className="border-l-4 border-primary-500 pl-4 hover:bg-gray-50 p-3 rounded-r-lg transition-colors cursor-pointer">
                        <div className="flex items-center mb-2">
                          <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-semibold">
                            {post.category}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-sm leading-tight">
                          {post.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-2">
                          {post.summary || post.content?.substring(0, 150) + '...'}
                        </p>
                        <button 
                          onClick={() => navigate(`/blog/${post.id}`)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm mt-2 transition-colors"
                        >
                          Read more →
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-sm">No blog posts available yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Market News Section */}
          <div className="mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Market News</h2>
                <p className="text-gray-600 mt-1">Latest financial news and market updates</p>
              </div>
              
              {/* News Category Tabs */}
              <div className="px-6 pt-4">
                <div className="flex flex-wrap gap-2 border-b border-gray-200">
                  {[
                    { id: 'topStories', label: 'Top Stories' },
                    { id: 'stockMarket', label: 'Stock Market' },
                    { id: 'bonds', label: 'Bonds' },
                    { id: 'currencies', label: 'Currencies' },
                    { id: 'personalFinance', label: 'Personal Finance' },
                    { id: 'economicNews', label: 'Economic News' },
                    { id: 'optionsFutures', label: 'Options & Futures' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveNewsTab(tab.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                        activeNewsTab === tab.id
                          ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* News Content */}
              <div className="p-6">
                {newsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : newsData[activeNewsTab] && newsData[activeNewsTab].length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {newsData[activeNewsTab].map((newsItem, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-2">
                          <span className="bg-secondary-100 text-secondary-700 px-2 py-1 rounded-full text-xs font-semibold">
                            {newsItem.category}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {new Date(newsItem.pubDate).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 text-sm leading-tight line-clamp-2">
                          {newsItem.title}
                        </h3>
                        <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                          {newsItem.description}
                        </p>
                        <a
                          href={newsItem.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
                        >
                          Read full article →
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-500 text-sm">No news available for this category</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stock Charts Section */}
          {stockPicks.length > 0 && (
            <div className="mt-12">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Stock Performance Charts</h2>
                <p className="text-gray-600">Visual analysis of our recommended stock picks</p>
              </div>
              <StockChartsGrid stockPicks={stockPicks} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};