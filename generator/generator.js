let csvData = null;
let parsedData = null;

function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentField += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentField.trim());
            currentField = '';
        } else if (char === '\n' && !inQuotes) {
            currentRow.push(currentField.trim());
            rows.push(currentRow);
            currentRow = [];
            currentField = '';
        } else if (char === '\r') {
        } else {
            currentField += char;
        }
    }

    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
    }

    return rows;
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML.replace(/'/g, '&#39;');
}

function escapeJsString(str) {
    if (!str) return '';
    return String(str)
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

function truncateText(text, maxLength = 100) {
    if (!text) return ' ';
    const str = String(text).trim();
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

function normalizeFieldName(fieldName) {
    if (!fieldName) return fieldName;
    
    const trimmed = fieldName.trim();
    
    if (trimmed === 'Collection Name') {
        return 'Collection';
    }
    
    const words = trimmed.split(/\s+/);
    if (words.length === 0) return fieldName;
    
    let normalized = words[0].charAt(0).toUpperCase() + words[0].slice(1).toLowerCase();
    
    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        normalized += ' ' + word.toLowerCase();
    }
    
    return normalized;
}

function normalizeUntitled(value) {
    if (!value) return '';
    const trimmed = String(value).trim();
    if (trimmed.toLowerCase() === 'untitled') {
        return '';
    }
    return value;
}

document.getElementById('csvFile').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            csvData = event.target.result;
            parsedData = parseCSV(csvData);

            if (parsedData.length < 7) {
                throw new Error('CSV file must have at least 7 rows (including header rows)');
            }

            document.getElementById('status').innerHTML =
                '<div class="status success">✓ CSV file loaded successfully! Found ' +
                (parsedData.length - 6) + ' data rows.</div>';
            document.getElementById('generateButton').disabled = false;
        } catch (error) {
            document.getElementById('status').innerHTML =
                '<div class="status error">Error: ' + escapeHtml(error.message) + '</div>';
            document.getElementById('generateButton').disabled = true;
        }
    };

    reader.onerror = function () {
        document.getElementById('status').innerHTML =
            '<div class="status error">Error reading file</div>';
        document.getElementById('generateButton').disabled = true;
    };

    reader.readAsText(file);
});

document.getElementById('generateButton').addEventListener('click', async function () {
    const originalButton = this;
    const originalText = originalButton.textContent;
    
    if (!parsedData || parsedData.length < 7) {
        alert('Please upload a CSV file first');
        return;
    }

    try {
        originalButton.disabled = true;
        originalButton.textContent = 'Generating...';
        const includeFlags = parsedData[2];
        const csvHeaders = parsedData[1];
        const displayNames = parsedData[3];
        const columnPositions = parsedData[4];
        const homepageColumns = {
            1: null, 2: null, 3: null, 4: null, 5: null, 6: null
        };

        columnPositions.forEach((pos, idx) => {
            const posNum = parseInt(pos);
            if (!isNaN(posNum) && posNum >= 1 && posNum <= 6) {
                homepageColumns[posNum] = idx;
            }
        });

        const dataRows = parsedData.slice(6);
        const tableData = [];
        const tableRowData = [];

        dataRows.forEach((row) => {
            if (row.length === 0 || row.every(cell => !cell || cell.trim() === '')) {
                return;
            }

            const popupData = {};
            csvHeaders.forEach((csvHeader, colIdx) => {
                if (includeFlags[colIdx] && includeFlags[colIdx].trim().toLowerCase() === 'included') {
                    const value = row[colIdx] || '';
                    let fieldName;
                    
                    if (displayNames[colIdx] && displayNames[colIdx].trim()) {
                        fieldName = displayNames[colIdx].trim();
                    } else if (csvHeader && csvHeader.trim()) {
                        fieldName = csvHeader.trim().replace(/^\d+\s*-\s*/, '').trim();
                    }
                    
                    if (fieldName) {
                        const normalizedName = normalizeFieldName(fieldName);
                        popupData[normalizedName] = value;
                    }
                }
            });
            tableData.push(popupData);

            const contributor = row[homepageColumns[1]] || '';
            const collectionHolder = row[homepageColumns[2]] || '';
            let collection = row[homepageColumns[3]] || '';
            const subjects = row[homepageColumns[4]] || '';
            const description = row[homepageColumns[5]] || '';
            const id = row[homepageColumns[6]] || '';

            collection = normalizeUntitled(collection);
            tableRowData.push({
                id: id,
                contributor: contributor,
                collectionHolder: collectionHolder,
                collection: collection,
                subjects: subjects,
                description: description
            });
        });

        const dataJsContent = [
            'window.tableData = ' + JSON.stringify(tableData, null, 2) + ';',
            '',
            'window.tableRowData = ' + JSON.stringify(tableRowData, null, 2) + ';'
        ].join('\n');
        const blob = new Blob([dataJsContent], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        document.getElementById('downloadStatus').innerHTML =
            '<div class="status success">✓ data.js file generated and downloaded successfully!<br>' +
            'Found ' + tableData.length + ' data rows.<br>' +
            'Replace the existing data.js file in the table/ directory with this file.</div>';
        
        originalButton.textContent = originalText;
        originalButton.disabled = false;

    } catch (error) {
        document.getElementById('downloadStatus').innerHTML =
            '<div class="status error">Error: ' + escapeHtml(error.message) + '</div>';
        console.error(error);
        originalButton.textContent = originalText;
        originalButton.disabled = false;
    }
});

