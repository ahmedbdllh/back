import React from 'react';
import { MapPin, Star, Users, Clock } from 'lucide-react';
import { ComplaintFlagButton } from '../../complaints';

// Example of how to integrate ComplaintFlagButton into existing court cards
const EnhancedCourtCard = ({ court, onClick }) => {
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/placeholder.jpg';
    if (imagePath.startsWith('/uploads')) {
      return `http://localhost:5003${imagePath}`;
    }
    return imagePath;
  };

  const courtTypeColors = {
    football: 'from-green-500 to-emerald-600',
    paddle: 'from-blue-500 to-cyan-600',
    basketball: 'from-orange-500 to-red-600',
    tennis: 'from-purple-500 to-indigo-600'
  };

  return (
    <div 
      className="group relative bg-gray-800/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:transform hover:scale-[1.02] cursor-pointer"
      onClick={onClick}
    >
      {/* Court Image */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={getImageUrl(court.images?.[0])}
          alt={court.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.target.src = '/placeholder.jpg';
          }}
        />
        
        {/* Sport Type Badge */}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${courtTypeColors[court.type] || 'from-gray-500 to-gray-600'}`}>
          {court.type?.charAt(0).toUpperCase() + court.type?.slice(1) || 'Sport'}
        </div>

        {/* Complaint Flag Button - Positioned in top right */}
        <div className="absolute top-4 right-4 z-10">
          <ComplaintFlagButton
            relatedTo={{
              type: 'court',
              referenceId: court._id,
              referenceName: court.name
            }}
            variant="icon"
            size="sm"
            className="bg-black/20 backdrop-blur-sm hover:bg-red-500/20"
          />
        </div>

        {/* Price overlay */}
        {court.pricePerHour && (
          <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-sm font-medium">
            ${court.pricePerHour}/hour
          </div>
        )}
      </div>

      {/* Court Details */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
            {court.name}
          </h3>
          {court.rating && (
            <div className="flex items-center gap-1">
              <Star className="text-yellow-400 fill-current" size={16} />
              <span className="text-white text-sm font-medium">{court.rating}</span>
            </div>
          )}
        </div>

        {/* Location */}
        {court.location && (
          <div className="flex items-center gap-2 text-gray-300 mb-3">
            <MapPin size={16} className="text-blue-400" />
            <span className="text-sm">
              {court.location.address}, {court.location.city}
            </span>
          </div>
        )}

        {/* Court Features */}
        <div className="flex items-center gap-4 text-gray-400 text-sm mb-4">
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>Up to {court.capacity || '8'} players</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={16} />
            <span>{court.operatingHours?.open || '6:00'} - {court.operatingHours?.close || '22:00'}</span>
          </div>
        </div>

        {/* Amenities */}
        {court.amenities && court.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {court.amenities.slice(0, 3).map((amenity, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-md text-xs"
              >
                {amenity}
              </span>
            ))}
            {court.amenities.length > 3 && (
              <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-md text-xs">
                +{court.amenities.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Report Issue Button - Alternative placement */}
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <ComplaintFlagButton
            relatedTo={{
              type: 'court',
              referenceId: court._id,
              referenceName: court.name
            }}
            variant="text"
            size="sm"
            className="w-full justify-center"
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedCourtCard;
