/**
 * HERE Routing Service
 * Route calculation using HERE Routing API v8
 */

import { getPlatform, createPolyline, PASTITA_COLORS, HERE_API_KEY } from './hereMapService';
import logger from './logger';

/**
 * Calculate route between two points
 * @param {Object} origin - { lat, lng }
 * @param {Object} destination - { lat, lng }
 * @param {Object} options - routing options
 * @returns {Promise<Object>} route data
 */
export async function calculateRoute(origin, destination, options = {}) {
  const platform = getPlatform();
  const router = platform.getRoutingService(null, 8);

  const originStr = `${origin.lat || origin.latitude},${origin.lng || origin.longitude}`;
  const destinationStr = `${destination.lat || destination.latitude},${destination.lng || destination.longitude}`;

  const routeParams = {
    routingMode: options.routingMode || 'fast',
    transportMode: options.transportMode || 'car',
    origin: originStr,
    destination: destinationStr,
    return: 'polyline,summary,actions,instructions'
  };

  // Add via points if provided
  if (options.via && options.via.length > 0) {
    routeParams.via = options.via.map(v => `${v.lat},${v.lng}`).join('!');
  }

  return new Promise((resolve, reject) => {
    router.calculateRoute(routeParams, (result) => {
      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0];
        const section = route.sections[0];

        resolve({
          success: true,
          distance: section.summary.length, // meters
          duration: section.summary.duration, // seconds
          distanceKm: (section.summary.length / 1000).toFixed(2),
          durationMinutes: Math.ceil(section.summary.duration / 60),
          polyline: section.polyline,
          departure: section.departure,
          arrival: section.arrival,
          actions: section.actions || [],
          instructions: section.turnByTurnActions || [],
          raw: route
        });
      } else {
        reject(new Error('No route found'));
      }
    }, (error) => {
      logger.error('Routing error', error, { origin, destination });
      reject(error);
    });
  });
}

/**
 * Calculate route and return a polyline object for the map
 */
export async function calculateRouteWithPolyline(origin, destination, options = {}) {
  const routeData = await calculateRoute(origin, destination, options);
  
  const polyline = createPolyline(routeData.polyline, {
    strokeColor: options.strokeColor || PASTITA_COLORS.routeColor,
    lineWidth: options.lineWidth || 4
  });

  return {
    ...routeData,
    mapPolyline: polyline
  };
}

/**
 * Calculate distance matrix between multiple points
 * @param {Array} origins - array of { lat, lng }
 * @param {Array} destinations - array of { lat, lng }
 * @returns {Promise<Object>} matrix data
 */
export async function calculateMatrix(origins, destinations) {
  const originsList = origins.map((o, i) => ({
    lat: o.lat || o.latitude,
    lng: o.lng || o.longitude
  }));

  const destinationsList = destinations.map((d, i) => ({
    lat: d.lat || d.latitude,
    lng: d.lng || d.longitude
  }));

  const originsParam = originsList.map(o => `${o.lat},${o.lng}`).join(';');
  const destinationsParam = destinationsList.map(d => `${d.lat},${d.lng}`).join(';');

  const url = `https://matrix.router.hereapi.com/v8/matrix?apikey=${HERE_API_KEY}&origins=${originsParam}&destinations=${destinationsParam}&transportMode=car`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.matrix) {
      return {
        success: true,
        matrix: data.matrix,
        origins: originsList,
        destinations: destinationsList
      };
    } else {
      throw new Error('No matrix data returned');
    }
  } catch (error) {
    logger.error('Matrix calculation error', error);
    throw error;
  }
}

/**
 * Get route summary text
 */
export function getRouteSummary(routeData) {
  const distanceText = routeData.distanceKm >= 1 
    ? `${routeData.distanceKm} km` 
    : `${routeData.distance} m`;
  
  const durationText = routeData.durationMinutes >= 60
    ? `${Math.floor(routeData.durationMinutes / 60)}h ${routeData.durationMinutes % 60}min`
    : `${routeData.durationMinutes} min`;

  return {
    distance: distanceText,
    duration: durationText,
    full: `${distanceText} • ${durationText}`
  };
}

/**
 * Format route instructions for display
 */
export function formatRouteInstructions(routeData) {
  if (!routeData.actions || routeData.actions.length === 0) {
    return [];
  }

  return routeData.actions.map((action, index) => ({
    step: index + 1,
    instruction: action.instruction || '',
    distance: action.length ? `${(action.length / 1000).toFixed(1)} km` : '',
    duration: action.duration ? `${Math.ceil(action.duration / 60)} min` : ''
  }));
}

export default {
  calculateRoute,
  calculateRouteWithPolyline,
  calculateMatrix,
  getRouteSummary,
  formatRouteInstructions
};
