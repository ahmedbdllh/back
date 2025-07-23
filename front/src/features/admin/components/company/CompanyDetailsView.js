import React from 'react';
import CompanyAddress from './CompanyAddress';
import CompanyMap from './CompanyMap';

const CompanyDetailsView = ({ company }) => (
  <div className="space-y-6 sm:space-y-8">
    {/* Description */}
    {company.description && (
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
          Description
        </h3>
        <p className="text-slate-300 leading-relaxed pl-4 sm:pl-5 text-sm sm:text-base">{company.description}</p>      </div>
    )}
    <CompanyAddress company={company} />
    
    {/* Company Location Map */}
    {company.location && Array.isArray(company.location) && company.location.length === 2 && (
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3 flex items-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></div>
          Company Location
        </h3>
        <div className="pl-4 sm:pl-5">
          <div className="border border-slate-600 rounded-lg overflow-hidden">
            <CompanyMap 
              position={company.location} 
              readOnly={true}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Coordinates: {company.location[0].toFixed(6)}, {company.location[1].toFixed(6)}
          </p>
        </div>
      </div>
    )}
  </div>
);

export default CompanyDetailsView;
