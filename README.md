# Precarious Oral Histories searchable table

## Folder structure

### `table/` folder (upload everything to web server)
- **searchable_table.html** - Main table page
- **data.js** - Generated data file
- **script.js** - JavaScript functionality
- **styles.css** - Styling

When regenerating from a new dataset, only data.js gets replaced. All the other files in the folder on your server stay put and don't change.

### `generator/` folder (local tool)
- **generator.html** - Open in browser to generate data.js
- **generator.js** - Generator script
- **generator.css** - Generator styling

## Updating future row changes

I created a script to generate a new data file from a CSV.

1. Export file as CSV from your spreadsheet software.
2. Download the zipped folder from GitHub.
3. Inside the generator subfolder, double-click generator.html to open it in the browser.
4. Upload the CSV.
5. Save the data.js file produced.
6. Replace the data.js in the shared hosting with the newly generated one. It must be named data.js.
