/**
 * ARCHAEOMap - GIS Explorer & Interactive Mapping Engine
 * Built on Leaflet.js with multi-layer raster tiles, custom archaeological SVG markers,
 * density heatmap, DBSCAN cluster boundary polygons, and coordinate HUD.
 */

class ArchaeologicalGIS {
  constructor() {
    this.map = null;
    this.baseLayers = {};
    this.currentBaseLayerName = "street";
    this.markerLayerGroup = null;
    this.clusterLayerGroup = null;
    this.heatLayerGroup = null;
    this.pickerMap = null;
    this.pickerMarker = null;
    this.detailMap = null;
    this.detailMarker = null;

    // Active map filter states
    this.activeFilters = {
      type: "All",
      material: "All",
      period: "All",
      site: "All",
      showMarkers: true,
      showHeatmap: false,
      showClusters: true
    };
  }

  /**
   * Initializes the primary GIS Explorer map
   */
  initMainMap(containerId = "gis-map") {
    const container = document.getElementById(containerId);
    if (!container) return;

    // If map already exists, invalidate size and return
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 200);
      return;
    }

    // Default center on archaeological survey site area (Sisupalgarh / Kalinga Survey Sector)
    const defaultCenter = [20.2965, 85.8255];
    const defaultZoom = 15;

    this.map = L.map(containerId, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Custom Zoom control at top-left
    L.control.zoom({ position: "topleft" }).addTo(this.map);

    // Scale control at bottom-left
    L.control.scale({ imperial: false, metric: true, position: "bottomleft" }).addTo(this.map);

    // Attribution control at bottom-right
    L.control.attribution({ position: "bottomright", prefix: '<span class="text-xs text-stone-400">ARCHAEOMap GIS Engine</span>' }).addTo(this.map);

    // 1. Street Map / CartoDB Positron (Clean, modern archaeological field cartography)
    this.baseLayers.street = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
    });

    // 2. Topographic Map / OpenTopoMap (Contours, elevation, terrain relief)
    this.baseLayers.topo = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      subdomains: "abc",
      attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>'
    });

    // 3. Satellite Imagery / Esri World Imagery (High-res orbital photograph)
    this.baseLayers.satellite = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    });

    // 4. Dark Matter / Antique Dark Cartography
    this.baseLayers.dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: '&copy; CARTO'
    });

    // Set default base layer
    this.baseLayers.street.addTo(this.map);

    // Initialize layer groups
    this.clusterLayerGroup = L.layerGroup().addTo(this.map);
    this.heatLayerGroup = L.layerGroup().addTo(this.map);
    this.markerLayerGroup = L.layerGroup().addTo(this.map);

    // Mouse coordinate tracker for HUD
    this.map.on("mousemove", (e) => {
      const latEl = document.getElementById("hud-lat");
      const lonEl = document.getElementById("hud-lon");
      if (latEl && lonEl) {
        latEl.innerText = `${e.latlng.lat.toFixed(5)}° N`;
        lonEl.innerText = `${e.latlng.lng.toFixed(5)}° E`;
      }
    });

    this.map.on("zoomend", () => {
      const zoomEl = document.getElementById("hud-zoom");
      if (zoomEl) {
        zoomEl.innerText = `Zoom: ${this.map.getZoom()}`;
      }
    });

    // Initial render of data
    this.renderGISData();

    // Fit survey bounds smoothly
    setTimeout(() => {
      this.fitSurveyBounds();
    }, 400);
  }

  /**
   * Switch base raster map layer
   */
  switchBaseLayer(layerName) {
    if (!this.baseLayers[layerName] || layerName === this.currentBaseLayerName) return;

    this.map.removeLayer(this.baseLayers[this.currentBaseLayerName]);
    this.baseLayers[layerName].addTo(this.map);
    this.currentBaseLayerName = layerName;

    // Update active button styling in GIS UI
    const layerButtons = document.querySelectorAll(".gis-layer-btn");
    layerButtons.forEach(btn => {
      if (btn.dataset.layer === layerName) {
        btn.classList.add("bg-terracotta", "text-white", "border-terracotta");
        btn.classList.remove("bg-charcoal-700", "text-stone-300", "border-stone-700");
      } else {
        btn.classList.remove("bg-terracotta", "text-white", "border-terracotta");
        btn.classList.add("bg-charcoal-700", "text-stone-300", "border-stone-700");
      }
    });
  }

  /**
   * Generates a custom archaeological SVG pin marker based on artifact type
   */
  createCustomMarkerIcon(artifact) {
    const config = TYPE_CONFIG[artifact.type] || TYPE_CONFIG["Other"];
    const color = config.color;

    // SVG Pin with circular head and needle pointer
    const svgIconHtml = `
      <div class="archaeo-pin-wrapper group" data-artifact-id="${artifact.id}">
        <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="filter drop-shadow-md transition-transform duration-300 group-hover:scale-125 group-hover:-translate-y-1">
          <path d="M17 0C7.61116 0 0 7.61116 0 17C0 27.5 14.5 42.5 16.2 43.6C16.68 43.95 17.32 43.95 17.8 43.6C19.5 42.5 34 27.5 34 17C34 7.61116 26.3888 0 17 0Z" fill="${color}"/>
          <circle cx="17" cy="17" r="13" fill="#181D26" stroke="#FFFFFF" stroke-width="1.5" stroke-opacity="0.5"/>
          <circle cx="17" cy="17" r="9" fill="${color}" fill-opacity="0.3"/>
        </svg>
        <div class="absolute top-2 left-0 right-0 flex items-center justify-center pointer-events-none">
          <i class="fas ${config.icon} text-[11px] text-white"></i>
        </div>
      </div>
    `;

    return L.divIcon({
      className: "custom-archaeo-marker",
      html: svgIconHtml,
      iconSize: [34, 44],
      iconAnchor: [17, 44],
      popupAnchor: [0, -42]
    });
  }

  /**
   * Builds rich archaeological popup HTML for an artifact
   */
  buildPopupContent(artifact) {
    const typeCfg = TYPE_CONFIG[artifact.type] || TYPE_CONFIG["Other"];
    const periodCfg = PERIOD_CONFIG[artifact.period] || { color: "#C85A32" };

    return `
      <div class="archaeo-popup-card w-72 bg-charcoal-800 text-stone-100 rounded-xl overflow-hidden shadow-2xl border border-stone-700/60 font-sans">
        <div class="relative h-36 w-full overflow-hidden bg-stone-900">
          <img src="${artifact.imageUrl}" alt="${artifact.name}" 
               class="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
               onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';" />
          <div class="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-transparent"></div>
          <div class="absolute top-2 left-2 flex items-center gap-1.5">
            <span class="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-md uppercase text-white shadow-sm" style="background-color: ${typeCfg.color};">
              <i class="fas ${typeCfg.icon} mr-1"></i>${artifact.type}
            </span>
          </div>
          <div class="absolute top-2 right-2">
            <span class="px-2 py-0.5 text-[10px] font-mono rounded-md bg-charcoal-900/80 backdrop-blur-sm text-sandstone-300 border border-stone-700/50">
              ${artifact.id}
            </span>
          </div>
          <div class="absolute bottom-1.5 left-3 right-3 flex justify-between items-end text-[11px] text-stone-300">
            <span class="font-medium flex items-center gap-1"><i class="fas fa-location-dot text-terracotta"></i> ${artifact.site}</span>
            <span class="font-mono bg-charcoal-900/80 px-1.5 py-0.5 rounded text-gold"><i class="fas fa-arrows-down-to-line mr-1"></i>${artifact.depth} m</span>
          </div>
        </div>
        
        <div class="p-3.5 space-y-2.5">
          <h4 class="font-serif text-sm font-bold text-sandstone-100 leading-snug line-clamp-2">
            ${artifact.name}
          </h4>
          
          <div class="grid grid-cols-2 gap-1.5 text-[11px] py-1 border-y border-stone-700/50">
            <div>
              <span class="text-stone-400">Material:</span>
              <span class="font-medium text-stone-200 ml-1">${artifact.material}</span>
            </div>
            <div>
              <span class="text-stone-400">Period:</span>
              <span class="font-medium text-stone-200 ml-1">${artifact.period}</span>
            </div>
            <div class="col-span-2 text-[10px] font-mono text-stone-400 truncate">
              <i class="fas fa-compass text-stone-500 mr-1"></i>${artifact.latitude.toFixed(4)}° N, ${artifact.longitude.toFixed(4)}° E
            </div>
          </div>

          <p class="text-[11px] text-stone-300 line-clamp-2 leading-relaxed italic">
            "${artifact.description}"
          </p>

          <button onclick="app.openDetailModal('${artifact.id}')" 
                  class="w-full mt-1 py-1.5 px-3 bg-stone-700 hover:bg-terracotta text-stone-100 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
            <span>View Full Archaeological Record</span>
            <i class="fas fa-arrow-right text-[10px]"></i>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Renders all GIS layers (Markers, DBSCAN Convex Hulls, Heatmap) according to filters
   */
  renderGISData() {
    if (!this.map) return;

    // Clear existing dynamic layers
    this.markerLayerGroup.clearLayers();
    this.clusterLayerGroup.clearLayers();
    this.heatLayerGroup.clearLayers();

    // 1. Get filtered artifacts based on GIS control panel settings
    const filteredArtifacts = db.filter({
      type: this.activeFilters.type,
      material: this.activeFilters.material,
      period: this.activeFilters.period,
      site: this.activeFilters.site
    });

    // Update active artifact counter badge in GIS control panel
    const countBadge = document.getElementById("gis-filtered-count");
    if (countBadge) {
      countBadge.innerText = `${filteredArtifacts.length} Discoveries Visible`;
    }

    if (filteredArtifacts.length === 0) return;

    // 2. Render Markers if toggled
    if (this.activeFilters.showMarkers) {
      filteredArtifacts.forEach(artifact => {
        const icon = this.createCustomMarkerIcon(artifact);
        const marker = L.marker([artifact.latitude, artifact.longitude], { icon });
        const popupContent = this.buildPopupContent(artifact);

        marker.bindPopup(popupContent, {
          maxWidth: 320,
          className: "custom-leaflet-popup"
        });

        this.markerLayerGroup.addLayer(marker);
      });
    }

    // 3. Run DBSCAN and Render Cluster Boundaries if toggled
    const spatialResult = spatialEngine.runDBSCAN(filteredArtifacts);

    if (this.activeFilters.showClusters && spatialResult.clusters.length > 0) {
      spatialResult.clusters.forEach(cluster => {
        if (cluster.hull && cluster.hull.length >= 3) {
          // Polygon Convex Hull
          const polygon = L.polygon(cluster.hull, {
            color: cluster.color,
            weight: 2,
            opacity: 0.85,
            fillColor: cluster.color,
            fillOpacity: 0.15,
            dashArray: "4, 6"
          });

          // Cluster info popup
          polygon.bindPopup(`
            <div class="p-3 bg-charcoal-800 text-stone-100 rounded-lg text-xs font-sans space-y-1.5 min-w-[200px]">
              <div class="flex items-center justify-between border-b border-stone-700 pb-1">
                <span class="font-serif font-bold text-sm" style="color: ${cluster.color}">${cluster.name}</span>
                <span class="px-1.5 py-0.5 rounded bg-stone-700 text-stone-200 text-[10px] font-mono">${cluster.count} artifacts</span>
              </div>
              <div><span class="text-stone-400">Dominant Site:</span> <span class="text-white font-medium">${cluster.dominantSite}</span></div>
              <div><span class="text-stone-400">Primary Type:</span> <span class="text-white font-medium">${cluster.primaryType}</span></div>
              <div><span class="text-stone-400">Avg Depth:</span> <span class="text-gold font-mono">${cluster.avgDepth} m</span></div>
              <p class="text-[10px] text-stone-400 pt-1 italic">DBSCAN spatial concentration boundary (hull)</p>
            </div>
          `);

          this.clusterLayerGroup.addLayer(polygon);

          // Centroid Badge Pin
          const centroidIcon = L.divIcon({
            className: "cluster-centroid-badge",
            html: `
              <div class="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg border border-white/40 flex items-center gap-1" style="background-color: ${cluster.color};">
                <i class="fas fa-cubes-stacked text-[8px]"></i> ${cluster.name} (${cluster.count})
              </div>
            `,
            iconSize: [80, 24],
            iconAnchor: [40, 12]
          });

          const centroidMarker = L.marker([cluster.avgLat, cluster.avgLon], { icon: centroidIcon });
          this.clusterLayerGroup.addLayer(centroidMarker);
        }
      });
    }

    // 4. Render Density Heatmap if toggled
    if (this.activeFilters.showHeatmap) {
      this.renderDensityHeatmap(filteredArtifacts);
    }
  }

  /**
   * Generates a smooth density heatmap using Leaflet canvas layer or radial gradient circles
   */
  renderDensityHeatmap(artifacts) {
    if (typeof L.heatLayer === "function") {
      const heatPoints = artifacts.map(a => [a.latitude, a.longitude, 0.8]);
      const heat = L.heatLayer(heatPoints, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        gradient: { 0.2: "#3498DB", 0.4: "#2ECC71", 0.6: "#F1C40F", 0.8: "#E67E22", 1.0: "#C85A32" }
      });
      this.heatLayerGroup.addLayer(heat);
    } else {
      // Fallback radial density circles if heatLayer is loading
      artifacts.forEach(a => {
        const circle = L.circle([a.latitude, a.longitude], {
          radius: 120,
          color: "#C85A32",
          weight: 0,
          fillColor: "#C85A32",
          fillOpacity: 0.18
        });
        this.heatLayerGroup.addLayer(circle);
      });
    }
  }

  /**
   * Fit map viewport to encapsulate all recorded survey artifacts
   */
  fitSurveyBounds() {
    if (!this.map) return;
    const all = db.getAll();
    if (all.length === 0) return;

    const latLngs = all.map(a => [a.latitude, a.longitude]);
    const bounds = L.latLngBounds(latLngs);
    this.map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
  }

  /**
   * Center map on specific artifact and open its popup
   */
  focusArtifact(id) {
    const artifact = db.getById(id);
    if (!artifact || !this.map) return;

    this.map.flyTo([artifact.latitude, artifact.longitude], 17, { duration: 1.2 });
  }

  /**
   * Interactive mini-map for Add Artifact page
   * Allows clicking anywhere to adjust artifact coordinates
   */
  initPickerMap(containerId = "picker-map", initialLat = 20.2961, initialLon = 85.8245) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.pickerMap) {
      setTimeout(() => this.pickerMap.invalidateSize(), 200);
      return;
    }

    this.pickerMap = L.map(containerId, {
      center: [initialLat, initialLon],
      zoom: 15,
      zoomControl: true,
      attributionControl: false
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd"
    }).addTo(this.pickerMap);

    const pinIcon = L.divIcon({
      className: "picker-pin",
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-7 h-7 rounded-full bg-terracotta border-2 border-white shadow-xl flex items-center justify-center text-white text-xs animate-bounce">
            <i class="fas fa-crosshairs"></i>
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rounded-full bg-charcoal-900/60"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    this.pickerMarker = L.marker([initialLat, initialLon], {
      icon: pinIcon,
      draggable: true
    }).addTo(this.pickerMap);

    // Update form on marker drag
    this.pickerMarker.on("dragend", (e) => {
      const pos = e.target.getLatLng();
      this.updatePickerInputs(pos.lat, pos.lng);
    });

    // Update form and marker on map click
    this.pickerMap.on("click", (e) => {
      this.pickerMarker.setLatLng(e.latlng);
      this.updatePickerInputs(e.latlng.lat, e.latlng.lng);
    });
  }

  updatePickerInputs(lat, lon) {
    const latInput = document.getElementById("artifact-lat");
    const lonInput = document.getElementById("artifact-lon");
    if (latInput) latInput.value = lat.toFixed(6);
    if (lonInput) lonInput.value = lon.toFixed(6);
  }

  setPickerLocation(lat, lon) {
    if (this.pickerMap && this.pickerMarker) {
      this.pickerMarker.setLatLng([lat, lon]);
      this.pickerMap.panTo([lat, lon]);
    }
  }

  /**
   * Renders mini-map for the Artifact Detail Modal
   */
  renderDetailMiniMap(containerId, lat, lon, artifactName, artifactType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (this.detailMap) {
      this.detailMap.remove();
      this.detailMap = null;
    }

    this.detailMap = L.map(containerId, {
      center: [lat, lon],
      zoom: 16,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd"
    }).addTo(this.detailMap);

    const typeCfg = TYPE_CONFIG[artifactType] || TYPE_CONFIG["Other"];

    const markerHtml = `
      <div class="flex items-center justify-center">
        <div class="w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white text-xs" style="background-color: ${typeCfg.color};">
          <i class="fas ${typeCfg.icon}"></i>
        </div>
      </div>
    `;

    const icon = L.divIcon({
      className: "detail-pin",
      html: markerHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([lat, lon], { icon }).addTo(this.detailMap);
  }
}

// Global GIS engine instance
const gis = new ArchaeologicalGIS();
