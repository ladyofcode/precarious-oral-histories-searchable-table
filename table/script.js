function showPopup(dataOrIndex) {
  const popup = document.getElementById("popup");
  const container = document.getElementById("popupContent");

  let data;
  if (typeof dataOrIndex === 'number' && typeof window.tableData !== 'undefined') {
    data = window.tableData[dataOrIndex];
    if (!data) {
      console.error('Row data not found at index:', dataOrIndex);
      return;
    }
  } else {
    data = dataOrIndex;
  }

  const keyReplacements = {
    "Assigned Submission Number": "ID",
    "Id": "ID",
    "Focus on first nations": "Focus on First Nations",
    "Collection": "Collection name",
  };

  let tableHtml = "<h3>Full data</h3><table>";
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
      continue;
    }
    
    const displayKey = keyReplacements[key] || key;
    
    let displayValue;
    const linkFields = [
      "Collection holder website"
    ];
    
    if (linkFields.includes(key)) {
      const url = String(value || '').trim();
      const safeUrl = url.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      displayValue = `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>`;
    } else {
      displayValue = String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    tableHtml += `<tr><th>${displayKey}</th><td>${displayValue}</td></tr>`;
  }
  
  tableHtml += "</table>";
  container.innerHTML = tableHtml;
  popup.style.display = "flex";
}

