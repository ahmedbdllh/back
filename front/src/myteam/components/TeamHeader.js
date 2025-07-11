import React from 'react';

const TeamHeader = ({ hasTeam, teamName }) => {
  return (
    <header className="mb-8">
      <h1 className="text-4xl font-bold text-sky-400">My Team</h1>
      <p className="text-neutral-400">
        {hasTeam ? `Managing ${teamName}` : "You don't have a team yet. Create one or join an existing one."}
      </p>
    </header>
  );
};

export default TeamHeader;
