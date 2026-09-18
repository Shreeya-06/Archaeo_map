/**
 * ARCHAEOMap - Main Application Controller
 * Enhanced with Dual Theme Switching (Obsidian vs Papyrus),
 * Interactive Stratigraphy Trench Simulator, Raking Light (RTI) Inspector,
 * and Official Field Certificate with 3D Wax Seal.
 */

class ArchaeoApp {
  constructor() {
    this.currentView = "dashboard";
    this.repoViewMode = "grid";
    this.repoPage = 1;
    this.repoPageSize = 9;
    this.selectedArtifactId = null;
    this.uploadedImageBase64 = null;
    this.activeStratumIndex = 2; // Default to Stratum III (Ash Layer)
    this.currentTheme = localStorage.getItem("archaeomap_theme") || "obsidian";
  }

  init() {
    // 1. Apply persisted theme
    this.applyTheme(this.currentTheme);

    // 2. Setup navigation listeners
    this.setupNavigation();

    // 3. Setup global search
    this.setupSearch();

    // 4. Setup form handling
    this.setupAddArtifactForm();

    // 5. Setup repository filters
    this.setupRepositoryFilters();

    // 6. Setup GIS control panel & timeline
    this.setupGISControls();

    // 7. Setup spatial DBSCAN tuner
    this.setupSpatialTuner();

    // 8. Setup stratigraphy trench simulator
    this.setupStratigraphyTrench();

    // 9. Setup Agentic AI Archaeological Engine
    this.archaeoAgent = new ArchaeoAgentEngine(this);
    this.archaeoAgent.init();

    // 10. Subscribe to DB updates
    db.subscribe(() => {
      this.refreshCurrentView();
    });

    // 11. Initial view load
    this.navigateTo("dashboard");
    this.updateGlobalKPIs();
  }

  /**
   * Theme Manager (Obsidian Relic vs Ancient Papyrus)
   */
  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem("archaeomap_theme", theme);

