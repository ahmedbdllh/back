import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Building, Type, Users, Upload, FileText, Star, Clock } from 'lucide-react';
import Modal from './Modal';

const availableAmenities = [
  'Water', 'WiFi', 'Parking', 'Showers', 'Locker rooms', 
  'First Aid', 'Seating', 'Snack Bar'
];

export default function CourtForm({ company, court, onSubmit, onCancel, open }) {
  const [form, setForm] = useState({
    name: '',
    location: {
      address: '',
      city: ''
    },
    type: 'football',
    maxPlayersPerTeam: 5,
    image: null,
    description: '',
    amenities: [],
    matchTime: 60
  });  useEffect(() => {
    if (court) {
      // Editing existing court - populate form with court data
      setForm({
        name: court.name || '',
        location: {
          address: court.location?.address || '',
          city: court.location?.city || ''
        },
        type: court.type || 'football',
        maxPlayersPerTeam: court.maxPlayersPerTeam || 5,
        image: court.image || null,
        description: court.description || '',
        amenities: court.amenities || [],
        matchTime: court.matchTime || 60
      });
    } else if (company) {
      // Creating new court - use company address
      setForm(f => ({
        ...f,
        location: {
          address: company.address?.street || company.address || '',
          city: company.address?.city || company.city || ''
        }
      }));
    }
  }, [company, court]);
  const handleChange = e => {
    const { name, value } = e.target;
    if (name.startsWith('location.')) {
      const locField = name.split('.')[1];
      setForm(f => ({ ...f, location: { ...f.location, [locField]: value } }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };  const handleImageUpload = e => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, image: file }));
    }
  };

  const triggerFileUpload = () => {
    document.getElementById('court-image-upload')?.click();
  };

  const getImagePreviewUrl = () => {
    if (form.image instanceof File) {
      return URL.createObjectURL(form.image);
    } else if (form.image && form.image.startsWith('/uploads')) {
      return `http://localhost:5003${form.image}`;
    } else if (form.image) {
      return form.image;
    }
    return null;
  };

  const toggleAmenity = (amenity) => {
    setForm(f => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter(a => a !== amenity)
        : [...f.amenities, amenity]
    }));
  };  const handleSubmit = e => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputClass = "w-full px-4 py-3 bg-gray-800/80 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 transition-all duration-200 hover:bg-gray-800 backdrop-blur-sm";
  const labelClass = "block text-sm font-medium text-white/90 mb-2";

  return (
    <Modal open={open} onClose={onCancel} title={court ? `Edit ${court.name}` : `Add Court for ${company?.companyName || company?.name || ''}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Court Name */}
          <div className="md:col-span-2">
            <label className={labelClass}>
              <Building className="inline mr-2" size={16} />
              Court Name
            </label>
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              placeholder="Enter court name"
              className={inputClass}
              required 
            />
          </div>          {/* Address (from company) */}
          <div>
            <label className={labelClass}>
              <MapPin className="inline mr-2" size={16} />
              Address
            </label>
            <input 
              name="location.address" 
              value={form.location.address || ''} 
              onChange={handleChange} 
              placeholder="Address from company"
              className={inputClass}
              readOnly
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', cursor: 'not-allowed' }}
            />
          </div>

          {/* City (from company) */}
          <div>
            <label className={labelClass}>
              <Building className="inline mr-2" size={16} />
              City
            </label>
            <input 
              name="location.city" 
              value={form.location.city || ''} 
              onChange={handleChange} 
              placeholder="City from company"
              className={inputClass}
              readOnly
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', cursor: 'not-allowed' }}
            />
          </div>

          {/* Type */}
          <div>
            <label className={labelClass}>
              <Type className="inline mr-2" size={16} />
              Court Type
            </label>            <select 
              name="type" 
              value={form.type} 
              onChange={handleChange} 
              className={`${inputClass} cursor-pointer`}
              required
            >
              <option value="football" className="bg-gray-900 text-white py-2">Football</option>
              <option value="paddle" className="bg-gray-900 text-white py-2">Paddle</option>
            </select>
          </div>

          {/* Max Players */}
          <div>
            <label className={labelClass}>
              <Users className="inline mr-2" size={16} />
              Max Players Per Team
            </label>
            <input 
              name="maxPlayersPerTeam" 
              type="number" 
              value={form.maxPlayersPerTeam} 
              onChange={handleChange} 
              min={1} 
              className={inputClass}
              required 
            />
          </div>          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className={labelClass}>
              <Upload className="inline mr-2" size={16} />
              Court Image
            </label>            <div className="relative">
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="court-image-upload"
              /><div 
                className={`${inputClass} flex items-center justify-center min-h-[120px] border-2 border-dashed border-white/20 hover:border-white/40 transition-colors cursor-pointer overflow-hidden relative`}
                onClick={triggerFileUpload}
              >
                {form.image ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src={getImagePreviewUrl()} 
                      alt="Court preview" 
                      className="max-h-full max-w-full object-contain rounded-lg"
                      onError={() => {
                        // Fallback if image fails to load
                        setForm(f => ({ ...f, image: null }));
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload size={24} className="mx-auto mb-2 text-white/40" />
                    <p className="text-white/60 text-sm">Click to upload court image</p>
                    <p className="text-white/40 text-xs">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className={labelClass}>
              <FileText className="inline mr-2" size={16} />
              Description
            </label>
            <textarea 
              name="description" 
              value={form.description} 
              onChange={handleChange} 
              placeholder="Court description..."
              rows={3}
              className={inputClass}
            />
          </div>          {/* Amenities as Tags */}
          <div className="md:col-span-2">
            <label className={labelClass}>
              <Star className="inline mr-2" size={16} />
              Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availableAmenities.map(amenity => (
                <motion.button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                    form.amenities.includes(amenity)
                      ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {amenity}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Match Time */}
          <div className="md:col-span-2">
            <label className={labelClass}>
              <Clock className="inline mr-2" size={16} />
              Match Time (minutes)
            </label>
            <input 
              name="matchTime" 
              type="number" 
              value={form.matchTime} 
              onChange={handleChange} 
              min={10} 
              className={inputClass}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-white/10">
          <motion.button 
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-200"
          >
            {court ? 'Update Court' : 'Add Court'}
          </motion.button>
          <motion.button 
            type="button" 
            onClick={onCancel}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 px-6 bg-white/5 text-white/80 font-semibold rounded-xl border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            Cancel
          </motion.button>
        </div>
      </form>
    </Modal>
  );
}
