import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { stockPickApi } from '../services/api';

const StockChart = ({ stockPick }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('1mo');

  useEffect(() => {
    fetchChartData();
  }, [stockPick.symbol, period]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const response = await stockPickApi.getChartData(stockPick.symbol, period);
      
      if (response && response.candles && response.candles.c) {
        const processedData = processChartData(response);
        setChartData(processedData);
        setError(null);
      } else {
        setError('No chart data available');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (rawData) => {
    const { candles, quote } = rawData;
    const { c: closes, o: opens, h: highs, l: lows, v: volumes, t: timestamps } = candles;
    
    return timestamps.map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toLocaleDateString(),
      timestamp: timestamp,
      open: opens[index],
      high: highs[index],
      low: lows[index],
      close: closes[index],
      volume: volumes[index],
      candleColor: closes[index] >= opens[index] ? '#10B981' : '#EF4444' // Green for up, red for down
    }));
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">Open: <span className="font-medium">${data.open?.toFixed(2)}</span></p>
            <p className="text-gray-600">High: <span className="font-medium text-green-600">${data.high?.toFixed(2)}</span></p>
            <p className="text-gray-600">Low: <span className="font-medium text-red-600">${data.low?.toFixed(2)}</span></p>
            <p className="text-gray-600">Close: <span className="font-medium">${data.close?.toFixed(2)}</span></p>
            <p className="text-gray-600">Volume: <span className="font-medium">{data.volume?.toLocaleString()}</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CandlestickBar = (props) => {
    const { payload, x, y, width, height } = props;
    if (!payload || payload.open === undefined) return null;

    const { open, high, low, close } = payload;
    const isUp = close >= open;
    const color = isUp ? '#10B981' : '#EF4444';
    
    const bodyHeight = Math.abs(close - open);
    const bodyY = Math.min(close, open);
    
    // Scale values to chart coordinates
    const scale = height / (high - low || 1);
    const candleX = x + width / 2;
    
    const highY = y - (high - low) * scale + height;
    const lowY = y - (low - low) * scale + height;
    const bodyTopY = y - (Math.max(open, close) - low) * scale + height;
    const bodyBottomY = y - (Math.min(open, close) - low) * scale + height;

    return (
      <g>
        {/* Wick line */}
        <line 
          x1={candleX} 
          y1={highY} 
          x2={candleX} 
          y2={lowY} 
          stroke={color} 
          strokeWidth={1}
        />
        {/* Body rectangle */}
        <rect
          x={candleX - 3}
          y={bodyTopY}
          width={6}
          height={Math.max(bodyBottomY - bodyTopY, 1)}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{stockPick.symbol}</h3>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchChartData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const performance = stockPick.currentPrice && stockPick.entryPrice 
    ? ((stockPick.currentPrice - stockPick.entryPrice) / stockPick.entryPrice * 100).toFixed(2)
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{stockPick.symbol}</h3>
          <p className="text-sm text-gray-600">{stockPick.companyName}</p>
        </div>
        <div className="flex space-x-2">
          {[
            { value: '1d', label: '1D' },
            { value: '5d', label: '5D' },
            { value: '1mo', label: '1M' },
            { value: '3mo', label: '3M' },
            { value: '1y', label: '1Y' }
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1 text-sm rounded ${
                period === p.value 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <p className="text-gray-600">Entry Price</p>
          <p className="font-semibold">${stockPick.entryPrice?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Current Price</p>
          <p className="font-semibold">${stockPick.currentPrice?.toFixed(2) || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-600">Target Price</p>
          <p className="font-semibold">${stockPick.targetPrice?.toFixed(2) || 'N/A'}</p>
        </div>
        <div>
          <p className="text-gray-600">Performance</p>
          <p className={`font-semibold ${performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {performance ? `${performance >= 0 ? '+' : ''}${performance}%` : 'N/A'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <YAxis 
              domain={['dataMin - 5', 'dataMax + 5']}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Entry price line */}
            {stockPick.entryPrice && (
              <ReferenceLine 
                y={stockPick.entryPrice} 
                stroke="#3B82F6" 
                strokeDasharray="5 5"
                label={{ value: "Entry", position: "right" }}
              />
            )}
            
            {/* Target price line */}
            {stockPick.targetPrice && (
              <ReferenceLine 
                y={stockPick.targetPrice} 
                stroke="#10B981" 
                strokeDasharray="5 5"
                label={{ value: "Target", position: "right" }}
              />
            )}
            
            {/* Stop loss line */}
            {stockPick.stopLoss && (
              <ReferenceLine 
                y={stockPick.stopLoss} 
                stroke="#EF4444" 
                strokeDasharray="5 5"
                label={{ value: "Stop", position: "right" }}
              />
            )}

            {/* Price line */}
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#1F2937" 
              strokeWidth={2}
              dot={false}
            />

            {/* Volume bars */}
            <Bar 
              dataKey="volume" 
              fill="#E5E7EB" 
              yAxisId="volume"
              opacity={0.3}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Pick type indicator */}
      <div className="mt-4 text-center">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
          stockPick.pickType === 'BUY' ? 'bg-green-100 text-green-800' :
          stockPick.pickType === 'SELL' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {stockPick.pickType} Signal
        </span>
      </div>
    </div>
  );
};

export default StockChart;