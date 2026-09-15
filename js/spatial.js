/**
 * ARCHAEOMap - Spatial Analysis & DBSCAN Clustering Engine
 * True Density-Based Spatial Clustering of Applications with Noise (DBSCAN)
 * using Great-Circle Haversine geographic distance and Convex Hull generation.
 */

class SpatialAnalysisEngine {
  constructor(defaultEpsKm = 0.48, defaultMinPts = 3) {
    this.epsKm = defaultEpsKm; // Epsilon distance threshold in kilometers
    this.minPts = defaultMinPts; // Minimum points required for core point
    this.clusterPalette = [
      "#E74C3C", // Vermillion Red
      "#3498DB", // Aegean Blue
      "#2ECC71", // Emerald Green
      "#F39C12", // Antique Amber
      "#9B59B6", // Amethyst Purple
      "#1ABC9C", // Turquoise
      "#E67E22", // Terracotta Orange
      "#34495E"  // Slate
    ];
  }

  /**
   * Calculates Haversine distance in kilometers between two geographic coordinates
   */
  haversineDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's mean radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Executes DBSCAN clustering on an array of archaeological artifacts
   */
  runDBSCAN(artifacts, eps = this.epsKm, minPts = this.minPts) {
    this.epsKm = eps;
    this.minPts = minPts;

    const n = artifacts.length;
    const visited = new Array(n).fill(false);
    const clusterAssigned = new Array(n).fill(-1); // -1 = unassigned / noise
    const pointType = new Array(n).fill("unassigned"); // "core", "border", "noise"
    const neighbors = [];

    // Precompute neighbor graph
    for (let i = 0; i < n; i++) {
      const p1 = artifacts[i];
      const pNeighbors = [];
      for (let j = 0; j < n; j++) {
        const p2 = artifacts[j];
        const dist = this.haversineDistanceKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
        if (dist <= eps) {
          pNeighbors.push(j);
        }
      }
      neighbors.push(pNeighbors);
      if (pNeighbors.length >= minPts) {
        pointType[i] = "core";
      }
    }

    let clusterId = 0;

    for (let i = 0; i < n; i++) {
      if (visited[i]) continue;
      visited[i] = true;

      const pNeighbors = neighbors[i];

      if (pNeighbors.length < minPts) {
        // May still become a border point later
        if (pointType[i] !== "core") pointType[i] = "noise";
      } else {
        // Expand new cluster
        clusterId++;
        clusterAssigned[i] = clusterId;
        pointType[i] = "core";

        const queue = [...pNeighbors];

        while (queue.length > 0) {
          const currentIdx = queue.shift();

          if (!visited[currentIdx]) {
            visited[currentIdx] = true;
            const currentNeighbors = neighbors[currentIdx];
            if (currentNeighbors.length >= minPts) {
              pointType[currentIdx] = "core";
              // Add unvisited neighbors to queue
              currentNeighbors.forEach(nbr => {
                if (!visited[nbr] && !queue.includes(nbr)) {
                  queue.push(nbr);
                }
              });
            } else {
              pointType[currentIdx] = "border";
            }
          }

          if (clusterAssigned[currentIdx] === -1) {
            clusterAssigned[currentIdx] = clusterId;
            if (pointType[currentIdx] === "unassigned" || pointType[currentIdx] === "noise") {
              pointType[currentIdx] = "border";
            }
          }
        }
      }
    }

    // Organize results
    const clustersMap = {};
    let coreCount = 0;
    let borderCount = 0;
    let noiseCount = 0;

    const clusteredArtifacts = artifacts.map((artifact, idx) => {
      const cId = clusterAssigned[idx];
      const pType = (cId === -1) ? "noise" : pointType[idx];

      if (pType === "core") coreCount++;
      else if (pType === "border") borderCount++;
      else noiseCount++;

      const enhanced = {
        ...artifact,
        clusterId: cId,
        clusterName: cId === -1 ? "Noise / Isolated" : `Cluster ${cId}`,
        pointClassification: pType
      };

      if (cId !== -1) {
        if (!clustersMap[cId]) {
          clustersMap[cId] = [];
        }
        clustersMap[cId].push(enhanced);
      }

      return enhanced;
    });

    // Compile cluster summaries
    const clusters = Object.keys(clustersMap).map((cKey, index) => {
      const cId = parseInt(cKey, 10);
      const items = clustersMap[cId];
      const count = items.length;

      // Centroid
      const sumLat = items.reduce((acc, curr) => acc + curr.latitude, 0);
      const sumLon = items.reduce((acc, curr) => acc + curr.longitude, 0);
      const avgLat = parseFloat((sumLat / count).toFixed(6));
      const avgLon = parseFloat((sumLon / count).toFixed(6));

      // Depth
      const sumDepth = items.reduce((acc, curr) => acc + curr.depth, 0);
      const avgDepth = parseFloat((sumDepth / count).toFixed(2));
      const minDepth = Math.min(...items.map(a => a.depth));
      const maxDepth = Math.max(...items.map(a => a.depth));

      // Primary type (mode)
      const typeFreq = {};
      items.forEach(a => { typeFreq[a.type] = (typeFreq[a.type] || 0) + 1; });
      const primaryType = Object.keys(typeFreq).reduce((a, b) => typeFreq[a] > typeFreq[b] ? a : b, "Unknown");

      // Primary material
      const matFreq = {};
      items.forEach(a => { matFreq[a.material] = (matFreq[a.material] || 0) + 1; });
      const primaryMaterial = Object.keys(matFreq).reduce((a, b) => matFreq[a] > matFreq[b] ? a : b, "Unknown");

      // Dominant period
      const perFreq = {};
      items.forEach(a => { perFreq[a.period] = (perFreq[a.period] || 0) + 1; });
      const dominantPeriod = Object.keys(perFreq).reduce((a, b) => perFreq[a] > perFreq[b] ? a : b, "Unknown");

      // Dominant site
      const siteFreq = {};
      items.forEach(a => { siteFreq[a.site] = (siteFreq[a.site] || 0) + 1; });
      const dominantSite = Object.keys(siteFreq).reduce((a, b) => siteFreq[a] > siteFreq[b] ? a : b, "Unknown");

      // Calculate convex hull polygon points [lat, lon]
      const rawPoints = items.map(a => [a.latitude, a.longitude]);
      const hull = this.computeConvexHull(rawPoints);

      const color = this.clusterPalette[(index) % this.clusterPalette.length];

      return {
        id: cId,
        name: `Cluster ${cId}`,
        color,
        count,
        items,
        avgLat,
        avgLon,
        avgDepth,
        minDepth,
        maxDepth,
        primaryType,
        primaryMaterial,
        dominantPeriod,
        dominantSite,
        hull
      };
    });

    const totalClusters = clusters.length;
    const avgClusterSize = totalClusters > 0
      ? parseFloat((clusters.reduce((acc, c) => acc + c.count, 0) / totalClusters).toFixed(1))
      : 0;

    return {
      clusteredArtifacts,
      clusters,
      stats: {
        totalClusters,
        corePoints: coreCount,
        borderPoints: borderCount,
        noisePoints: noiseCount,
        avgClusterSize,
        epsKm: this.epsKm,
        minPts: this.minPts
      }
    };
  }

