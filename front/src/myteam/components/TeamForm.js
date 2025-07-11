import React from 'react';

const TeamForm = ({ 
  teamName, 
  setTeamName, 
  teamSport, 
  setTeamSport,
  error 
}) => {
  const sports = [
    { value: 'football', label: '⚽ Football', description: 'The beautiful game' },
    { value: 'basketball', label: '🏀 Basketball', description: 'Fast-paced court action' },
    { value: 'volleyball', label: '🏐 Volleyball', description: 'Team coordination at its best' },
    { value: 'handball', label: '🤾 Handball', description: 'Quick thinking and teamwork' },
  ];

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-6">
        <div className="mx-auto bg-sky-500/20 rounded-full h-12 w-12 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m13.4-2.382a4 4 0 11-5.292 0M15 12a4 4 0 110-5.292" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Team Information</h3>
        <p className="text-neutral-400 text-sm">Let's start with the basics</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Team Name
          </label>
          <input
            type="text"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter your team name"
            className="w-full bg-neutral-700 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-neutral-600 transition-all duration-300"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-3">
            Choose Your Sport
          </label>
          <div className="grid grid-cols-1 gap-3">
            {sports.map((sport) => (
              <div
                key={sport.value}
                className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                  teamSport === sport.value
                    ? 'border-sky-400 bg-sky-500/10 shadow-sky-500/20'
                    : 'border-neutral-600 bg-neutral-700 hover:border-neutral-500'
                }`}
                onClick={() => setTeamSport(sport.value)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium flex items-center space-x-2">
                      <span>{sport.label}</span>
                    </h4>
                    <p className="text-neutral-400 text-xs mt-1">{sport.description}</p>
                  </div>
                  {teamSport === sport.value && (
                    <svg className="h-5 w-5 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};

export default TeamForm;
