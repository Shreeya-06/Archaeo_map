/**
 * ARCHAEOMap - Archaeological Data Export Engine
 * Generates standards-compliant CSV, JSON, GeoJSON (RFC 7946 for QGIS/ArcGIS),
 * and Excel (XML Spreadsheet) export formats.
 */

class DataExportEngine {
  /**
   * Helper to trigger browser file download via Blob URL
   */
  downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  /**
   * Generates standard CSV representation of artifacts
   */
  exportCSV(artifacts, filename = "archaeomap_survey_records.csv") {
    if (!artifacts || artifacts.length === 0) {
      alert("No records to export.");
      return;
    }

    const headers = [
      "Artifact ID",
      "Artifact Name",
      "Type",
      "Material",
      "Historical Period",
      "Site",
      "Excavation Area / Trench",
      "Stratigraphic Layer",
      "Depth (m)",
      "Latitude",
      "Longitude",
      "Status",
      "Description",
      "Date Recorded",
      "Recorded By",
      "Image URL"
    ];

    const rows = artifacts.map(a => [
      `"${(a.id || "").replace(/"/g, '""')}"`,
      `"${(a.name || "").replace(/"/g, '""')}"`,
      `"${(a.type || "").replace(/"/g, '""')}"`,
      `"${(a.material || "").replace(/"/g, '""')}"`,
      `"${(a.period || "").replace(/"/g, '""')}"`,
      `"${(a.site || "").replace(/"/g, '""')}"`,
      `"${(a.excavationArea || "").replace(/"/g, '""')}"`,
      `"${(a.layer || "").replace(/"/g, '""')}"`,
      a.depth,
      a.latitude,
      a.longitude,
      `"${(a.status || "").replace(/"/g, '""')}"`,
      `"${(a.description || "").replace(/"/g, '""')}"`,
      `"${(a.dateRecorded || "").replace(/"/g, '""')}"`,
      `"${(a.recordedBy || "").replace(/"/g, '""')}"`,
      `"${(a.imageUrl || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    this.downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
  }

  /**
   * Generates formatted JSON representation of artifacts
   */
  exportJSON(artifacts, filename = "archaeomap_survey_records.json") {
    if (!artifacts || artifacts.length === 0) {
      alert("No records to export.");
      return;
    }

    const jsonContent = JSON.stringify(
      {
        project: "ARCHAEOMap - Digital Archaeological Field Survey System",
        exportedAt: new Date().toISOString(),
        totalRecords: artifacts.length,
        records: artifacts
      },
      null,
      2
    );

    this.downloadFile(jsonContent, filename, "application/json;charset=utf-8;");
  }

  /**
   * Generates standard GeoJSON FeatureCollection (RFC 7946) for QGIS, ArcGIS, & WebGIS
   */
  exportGeoJSON(artifacts, filename = "archaeomap_gis_features.geojson") {
    if (!artifacts || artifacts.length === 0) {
      alert("No records to export.");
      return;
    }

    const geojson = {
      type: "FeatureCollection",
      crs: {
        type: "name",
        properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" }
      },
      metadata: {
        system: "ARCHAEOMap GIS Engine",
        generated: new Date().toISOString(),
        count: artifacts.length
      },
      features: artifacts.map(a => ({
        type: "Feature",
        id: a.id,
        geometry: {
          type: "Point",
          coordinates: [a.longitude, a.latitude] // GeoJSON is [Longitude, Latitude, Elevation]
        },
        properties: {
          id: a.id,
          name: a.name,
          type: a.type,
          material: a.material,
          period: a.period,
          site: a.site,
          excavationArea: a.excavationArea,
          layer: a.layer,
          depth_m: a.depth,
          status: a.status,
          description: a.description,
          recordedBy: a.recordedBy,
          dateRecorded: a.dateRecorded
        }
      }))
    };

    this.downloadFile(JSON.stringify(geojson, null, 2), filename, "application/geo+json;charset=utf-8;");
  }

  /**
   * Generates Microsoft Excel compatible XML Spreadsheet format
   */
  exportExcel(artifacts, filename = "archaeomap_survey_records.xls") {
    if (!artifacts || artifacts.length === 0) {
      alert("No records to export.");
      return;
    }

    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#C85A32" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Data">
   <Font ss:FontName="Calibri" ss:Size="10"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Archaeological Discoveries">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Artifact ID</Data></Cell>
    <Cell><Data ss:Type="String">Artifact Name</Data></Cell>
    <Cell><Data ss:Type="String">Type</Data></Cell>
    <Cell><Data ss:Type="String">Material</Data></Cell>
    <Cell><Data ss:Type="String">Historical Period</Data></Cell>
    <Cell><Data ss:Type="String">Site</Data></Cell>
    <Cell><Data ss:Type="String">Excavation Area</Data></Cell>
    <Cell><Data ss:Type="String">Stratigraphic Layer</Data></Cell>
    <Cell><Data ss:Type="String">Depth (m)</Data></Cell>
    <Cell><Data ss:Type="String">Latitude</Data></Cell>
    <Cell><Data ss:Type="String">Longitude</Data></Cell>
    <Cell><Data ss:Type="String">Status</Data></Cell>
    <Cell><Data ss:Type="String">Field Description</Data></Cell>
   </Row>`;

    const xmlRows = artifacts.map(a => `
   <Row ss:StyleID="Data">
    <Cell><Data ss:Type="String">${this.escapeXml(a.id)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.name)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.type)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.material)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.period)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.site)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.excavationArea)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.layer)}</Data></Cell>
    <Cell><Data ss:Type="Number">${a.depth}</Data></Cell>
    <Cell><Data ss:Type="Number">${a.latitude}</Data></Cell>
    <Cell><Data ss:Type="Number">${a.longitude}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.status)}</Data></Cell>
    <Cell><Data ss:Type="String">${this.escapeXml(a.description)}</Data></Cell>
   </Row>`).join("");

    const xmlFooter = `
  </Table>
 </Worksheet>
</Workbook>`;

    const excelContent = xmlHeader + xmlRows + xmlFooter;
    this.downloadFile(excelContent, filename, "application/vnd.ms-excel;charset=utf-8;");
  }

  escapeXml(unsafe) {
    if (unsafe === undefined || unsafe === null) return "";
    return String(unsafe).replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return c;
      }
    });
  }
}

// Global data export engine instance
const dataExport = new DataExportEngine();
