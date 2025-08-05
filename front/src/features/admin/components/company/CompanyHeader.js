import React from 'react';
import { Icons } from '../../../../shared/ui/components/Icons';

const CompanyHeader = ({ company, editing, onEdit, onSave, onCancel, onFileSelect, selectedFile, uploadingLogo, uploadLogo, clearFileSelection, setEditing, onDelete }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center space-x-4 sm:space-x-6">
      {/* Company Logo */}
      <div className="relative group">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-700 rounded-xl flex items-center justify-center overflow-hidden border border-slate-600">
          {company.logo && company.logo !== '/assets/logos/default-company-logo.svg' ? (
            (() => {
              const logoUrl = company.logo.startsWith('/uploads/')
                ? `http://localhost:5001${company.logo}?t=${Date.now()}`
                : company.logo;
              console.log('Company logo src:', logoUrl);
              return (
                <a href={logoUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={logoUrl}
                    alt={company.companyName}
                    className="w-full h-full object-cover cursor-pointer"
                    onError={e => {
                      console.log('Logo failed to load:', logoUrl);
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                </a>
              );
            })()
          ) : null}
          <div className={`w-full h-full bg-slate-700 flex items-center justify-center ${company.logo && company.logo !== '/assets/logos/default-company-logo.svg' ? 'hidden' : ''}`}>
            <Icons.Building2 className="w-6 h-6 text-slate-400" />
          </div>
        </div>
        {editing && (
          <label className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Icons.Camera className="w-5 h-5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={onFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>
      {/* Company Info */}
      <div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">{company.companyName}</h2>
          <span className={`inline-block px-3 py-1 text-xs sm:text-sm font-semibold rounded-full mt-2 ${
            company.status === 'Active'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : company.status === 'Pending'
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              : 'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {company.status}
          </span>
        </div>
      </div>
    </div>
    {/* Actions */}
    <div className="flex space-x-3 mt-2 sm:mt-0">
      {editing ? (
        <>
          <button
            onClick={onSave}
            className="flex items-center space-x-1 sm:space-x-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <Icons.Save className="w-4 h-4 sm:block" />
            <span>Save</span>
          </button>
          <button
            onClick={onCancel}
            className="flex items-center space-x-1 sm:space-x-2 bg-slate-600 hover:bg-slate-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <Icons.X className="w-4 h-4 sm:block" />
            <span>Cancel</span>
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onEdit}
            className="flex items-center space-x-1 sm:space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
          >
            <Icons.Edit className="w-4 h-4 sm:block" />
            <span>Edit</span>
          </button>
          {company && onDelete && (
            <button
              onClick={onDelete}
              className="flex items-center space-x-1 sm:space-x-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm sm:text-base"
            >
              <Icons.Trash2 className="w-4 h-4 sm:block" />
              <span>Delete</span>
            </button>
          )}
        </>
      )}
    </div>
  </div>
);

export default CompanyHeader;
