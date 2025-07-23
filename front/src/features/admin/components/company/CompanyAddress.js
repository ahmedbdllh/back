import React from 'react';

const CompanyAddress = ({ editForm, handleInputChange, company }) => {
  const address = editForm?.address || company?.address || {};
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">Street Address</label>
      <input
        type="text"
        value={address.street || ''}
        onChange={handleInputChange ? e => handleInputChange('address.street', e.target.value) : undefined}
        className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        placeholder="123 Main Street"
        disabled={!handleInputChange}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
          <input
            type="text"
            value={address.city || ''}
            onChange={handleInputChange ? e => handleInputChange('address.city', e.target.value) : undefined}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="City"
            disabled={!handleInputChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
          <input
            type="text"
            value={address.state || ''}
            onChange={handleInputChange ? e => handleInputChange('address.state', e.target.value) : undefined}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="State"
            disabled={!handleInputChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">ZIP Code</label>
          <input
            type="text"
            value={address.zipCode || ''}
            onChange={handleInputChange ? e => handleInputChange('address.zipCode', e.target.value) : undefined}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="12345"
            disabled={!handleInputChange}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
          <input
            type="text"
            value={address.country || ''}
            onChange={handleInputChange ? e => handleInputChange('address.country', e.target.value) : undefined}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            placeholder="Country"
            disabled={!handleInputChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyAddress;
