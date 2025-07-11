// Utility functions for location and mapping
export const geocodeAddress = async (address) => {
  try {
    // Using Nominatim (OpenStreetMap) geocoding service (free)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

export const getLocationFromCompany = async (company) => {
  // Check if company already has coordinates
  if (company.location && Array.isArray(company.location) && company.location.length === 2) {
    return {
      lat: company.location[0],
      lng: company.location[1]
    };
  }
  
  // Try to geocode the company address
  if (company.address) {
    const addressString = `${company.address.street}, ${company.address.city}, ${company.address.country || 'Tunisia'}`;
    return await geocodeAddress(addressString);
  }
  
  return null;
};

export const defaultMapCenter = {
  tunisia: [36.8065, 10.1815], // Tunis
  casablanca: [33.5731, -7.5898], // Casablanca, Morocco
  algeria: [36.7538, 3.0588], // Algiers
};

export const getCountryCenter = (country) => {
  const countryLower = country?.toLowerCase();
  if (countryLower?.includes('tunisia')) return defaultMapCenter.tunisia;
  if (countryLower?.includes('morocco')) return defaultMapCenter.casablanca;
  if (countryLower?.includes('algeria')) return defaultMapCenter.algeria;
  return defaultMapCenter.tunisia; // Default
};
