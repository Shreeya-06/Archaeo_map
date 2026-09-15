/**
 * ARCHAEOMap - Database and State Management Engine
 * Handles local persistence (localStorage), filtering, search, and dynamic statistics calculation.
 */

const STORAGE_KEY = "archaeomap_artifacts_v2";

class ArchaeologicalDB {
  constructor() {
    this.artifacts = [];
    this.listeners = [];
    this.init();
  }

  init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.artifacts = JSON.parse(stored);
      } else {
        this.artifacts = [...INITIAL_ARTIFACTS];
        this.saveToStorage();
      }
    } catch (e) {
      console.warn("Storage access failed, using memory store:", e);
      this.artifacts = [...INITIAL_ARTIFACTS];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.artifacts));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(cb => {
      try { cb(this.artifacts); } catch(err) { console.error(err); }
    });
  }

  getAll() {
    return [...this.artifacts];
  }

  getById(id) {
    return this.artifacts.find(a => a.id === id) || null;
  }

  getNextId() {
    const numbers = this.artifacts.map(a => {
      const match = a.id.match(/\d+$/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const max = numbers.length ? Math.max(...numbers) : 0;
    const next = max + 1;
    return `ARC-2026-${String(next).padStart(3, "0")}`;
  }

  add(data) {
    // Basic validation
    if (!data.name || !data.name.trim()) throw new Error("Artifact Name is required");
    if (!data.site || !data.site.trim()) throw new Error("Archaeological Site is required");

    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    const depth = parseFloat(data.depth);

    if (isNaN(lat) || lat < -90 || lat > 90) throw new Error("Latitude must be between -90 and 90");
    if (isNaN(lon) || lon < -180 || lon > 180) throw new Error("Longitude must be between -180 and 180");
    if (isNaN(depth) || depth < 0) throw new Error("Depth must be a positive number");

    const newArtifact = {
      id: data.id || this.getNextId(),
      name: data.name.trim(),
      type: data.type || "Other",
      material: data.material || "Other",
      period: data.period || "Unknown",
      site: data.site.trim(),
      excavationArea: data.excavationArea ? data.excavationArea.trim() : "Unassigned Trench",
      layer: data.layer ? data.layer.trim() : "Surface Silt",
      depth: parseFloat(depth.toFixed(2)),
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lon.toFixed(6)),
      status: "Documented",
      description: data.description ? data.description.trim() : "Standard field observation recorded.",
      imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80",
      dateRecorded: new Date().toISOString().split("T")[0],
      recordedBy: data.recordedBy ? data.recordedBy.trim() : "Field Archaeologist"
    };

    this.artifacts.unshift(newArtifact);
    this.saveToStorage();
    return newArtifact;
  }

  update(id, updatedFields) {
    const idx = this.artifacts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`Artifact with ID ${id} not found.`);

    // If coordinates or depth are provided, validate them
    if (updatedFields.latitude !== undefined) {
      const lat = parseFloat(updatedFields.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) throw new Error("Latitude must be between -90 and 90");
      updatedFields.latitude = parseFloat(lat.toFixed(6));
    }
    if (updatedFields.longitude !== undefined) {
      const lon = parseFloat(updatedFields.longitude);
      if (isNaN(lon) || lon < -180 || lon > 180) throw new Error("Longitude must be between -180 and 180");
      updatedFields.longitude = parseFloat(lon.toFixed(6));
    }
    if (updatedFields.depth !== undefined) {
      const depth = parseFloat(updatedFields.depth);
      if (isNaN(depth) || depth < 0) throw new Error("Depth must be positive");
      updatedFields.depth = parseFloat(depth.toFixed(2));
    }

    this.artifacts[idx] = { ...this.artifacts[idx], ...updatedFields };
    this.saveToStorage();
    return this.artifacts[idx];
  }

  delete(id) {
    const initialLen = this.artifacts.length;
    this.artifacts = this.artifacts.filter(a => a.id !== id);
    if (this.artifacts.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  resetToDemo() {
    this.artifacts = [...INITIAL_ARTIFACTS];
    this.saveToStorage();
    return this.artifacts;
  }

  filter(criteria = {}) {
    let results = [...this.artifacts];

    // Text search (search across name, ID, site, material, type, period, description, trench)
    if (criteria.search && criteria.search.trim()) {
      const query = criteria.search.trim().toLowerCase();
      results = results.filter(item => {
        return (
          item.name.toLowerCase().includes(query) ||
          item.id.toLowerCase().includes(query) ||
          item.site.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query) ||
          item.material.toLowerCase().includes(query) ||
          item.period.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.excavationArea && item.excavationArea.toLowerCase().includes(query))
        );
      });
    }

    // Type filter
    if (criteria.type && criteria.type !== "All") {
      results = results.filter(item => item.type === criteria.type);
    }

    // Material filter
    if (criteria.material && criteria.material !== "All") {
      results = results.filter(item => item.material === criteria.material);
    }

    // Period filter
    if (criteria.period && criteria.period !== "All") {
      results = results.filter(item => item.period === criteria.period);
    }

    // Site filter
    if (criteria.site && criteria.site !== "All") {
      results = results.filter(item => item.site === criteria.site);
    }

    // Depth Range filter
    if (criteria.minDepth !== undefined && criteria.minDepth !== null && criteria.minDepth !== "") {
      const minD = parseFloat(criteria.minDepth);
      if (!isNaN(minD)) results = results.filter(item => item.depth >= minD);
    }

    if (criteria.maxDepth !== undefined && criteria.maxDepth !== null && criteria.maxDepth !== "") {
      const maxD = parseFloat(criteria.maxDepth);
      if (!isNaN(maxD)) results = results.filter(item => item.depth <= maxD);
    }

    return results;
  }

  getStats(customDataset = null) {
    const list = customDataset || this.artifacts;
    const total = list.length;

    // Unique sites
    const uniqueSites = [...new Set(list.map(a => a.site))];

    // Unique types / categories
    const uniqueTypes = [...new Set(list.map(a => a.type))];

    // Type distribution counts
    const typeCounts = {};
    Object.keys(TYPE_CONFIG).forEach(t => { typeCounts[t] = 0; });
    list.forEach(a => {
      const key = TYPE_CONFIG[a.type] ? a.type : "Other";
      typeCounts[key] = (typeCounts[key] || 0) + 1;
    });

    // Material distribution counts
    const materialCounts = {};
    Object.keys(MATERIAL_CONFIG).forEach(m => { materialCounts[m] = 0; });
    list.forEach(a => {
      const key = MATERIAL_CONFIG[a.material] ? a.material : "Other";
      materialCounts[key] = (materialCounts[key] || 0) + 1;
    });

    // Period distribution counts
    const periodCounts = {};
    Object.keys(PERIOD_CONFIG).forEach(p => { periodCounts[p] = 0; });
    list.forEach(a => {
      const key = PERIOD_CONFIG[a.period] ? a.period : "Unknown";
      periodCounts[key] = (periodCounts[key] || 0) + 1;
    });

    // Site counts
    const siteCounts = {};
    list.forEach(a => {
      siteCounts[a.site] = (siteCounts[a.site] || 0) + 1;
    });

    // Depth distribution
    const depthBrackets = {
      "0 - 0.5m": 0,
      "0.5 - 1.0m": 0,
      "1.0 - 1.5m": 0,
      "1.5 - 2.0m": 0,
      "2.0 - 3.0m": 0,
      "> 3.0m": 0
    };

    let depthSum = 0;
    let minDepth = total > 0 ? Infinity : 0;
    let maxDepth = 0;

    list.forEach(a => {
      const d = a.depth;
      depthSum += d;
      if (d < minDepth) minDepth = d;
      if (d > maxDepth) maxDepth = d;

      if (d <= 0.5) depthBrackets["0 - 0.5m"]++;
      else if (d <= 1.0) depthBrackets["0.5 - 1.0m"]++;
      else if (d <= 1.5) depthBrackets["1.0 - 1.5m"]++;
      else if (d <= 2.0) depthBrackets["1.5 - 2.0m"]++;
      else if (d <= 3.0) depthBrackets["2.0 - 3.0m"]++;
      else depthBrackets["> 3.0m"]++;
    });

    const avgDepth = total > 0 ? parseFloat((depthSum / total).toFixed(2)) : 0;

    return {
      totalArtifacts: total,
      surveySitesCount: uniqueSites.length,
      surveySites: uniqueSites,
      categoriesCount: uniqueTypes.length,
      typeCounts,
      materialCounts,
      periodCounts,
      siteCounts,
      depthBrackets,
      depthStats: {
        avg: avgDepth,
        min: minDepth === Infinity ? 0 : minDepth,
        max: maxDepth
      },
      recentArtifacts: [...list].slice(0, 6)
    };
  }
}

// Global singleton database instance
const db = new ArchaeologicalDB();
