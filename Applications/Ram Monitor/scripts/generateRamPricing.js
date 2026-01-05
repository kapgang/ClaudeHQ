const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

// Color constants
const COLORS = {
  headerBg: 'FF1F4E78',      // Dark blue
  headerText: 'FFFFFFFF',    // White
  ddr4Bg: 'FFD9E1F2',        // Light blue
  ddr5Bg: 'FFE2EFDA',        // Light green
  altRowBg: 'FFF2F2F2',      // Light gray
  whiteBg: 'FFFFFFFF',       // White
  borderGray: 'FFD3D3D3'     // Border gray
};

/**
 * Load product data from JSON file
 */
function loadProductData() {
  try {
    const dataPath = path.join(__dirname, '..', 'data', 'ram-products-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading product data:', error.message);
    throw error;
  }
}

/**
 * Create and configure the workbook
 */
function createWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'RAM Monitor - Claude HQ';
  workbook.created = new Date();
  return workbook;
}

/**
 * Setup worksheet with column definitions
 */
function setupWorksheet(workbook) {
  const currentDate = new Date().toISOString().split('T')[0];
  const worksheet = workbook.addWorksheet(`RAM Pricing Database - ${currentDate}`);

  // Define columns
  worksheet.columns = [
    { key: 'productName', width: 45 },
    { key: 'brand', width: 12 },
    { key: 'type', width: 8 },
    { key: 'capacity', width: 18 },
    { key: 'speed', width: 12 },
    { key: 'casLatency', width: 12 },
    { key: 'amazonPrice', width: 12 },
    { key: 'amazonLink', width: 12 },
    { key: 'neweggPrice', width: 12 },
    { key: 'neweggLink', width: 12 },
    { key: 'bestbuyPrice', width: 12 },
    { key: 'bestbuyLink', width: 12 },
    { key: 'ebayNew', width: 12 },
    { key: 'ebayUsed', width: 12 },
    { key: 'ebayLink', width: 12 },
    { key: 'notes', width: 35 },
    { key: 'lastUpdated', width: 20 }
  ];

  return worksheet;
}

/**
 * Format and add header row
 */
function formatHeaders(worksheet) {
  const headerRow = worksheet.addRow([
    'Product Name',
    'Brand',
    'Type',
    'Capacity',
    'Speed (MHz)',
    'CAS Latency',
    'Amazon Price',
    'Amazon Link',
    'Newegg Price',
    'Newegg Link',
    'Best Buy Price',
    'Best Buy Link',
    'eBay New (Avg)',
    'eBay Used (Avg)',
    'eBay Link',
    'Notes/Stock',
    'Last Updated'
  ]);

  // Style header row
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg }
    };
    cell.font = {
      color: { argb: COLORS.headerText },
      bold: true,
      size: 12
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true
    };
    cell.border = {
      top: { style: 'medium' },
      left: { style: 'medium' },
      bottom: { style: 'medium' },
      right: { style: 'medium' }
    };
  });

  // Freeze header row
  worksheet.views = [
    { state: 'frozen', ySplit: 1 }
  ];

  // Enable auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'Q1'
  };
}

/**
 * Add product rows with formatting
 */