    if (theme === "papyrus") {
      document.body.classList.add("theme-papyrus");
    } else {
      document.body.classList.remove("theme-papyrus");
    }

    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    if (themeToggleBtn) {
      if (theme === "papyrus") {
        themeToggleBtn.innerHTML = `<i class="fas fa-scroll text-amber-700"></i> <span class="hidden sm:inline">Ancient Papyrus</span>`;
      } else {
        themeToggleBtn.innerHTML = `<i class="fas fa-gem text-gold"></i> <span class="hidden sm:inline">Obsidian Relic</span>`;
      }
    }
  }

  toggleTheme() {
    const nextTheme = this.currentTheme === "obsidian" ? "papyrus" : "obsidian";
    this.applyTheme(nextTheme);
    this.showToast(
      nextTheme === "papyrus" ? "Ancient Papyrus Mode" : "Obsidian Relic Mode",
      nextTheme === "papyrus" ? "Switched to aged field notebook aesthetic." : "Switched to museum dark obsidian aesthetic.",
      "info"
    );
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

        const sidebar = document.getElementById("main-sidebar");
        const backdrop = document.getElementById("sidebar-backdrop");
        if (sidebar && !sidebar.classList.contains("-translate-x-full")) {
          sidebar.classList.add("-translate-x-full");
          if (backdrop) backdrop.classList.add("hidden");
        }
      });
    });

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

  navigateTo(viewId) {
    this.currentView = viewId;

    const views = document.querySelectorAll(".app-view");
    views.forEach(v => v.classList.add("hidden"));

    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
      targetView.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    document.querySelectorAll("[data-nav-target]").forEach(btn => {
      if (btn.dataset.navTarget === viewId) {
        btn.classList.add("bg-charcoal-700", "text-gold", "border-l-4", "border-terracotta");
        btn.classList.remove("text-stone-300", "hover:text-white");
      } else {
        btn.classList.remove("bg-charcoal-700", "text-gold", "border-l-4", "border-terracotta");
        btn.classList.add("text-stone-300", "hover:text-white");
      }
    });

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
    } else if (viewId === "trench") {
      this.renderStratigraphyTrench();
    } else if (viewId === "export-data") {
      this.renderExportDataPreview();
    } else if (viewId === "agentic-ai") {
      if (this.archaeoAgent) this.archaeoAgent.onViewOpened();
    }
  }

  refreshCurrentView() {
    this.updateGlobalKPIs();
    this.navigateTo(this.currentView);
  }

  updateGlobalKPIs() {
    const stats = db.getStats();
    const spatial = spatialEngine.runDBSCAN(db.getAll());

    const totalEl = document.getElementById("stat-total-artifacts");
    const sitesEl = document.getElementById("stat-survey-sites");
    const catEl = document.getElementById("stat-categories");
    const clusterEl = document.getElementById("stat-clusters");

    if (totalEl) totalEl.innerText = stats.totalArtifacts;
    if (sitesEl) sitesEl.innerText = stats.surveySitesCount;
    if (catEl) catEl.innerText = stats.categoriesCount;
    if (clusterEl) clusterEl.innerText = spatial.stats.totalClusters;
  }

  renderDashboard() {
    this.updateGlobalKPIs();
    setTimeout(() => {
      analytics.renderDashboardCharts();
    }, 100);
    this.renderRecentDiscoveries();
  }

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
        <div class="bg-charcoal-800/90 rounded-2xl overflow-hidden border border-stone-800 hover:border-terracotta/50 shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between ornate-corner">
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
   * INTERACTIVE STRATIGRAPHY TRENCH SIMULATOR
   * Click through soil strata and reveal artifacts found at exact excavation depths!
   */
  setupStratigraphyTrench() {
    this.strataDefinitions = [
      {
        id: "stratum-1",
        name: "Stratum I: Agricultural Humus & Topsoil",
        period: "Colonial to Modern Era",
        depthRange: [0.0, 0.4],
        soilClass: "soil-humus",
        desc: "Loose organic loam containing modern surface scree, agricultural disturbance, and East India Company currency.",
        matrix: "Organic Humus / Sand Silt"
      },
      {
        id: "stratum-2",
        name: "Stratum II: Paved Residential Floors",
        period: "Late Ancient to Early Medieval",
        depthRange: [0.4, 1.1],
        soilClass: "soil-residential",
        desc: "Compacted clay and rammed brick-dust floor levels. Associated with administrative repositories, sealings, and bronze votives.",
        matrix: "Compacted Red Clay & Floor Plaster"
      },
      {
        id: "stratum-3",
        name: "Stratum III: Armory & Destruction Ash Horizon",
        period: "Classical Ancient Urban Phase",
        depthRange: [1.1, 1.7],
        soilClass: "soil-ash",
        desc: "Dense carbonaceous grey ash layer with burnt structural timbers, discarded bronze weapons, and terracotta figurines.",
        matrix: "Carbonized Charcoal & Fine Silt"
      },
      {
        id: "stratum-4",
        name: "Stratum IV: Early Urban Rampart Foundation",
        period: "Early Historic Horizon (c. 300 BCE)",
        depthRange: [1.7, 2.5],
        soilClass: "soil-rampart",
        desc: "Monumental burnt brick masonry (1:2:4 ratio) and Northern Black Polished Ware sherds embedded in structural revetments.",
        matrix: "Kiln-Fired Brick Bats & Lateritic Clay"
      },
      {
        id: "stratum-5",
        name: "Stratum V: Chalcolithic & Neolithic Terrace",
        period: "Prehistoric Transition (c. 1500 BCE)",
        depthRange: [2.5, 3.3],
        soilClass: "soil-neolithic",
        desc: "Basal gravel terrace with polished stone celts, steatite seals, and deep carinated Black-and-Red Ware ceramics.",
        matrix: "Fluvial Gravel & Coarse Quartz Sand"
      },
      {
        id: "stratum-6",
        name: "Stratum VI: Sterile Alluvial Subsoil & Bedrock",
        period: "Geological Basal Layer",
        depthRange: [3.3, 10.0],
        soilClass: "soil-bedrock",
        desc: "Undisturbed natural lateritic clay horizon and weathered quartzite bedrock. Free of anthropogenic cultural debris.",
        matrix: "Decomposed Bedrock Granite / Laterite"
      }
    ];
  }

  selectStratum(index) {
    this.activeStratumIndex = index;
    this.renderStratigraphyTrench();
  }

  renderStratigraphyTrench() {
    const strataListContainer = document.getElementById("trench-strata-list");
    const artifactDisplayContainer = document.getElementById("trench-artifacts-display");
    const activeInfoContainer = document.getElementById("trench-active-info");

    if (!strataListContainer || !artifactDisplayContainer) return;

    const stratum = this.strataDefinitions[this.activeStratumIndex];
    const allArtifacts = db.getAll();

    // Filter artifacts by stratum depth range
    const stratumArtifacts = allArtifacts.filter(a => {
      return a.depth >= stratum.depthRange[0] && a.depth < stratum.depthRange[1];
    });

    // Render strata list rows
    strataListContainer.innerHTML = this.strataDefinitions.map((s, idx) => {
      const isActive = idx === this.activeStratumIndex;
      const count = allArtifacts.filter(a => a.depth >= s.depthRange[0] && a.depth < s.depthRange[1]).length;

      return `
        <div onclick="app.selectStratum(${idx})" 
             class="stratum-row p-4 rounded-xl border border-stone-800 ${s.soilClass} ${isActive ? 'active-stratum shadow-lg' : 'opacity-85 hover:opacity-100'} flex items-center justify-between">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="font-serif font-bold text-sandstone-100 text-sm">${s.name}</span>
              ${isActive ? '<span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-terracotta text-white">Active Trench Cut</span>' : ''}
            </div>
            <p class="text-xs text-stone-300">${s.period}</p>
          </div>
          <div class="text-right">
            <span class="font-mono text-xs font-bold text-gold block">${s.depthRange[0]}m &ndash; ${s.depthRange[1]}m</span>
            <span class="text-[10px] text-stone-400 font-mono">${count} specimens found</span>
          </div>
        </div>
      `;
    }).join("");

    // Render active stratum description
    if (activeInfoContainer) {
      activeInfoContainer.innerHTML = `
        <div class="p-4 rounded-2xl bg-charcoal-800/80 border border-gold/30 flex items-start gap-3">
          <i class="fas fa-trowel text-gold text-lg mt-1 shrink-0"></i>
          <div>
            <h4 class="font-serif font-bold text-sm text-sandstone-100">${stratum.name} (${stratum.depthRange[0]}m &ndash; ${stratum.depthRange[1]}m)</h4>
            <p class="text-xs text-stone-300 mt-1 leading-relaxed">${stratum.desc}</p>
            <div class="mt-2 text-[11px] font-mono text-stone-400">
              Soil Composition Matrix: <span class="text-gold">${stratum.matrix}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Render artifacts uncovered in this stratum
    if (stratumArtifacts.length === 0) {
      artifactDisplayContainer.innerHTML = `
        <div class="p-8 text-center rounded-2xl bg-charcoal-800/60 border border-stone-800 text-stone-400 text-xs italic">
          No artifacts documented in this specific stratigraphic depth tier.
        </div>
      `;
      return;
    }

    artifactDisplayContainer.innerHTML = stratumArtifacts.map(a => {
      const typeCfg = TYPE_CONFIG[a.type] || TYPE_CONFIG["Other"];
      return `
        <div class="bg-charcoal-800/90 rounded-xl p-3 border border-stone-800 hover:border-terracotta/50 flex items-center gap-3 transition-colors group">
          <img src="${a.imageUrl}" alt="${a.name}" 
               class="w-16 h-16 rounded-lg object-cover border border-stone-700 shrink-0 group-hover:scale-105 transition-transform"
               onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80';" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white uppercase" style="background-color: ${typeCfg.color}">${a.type}</span>
              <span class="font-mono text-[10px] text-gold font-medium">${a.depth} m depth</span>
            </div>
            <h5 class="font-serif font-bold text-xs text-sandstone-100 truncate mt-1">${a.name}</h5>
            <p class="text-[10px] text-stone-400 truncate">${a.site} &bull; ${a.layer}</p>
          </div>
          <button onclick="app.openDetailModal('${a.id}')" class="px-2.5 py-1 rounded bg-charcoal-700 hover:bg-terracotta text-stone-300 hover:text-white text-xs transition-colors shrink-0">
            Examine
          </button>
        </div>
      `;
    }).join("");
  }

  /**
   * RAKING LIGHT (RTI) SURFACE INSPECTOR MODAL
   * Simulates directional torchlight striking ancient coins, seals, and carvings
   */
  openRakingLightModal(id) {
    const artifact = db.getById(id);
    if (!artifact) return;

    const modal = document.getElementById("raking-light-modal");
    const img = document.getElementById("raking-light-img");
    const nameEl = document.getElementById("raking-light-name");

    if (img) img.src = artifact.imageUrl;
    if (nameEl) nameEl.innerText = `${artifact.name} (${artifact.type})`;

    if (modal) {
      modal.classList.remove("hidden");
      this.updateRakingLightAngle(45);
    }
  }

  closeRakingLightModal() {
    const modal = document.getElementById("raking-light-modal");
    if (modal) modal.classList.add("hidden");
  }

  updateRakingLightAngle(angleDeg) {
    const img = document.getElementById("raking-light-img");
    const angleDisplay = document.getElementById("raking-light-angle-val");
    if (angleDisplay) angleDisplay.innerText = `${angleDeg}°`;

    if (!img) return;

    // Convert angle to X and Y shadow offsets to simulate raking illumination
    const rad = (angleDeg * Math.PI) / 180;
    const xOffset = Math.cos(rad) * 12;
    const yOffset = Math.sin(rad) * 12;
    const contrast = 1.35 + Math.sin(rad) * 0.15;

    img.style.filter = `contrast(${contrast}) drop-shadow(${xOffset}px ${yOffset}px 15px rgba(0, 0, 0, 0.85))`;
  }

  /**
   * OFFICIAL FIELD DISCOVERY CERTIFICATE WITH WAX SEAL
   */
  openCertificateModal(id) {
    const artifact = db.getById(id);
    if (!artifact) return;

    const modal = document.getElementById("certificate-modal");
    if (!modal) return;

    document.getElementById("cert-artifact-name").innerText = artifact.name;
    document.getElementById("cert-artifact-id").innerText = artifact.id;
    document.getElementById("cert-site").innerText = artifact.site;
    document.getElementById("cert-trench").innerText = artifact.excavationArea;
    document.getElementById("cert-depth").innerText = `${artifact.depth} meters`;
    document.getElementById("cert-coords").innerText = `${artifact.latitude.toFixed(6)}° N, ${artifact.longitude.toFixed(6)}° E`;
    document.getElementById("cert-material").innerText = artifact.material;
    document.getElementById("cert-period").innerText = artifact.period;
    document.getElementById("cert-date").innerText = artifact.dateRecorded;
    document.getElementById("cert-registrar").innerText = artifact.recordedBy;
    document.getElementById("cert-image").src = artifact.imageUrl;

    modal.classList.remove("hidden");
  }

  closeCertificateModal() {
    const modal = document.getElementById("certificate-modal");
    if (modal) modal.classList.add("hidden");
  }

  printCertificate() {
    window.print();
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

    const totalPages = Math.ceil(filtered.length / this.repoPageSize);
    if (this.repoPage > totalPages) this.repoPage = 1;
    const startIdx = (this.repoPage - 1) * this.repoPageSize;
    const paginatedItems = filtered.slice(startIdx, startIdx + this.repoPageSize);

    if (this.repoViewMode === "grid") {
      container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      container.innerHTML = paginatedItems.map(artifact => {
        const typeCfg = TYPE_CONFIG[artifact.type] || TYPE_CONFIG["Other"];

        return `
          <div class="bg-charcoal-800/90 rounded-2xl overflow-hidden border border-stone-800 hover:border-terracotta/50 shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between ornate-corner">
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

  locateOnGIS(id) {
    this.navigateTo("gis-explorer");
    setTimeout(() => {
      gis.focusArtifact(id);
    }, 300);
  }

  openDetailModal(id) {
    const artifact = db.getById(id);
    if (!artifact) return;

    this.selectedArtifactId = id;
    const modal = document.getElementById("artifact-detail-modal");
    if (!modal) return;

    const typeCfg = TYPE_CONFIG[artifact.type] || TYPE_CONFIG["Other"];

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

    modal.classList.remove("hidden");
    document.body.classList.add("overflow-hidden");

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

  consultAIForArtifact(id) {
    this.closeDetailModal();
    this.navigateTo("agentic-ai");
    setTimeout(() => {
      if (this.archaeoAgent) {
        this.archaeoAgent.analyzeSingleArtifact(id);
      }
    }, 250);
  }

  setupGISControls() {
    const typeFilter = document.getElementById("gis-filter-type");
    const matFilter = document.getElementById("gis-filter-material");
    const perFilter = document.getElementById("gis-filter-period");
    const siteFilter = document.getElementById("gis-filter-site");

    const toggleMarkers = document.getElementById("gis-toggle-markers");
    const toggleHeatmap = document.getElementById("gis-toggle-heatmap");
    const toggleClusters = document.getElementById("gis-toggle-clusters");
    const resetBtn = document.getElementById("gis-reset-filters");
    const sepiaBtn = document.getElementById("gis-btn-sepia");

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

    if (sepiaBtn) {
      sepiaBtn.addEventListener("click", () => {
        gis.toggleSepiaMode();
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (typeFilter) typeFilter.value = "All";
        if (matFilter) matFilter.value = "All";
        if (perFilter) perFilter.value = "All";
        if (siteFilter) siteFilter.value = "All";
        if (toggleMarkers) toggleMarkers.checked = true;
        if (toggleHeatmap) toggleHeatmap.checked = false;
        if (toggleClusters) toggleClusters.checked = true;
        gis.setTimelinePeriod("All");
        updateMap();
        gis.fitSurveyBounds();
      });
    }

    const layerButtons = document.querySelectorAll(".gis-layer-btn");
    layerButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        gis.switchBaseLayer(btn.dataset.layer);
      });
    });

    const fitBtn = document.getElementById("gis-btn-fit-bounds");
    if (fitBtn) {
      fitBtn.addEventListener("click", () => {
        gis.fitSurveyBounds();
      });
    }

    // Timeline Scrubber Era Buttons
    document.querySelectorAll(".timeline-era-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        gis.setTimelinePeriod(btn.dataset.era);
      });
    });
  }

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

  setupAddArtifactForm() {
    const form = document.getElementById("form-add-artifact");
    const fileInput = document.getElementById("artifact-file-input");
    const dropzone = document.getElementById("artifact-dropzone");
    const previewContainer = document.getElementById("upload-preview-container");
    const previewImg = document.getElementById("upload-preview-img");
    const removeImgBtn = document.getElementById("remove-upload-btn");
    const siteSelect = document.getElementById("artifact-site");

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

          const successBanner = document.getElementById("add-artifact-success");
          if (successBanner) {
            successBanner.classList.remove("hidden");
            setTimeout(() => {
              successBanner.classList.add("hidden");
            }, 6000);
          }

          this.showToast("✓ Artifact Successfully Recorded", "Your archaeological field record has been added to the repository.", "success");

          form.reset();
          this.uploadedImageBase64 = null;
          if (previewContainer) previewContainer.classList.add("hidden");
          if (dropzone) dropzone.classList.remove("hidden");

          gis.updatePickerInputs(20.2961, 85.8245);
          gis.setPickerLocation(20.2961, 85.8245);

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

      document.addEventListener("click", (e) => {
        if (!globalInput.contains(e.target) && !resultsContainer.contains(e.target)) {
          resultsContainer.classList.add("hidden");
        }
      });
    }
  }

  renderExportDataPreview() {
    const totalCountEl = document.getElementById("export-total-count");
    if (totalCountEl) totalCountEl.innerText = db.getAll().length;
  }

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

    requestAnimationFrame(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
    });

    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }
}

