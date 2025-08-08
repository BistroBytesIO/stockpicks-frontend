import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { stockPickApi, blogApi, fileApi } from '../services/api';
import StockChartsGrid from '../components/StockChartsGrid';
import MarketDashboard from '../components/MarketDashboard';

export const Dashboard = () => {
  const { user, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();
  const [stockPicks, setStockPicks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Only fetch protected resources if user has active subscription
        const promises = [
          blogApi.getPosts()
        ];
        
        if (hasActiveSubscription) {
          promises.push(
            stockPickApi.getStockPicks(),
            fileApi.getFiles()
          );
        }
        
        const responses = await Promise.allSettled(promises);
        const blogResponse = responses[0];
        let picksData = [];
        let filesData = [];
        
        if (hasActiveSubscription && responses.length > 1) {
          const stockResponse = responses[1];
          const filesResponse = responses[2];
          
          if (stockResponse.status === 'fulfilled') {
            picksData = stockResponse.value;
          }
          if (filesResponse.status === 'fulfilled') {
            filesData = filesResponse.value;
          }
        }

        // Handle stock picks (only if subscription active)
        if (hasActiveSubscription) {
          setStockPicks(picksData);
        }

        // Handle blog posts
        if (blogResponse.status === 'fulfilled') {
          const posts = blogResponse.value;
          setBlogPosts(posts.slice(0, 3)); // Show only the latest 3 posts
        }
        setBlogLoading(false);

        // Handle files data (only if subscription active)
        if (hasActiveSubscription) {
          setFiles(filesData);
        }
        setFilesLoading(false);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setBlogLoading(false);
        setFilesLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [hasActiveSubscription]);

  const handleSync = async () => {
    if (!hasActiveSubscription) return;
    
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileDownload = async (fileId, filename) => {
    try {
      // Get the file blob
      const blob = await fileApi.downloadFile(fileId);
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
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
                    {hasActiveSubscription && (
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
                    )}
                  </div>
                </div>

                {hasActiveSubscription ? (
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
                ) : (
                  <div className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Unlock Expert Stock Picks</h3>
                      <p className="text-gray-600 mb-6 max-w-md">Get access to our latest professional stock recommendations and trading signals with real-time performance tracking.</p>
                      <button
                        onClick={() => navigate('/plans')}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        Subscribe to Premium Plans
                      </button>
                    </div>
                  </div>
                )}
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

          {/* Market Dashboard Section */}
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Market Overview</h2>
              <p className="text-gray-600">Real-time market data and latest financial news</p>
            </div>
            <MarketDashboard />
          </div>

          {/* Stock Charts Section */}
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Stock Performance Charts</h2>
              <p className="text-gray-600">Visual analysis of our recommended stock picks</p>
            </div>
            {hasActiveSubscription && stockPicks.length > 0 ? (
              <StockChartsGrid stockPicks={stockPicks} />
            ) : !hasActiveSubscription ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-16">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Unlock Interactive Stock Charts</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">View detailed performance charts and technical analysis for all our recommended stocks with real-time market data.</p>
                  <button
                    onClick={() => navigate('/plans')}
                    className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                  >
                    Subscribe to Premium Plans
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">No stock picks available to display charts for.</p>
              </div>
            )}
          </div>

          {/* Downloads Section */}
          <div className="mt-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">Downloads</h2>
                <p className="text-gray-600 mt-1">Excel files and resources for subscribers</p>
              </div>
              
              <div className="p-6">
                {hasActiveSubscription ? (
                  filesLoading ? (
                    <div className="flex justify-center items-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : files.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {files.map((file) => (
                        <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start mb-3">
                            <svg className="w-8 h-8 text-green-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                                {file.originalFilename}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {file.description}
                              </p>
                              <div className="flex justify-between items-center text-xs text-gray-500">
                                <span>{formatFileSize(file.fileSize)}</span>
                                <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFileDownload(file.id, file.originalFilename)}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 text-sm">No downloadable files available yet</p>
                    </div>
                  )
                ) : (
                  <div className="py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Unlock Premium Downloads</h3>
                      <p className="text-gray-600 mb-6 max-w-md">Access exclusive Excel files, research reports, and trading templates available only to our premium subscribers.</p>
                      <button
                        onClick={() => navigate('/plans')}
                        className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                      >
                        Subscribe to Premium Plans
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};