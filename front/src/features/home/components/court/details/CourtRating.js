import React, { useState, useEffect, useCallback } from 'react';
import { Star, User, MessageCircle, Edit, Trash2, Send } from 'lucide-react';
import { addRating, updateRating, deleteRating, getCourtRatings } from '../../../../court/services/courtService';

const StarRating = ({ rating, onRatingChange, readonly = false, size = 'medium' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6'
  };

  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            readonly 
              ? 'cursor-default' 
              : 'cursor-pointer hover:scale-110 transition-transform'
          } ${
            star <= (hoverRating || rating)
              ? 'fill-yellow-400 text-yellow-400'
              : 'fill-gray-300 text-gray-300'
          }`}          onClick={(e) => {
            e.stopPropagation();
            if (!readonly && onRatingChange) {
              onRatingChange(star);
            }
          }}
          onMouseEnter={(e) => {
            e.stopPropagation();
            if (!readonly) {
              setHoverRating(star);
            }
          }}
          onMouseLeave={(e) => {
            e.stopPropagation();
            if (!readonly) {
              setHoverRating(0);
            }
          }}
        />
      ))}
    </div>
  );
};

const CourtRating = ({ courtId, court }) => {
  const [ratings, setRatings] = useState([]);
  const [averageRating, setAverageRating] = useState(court?.averageRating || 0);
  const [totalRatings, setTotalRatings] = useState(court?.totalRatings || 0);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRating, setEditingRating] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showRatingForm, setShowRatingForm] = useState(false);

  const loadRatings = useCallback(async () => {
    try {
      const response = await getCourtRatings(courtId);
      setRatings(response.data.ratings);
      setAverageRating(response.data.averageRating);
      setTotalRatings(response.data.totalRatings);
      
      // Check if current user has already rated
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      const userId = user?._id || user?.id;
      const existingRating = response.data.ratings.find(r => userId && (r.userId._id === userId || r.userId.id === userId));
      if (existingRating) {
        setUserRating(existingRating.rating);
        setUserComment(existingRating.comment);
      }
    } catch (error) {
      console.error('Error loading ratings:', error);
    }
  }, [courtId]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const token = localStorage.getItem('token');
    
    // Try to decode token to get user ID if user object doesn't have it
    if (token && user && !user._id && !user.id) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.id) {
          user._id = payload.id;
          user.id = payload.id;
        }
      } catch (e) {
        // Token decode failed, continue without ID
      }
    }
    
    setCurrentUser(user || {});
    loadRatings();
  }, [courtId, loadRatings]);

  const getUserId = (user) => user?._id || user?.id;

  const handleSubmitRating = async () => {
    const currentUserId = getUserId(currentUser);
    if (!currentUser || !currentUserId) {
      alert('Please sign in to rate this court');
      return;
    }

    if (userRating === 0) {
      alert('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      const ratingData = {
        rating: userRating,
        comment: userComment
      };

      if (editingRating) {
        await updateRating(courtId, editingRating._id, ratingData);
        setEditingRating(null);
      } else {
        await addRating(courtId, ratingData);
      }

      await loadRatings();
      setShowRatingForm(false);
      setUserRating(0);
      setUserComment('');
    } catch (error) {
      alert(error.response?.data?.error || error.message || 'Error submitting rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRating = async (rating) => {
    if (window.confirm('Are you sure you want to delete your rating?')) {
      try {
        await deleteRating(courtId, rating._id);
        await loadRatings();
        setUserRating(0);
        setUserComment('');
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting rating');
      }
    }
  };

  const handleEditRating = (rating) => {
    setEditingRating(rating);
    setUserRating(rating.rating);
    setUserComment(rating.comment);
    setShowRatingForm(true);
  };

  const userHasRated = ratings.some(r => {
    const currentUserId = getUserId(currentUser);
    return currentUserId && (r.userId._id === currentUserId || r.userId.id === currentUserId);
  });
  return (
    <div 
      className="bg-white/10 backdrop-blur-sm rounded-xl p-6 space-y-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Ratings & Reviews</h3>        {currentUser && getUserId(currentUser) && !userHasRated && !showRatingForm && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRatingForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add Rating
          </button>
        )}
      </div>

      {/* Average Rating Display */}
      <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-white">{averageRating.toFixed(1)}</div>
          <StarRating rating={Math.round(averageRating)} readonly size="small" />
        </div>
        <div className="text-white/80">
          <div className="text-sm">Based on {totalRatings} rating{totalRatings !== 1 ? 's' : ''}</div>
        </div>
      </div>      {/* Rating Form */}
      {showRatingForm && currentUser && getUserId(currentUser) && (
        <div className="bg-white/5 rounded-lg p-4 space-y-4">
          <h4 className="text-lg font-semibold text-white">
            {editingRating ? 'Edit Your Rating' : 'Rate This Court'}
          </h4>
          
          <div className="space-y-2">
            <label className="text-white/80 text-sm">Your Rating</label>
            <StarRating rating={userRating} onRatingChange={setUserRating} />
          </div>

          <div className="space-y-2">
            <label className="text-white/80 text-sm">Comment (Optional)</label>
            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex space-x-3">            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubmitRating();
              }}
              disabled={isSubmitting || userRating === 0}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Send size={16} />
              <span>{isSubmitting ? 'Submitting...' : (editingRating ? 'Update' : 'Submit')}</span>
            </button>            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRatingForm(false);
                setEditingRating(null);
                setUserRating(0);
                setUserComment('');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.length === 0 ? (
          <div className="text-center text-white/60 py-8">
            <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>No ratings yet. Be the first to rate this court!</p>
          </div>
        ) : (
          ratings.map((rating) => (
            <div key={rating._id} className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center overflow-hidden">
                    {rating.userId.profileImage ? (
                      <img
                        src={`http://localhost:5000${rating.userId.profileImage}`}
                        alt={rating.userId.fullName || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${rating.userId.profileImage ? 'hidden' : 'flex'}`}>
                      <User size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      {rating.userId.fullName || rating.userId.email}
                    </div>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={rating.rating} readonly size="small" />
                      <span className="text-white/60 text-sm">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {currentUser && getUserId(currentUser) === (rating.userId._id || rating.userId.id) && (
                  <div className="flex space-x-2">                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditRating(rating);
                      }}
                      className="text-blue-400 hover:text-blue-300 p-1"
                      title="Edit rating"
                    >
                      <Edit size={16} />
                    </button>                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRating(rating);
                      }}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Delete rating"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {rating.comment && (
                <p className="text-white/80 text-sm ml-13">{rating.comment}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourtRating;
