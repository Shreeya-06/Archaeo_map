/**
 * ARCHAEOMap - Analytics & Data Visualization Engine
 * Renders Chart.js archaeological dashboards, stratigraphic depth histograms,
 * spatial cluster scatter plots, and dynamically synthesizes academic research insights.
 */

class AnalyticsEngine {
  constructor() {
    this.charts = {};
  }

  /**
   * Safe chart destroyer and recreation helper
   */
  destroyChart(key) {
    if (this.charts[key]) {
      this.charts[key].destroy();
      this.charts[key] = null;
    }
  }

  /**
   * Common dark archaeological theme options for Chart.js
   */
  getCommonOptions(title = "") {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            color: "#D9CAB3",
            font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
            boxWidth: 12,
            padding: 12
          }
        },
        tooltip: {
          backgroundColor: "#181D26",
          titleColor: "#F4EFE6",
          bodyColor: "#D9CAB3",
          borderColor: "#3E4756",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          displayColors: true
        }
      },
      scales: {
        x: {
          ticks: { color: "#A89F91", font: { size: 10 } },
          grid: { color: "rgba(255, 255, 255, 0.05)" }
        },
        y: {
          ticks: { color: "#A89F91", font: { size: 10 }, precision: 0 },
          grid: { color: "rgba(255, 255, 255, 0.05)" }
        }
      }
    };
  }

  /**
   * Initializes or updates all 4 Dashboard charts
   */
  renderDashboardCharts() {
    const stats = db.getStats();

    // 1. Artifact Type Distribution (Donut Chart)
    const typeCanvas = document.getElementById("chart-dash-type");
    if (typeCanvas) {
      this.destroyChart("dashType");
      const labels = Object.keys(TYPE_CONFIG);
      const data = labels.map(label => stats.typeCounts[label] || 0);
      const colors = labels.map(label => TYPE_CONFIG[label].color);

      this.charts.dashType = new Chart(typeCanvas, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: "#181D26",
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "68%",
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: "#D9CAB3",
                font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
                boxWidth: 10,
                padding: 8
              }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} specimens (${((ctx.raw / stats.totalArtifacts) * 100).toFixed(1)}%)`
              }
            }
          }
        }
      });
    }

    // 2. Material Distribution (Bar Chart)
    const materialCanvas = document.getElementById("chart-dash-material");
    if (materialCanvas) {
      this.destroyChart("dashMaterial");
      const labels = Object.keys(MATERIAL_CONFIG);
      const data = labels.map(label => stats.materialCounts[label] || 0);
      const colors = labels.map(label => MATERIAL_CONFIG[label].color);

      this.charts.dashMaterial = new Chart(materialCanvas, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Specimens",
            data: data,
            backgroundColor: colors,
            borderRadius: 6
          }]
        },
        options: {
          ...this.getCommonOptions(),
          plugins: {
            legend: { display: false }
          }
        }
      });
    }

    // 3. Historical Period Distribution (Polar Area / Donut Chart)
    const periodCanvas = document.getElementById("chart-dash-period");
    if (periodCanvas) {
      this.destroyChart("dashPeriod");
      const labels = Object.keys(PERIOD_CONFIG).filter(p => (stats.periodCounts[p] || 0) > 0);
      const data = labels.map(label => stats.periodCounts[label] || 0);
      const colors = labels.map(label => PERIOD_CONFIG[label].color);

      this.charts.dashPeriod = new Chart(periodCanvas, {
        type: "polarArea",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.map(c => c + "B3"), // subtle alpha
            borderColor: colors,
            borderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              ticks: { display: false },
              grid: { color: "rgba(255, 255, 255, 0.08)" },
              angleLines: { color: "rgba(255, 255, 255, 0.08)" }
            }
          },
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: "#D9CAB3",
                font: { size: 10 },
                boxWidth: 10,
                padding: 8
              }
            }
          }
        }
      });
    }

    // 4. Site-wise Artifact Count (Horizontal Bar Chart)
    const siteCanvas = document.getElementById("chart-dash-site");
    if (siteCanvas) {
      this.destroyChart("dashSite");
      const sites = Object.keys(SITE_CONFIG);
      const data = sites.map(s => stats.siteCounts[s] || 0);
      const labels = sites.map(s => `${s} (${SITE_CONFIG[s] ? SITE_CONFIG[s].name : ""})`);

      this.charts.dashSite = new Chart(siteCanvas, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Artifacts Recorded",
            data: data,
            backgroundColor: "#C85A32",
            hoverBackgroundColor: "#E26D45",
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: "y",
          ...this.getCommonOptions(),
          plugins: {
            legend: { display: false }
          }
        }
      });
    }
  }

  /**
   * Renders the Spatial Analysis Page charts & cluster summary table
   */
  renderSpatialAnalysisCharts() {
    const allArtifacts = db.getAll();
    const spatialResult = spatialEngine.runDBSCAN(allArtifacts);
    const { clusters, stats, clusteredArtifacts } = spatialResult;

    // Update KPI Cards
    const totalClustEl = document.getElementById("kpi-spatial-clusters");
    const corePtsEl = document.getElementById("kpi-core-points");
    const borderPtsEl = document.getElementById("kpi-border-points");
    const noisePtsEl = document.getElementById("kpi-noise-points");
    const avgSizeEl = document.getElementById("kpi-avg-cluster-size");

    if (totalClustEl) totalClustEl.innerText = stats.totalClusters;
    if (corePtsEl) corePtsEl.innerText = stats.corePoints;
    if (borderPtsEl) borderPtsEl.innerText = stats.borderPoints;
    if (noisePtsEl) noisePtsEl.innerText = stats.noisePoints;
    if (avgSizeEl) avgSizeEl.innerText = `${stats.avgClusterSize} items`;

    // Chart A: Cluster Distribution (Bar Chart)
    const clusterDistCanvas = document.getElementById("chart-spatial-cluster-dist");
    if (clusterDistCanvas) {
      this.destroyChart("spatialClusterDist");
      const labels = clusters.map(c => c.name);
      const data = clusters.map(c => c.count);
      const bgColors = clusters.map(c => c.color);

      this.charts.spatialClusterDist = new Chart(clusterDistCanvas, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Observations in Cluster",
            data: data,
            backgroundColor: bgColors,
            borderRadius: 6
          }]
        },
        options: {
          ...this.getCommonOptions(),
          plugins: { legend: { display: false } }
        }
      });
    }

    // Chart B: Spatial Distribution (2D Scatter Plot: Longitude vs Latitude)
    const spatialScatterCanvas = document.getElementById("chart-spatial-scatter");
    if (spatialScatterCanvas) {
      this.destroyChart("spatialScatter");

      const datasets = clusters.map(c => ({
        label: c.name,
        data: c.items.map(item => ({ x: item.longitude, y: item.latitude, name: item.name, depth: item.depth })),
        backgroundColor: c.color,
        borderColor: "#FFFFFF",
        borderWidth: 1,
        pointRadius: 6,
        pointHoverRadius: 9
      }));

      // Add noise points
      const noiseItems = clusteredArtifacts.filter(a => a.clusterId === -1);
      if (noiseItems.length > 0) {
        datasets.push({
          label: "Noise / Isolated",
          data: noiseItems.map(item => ({ x: item.longitude, y: item.latitude, name: item.name, depth: item.depth })),
          backgroundColor: "#7F8C8D",
          borderColor: "#FFFFFF",
          borderWidth: 1,
          pointRadius: 5,
          pointStyle: "crossRot",
          pointHoverRadius: 8
        });
      }

      this.charts.spatialScatter = new Chart(spatialScatterCanvas, {
        type: "scatter",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: { color: "#D9CAB3", font: { size: 10 }, boxWidth: 10 }
            },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const raw = ctx.raw;
                  return ` ${raw.name} | Depth: ${raw.depth}m (${raw.y.toFixed(4)}°N, ${raw.x.toFixed(4)}°E)`;
                }
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: "Longitude (°E)", color: "#A89F91", font: { size: 10 } },
              ticks: { color: "#A89F91", font: { size: 9 } },
              grid: { color: "rgba(255, 255, 255, 0.05)" }
            },
            y: {
              title: { display: true, text: "Latitude (°N)", color: "#A89F91", font: { size: 10 } },
              ticks: { color: "#A89F91", font: { size: 9 } },
              grid: { color: "rgba(255, 255, 255, 0.05)" }
            }
          }
        }
      });
    }

    // Chart C: Depth vs Spatial Distribution (Scatter: Depth vs Cluster ID)
    const depthScatterCanvas = document.getElementById("chart-depth-spatial-scatter");
    if (depthScatterCanvas) {
      this.destroyChart("depthSpatialScatter");

      const scatterData = clusteredArtifacts.map(a => ({
        x: a.depth,
        y: a.clusterId === -1 ? 0 : a.clusterId,
        name: a.name,
        site: a.site,
        color: a.clusterId === -1 ? "#7F8C8D" : (clusters.find(c => c.id === a.clusterId)?.color || "#C85A32")
      }));

      this.charts.depthSpatialScatter = new Chart(depthScatterCanvas, {
        type: "scatter",
        data: {
          datasets: [{
            label: "Artifact Stratigraphy",
            data: scatterData,
            backgroundColor: scatterData.map(d => d.color),
            borderColor: "#FFFFFF",
            borderWidth: 1,
            pointRadius: 6,
            pointHoverRadius: 9
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const raw = ctx.raw;
                  return ` ${raw.name} (${raw.site}) | Depth: ${raw.x}m | ${raw.y === 0 ? "Noise" : "Cluster " + raw.y}`;
                }
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: "Excavation Depth (meters below surface)", color: "#A89F91", font: { size: 10 } },
              ticks: { color: "#A89F91" },
              grid: { color: "rgba(255, 255, 255, 0.05)" }
            },
            y: {
              title: { display: true, text: "Spatial Cluster Group (0 = Noise)", color: "#A89F91", font: { size: 10 } },
              ticks: { color: "#A89F91", stepSize: 1 },
              grid: { color: "rgba(255, 255, 255, 0.05)" }
            }
          }
        }
      });
    }

    // Render Cluster Summary Table
    this.renderClusterSummaryTable(clusters);
  }

  /**
   * Populates the DBSCAN Cluster Summary Table
   */
  renderClusterSummaryTable(clusters) {
    const tableBody = document.getElementById("cluster-summary-tbody");
    if (!tableBody) return;

    if (clusters.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="px-4 py-6 text-center text-stone-400 text-sm italic">
            No dense spatial clusters detected with current epsilon and minPts settings.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = clusters.map(c => `
      <tr class="border-b border-stone-700/40 hover:bg-charcoal-700/40 transition-colors">
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full shrink-0" style="background-color: ${c.color}"></span>
            <span class="font-serif font-bold text-sandstone-100 text-sm">${c.name}</span>
          </div>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-charcoal-900 border border-stone-700 text-gold">
            ${c.count} artifacts
          </span>
        </td>
        <td class="px-4 py-3 whitespace-nowrap font-mono text-xs text-stone-300">
          ${c.avgLat.toFixed(4)}° N
        </td>
        <td class="px-4 py-3 whitespace-nowrap font-mono text-xs text-stone-300">
          ${c.avgLon.toFixed(4)}° E
        </td>
        <td class="px-4 py-3 whitespace-nowrap font-mono text-xs text-sandstone-200">
          ${c.avgDepth} m <span class="text-[10px] text-stone-500">(${c.minDepth}–${c.maxDepth}m)</span>
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <span class="px-2 py-0.5 rounded text-xs font-medium text-stone-200 bg-stone-700/60">
            ${c.primaryType} (${c.primaryMaterial})
          </span>
        </td>
      </tr>
    `).join("");
  }

  /**
   * Renders the Analytics Deep-Dive Page
   */
  renderAnalyticsPage() {
    const stats = db.getStats();
    const artifacts = db.getAll();

    // 1. Dynamic KPI & Academic Research Insights
    this.synthesizeAcademicInsights(stats, artifacts);

    // 2. Stratigraphic Depth Histogram
    const depthCanvas = document.getElementById("chart-analytics-depth");
    if (depthCanvas) {
      this.destroyChart("analyticsDepth");
      const labels = Object.keys(stats.depthBrackets);
      const data = labels.map(k => stats.depthBrackets[k]);

      this.charts.analyticsDepth = new Chart(depthCanvas, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Artifact Frequency",
            data: data,
            backgroundColor: "#C6A664",
            hoverBackgroundColor: "#DFC17F",
            borderRadius: 6
          }]
        },
        options: {
          ...this.getCommonOptions(),
          plugins: { legend: { display: false } }
        }
      });
    }

    // 3. Material Breakdown
    const matCanvas = document.getElementById("chart-analytics-material");
    if (matCanvas) {
      this.destroyChart("analyticsMaterial");
      const labels = Object.keys(MATERIAL_CONFIG);
      const data = labels.map(k => stats.materialCounts[k] || 0);
      const colors = labels.map(k => MATERIAL_CONFIG[k].color);

      this.charts.analyticsMaterial = new Chart(matCanvas, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Material Specimens",
            data: data,
            backgroundColor: colors,
            borderRadius: 6
          }]
        },
        options: {
          ...this.getCommonOptions(),
          plugins: { legend: { display: false } }
        }
      });
    }

    // 4. Chronological Period Breakdown
    const periodCanvas = document.getElementById("chart-analytics-period");
    if (periodCanvas) {
      this.destroyChart("analyticsPeriod");
      const labels = Object.keys(PERIOD_CONFIG).filter(p => (stats.periodCounts[p] || 0) > 0);
      const data = labels.map(k => stats.periodCounts[k] || 0);
      const colors = labels.map(k => PERIOD_CONFIG[k].color);

      this.charts.analyticsPeriod = new Chart(periodCanvas, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors,
            borderColor: "#181D26",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "60%",
          plugins: {
            legend: { position: "right", labels: { color: "#D9CAB3", font: { size: 10 } } }
          }
        }
      });
    }

    // 5. Site Density Comparison
    const siteCanvas = document.getElementById("chart-analytics-site");
    if (siteCanvas) {
      this.destroyChart("analyticsSite");
      const sites = Object.keys(SITE_CONFIG);
      const data = sites.map(s => stats.siteCounts[s] || 0);

      this.charts.analyticsSite = new Chart(siteCanvas, {
        type: "line",
        data: {
          labels: sites,
          datasets: [{
            label: "Survey Observation Density",
            data: data,
            borderColor: "#C85A32",
            backgroundColor: "rgba(200, 90, 50, 0.15)",
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#D4AF37",
            pointBorderColor: "#FFFFFF",
            pointRadius: 6
          }]
        },
        options: {
          ...this.getCommonOptions(),
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  /**
   * Generates dynamic archaeological academic insight sentences based on current live data
   */
  synthesizeAcademicInsights(stats, artifacts) {
    const insightsContainer = document.getElementById("dynamic-academic-insights");
    if (!insightsContainer) return;

    if (stats.totalArtifacts === 0) {
      insightsContainer.innerHTML = `<p class="text-stone-400 italic">No artifact data recorded yet.</p>`;
      return;
    }

    // Find top artifact type
    const topTypeEntry = Object.entries(stats.typeCounts).sort((a, b) => b[1] - a[1])[0];
    const topType = topTypeEntry ? topTypeEntry[0] : "Pottery";
    const topTypePct = topTypeEntry ? ((topTypeEntry[1] / stats.totalArtifacts) * 100).toFixed(1) : 0;

    // Find top site
    const topSiteEntry = Object.entries(stats.siteCounts).sort((a, b) => b[1] - a[1])[0];
    const topSite = topSiteEntry ? topSiteEntry[0] : "Site A";
    const topSiteCount = topSiteEntry ? topSiteEntry[1] : 0;

    // Find dominant depth range
    const topDepthBracketEntry = Object.entries(stats.depthBrackets).sort((a, b) => b[1] - a[1])[0];
    const dominantDepthRange = topDepthBracketEntry ? topDepthBracketEntry[0] : "1.0 - 1.5m";

    // Spatial clustering metrics
    const spatialResult = spatialEngine.runDBSCAN(artifacts);
    const clusterCount = spatialResult.stats.totalClusters;
    const noiseCount = spatialResult.stats.noisePoints;

    insightsContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Insight 1 -->
        <div class="bg-charcoal-800/80 p-4 rounded-xl border border-terracotta/30 shadow-md">
          <div class="flex items-center gap-2 text-terracotta mb-2">
            <i class="fas fa-layer-group text-sm"></i>
            <span class="text-xs font-bold uppercase tracking-wider">Typological Dominance</span>
          </div>
          <p class="text-xs text-stone-200 leading-relaxed">
            <strong class="text-sandstone-100 font-serif">${topType}</strong> represents the largest artifact assemblage, accounting for <span class="text-terracotta font-mono font-bold">${topTypePct}%</span> (${topTypeEntry[1]} specimens) of cataloged discoveries.
          </p>
        </div>

        <!-- Insight 2 -->
        <div class="bg-charcoal-800/80 p-4 rounded-xl border border-gold/30 shadow-md">
          <div class="flex items-center gap-2 text-gold mb-2">
            <i class="fas fa-landmark-flag text-sm"></i>
            <span class="text-xs font-bold uppercase tracking-wider">Spatial Nucleation</span>
          </div>
          <p class="text-xs text-stone-200 leading-relaxed">
            <strong class="text-sandstone-100 font-serif">${topSite}</strong> contains the highest concentration of recorded observations with <span class="text-gold font-mono font-bold">${topSiteCount} items</span>, indicating sustained domestic or civic occupation.
          </p>
        </div>

        <!-- Insight 3 -->
        <div class="bg-charcoal-800/80 p-4 rounded-xl border border-blue-500/30 shadow-md">
          <div class="flex items-center gap-2 text-blue-400 mb-2">
            <i class="fas fa-arrows-down-to-line text-sm"></i>
            <span class="text-xs font-bold uppercase tracking-wider">Stratigraphic Horizon</span>
          </div>
          <p class="text-xs text-stone-200 leading-relaxed">
            Most recorded artifacts cluster within the <span class="text-blue-300 font-mono font-bold">${dominantDepthRange}</span> depth tier, corresponding to peak Phase II structural habitation strata.
          </p>
        </div>

        <!-- Insight 4 -->
        <div class="bg-charcoal-800/80 p-4 rounded-xl border border-emerald-500/30 shadow-md">
          <div class="flex items-center gap-2 text-emerald-400 mb-2">
            <i class="fas fa-brain text-sm"></i>
            <span class="text-xs font-bold uppercase tracking-wider">Spatial Density Pattern</span>
          </div>
          <p class="text-xs text-stone-200 leading-relaxed">
            DBSCAN algorithm isolates <span class="text-emerald-400 font-mono font-bold">${clusterCount} spatial clusters</span> and <span class="text-stone-400 font-mono">${noiseCount} peripheral noise points</span>, delineating focal excavation zones.
          </p>
        </div>
      </div>
    `;
  }
}

// Global analytics engine instance
const analytics = new AnalyticsEngine();
