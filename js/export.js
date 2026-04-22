// ================================================================
// EXPORT.JS — exportación Excel
// ================================================================

async function exportExcel() {
  if (!filteredIncidents.length) { toast('No hay incidencias para exportar', 'error'); return; }
  showLoad('Generando informe Excel...');

  try {
    // ── Fetch all updates for visible incidents in one query ──
    const ids = filteredIncidents.map(i => i.id).join(',');
    let allUpdates = [];
    try {
      allUpdates = await sb.query('incident_updates',
        `?incident_id=in.(${ids})&order=incident_id.asc,created_at.asc&select=*`);
    } catch (e) { /* if no updates, continue */ }

    // Group updates by incident_id
    const updatesByIncident = {};
    allUpdates.forEach(u => {
      if (!updatesByIncident[u.incident_id]) updatesByIncident[u.incident_id] = [];
      updatesByIncident[u.incident_id].push(u);
    });

    // ── Color palette ──
    const brand = (appConfig.colors?.['--brand'] || '#1a56db').replace('#', '');
    const brandDark = shadeColor('#' + brand, -30).replace('#', '');
    const brandLight = 'EBF2FF';
    const STATUS_COLORS = {
      open: { fill: 'DBEAFE', text: '1E3A8A' },
      in_progress: { fill: 'FEF3C7', text: '92400E' },
      closed: { fill: 'D1FAE5', text: '065F46' },
    };

    const wb = XLSX.utils.book_new();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const company = appConfig.company_name || 'TransLog';

    // ================================================================
    // SHEET 1 — PORTADA / RESUMEN
    // ================================================================
    const open = filteredIncidents.filter(i => i.status === 'open').length;
    const prog = filteredIncidents.filter(i => i.status === 'in_progress').length;
    const closed = filteredIncidents.filter(i => i.status === 'closed').length;

    const coverData = [
      ['', ''],
      [company.toUpperCase(), ''],
      ['INFORME DE INCIDENCIAS DE TRANSPORTE', ''],
      ['', ''],
      ['Fecha de generación:', dateStr],
      ['Generado por:', currentUser?.name || '—'],
      ['', ''],
      ['RESUMEN EJECUTIVO', ''],
      ['', ''],
      ['Total de incidencias:', filteredIncidents.length],
      ['Incidencias abiertas:', open],
      ['En progreso:', prog],
      ['Resueltas:', closed],
      ['', ''],
      ['Agencias afectadas:', new Set(filteredIncidents.map(i => i.agency_name)).size],
      ['Incidencias con anotaciones:', Object.keys(updatesByIncident).length],
    ];

    const wsCover = XLSX.utils.aoa_to_sheet(coverData);
    wsCover['!cols'] = [{ wch: 32 }, { wch: 40 }];
    wsCover['!merges'] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } },
    ];

    // Style cover cells
    const coverStyles = {
      'A2': { font: { bold: true, sz: 18, color: { rgb: brand } }, alignment: { horizontal: 'center' } },
      'A3': { font: { bold: true, sz: 13, color: { rgb: '475569' } }, alignment: { horizontal: 'center' } },
      'A5': { font: { bold: true, sz: 10, color: { rgb: '64748B' } } },
      'B5': { font: { sz: 10 } },
      'A6': { font: { bold: true, sz: 10, color: { rgb: '64748B' } } },
      'B6': { font: { sz: 10 } },
      'A8': { font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: brand } }, alignment: { horizontal: 'center' } },
      'A10': { font: { bold: true, sz: 11 } },
      'B10': { font: { bold: true, sz: 14, color: { rgb: brand } }, alignment: { horizontal: 'right' } },
      'A11': { font: { sz: 10, color: { rgb: '1E3A8A' } } }, 'B11': { font: { bold: true, sz: 11, color: { rgb: '1E3A8A' } }, fill: { fgColor: { rgb: 'DBEAFE' } }, alignment: { horizontal: 'right' } },
      'A12': { font: { sz: 10, color: { rgb: '92400E' } } }, 'B12': { font: { bold: true, sz: 11, color: { rgb: '92400E' } }, fill: { fgColor: { rgb: 'FEF3C7' } }, alignment: { horizontal: 'right' } },
      'A13': { font: { sz: 10, color: { rgb: '065F46' } } }, 'B13': { font: { bold: true, sz: 11, color: { rgb: '065F46' } }, fill: { fgColor: { rgb: 'D1FAE5' } }, alignment: { horizontal: 'right' } },
      'A15': { font: { sz: 10, color: { rgb: '64748B' } } }, 'B15': { font: { bold: true, sz: 10 }, alignment: { horizontal: 'right' } },
      'A16': { font: { sz: 10, color: { rgb: '64748B' } } }, 'B16': { font: { bold: true, sz: 10 }, alignment: { horizontal: 'right' } },
    };
    Object.entries(coverStyles).forEach(([addr, style]) => {
      if (!wsCover[addr]) wsCover[addr] = { v: '', t: 's' };
      wsCover[addr].s = style;
    });

    XLSX.utils.book_append_sheet(wb, wsCover, '📋 Portada');

    // ================================================================
    // SHEET 2 — LISTADO DE INCIDENCIAS
    // ================================================================
    const headers = [
      'Agencia', 'Albarán', 'Cliente', 'Tipo de incidencia',
      'Zona', 'Población', 'C. Postal', 'Tipo de envío',
      'Estado', 'F. Incidencia', 'F. Envío', 'F. Entrega',
      'Descripción', 'Nº Anotaciones'
    ];

    // Title rows
    const incRows = [
      [company + ' — Informe de Incidencias de Transporte'],
      ['Exportado el ' + dateStr + '  ·  ' + filteredIncidents.length + ' registros'],
      [],
      headers,
    ];

    filteredIncidents.forEach(i => {
      const sc = STATUS_COLORS[i.status] || STATUS_COLORS.open;
      incRows.push([
        i.agency_name,
        i.albaran,
        i.client_name || '',
        i.incident_type_name,
        i.zone_name,
        i.city || '',
        i.postal_code || '',
        i.shipment_type_name !== '—' ? i.shipment_type_name : (i.shipment_type || ''),
        statusLabel(i.status),
        fmtDate(i.incident_date),
        fmtDate(i.shipment_date),
        fmtDate(i.reception_date),
        i.description || '',
        (updatesByIncident[i.id] || []).length,
      ]);
    });

    const wsInc = XLSX.utils.aoa_to_sheet(incRows);
    wsInc['!cols'] = [
      { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 22 }, { wch: 18 }, { wch: 16 },
      { wch: 10 }, { wch: 18 }, { wch: 13 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 45 }, { wch: 14 }
    ];
    wsInc['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 13 } },
    ];
    wsInc['!rows'] = [{ hpt: 28 }, { hpt: 18 }, { hpt: 6 }, { hpt: 22 }];

    // Style title
    wsInc['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: brand } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
    if (wsInc['A2']) wsInc['A2'].s = {
      font: { italic: true, sz: 10, color: { rgb: '64748B' } },
      fill: { fgColor: { rgb: brandLight } },
      alignment: { horizontal: 'center' }
    };

    // Style header row (row index 3 = row 4)
    for (let C = 0; C < headers.length; C++) {
      const addr = XLSX.utils.encode_cell({ r: 3, c: C });
      if (!wsInc[addr]) wsInc[addr] = { v: headers[C], t: 's' };
      wsInc[addr].s = {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
        fill: { fgColor: { rgb: brandDark } },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: 'FFFFFF' } },
          bottom: { style: 'medium', color: { rgb: 'FFFFFF' } },
          left: { style: 'thin', color: { rgb: 'FFFFFF' } },
          right: { style: 'thin', color: { rgb: 'FFFFFF' } },
        }
      };
    }

    // Style data rows
    filteredIncidents.forEach((inc, idx) => {
      const R = idx + 4; // rows 0-3 are title/headers
      const sc = STATUS_COLORS[inc.status] || STATUS_COLORS.open;
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? 'FFFFFF' : brandLight;

      for (let C = 0; C < headers.length; C++) {
        const addr = XLSX.utils.encode_cell({ r: R, c: C });
        if (!wsInc[addr]) wsInc[addr] = { v: '', t: 's' };
        const isStatus = C === 8;
        const isDesc = C === 12;
        const isNotes = C === 13;
        wsInc[addr].s = {
          font: {
            sz: 10, name: 'Calibri',
            color: { rgb: isStatus ? sc.text : '0F172A' },
            bold: isStatus || isNotes,
          },
          fill: { fgColor: { rgb: isStatus ? sc.fill : rowBg } },
          alignment: {
            vertical: 'top',
            horizontal: isNotes ? 'center' : (isStatus ? 'center' : 'left'),
            wrapText: isDesc,
          },
          border: {
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
          }
        };
      }
    });

    XLSX.utils.book_append_sheet(wb, wsInc, '📊 Incidencias');

    // ================================================================
    // SHEET 3 — ANOTACIONES / HISTORIAL
    // ================================================================
    const notesHeaders = ['Albarán', 'Agencia', 'Cliente', 'Estado', 'Fecha anotación', 'Usuario', 'Anotación'];
    const notesRows = [
      [company + ' — Historial de Anotaciones'],
      ['Exportado el ' + dateStr],
      [],
      notesHeaders,
    ];

    function wrapNote(text, maxLen = 66) {
      if (!text) return '';
      const words = text.split(' ');
      const lines = [];
      let line = '';
      for (const word of words) {
        if (line.length + (line ? 1 : 0) + word.length > maxLen) {
          if (line) lines.push(line);
          // word itself longer than maxLen: hard break it
          let w = word;
          while (w.length > maxLen) { lines.push(w.slice(0, maxLen)); w = w.slice(maxLen); }
          line = w;
        } else {
          line = line ? line + ' ' + word : word;
        }
      }
      if (line) lines.push(line);
      return lines.join('\n');
    }

    let hasNotes = false;
    filteredIncidents.forEach(inc => {
      const updates = updatesByIncident[inc.id] || [];
      if (!updates.length) return;
      hasNotes = true;
      // Separator row with incident info
      notesRows.push([
        '▶  ' + inc.albaran,
        inc.agency_name,
        inc.client_name || '',
        statusLabel(inc.status),
        '', '', ''
      ]);
      updates.forEach(u => {
        const lines = wrapNote(u.note).split('\n');
        lines.forEach((line, lineIdx) => {
          notesRows.push([
            '', '', '', '',
            lineIdx === 0 ? fmtDateTime(u.created_at) : '',
            lineIdx === 0 ? (u.user_name || '—') : '',
            line
          ]);
        });
      });
      notesRows.push(['', '', '', '', '', '', '']); // spacer
    });

    if (!hasNotes) {
      notesRows.push(['', '', '', '', '', '', '']);
      notesRows.push(['Sin anotaciones registradas', '', '', '', '', '', '']);
    }

    const wsNotes = XLSX.utils.aoa_to_sheet(notesRows);
    wsNotes['!cols'] = [
      { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 13 }, { wch: 18 }, { wch: 18 }, { wch: 60 }
    ];
    wsNotes['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    ];

    // Style notes title
    if (wsNotes['A1']) wsNotes['A1'].s = {
      font: { bold: true, sz: 14, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: brand } },
      alignment: { horizontal: 'center', vertical: 'center' }
    };
    if (wsNotes['A2']) wsNotes['A2'].s = {
      font: { italic: true, sz: 10, color: { rgb: '64748B' } },
      fill: { fgColor: { rgb: brandLight } },
      alignment: { horizontal: 'center' }
    };

    // Style notes header row
    for (let C = 0; C < notesHeaders.length; C++) {
      const addr = XLSX.utils.encode_cell({ r: 3, c: C });
      if (!wsNotes[addr]) wsNotes[addr] = { v: notesHeaders[C], t: 's' };
      wsNotes[addr].s = {
        font: { bold: true, sz: 10, color: { rgb: 'FFFFFF' }, name: 'Calibri' },
        fill: { fgColor: { rgb: brandDark } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: { bottom: { style: 'medium', color: { rgb: 'FFFFFF' } } }
      };
    }

    // Style notes data rows + calculate row heights
    const notesRowHeights = [
      { hpt: 28 }, // row 0 — title
      { hpt: 16 }, // row 1 — subtitle
      { hpt: 6  }, // row 2 — spacer
      { hpt: 20 }, // row 3 — header
    ];
    const LINE_HPT = 14; // points per line at 10pt font

    let notesDataStart = 4;
    let rowIdx = notesDataStart;
    filteredIncidents.forEach(inc => {
      const updates = updatesByIncident[inc.id] || [];
      if (!updates.length) return;
      // Incident separator row style
      for (let C = 0; C < notesHeaders.length; C++) {
        const addr = XLSX.utils.encode_cell({ r: rowIdx, c: C });
        if (!wsNotes[addr]) wsNotes[addr] = { v: '', t: 's' };
        wsNotes[addr].s = {
          font: { bold: true, sz: 10, color: { rgb: brandDark }, name: 'Calibri' },
          fill: { fgColor: { rgb: brandLight } },
          border: { bottom: { style: 'thin', color: { rgb: 'CBD5E1' } } }
        };
      }
      notesRowHeights[rowIdx] = { hpt: 18 };
      rowIdx++;
      updates.forEach((u, ui) => {
        const lines = wrapNote(u.note).split('\n');
        lines.forEach((line, lineIdx) => {
          const isLastLine = lineIdx === lines.length - 1;
          for (let C = 0; C < notesHeaders.length; C++) {
            const addr = XLSX.utils.encode_cell({ r: rowIdx, c: C });
            if (!wsNotes[addr]) wsNotes[addr] = { v: '', t: 's' };
            wsNotes[addr].s = {
              font: { sz: 10, name: 'Calibri', color: { rgb: C === 6 ? '1E293B' : '475569' } },
              fill: { fgColor: { rgb: ui % 2 === 0 ? 'FFFFFF' : 'F8FAFC' } },
              alignment: { vertical: 'center' },
              border: isLastLine ? { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } } : {}
            };
          }
          notesRowHeights[rowIdx] = { hpt: 16 };
          rowIdx++;
        });
      });
      notesRowHeights[rowIdx] = { hpt: 6 };
      rowIdx++; // spacer
    });

    wsNotes['!rows'] = notesRowHeights;

    XLSX.utils.book_append_sheet(wb, wsNotes, '💬 Anotaciones');

    // ── Write file ──
    const fileName = `Incidencias_${company.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast('✓ Informe Excel generado correctamente');

  } catch (e) {
    console.error('Export error:', e);
    toast('Error al exportar: ' + e.message, 'error');
  }
  hideLoad();
}