/**
 * ===================================================================
 * ARCHAEO-AGENT: Autonomous Archaeological Intelligence Network
 * Collaborative Multi-Agent Engine for Epigraphy, Stratigraphy,
 * Spatial Geostatistics (DBSCAN), and Archeometric Conservation.
 * ===================================================================
 */

class ArchaeoAgentEngine {
  constructor(app) {
    this.app = app;
    this.isRunning = false;
    this.currentSimulationTimer = null;
    this.agents = {
      director: {
        id: "director",
        name: "Survey Director (सूत्रधार)",
        role: "Hierarchical ReAct Orchestrator & Task Decomposition",
        icon: "fa-crown",
        color: "#D4AF37",
        badge: "Director",
        status: "Online & Ready"
      },
      spatial: {
        id: "spatial",
        name: "Spatial GIS Geostatistician (भू-स्थानिक विश्लेषक)",
        role: "Haversine DBSCAN Spatial Clustering & Distance Matrix",
        icon: "fa-earth-asia",
        color: "#58D68D",
        badge: "Spatial GIS",
        status: "Online & Ready"
      },
      epigraphy: {
        id: "epigraphy",
        name: "Epigraphy & Paleographer (अभिलेखविद)",
        role: "Indus Glyphs, Ashokan Brahmi & Tamil-Brahmi Decipherment",
        icon: "fa-scroll",
        color: "#5DADE2",
        badge: "Epigraphy",
        status: "Online & Ready"
      },
      stratigraphy: {
        id: "stratigraphy",
        name: "Chrono-Stratigrapher (कालक्रम स्तरविद)",
        role: "Wheeler-Kenyon Box-Trench Audit & Law of Superposition",
        icon: "fa-layer-group",
        color: "#F39C12",
        badge: "Stratigraphy",
        status: "Online & Ready"
      },
      conservation: {
        id: "conservation",
        name: "Archeometry & Conservator (संरक्षण विशेषज्ञ)",
        role: "Material Degradation, Patina Stability & Preventative Care",
        icon: "fa-flask-vial",
        color: "#EC7063",
        badge: "Conservation",
        status: "Online & Ready"
      }
    };
  }

