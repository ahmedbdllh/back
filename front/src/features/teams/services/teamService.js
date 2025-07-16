const API_BASE_URL = process.env.REACT_APP_AUTH_API_URL || 'http://localhost:5000';

export const teamService = {
  // Get user's team
  async getMyTeam(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/my-team`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // User not in a team
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching user team:', error);
      throw error;
    }
  },

  // Get team by ID
  async getTeamById(teamId, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.success ? data.team : null;
    } catch (error) {
      console.error('Error fetching team:', error);
      throw error;
    }
  },

  // Create a new team
  async createTeam(teamData, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teamData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  // Join a team
  async joinTeam(joinCode, token) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/teams/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ joinCode })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error joining team:', error);
      throw error;
    }
  }
};

export default teamService;
