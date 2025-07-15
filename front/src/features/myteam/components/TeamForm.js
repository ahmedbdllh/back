import React, { useState } from 'react';
import { handleImageError } from '../../../shared/utils/imageUtils';

const TeamForm = ({ 
  teamName, 
  setTeamName, 
  teamSport, 
  setTeamSport,
  teamLogo,
  setTeamLogo,
  fieldType,
  setFieldType,
  error,
  existingTeams = [],
  isPublic = true,
  setIsPublic
}) => {
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Check if a sport already has a team
  const hasTeamForSport = (sport) => {
    return existingTeams.some(team => team.sport === sport);
  };

  // Get existing team for a sport
  const getExistingTeamForSport = (sport) => {
    return existingTeams.find(team => team.sport === sport);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }
      
      console.log('File selected:', file.name, file.type, file.size);
      setIsLoadingImage(true);
      
      // Create a FileReader to read the file as data URL for preview only
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result && typeof result === 'string') {
          // Create an object that contains both the file for upload and the preview URL
          setTeamLogo({
            file: file, // Store the actual file object for uploading
            preview: result // Store the data URL for preview purposes only
          });
        } else {
          console.error('Invalid file result');
          alert('Error processing the selected file. Please try again.');
        }
        setIsLoadingImage(false);
      };
      reader.onerror = (e) => {
        console.error('Error reading file:', e);
        alert('Error reading the selected file. Please try again.');
        setIsLoadingImage(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const sports = [
    { value: 'Football', label: '⚽ Football', description: 'The beautiful game' },
    { value: 'Basketball', label: '🏀 Basketball', description: 'Fast-paced court action' },
    { value: 'Paddle', label: '🎾 Paddle', description: 'Team coordination at its best' },
    { value: 'Tennis', label: '🎾🥎 Tennis', description: 'Quick thinking and teamwork' },
  ];

  return (
    <div className="animate-fadeIn">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-center backdrop-blur-sm">
          <p className="text-red-300 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Team Name */}
        <div className="space-y-2">
          <label className="text-white font-semibold text-base flex items-center space-x-2">
            <div className="w-2 h-2 bg-sky-400 rounded-full"></div>
            <span>Team Name</span>
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter your team name..."
            className="w-full bg-gradient-to-r from-neutral-900/80 to-neutral-800/80 backdrop-blur-sm text-white px-4 py-3.5 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-sky-400 focus:bg-neutral-800/90 border border-neutral-700/50 hover:border-neutral-600 transition-all duration-300 placeholder-neutral-400"
            required
          />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="text-white font-semibold text-base flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span>Team Logo</span>
          </label>
          <div className="relative group">
            <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-neutral-900/60 to-neutral-800/60 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-neutral-600 transition-all duration-300">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-neutral-800 to-neutral-700 border-2 border-dashed border-neutral-600 rounded-xl flex items-center justify-center overflow-hidden group-hover:border-sky-400 transition-all duration-300">
                  {isLoadingImage ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-400"></div>
                    </div>
                  ) : (teamLogo && teamLogo.preview) ? (
                    <img
                      src={teamLogo.preview}
                      alt="Team logo"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => handleImageError(e, 'team', 'Team Logo Preview')}
                      onLoad={() => {
                        console.log('Team logo preview loaded successfully');
                      }}
                    />
                  ) : (
                    <svg className="w-7 h-7 text-neutral-500 group-hover:text-sky-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                {(teamLogo && teamLogo.preview) && (
                  <button
                    type="button"
                    onClick={() => setTeamLogo(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-400 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
                    title="Remove logo"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="teamLogo"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <label
                  htmlFor="teamLogo"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-700 hover:to-sky-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all duration-300 shadow-lg hover:shadow-sky-500/25 transform hover:scale-105"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{teamLogo ? 'Change Logo' : 'Upload Logo'}</span>
                </label>
                <p className="text-neutral-400 text-xs mt-1">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sport Selection */}
        <div className="space-y-2">
          <label className="text-white font-semibold text-base flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            <span>Choose Sport</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {sports.map((sport) => (
              <div
                key={sport.value}
                className={`relative overflow-hidden p-4 border rounded-xl cursor-pointer transition-all duration-300 group ${
                  teamSport === sport.value
                    ? 'border-sky-400 bg-gradient-to-br from-sky-500/20 to-blue-500/20 shadow-lg shadow-sky-500/20'
                    : 'border-neutral-700/50 bg-gradient-to-br from-neutral-900/60 to-neutral-800/60 hover:border-neutral-600 hover:from-neutral-800/60 hover:to-neutral-700/60'
                }`}
                onClick={() => setTeamSport(sport.value)}
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-white text-sm font-semibold">
                    {sport.label}
                  </span>
                  {teamSport === sport.value ? (
                    <div className="w-6 h-6 bg-gradient-to-r from-sky-400 to-blue-400 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : (
                    <div className="w-6 h-6 border-2 border-neutral-600 rounded-full group-hover:border-neutral-500 transition-colors duration-200"></div>
                  )}
                </div>
                {/* Background decoration */}
                <div className={`absolute inset-0 opacity-5 ${
                  teamSport === sport.value ? 'bg-gradient-to-br from-sky-400 to-blue-400' : ''
                }`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Field Type Selection */}
        {(teamSport === 'Football' || teamSport === 'Paddle') && (
          <div className="space-y-2">
            <label className="text-white font-semibold text-base flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Field Type</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 6, label: '6 vs 6', description: 'Small field (2 substitutes)' },
                { value: 7, label: '7 vs 7', description: 'Medium field (1 substitute)' }
              ].map((type) => (
                <div
                  key={type.value}
                  className={`relative overflow-hidden p-3 border rounded-xl cursor-pointer transition-all duration-300 group ${
                    fieldType === type.value
                      ? 'border-purple-400 bg-gradient-to-br from-purple-500/20 to-violet-500/20 shadow-lg shadow-purple-500/20'
                      : 'border-neutral-700/50 bg-gradient-to-br from-neutral-900/60 to-neutral-800/60 hover:border-neutral-600 hover:from-neutral-800/60 hover:to-neutral-700/60'
                  }`}
                  onClick={() => setFieldType(type.value)}
                >
                  <div className="relative z-10 text-center">
                    <div className="text-white text-sm font-semibold mb-1">
                      {type.label}
                    </div>
                    <div className="text-neutral-400 text-xs">
                      {type.description}
                    </div>
                    {fieldType === type.value && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-400 to-violet-400 rounded-full flex items-center justify-center shadow-lg">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className={`absolute inset-0 opacity-5 ${
                    fieldType === type.value ? 'bg-gradient-to-br from-purple-400 to-violet-400' : ''
                  }`}></div>
                </div>
              ))}
            </div>
            <p className="text-neutral-400 text-sm mt-2">
              Choose your preferred field type. This determines the maximum number of players per team.
            </p>
          </div>
        )}

        {/* Team Privacy Selection */}
        <div className="space-y-2">
          <label className="text-white font-semibold text-base flex items-center space-x-2">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <span>Team Privacy</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { 
                value: true, 
                label: '🌐 Public Team', 
                description: 'Anyone can find and join your team',
                color: 'emerald'
              },
              { 
                value: false, 
                label: '🔒 Private Team', 
                description: 'Only players with secret code can join',
                color: 'amber'
              }
            ].map((privacy) => (
              <div
                key={privacy.value}
                className={`relative overflow-hidden p-3 border rounded-xl cursor-pointer transition-all duration-300 group ${
                  isPublic === privacy.value
                    ? `border-${privacy.color}-400 bg-gradient-to-br from-${privacy.color}-500/20 to-${privacy.color}-600/20 shadow-lg shadow-${privacy.color}-500/20`
                    : 'border-neutral-700/50 bg-gradient-to-br from-neutral-900/60 to-neutral-800/60 hover:border-neutral-600 hover:from-neutral-800/60 hover:to-neutral-700/60'
                }`}
                onClick={() => setIsPublic(privacy.value)}
              >
                <div className="relative z-10 text-center">
                  <div className="text-white text-sm font-semibold mb-1">
                    {privacy.label}
                  </div>
                  <div className="text-neutral-400 text-xs">
                    {privacy.description}
                  </div>
                  {isPublic === privacy.value && (
                    <div className={`absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-${privacy.color}-400 to-${privacy.color}-500 rounded-full flex items-center justify-center shadow-lg`}>
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className={`absolute inset-0 opacity-5 ${
                  isPublic === privacy.value ? `bg-gradient-to-br from-${privacy.color}-400 to-${privacy.color}-500` : ''
                }`}></div>
              </div>
            ))}
          </div>
          <p className="text-neutral-400 text-sm mt-2">
            {isPublic 
              ? "Public teams appear in search results and players can request to join directly."
              : "Private teams require a secret code to join. You'll receive a unique code after team creation."
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TeamForm;
