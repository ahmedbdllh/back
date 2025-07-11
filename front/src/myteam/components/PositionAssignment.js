import React from 'react';
import PlayerCard from './PlayerCard';
import FormationSelector from './FormationSelector';
import StadiumField from '../../components/StadiumField3D';

const PositionAssignment = ({ 
  selectedPlayers, 
  teamSport, 
  playerPositions, 
  onPlayerPositionChange,
  onClearPositions,
  selectedPlayer3D,
  onPlayerSelect,
  onPlayerAdd,
  formations,
  selectedFormation,
  onFormationSelect
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

  if (teamSport !== 'football') {
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
        <div className="mx-auto bg-sky-500/20 rounded-full h-12 w-12 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Assign Positions</h3>
        <p className="text-neutral-400 text-sm">Drag players onto the field or choose a formation</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Available Players */}
        <div className="lg:col-span-1">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Selected Players</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {selectedPlayers.map(player => {
              const playerId = player._id || player.id;
              const isPlaced = playerPositions[playerId] && 
                             playerPositions[playerId].x !== undefined && 
                             playerPositions[playerId].y !== undefined;

              return (
                <PlayerCard
                  key={playerId}
                  player={player}
                  isSelected={true}
                  isDraggable={!isPlaced}
                  showPosition={true}
                  isPlaced={isPlaced}
                />
              );
            })}
          </div>
        </div>

        {/* Center Column: 3D Stadium */}
        <div className="lg:col-span-1">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Team Formation</h4>
          <StadiumField
            selectedPlayers={selectedPlayers}
            playerPositions={playerPositions}
            onPlayerPositionChange={onPlayerPositionChange}
            onClearPositions={onClearPositions}
            selectedPlayer={selectedPlayer3D}
            onPlayerSelect={onPlayerSelect}
            onPlayerAdd={onPlayerAdd}
          />
        </div>

        {/* Right Column: Formation Suggestions */}
        <div className="lg:col-span-1">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Formation Suggestions</h4>
          <FormationSelector
            formations={formations}
            selectedFormation={selectedFormation}
            onFormationSelect={onFormationSelect}
            playerCount={selectedPlayers.length}
          />
          
          {/* Clear positions button */}
          {Object.keys(playerPositions).length > 0 && (
            <button
              onClick={onClearPositions}
              className="w-full mt-3 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
            >
              Clear All Positions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PositionAssignment;
