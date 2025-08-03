import React from 'react';
import FormationSelector from './FormationSelector';
import StadiumField from './3d/StadiumField3D';
import SimpleField from './SimpleField';
import { getImageUrl, handleImageError } from '../../../shared/utils/imageUtils';

const PositionAssignment = ({ 
  selectedPlayers = [], 
  teamSport = 'football', 
  playerPositions = {}, 
  onPlayerPositionChange,
  onClearPositions,
  selectedPlayer3D,
  onPlayerSelect,
  onPlayerAdd,
  formations = [],
  selectedFormation = '',
  onFormationSelect,
  benchPlayers = [],
  onMovePlayerToBench,
  onMovePlayerToField,
  team = null,
  readOnly = false
}) => {
  if (selectedPlayers.length === 0) {
    return (
      <div className="animate-fadeIn">
        <div className="text-center mb-6">
          <div className="mx-auto bg-sky-500/20 rounded-full h-12 w-12 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Assign Positions</h3>
          <p className="text-neutral-400 text-sm">Drag players onto the field or choose a formation</p>
        </div>
        <div className="text-center py-8">
          <p className="text-neutral-500">Please select players in the previous step to assign positions.</p>
        </div>
      </div>
    );
  }

  // Debug logging to see what teamSport value we're getting
  console.log('PositionAssignment - teamSport value:', teamSport, 'type:', typeof teamSport);
  console.log('PositionAssignment - checking if teamSport !== football:', teamSport !== 'football');

  // Handle both 'football' and 'Football' cases
  const isFootball = teamSport && (teamSport.toLowerCase() === 'football');

  if (!isFootball) {
    return (
      <div className="animate-fadeIn">
        <div className="text-center mb-6">
          <div className="mx-auto bg-sky-500/20 rounded-full h-12 w-12 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Assign Positions</h3>
          <p className="text-neutral-400 text-sm">Drag players onto the field or choose a formation</p>
        </div>
        <div className="text-center py-8">
          <div className="mb-4">
            <svg className="h-16 w-16 text-sky-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0114 0z" />
            </svg>
            <h4 className="text-lg font-medium text-white mb-2">Team Setup Complete!</h4>
            <p className="text-neutral-400 mb-4">
              Position assignment is currently available for football teams only.
              <br />Your {teamSport} team is ready to be created!
            </p>
            <div className="bg-neutral-700 rounded-lg p-4 max-w-md mx-auto">
              <h5 className="text-white font-medium mb-2">Selected Players ({selectedPlayers.length})</h5>
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map(player => {
                  const playerName = player.fullName || player.name || 'Unknown Player';
                  const playerId = player._id || player.id;
                  return (
                    <span key={playerId} className="text-xs px-2 py-1 bg-sky-600 rounded text-white">
                      {playerName}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="text-center mb-6">
        <div className="mx-auto bg-neutral-800 border border-neutral-700 rounded-xl h-14 w-14 flex items-center justify-center mb-3 shadow-md">
          <svg className="h-7 w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-1.5">Tactical Setup</h3>
        <p className="text-neutral-400 text-xs">Choose your formation and assign player positions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Formation Selection - Shows on top on mobile, left on desktop */}
        <div className="lg:col-span-1 order-1">
          {!readOnly && (
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700 p-4 mb-4">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Choose Formation</span>
              </h4>
              <FormationSelector
                formations={formations}
                selectedFormation={selectedFormation}
                onFormationSelect={onFormationSelect}
                playerCount={selectedPlayers.length}
              />
            </div>
          )}
          {readOnly && selectedFormation && (
            <div className="text-center py-4">
              <div className="text-sm text-gray-400 mb-2">Current Formation</div>
              <div className="text-lg font-semibold text-white">{selectedFormation}</div>
            </div>
          )}
        </div>

        {/* Center Column: 3D Stadium */}
        <div className="lg:col-span-2 order-2">
          <div className="space-y-4 h-full">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-neutral-200">Formation Field</h4>
              {!readOnly && Object.keys(playerPositions).length > 0 && (
                <button
                  onClick={onClearPositions}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear All</span>
                </button>
              )}
            </div>
            
            {/* Stadium Field Component - Direct render without extra wrapper */}
            <StadiumField
              selectedPlayers={selectedPlayers}
              playerPositions={playerPositions}
              onPlayerPositionChange={readOnly ? () => {} : onPlayerPositionChange}
              onClearPositions={readOnly ? () => {} : onClearPositions}
              selectedPlayer={selectedPlayer3D}
              onPlayerSelect={readOnly ? () => {} : onPlayerSelect}
              onPlayerAdd={readOnly ? () => {} : onPlayerAdd}
              team={team}
              readOnly={readOnly}
            />
          </div>
        </div>

        {/* Right Column: Players Management */}
        <div className="lg:col-span-1 order-3 space-y-6">
          {/* Starting Players */}
          <div>
            <h4 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Starting Players</span>
              <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
                {Object.keys(playerPositions).length}
              </span>
            </h4>
            
            <div className="space-y-2 max-h-64 overflow-y-auto bg-neutral-800/30 rounded-lg p-3 border border-neutral-700">
              {selectedPlayers.filter(player => {
                const playerId = player._id || player.id;
                return playerPositions[playerId] && playerPositions[playerId].isStarter !== false;
              }).map(player => {
                const playerId = player._id || player.id;
                const position = playerPositions[playerId];
                
                return (
                  <div
                    key={playerId}
                    className="flex items-center justify-between p-2 bg-neutral-700/50 rounded border border-neutral-600 hover:bg-neutral-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                        {player.profileImage ? (
                          <img 
                            src={getImageUrl(player.profileImage, 'user')} 
                            alt={player.fullName || player.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, 'user', player.fullName || player.name)}
                          />
                        ) : (
                          (player.fullName || player.name || 'Player').charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {player.fullName || player.name || 'Unknown Player'}
                        </p>
                        {position && (
                          <p className="text-green-400 text-xs font-medium">
                            {position.position}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Move to bench button - Only show if not readOnly */}
                    {!readOnly && (
                      <button
                        onClick={() => onMovePlayerToBench && onMovePlayerToBench(playerId)}
                        className="text-neutral-400 hover:text-amber-400 transition-colors p-1"
                        title="Move to bench"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
              
              {Object.keys(playerPositions).length === 0 && (
                <div className="text-center py-8 text-neutral-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm">Select a formation to position players</p>
                </div>
              )}
            </div>
          </div>

          {/* Bench Players */}
          {(benchPlayers.length > 0 || selectedPlayers.length > 11) && (
            <div>
              <h4 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center space-x-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
                <span>Bench</span>
                <span className="bg-amber-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {benchPlayers.length}
                </span>
              </h4>
              
              <div className="space-y-2 max-h-32 overflow-y-auto bg-neutral-800/30 rounded-lg p-3 border border-neutral-700">
                {(benchPlayers || []).map(player => {
                  const playerId = player._id || player.id;
                  
                  return (
                    <div
                      key={playerId}
                      className="flex items-center justify-between p-2 bg-neutral-700/50 rounded border border-neutral-600 hover:bg-neutral-700 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-9 h-9 bg-neutral-700 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-inner border border-amber-600/40">
                          {player.profileImage ? (
                            <img 
                              src={getImageUrl(player.profileImage, 'user')} 
                              alt={player.fullName || player.name} 
                              className="w-full h-full object-cover"
                              onError={(e) => handleImageError(e, 'user', player.fullName || player.name)}
                            />
                          ) : (
                            (player.fullName || player.name || 'Player').charAt(0)
                          )}
                        </div>
                        <div className="flex-grow">
                          <p className="text-white text-sm font-medium truncate max-w-[120px]">
                            {player.fullName || player.name || 'Unknown Player'}
                          </p>
                          <div className="flex items-center text-amber-400 text-xs">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Substitute</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Move to field button - Only show if not readOnly */}
                      {!readOnly && (
                        <button
                          onClick={() => onMovePlayerToField && onMovePlayerToField(playerId)}
                          className="flex items-center justify-center w-6 h-6 bg-neutral-800 rounded-full text-neutral-400 hover:bg-green-800 hover:text-green-300 transition-colors"
                          title="Move to field"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  );
                })}
                
                {benchPlayers.length === 0 && selectedPlayers.length > 11 && (
                  <div className="text-center py-4 text-neutral-500">
                    <p className="text-sm">Extra players will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Players (not yet positioned) */}
          {(() => {
            const unpositionedPlayers = selectedPlayers.filter(player => {
              const playerId = player._id || player.id;
              const benchPlayersList = benchPlayers || [];
              return !playerPositions[playerId] && !benchPlayersList.some(bp => (bp._id || bp.id) === playerId);
            });
            
            if (unpositionedPlayers.length > 0) {
              return (
                <div>
                  <h4 className="text-sm font-semibold text-neutral-200 mb-3 flex items-center space-x-2">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Available Players</span>
                    <span className="bg-neutral-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {unpositionedPlayers.length}
                    </span>
                  </h4>
                  
                  <div className="space-y-2 max-h-32 overflow-y-auto bg-neutral-800/30 rounded-lg p-3 border border-neutral-700">
                    {unpositionedPlayers.map(player => {
                      const playerId = player._id || player.id;
                      
                      return (
                        <div
                          key={playerId}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/json', JSON.stringify({
                              type: 'player',
                              player: player
                            }));
                            e.dataTransfer.effectAllowed = 'copy';
                            e.currentTarget.classList.add('dragging');
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.classList.remove('dragging');
                          }}
                          className="flex items-center justify-between p-2 bg-neutral-700/50 rounded border border-neutral-600 hover:bg-neutral-700 transition-colors cursor-grab hover:cursor-grab active:cursor-grabbing select-none"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="w-9 h-9 bg-neutral-700 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden shadow-inner border border-neutral-600">
                              {player.profileImage ? (
                                <img 
                                  src={getImageUrl(player.profileImage, 'user')} 
                                  alt={player.fullName || player.name} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => handleImageError(e, 'user', player.fullName || player.name)}
                                />
                              ) : (
                                (player.fullName || player.name || 'Player').charAt(0)
                              )}
                            </div>
                            <div className="flex-grow">
                              <p className="text-white text-sm font-medium truncate max-w-[120px]">
                                {player.fullName || player.name || 'Unknown Player'}
                              </p>
                              <div className="flex items-center text-neutral-400 text-xs">
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                <span>Drag to position</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-neutral-400 flex items-center justify-center w-6 h-6 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
};

export default PositionAssignment;
