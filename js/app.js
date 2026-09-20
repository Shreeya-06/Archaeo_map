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

/**
 * ===================================================================
 * ARCHAEO-AGENT: Autonomous Archaeological Intelligence Network
 * Collaborative Multi-Agent Engine for Interactive Copilot Chat,
 * Epigraphy, Wheeler-Kenyon Stratigraphy, Spatial GIS (DBSCAN),
 * and Archeometric Conservation.
 * ===================================================================
 */

class ArchaeoAgentEngine {
  constructor(app) {
    this.app = app;
    this.isRunning = false;
    this.voiceEnabled = false;
    this.currentMode = "chat";
    this.conversationHistory = [];

    this.agents = {
      director: {
        id: "director",
        name: "Dr. Alok Verma (Survey Director)",
        role: "Lead Orchestrator & Task Decomposition",
        icon: "fa-crown",
        color: "#D4AF37",
        badge: "Lead",
        status: "Online & Ready"
      },
      spatial: {
        id: "spatial",
        name: "Dr. Rajeshwari Nair (Spatial GIS)",
        role: "Haversine DBSCAN Spatial Clustering & Map Geonavigation",
        icon: "fa-earth-asia",
        color: "#58D68D",
        badge: "Spatial GIS",
        status: "Online & Ready"
      },
      epigraphy: {
        id: "epigraphy",
        name: "Prof. S. Mukherjee (Epigraphist)",
        role: "Indus Glyphs, Ashokan Brahmi & Sangam Tamil-Brahmi Decipherment",
        icon: "fa-scroll",
        color: "#5DADE2",
        badge: "Epigraphy",
        status: "Online & Ready"
      },
      stratigraphy: {
        id: "stratigraphy",
        name: "Dr. Vikram Kulkarni (Stratigrapher)",
        role: "Wheeler-Kenyon Box-Trench Audit & Law of Superposition",
        icon: "fa-layer-group",
        color: "#F39C12",
        badge: "Strata",
        status: "Online & Ready"
      },
      conservation: {
        id: "conservation",
        name: "Ms. Ananya Roy (Conservator)",
        role: "Material Degradation, Patina Stability & Preventative Care",
        icon: "fa-flask-vial",
        color: "#EC7063",
        badge: "Conservation",
        status: "Online & Ready"
      }
    };
  }

