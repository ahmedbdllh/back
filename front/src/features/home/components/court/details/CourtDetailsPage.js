import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Users, Clock, Star, Building2, ArrowLeft, Calendar, 
  Shield, Wifi, Car, Droplets, Coffee, Heart, Share2,
  ChevronLeft, ChevronRight, Phone, Mail, ExternalLink, Navigation
} from 'lucide-react';
import { getCourtById } from '../../../../court/services/courtService';
import { Container } from '../../../../../shared/ui/components/Container';
import CourtMapWithCustomRoute from '../map/CourtMapWithCustomRoute';

const amenityIcons = {
  'Water': Droplets,
  'WiFi': Wifi,
  'Parking': Car,
  'Showers': Droplets,
  'Locker rooms': Building2,
  'First Aid': Shield,
  'Seating': Users,
  'Snack Bar': Coffee
};

export default function CourtDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showRoute, setShowRoute] = useState(false);

  useEffect(() => {
    fetchCourtDetails();
  }, [id]);

  const fetchCourtDetails = async () => {
    try {
      setLoading(true);
      const response = await getCourtById(id);
      setCourt(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load court details. Please try again later.');
      console.error('Error fetching court details:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // For now, we'll create a mock image gallery (you can extend this later)
  const images = [court?.image].filter(Boolean);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Container className="py-20">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-cyan-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <h2 className="text-2xl font-bold text-white mt-6">Loading Court Details...</h2>
            <p className="text-white/60 mt-2">Please wait while we fetch the court information</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !court) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Container className="py-20">
          <div className="text-center py-20">
            <div className="text-red-400 mb-4">
              <Building2 size={64} className="mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Court Not Found</h2>
            <p className="text-white/60 mb-6">{error || 'The court you are looking for does not exist.'}</p>
            <button 
              onClick={() => navigate('/courts')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Courts
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Container className="py-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/courts')}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Courts</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="relative h-96 rounded-2xl overflow-hidden group">
              <img
                src={getImageUrl(images[currentImageIndex] || court.image)}
                alt={court.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/placeholder.jpg';
                }}
              />
              
              {/* Image Navigation (if multiple images) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRight size={20} />
                  </button>
                  
                  {/* Image Indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Court Type Badge */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${courtTypeColors[court.type] || 'from-gray-500 to-gray-600'}`}>
                {court.type?.charAt(0).toUpperCase() + court.type?.slice(1)}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => setIsLiked(!isLiked)}
                  className={`p-2 rounded-full backdrop-blur-sm transition-colors ${
                    isLiked 
                      ? 'bg-red-500/80 text-white' 
                      : 'bg-black/50 text-white hover:bg-black/70'
                  }`}
                >
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
                <button className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition-colors">
                  <Share2 size={20} />
                </button>
              </div>
            </div>            {/* Location Map */}
            <div className="space-y-4">
              {/* Map Controls */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRoute(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !showRoute 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <MapPin size={16} className="inline mr-2" />
                  View Location
                </button>                <button
                  onClick={() => setShowRoute(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showRoute 
                      ? 'bg-green-600 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  <Navigation size={16} className="inline mr-2" />
                  Get Route
                </button>
              </div>              {/* Map Container */}
              <div className="h-96 md:h-[500px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <CourtMapWithCustomRoute 
                  court={court} 
                  showRoute={showRoute} 
                  onToggleRoute={() => setShowRoute(!showRoute)}
                />
              </div>
            </div>
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Court Title */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                {court.name}
              </h1>
              <div className="flex items-center text-white/70 mb-4">
                <MapPin size={18} className="mr-2" />
                <span>{court.location?.address}, {court.location?.city}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-blue-400" />
                  <span className="text-white/70 text-sm">Capacity</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {court.maxPlayersPerTeam} per team
                </p>
              </div>
              
              {court.matchTime && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock size={20} className="text-green-400" />
                    <span className="text-white/70 text-sm">Match Duration</span>
                  </div>
                  <p className="text-xl font-bold text-white">
                    {court.matchTime} minutes
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {court.description && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-3">About This Court</h3>
                <p className="text-white/70 leading-relaxed">{court.description}</p>
              </div>
            )}

            {/* Amenities */}
            {court.amenities && court.amenities.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Amenities</h3>
                <div className="grid grid-cols-2 gap-3">
                  {court.amenities.map((amenity, index) => {
                    const IconComponent = amenityIcons[amenity] || Star;
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <IconComponent size={18} className="text-blue-400" />
                        <span className="text-white/70">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Booking Section */}
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Book This Court</h3>
              <div className="space-y-4">
                <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50 flex items-center justify-center gap-2">
                  <Calendar size={20} />
                  Book Now
                </button>
                <button className="w-full py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-all duration-200">
                  Check Availability
                </button>
              </div>
            </div>
          </motion.div>
        </div>        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Company Information */}
          {court.company && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Managed By</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 size={18} className="text-blue-400 mt-1" />
                  <div>
                    <p className="text-white font-medium">{court.company.companyName}</p>
                    {court.company.description && (
                      <p className="text-white/70 text-sm mt-1">{court.company.description}</p>
                    )}
                  </div>
                </div>
                
                {court.company.contactInfo?.email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-green-400" />
                    <a 
                      href={`mailto:${court.company.contactInfo.email}`}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      {court.company.contactInfo.email}
                    </a>
                  </div>
                )}
                
                {court.company.contactInfo?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-purple-400" />
                    <a 
                      href={`tel:${court.company.contactInfo.phone}`}
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      {court.company.contactInfo.phone}
                    </a>
                  </div>
                )}
                
                {court.company.website && (
                  <div className="flex items-center gap-3">
                    <ExternalLink size={18} className="text-cyan-400" />
                    <a 
                      href={court.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/70 hover:text-white transition-colors"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location Details */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Location & Access</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-blue-400 mt-1" />
                <div>
                  <p className="text-white font-medium">Address</p>
                  <p className="text-white/70">{court.location?.address}</p>
                  <p className="text-white/70">{court.location?.city}</p>
                  {court.company?.address && (
                    <p className="text-white/60 text-sm mt-1">
                      Company: {court.company.address.street}, {court.company.address.city}
                    </p>
                  )}
                </div>
              </div>
              {court.amenities?.includes('Parking') && (
                <div className="flex items-center gap-3">
                  <Car size={18} className="text-green-400" />
                  <span className="text-white/70">Parking Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Court Rules */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Court Rules</h3>
            <div className="space-y-2 text-white/70">
              <p>• Maximum {court.maxPlayersPerTeam} players per team</p>
              {court.matchTime && <p>• Match duration: {court.matchTime} minutes</p>}
              <p>• Proper sports attire required</p>
              <p>• No smoking on court premises</p>
              <p>• Respect other players and equipment</p>
            </div>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
