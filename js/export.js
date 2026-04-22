// ================================================================
// EXPORT.JS — exportación Excel Mejorada
// ================================================================

async function exportExcel() {
  if (!filteredIncidents.length) { toast('No hay incidencias para exportar', 'error'); return; }
  showLoad('Generando informe Excel corporativo...');

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

    // ── Color palette & Styles ──
    // Utilizamos una paleta muy limpia, corporativa y moderna
    const brandRaw = appConfig.colors?.['--brand'] || '#0F172A';
    const brand = brandRaw.replace('#', '').toUpperCase();
    
    // Si el brand es muy oscuro, brandDark y brandLight se ajustan manual para garantizar elegancia
    const bgHeader = '1E293B'; // Slate 800 - Muy elegante para cabeceras
    const textHeader = 'F8FAFC'; // Slate 50
    const bgEven = 'FFFFFF'; 
    const bgOdd = 'F8FAFC'; // Slate 50
    const borderCol = 'E2E8F0'; // Slate 200

    const STATUS_COLORS = {
      open: { fill: 'EFF6FF', text: '1D4ED8' }, // Blue
      in_progress: { fill: 'FFFBEB', text: 'B45309' }, // Amber
      closed: { fill: 'ECFDF5', text: '047857' }, // Emerald
    };

    const wb = XLSX.utils.book_new();
    const now = new Date();
    const dateStr = now.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' });
    const company = appConfig.company_name || 'TransLog';

    // Helper para bordes
    const borderAll = {
      top: { style: 'thin', color: { rgb: borderCol } },
      bottom: { style: 'thin', color: { rgb: borderCol } },
      left: { style: 'thin', color: { rgb: borderCol } },
      right: { style: 'thin', color: { rgb: borderCol } },
    };

    // ================================================================
    // SHEET 1 — PORTADA / RESUMEN
    // ================================================================
    const open = filteredIncidents.filter(i => i.status === 'open').length;
    const prog = filteredIncidents.filter(i => i.status === 'in_progress').length;
    const closed = filteredIncidents.filter(i => i.status === 'closed').length;

    const coverData = [
      [''], // 1
      ['', company.toUpperCase()], // 2
      ['', 'INFORME EJECUTIVO DE INCIDENCIAS'], // 3
      [''], // 4
      ['', 'Datos del Informe'], // 5
      ['', 'Fecha de generación:', dateStr + ' ' + timeStr], // 6
      ['', 'Generado por:', currentUser?.name || 'Sistema'], // 7
      [''], // 8
      ['', 'Resumen de Estado'], // 9
      ['', 'Total de incidencias', filteredIncidents.length], // 10
      ['', 'Abiertas', open], // 11
      ['', 'En curso', prog], // 12
      ['', 'Cerradas', closed], // 13
      [''], // 14
      ['', 'Métricas Adicionales'], // 15
      ['', 'Agencias afectadas', new Set(filteredIncidents.map(i => i.agency_name)).size], // 16
      ['', 'Incidencias con seguimiento', Object.keys(updatesByIncident).length], // 17
    ];

    const wsCover = XLSX.utils.aoa_to_sheet(coverData);
    let maxColB = 30; // Ancho mínimo
    let maxColC = 20; // Ancho mínimo
    coverData.forEach((row, idx) => {
      // Ignorar títulos grandes (filas 0 a 3)
      if (idx > 3) {
        if (row[1]) maxColB = Math.max(maxColB, row[1].toString().length + 5);
        if (row[2]) maxColC = Math.max(maxColC, row[2].toString().length + 5);
      }
    });
    wsCover['!cols'] = [{ wch: 4 }, { wch: maxColB }, { wch: maxColC }];
    
    // Decorate Cover
    const setStyle = (ws, addr, style) => {
      if (!ws[addr]) ws[addr] = { v: '', t: 's' };
      ws[addr].s = style;
    };

    // Fondo general blanco para la portada para que no se vea la cuadrícula
    for(let r = 0; r < 25; r++) {
      for(let c = 0; c < 10; c++) {
        const addr = XLSX.utils.encode_cell({r, c});
        if (!wsCover[addr]) wsCover[addr] = { v: '', t: 's' };
        if (!wsCover[addr].s) wsCover[addr].s = {};
        wsCover[addr].s.fill = { fgColor: { rgb: 'FFFFFF' } };
      }
    }

    setStyle(wsCover, 'B2', { font: { bold: true, sz: 28, color: { rgb: brand }, name: 'Arial' } });
    setStyle(wsCover, 'B3', { font: { bold: false, sz: 14, color: { rgb: '64748B' }, name: 'Arial' } });

    if (!wsCover['!merges']) wsCover['!merges'] = [];
    wsCover['!merges'].push(
      { s: { r: 1, c: 1 }, e: { r: 1, c: 8 } }, // Título principal (B2 a I2)
      { s: { r: 2, c: 1 }, e: { r: 2, c: 8 } }  // Subtítulo (B3 a I3)
    );

    // Section Headers
    ['B5', 'B9', 'B15'].forEach(addr => {
      setStyle(wsCover, addr, { 
        font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' }, name: 'Arial' },
        fill: { fgColor: { rgb: bgHeader } },
        alignment: { vertical: 'center', indent: 1 }
      });
      // Extend the header across C
      const r = XLSX.utils.decode_cell(addr).r;
      setStyle(wsCover, XLSX.utils.encode_cell({r, c:2}), { 
        fill: { fgColor: { rgb: bgHeader } },
        border: { right: { style: 'thin', color: { rgb: bgHeader } } }
      });
      if (!wsCover['!merges']) wsCover['!merges'] = [];
      wsCover['!merges'].push({ s: { r, c: 1 }, e: { r, c: 2 } });
    });

    // Labels & Values
    const labelStyle = { font: { sz: 11, color: { rgb: '475569' }, name: 'Arial' }, alignment: { indent: 1 } };
    const valStyle = { font: { bold: true, sz: 11, color: { rgb: '0F172A' }, name: 'Arial' }, alignment: { horizontal: 'right' } };

    setStyle(wsCover, 'B6', labelStyle); setStyle(wsCover, 'C6', valStyle);
    setStyle(wsCover, 'B7', labelStyle); setStyle(wsCover, 'C7', valStyle);
    
    // Total
    setStyle(wsCover, 'B10', { font: { bold: true, sz: 12, color: { rgb: '0F172A' }, name: 'Arial' }, alignment: { indent: 1 } }); 
    setStyle(wsCover, 'C10', { font: { bold: true, sz: 14, color: { rgb: brand }, name: 'Arial' }, alignment: { horizontal: 'right' } });

    // Badges for statuses
    setStyle(wsCover, 'B11', labelStyle); setStyle(wsCover, 'C11', { font: { bold: true, sz: 12, color: { rgb: STATUS_COLORS.open.text } }, fill: { fgColor: { rgb: STATUS_COLORS.open.fill } }, alignment: { horizontal: 'right' } });
    setStyle(wsCover, 'B12', labelStyle); setStyle(wsCover, 'C12', { font: { bold: true, sz: 12, color: { rgb: STATUS_COLORS.in_progress.text } }, fill: { fgColor: { rgb: STATUS_COLORS.in_progress.fill } }, alignment: { horizontal: 'right' } });
    setStyle(wsCover, 'B13', labelStyle); setStyle(wsCover, 'C13', { font: { bold: true, sz: 12, color: { rgb: STATUS_COLORS.closed.text } }, fill: { fgColor: { rgb: STATUS_COLORS.closed.fill } }, alignment: { horizontal: 'right' } });

    setStyle(wsCover, 'B16', labelStyle); setStyle(wsCover, 'C16', valStyle);
    setStyle(wsCover, 'B17', labelStyle); setStyle(wsCover, 'C17', valStyle);

    // Row heights for cover
    wsCover['!rows'] = [
      { hpt: 20 }, { hpt: 40 }, { hpt: 25 }, { hpt: 20 },
      { hpt: 25 }, { hpt: 20 }, { hpt: 20 }, { hpt: 20 },
      { hpt: 25 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 22 }, { hpt: 20 },
      { hpt: 25 }, { hpt: 20 }, { hpt: 20 }
    ];

    XLSX.utils.book_append_sheet(wb, wsCover, '📋 Resumen Ejecutivo');

    // ================================================================
    // SHEET 2 — LISTADO DE INCIDENCIAS
    // ================================================================
    const headers = [
      'ID/Ref', 'Estado', 'Agencia', 'Albarán', 'Cliente', 'Tipo de incidencia',
      'Zona', 'Población', 'Tipo de envío',
      'F. Incidencia', 'F. Envío', 'F. Entrega',
      'Descripción', 'Anot.'
    ];

    const incRows = [
      ['Listado de Incidencias'], // Title
      [`Exportado el ${dateStr} a las ${timeStr} · ${filteredIncidents.length} registros encontrados`], // Subtitle
      [], // Spacing
      headers,
    ];

    filteredIncidents.forEach(i => {
      incRows.push([
        `#${i.id}`,
        statusLabel(i.status).toUpperCase(),
        i.agency_name,
        i.albaran,
        i.client_name || '',
        i.incident_type_name,
        i.zone_name,
        i.city || '',
        i.shipment_type_name !== '—' ? i.shipment_type_name : (i.shipment_type || ''),
        fmtDate(i.incident_date),
        fmtDate(i.shipment_date),
        fmtDate(i.reception_date),
        i.description || '',
        (updatesByIncident[i.id] || []).length > 0 ? (updatesByIncident[i.id] || []).length : '',
      ]);
    });

    const wsInc = XLSX.utils.aoa_to_sheet(incRows);
    wsInc['!cols'] = [
      { wch: 10 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 25 }, { wch: 25 },
      { wch: 18 }, { wch: 18 }, { wch: 20 },
      { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 50 }, { wch: 8 }
    ];

    wsInc['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } },
    ];
    wsInc['!rows'] = [{ hpt: 35 }, { hpt: 20 }, { hpt: 10 }, { hpt: 30 }];

    // Style Title & Subtitle
    setStyle(wsInc, 'A1', {
      font: { bold: true, sz: 16, color: { rgb: brand }, name: 'Arial' },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center', indent: 1 }
    });
    setStyle(wsInc, 'A2', {
      font: { italic: true, sz: 10, color: { rgb: '64748B' }, name: 'Arial' },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center', indent: 1 }
    });

    // Style Header Row (row 3)
    for (let c = 0; c < headers.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: 3, c });
      setStyle(wsInc, addr, {
        font: { bold: true, sz: 10, color: { rgb: textHeader }, name: 'Arial' },
        fill: { fgColor: { rgb: bgHeader } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderAll
      });
    }

    // Style Data Rows
    filteredIncidents.forEach((inc, idx) => {
      const r = idx + 4; 
      const isEven = idx % 2 === 0;
      const rowBg = isEven ? bgEven : bgOdd;
      const sc = STATUS_COLORS[inc.status] || STATUS_COLORS.open;

      for (let c = 0; c < headers.length; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        
        let cellStyle = {
          font: { sz: 10, name: 'Arial', color: { rgb: '1E293B' } },
          fill: { fgColor: { rgb: rowBg } },
          alignment: { vertical: 'center', horizontal: 'left', wrapText: c === 12 },
          border: borderAll
        };

        if (c === 0) { // ID
           cellStyle.font.color = { rgb: '64748B' };
           cellStyle.font.bold = true;
           cellStyle.alignment.horizontal = 'center';
        } else if (c === 1) { // Status
           cellStyle.font.color = { rgb: sc.text };
           cellStyle.font.bold = true;
           cellStyle.fill.fgColor = { rgb: sc.fill };
           cellStyle.alignment.horizontal = 'center';
        } else if (c >= 9 && c <= 11) { // Dates
           cellStyle.alignment.horizontal = 'center';
        } else if (c === 13) { // Notes count
           cellStyle.alignment.horizontal = 'center';
           cellStyle.font.bold = true;
           cellStyle.font.color = { rgb: brand };
        } else if (c === 3) { // Albaran
           cellStyle.font.bold = true;
        }

        setStyle(wsInc, addr, cellStyle);
      }
    });

    XLSX.utils.book_append_sheet(wb, wsInc, '📊 Base de Incidencias');

    // ================================================================
    // SHEET 3 — HISTORIAL DE SEGUIMIENTO (ANOTACIONES)
    // ================================================================
    const notesHeaders = ['ID Incidencia', 'Albarán', 'Agencia / Cliente', 'Estado', 'Fecha/Hora', 'Usuario', 'Detalle de la Anotación'];
    const notesRows = [
      ['Historial Detallado de Seguimiento'],
      [`Exportado el ${dateStr}`],
      [],
      notesHeaders,
    ];

    let hasNotes = false;
    let currentNoteRow = 4;
    const notesMerges = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: notesHeaders.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: notesHeaders.length - 1 } },
    ];
    const notesRowHeights = [{ hpt: 35 }, { hpt: 20 }, { hpt: 10 }, { hpt: 30 }];

    filteredIncidents.forEach(inc => {
      const updates = updatesByIncident[inc.id] || [];
      if (!updates.length) return;
      hasNotes = true;

      // Group Header for this Incident
      notesRows.push([
        `INC-${inc.id}`,
        inc.albaran,
        `${inc.agency_name} ${inc.client_name ? ' / ' + inc.client_name : ''}`,
        statusLabel(inc.status).toUpperCase(),
        '', '', ''
      ]);
      
      const headerRowIndex = currentNoteRow;
      notesMerges.push({ s: { r: headerRowIndex, c: 3 }, e: { r: headerRowIndex, c: 6 } });
      notesRowHeights.push({ hpt: 28 });
      currentNoteRow++;

      // Notes
      updates.forEach((u, ui) => {
        const textLines = u.note ? u.note.split('\n') : [''];
        textLines.forEach((line, li) => {
          notesRows.push([
             '', '', '', '',
             li === 0 ? fmtDateTime(u.created_at) : '',
             li === 0 ? (u.user_name || 'Sistema') : '',
             line
          ]);
          // Al enviar un objeto vacío, Excel calcula el alto automáticamente
          notesRowHeights.push({});
          currentNoteRow++;
        });

        // Merge User and Date cells if note has multiple lines
        if (textLines.length > 1) {
           const startR = currentNoteRow - textLines.length;
           const endR = currentNoteRow - 1;
           notesMerges.push({ s: { r: startR, c: 4 }, e: { r: endR, c: 4 } });
           notesMerges.push({ s: { r: startR, c: 5 }, e: { r: endR, c: 5 } });
        }
      });
      
      // Spacing after each incident
      notesRows.push(['', '', '', '', '', '', '']);
      notesRowHeights.push({ hpt: 10 });
      currentNoteRow++;
    });

    if (!hasNotes) {
      notesRows.push(['', '', '', '', '', '', '']);
      notesRows.push(['No hay anotaciones registradas en las incidencias seleccionadas.', '', '', '', '', '', '']);
      notesMerges.push({ s: { r: 5, c: 0 }, e: { r: 5, c: 6 } });
    }

    const wsNotes = XLSX.utils.aoa_to_sheet(notesRows);
    wsNotes['!cols'] = [
      { wch: 14 }, { wch: 16 }, { wch: 35 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 70 }
    ];
    wsNotes['!merges'] = notesMerges;
    wsNotes['!rows'] = notesRowHeights;

    // Style Title & Subtitle for Notes
    setStyle(wsNotes, 'A1', {
      font: { bold: true, sz: 16, color: { rgb: brand }, name: 'Arial' },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center', indent: 1 }
    });
    setStyle(wsNotes, 'A2', {
      font: { italic: true, sz: 10, color: { rgb: '64748B' }, name: 'Arial' },
      fill: { fgColor: { rgb: 'FFFFFF' } },
      alignment: { vertical: 'center', indent: 1 }
    });

    // Style Header Row (row 3)
    for (let c = 0; c < notesHeaders.length; c++) {
      const addr = XLSX.utils.encode_cell({ r: 3, c });
      setStyle(wsNotes, addr, {
        font: { bold: true, sz: 10, color: { rgb: textHeader }, name: 'Arial' },
        fill: { fgColor: { rgb: bgHeader } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: borderAll
      });
    }

    // Style Notes Data Rows
    if (hasNotes) {
      let r = 4;
      filteredIncidents.forEach(inc => {
        const updates = updatesByIncident[inc.id] || [];
        if (!updates.length) return;

        // Incident Header Row
        for (let c = 0; c < notesHeaders.length; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          let cellStyle = {
             font: { bold: true, sz: 11, color: { rgb: '0F172A' }, name: 'Arial' },
             fill: { fgColor: { rgb: 'E2E8F0' } }, // Slate 200
             alignment: { vertical: 'center', horizontal: 'left', indent: c === 0 ? 1 : 0 },
             border: { top: borderAll.top, bottom: borderAll.bottom }
          };
          if (c === 0) cellStyle.font.color = { rgb: brand };
          if (c === 3) {
             const sc = STATUS_COLORS[inc.status] || STATUS_COLORS.open;
             cellStyle.font.color = { rgb: sc.text };
             cellStyle.alignment.horizontal = 'center';
          }
          setStyle(wsNotes, addr, cellStyle);
        }
        r++;

        // Incident Updates Rows
        updates.forEach((u, ui) => {
           const isEvenUpdate = ui % 2 === 0;
           const updateBg = isEvenUpdate ? 'FFFFFF' : 'F8FAFC'; // Slate 50
           const textLines = u.note ? u.note.split('\n') : [''];
           
           textLines.forEach((line, li) => {
             for (let c = 0; c < notesHeaders.length; c++) {
               const addr = XLSX.utils.encode_cell({ r, c });
               let cellStyle = {
                 font: { sz: 10, name: 'Arial', color: { rgb: '334155' } },
                 fill: { fgColor: { rgb: updateBg } },
                 alignment: { vertical: li === 0 && c < 6 ? 'top' : 'center', horizontal: 'left' },
                 border: { left: borderAll.left, right: borderAll.right }
               };
               
               // bottom border only for the last line of the update
               if (li === textLines.length - 1) {
                  cellStyle.border.bottom = { style: 'dotted', color: { rgb: 'CBD5E1' } };
               }

               if (c >= 4 && c <= 5) {
                  cellStyle.alignment.horizontal = 'center';
                  cellStyle.font.color = { rgb: '64748B' };
               }
               if (c === 6) {
                  cellStyle.font.color = { rgb: '0F172A' };
                  cellStyle.alignment.wrapText = true;
               }

               setStyle(wsNotes, addr, cellStyle);
             }
             r++;
           });
        });
        r++; // Spacing
      });
    } else {
      setStyle(wsNotes, 'A6', { font: { italic: true, sz: 11, color: { rgb: '64748B' } }, alignment: { horizontal: 'center' } });
    }

    XLSX.utils.book_append_sheet(wb, wsNotes, '💬 Seguimiento');

    // ── Write file ──
    const fileName = `Incidencias_${company.replace(/\s+/g, '_')}_${now.toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast('✓ Informe Excel corporativo generado');

  } catch (e) {
    console.error('Export error:', e);
    toast('Error al exportar: ' + e.message, 'error');
  }
  hideLoad();
}
