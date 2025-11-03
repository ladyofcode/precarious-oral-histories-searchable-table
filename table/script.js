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
  };

  let tableHtml = "<h3>Full data</h3><table>";
  
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
      continue;
    }
    
    const displayKey = keyReplacements[key] || key;
    
    const safeValue = String(value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    tableHtml += `<tr><th>${displayKey}</th><td>${safeValue}</td></tr>`;
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

function generateTableRows() {
  const tbody = document.querySelector('#dataTable tbody');
  if (!tbody || !window.tableData || !window.tableRowData) {
    console.error('Missing data or tbody element');
    return;
  }

  tbody.innerHTML = '';

  window.tableRowData.forEach((rowData, index) => {
    const row = document.createElement('tr');
    row.setAttribute('onclick', `showPopup(${index})`);
    
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
        ? truncateText(fullText, 80)
        : truncateText(fullText, 100);
      
      span.setAttribute('data-fulltext', fullText);
      span.textContent = displayText || ' ';
      
      td.appendChild(span);
      row.appendChild(td);
    });

    tbody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", function() {
  generateTableRows();
  
  document.getElementById("popup").style.display = "none";
  
  document.getElementById('acceptBtn').addEventListener('click', function() {
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

