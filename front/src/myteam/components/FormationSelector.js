import React from 'react';

const FormationSelector = ({ 
  formations, 
  selectedFormation, 
  onFormationSelect,
  playerCount 
}) => {
  if (formations.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-neutral-500 text-sm">
          {playerCount < 5 
            ? `Add ${5 - playerCount} more players to see formations`
            : playerCount > 6
            ? 'Too many players for predefined formations'
            : 'No formations available'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {formations.map((formation, index) => (
        <div
          key={index}
          className={`formation-card p-3 rounded-lg border transition-all cursor-pointer ${
            selectedFormation === formation.name
              ? 'border-sky-400 bg-sky-500/10'
              : 'border-neutral-600 bg-neutral-700 hover:border-neutral-500'
          }`}
          onClick={() => onFormationSelect(formation)}
        >
          <div className="flex justify-between items-start mb-2">
            <h5 className="text-white font-medium">{formation.name}</h5>
            {selectedFormation === formation.name && (
              <svg className="h-4 w-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <p className="text-neutral-400 text-xs mb-2">{formation.description}</p>
          <div className="flex flex-wrap gap-1">
            {formation.positions.map((pos, idx) => (
              <span key={idx} className="text-xs px-2 py-1 bg-neutral-600 rounded text-neutral-300">
                {pos}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FormationSelector;
