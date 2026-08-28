const prisma = require('../utils/prisma');

/**
 * Calculates great-circle distance between two points in meters using the Haversine formula.
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculates the initial bearing from point A to point B in degrees (0 - 360).
 */
function calculateBearing(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

/**
 * Generates turn-by-turn textual instructions with maneuvers from an ordered list of nodes.
 */
function generateInstructions(pathNodes, edgesMap) {
  if (pathNodes.length < 2) {
    return [{
      stepNumber: 1,
      instruction: 'You are already at your destination.',
      distance: 0,
      maneuver: 'ARRIVE',
      bearing: 0,
      location: [pathNodes[0].lat, pathNodes[0].lng],
    }];
  }

  const steps = [];
  let previousBearing = null;

  for (let i = 0; i < pathNodes.length - 1; i++) {
    const current = pathNodes[i];
    const next = pathNodes[i + 1];
    const segmentDist = Math.round(calculateDistance(current.lat, current.lng, next.lat, next.lng));
    const bearing = calculateBearing(current.lat, current.lng, next.lat, next.lng);

    let maneuver = 'STRAIGHT';
    let turnDescription = 'Walk straight';

    if (i === 0) {
      maneuver = 'DEPART';
      turnDescription = `Start walking towards ${next.name}`;
    } else {
      const angleDiff = ((bearing - previousBearing + 540) % 360) - 180;

      if (angleDiff > 45 && angleDiff <= 135) {
        maneuver = 'TURN_RIGHT';
        turnDescription = `Turn right towards ${next.name}`;
      } else if (angleDiff > 135) {
        maneuver = 'SHARP_RIGHT';
        turnDescription = `Make a sharp right towards ${next.name}`;
      } else if (angleDiff < -45 && angleDiff >= -135) {
        maneuver = 'TURN_LEFT';
        turnDescription = `Turn left towards ${next.name}`;
      } else if (angleDiff < -135) {
        maneuver = 'SHARP_LEFT';
        turnDescription = `Make a sharp left towards ${next.name}`;
      } else if (Math.abs(angleDiff) > 20) {
        maneuver = angleDiff > 0 ? 'SLIGHT_RIGHT' : 'SLIGHT_LEFT';
        turnDescription = `Bear ${angleDiff > 0 ? 'right' : 'left'} towards ${next.name}`;
      } else {
        maneuver = 'CONTINUE';
        turnDescription = `Continue straight towards ${next.name}`;
      }
    }

    if (next.isIndoor && !current.isIndoor) {
      turnDescription += ` (Enter building)`;
      maneuver = 'ENTER_BUILDING';
    } else if (current.floor !== next.floor) {
      if (next.floor > current.floor) {
        turnDescription = `Go up to Floor ${next.floor} using stairs/elevator`;
        maneuver = 'FLOOR_UP';
      } else {
        turnDescription = `Go down to Floor ${next.floor} using stairs/elevator`;
        maneuver = 'FLOOR_DOWN';
      }
    }

    steps.push({
      stepNumber: i + 1,
      instruction: turnDescription,
      targetNode: next.name,
      distance: segmentDist,
      maneuver,
      bearing: Math.round(bearing),
      coordinates: [current.lat, current.lng],
    });

    previousBearing = bearing;
  }

  // Add final arrival step
  const lastNode = pathNodes[pathNodes.length - 1];
  steps.push({
    stepNumber: steps.length + 1,
    instruction: `Arrive at ${lastNode.name}`,
    targetNode: lastNode.name,
    distance: 0,
    maneuver: 'ARRIVE',
    bearing: previousBearing ? Math.round(previousBearing) : 0,
    coordinates: [lastNode.lat, lastNode.lng],
  });

  return steps;
}

/**
 * Calculates optimal route between start and destination using Dijkstra algorithm on campus graph.
 */
async function findRoute({ originLat, originLng, destLat, destLng, preferences = {} }) {
  const { wheelchair = false, stairsFree = false, shortest = true } = preferences;

  const [nodes, edges] = await Promise.all([
    prisma.routeNode.findMany(),
    prisma.routeEdge.findMany(),
  ]);

  if (!nodes.length) {
    throw new Error('Campus navigation network nodes not initialized.');
  }

  // Find nearest starting node and nearest destination node
  let startNode = null;
  let minStartDist = Infinity;
  let endNode = null;
  let minEndDist = Infinity;

  nodes.forEach((node) => {
    const dStart = calculateDistance(originLat, originLng, node.lat, node.lng);
    if (dStart < minStartDist) {
      minStartDist = dStart;
      startNode = node;
    }

    const dEnd = calculateDistance(destLat, destLng, node.lat, node.lng);
    if (dEnd < minEndDist) {
      minEndDist = dEnd;
      endNode = node;
    }
  });

  if (!startNode || !endNode) {
    throw new Error('Unable to resolve nearest routing node on campus.');
  }

  // Build Adjacency Graph
  const graph = {};
  nodes.forEach((n) => {
    graph[n.nodeId] = [];
  });

  edges.forEach((edge) => {
    // Filter according to user mobility preferences
    if (wheelchair && (!edge.isAccessible || edge.isStairs)) return;
    if (stairsFree && edge.isStairs) return;

    if (graph[edge.fromNodeId]) {
      graph[edge.fromNodeId].push({
        to: edge.toNodeId,
        distance: edge.distance,
        isAccessible: edge.isAccessible,
        isStairs: edge.isStairs,
        isElevator: edge.isElevator,
        isOutdoor: edge.isOutdoor,
        description: edge.description,
      });
    }

    // Bidirectional paths for standard walkways
    if (graph[edge.toNodeId]) {
      graph[edge.toNodeId].push({
        to: edge.fromNodeId,
        distance: edge.distance,
        isAccessible: edge.isAccessible,
        isStairs: edge.isStairs,
        isElevator: edge.isElevator,
        isOutdoor: edge.isOutdoor,
        description: edge.description,
      });
    }
  });

  // Dijkstra's Algorithm
  const distances = {};
  const previous = {};
  const unvisited = new Set(nodes.map((n) => n.nodeId));

  nodes.forEach((n) => {
    distances[n.nodeId] = Infinity;
    previous[n.nodeId] = null;
  });

  distances[startNode.nodeId] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current = null;
    let minDistance = Infinity;

    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    }

    if (current === null || minDistance === Infinity || current === endNode.nodeId) {
      break;
    }

    unvisited.delete(current);

    const neighbors = graph[current] || [];
    for (const neighbor of neighbors) {
      if (!unvisited.has(neighbor.to)) continue;

      const alt = distances[current] + neighbor.distance;
      if (alt < distances[neighbor.to]) {
        distances[neighbor.to] = alt;
        previous[neighbor.to] = current;
      }
    }
  }

  // Reconstruct path
  const pathNodeIds = [];
  let curr = endNode.nodeId;

  if (distances[curr] === Infinity && startNode.nodeId !== endNode.nodeId) {
    // Fallback direct line if graph has isolated nodes
    pathNodeIds.push(startNode.nodeId, endNode.nodeId);
  } else {
    while (curr) {
      pathNodeIds.unshift(curr);
      curr = previous[curr];
    }
  }

  const nodeMap = new Map(nodes.map((n) => [n.nodeId, n]));
  const pathNodes = pathNodeIds.map((id) => nodeMap.get(id)).filter(Boolean);

  // Compute total distance & estimated time
  let totalDistance = 0;
  for (let i = 0; i < pathNodes.length - 1; i++) {
    totalDistance += calculateDistance(
      pathNodes[i].lat,
      pathNodes[i].lng,
      pathNodes[i + 1].lat,
      pathNodes[i + 1].lng
    );
  }

  // Add initial connection distance from exact GPS to start node and end node to exact dest
  totalDistance += minStartDist + minEndDist;
  totalDistance = Math.max(10, Math.round(totalDistance));

  // Average walking speed = 1.3 meters / second (~4.7 km/h)
  const walkingSpeed = wheelchair ? 1.0 : 1.3;
  const estimatedDurationSeconds = Math.round(totalDistance / walkingSpeed);

  // GeoJSON coordinates array: [[lat, lng], ...]
  const coordinates = [
    [originLat, originLng],
    ...pathNodes.map((n) => [n.lat, n.lng]),
    [destLat, destLng],
  ];

  const steps = generateInstructions([
    { name: 'Current Location', lat: originLat, lng: originLng, isIndoor: false, floor: 1 },
    ...pathNodes,
    { name: 'Destination', lat: destLat, lng: destLng, isIndoor: false, floor: 1 },
  ]);

  return {
    origin: { lat: originLat, lng: originLng },
    destination: { lat: destLat, lng: destLng },
    distanceMeters: totalDistance,
    durationSeconds: estimatedDurationSeconds,
    durationMinutes: Math.max(1, Math.ceil(estimatedDurationSeconds / 60)),
    pathNodes,
    coordinates,
    steps,
    preferences: { wheelchair, stairsFree, shortest },
  };
}

module.exports = {
  calculateDistance,
  calculateBearing,
  findRoute,
};
