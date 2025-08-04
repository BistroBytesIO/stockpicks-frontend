import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { stockPickApi } from '../services/api';

export const Home = () => {
  const [recentPicks, setRecentPicks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentPicks = async () => {
      try {
        const picks = await stockPickApi.getRecentStockPicks(5);
        setRecentPicks(picks);
      } catch (error) {
        console.error('Error fetching recent picks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentPicks();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <section className="text-center py-20">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Professional Stock Picks
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get expert stock recommendations and market insights to maximize your investment returns.
          Join thousands of successful investors who trust our proven track record.
        </p>
        <div className="space-x-4">
          <Link
            to="/plans"
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            View Pricing Plans
          </Link>
          <Link
            to="/register"
            className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose Our Stock Picks?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Expert Analysis</h3>
            <p className="text-gray-600">
              Our team of professional analysts provides in-depth research and market insights.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Timely Updates</h3>
            <p className="text-gray-600">
              Get real-time stock picks and market updates delivered straight to your dashboard.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Proven Results</h3>
            <p className="text-gray-600">
              Track record of successful picks with transparent performance metrics.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Picks Preview */}
      <section className="py-16 bg-white rounded-lg shadow-sm">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Recent Stock Picks
        </h2>
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Symbol</th>
                  <th className="text-left py-3 px-4">Company</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Entry Price</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPicks.slice(0, 5).map((pick) => (
                  <tr key={pick.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-semibold">{pick.symbol}</td>
                    <td className="py-3 px-4">{pick.companyName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        pick.pickType === 'BUY' ? 'bg-green-100 text-green-800' :
                        pick.pickType === 'SELL' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pick.pickType}
                      </span>
                    </td>
                    <td className="py-3 px-4">${pick.entryPrice.toFixed(2)}</td>
                    <td className="py-3 px-4">{new Date(pick.pickDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Subscribe to see all picks and detailed analysis
          </p>
          <Link
            to="/plans"
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Choose Your Plan
          </Link>
        </div>
      </section>
    </div>
  );
};