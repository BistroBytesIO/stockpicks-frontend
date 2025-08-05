import React from 'react';
import StockChart from './StockChart';

const StockChartsGrid = ({ stockPicks }) => {
  if (!stockPicks || stockPicks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <p className="text-gray-500">No stock picks available to display charts for.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Stock Charts</h2>
        <p className="text-sm text-gray-600">
          Real-time market data
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stockPicks.map((stockPick) => (
          <StockChart 
            key={stockPick.id} 
            stockPick={stockPick}
          />
        ))}
      </div>
    </div>
  );
};

export default StockChartsGrid;