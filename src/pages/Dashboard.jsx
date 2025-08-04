import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { stockPickApi, subscriptionApi } from '../services/api';
import StockChartsGrid from '../components/StockChartsGrid';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stockPicks, setStockPicks] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [picksData, subscriptionData] = await Promise.all([
          stockPickApi.getStockPicks(),
          subscriptionApi.getCurrentSubscription()
        ]);
        setStockPicks(picksData);
        console.log('Subscription data:', subscriptionData);
        setSubscription(subscriptionData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600">
          Here's your personalized stock picks dashboard
        </p>
      </div>

      {/* Subscription Status */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Status</h2>
        {subscription ? (
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plan</p>
              <p className="text-lg font-semibold text-gray-900">{subscription.planName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                subscription.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {subscription.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Billing</p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No active subscription found</p>
            <a
              href="/plans"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Choose a Plan
            </a>
          </div>
        )}
      </div>

      {/* Stock Picks Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Stock Picks</h2>
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                syncing
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-primary-600 hover:bg-primary-700 text-white'
              }`}
            >
              {syncing ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Syncing...
                </div>
              ) : (
                'Sync Latest Stock Picks!'
              )}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Symbol</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Company</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Type</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Entry Price</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Current Price</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Performance</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stockPicks.length > 0 ? (
                stockPicks.map((pick) => {
                  const performance = calculatePerformance(pick);
                  return (
                    <tr key={pick.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6 font-semibold text-gray-900">{pick.symbol}</td>
                      <td className="py-4 px-6 text-gray-700">{pick.companyName}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2 py-1 rounded text-sm font-semibold ${
                          pick.pickType === 'BUY' ? 'bg-green-100 text-green-800' :
                          pick.pickType === 'SELL' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {pick.pickType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-700">${pick.entryPrice.toFixed(2)}</td>
                      <td className="py-4 px-6 text-gray-700">
                        {pick.currentPrice ? `$${pick.currentPrice.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-4 px-6">
                        {performance ? (
                          <div className={`font-semibold ${
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
                    No stock picks available yet. Check back soon!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Summary */}
      {stockPicks.length > 0 && (
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Picks</h3>
            <p className="text-3xl font-bold text-primary-600">{stockPicks.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">BUY Signals</h3>
            <p className="text-3xl font-bold text-green-600">
              {stockPicks.filter(pick => pick.pickType === 'BUY').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">SELL Signals</h3>
            <p className="text-3xl font-bold text-red-600">
              {stockPicks.filter(pick => pick.pickType === 'SELL').length}
            </p>
          </div>
        </div>
      )}

      {/* Stock Charts Section */}
      {stockPicks.length > 0 && (
        <div className="mt-12">
          <StockChartsGrid stockPicks={stockPicks} />
        </div>
      )}
    </div>
  );
};