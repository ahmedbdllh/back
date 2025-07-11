import React from 'react';
import { Card } from '../../../../shared/ui/components/Card';

const CompanySkeleton = () => (
  <div className="p-6 bg-[#0F172A] min-h-screen">
    <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8">Company Management</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <Card key={i} variant="glass" className="p-6 animate-pulse">
            <div className="h-6 bg-slate-700 rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-slate-700 rounded w-full"></div>
              <div className="h-4 bg-slate-700 rounded w-2/3"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default CompanySkeleton;
