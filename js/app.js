/**
 * ARCHAEOMap - Main Application Controller
 * Handles SPA navigation, repository views, modal management, field recording forms,
 * photo upload, global search, and real-time interface reactivity.
 */

class ArchaeoApp {
  constructor() {
    this.currentView = "dashboard";
    this.repoViewMode = "grid"; // 'grid' or 'table'
    this.repoPage = 1;
    this.repoPageSize = 9;
    this.selectedArtifactId = null;
    this.uploadedImageBase64 = null;
  }

  init() {
    // 1. Setup navigation listeners
    this.setupNavigation();

    // 2. Setup global search
    this.setupSearch();

    // 3. Setup form handling
    this.setupAddArtifactForm();

    // 4. Setup repository filters
    this.setupRepositoryFilters();

    // 5. Setup GIS control panel
    this.setupGISControls();

    // 6. Setup spatial DBSCAN tuner
    this.setupSpatialTuner();

    // 7. Subscribe to DB updates
    db.subscribe(() => {
      this.refreshCurrentView();
    });

    // 8. Initial view load
    this.navigateTo("dashboard");
    this.updateGlobalKPIs();
  }

  /**
   * Navigation router
   */
  setupNavigation() {
    const navLinks = document.querySelectorAll("[data-nav-target]");
    navLinks.forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.dataset.navTarget;
        this.navigateTo(target);

        // Close mobile drawer if open
        const sidebar = document.getElementById("main-sidebar");
        const backdrop = document.getElementById("sidebar-backdrop");
        if (sidebar && !sidebar.classList.contains("-translate-x-full")) {
          sidebar.classList.add("-translate-x-full");
          if (backdrop) backdrop.classList.add("hidden");
        }
      });
    });

    // Mobile sidebar toggle button
    const mobileToggle = document.getElementById("mobile-menu-toggle");
    const mobileClose = document.getElementById("mobile-menu-close");
    const sidebar = document.getElementById("main-sidebar");
    const backdrop = document.getElementById("sidebar-backdrop");

    if (mobileToggle && sidebar) {
      mobileToggle.addEventListener("click", () => {
        sidebar.classList.remove("-translate-x-full");
        if (backdrop) backdrop.classList.remove("hidden");
      });
    }

    if (mobileClose && sidebar) {
      mobileClose.addEventListener("click", () => {
        sidebar.classList.add("-translate-x-full");
        if (backdrop) backdrop.classList.add("hidden");
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener("click", () => {
        sidebar.classList.add("-translate-x-full");
        backdrop.classList.add("hidden");
      });
    }
  }

  /**
   * Navigate to a designated view section
   */
  navigateTo(viewId) {
    this.currentView = viewId;

    // Hide all view containers
    const views = document.querySelectorAll(".app-view");
    views.forEach(v => v.classList.add("hidden"));

    // Show active view
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
      targetView.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Update navigation active states
    document.querySelectorAll("[data-nav-target]").forEach(btn => {
      if (btn.dataset.navTarget === viewId) {
        btn.classList.add("bg-charcoal-700", "text-gold", "border-l-4", "border-terracotta");
        btn.classList.remove("text-stone-300", "hover:text-white");
      } else {
        btn.classList.remove("bg-charcoal-700", "text-gold", "border-l-4", "border-terracotta");
        btn.classList.add("text-stone-300", "hover:text-white");
      }
    });

    // Trigger view-specific render logic
    if (viewId === "dashboard") {
      this.renderDashboard();
    } else if (viewId === "gis-explorer") {
      setTimeout(() => {
        gis.initMainMap();
        gis.renderGISData();
        gis.fitSurveyBounds();
      }, 150);
    } else if (viewId === "repository") {
      this.renderRepository();
    } else if (viewId === "spatial-analysis") {
      setTimeout(() => {
        analytics.renderSpatialAnalysisCharts();
      }, 100);
    } else if (viewId === "analytics") {
      setTimeout(() => {
        analytics.renderAnalyticsPage();
      }, 100);
    } else if (viewId === "add-artifact") {
      setTimeout(() => {
        gis.initPickerMap();
      }, 150);
    } else if (viewId === "export-data") {
      this.renderExportDataPreview();
    }
  }

  refreshCurrentView() {
    this.updateGlobalKPIs();
    this.navigateTo(this.currentView);
  }

  /**
   * Global Header & Dashboard KPI Cards Updater
   */
  updateGlobalKPIs() {
    const stats = db.getStats();
    const spatial = spatialEngine.runDBSCAN(db.getAll());

    // Dashboard Statistics Cards
    const totalEl = document.getElementById("stat-total-artifacts");
    const sitesEl = document.getElementById("stat-survey-sites");
    const catEl = document.getElementById("stat-categories");
    const clusterEl = document.getElementById("stat-clusters");

    if (totalEl) totalEl.innerText = stats.totalArtifacts;
    if (sitesEl) sitesEl.innerText = stats.surveySitesCount;
    if (catEl) catEl.innerText = stats.categoriesCount;
    if (clusterEl) clusterEl.innerText = spatial.stats.totalClusters;
  }

  /**
   * Render Dashboard view
   */
  renderDashboard() {
    this.updateGlobalKPIs();
    setTimeout(() => {
      analytics.renderDashboardCharts();
    }, 100);
    this.renderRecentDiscoveries();
  }

  /**
   * Render Recent Discoveries section on Dashboard
   */
  renderRecentDiscoveries() {
    const container = document.getElementById("recent-discoveries-container");
    if (!container) return;

    const stats = db.getStats();
    const recent = stats.recentArtifacts;

    if (recent.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-8 text-center bg-charcoal-800 rounded-2xl border border-stone-800">
          <p class="text-stone-400 font-serif">No archaeological records documented yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = recent.map(artifact => {
      const typeCfg = TYPE_CONFIG[artifact.type] || TYPE_CONFIG["Other"];

      return `
        <div class="bg-charcoal-800/90 rounded-2xl overflow-hidden border border-stone-800 hover:border-terracotta/50 shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between">
          <div>
            <div class="relative h-44 w-full overflow-hidden bg-stone-900">
              <img src="${artifact.imageUrl}" alt="${artifact.name}" 
                   class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                   onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';" />
              <div class="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-transparent"></div>
              <div class="absolute top-2.5 left-2.5">
                <span class="px-2.5 py-1 text-[11px] font-semibold tracking-wider rounded-lg uppercase text-white shadow-md" style="background-color: ${typeCfg.color};">
                  <i class="fas ${typeCfg.icon} mr-1"></i>${artifact.type}
                </span>
              </div>
              <div class="absolute top-2.5 right-2.5">
                <span class="px-2 py-0.5 text-xs font-mono rounded bg-charcoal-900/80 backdrop-blur-sm text-sandstone-300 border border-stone-700/60">
                  ${artifact.id}
                </span>
              </div>
              <div class="absolute bottom-2 left-3 right-3 flex justify-between items-center text-xs text-stone-300">
                <span class="font-medium text-sandstone-200"><i class="fas fa-landmark text-terracotta mr-1"></i>${artifact.site}</span>
                <span class="font-mono bg-charcoal-900/80 px-2 py-0.5 rounded text-gold"><i class="fas fa-arrows-down-to-line mr-1"></i>${artifact.depth}m</span>
              </div>
            </div>

            <div class="p-4 space-y-2.5">
              <h4 class="font-serif text-base font-bold text-sandstone-100 group-hover:text-gold transition-colors line-clamp-1">
                ${artifact.name}
              </h4>

              <div class="grid grid-cols-2 gap-2 text-xs py-1.5 border-y border-stone-800 text-stone-300">
                <div><span class="text-stone-500">Material:</span> <span class="text-stone-200 font-medium">${artifact.material}</span></div>
                <div><span class="text-stone-500">Period:</span> <span class="text-stone-200 font-medium">${artifact.period}</span></div>
              </div>

              <p class="text-xs text-stone-400 line-clamp-2 leading-relaxed italic">
                "${artifact.description}"
              </p>
            </div>
          </div>

          <div class="p-4 pt-0">
            <button onclick="app.openDetailModal('${artifact.id}')" 
                    class="w-full py-2 px-3 rounded-xl bg-charcoal-700 hover:bg-terracotta text-stone-200 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-2 shadow-sm">
              <span>View Record Details</span>
              <i class="fas fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  /**
   * Setup Repository Filters and View Toggle
   */
  setupRepositoryFilters() {
    const searchInput = document.getElementById("repo-search-input");
    const typeSelect = document.getElementById("repo-filter-type");
    const materialSelect = document.getElementById("repo-filter-material");
    const periodSelect = document.getElementById("repo-filter-period");
    const siteSelect = document.getElementById("repo-filter-site");
    const depthRange = document.getElementById("repo-filter-depth");
    const depthValDisplay = document.getElementById("repo-depth-val");
    const resetBtn = document.getElementById("repo-filter-reset");

    const triggerFilter = () => {
      this.repoPage = 1;
      this.renderRepository();
    };

    if (searchInput) searchInput.addEventListener("input", triggerFilter);
    if (typeSelect) typeSelect.addEventListener("change", triggerFilter);
    if (materialSelect) materialSelect.addEventListener("change", triggerFilter);
    if (periodSelect) periodSelect.addEventListener("change", triggerFilter);
    if (siteSelect) siteSelect.addEventListener("change", triggerFilter);

    if (depthRange) {
      depthRange.addEventListener("input", (e) => {
        if (depthValDisplay) depthValDisplay.innerText = `${e.target.value} m`;
        triggerFilter();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (typeSelect) typeSelect.value = "All";
        if (materialSelect) materialSelect.value = "All";
        if (periodSelect) periodSelect.value = "All";
        if (siteSelect) siteSelect.value = "All";
        if (depthRange) {
          depthRange.value = "5";
          if (depthValDisplay) depthValDisplay.innerText = "5.0 m";
        }
        triggerFilter();
      });
    }

    // View toggle buttons (Grid vs Table)
    const gridBtn = document.getElementById("repo-view-grid-btn");
    const tableBtn = document.getElementById("repo-view-table-btn");

    if (gridBtn && tableBtn) {
      gridBtn.addEventListener("click", () => {
        this.repoViewMode = "grid";
        gridBtn.classList.add("bg-charcoal-700", "text-gold");
        gridBtn.classList.remove("text-stone-400");
        tableBtn.classList.remove("bg-charcoal-700", "text-gold");
        tableBtn.classList.add("text-stone-400");
        this.renderRepository();
      });

      tableBtn.addEventListener("click", () => {
        this.repoViewMode = "table";
        tableBtn.classList.add("bg-charcoal-700", "text-gold");
        tableBtn.classList.remove("text-stone-400");
        gridBtn.classList.remove("bg-charcoal-700", "text-gold");
        gridBtn.classList.add("text-stone-400");
        this.renderRepository();
      });
    }
  }

  /**
   * Render Artifact Repository (Grid or Table View with Pagination)
   */
  renderRepository() {
    const searchVal = document.getElementById("repo-search-input")?.value || "";
    const typeVal = document.getElementById("repo-filter-type")?.value || "All";
    const matVal = document.getElementById("repo-filter-material")?.value || "All";
    const perVal = document.getElementById("repo-filter-period")?.value || "All";
    const siteVal = document.getElementById("repo-filter-site")?.value || "All";
    const maxDepthVal = document.getElementById("repo-filter-depth")?.value || 5;

    const filtered = db.filter({
      search: searchVal,
      type: typeVal,
      material: matVal,
      period: perVal,
      site: siteVal,
      maxDepth: maxDepthVal
    });

    const countDisplay = document.getElementById("repo-results-count");
    if (countDisplay) {
      countDisplay.innerText = `Showing ${filtered.length} of ${db.getAll().length} Archaeological Records`;
    }

    const container = document.getElementById("repo-content-container");
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full p-12 text-center bg-charcoal-800 rounded-3xl border border-stone-800 space-y-4">
          <div class="w-16 h-16 rounded-full bg-stone-800 text-stone-400 mx-auto flex items-center justify-center text-2xl">
            🏺
          </div>
          <h3 class="font-serif text-lg font-bold text-sandstone-100">No archaeological records yet.</h3>
          <p class="text-sm text-stone-400 max-w-md mx-auto">No discoveries matched your active search query or filter parameters. Start documenting your first discovery.</p>
          <button onclick="app.navigateTo('add-artifact')" class="px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white font-medium text-sm transition-colors shadow-lg">
            <i class="fas fa-plus mr-1.5"></i> Record Artifact
          </button>
        </div>
      `;
      this.renderPagination(0);
      return;
    }

    // Pagination slice
    const totalPages = Math.ceil(filtered.length / this.repoPageSize);
    if (this.repoPage > totalPages) this.repoPage = 1;
    const startIdx = (this.repoPage - 1) * this.repoPageSize;
    const paginatedItems = filtered.slice(startIdx, startIdx + this.repoPageSize);

    if (this.repoViewMode === "grid") {
      container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      container.innerHTML = paginatedItems.map(artifact => {
        const typeCfg = TYPE_CONFIG[artifact.type] || TYPE_CONFIG["Other"];

        return `
          <div class="bg-charcoal-800/90 rounded-2xl overflow-hidden border border-stone-800 hover:border-terracotta/50 shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between">
            <div>
              <div class="relative h-48 w-full overflow-hidden bg-stone-900">
                <img src="${artifact.imageUrl}" alt="${artifact.name}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                     onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';" />
                <div class="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-transparent"></div>
                <div class="absolute top-3 left-3">
                  <span class="px-2.5 py-1 text-xs font-semibold rounded-lg text-white shadow-md" style="background-color: ${typeCfg.color};">
                    <i class="fas ${typeCfg.icon} mr-1"></i>${artifact.type}
                  </span>
                </div>
                <div class="absolute top-3 right-3">
                  <span class="px-2 py-0.5 text-xs font-mono rounded bg-charcoal-900/80 backdrop-blur-sm text-sandstone-300 border border-stone-700/60">
                    ${artifact.id}
                  </span>
                </div>
                <div class="absolute bottom-2 left-3 right-3 flex justify-between items-center text-xs text-stone-300">
                  <span class="font-medium text-sandstone-200"><i class="fas fa-location-dot text-terracotta mr-1"></i>${artifact.site}</span>
                  <span class="font-mono bg-charcoal-900/80 px-2 py-0.5 rounded text-gold"><i class="fas fa-arrows-down-to-line mr-1"></i>${artifact.depth}m</span>
                </div>
              </div>

              <div class="p-5 space-y-3">
                <h4 class="font-serif text-lg font-bold text-sandstone-100 group-hover:text-gold transition-colors line-clamp-1">
                  ${artifact.name}
                </h4>

                <div class="grid grid-cols-2 gap-2 text-xs py-2 border-y border-stone-800 text-stone-300">
                  <div><span class="text-stone-500">Material:</span> <span class="text-stone-200 font-medium">${artifact.material}</span></div>
                  <div><span class="text-stone-500">Period:</span> <span class="text-stone-200 font-medium">${artifact.period}</span></div>
                  <div class="col-span-2 text-[11px] font-mono text-stone-400 truncate">
                    <i class="fas fa-compass text-stone-500 mr-1"></i>${artifact.latitude.toFixed(4)}°N, ${artifact.longitude.toFixed(4)}°E
                  </div>
                </div>

                <p class="text-xs text-stone-400 line-clamp-2 leading-relaxed italic">
                  "${artifact.description}"
                </p>
              </div>
            </div>

            <div class="p-5 pt-0 flex items-center gap-2">
              <button onclick="app.openDetailModal('${artifact.id}')" 
                      class="flex-1 py-2 px-3 rounded-xl bg-charcoal-700 hover:bg-terracotta text-stone-200 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                <i class="fas fa-eye"></i>
                <span>View Details</span>
              </button>
              <button onclick="app.locateOnGIS('${artifact.id}')" 
                      title="Locate on GIS Explorer"
                      class="w-9 h-9 rounded-xl bg-charcoal-700 hover:bg-stone-600 text-gold flex items-center justify-center transition-colors">
                <i class="fas fa-map-location-dot"></i>
              </button>
            </div>
          </div>
        `;
      }).join("");
    } else {
      // Table View
      container.className = "w-full overflow-x-auto";
      container.innerHTML = `
        <div class="min-w-full inline-block align-middle">
          <div class="overflow-hidden rounded-2xl border border-stone-800 bg-charcoal-800/90 shadow-xl">
            <table class="min-w-full divide-y divide-stone-800 text-left text-xs text-stone-300">
              <thead class="bg-charcoal-900/90 font-serif text-sandstone-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th scope="col" class="px-4 py-3.5">Photograph</th>
                  <th scope="col" class="px-4 py-3.5">ID</th>
                  <th scope="col" class="px-4 py-3.5">Artifact Name</th>
                  <th scope="col" class="px-4 py-3.5">Type</th>
                  <th scope="col" class="px-4 py-3.5">Material</th>
                  <th scope="col" class="px-4 py-3.5">Period</th>
                  <th scope="col" class="px-4 py-3.5">Site</th>
                  <th scope="col" class="px-4 py-3.5">Depth</th>
                  <th scope="col" class="px-4 py-3.5">Coordinates</th>
                  <th scope="col" class="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-800/60 font-sans">
                ${paginatedItems.map(artifact => {
                  const typeCfg = TYPE_CONFIG[artifact.type] || TYPE_CONFIG["Other"];
                  return `
                    <tr class="hover:bg-charcoal-700/50 transition-colors">
                      <td class="px-4 py-3 whitespace-nowrap">
                        <img src="${artifact.imageUrl}" alt="${artifact.name}" 
                             class="w-10 h-10 rounded-lg object-cover border border-stone-700"
                             onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';" />
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap font-mono text-gold font-medium">
                        ${artifact.id}
                      </td>
                      <td class="px-4 py-3 font-serif font-bold text-sandstone-100 max-w-xs truncate">
                        ${artifact.name}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap">
                        <span class="px-2 py-0.5 rounded text-[10px] font-semibold text-white" style="background-color: ${typeCfg.color};">
                          ${artifact.type}
                        </span>
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-stone-200">
                        ${artifact.material}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-stone-200">
                        ${artifact.period}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap font-medium text-terracotta">
                        ${artifact.site}
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap font-mono text-sandstone-200">
                        ${artifact.depth} m
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-stone-400">
                        ${artifact.latitude.toFixed(4)}°N, ${artifact.longitude.toFixed(4)}°E
                      </td>
                      <td class="px-4 py-3 whitespace-nowrap text-right space-x-1.5">
                        <button onclick="app.openDetailModal('${artifact.id}')" 
                                class="px-2.5 py-1 rounded bg-charcoal-700 hover:bg-terracotta text-stone-200 hover:text-white transition-colors">
                          Details
                        </button>
                        <button onclick="app.locateOnGIS('${artifact.id}')" 
                                title="Locate on Map"
                                class="px-2 py-1 rounded bg-charcoal-700 hover:bg-stone-600 text-gold transition-colors">
                          <i class="fas fa-map-location-dot"></i>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    this.renderPagination(totalPages);
  }

  /**
   * Render Pagination Controls
   */
  renderPagination(totalPages) {
    const container = document.getElementById("repo-pagination");
    if (!container) return;

    if (totalPages <= 1) {
      container.innerHTML = "";
      return;
    }

    let buttonsHtml = `
      <div class="flex items-center gap-1.5">
        <button onclick="app.setRepoPage(${this.repoPage - 1})" 
                ${this.repoPage === 1 ? "disabled class='opacity-40 cursor-not-allowed'" : "class='hover:bg-charcoal-700'"}
                class="px-3 py-1.5 rounded-lg bg-charcoal-800 border border-stone-800 text-stone-300 text-xs transition-colors">
          <i class="fas fa-chevron-left"></i>
        </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      if (i === this.repoPage) {
        buttonsHtml += `
          <button class="px-3 py-1.5 rounded-lg bg-terracotta text-white text-xs font-bold shadow-md">
            ${i}
          </button>
        `;
      } else {
        buttonsHtml += `
          <button onclick="app.setRepoPage(${i})" class="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 border border-stone-800 text-stone-300 text-xs transition-colors">
            ${i}
          </button>
        `;
      }
    }

    buttonsHtml += `
        <button onclick="app.setRepoPage(${this.repoPage + 1})" 
                ${this.repoPage === totalPages ? "disabled class='opacity-40 cursor-not-allowed'" : "class='hover:bg-charcoal-700'"}
                class="px-3 py-1.5 rounded-lg bg-charcoal-800 border border-stone-800 text-stone-300 text-xs transition-colors">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    container.innerHTML = buttonsHtml;
  }

  setRepoPage(page) {
    this.repoPage = page;
    this.renderRepository();
  }

  /**
   * Navigate to GIS Explorer and fly directly to artifact marker
   */
  locateOnGIS(id) {
    this.navigateTo("gis-explorer");
    setTimeout(() => {
      gis.focusArtifact(id);
    }, 300);
  }

  /**
   * Open full specimen detail modal
   */
  openDetailModal(id) {
    const artifact = db.getById(id);
    if (!artifact) return;

    this.selectedArtifactId = id;
    const modal = document.getElementById("artifact-detail-modal");
    if (!modal) return;

    const typeCfg = TYPE_CONFIG[artifact.type] || TYPE_CONFIG["Other"];

    // Fill modal fields
    document.getElementById("detail-modal-image").src = artifact.imageUrl;
    document.getElementById("detail-modal-name").innerText = artifact.name;
    document.getElementById("detail-modal-id").innerText = artifact.id;
    
    const typeBadge = document.getElementById("detail-modal-type");
    typeBadge.innerText = artifact.type;
    typeBadge.style.backgroundColor = typeCfg.color;

    document.getElementById("detail-modal-material").innerText = artifact.material;
    document.getElementById("detail-modal-period").innerText = artifact.period;
    document.getElementById("detail-modal-site").innerText = artifact.site;
    document.getElementById("detail-modal-trench").innerText = artifact.excavationArea || "N/A";
    document.getElementById("detail-modal-layer").innerText = artifact.layer || "N/A";
    document.getElementById("detail-modal-depth").innerText = `${artifact.depth} meters below surface`;
    document.getElementById("detail-modal-coords").innerText = `${artifact.latitude.toFixed(6)}° N, ${artifact.longitude.toFixed(6)}° E`;
    document.getElementById("detail-modal-description").innerText = artifact.description;
    document.getElementById("detail-modal-recorded-by").innerText = `${artifact.recordedBy} (${artifact.dateRecorded})`;

    // Show modal
    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");

    // Initialize spatial context mini-map
    setTimeout(() => {
      gis.renderDetailMiniMap("detail-mini-map", artifact.latitude, artifact.longitude, artifact.name, artifact.type);
    }, 200);
  }

  closeDetailModal() {
    const modal = document.getElementById("artifact-detail-modal");
    if (modal) {
      modal.classList.add("hidden");
      document.body.classList.remove("overflow-hidden");
    }
  }

  /**
   * Setup GIS Floating Controls
   */
  setupGISControls() {
    const typeFilter = document.getElementById("gis-filter-type");
    const matFilter = document.getElementById("gis-filter-material");
    const perFilter = document.getElementById("gis-filter-period");
    const siteFilter = document.getElementById("gis-filter-site");

    const toggleMarkers = document.getElementById("gis-toggle-markers");
    const toggleHeatmap = document.getElementById("gis-toggle-heatmap");
    const toggleClusters = document.getElementById("gis-toggle-clusters");
    const resetBtn = document.getElementById("gis-reset-filters");

    const updateMap = () => {
      if (typeFilter) gis.activeFilters.type = typeFilter.value;
      if (matFilter) gis.activeFilters.material = matFilter.value;
      if (perFilter) gis.activeFilters.period = perFilter.value;
      if (siteFilter) gis.activeFilters.site = siteFilter.value;

      if (toggleMarkers) gis.activeFilters.showMarkers = toggleMarkers.checked;
      if (toggleHeatmap) gis.activeFilters.showHeatmap = toggleHeatmap.checked;
      if (toggleClusters) gis.activeFilters.showClusters = toggleClusters.checked;

      gis.renderGISData();
    };

    if (typeFilter) typeFilter.addEventListener("change", updateMap);
    if (matFilter) matFilter.addEventListener("change", updateMap);
    if (perFilter) perFilter.addEventListener("change", updateMap);
    if (siteFilter) siteFilter.addEventListener("change", updateMap);

    if (toggleMarkers) toggleMarkers.addEventListener("change", updateMap);
    if (toggleHeatmap) toggleHeatmap.addEventListener("change", updateMap);
    if (toggleClusters) toggleClusters.addEventListener("change", updateMap);

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (typeFilter) typeFilter.value = "All";
        if (matFilter) matFilter.value = "All";
        if (perFilter) perFilter.value = "All";
        if (siteFilter) siteFilter.value = "All";
        if (toggleMarkers) toggleMarkers.checked = true;
        if (toggleHeatmap) toggleHeatmap.checked = false;
        if (toggleClusters) toggleClusters.checked = true;
        updateMap();
        gis.fitSurveyBounds();
      });
    }

    // Base layer buttons
    const layerButtons = document.querySelectorAll(".gis-layer-btn");
    layerButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        gis.switchBaseLayer(btn.dataset.layer);
      });
    });

    // Fit bounds button
    const fitBtn = document.getElementById("gis-btn-fit-bounds");
    if (fitBtn) {
      fitBtn.addEventListener("click", () => {
        gis.fitSurveyBounds();
      });
    }
  }

  /**
   * Setup DBSCAN Interactive Tuner on Spatial Analysis page
   */
  setupSpatialTuner() {
    const epsRange = document.getElementById("spatial-eps-range");
    const epsDisplay = document.getElementById("spatial-eps-val");
    const minPtsInput = document.getElementById("spatial-minpts-input");
    const reclusterBtn = document.getElementById("spatial-recluster-btn");

    if (epsRange && epsDisplay) {
      epsRange.addEventListener("input", (e) => {
        epsDisplay.innerText = `${parseFloat(e.target.value).toFixed(2)} km`;
      });
    }

    if (reclusterBtn) {
      reclusterBtn.addEventListener("click", () => {
        const eps = parseFloat(epsRange?.value || 0.48);
        const minPts = parseInt(minPtsInput?.value || 3, 10);
        spatialEngine.epsKm = eps;
        spatialEngine.minPts = minPts;

        analytics.renderSpatialAnalysisCharts();
        this.showToast("DBSCAN Re-clustered", `Computed with Epsilon = ${eps} km, MinPoints = ${minPts}`, "success");
      });
    }
  }

  /**
   * Setup Add Artifact Form, image dropzone, and preset photos
   */
  setupAddArtifactForm() {
    const form = document.getElementById("form-add-artifact");
    const fileInput = document.getElementById("artifact-file-input");
    const dropzone = document.getElementById("artifact-dropzone");
    const previewContainer = document.getElementById("upload-preview-container");
    const previewImg = document.getElementById("upload-preview-img");
    const removeImgBtn = document.getElementById("remove-upload-btn");
    const siteSelect = document.getElementById("artifact-site");

    // Auto-update coordinates when site changes in the form
    if (siteSelect) {
      siteSelect.addEventListener("change", (e) => {
        const siteKey = e.target.value;
        if (SITE_CONFIG[siteKey]) {
          const [lat, lon] = SITE_CONFIG[siteKey].center;
          gis.updatePickerInputs(lat, lon);
          gis.setPickerLocation(lat, lon);
        }
      });
    }

    // Drag-and-drop file upload handling
    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());

      dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("border-terracotta", "bg-terracotta/5");
      });

      dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("border-terracotta", "bg-terracotta/5");
      });

      dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-terracotta", "bg-terracotta/5");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleImageUpload(e.dataTransfer.files[0]);
        }
      });

      fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleImageUpload(e.target.files[0]);
        }
      });
    }

    if (removeImgBtn) {
      removeImgBtn.addEventListener("click", () => {
        this.uploadedImageBase64 = null;
        if (previewContainer) previewContainer.classList.add("hidden");
        if (dropzone) dropzone.classList.remove("hidden");
      });
    }

    // Curated Archaeological Preset Selection
    const presetButtons = document.querySelectorAll(".photo-preset-btn");
    presetButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const url = btn.dataset.url;
        this.uploadedImageBase64 = url;
        if (previewImg) previewImg.src = url;
        if (previewContainer) previewContainer.classList.remove("hidden");
        if (dropzone) dropzone.classList.add("hidden");
        this.showToast("Specimen Photograph Selected", "Preset archaeological photo applied to field record", "info");
      });
    });

    // Form Submission
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();

        try {
          const newRecord = {
            name: document.getElementById("artifact-name").value,
            type: document.getElementById("artifact-type").value,
            material: document.getElementById("artifact-material").value,
            period: document.getElementById("artifact-period").value,
            site: document.getElementById("artifact-site").value,
            excavationArea: document.getElementById("artifact-excavation-area").value,
            layer: document.getElementById("artifact-layer").value,
            depth: document.getElementById("artifact-depth").value,
            latitude: document.getElementById("artifact-lat").value,
            longitude: document.getElementById("artifact-lon").value,
            description: document.getElementById("artifact-description").value,
            recordedBy: document.getElementById("artifact-recorded-by").value,
            imageUrl: this.uploadedImageBase64 || "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
          };

          const added = db.add(newRecord);

          // Show success message banner
          const successBanner = document.getElementById("add-artifact-success");
          if (successBanner) {
            successBanner.classList.remove("hidden");
            setTimeout(() => {
              successBanner.classList.add("hidden");
            }, 6000);
          }

          this.showToast("✓ Artifact Successfully Recorded", "Your archaeological field record has been added to the repository.", "success");

          // Reset form
          form.reset();
          this.uploadedImageBase64 = null;
          if (previewContainer) previewContainer.classList.add("hidden");
          if (dropzone) dropzone.classList.remove("hidden");

          // Re-init picker map
          gis.updatePickerInputs(20.2961, 85.8245);
          gis.setPickerLocation(20.2961, 85.8245);

          // Scroll to top of form
          window.scrollTo({ top: 0, behavior: "smooth" });

        } catch (err) {
          this.showToast("Validation Error", err.message, "warning");
        }
      });
    }
  }

  handleImageUpload(file) {
    if (!file.type.match("image.*")) {
      this.showToast("Invalid File", "Please select a valid image file (JPG, PNG, WEBP)", "warning");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.uploadedImageBase64 = e.target.result;
      const previewImg = document.getElementById("upload-preview-img");
      const previewContainer = document.getElementById("upload-preview-container");
      const dropzone = document.getElementById("artifact-dropzone");

      if (previewImg) previewImg.src = this.uploadedImageBase64;
      if (previewContainer) previewContainer.classList.remove("hidden");
      if (dropzone) dropzone.classList.add("hidden");
    };
    reader.readAsDataURL(file);
  }

  /**
   * Setup Global Instant Search Modal
   */
  setupSearch() {
    const globalInput = document.getElementById("global-search-input");
    const resultsContainer = document.getElementById("global-search-results");

    if (globalInput && resultsContainer) {
      globalInput.addEventListener("input", (e) => {
        const query = e.target.value.trim();
        if (!query) {
          resultsContainer.classList.add("hidden");
          return;
        }

        const matches = db.filter({ search: query });
        resultsContainer.classList.remove("hidden");

        if (matches.length === 0) {
          resultsContainer.innerHTML = `
            <div class="p-4 text-xs text-stone-400 text-center italic">
              No matching artifacts found.
            </div>
          `;
          return;
        }

        resultsContainer.innerHTML = matches.slice(0, 5).map(item => `
          <div onclick="app.openDetailModal('${item.id}'); document.getElementById('global-search-results').classList.add('hidden');" 
               class="p-3 hover:bg-charcoal-700/80 cursor-pointer border-b border-stone-700/40 flex items-center gap-3 transition-colors">
            <img src="${item.imageUrl}" class="w-9 h-9 rounded object-cover border border-stone-700 shrink-0" 
                 onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';" />
            <div class="flex-1 min-w-0">
              <h5 class="text-xs font-serif font-bold text-sandstone-100 truncate">${item.name}</h5>
              <p class="text-[10px] text-stone-400 truncate">${item.id} &bull; ${item.site} &bull; ${item.type} (${item.depth}m)</p>
            </div>
            <i class="fas fa-arrow-right text-[10px] text-terracotta"></i>
          </div>
        `).join("");
      });

      // Close search results on outside click
      document.addEventListener("click", (e) => {
        if (!globalInput.contains(e.target) && !resultsContainer.contains(e.target)) {
          resultsContainer.classList.add("hidden");
        }
      });
    }
  }

  /**
   * Render Export Data Schema Preview
   */
  renderExportDataPreview() {
    const totalCountEl = document.getElementById("export-total-count");
    if (totalCountEl) totalCountEl.innerText = db.getAll().length;
  }

  /**
   * Toast notification display
   */
  showToast(title, message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    let iconClass = "fa-info-circle text-blue-400";
    let borderClass = "border-blue-500/50";

    if (type === "success") {
      iconClass = "fa-check-circle text-emerald-400";
      borderClass = "border-emerald-500/50";
    } else if (type === "warning") {
      iconClass = "fa-triangle-exclamation text-amber-400";
      borderClass = "border-amber-500/50";
    }

    toast.className = `p-4 rounded-xl bg-charcoal-800 text-stone-100 shadow-2xl border ${borderClass} flex items-start gap-3 transform translate-y-2 opacity-0 transition-all duration-300 max-w-sm font-sans`;
    toast.innerHTML = `
      <i class="fas ${iconClass} mt-0.5 text-base shrink-0"></i>
      <div class="flex-1">
        <h5 class="text-xs font-serif font-bold text-sandstone-100">${title}</h5>
        <p class="text-xs text-stone-300 mt-0.5 leading-relaxed">${message}</p>
      </div>
      <button class="text-stone-500 hover:text-white text-xs ml-1" onclick="this.parentElement.remove()">
        <i class="fas fa-times"></i>
      </button>
    `;

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    // Auto dismiss after 4.5s
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

// Global App instance
const app = new ArchaeoApp();

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
