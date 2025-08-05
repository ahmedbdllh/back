import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, Clock, Star, Building2, Search, ChevronDown, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCourts } from '../../../../court/services/courtService';
import { Container } from '../../../../../shared/ui/components/Container';
import BookingCalendar from '../../../../booking/components/BookingCalendar';
import { useToast, ToastContainer } from '../../../../../shared/ui/components/Toast';

export default function CourtsPage() {
  const navigate = useNavigate();
  const { success, toasts, removeToast } = useToast();
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [bookingCalendarOpen, setBookingCalendarOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);

  // User state management (similar to Navbar pattern)
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);

  // Load user from localStorage
  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setUserRole(userData.role);
        console.log('CourtsPage - User loaded:', userData);
        console.log('CourtsPage - User role:', userData.role);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
  }, []);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const response = await getCourts();
      setCourts(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load courts. Please try again later.');
      console.error('Error fetching courts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique cities and court types for filters
  const cities = [...new Set(courts.map(court => court.location?.city).filter(Boolean))];
  const courtTypes = [...new Set(courts.map(court => court.type).filter(Boolean))];

  // Filter courts based on search and filters
  const filteredCourts = courts.filter(court => {
    const matchesSearch = court.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.location?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         court.location?.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || court.type === selectedType;
    const matchesCity = selectedCity === 'all' || court.location?.city === selectedCity;
    
    return matchesSearch && matchesType && matchesCity;
  });

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

  const handleBookCourt = (court) => {
    setSelectedCourt(court);
    setBookingCalendarOpen(true);
  };

  const handleComplaintClick = (court) => {
    // Navigate to complaint form with court information
    console.log('Complaint clicked for court:', court);
    navigate('/complaints/new', { 
      state: { 
        relatedTo: {
          type: 'court',
          referenceId: court._id,
          referenceName: court.name,
          location: court.location,
          companyId: court.companyId,
          companyName: court.company?.companyName
        }
      }
    });
  };

  const handleBookingComplete = (booking) => {
    // Handle successful booking
    console.log('Booking completed:', booking);
    // Show success toast instead of alert
    success('Booking created successfully! You will receive a confirmation email.');
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
            <h2 className="text-2xl font-bold text-white mt-6">Loading Courts...</h2>
            <p className="text-white/60 mt-2">Please wait while we fetch the latest courts</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <Container className="py-20">
          <div className="text-center py-20">
            <div className="text-red-400 mb-4">
              <Building2 size={64} className="mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Failed to Load Courts</h2>
            <p className="text-white/60 mb-6">{error}</p>
            <button 
              onClick={fetchCourts}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-20">
        <div className="absolute inset-0 bg-black/30"></div>
        <Container className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Discover Amazing Courts
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Find the perfect court for your next game. From football to paddle, we have it all.
            </p>
          </motion.div>
        </Container>
      </div>

      <Container className="py-12">
        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:gap-6"
        >
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40" size={20} />
            <input
              type="text"
              placeholder="Search courts by name, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            {/* Court Type Filter */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer"
              >
                <option value="all" className="bg-gray-900 text-white">All Types</option>
                {courtTypes.map(type => (
                  <option key={type} value={type} className="bg-gray-900 text-white capitalize">
                    {type}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={16} />
            </div>

            {/* City Filter */}
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="appearance-none bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-sm cursor-pointer"
              >
                <option value="all" className="bg-gray-900 text-white">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city} className="bg-gray-900 text-white">
                    {city}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 pointer-events-none" size={16} />
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <p className="text-white/70">
            {filteredCourts.length} court{filteredCourts.length !== 1 ? 's' : ''} found
          </p>
        </motion.div>

        {/* Courts Grid */}
        <AnimatePresence mode="wait">
          {filteredCourts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <Building2 size={64} className="mx-auto text-white/40 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Courts Found</h3>
              <p className="text-white/60">
                {searchTerm || selectedType !== 'all' || selectedCity !== 'all'
                  ? 'Try adjusting your search criteria'
                  : 'No courts are available at the moment'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >              {filteredCourts.map((court, index) => (
                <motion.div
                  key={court._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/courts/${court._id}`)}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm hover:bg-white/10 transition-all duration-300 group cursor-pointer transform hover:scale-105"
                >
                  {/* Court Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={getImageUrl(court.image)}
                      alt={court.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = '/placeholder.jpg';
                      }}
                    />
                    {/* Court Type Badge */}
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-white text-sm font-medium bg-gradient-to-r ${courtTypeColors[court.type] || 'from-gray-500 to-gray-600'}`}>
                      {court.type?.charAt(0).toUpperCase() + court.type?.slice(1)}
                    </div>
                  </div>                  {/* Court Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {court.name}
                    </h3>
                      {/* Company Name */}
                    {court.company && (
                      <div className="flex items-center text-blue-300 mb-2">
                        <Building2 size={14} className="mr-2 flex-shrink-0" />
                        <span className="text-xs font-medium truncate">
                          {court.company.companyName}
                        </span>
                      </div>
                    )}
                    
                    {/* Rating */}
                    <div className="flex items-center mb-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= Math.round(court.averageRating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'fill-gray-600 text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-white/70 text-sm ml-2">
                        {court.averageRating ? `${court.averageRating.toFixed(1)} (${court.totalRatings || 0})` : 'No ratings yet'}
                      </span>
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center text-white/70 mb-3">
                      <MapPin size={16} className="mr-2 flex-shrink-0" />
                      <span className="text-sm truncate">
                        {court.location?.address}, {court.location?.city}
                      </span>
                    </div>

                    {/* Court Info */}
                    <div className="flex items-center justify-between text-white/60 text-sm mb-4">
                      <div className="flex items-center">
                        <Users size={16} className="mr-1" />
                        <span>{court.maxPlayersPerTeam} per team</span>
                      </div>
                      {court.matchTime && (
                        <div className="flex items-center">
                          <Clock size={16} className="mr-1" />
                          <span>{court.matchTime}min</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {court.description && (
                      <p className="text-white/70 text-sm line-clamp-2 mb-4">
                        {court.description}
                      </p>
                    )}

                    {/* Amenities */}
                    {court.amenities && court.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {court.amenities.slice(0, 3).map((amenity, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full"
                          >
                            {amenity}
                          </span>
                        ))}
                        {court.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                            +{court.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courts/${court._id}`);
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookCourt(court);
                        }}
                        className="px-4 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-xl hover:from-green-500 hover:to-green-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      >
                        Book
                      </button>
                      
                      {/* Flag button - Only visible for players */}
                      {user && user.role?.toLowerCase() === 'player' && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Flag clicked - User:', user);
                            handleComplaintClick(court);
                          }}
                          className="px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-xl hover:from-red-500 hover:to-red-400 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          title="Report Court Issue"
                        >
                          <Flag size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </Container>

      {/* Booking Calendar Modal */}
      <BookingCalendar
        court={selectedCourt}
        isOpen={bookingCalendarOpen}
        onClose={() => {
          setBookingCalendarOpen(false);
          setSelectedCourt(null);
        }}
        onBookingComplete={handleBookingComplete}
      />
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
