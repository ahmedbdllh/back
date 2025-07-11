import React from 'react';
import CompanyAddress from './CompanyAddress';
import CompanyLogoUpload from './CompanyLogoUpload';
import CompanyMap from './CompanyMap';

const CompanyDetailsForm = ({ 
  editForm, 
  handleInputChange, 
  uploadLogo, 
  handleFileSelect, 
  selectedFile, 
  uploadingLogo, 
  previewUrl, 
  clearFileSelection, 
  updateCompany, 
  company, 
  setEditing, 
  handleLocationChange,
  // Nominatim props
  addressQuery,
  setAddressQuery,
  handleAddressSearch,
  nominatimResults,
  handleNominatimResultSelect,
  nominatimLoading
}) => (
  <form onSubmit={e => { e.preventDefault(); updateCompany(); }} className="space-y-4 sm:space-y-6">
    {/* Basic Information */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
      <div>
        <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Company Name</label>
        <input
          type="text"
          value={editForm.companyName || ''}
          onChange={e => handleInputChange('companyName', e.target.value)}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          placeholder="Enter company name"
        />
      </div>
    </div>
    <div>
      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Description</label>
      <textarea
        value={editForm.description || ''}
        onChange={e => handleInputChange('description', e.target.value)}
        rows={3}
        className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
        placeholder="Company description..."
      />    </div>
    <CompanyAddress editForm={editForm} handleInputChange={handleInputChange} />

    {/* Nominatim Address Search */}
    <div className="mt-4">
      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Search Address</label>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
          placeholder="Enter address to search..."
          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm sm:text-base placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
        <button
          type="button"
          onClick={handleAddressSearch}
          disabled={nominatimLoading}
          className="px-4 py-2 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm sm:text-base disabled:opacity-50"
        >
          {nominatimLoading ? 'Searching...' : 'Search'}
        </button>
      </div>
      {nominatimResults.length > 0 && (
        <ul className="mt-2 border border-slate-600 rounded-lg bg-slate-800 max-h-60 overflow-y-auto">
          <li className="p-2 text-xs text-slate-400 border-b border-slate-700">Search Results:</li>
          {nominatimResults.map((result) => (
            <li 
              key={result.place_id}
              onClick={() => handleNominatimResultSelect(result)}
              className="p-3 hover:bg-slate-700 cursor-pointer text-sm text-slate-200 border-b border-slate-700 last:border-b-0"
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
    
    {/* Company Location Map */}
    <div>
      <label className="block text-xs sm:text-sm font-medium text-slate-300 mb-1 sm:mb-2">Company Location</label>
      <p className="text-xs text-slate-400 mb-3">Click on the map to set your company's location</p>
      <div className="border border-slate-600 rounded-lg overflow-hidden">
        <CompanyMap 
          position={editForm.location || [36.8065, 10.1815]} 
          onLocationChange={handleLocationChange}
        />
      </div>
    </div>
    
    <CompanyLogoUpload handleFileSelect={handleFileSelect} selectedFile={selectedFile} uploadingLogo={uploadingLogo} uploadLogo={uploadLogo} previewUrl={previewUrl} />
    <div className="flex justify-end space-x-3 pt-6 border-t border-slate-700">
      <button
        type="button"
        onClick={() => {
          setEditing(false);
          clearFileSelection();
        }}
        className="px-6 py-3 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors font-medium"
      >
        Cancel
      </button>
      <button
        type="submit"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
      >
        Save Changes
      </button>
    </div>
  </form>
);

export default CompanyDetailsForm;