function populateProducts(worksheet, productData) {
  productData.products.forEach((product, index) => {
    const rowData = {
      productName: product.name,
      brand: product.brand,
      type: product.type,
      capacity: product.capacity,
      speed: product.speedMHz,
      casLatency: product.casLatency,
      amazonPrice: product.pricing.amazon.price,
      amazonLink: 'View',
      neweggPrice: product.pricing.newegg.price,
      neweggLink: 'View',
      bestbuyPrice: product.pricing.bestbuy.price,
      bestbuyLink: product.pricing.bestbuy.url ? 'View' : 'N/A',
      ebayNew: product.pricing.ebay.newAvg,
      ebayUsed: product.pricing.ebay.usedAvg,
      ebayLink: 'Search',
      notes: product.notes,
      lastUpdated: new Date(productData.lastUpdated)
    };

    const row = worksheet.addRow(rowData);

    // Alternating row colors
    const isEvenRow = index % 2 === 0;
    const rowBgColor = isEvenRow ? COLORS.whiteBg : COLORS.altRowBg;

    // Apply formatting to each cell
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Base styling
      cell.font = { size: 11 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 16 ? 'left' : 'center'
      };
      cell.border = {
        top: { style: 'thin', color: { argb: COLORS.borderGray } },
        left: { style: 'thin', color: { argb: COLORS.borderGray } },
        bottom: { style: 'thin', color: { argb: COLORS.borderGray } },
        right: { style: 'thin', color: { argb: COLORS.borderGray } }
      };

      // Type column color coding (column 3)
      if (colNumber === 3) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: product.type === 'DDR4' ? COLORS.ddr4Bg : COLORS.ddr5Bg }
        };
        cell.font = { bold: true, size: 11 };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBgColor }
        };
      }

      // Currency formatting for price columns (7, 9, 11, 13, 14)
      if ([7, 9, 11, 13, 14].includes(colNumber)) {
        if (cell.value !== null) {
          cell.numFmt = '$#,##0.00';
        } else {
          cell.value = 'N/A';
          cell.numFmt = '@'; // Text format
        }
      }

      // Date formatting for last updated column (17)
      if (colNumber === 17) {
        cell.numFmt = 'yyyy-mm-dd hh:mm';
      }

      // Text wrap for notes column (16)
      if (colNumber === 16) {
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          wrapText: true
        };
      }
    });

    // Add hyperlinks
    // Amazon link (column 8)
    if (product.pricing.amazon.url) {
      const amazonCell = row.getCell(8);
      amazonCell.value = {
        text: 'View',
        hyperlink: product.pricing.amazon.url
      };
      amazonCell.font = { color: { argb: 'FF0000FF' }, underline: true };
    }

    // Newegg link (column 10)
    if (product.pricing.newegg.url) {
      const neweggCell = row.getCell(10);
      neweggCell.value = {
        text: 'View',
        hyperlink: product.pricing.newegg.url
      };
      neweggCell.font = { color: { argb: 'FF0000FF' }, underline: true };
    }

    // Best Buy link (column 12)
    if (product.pricing.bestbuy.url) {
      const bestbuyCell = row.getCell(12);
      bestbuyCell.value = {
        text: 'View',
        hyperlink: product.pricing.bestbuy.url
      };
      bestbuyCell.font = { color: { argb: 'FF0000FF' }, underline: true };
    }

    // eBay link (column 15)
    if (product.pricing.ebay.searchUrl) {
      const ebayCell = row.getCell(15);
      ebayCell.value = {
        text: 'Search',
        hyperlink: product.pricing.ebay.searchUrl
      };
      ebayCell.font = { color: { argb: 'FF0000FF' }, underline: true };
    }
  });

  console.log(`✓ Added ${productData.products.length} products to worksheet`);
}

/**
 * Save workbook to file
 */
async function saveWorkbook(workbook) {
  try {
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate timestamped filename
    const timestamp = new Date().toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');
    const filename = `RAM_Pricing_Database_${timestamp}.xlsx`;
    const filePath = path.join(outputDir, filename);

    // Save primary file
    await workbook.xlsx.writeFile(filePath);
    console.log(`✓ Primary file saved: ${filePath}`);

    // Save desktop copy
    const desktopPath = path.join(
      process.env.USERPROFILE || process.env.HOME,
      'OneDrive',
      'Desktop',
      'RAM_Pricing_Latest.xlsx'
    );

    try {
      await workbook.xlsx.writeFile(desktopPath);
      console.log(`✓ Desktop copy saved: ${desktopPath}`);
    } catch (error) {
      console.warn(`⚠ Could not save desktop copy: ${error.message}`);
      console.log('  (This is normal if OneDrive is not configured)');
    }

    return filePath;
  } catch (error) {
    console.error('Error saving workbook:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║   RAM Pricing Database Generator                  ║');
  console.log('║   Claude HQ - Ram Monitor                         ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  try {
    // Load data
    console.log('📂 Loading product data...');
    const productData = loadProductData();
    console.log(`✓ Loaded ${productData.products.length} products\n`);

    // Create workbook
    console.log('📊 Creating Excel workbook...');
    const workbook = createWorkbook();
    const worksheet = setupWorksheet(workbook);
    console.log('✓ Workbook created\n');

    // Add content
    console.log('✍️  Adding headers and data...');
    formatHeaders(worksheet);
    populateProducts(worksheet, productData);
    console.log('✓ Data populated\n');

    // Save file
    console.log('💾 Saving Excel file...');
    const filePath = await saveWorkbook(workbook);
    console.log('\n');

    // Success message
    console.log('╔════════════════════════════════════════════════════╗');
    console.log('║   ✅  GENERATION COMPLETE                         ║');
    console.log('╚════════════════════════════════════════════════════╝');
    console.log(`\n📁 File location: ${filePath}\n`);
    console.log('📊 Summary:');
    console.log(`   - Total products: ${productData.products.length}`);
    console.log(`   - DDR4 products: ${productData.products.filter(p => p.type === 'DDR4').length}`);
    console.log(`   - DDR5 products: ${productData.products.filter(p => p.type === 'DDR5').length}`);
    console.log(`   - Last updated: ${new Date(productData.lastUpdated).toLocaleString()}\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
main();