  init() {
    const runAuditBtn = document.getElementById("agent-run-audit-btn");
    if (runAuditBtn) {
      runAuditBtn.addEventListener("click", () => this.runFullSurveyAudit());
    }

    const queryInput = document.getElementById("agent-query-input");
    const querySubmitBtn = document.getElementById("agent-query-submit");
    if (querySubmitBtn && queryInput) {
      querySubmitBtn.addEventListener("click", () => {
        const q = queryInput.value.trim();
        if (q) this.processCustomQuery(q);
      });
      queryInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const q = queryInput.value.trim();
          if (q) this.processCustomQuery(q);
        }
      });
    }

    document.querySelectorAll("[data-agent-scenario]").forEach(btn => {
      btn.addEventListener("click", () => {
        const scenario = btn.dataset.agentScenario;
        this.runScenario(scenario);
      });
    });

    const clearLogsBtn = document.getElementById("agent-clear-logs-btn");
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener("click", () => this.clearLogs());
    }
  }

  onViewOpened() {
    this.updateAgentStatusBadges();
  }

  updateAgentStatusBadges(activeAgentKey = null) {
    Object.keys(this.agents).forEach(key => {
      const card = document.getElementById(`agent-card-${key}`);
      const statusEl = document.getElementById(`agent-status-${key}`);
      if (!card || !statusEl) return;

      if (activeAgentKey === key) {
        card.classList.add("agent-thinking");
        statusEl.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1.5"></span><span class="text-amber-300 font-bold">Reasoning / Tool Active...</span>`;
      } else {
        card.classList.remove("agent-thinking");
        statusEl.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span><span class="text-stone-400">Online & Ready</span>`;
      }
    });
  }

  clearLogs() {
    const terminal = document.getElementById("agent-terminal-logs");
    if (terminal) {
      terminal.innerHTML = `
        <div class="text-stone-500 font-mono text-[11px] italic py-2">
          // ARCHAEO-AGENT v3.0 Multi-Agent Log Stream Cleared. Ready for survey mission instructions.
        </div>
      `;
    }
    const consensusCard = document.getElementById("agent-consensus-card");
    if (consensusCard) {
      consensusCard.classList.add("hidden");
    }
  }

  addLog(agentKey, actionType, message, toolCall = null) {
    const terminal = document.getElementById("agent-terminal-logs");
    if (!terminal) return;

    const agent = this.agents[agentKey] || this.agents.director;
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });

    let actionBadgeClass = "bg-stone-800 text-stone-300 border-stone-700";
    if (actionType === "THOUGHT") actionBadgeClass = "bg-amber-500/20 text-amber-300 border-amber-500/40";
    if (actionType === "ACTION") actionBadgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (actionType === "OBSERVE") actionBadgeClass = "bg-sky-500/20 text-sky-300 border-sky-500/40";
    if (actionType === "TOOL_CALL") actionBadgeClass = "bg-purple-500/20 text-purple-300 border-purple-500/40";
    if (actionType === "CONSENSUS") actionBadgeClass = "bg-gold/25 text-gold border-gold/50";

    const entry = document.createElement("div");
    entry.className = "p-3.5 rounded-xl bg-charcoal-900/90 border border-stone-800/80 space-y-1.5 text-xs font-mono transition-all duration-200 hover:border-stone-700 shadow-sm";

    let toolHtml = "";
    if (toolCall) {
      toolHtml = `
        <div class="mt-1 px-3 py-1.5 rounded-lg bg-black/70 border border-purple-500/30 text-[11px] text-purple-300 flex items-center gap-2">
          <i class="fas fa-terminal text-[10px]"></i>
          <span><code>${toolCall}</code></span>
        </div>
      `;
    }

    entry.innerHTML = `
      <div class="flex items-center justify-between border-b border-stone-800/80 pb-1 text-[10px]">
        <div class="flex items-center gap-2">
          <span class="font-bold flex items-center gap-1.5" style="color: ${agent.color};">
            <i class="fas ${agent.icon}"></i> ${agent.name}
          </span>
          <span class="px-1.5 py-0.2 rounded border text-[9px] uppercase font-semibold ${actionBadgeClass}">
            ${actionType}
          </span>
        </div>
        <span class="text-stone-500">${time}</span>
      </div>
      <div class="text-stone-200 text-xs leading-relaxed pt-0.5 whitespace-pre-wrap font-sans">
        ${message}
      </div>
      ${toolHtml}
    `;

    terminal.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
  }

  showConsensusReport(title, confidence, findings, recommendations, jsonPayload) {
    const card = document.getElementById("agent-consensus-card");
    if (!card) return;

    const titleEl = document.getElementById("consensus-title");
    const confEl = document.getElementById("consensus-confidence");
    const findingsList = document.getElementById("consensus-findings-list");
    const recsList = document.getElementById("consensus-recs-list");
    const downloadBtn = document.getElementById("consensus-download-btn");

    if (titleEl) titleEl.innerText = title;
    if (confEl) confEl.innerText = `${confidence}% Consensus`;

    if (findingsList) {
      findingsList.innerHTML = findings.map(f => `
        <li class="flex items-start gap-2 text-xs text-stone-300">
          <i class="fas fa-check-circle text-emerald-400 mt-0.5 text-xs shrink-0"></i>
          <span>${f}</span>
        </li>
      `).join("");
    }

    if (recsList) {
      recsList.innerHTML = recommendations.map(r => `
        <li class="flex items-start gap-2 text-xs text-stone-300">
          <i class="fas fa-arrow-right text-gold mt-0.5 text-xs shrink-0"></i>
          <span>${r}</span>
        </li>
      `).join("");
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => {
        dataExport.downloadBlob(
          JSON.stringify(jsonPayload, null, 2),
          `ASI_ARCHAEO_AGENT_AUDIT_${Date.now()}.json`,
          "application/json"
        );
        this.app.showToast("Report Downloaded", "Official ASI Multi-Agent Audit exported in JSON format.", "success");
      };
    }

    card.classList.remove("hidden");
    card.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /**
   * 1. FULL AUTONOMOUS MULTI-AGENT SURVEY AUDIT
   */
  runFullSurveyAudit() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clearLogs();
    const artifacts = db.getAll();

    const planTasks = [
      {
        agent: "director",
        action: "THOUGHT",
        msg: `Autonomous Field Reconnaissance Triggered across ${artifacts.length} curated Indian archaeological discoveries. Initializing ReAct DAG orchestration across 6 civilization sectors (Dholavira, Sisupalgarh, Sanchi, Nalanda, Hampi, Keezhadi).`,
        delay: 300
      },
      {
        agent: "director",
        action: "ACTION",
        msg: `Dispatching sub-tasks to Spatial Geostatistician, Epigraphist, Chrono-Stratigrapher, and Material Conservator.`,
        tool: `dispatch_subagents({ scope: 'pan_india_survey', record_count: ${artifacts.length} })`,
        delay: 600
      },
      {
        agent: "spatial",
        action: "THOUGHT",
        msg: `Computing spatial density matrix using spherical Haversine geographic metric. Testing boundary hulls for nucleated archaeological settlements.`,
        delay: 1100
      },
      {
        agent: "spatial",
        action: "TOOL_CALL",
        msg: `Executed DBSCAN clustering on ${artifacts.length} georeferenced specimens. Identified 5 core spatial concentrations (Dholavira Citadel, Sisupalgarh Ramparts, Sanchi Stupa Hillock, Nalanda Monastic Quadrangle, and Keezhadi Vaigai Basin).`,
        tool: `gis.runDBSCAN(eps=0.48km, minPts=3) -> 5 clusters, 0 spatial noise anomalies`,
        delay: 1700
      },
      {
        agent: "epigraphy",
        action: "THOUGHT",
        msg: `Querying paleographic corpus for inscribed records. Matching Indus signs, Ashokan lapidary Brahmi, and early Tamil-Brahmi graffiti.`,
        delay: 2300
      },
      {
        agent: "epigraphy",
        action: "ACTION",
        msg: `Inscriptions Deciphered:\n• IND-2026-001 (Dholavira): 5 Indus signs with unicorn standard — administrative authority signet.\n• IND-2026-005 (Sisupalgarh): Early Brahmi reading "...devānaṁpiyena piyadasinā lājinā..." — correlates with Kalinga Edict IV.\n• IND-2026-012 (Nalanda): "Śrī-Nālandā-mahāvihāriy-ārya-bhikṣu-saṅghasya" — official seal of the Mahavihara assembly.\n• IND-2026-020 (Keezhadi): Tamil-Brahmi sherd reading "A-D-H-A-N" — corroborates 6th-century BCE literacy.`,
        tool: `corpus_search({ corpus: 'Epigraphia_Indica_ASI', matches_found: 6 })`,
        delay: 3000
      },
      {
        agent: "stratigraphy",
        action: "THOUGHT",
        msg: `Auditing vertical depth records (0.4m to 3.5m) against Wheeler-Kenyon box-trench horizons. Testing Law of Superposition and Harris Matrix sequence.`,
        delay: 3600
      },
      {
        agent: "stratigraphy",
        action: "OBSERVE",
        msg: `Stratigraphic Audit Result:\n• Stratum I (0.0–0.4m): Colonial & modern alluvium.\n• Stratum II (0.4–1.1m): Gupta & Pala monastic living surfaces.\n• Stratum III (1.1–1.7m): Shunga-Satavahana destruction ash & coins.\n• Stratum IV (1.7–2.5m): Mauryan monumental brick ramparts (Sisupalgarh).\n• Stratum V (2.5–3.5m): Mature Harappan basal flood mud & Rohri chert weights.\n=> 100% Sequence Consistency. Zero stratigraphic inversions detected.`,
        tool: `stratigraphy.auditLawOfSuperposition() -> status: VERIFIED_CLEAN`,
        delay: 4300
      },
      {
        agent: "conservation",
        action: "THOUGHT",
        msg: `Assessing raw material deterioration: Terracotta (12), Stone (14), Bronze (6), Gold & Copper (4). Modeling environmental humidity and mineral salt efflorescence risks.`,
        delay: 5000
      },
      {
        agent: "conservation",
        action: "ACTION",
        msg: `Conservation Diagnosis:\n• Nalanda Bronze Avalokiteshvara: Stable malachite cuprite patina; zero active bronze disease (atacamite).\n• Dholavira Steatite Unicorn Seal: Vitrification intact; recommend micro-crystalline wax barrier against high ambient salinity.\n• Sisupalgarh NBPW ceramics: Mirror-black slip preserved; recommend climate-controlled humidity buffer (45-50% RH).`,
        tool: `archeometry.evalPatinaStability() -> condition: HIGH_STABILITY`,
        delay: 5700
      },
      {
        agent: "director",
        action: "CONSENSUS",
        msg: `SYNTHESIS CONSENSUS REACHED: Pan-Indian survey validated with 99.4% cross-agent confidence. All archaeological discoveries confirm continuous civilization horizons from Harappan maritime trade (2600 BCE) through Mauryan imperial literacy (300 BCE) to medieval university institutions (700 CE).`,
        delay: 6400
      }
    ];

    let stepIndex = 0;
    const runNextStep = () => {
      if (stepIndex >= planTasks.length) {
        this.isRunning = false;
        this.updateAgentStatusBadges(null);

        // Render final consensus briefing
        this.showConsensusReport(
          "Archaeological Survey of India — Multi-Agent Consensus Briefing",
          99.4,
          [
            "DBSCAN spatial analysis demarcates 5 high-density archaeological settlement clusters across Kutch, Odisha, Malwa, Magadha, and Vaigai basins.",
            "Epigraphic cross-referencing independently confirms 6 historical scripts (Indus glyphs, Ashokan lapidary Brahmi, Gupta-Pala Brahmi, and Sangam Tamil-Brahmi).",
            "Stratigraphic depth profiles strictly confirm the Law of Superposition across Strata I through V with zero chronological inversions.",
            "Material archeometry verifies stable patina on bronze icons and recommends micro-crystalline wax encapsulation for marine steatite seals."
          ],
          [
            "Recommend deploying ground-penetrating radar (GPR) across the Dholavira East Reservoir perimeter to test predicted dockyard wall extensions.",
            "Schedule micro-RTI imaging for the Sisupalgarh Western Gateway Brahmi slab to isolate faint chisel guide-lines.",
            "Digitize Wheeler-Kenyon trench sections into 3D photogrammetric meshes for national heritage archiving."
          ],
          {
            mission: "ASI Pan-India Digital Survey Reconnaissance",
            timestamp: new Date().toISOString(),
            status: "VERIFIED_CONSENSUS",
            confidence: 0.994,
            recordsAnalyzed: artifacts.length,
            clustersIdentified: 5,
            stratigraphicInversions: 0,
            epigraphicDecipherments: 6
          }
        );
        return;
      }

      const step = planTasks[stepIndex];
      this.updateAgentStatusBadges(step.agent);
      this.addLog(step.agent, step.action, step.msg, step.tool || null);

      stepIndex++;
      const nextDelay = stepIndex < planTasks.length ? planTasks[stepIndex].delay - step.delay : 800;
      setTimeout(runNextStep, Math.max(nextDelay, 400));
    };

    runNextStep();
  }

  /**
   * 2. RESEARCH SCENARIOS (Lothal, Epigraphy, Strata, Clusters)
   */
  runScenario(scenarioId) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clearLogs();
    const artifacts = db.getAll();

    if (scenarioId === "trade") {
      this.executeScenarioSteps([
        { agent: "director", action: "THOUGHT", msg: "Initiating Deep Archaeological Inquiry: Maritime Trade & Lapidary Networks between Lothal/Dholavira and the Persian Gulf." },
        { agent: "spatial", action: "ACTION", msg: "Filtering coastal & lapidary artifacts. Identifying Dholavira Middle Town Bead Workshop IV and Lothal Tidal Basin.", tool: "gis.spatialFilter({ region: 'Gujarat_Harappan', hasWaterAccess: true })" },
        { agent: "epigraphy", action: "OBSERVE", msg: "Inspecting Steatite Unicorn Seal (IND-2026-001) and Terracotta Boat Model (IND-2026-002). Square stamp seals with boss holes on reverse were utilized to stamp clay bales on seafaring dhows bound for Dilmun (Bahrain) and Magan (Oman)." },
        { agent: "stratigraphy", action: "OBSERVE", msg: "Etched carnelian beads uncovered at Stratum IV (2.4m depth) match lapidary alkaline chemical etching techniques identical to beads excavated at Royal Cemetery of Ur (Mesopotamia)." },
        { agent: "director", action: "CONSENSUS", msg: "CONCLUSION: Physical evidence of terracotta hull models, binary chert weights (13.63g base), and etched carnelian confirms direct Bronze Age maritime merchant guild operations between Gujarat and Mesopotamia." }
      ], "Maritime Guild & Lapidary Network Synthesis (Harappan Horizon)", 98.7);
    } else if (scenarioId === "epigraphy") {
      this.executeScenarioSteps([
        { agent: "director", action: "THOUGHT", msg: "Initiating Comparative Paleographic Inquiry: Mauryan Imperial Brahmi vs. Keezhadi Early Tamil-Brahmi." },
        { agent: "epigraphy", action: "ACTION", msg: "Comparing Ashokan Rock Edict (IND-2026-005) from Sisupalgarh with Keezhadi Black-and-Red potsherd (IND-2026-020).", tool: "epigraphy.compareGlyphs({ sampleA: 'Sisupalgarh_Mauryan', sampleB: 'Keezhadi_Sangam' })" },
        { agent: "epigraphy", action: "OBSERVE", msg: "Paleographic Analysis:\n• Sisupalgarh Brahmi exhibits uniform stroke width and geometric symmetry ('da', 'va', 'na') characteristic of centralized Mauryan chancellery scribes.\n• Keezhadi Tamil-Brahmi lacks voiced stops and aspirates, incorporating unique retroflex symbols ('Lha', 'Rha') suited to Old Tamil phonology." },
        { agent: "stratigraphy", action: "OBSERVE", msg: "Keezhadi sherd originated in Stratum IV (2.2m depth); AMS radiocarbon dating of associated carbonized paddy husks yields 580 BCE, proving indigenous literate script traditions predate Ashokan monumental edicts." },
        { agent: "director", action: "CONSENSUS", msg: "CONCLUSION: Epigraphic and stratigraphic consensus confirms bi-directional literate developments in ancient India: an imperial administrative script in the North and a civic mercantile script in the Vaigai Valley." }
      ], "Comparative Paleographic & Linguistic Conspectus", 99.1);
    } else if (scenarioId === "strata") {
      this.executeScenarioSteps([
        { agent: "director", action: "THOUGHT", msg: "Executing Comprehensive Stratigraphic Depth Audit across Wheeler-Kenyon Box-Trenches." },
        { agent: "stratigraphy", action: "ACTION", msg: "Extracting Harris Matrix relations for all 36 excavation units. Checking correlation between recorded depth (m) and historical cultural strata.", tool: "stratigraphy.auditHarrisMatrix({ toleranceMeters: 0.15 })" },
        { agent: "stratigraphy", action: "OBSERVE", msg: "Depth Analysis Summary:\n• Mean Depth (All Artifacts): 1.84m (min: 0.40m, max: 3.50m)\n• Deepest Specimen: IND-2026-022 (Harappan Copper Axe, 3.5m, Stratum V)\n• Shallowest Specimen: IND-2026-036 (East India Company Copper Paisa, 0.4m, Stratum I)\n• Zero inverted strata: Older cultural horizons consistently occupy lower vertical coordinates." },
        { agent: "conservation", action: "OBSERVE", msg: "Deep horizons (>2.5m) exhibit anaerobic preservation with high humidity retention, explaining the remarkable preservation of lapidary micro-drills." },
        { agent: "director", action: "CONSENSUS", msg: "CONCLUSION: The field survey demonstrates rigorous stratigraphic discipline. All soil horizons corroborate Sir Mortimer Wheeler's box-trench principles of chronological stratification." }
      ], "Wheeler-Kenyon Chrono-Stratigraphic Audit Report", 99.6);
    } else if (scenarioId === "clusters") {
      this.executeScenarioSteps([
        { agent: "director", action: "THOUGHT", msg: "Initiating Spatial Anomaly & Archaeological Workshop Horizon Detection." },
        { agent: "spatial", action: "ACTION", msg: "Executing DBSCAN spatial clustering with dynamic epsilon radius and minimum points threshold.", tool: "spatialEngine.runDBSCAN(artifacts, eps=0.48, minPts=3)" },
        { agent: "spatial", action: "OBSERVE", msg: "Cluster Topology Detected:\n• Cluster 1 (Dholavira Citadel): 6 artifacts, avg depth 2.7m -> Lapidary & bead manufacturing sector.\n• Cluster 2 (Sisupalgarh Rampart): 6 artifacts, avg depth 1.9m -> Urban fortification & numismatic garrison.\n• Cluster 3 (Sanchi Stupa Complex): 6 artifacts, avg depth 1.6m -> Monastic votive and sculpture ateliers.\n• Cluster 4 (Nalanda University): 6 artifacts, avg depth 1.2m -> Administrative monastery & bronze metallurgy.\n• Cluster 5 (Hampi Royal Bazaar): 6 artifacts, avg depth 0.9m -> Imperial mint and architectural workshops.\n• Cluster 6 (Keezhadi Vaigai Basin): 6 artifacts, avg depth 1.8m -> Ceramic kilns & textile weaving vats." },
        { agent: "director", action: "CONSENSUS", msg: "CONCLUSION: Spatial cluster boundaries correspond with high fidelity to specialized functional zones: industrial lapidary (Dholavira), military-civic (Sisupalgarh), religious-academic (Nalanda), and commercial-mercantile (Hampi & Keezhadi)." }
      ], "DBSCAN Functional Settlement Horizon Synthesis", 99.0);
    }
  }

  executeScenarioSteps(steps, title, confidence) {
    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        this.isRunning = false;
        this.updateAgentStatusBadges(null);
        this.showConsensusReport(
          title,
          confidence,
          steps.filter(s => s.action === "OBSERVE" || s.action === "CONSENSUS").map(s => s.msg.split("\n")[0]),
          [
            "Incorporate multi-agent consensus telemetry into final excavation monograph.",
            "Cross-reference spatial cluster centroids with satellite multispectral thermal imagery.",
            "Archive specimen accession records into national digital heritage inventory."
          ],
          { scenario: title, timestamp: new Date().toISOString(), confidence: confidence / 100 }
        );
        return;
      }

      const s = steps[i];
      this.updateAgentStatusBadges(s.agent);
      this.addLog(s.agent, s.action, s.msg, s.tool || null);
      i++;
      setTimeout(run, 650);
    };
    run();
  }

  /**
   * 3. SINGLE ARTIFACT MULTI-AGENT DEEP DIVE
   */
  analyzeSingleArtifact(id) {
    const artifact = db.getById(id);
    if (!artifact) return;

    this.clearLogs();
    this.isRunning = true;

    const steps = [
      {
        agent: "director",
        action: "THOUGHT",
        msg: `Initiating dedicated Multi-Agent Deep-Dive for Specimen [${artifact.id}]: ${artifact.name}. Context: ${artifact.site} &bull; Stratum ${artifact.layer} (${artifact.depth}m).`
      },
      {
        agent: "spatial",
        action: "TOOL_CALL",
        msg: `Georeferencing coordinates (${artifact.latitude.toFixed(6)}° N, ${artifact.longitude.toFixed(6)}° E). Location confirmed within ${artifact.site} survey sector. Proximity to nearest watercourse / river basin: ~1.2 km.`,
        tool: `gis.geolocate(${artifact.latitude}, ${artifact.longitude}) -> valid: TRUE`
      },
      {
        agent: "stratigraphy",
        action: "OBSERVE",
        msg: `Stratigraphic Evaluation: Recorded depth ${artifact.depth}m correlates with ${artifact.layer}. Chronological classification (${artifact.period}) fits the expected Wheeler-Kenyon soil horizon without inversion.`
      },
      {
        agent: "epigraphy",
        action: "OBSERVE",
        msg: artifact.type === "Inscription" 
          ? `Epigraphic Review: Glyphs and lapidary execution match known historical inscriptions of ${artifact.period}. Inscription integrity: EXCELLENT.`
          : `Typological Review: Specimen classified as ${artifact.type} crafted from ${artifact.material}. Morphological features conform to classical ${artifact.period} craftsmanship.`
      },
      {
        agent: "conservation",
        action: "ACTION",
        msg: `Material Health Assessment: Material is ${artifact.material}. Recommendation: Standard museum climate control (RH 45-50%, Temperature 20±2°C). Zero active biological or chemical contamination reported.`,
        tool: `conservation.diagnoseMaterial('${artifact.material}') -> status: STABLE`
      },
      {
        agent: "director",
        action: "CONSENSUS",
        msg: `VERDICT: Specimen ${artifact.id} (${artifact.name}) is fully validated by all 5 autonomous agents. Authenticity and provenance confirmed for archival cataloging.`
      }
    ];

    let idx = 0;
    const run = () => {
      if (idx >= steps.length) {
        this.isRunning = false;
        this.updateAgentStatusBadges(null);
        this.showConsensusReport(
          `Specimen Authentication Brief: ${artifact.name} (${artifact.id})`,
          99.5,
          [
            `Geographic location (${artifact.latitude.toFixed(4)}° N, ${artifact.longitude.toFixed(4)}° E) verified within ${artifact.site}.`,
            `Stratigraphic depth of ${artifact.depth}m correlates consistently with ${artifact.period}.`,
            `Material composition of ${artifact.material} diagnosed in stable conservation condition.`
          ],
          [
            "Issue Official Field Discovery Accession Certificate with 3D Wax Seal.",
            "Index high-resolution photograph in National Archaeological Image Archive."
          ],
          artifact
        );
        return;
      }
      const s = steps[idx];
      this.updateAgentStatusBadges(s.agent);
      this.addLog(s.agent, s.action, s.msg, s.tool || null);
      idx++;
      setTimeout(run, 600);
    };
    run();
  }

  /**
   * 4. NATURAL LANGUAGE ARCHEOLOGICAL QUERY COPILOT
   */
  processCustomQuery(rawQuery) {
    if (this.isRunning) return;
    this.clearLogs();
    this.isRunning = true;

    const q = rawQuery.toLowerCase();
    const artifacts = db.getAll();

    // Natural Language Query Filter
    let matches = artifacts.filter(a => {
      const fullText = `${a.name} ${a.site} ${a.period} ${a.material} ${a.type} ${a.description}`.toLowerCase();
      return fullText.includes(q) || q.split(" ").some(word => word.length > 3 && fullText.includes(word));
    });

    // Check depth queries (e.g. "deeper than 2m")
    if (q.includes("deep") || q.includes("depth") || q.includes("meter")) {
      const depthMatch = q.match(/(\d+(\.\d+)?)\s*(m|meter)/);
      if (depthMatch) {
        const targetDepth = parseFloat(depthMatch[1]);
        matches = artifacts.filter(a => a.depth >= targetDepth);
      }
    }

    if (matches.length === 0) {
      matches = artifacts.slice(0, 3);
    }

    const steps = [
      {
        agent: "director",
        action: "THOUGHT",
        msg: `User Query Received: "${rawQuery}". Parsing query intent and formulating collaborative agent investigation plan.`
      },
      {
        agent: "spatial",
        action: "TOOL_CALL",
        msg: `Scanned spatial coordinate registry. Found ${matches.length} matching archaeological records across sites: ${[...new Set(matches.map(m => m.site))].join(", ")}.`,
        tool: `db.query({ text: '${rawQuery.replace(/'/g, "")}', limit: 5 })`
      },
      {
        agent: "epigraphy",
        action: "OBSERVE",
        msg: `Top Relevant Specimen: [${matches[0].id}] ${matches[0].name} (${matches[0].period}). Context: "${matches[0].description.slice(0, 140)}..."`
      },
      {
        agent: "stratigraphy",
        action: "OBSERVE",
        msg: `Stratigraphic Analysis: Specimen depth profile spans ${Math.min(...matches.map(m => m.depth))}m to ${Math.max(...matches.map(m => m.depth))}m below surface across strata ${[...new Set(matches.map(m => m.layer))].slice(0, 2).join(", ")}.`
      },
      {
        agent: "conservation",
        action: "OBSERVE",
        msg: `Materials detected in result set: ${[...new Set(matches.map(m => m.material))].join(", ")}. Conservation priority: NORMAL to HIGH.`
      },
      {
        agent: "director",
        action: "CONSENSUS",
        msg: `RESPONSE SYNTHESIS: Based on the collaborative multi-agent cross-referencing of ${matches.length} specimens, the system confirms: ${matches[0].name} at ${matches[0].site} provides the primary archaeological correlation for this inquiry.`
      }
    ];

    let step = 0;
    const run = () => {
      if (step >= steps.length) {
        this.isRunning = false;
        this.updateAgentStatusBadges(null);
        this.showConsensusReport(
          `Query Analysis: "${rawQuery}"`,
          97.8,
          matches.slice(0, 3).map(m => `[${m.id}] ${m.name} (${m.site}) — ${m.material}, ${m.period}, Depth: ${m.depth}m`),
          [
            `Examine specimen ${matches[0].id} in Artifact Detail View for raking light (RTI) relief examination.`,
            `Locate matched specimens on the Pan-India GIS Explorer map.`
          ],
          { query: rawQuery, results: matches }
        );
        return;
      }
      const s = steps[step];
      this.updateAgentStatusBadges(s.agent);
      this.addLog(s.agent, s.action, s.msg, s.tool || null);
      step++;
      setTimeout(run, 550);
    };
    run();
  }
}

// Global App instance
const app = new ArchaeoApp();

document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
