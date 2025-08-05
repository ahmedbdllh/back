import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Users, Clock, MoreVertical, Edit, Trash2, Building2, Eye, FileText, Star } from 'lucide-react';
import { useCourtManagement } from '../hooks/useCourtManagement';
import CourtForm from './CourtForm';
import ConfirmDialog from './ConfirmDialog';

export default function CourtManagement({ companyId, companyApproved = false, toast }) {
  const { courts, loading, error, fetchCourts, addCourt, updateCourt, deleteCourt } = useCourtManagement(companyId);  const [showForm, setShowForm] = useState(false);  const [editingCourt, setEditingCourt] = useState(null);
  const [company, setCompany] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, courtId: null, courtName: '' });
  const [showDetails, setShowDetails] = useState({ show: false, court: null });

  useEffect(() => {
    fetchCourts();
    // eslint-disable-next-line
  }, [companyId]);
  useEffect(() => {
    const companies = window.__companiesList || [];
    setCompany(companies.find(c => c._id === companyId || c.id === companyId));
  }, [companyId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    if (openDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);  const handleAddCourt = (courtData) => {
    // Check if company is approved before proceeding
    if (!companyApproved && !editingCourt) {
      toast?.error('Company must be approved before adding courts. Please contact an administrator.');
      return;
    }

    if (editingCourt) {
      updateCourt(editingCourt._id, { ...courtData, companyId })
        .then(() => {
          setShowForm(false);
          setEditingCourt(null);
          fetchCourts();
          toast?.success('Court updated successfully!');
        })
        .catch((error) => {
          toast?.error('Failed to update court: ' + (error.response?.data?.message || error.message));
        });
    } else {
      addCourt({ ...courtData, companyId })
        .then(() => {
          setShowForm(false);
          fetchCourts();
          toast?.success('Court added successfully!');
        })
        .catch((error) => {
          toast?.error('Failed to add court: ' + (error.response?.data?.message || error.message));
        });
    }
  };

  const handleEditCourt = (court) => {
    setEditingCourt(court);
    setShowForm(true);
    setOpenDropdown(null);
  };
  const handleDeleteCourt = (courtId) => {
    const court = courts.find(c => c._id === courtId);
    setDeleteConfirm({ 
      show: true, 
      courtId, 
      courtName: court?.name || 'this court' 
    });
    setOpenDropdown(null);
  };
  const confirmDelete = () => {
    deleteCourt(deleteConfirm.courtId)
      .then(() => {
        fetchCourts();
        toast?.success('Court deleted successfully!');
      })
      .catch((error) => {
        toast?.error('Failed to delete court: ' + (error.response?.data?.message || error.message));
      });
  };

  const handleViewDetails = (court) => {
    setShowDetails({ show: true, court });
    setOpenDropdown(null);
  };

  const toggleDropdown = (courtId) => {
    setOpenDropdown(openDropdown === courtId ? null : courtId);
  };  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6 sm:space-y-8"
    >      {/* Header with Add Court button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="flex justify-end"
      >
        <motion.button 
          onClick={() => {
            if (companyApproved) {
              setEditingCourt(null);
              setShowForm(true);
            }
          }}
          disabled={!companyApproved}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          whileHover={companyApproved ? { 
            scale: 1.05,
            boxShadow: "0 20px 25px -5px rgba(14, 165, 233, 0.4), 0 10px 10px -5px rgba(14, 165, 233, 0.2)"
          } : {}}
          whileTap={companyApproved ? { scale: 0.95 } : {}}
          className={`group relative flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 font-semibold rounded-2xl shadow-lg transition-all duration-300 text-sm sm:text-base overflow-hidden ${
            companyApproved 
              ? 'bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 text-white shadow-blue-500/25 hover:shadow-blue-500/40 cursor-pointer' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed shadow-gray-500/10'
          }`}
          title={!companyApproved ? 'Company must be approved to add courts' : ''}
        >
          {companyApproved && (
            <div className="absolute inset-0 bg-gradient-to-r from-sky-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}
          <motion.div
            whileHover={companyApproved ? { rotate: 90 } : {}}
            transition={{ duration: 0.2 }}
            className="relative z-10"
          >
            <Plus size={18} className="sm:hidden" />
            <Plus size={20} className="hidden sm:block" />
          </motion.div>
          <span className="relative z-10">Add Court</span>
        </motion.button>
      </motion.div>      {/* Court Form Modal */}
      {showForm && company && companyApproved && (
        <CourtForm 
          company={company} 
          court={editingCourt}
          onSubmit={handleAddCourt} 
          onCancel={() => {
            setShowForm(false);
            setEditingCourt(null);
          }} 
          open={showForm} 
        />
      )}{/* Loading State with enhanced animation */}
      {loading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="flex flex-col items-center justify-center py-16 space-y-4"
        >
          <div className="relative">
            <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/60 text-sm"
          >
            Loading courts...
          </motion.p>
        </motion.div>
      )}

      {/* Error State with enhanced styling */}
      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="relative p-6 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5 rounded-2xl animate-pulse"></div>
          <div className="relative flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-red-400 font-medium">Error loading courts</h3>
              <p className="text-red-300/80 text-sm">{error.message}</p>
            </div>
          </div>
        </motion.div>
      )}      {/* Courts Grid with staggered animations */}
      {!loading && !error && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
        >          {courts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="col-span-full text-center py-16 sm:py-20"
            >
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  opacity: [0.4, 0.6, 0.4]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-white/40 mb-6"
              >
                <svg className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </motion.div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl sm:text-2xl font-bold text-white/70 mb-3"
              >
                No courts yet
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-sm sm:text-base text-white/50 mb-6"
              >
                Create your first court to get started with managing your sports facility
              </motion.p>
              <motion.button
                onClick={() => {
                  setEditingCourt(null);
                  setShowForm(true);
                }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300"
              >
                <Plus size={20} />
                Add Your First Court
              </motion.button>
            </motion.div>          ) : (
            courts.map((court, index) => (
              <motion.div
                key={court._id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  delay: index * 0.1,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -8,
                  transition: { duration: 0.2 }
                }}
                className="relative group"
                style={{ zIndex: openDropdown === court._id ? 50 : 1 }}
              >
                <div className="relative p-3 sm:p-4 bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl backdrop-blur-sm hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 transition-all duration-300 group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-blue-500/10 overflow-visible">
                  {/* Animated background glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-blue-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Court Image */}
                  <div className="relative w-full h-32 sm:h-40 bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl mb-3 overflow-hidden group-hover:shadow-lg transition-shadow duration-300">
                    {court.image ? (
                      <motion.img 
                        src={court.image && court.image.startsWith('/uploads') ? `http://localhost:5003${court.image}` : court.image} 
                        alt={court.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <motion.div 
                      className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 ${court.image ? 'hidden' : 'flex'}`}
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-center text-white/50">
                        <motion.svg 
                          className="w-8 h-8 mx-auto mb-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          animate={{ rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </motion.svg>
                        <p className="text-xs">No image</p>
                      </div>
                    </motion.div>
                  </div>

                  {/* Court Info */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-start sm:items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-white flex-1 min-w-0 truncate">{court.name}</h3>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          court.type === 'football' 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-orange-500/20 text-orange-400'
                        }`}>
                          {court.type}
                        </span>
                        {/* 3-dot menu */}
                        <div className="relative">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(court._id);
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <MoreVertical size={14} />
                          </motion.button>
                          
                          {/* Dropdown menu */}
                          <AnimatePresence>
                            {openDropdown === court._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-36 bg-gray-800 backdrop-blur-sm border border-white/20 rounded-lg shadow-xl"
                                style={{ zIndex: 9999 }}
                              >                                <div className="py-1">
                                  <button
                                    onClick={() => handleViewDetails(court)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                  >
                                    <Eye size={12} />
                                    View Details
                                  </button>
                                  <button
                                    onClick={() => handleEditCourt(court)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                                  >
                                    <Edit size={12} />
                                    Edit Court
                                  </button><button
                                    onClick={() => handleDeleteCourt(court._id)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                    Delete Court
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {court.location?.address && (
                      <div className="flex items-center gap-1 text-white/60 text-xs">
                        <MapPin size={10} className="flex-shrink-0" />
                        <span className="truncate">{court.location.address}</span>
                      </div>
                    )}

                    {court.location?.city && (
                      <div className="flex items-center gap-1 text-white/50 text-xs">
                        <Building2 size={10} className="flex-shrink-0" />
                        <span className="truncate">{court.location.city}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1 text-white/60">
                        <Users size={10} className="flex-shrink-0" />
                        <span className="whitespace-nowrap">{court.maxPlayersPerTeam} per team</span>
                      </div>
                      {court.matchTime && (
                        <div className="flex items-center gap-1 text-white/60">
                          <Clock size={10} className="flex-shrink-0" />
                          <span className="whitespace-nowrap">{court.matchTime}min</span>
                        </div>
                      )}
                    </div>

                    {court.description && (
                      <p className="text-white/50 text-xs line-clamp-1">{court.description}</p>
                    )}

                    {court.amenities && court.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {court.amenities.slice(0, 2).map((amenity, i) => (
                          <span key={i} className="px-1 py-0.5 bg-sky-500/20 text-sky-300 text-xs rounded-md">
                            {amenity}
                          </span>
                        ))}
                        {court.amenities.length > 2 && (
                          <span className="px-1 py-0.5 bg-gray-500/20 text-gray-400 text-xs rounded-md">
                            +{court.amenities.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, courtId: null, courtName: '' })}
        onConfirm={confirmDelete}
        title="Delete Court"
        message={`Are you sure you want to delete "${deleteConfirm.courtName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"      />

      {/* Court Details Modal */}
      <AnimatePresence>
        {showDetails.show && showDetails.court && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowDetails({ show: false, court: null })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{showDetails.court.name}</h2>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    showDetails.court.type === 'football' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-orange-500/20 text-orange-400'
                  }`}>
                    {showDetails.court.type}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetails({ show: false, court: null })}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Court Image */}
              {showDetails.court.image && (
                <div className="mb-6">
                  <img 
                    src={showDetails.court.image.startsWith('/uploads') ? `http://localhost:5003${showDetails.court.image}` : showDetails.court.image}
                    alt={showDetails.court.name}
                    className="w-full h-64 object-cover rounded-xl"
                  />
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Location */}
                {(showDetails.court.location?.address || showDetails.court.location?.city) && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <MapPin size={16} />
                      Location
                    </h3>
                    {showDetails.court.location?.address && (
                      <p className="text-white/70">{showDetails.court.location.address}</p>
                    )}
                    {showDetails.court.location?.city && (
                      <p className="text-white/60 flex items-center gap-2">
                        <Building2 size={14} />
                        {showDetails.court.location.city}
                      </p>
                    )}
                  </div>
                )}

                {/* Players & Time */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Users size={16} />
                    Capacity
                  </h3>
                  <p className="text-white/70">{showDetails.court.maxPlayersPerTeam} players per team</p>
                  {showDetails.court.matchTime && (
                    <p className="text-white/60 flex items-center gap-2">
                      <Clock size={14} />
                      {showDetails.court.matchTime} minutes per match
                    </p>
                  )}
                </div>

                {/* Description */}
                {showDetails.court.description && (
                  <div className="md:col-span-2 space-y-2">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <FileText size={16} />
                      Description
                    </h3>
                    <p className="text-white/70">{showDetails.court.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {showDetails.court.amenities && showDetails.court.amenities.length > 0 && (
                  <div className="md:col-span-2 space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Star size={16} />
                      Amenities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {showDetails.court.amenities.map((amenity, i) => (
                        <span key={i} className="px-3 py-1 bg-sky-500/20 text-sky-300 text-sm rounded-lg">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
                <button
                  onClick={() => {
                    handleEditCourt(showDetails.court);
                    setShowDetails({ show: false, court: null });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit size={16} />
                  Edit Court
                </button>
                <button
                  onClick={() => {
                    handleDeleteCourt(showDetails.court._id);
                    setShowDetails({ show: false, court: null });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  Delete Court
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
