import React from 'react';

const MatchReadyStatus = ({ 
  team,
  activeMembers = 0,
  requiredPlayers = 6
}) => {
  if (!team) return null;

  const isMatchReady = team.isMatchReady || activeMembers >= requiredPlayers;
  const fieldType = team.fieldType || 6;
  const membersNeeded = Math.max(0, fieldType - activeMembers);

  return (
    <div className={`p-4 rounded-xl border ${
      isMatchReady 
        ? 'bg-green-500/10 border-green-500/30' 
        : 'bg-yellow-500/10 border-yellow-500/30'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isMatchReady 
            ? 'bg-green-500/20' 
            : 'bg-yellow-500/20'
        }`}>
          {isMatchReady ? (
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )}
        </div>
        
        <div className="flex-1">
          <h3 className={`font-semibold ${
            isMatchReady ? 'text-green-300' : 'text-yellow-300'
          }`}>
            {isMatchReady ? 'Match Ready!' : 'Not Match Ready'}
          </h3>
          
          <p className="text-sm text-neutral-400">
            {isMatchReady ? (
              `Your team has ${activeMembers} players and is ready for ${fieldType} vs ${fieldType} matches.`
            ) : (
              `You need ${membersNeeded} more player${membersNeeded !== 1 ? 's' : ''} for ${fieldType} vs ${fieldType} matches. (${activeMembers}/${fieldType})`
            )}
          </p>
        </div>
        
        <div className="text-right">
          <div className={`text-lg font-bold ${
            isMatchReady ? 'text-green-300' : 'text-yellow-300'
          }`}>
            {activeMembers}/{fieldType}
          </div>
          <div className="text-xs text-neutral-500">
            Players
          </div>
        </div>
      </div>
      
      {!isMatchReady && (
        <div className="mt-3 pt-3 border-t border-neutral-700">
          <p className="text-xs text-neutral-400">
            💡 <strong>Tip:</strong> You can create your team with just yourself as captain, then invite friends using the secret code! You'll need at least {fieldType} players to participate in matches.
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchReadyStatus;