  /**
   * Computes 2D Convex Hull for a set of [lat, lon] coordinates
   * Uses Monotone Chain algorithm and pads vertices slightly for visual clarity on GIS maps
   */
  computeConvexHull(points) {
    if (points.length <= 1) return points;
    if (points.length === 2) {
      // Return padded envelope around 2 points
      const p1 = points[0];
      const p2 = points[1];
      const deltaLat = 0.001;
      const deltaLon = 0.001;
      return [
        [p1[0] - deltaLat, p1[1] - deltaLon],
        [p1[0] + deltaLat, p1[1] - deltaLon],
        [p2[0] + deltaLat, p2[1] + deltaLon],
        [p2[0] - deltaLat, p2[1] + deltaLon]
      ];
    }

    // Sort points lexicographically by latitude, then longitude
    const sorted = [...points].sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);

    // Cross product of OA and OB vectors
    const crossProduct = (o, a, b) => {
      return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    };

    // Build lower hull
    const lower = [];
    for (let i = 0; i < sorted.length; i++) {
      while (lower.length >= 2 && crossProduct(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
        lower.pop();
      }
      lower.push(sorted[i]);
    }

    // Build upper hull
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      while (upper.length >= 2 && crossProduct(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
        upper.pop();
      }
      upper.push(sorted[i]);
    }

    // Concatenate lower and upper hull
    lower.pop();
    upper.pop();
    const hull = lower.concat(upper);

    // Expand hull vertices slightly outward (buffer) for smooth GIS polygon rendering
    if (hull.length < 3) {
      const centerLat = hull.reduce((a, b) => a + b[0], 0) / hull.length;
      const centerLon = hull.reduce((a, b) => a + b[1], 0) / hull.length;
      const d = 0.0015;
      return [
        [centerLat + d, centerLon],
        [centerLat, centerLon + d],
        [centerLat - d, centerLon],
        [centerLat, centerLon - d]
      ];
    }

    // Slight radial expansion from centroid for visual breathing room
    const cLat = hull.reduce((a, b) => a + b[0], 0) / hull.length;
    const cLon = hull.reduce((a, b) => a + b[1], 0) / hull.length;
    const bufferFactor = 1.15;

    return hull.map(p => {
      const latDiff = p[0] - cLat;
      const lonDiff = p[1] - cLon;
      return [
        cLat + latDiff * bufferFactor,
        cLon + lonDiff * bufferFactor
      ];
    });
  }
}

// Global spatial analysis engine instance
const spatialEngine = new SpatialAnalysisEngine(0.48, 3);