  init() {
    // Mode Switchers (Chat vs ReAct Telemetry)
    const tabChatBtn = document.getElementById("agent-tab-chat-btn");
    const tabTelemetryBtn = document.getElementById("agent-tab-telemetry-btn");
    if (tabChatBtn && tabTelemetryBtn) {
      tabChatBtn.addEventListener("click", () => this.switchMode("chat"));
      tabTelemetryBtn.addEventListener("click", () => this.switchMode("telemetry"));
    }

    // Interactive Chat Input
    const chatInput = document.getElementById("agent-chat-input");
    const chatSendBtn = document.getElementById("agent-chat-send-btn");
    if (chatSendBtn && chatInput) {
      chatSendBtn.addEventListener("click", () => {
        const q = chatInput.value.trim();
        if (q) {
          this.sendUserMessage(q);
          chatInput.value = "";
        }
      });
      chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const q = chatInput.value.trim();
          if (q) {
            this.sendUserMessage(q);
            chatInput.value = "";
          }
        }
      });
    }

    // Drawer Input
    const drawerInput = document.getElementById("drawer-chat-input");
    const drawerSendBtn = document.getElementById("drawer-chat-send-btn");
    if (drawerSendBtn && drawerInput) {
      drawerSendBtn.addEventListener("click", () => {
        const q = drawerInput.value.trim();
        if (q) {
          this.sendUserMessage(q);
          drawerInput.value = "";
        }
      });
      drawerInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const q = drawerInput.value.trim();
          if (q) {
            this.sendUserMessage(q);
            drawerInput.value = "";
          }
        }
      });
    }

    // Prompt Pills
    document.querySelectorAll(".prompt-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        const prompt = btn.dataset.prompt || btn.innerText.trim();
        this.sendQuickPrompt(prompt);
      });
    });

    // Voice / Speech Synthesis Toggle
    const speechToggleBtn = document.getElementById("agent-speech-toggle-btn");
    if (speechToggleBtn) {
      speechToggleBtn.addEventListener("click", () => {
        this.voiceEnabled = !this.voiceEnabled;
        speechToggleBtn.classList.toggle("text-gold", this.voiceEnabled);
        speechToggleBtn.classList.toggle("text-stone-400", !this.voiceEnabled);
        this.app.showToast(
          this.voiceEnabled ? "Voice Output Enabled" : "Voice Output Muted",
          this.voiceEnabled ? "Archaeo-Agent will read responses aloud." : "Text-to-speech audio muted.",
          "info"
        );
      });
    }

    // Clear Chat
    const clearChatBtn = document.getElementById("agent-clear-chat-btn");
    if (clearChatBtn) {
      clearChatBtn.addEventListener("click", () => this.clearChat());
    }

    // Microphone Voice Input
    const micBtn = document.getElementById("agent-chat-mic-btn");
    if (micBtn) {
      micBtn.addEventListener("click", () => this.startSpeechRecognition());
    }

    // Telemetry Run Audit Button
    const runAuditBtn = document.getElementById("agent-run-audit-btn");
    if (runAuditBtn) {
      runAuditBtn.addEventListener("click", () => this.runFullSurveyAudit());
    }

    // Scenario Buttons
    document.querySelectorAll("[data-agent-scenario]").forEach(btn => {
      btn.addEventListener("click", () => {
        const scenario = btn.dataset.agentScenario;
        this.runScenario(scenario);
      });
    });

    // Clear Logs Button
    const clearLogsBtn = document.getElementById("agent-clear-logs-btn");
    if (clearLogsBtn) {
      clearLogsBtn.addEventListener("click", () => this.clearLogs());
    }
  }

  onViewOpened() {
    this.updateAgentStatusBadges();
  }

  switchMode(mode) {
    this.currentMode = mode;
    const subviewChat = document.getElementById("agent-subview-chat");
    const subviewTelemetry = document.getElementById("agent-subview-telemetry");
    const tabChatBtn = document.getElementById("agent-tab-chat-btn");
    const tabTelemetryBtn = document.getElementById("agent-tab-telemetry-btn");

    if (mode === "chat") {
      if (subviewChat) subviewChat.classList.remove("hidden");
      if (subviewTelemetry) subviewTelemetry.classList.add("hidden");
      if (tabChatBtn) {
        tabChatBtn.className = "px-5 py-2.5 rounded-xl bg-gold text-charcoal-900 font-serif font-bold text-xs shadow-md transition-all flex items-center gap-2";
      }
      if (tabTelemetryBtn) {
        tabTelemetryBtn.className = "px-5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-stone-300 hover:text-white font-serif font-bold text-xs border border-stone-700 transition-all flex items-center gap-2";
      }
    } else {
      if (subviewChat) subviewChat.classList.add("hidden");
      if (subviewTelemetry) subviewTelemetry.classList.remove("hidden");
      if (tabChatBtn) {
        tabChatBtn.className = "px-5 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-stone-300 hover:text-white font-serif font-bold text-xs border border-stone-700 transition-all flex items-center gap-2";
      }
      if (tabTelemetryBtn) {
        tabTelemetryBtn.className = "px-5 py-2.5 rounded-xl bg-gold text-charcoal-900 font-serif font-bold text-xs shadow-md transition-all flex items-center gap-2";
      }
    }
  }

  toggleDrawer() {
    const drawer = document.getElementById("global-ai-copilot-drawer");
    if (!drawer) return;
    drawer.classList.toggle("translate-x-full");
    if (!drawer.classList.contains("translate-x-full")) {
      const input = document.getElementById("drawer-chat-input");
      if (input) setTimeout(() => input.focus(), 250);
    }
  }

  closeDrawer() {
    const drawer = document.getElementById("global-ai-copilot-drawer");
    if (drawer) drawer.classList.add("translate-x-full");
  }

  updateAgentStatusBadges(activeAgentKey = null) {
    Object.keys(this.agents).forEach(key => {
      const card = document.getElementById(`agent-card-${key}`);
      const statusEl = document.getElementById(`agent-status-${key}`);
      if (!card || !statusEl) return;

      if (activeAgentKey === key) {
        card.classList.add("agent-thinking");
        statusEl.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping mr-1.5"></span><span class="text-amber-300 font-bold">Collaborating...</span>`;
      } else {
        card.classList.remove("agent-thinking");
        statusEl.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span><span class="text-stone-400">Online & Ready</span>`;
      }
    });
  }

  startSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.app.showToast("Voice Input", "Speech recognition is not supported in this browser. Please type your query.", "warning");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      this.app.showToast("Listening...", "Speak your archaeological question clearly.", "info");

      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        const chatInput = document.getElementById("agent-chat-input");
        if (chatInput) {
          chatInput.value = spokenText;
          this.sendUserMessage(spokenText);
        }
      };

      recognition.onerror = () => {
        this.app.showToast("Voice Error", "Could not capture audio. Please try typing instead.", "warning");
      };

      recognition.start();
    } catch (e) {
      console.warn("Speech recognition error:", e);
    }
  }

  speakText(text) {
    if (!this.voiceEnabled || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Strip HTML tags
      const clean = text.replace(/<[^>]*>?/gm, "").replace(/&bull;/g, "•").replace(/&nbsp;/g, " ");
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  clearChat() {
    const stream = document.getElementById("agent-chat-stream");
    if (stream) {
      stream.innerHTML = `
        <div class="flex items-start gap-3.5 max-w-3xl">
          <div class="w-9 h-9 rounded-xl bg-gold/20 border border-gold/40 text-gold flex items-center justify-center text-sm shrink-0 shadow-lg mt-1">
            <i class="fas fa-crown"></i>
          </div>
          <div class="chat-bubble-agent p-4 space-y-2.5 flex-1">
            <div class="flex items-center justify-between border-b border-stone-800/80 pb-1.5 text-[11px]">
              <span class="font-bold text-gold flex items-center gap-1.5 font-serif">
                Dr. Alok Verma &bull; Survey Director
              </span>
              <span class="text-stone-500 font-mono text-[10px]">Active</span>
            </div>
            <p class="text-xs text-stone-200 leading-relaxed font-sans">
              Conversation stream refreshed. What archaeological subject, excavation sector, or artifact would you like to investigate?
            </p>
          </div>
        </div>
      `;
    }
    const drawerStream = document.getElementById("drawer-chat-stream");
    if (drawerStream) {
      drawerStream.innerHTML = `
        <div class="p-3.5 rounded-2xl bg-charcoal-800/90 border border-stone-800 text-stone-300 space-y-2">
          <p class="font-serif font-bold text-gold text-xs">Dr. Alok Verma &bull; Survey Director</p>
          <p class="text-xs leading-relaxed">
            I am active alongside your current view. Ask me questions about artifacts, tell me to zoom to a sector on the map, or audit archaeological stratigraphy.
          </p>
        </div>
      `;
    }
  }

  sendQuickPrompt(text) {
    if (this.currentMode !== "chat") {
      this.switchMode("chat");
    }
    this.sendUserMessage(text);
  }

  /**
   * Primary User Message Dispatcher
   */
  sendUserMessage(userText) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Render User Message to main chat & drawer
    this.appendMessage("user", userText, time);

    // 2. Show Typing Indicator
    this.showTypingIndicator(true);

    // 3. Generate Intelligent Multi-Agent Response
    setTimeout(() => {
      this.showTypingIndicator(false);
      const response = this.generateArchaeologicalResponse(userText);
      this.appendMessage("agent", response.html, time, response.rawText);

      // Speak if enabled
      if (this.voiceEnabled) {
        this.speakText(response.rawText);
      }
    }, 600);
  }

  showTypingIndicator(show) {
    const indicator = document.getElementById("agent-typing-indicator");
    if (indicator) {
      indicator.classList.toggle("hidden", !show);
      if (show) {
        const stream = document.getElementById("agent-chat-stream");
        if (stream) stream.scrollTop = stream.scrollHeight;
      }
    }
  }

  appendMessage(sender, contentHtml, time, speechText = "") {
    const mainStream = document.getElementById("agent-chat-stream");
    const drawerStream = document.getElementById("drawer-chat-stream");

    // Main Stream Message Node
    if (mainStream) {
      const node = document.createElement("div");
      if (sender === "user") {
        node.className = "flex items-start justify-end gap-3 max-w-2xl ml-auto animate-fadeIn";
        node.innerHTML = `
          <div class="chat-bubble-user p-3.5 space-y-1 text-xs">
            <div class="flex items-center justify-end gap-2 text-[10px] text-amber-200/70 border-b border-stone-700/50 pb-1">
              <span class="font-bold">You (Field Researcher)</span>
              <span>${time}</span>
            </div>
            <p class="text-stone-100 font-sans leading-relaxed pt-0.5">${contentHtml}</p>
          </div>
          <div class="w-8 h-8 rounded-xl bg-terracotta text-white flex items-center justify-center text-xs shrink-0 mt-1 shadow-md">
            <i class="fas fa-user-astronaut"></i>
          </div>
        `;
      } else {
        node.className = "flex items-start gap-3.5 max-w-3xl animate-fadeIn";
        node.innerHTML = `
          <div class="w-9 h-9 rounded-xl bg-gold/20 border border-gold/40 text-gold flex items-center justify-center text-sm shrink-0 shadow-lg mt-1">
            <i class="fas fa-brain-circuit"></i>
          </div>
          <div class="chat-bubble-agent p-4 space-y-2.5 flex-1 text-xs">
            <div class="flex items-center justify-between border-b border-stone-800/80 pb-1 text-[11px]">
              <span class="font-bold text-gold flex items-center gap-1.5 font-serif">
                Dr. Alok Verma & Collaborative Agents
              </span>
              <div class="flex items-center gap-2">
                <span class="text-stone-500 font-mono text-[10px]">${time}</span>
                <button class="text-stone-400 hover:text-gold text-xs transition-colors" onclick="app.archaeoAgent.speakText('${(speechText || "").replace(/'/g, "\\'")}')" title="Listen">
                  <i class="fas fa-volume-high text-[11px]"></i>
                </button>
              </div>
            </div>
            <div class="text-stone-200 font-sans leading-relaxed space-y-2">
              ${contentHtml}
            </div>
          </div>
        `;
      }
      mainStream.appendChild(node);
      mainStream.scrollTop = mainStream.scrollHeight;
    }

    // Drawer Stream Message Node
    if (drawerStream) {
      const drawerNode = document.createElement("div");
      if (sender === "user") {
        drawerNode.className = "p-3 rounded-xl bg-charcoal-700/80 border border-stone-700 text-stone-100 text-xs ml-4";
        drawerNode.innerHTML = `<span class="text-[10px] text-gold font-bold block mb-1">You:</span>${contentHtml}`;
      } else {
        drawerNode.className = "p-3.5 rounded-xl bg-charcoal-800/90 border border-gold/30 text-stone-200 text-xs mr-4 space-y-1.5";
        drawerNode.innerHTML = `
          <span class="text-[10px] text-gold font-bold font-serif block">Archaeo-Agent:</span>
          <div class="leading-relaxed font-sans">${contentHtml}</div>
        `;
      }
      drawerStream.appendChild(drawerNode);
      drawerStream.scrollTop = drawerStream.scrollHeight;
    }
  }

  /**
   * Action Dispatcher for Chat Buttons
   */
  executeAction(actionType, param) {
    if (actionType === "flyToSite") {
      this.app.navigateTo("gis-explorer");
      this.closeDrawer();
      const artifacts = db.filter({ site: param });
      if (artifacts.length > 0) {
        setTimeout(() => {
          gis.focusArtifact(artifacts[0].id);
          this.app.showToast("GIS Geolocation", `Camera panned to ${param} archaeological sector.`, "info");
        }, 350);
      }
    } else if (actionType === "locateArtifact") {
      this.app.navigateTo("gis-explorer");
      this.closeDrawer();
      setTimeout(() => {
        gis.focusArtifact(param);
        this.app.showToast("Artifact Located", `Centered on specimen [${param}] at 17x zoom.`, "info");
      }, 350);
    } else if (actionType === "inspectArtifact") {
      this.app.openDetailModal(param);
    } else if (actionType === "filterRepo") {
      this.app.navigateTo("repository");
      this.closeDrawer();
      const siteSelect = document.getElementById("repo-filter-site");
      const matSelect = document.getElementById("repo-filter-material");
      const typeSelect = document.getElementById("repo-filter-type");

      if (param.site && siteSelect) siteSelect.value = param.site;
      if (param.material && matSelect) matSelect.value = param.material;
      if (param.type && typeSelect) typeSelect.value = param.type;

      this.app.renderRepository();
      this.app.showToast("Repository Filtered", `Displaying matching archaeological discoveries.`, "info");
    } else if (actionType === "runCluster") {
      this.app.navigateTo("spatial-analysis");
      this.closeDrawer();
      this.app.showToast("Spatial Geostatistics", "Loaded DBSCAN workshop density clustering.", "info");
    } else if (actionType === "runAudit") {
      this.app.navigateTo("agentic-ai");
      this.switchMode("telemetry");
      this.runFullSurveyAudit();
    } else if (actionType === "runScenario") {
      this.app.navigateTo("agentic-ai");
      this.switchMode("telemetry");
      this.runScenario(param);
    }
  }

  /**
   * Intelligent Archaeological NLU Response Generator
   */
  generateArchaeologicalResponse(rawQuery) {
    const q = rawQuery.toLowerCase().trim();
    const artifacts = db.getAll();

    // 1. Greetings & Orientation
    if (/^(hi|hello|hey|namaste|greetings|who are you|help|what can you do)/.test(q)) {
      return {
        rawText: "Greetings! I am Dr. Alok Verma, Lead Survey Director of ARCHAEO-AGENT. My team of 5 specialized agents covers GIS geostatistics, epigraphy, soil stratigraphy, and conservation. We monitor 36 curated discoveries across India.",
        html: `
          <p>Greetings! I am <strong>Dr. Alok Verma</strong>, Survey Director for the <strong>ARCHAEO-AGENT</strong> collaborative intelligence system.</p>
          <p>Our autonomous team consists of:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Dr. Rajeshwari Nair (Spatial GIS)</strong>: Haversine distance, boundary hulls & DBSCAN clustering.</li>
            <li><strong>Prof. S. Mukherjee (Epigraphy)</strong>: Ashokan Brahmi, Keezhadi Tamil-Brahmi & Indus seal glyphs.</li>
            <li><strong>Dr. Vikram Kulkarni (Stratigrapher)</strong>: Wheeler-Kenyon box-trenches & Law of Superposition.</li>
            <li><strong>Ms. Ananya Roy (Conservator)</strong>: Material degradation, patina stability & relative humidity.</li>
          </ul>
          <p class="pt-1 text-stone-300">Here are quick actions you can try right now:</p>
          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('flyToSite', 'Lothal')">
              <i class="fas fa-ship"></i> Fly to Lothal
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('flyToSite', 'Dholavira')">
              <i class="fas fa-water"></i> Fly to Dholavira
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('runAudit')">
              <i class="fas fa-play"></i> Run 36-Site Audit
            </button>
          </div>
        `
      };
    }

    // 2. Lothal & Maritime Trade
    if (q.includes("lothal") || q.includes("dockyard") || (q.includes("maritime") && q.includes("trade"))) {
      return {
        rawText: "Lothal is the world's earliest known tidal dockyard, established around 2400 BCE in Gujarat. It featured a massive fired-brick basin connected to the Sabarmati river channel and Persian Gulf trade routes.",
        html: `
          <p><strong>Lothal</strong> is one of the most celebrated Bronze Age maritime ports of the Harappan civilization, excavated by S.R. Rao in Gujarat.</p>
          <p>Key Archaeological Highlights:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Tidal Dockyard Basin:</strong> A 214m &times; 36m fired-brick tidal basin that could dock seafaring dhows during high tide.</li>
            <li><strong>Bead-Making Kiln:</strong> A circular craft kiln producing etched carnelian beads exported to the Royal Cemetery of Ur in Mesopotamia.</li>
            <li><strong>Steatite Stamp Seals:</strong> Square seals with boss handles on reverse, used to stamp clay sealings on trade bales.</li>
          </ul>
          
          <div class="agent-sub-card" style="--agent-accent: #58D68D;">
            <strong class="text-emerald-400 font-mono text-[11px] block mb-0.5">Dr. Rajeshwari Nair &bull; Spatial GIS Note:</strong>
            Lothal coordinates: 22.5218° N, 72.2492° E. Ancient Gulf of Khambhat shoreline proximity: 18.5 km.
          </div>

          <div class="agent-sub-card" style="--agent-accent: #5DADE2;">
            <strong class="text-sky-400 font-mono text-[11px] block mb-0.5">Prof. S. Mukherjee &bull; Epigraphy Note:</strong>
            Terracotta sealings from Lothal bear Indus signs alongside impressions of packing reeds and woven ropes, confirming commercial customs clearance.
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('flyToSite', 'Lothal')">
              <i class="fas fa-map-location-dot"></i> Show Lothal on Map
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('filterRepo', { site: 'Lothal' })">
              <i class="fas fa-box-archive"></i> View Lothal Relics
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('runScenario', 'trade')">
              <i class="fas fa-route"></i> Trade Network Analysis
            </button>
          </div>
        `
      };
    }

    // 3. Dholavira & Water Engineering
    if (q.includes("dholavira") || q.includes("reservoir") || q.includes("signboard")) {
      return {
        rawText: "Dholavira, located on Khadir Bet in the Rann of Kutch, is a UNESCO World Heritage site known for its 16 rock-cut monumental reservoirs and a 10-glyph giant Indus signboard.",
        html: `
          <p><strong>Dholavira</strong> is an extraordinary Harappan metropolis situated on Khadir Bet island in Kutch, Gujarat, excavated by R.S. Bisht.</p>
          <p>Key Archaeological Discoveries:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Hydraulic Engineering:</strong> 16 monumental rock-cut water reservoirs with cascading stone dams to trap rainwater from monsoon streams.</li>
            <li><strong>The 10-Glyph Signboard:</strong> White crystalline gypsum letters mounted over the Northern Gateway of the Citadel.</li>
            <li><strong>Tripartite Town Planning:</strong> Unique Citadel, Middle Town, and Lower Town divisions fortified by dressed limestone ramparts.</li>
          </ul>

          <div class="agent-sub-card" style="--agent-accent: #F39C12;">
            <strong class="text-amber-400 font-mono text-[11px] block mb-0.5">Dr. Vikram Kulkarni &bull; Stratigraphy Note:</strong>
            Deep trench soundings in the East Reservoir reach Stratum V (3.2m depth), showing continuous habitation across seven distinct cultural stages from 2600 to 1500 BCE.
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('flyToSite', 'Dholavira')">
              <i class="fas fa-map-location-dot"></i> Fly to Dholavira on Map
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('filterRepo', { site: 'Dholavira' })">
              <i class="fas fa-box-archive"></i> View Dholavira Artifacts
            </button>
          </div>
        `
      };
    }

    // 4. Keezhadi & Tamil-Brahmi Discovery
    if (q.includes("keezhadi") || q.includes("vaigai") || q.includes("tamil-brahmi") || q.includes("sangam")) {
      return {
        rawText: "Keezhadi, excavated along the Vaigai river in Tamil Nadu, provides evidence of an urban Sangam civilization dated to 580 BCE, demonstrating that literacy in South India predated Ashokan monumental edicts.",
        html: `
          <p><strong>Keezhadi</strong> is a landmark excavation on the Vaigai river basin in Sivagangai district, Tamil Nadu, conducted by the Tamil Nadu State Department of Archaeology and ASI.</p>
          <p>Why Keezhadi Revolutionized Indian Archaeology:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Pre-Ashokan Literacy:</strong> AMS radiocarbon dating of carbonized paddy husks in Stratum IV yielded a calibrated date of <strong>580 BCE</strong>, showing early Tamil-Brahmi script flourished 300 years before Ashoka's rock edicts.</li>
            <li><strong>Civic Urban Settlement:</strong> Uncovered covered brick drain lines, textile dyeing vats, carnelian beads, and Roman rouletted ware.</li>
            <li><strong>Names of Citizens:</strong> Potsherds inscribed with personal names such as <em>A-D-H-A-N</em>, <em>K-U-V-I-R-A-N</em>, and <em>C-E-N-T-A-N</em>.</li>
          </ul>

          <div class="agent-sub-card" style="--agent-accent: #5DADE2;">
            <strong class="text-sky-400 font-mono text-[11px] block mb-0.5">Prof. S. Mukherjee &bull; Epigraphist Note:</strong>
            Keezhadi Tamil-Brahmi incorporates distinct retroflex consonantal markers (Lha, Rha) and the pulli diacritic, adapted to early Dravidian phonology.
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('flyToSite', 'Keezhadi')">
              <i class="fas fa-map-location-dot"></i> Fly to Keezhadi on Map
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('filterRepo', { site: 'Keezhadi' })">
              <i class="fas fa-box-archive"></i> View Keezhadi Discoveries
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('runScenario', 'epigraphy')">
              <i class="fas fa-scroll"></i> Compare Brahmi Scripts
            </button>
          </div>
        `
      };
    }

    // 5. Nalanda Mahavihara & Buddhist Monasticism
    if (q.includes("nalanda") || q.includes("university") || q.includes("monastery") || q.includes("buddhist")) {
      return {
        rawText: "Nalanda Mahavihara in Bihar was the ancient world's premier residential monastic university, renowned for its Dharmaganja libraries and bronze sculpture atelier.",
        html: `
          <p><strong>Nalanda Mahavihara</strong> in Bihar was founded under the Gupta Empire (5th century CE) and flourished through the Pala period as the world's foremost international seat of Buddhist higher learning.</p>
          <p>Key Survey Records:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Monastic Assembly Seals:</strong> Terracotta sealings bearing the Dharma-wheel flanked by two gazelles with the official Sanskrit inscription.</li>
            <li><strong>Pala Lost-Wax Bronzes:</strong> Superb cast-bronze images of Avalokiteshvara, Tara, and Buddha with intact malachite patina.</li>
            <li><strong>Multi-Storey Viharas:</strong> Monastic cells arranged around open courtyards with meditation niches and granary wells.</li>
          </ul>

          <div class="agent-sub-card" style="--agent-accent: #EC7063;">
            <strong class="text-red-400 font-mono text-[11px] block mb-0.5">Ms. Ananya Roy &bull; Conservation Diagnostic:</strong>
            Nalanda bronze icons show stable cuprite-malachite mineral passivization. Maintain museum relative humidity below 45% to prevent cuprous chloride bronze disease.
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('flyToSite', 'Nalanda')">
              <i class="fas fa-map-location-dot"></i> Fly to Nalanda on Map
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('filterRepo', { site: 'Nalanda' })">
              <i class="fas fa-box-archive"></i> View Nalanda Artifacts
            </button>
          </div>
        `
      };
    }

    // 6. Sisupalgarh & Sanchi
    if (q.includes("sisupalgarh") || q.includes("dhauli") || q.includes("sanchi") || q.includes("ashoka") || q.includes("kalinga")) {
      return {
        rawText: "Sisupalgarh near Bhubaneswar was a fortified Kalinga citadel, while nearby Dhauli and Sanchi preserve Emperor Ashoka's monumental rock and pillar edicts from the 3rd century BCE.",
        html: `
          <p><strong>Sisupalgarh & Sanchi</strong> represent the monumental apex of early historic Mauryan urbanism and sacred architecture.</p>
          <p>Survey Findings:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Sisupalgarh Fortification:</strong> A perfect square rampart with 8 grand monolithic gateways constructed from laterite and khandolite stone blocks.</li>
            <li><strong>Dhauli Rock Edict:</strong> Carved on an elephant outcrop overlooking the Daya river, recording Ashoka's remorse after the Kalinga War.</li>
            <li><strong>Sanchi Stupa 1:</strong> The Great Stupa with carved sandstone toranas depicting Jataka tales and the Ashokan Lion Capital pillar.</li>
          </ul>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('flyToSite', 'Sisupalgarh')">
              <i class="fas fa-map-location-dot"></i> View Sisupalgarh
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('flyToSite', 'Sanchi')">
              <i class="fas fa-map-location-dot"></i> View Sanchi Stupa
            </button>
          </div>
        `
      };
    }

    // 7. Stratigraphy & Wheeler-Kenyon Box-Trench Method
    if (q.includes("stratigraph") || q.includes("wheeler") || q.includes("superposition") || q.includes("layer") || q.includes("strata") || q.includes("depth")) {
      return {
        rawText: "Stratigraphy in our system follows Sir Mortimer Wheeler's box-trench excavation method and the Law of Superposition: deeper strata are chronologically older. Our survey spans depths from 0.4m down to 3.5m across Strata I through V with zero inversions.",
        html: `
          <p><strong>Wheeler-Kenyon Chrono-Stratigraphy</strong> forms the chronological foundation of ARCHAEO-BHARAT.</p>
          <p>How our Stratigraphy Agent audits the site:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Law of Superposition:</strong> In undisturbed horizontal soil horizons, lower strata were deposited earlier. Recorded depths in our survey range from 0.40m down to 3.50m.</li>
            <li><strong>Harris Matrix Validation:</strong> Checks that mature Harappan relics (2.5m–3.5m) correctly underlie Mauryan levels (1.7m–2.5m) and Gupta-Pala deposits (0.4m–1.1m).</li>
            <li><strong>Baulk Preservation:</strong> Earth baulks left between trenches preserve vertical stratigraphic profiles for continuous cross-correlation.</li>
          </ul>

          <div class="agent-sub-card" style="--agent-accent: #F39C12;">
            <strong class="text-amber-400 font-mono text-[11px] block mb-0.5">Dr. Vikram Kulkarni &bull; Live Stratigraphy Audit:</strong>
            36 excavation units audited. Zero stratigraphic inversions detected. Chronological correlation coefficient: <strong>0.996</strong>.
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('runScenario', 'strata')">
              <i class="fas fa-layer-group"></i> Run Wheeler Stratigraphy Audit
            </button>
            <button class="chat-action-btn" onclick="app.navigateTo('trench'); app.archaeoAgent.closeDrawer();">
              <i class="fas fa-trowel"></i> Open Excavation Trench View
            </button>
          </div>
        `
      };
    }

    // 8. Epigraphy & Inscriptions
    if (q.includes("epigraph") || q.includes("script") || q.includes("inscription") || q.includes("brahmi") || q.includes("glyph")) {
      const inscriptions = artifacts.filter(a => a.type === "Inscription");
      return {
        rawText: `We have ${inscriptions.length} verified epigraphic inscriptions recorded across Harappan, Mauryan, and Sangam sectors, including Indus stamp glyphs, Ashokan lapidary Brahmi, and Keezhadi Tamil-Brahmi.`,
        html: `
          <p><strong>Epigraphy & Paleography</strong> within our system correlates three pivotal historical script horizons:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Indus Script (c. 2600–1900 BCE):</strong> Undeciphered logo-syllabic signs on steatite unicorn seals from Dholavira and Lothal.</li>
            <li><strong>Ashokan Lapidary Brahmi (c. 250 BCE):</strong> The monumental chancellery script used in Ashoka's Edicts at Sisupalgarh and Sanchi, deciphered by James Prinsep in 1837.</li>
            <li><strong>Sangam Tamil-Brahmi (c. 580 BCE):</strong> Script incised on pottery at Keezhadi, documenting early South Indian civic literacy.</li>
          </ul>

          <p class="pt-1 text-stone-300">Found <strong>${inscriptions.length} epigraphic specimens</strong> in the registry:</p>
          <div class="space-y-1 text-[11px]">
            ${inscriptions.slice(0, 3).map(ins => `
              <div class="flex items-center justify-between p-2 rounded bg-charcoal-900 border border-stone-800">
                <span class="font-bold text-sandstone-100">[${ins.id}] ${ins.name}</span>
                <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('inspectArtifact', '${ins.id}')">Inspect</button>
              </div>
            `).join("")}
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('filterRepo', { type: 'Inscription' })">
              <i class="fas fa-scroll"></i> Filter Inscriptions
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('runScenario', 'epigraphy')">
              <i class="fas fa-book-atlas"></i> Compare Scripts
            </button>
          </div>
        `
      };
    }

    // 9. Conservation & Material Risk
    if (q.includes("conservation") || q.includes("risk") || q.includes("deteriorat") || q.includes("preserv") || q.includes("patina")) {
      const highRisk = artifacts.filter(a => a.conservationStatus === "High" || a.conservationStatus === "Critical");
      return {
        rawText: `Conservation analysis flagged ${highRisk.length} specimens requiring urgent stabilization, predominantly bronze artifacts prone to bronze disease and marine terracottas affected by salt efflorescence.`,
        html: `
          <p><strong>Archeometry & Material Conservation Report</strong> by Ms. Ananya Roy:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Bronze Disease Alert:</strong> Cuprous chloride in metal alloys reacts with ambient humidity forming powdery green atacamite. Votive bronzes from Nalanda are being monitored.</li>
            <li><strong>Soluble Salt Flaking:</strong> Unbaked terracotta figurines from Lothal's marine environment require desalination washes before storage.</li>
            <li><strong>Steatite Vitrification:</strong> Harappan seals must be sealed with micro-crystalline Renaissance wax to prevent cleavage along soapstone bedding planes.</li>
          </ul>

          <p class="pt-1 text-stone-300">Monitored Specimens:</p>
          <div class="space-y-1 text-[11px]">
            ${highRisk.slice(0, 3).map(hr => `
              <div class="flex items-center justify-between p-2 rounded bg-charcoal-900 border border-stone-800">
                <span>[${hr.id}] <strong>${hr.name}</strong> (${hr.material})</span>
                <span class="text-red-400 font-mono font-bold">${hr.conservationStatus} Risk</span>
                <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('inspectArtifact', '${hr.id}')">Inspect</button>
              </div>
            `).join("")}
          </div>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('filterRepo', { material: 'Bronze' })">
              <i class="fas fa-flask"></i> Filter Bronze Relics
            </button>
          </div>
        `
      };
    }

    // 10. Material Specific Searches (Bronze, Gold, Terracotta, Sandstone, etc.)
    const materials = ["Bronze", "Gold", "Terracotta", "Sandstone", "Steatite", "Copper", "Iron", "Ceramic"];
    const matchedMat = materials.find(m => q.includes(m.toLowerCase()));
    if (matchedMat) {
      const matArtifacts = artifacts.filter(a => a.material.toLowerCase().includes(matchedMat.toLowerCase()));
      return {
        rawText: `Found ${matArtifacts.length} discoveries crafted from ${matchedMat} in our survey registry across multiple cultural horizons.`,
        html: `
          <p>Found <strong>${matArtifacts.length} archaeological specimens</strong> made of <strong>${matchedMat}</strong>:</p>
          <div class="space-y-1 text-[11px] pt-1">
            ${matArtifacts.slice(0, 4).map(ma => `
              <div class="flex items-center justify-between p-2 rounded bg-charcoal-900 border border-stone-800">
                <div>
                  <span class="font-bold text-sandstone-100">[${ma.id}] ${ma.name}</span>
                  <span class="text-stone-400 block text-[10px]">${ma.site} &bull; Stratum ${ma.layer} (${ma.depth}m)</span>
                </div>
                <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('inspectArtifact', '${ma.id}')">Inspect</button>
              </div>
            `).join("")}
          </div>
          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('filterRepo', { material: '${matchedMat}' })">
              <i class="fas fa-box-archive"></i> View All ${matchedMat} in Repository
            </button>
          </div>
        `
      };
    }

    // 11. Spatial GIS & DBSCAN Geostatistics
    if (q.includes("dbscan") || q.includes("cluster") || q.includes("spatial") || q.includes("distance") || q.includes("haversine")) {
      return {
        rawText: "DBSCAN spatial clustering in ARCHAEO-BHARAT groups discoveries into high-density activity zones using spherical Haversine distances with an epsilon of 480 meters and minimum points of 3.",
        html: `
          <p><strong>Spatial Geostatistics Engine & DBSCAN Clustering</strong>:</p>
          <p>Our Spatial GIS Agent applies density-based clustering to identify functional archaeological horizons:</p>
          <ul class="space-y-1 list-disc list-inside text-stone-300">
            <li><strong>Spherical Haversine Metric:</strong> Calculates accurate metric distances across the earth's ellipsoid between excavation coordinates.</li>
            <li><strong>DBSCAN Density Reachability:</strong> Uses &epsilon; = 480m and minPts = 3 to delineate workshop quarters (such as the bead factory in Lothal) from isolated surface finds.</li>
            <li><strong>Convex Hull Polygons:</strong> Computes the spatial bounding area in square meters for each civilization cluster.</li>
          </ul>

          <div class="pt-2 flex flex-wrap gap-2">
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('runCluster')">
              <i class="fas fa-cubes-stacked"></i> Open Spatial DBSCAN View
            </button>
            <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('runScenario', 'clusters')">
              <i class="fas fa-chart-pie"></i> Run Cluster Density Simulation
            </button>
          </div>
        `
      };
    }

    // 12. Direct Navigation Commands
    if (q.includes("take me to map") || q.includes("open map") || q.includes("show map") || q.includes("gis")) {
      setTimeout(() => {
        this.app.navigateTo("gis-explorer");
        this.closeDrawer();
      }, 400);
      return {
        rawText: "Navigating to GIS Explorer map view.",
        html: `<p>Opening the <strong>GIS Explorer</strong> interactive mapping platform now.</p>`
      };
    }
    if (q.includes("open repository") || q.includes("show repository") || q.includes("all artifacts")) {
      setTimeout(() => {
        this.app.navigateTo("repository");
        this.closeDrawer();
      }, 400);
      return {
        rawText: "Navigating to the Artifact Repository view.",
        html: `<p>Opening the <strong>Artifact Repository</strong> with all 36 curated discoveries.</p>`
      };
    }

    // 13. General Semantic Search Across Discoveries
    const searchTerms = q.split(" ").filter(t => t.length > 2);
    const matches = artifacts.filter(a => {
      const full = `${a.name} ${a.site} ${a.period} ${a.material} ${a.type} ${a.description}`.toLowerCase();
      return searchTerms.some(term => full.includes(term));
    });

    if (matches.length > 0) {
      const top = matches.slice(0, 3);
      return {
        rawText: `I identified ${matches.length} matching archaeological discoveries in our database relevant to "${rawQuery}". Top match is ${top[0].name} from ${top[0].site}.`,
        html: `
          <p>I cross-referenced our registry and identified <strong>${matches.length} relevant archaeological discoveries</strong>:</p>
          <div class="space-y-1.5 text-[11px] pt-1">
            ${top.map(m => `
              <div class="p-2.5 rounded-xl bg-charcoal-900 border border-stone-800 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-sandstone-100">[${m.id}] ${m.name}</span>
                  <span class="text-gold font-mono">${m.depth}m depth</span>
                </div>
                <p class="text-stone-400 text-[10px]">${m.site} &bull; ${m.period} &bull; ${m.material}</p>
                <div class="pt-1 flex items-center gap-2">
                  <button class="chat-action-btn text-[10px] py-1 px-2" onclick="app.archaeoAgent.executeAction('inspectArtifact', '${m.id}')">
                    <i class="fas fa-search"></i> Inspect Specimen
                  </button>
                  <button class="chat-action-btn text-[10px] py-1 px-2" onclick="app.archaeoAgent.executeAction('locateArtifact', '${m.id}')">
                    <i class="fas fa-location-crosshairs"></i> Locate on Map
                  </button>
                </div>
              </div>
            `).join("")}
          </div>
        `
      };
    }

    // 14. Fallback Comprehensive Answer
    return {
      rawText: `I have analyzed your query: "${rawQuery}". As an archaeological copilot, I can assist you with our 36 Indian heritage sites across Gujarat, Odisha, Madhya Pradesh, Bihar, Karnataka, and Tamil Nadu.`,
      html: `
        <p>I parsed your inquiry: <em>"${rawQuery}"</em>.</p>
        <p class="text-stone-300">
          As your field survey copilot, I can retrieve data on:
        </p>
        <ul class="space-y-1 list-disc list-inside text-stone-300">
          <li><strong>Excavation Sectors:</strong> Dholavira, Lothal, Sisupalgarh, Sanchi, Nalanda, Hampi, Keezhadi.</li>
          <li><strong>Ancient Scripts:</strong> Indus seal glyphs, Ashokan lapidary Brahmi, and Sangam Tamil-Brahmi.</li>
          <li><strong>Stratigraphy:</strong> Wheeler-Kenyon box-trenches, soil layers, and the Law of Superposition.</li>
          <li><strong>Material Health:</strong> Bronze disease, salt efflorescence, and climate conservation specs.</li>
        </ul>
        <div class="pt-2 flex flex-wrap gap-2">
          <button class="chat-action-btn" onclick="app.archaeoAgent.executeAction('runAudit')">
            <i class="fas fa-play"></i> Run Full Multi-Agent Audit
          </button>
          <button class="chat-action-btn" onclick="app.navigateTo('gis-explorer'); app.archaeoAgent.closeDrawer();">
            <i class="fas fa-map-location-dot"></i> View GIS Map
          </button>
        </div>
      `
    };
  }

  /**
   * =================================================================
   * TECHNICAL ReAct TELEMETRY STREAM & FIELD AUDITS
   * (Kept intact for academic course demonstration)
   * =================================================================
   */
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
    entry.className = "p-3.5 rounded-xl bg-charcoal-900/90 border border-stone-800/80 space-y-1.5 text-xs font-mono transition-all duration-200 hover:border-stone-700 shadow-sm animate-fadeIn";

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
   * 2. RESEARCH SCENARIOS
   */
  runScenario(scenarioId) {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clearLogs();

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
   * 3. SINGLE ARTIFACT MULTI-AGENT CONSULTATION
   */
  analyzeSingleArtifact(id) {
    const artifact = db.getById(id);
    if (!artifact) return;

    this.app.navigateTo("agentic-ai");
    this.switchMode("chat");

    const query = `Analyze specimen [${artifact.id}]: ${artifact.name} excavated at ${artifact.site} (Stratum ${artifact.layer}, ${artifact.depth}m). Material: ${artifact.material}, Period: ${artifact.period}.`;
    this.sendUserMessage(query);
  }
}

// Global App instance
const app = new ArchaeoApp();

document.addEventListener("DOMContentLoaded", () => {
  app.init();
});
