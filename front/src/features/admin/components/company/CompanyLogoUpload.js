import React from 'react';

const CompanyLogoUpload = ({ handleFileSelect, selectedFile, uploadingLogo, uploadLogo, previewUrl }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">Company Logo</label>
    <div className="flex items-center space-x-4">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="block w-full text-sm text-slate-400 \
          file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 \
          file:text-sm file:font-semibold file:bg-slate-700 file:text-slate-300 \
          hover:file:bg-slate-600 file:transition-colors cursor-pointer"
      />
      {selectedFile && (
        <button
          type="button"
          onClick={uploadLogo}
          disabled={uploadingLogo}
          className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg transition-colors text-sm font-medium"
        >
          {uploadingLogo ? 'Uploading...' : 'Upload'}
        </button>
      )}
    </div>
    {previewUrl && (
      <div className="mt-3">
        <img src={previewUrl} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-slate-600" />
      </div>
    )}
  </div>
);

export default CompanyLogoUpload;