function truncateText(text, maxLength = 100) {
  if (!text) return ' ';
  const str = String(text).trim();
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function applySavedColumnWidths() {
  const table = document.getElementById('dataTable');
  if (!table) return;
  
  const headerRow = table.querySelector('thead tr:first-child');
  if (!headerRow) return;
  
  const headers = Array.from(headerRow.querySelectorAll('th'));
  headers.slice(0, -1).forEach((header, index) => {
    const savedWidth = localStorage.getItem(`col-width-${index}`);
    if (savedWidth) {
      const columnIndex = index + 1;
      const allCells = table.querySelectorAll(`th:nth-child(${columnIndex}), td:nth-child(${columnIndex})`);
      allCells.forEach(cell => {
        cell.style.width = savedWidth;
        cell.style.minWidth = savedWidth;
        if (cell.style.maxWidth) {
          cell.dataset.originalMaxWidth = cell.style.maxWidth;
          cell.style.maxWidth = 'none';
        }
      });
    }
  });
}

function generateTableRows() {
  const tbody = document.querySelector('#dataTable tbody');
  if (!tbody || !window.tableData || !window.tableRowData) {
    console.error('Missing data or tbody element');
    return;
  }

  tbody.innerHTML = '';

  const indices = window.tableRowData.map((_, index) => index);
  
  indices.sort((a, b) => {
    const holderA = (window.tableRowData[a].collectionHolder || '').toLowerCase().trim();
    const holderB = (window.tableRowData[b].collectionHolder || '').toLowerCase().trim();
    return holderA.localeCompare(holderB);
  });

  indices.forEach((originalIndex) => {
    const rowData = window.tableRowData[originalIndex];
    const row = document.createElement('tr');
    row.setAttribute('onclick', `showPopup(${originalIndex})`);
    
    const cells = [
      rowData.contributor || '',
      rowData.collectionHolder || '',
      rowData.collection || ' ',
      rowData.subjects || '',
      rowData.description || '',
      rowData.id || ''
    ];

    cells.forEach((cellValue, cellIndex) => {
      const td = document.createElement('td');
      const span = document.createElement('span');
      span.className = 'cell-content';
      
      const fullText = String(cellValue || '').trim();
      const displayText = cellIndex === 3 || cellIndex === 4 
        ? truncateText(fullText, 120)
        : truncateText(fullText, 100);
      
      span.setAttribute('data-fulltext', fullText);
      span.textContent = displayText || ' ';
      
      td.appendChild(span);
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
  
  applySavedColumnWidths();
}

function initColumnResize() {
  const table = document.getElementById('dataTable');
  const headerRows = table.querySelectorAll('thead tr');
  if (!headerRows.length) return;

  const firstRow = headerRows[0];
  const headers = Array.from(firstRow.querySelectorAll('th'));
  
  headerRows.forEach(row => {
    const rowHeaders = row.querySelectorAll('th:not(:last-child)');
    rowHeaders.forEach((header, index) => {
      header.addEventListener('mouseenter', () => {
        headerRows.forEach(r => {
          const correspondingHeader = r.querySelector(`th:nth-child(${index + 1})`);
          if (correspondingHeader) {
            correspondingHeader.classList.add('column-hover');
          }
        });
      });
      
      header.addEventListener('mouseleave', () => {
        headerRows.forEach(r => {
          const correspondingHeader = r.querySelector(`th:nth-child(${index + 1})`);
          if (correspondingHeader) {
            correspondingHeader.classList.remove('column-hover');
          }
        });
      });
    });
  });
  
  headers.slice(0, -1).forEach((header, index) => {
    let isResizing = false;
    let startX = 0;
    let startWidth = 0;
    let activeHeader = null;

    const handleMouseDown = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const threshold = 10;
      
      if (rect.width - clickX > threshold) {
        return;
      }

      isResizing = true;
      startX = e.pageX;
      startWidth = e.currentTarget.offsetWidth;
      activeHeader = e.currentTarget;
      
      headerRows.forEach(r => {
        const headerCell = r.querySelector(`th:nth-child(${index + 1})`);
        if (headerCell) {
          headerCell.classList.add('resizing');
        }
      });
      
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
      e.stopPropagation();
    };

    const handleMouseMove = (e) => {
      if (!isResizing || !activeHeader) return;
      
      const diff = e.pageX - startX;
      const newWidth = Math.max(50, startWidth + diff);
      
      const columnIndex = index + 1;
      const allCells = table.querySelectorAll(`th:nth-child(${columnIndex}), td:nth-child(${columnIndex})`);
      
      allCells.forEach(cell => {
        cell.style.width = newWidth + 'px';
        cell.style.minWidth = newWidth + 'px';
        if (cell.style.maxWidth) {
          cell.dataset.originalMaxWidth = cell.style.maxWidth;
          cell.style.maxWidth = 'none';
        }
      });
    };

    const handleMouseUp = () => {
      if (isResizing) {
        isResizing = false;
        
        headerRows.forEach(r => {
          const headerCell = r.querySelector(`th:nth-child(${index + 1})`);
          if (headerCell) {
            headerCell.classList.remove('resizing');
          }
        });
        
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        const firstRowHeader = firstRow.querySelector(`th:nth-child(${index + 1})`);
        if (firstRowHeader) {
          localStorage.setItem(`col-width-${index}`, firstRowHeader.style.width);
        }
        activeHeader = null;
      }
    };

    headerRows.forEach(row => {
      const headerCell = row.querySelector(`th:nth-child(${index + 1})`);
      if (headerCell) {
        headerCell.addEventListener('mousedown', handleMouseDown);
      }
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });
  
  applySavedColumnWidths();
}

document.addEventListener("DOMContentLoaded", function() {
  generateTableRows();
  
  document.getElementById("popup").style.display = "none";
  
  initColumnResize();
  
  document.getElementById('acceptButton').addEventListener('click', function() {
    document.getElementById('termsModal').style.display = 'none';
  });
  
  document.getElementById("searchInput").addEventListener("keyup", function() {
    const filter = this.value.toLowerCase();
    const rows = document.querySelectorAll("#dataTable tbody tr");

    rows.forEach(row => {
      let match = false;
      row.querySelectorAll("td .cell-content").forEach(span => {
        const fullText = span.getAttribute("data-fulltext") || span.textContent;
        if (fullText.toLowerCase().includes(filter)) {
          match = true;
        }
      });
      row.classList.toggle("hide", !match);
    });
  });

  document.querySelectorAll(".col-filter").forEach(input => {
    input.addEventListener("keyup", function() {
      const filters = Array.from(document.querySelectorAll(".col-filter")).map(input => {
        return {
          colIndex: parseInt(input.dataset.col),
          value: input.value.trim().toLowerCase()
        };
      });

      const rows = document.querySelectorAll("#dataTable tbody tr");

      rows.forEach(row => {
        let match = true;

        filters.forEach(filterObj => {
          const { colIndex, value } = filterObj;
          if (value) {
            const cell = row.cells[colIndex];
            const span = cell?.querySelector(".cell-content");
            const fullText = span ? (span.getAttribute("data-fulltext") || span.textContent) : "";
            if (!fullText.toLowerCase().includes(value)) {
              match = false;
            }
          }
        });

        row.classList.toggle("hide", !match);
      });
    });
  });

  document.querySelectorAll(".tag-filter").forEach(tag => {
    tag.addEventListener("click", function() {
      const selectedTag = this.dataset.tag.toLowerCase();
      const rows = document.querySelectorAll("#dataTable tbody tr");

      document.querySelectorAll(".tag-filter").forEach(t => t.classList.remove("active"));
      
      this.classList.add("active");

      rows.forEach(row => {
        const cell = row.cells[3];
        const span = cell?.querySelector(".cell-content");
        const fullText = span ? (span.getAttribute("data-fulltext") || span.textContent) : "";
        const match = fullText.toLowerCase().includes(selectedTag);
        row.classList.toggle("hide", !match);
      });
    });
  });

  document.getElementById("clearTagFilter").addEventListener("click", function() {
    document.querySelectorAll(".tag-filter").forEach(t => t.classList.remove("active"));
    
    const rows = document.querySelectorAll("#dataTable tbody tr");
    rows.forEach(row => {
      row.classList.remove("hide");
    });
  });
});

