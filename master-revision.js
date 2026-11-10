/* Master data revision for ABC ERP: a data map based on the SAP S/4HANA master data structure,
   plus tabs with the record tables. Load AFTER master-data.js in index.html:
   <script src="master-revision.js"></script> */
(function () {
  const css = document.createElement('style');
  css.textContent = `
  .md-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:0 0 18px;overflow-x:auto}
  .md-tab{display:flex;align-items:center;gap:8px;border:0;background:none;padding:11px 14px;margin-bottom:-1px;font:600 12px Manrope,sans-serif;color:#52636a;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent}
  .md-tab:hover{color:var(--ink)}
  .md-tab:focus-visible,.md-row:focus-visible{outline:2px solid var(--green);outline-offset:-2px;border-radius:4px}
  .md-tab[aria-selected="true"]{color:var(--green);border-bottom-color:var(--green)}
  .md-tab i{font-style:normal;font-size:10px;font-weight:600;padding:1px 7px;border-radius:999px;background:#eef2f3;color:#6e7d84}
  .md-tab[aria-selected="true"] i{background:var(--green-pale);color:var(--green-dark)}
  .md-tabbed .welcome-row .eyebrow{display:none}
  .md-tabbed .welcome-row .actions .btn:not(.btn-primary){display:none}
  .md-tabbed .md-list-table th,.md-tabbed .md-list-table td{font-size:12px}
  .md-legend{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:12px;color:#52636a;margin:0 0 16px}
  .md-map{display:grid;grid-template-columns:repeat(auto-fit,minmax(330px,1fr));gap:16px;align-items:start}
  .md-area{padding:18px 18px 8px}
  .md-area h2{font:700 14px Manrope,sans-serif;margin:0}
  .md-area .md-sub{font-size:11px;color:#6e7d84;margin:4px 0 10px}
  .md-row{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:10px 0;border:0;border-top:1px solid var(--line);background:none;text-align:left;font:inherit;color:inherit}
  button.md-row{cursor:pointer}
  button.md-row:hover b{color:var(--green)}
  .md-row b{display:block;font-size:12px;font-weight:600}
  .md-row small{display:block;font-size:11px;color:#6e7d84;margin-top:2px}
  .md-st{flex:none;font-size:10px;font-weight:600;padding:2px 9px;border-radius:999px;border:1px solid #d5dee0;color:#52636a;background:#fff}
  .md-st[data-s="built"]{background:var(--green);border-color:var(--green);color:#fff}
  .md-st[data-s="partial"]{background:#e5f4f5;border-color:#a9d6da;color:#066a75}
  .md-st[data-s="later"]{color:#8a979c;border-style:dashed}`;
  document.head.appendChild(css);

  const LABEL = { built: 'Built', partial: 'Partly', planned: 'Planned', later: 'Later' };
  const TABS = ['materials', 'boms', 'assembly', 'customers', 'suppliers', 'warehouses', 'accounts'];
  /* [object, status, what exists today, where it links] */
  const AREAS = [
    ['Product', 'What the company buys, makes and sells', [
      ['General data and descriptions', 'built', 'Material code, name, type, supply route, level, group', 'materials'],
      ['Units of measure', 'partial', 'One unit per material, no conversions', 'materials'],
      ['Product hierarchy', 'built', 'Division, category, sub-category', 'products'],
      ['Purchasing data', 'built', 'Preferred supplier, lead time, PO class', 'purchasing'],
      ['Sales data', 'partial', 'List price and revenue account', 'sales'],
      ['Logistics and warehouse data', 'partial', 'Default warehouse; stock is not yet kept per warehouse', 'inventory'],
      ['Valuation and costing', 'partial', 'Standard cost and stock accounts', 'inventory'],
      ['Barcodes (EAN, UPC, GTIN)', 'planned', '', ''],
      ['Bill of materials', 'built', 'Components, quantities and scrap for semi-finished goods', 'boms'],
      ['Assembly sheets', 'built', 'Components and assembly steps for finished goods', 'assembly'],
      ['Batch, serial and quality data', 'planned', '', '']]],
    ['Site', 'Where stock is kept and goods move', [
      ['Warehouses and sites', 'built', 'Code, name, site, country, status', 'warehouses'],
      ['Organization structure', 'planned', 'Company, plant, storage locations', ''],
      ['Valuation and inventory settings', 'planned', 'Per site', ''],
      ['Supplying sites and distribution', 'planned', '', '']]],
    ['Business partner', 'Customers and suppliers', [
      ['Central data', 'partial', 'Name, address, currency', 'customers'],
      ['Supplier data', 'built', 'Type, sourcing route, level, payment terms, credit limit, payable account', 'suppliers'],
      ['Customer data', 'built', 'Type, channel, level, payment terms, credit limit, accounts', 'customers'],
      ['One partner with several roles', 'planned', 'Customers and suppliers are separate lists today', ''],
      ['Bank details and tax numbers', 'planned', 'Tax ID is in the database, not on screen', ''],
      ['Partner relationships and functions', 'planned', '', ''],
      ['Company, purchasing and sales organizations', 'planned', '', '']]],
    ['Financials', 'Accounts that every transaction posts to', [
      ['Chart of accounts', 'built', 'GL accounts and types', 'accounts'],
      ['Account groups and statement versions', 'planned', '', ''],
      ['Cost centers and hierarchies', 'partial', 'A reference on PO lines, no master record', 'purchasing'],
      ['Profit centers', 'planned', '', ''],
      ['Banks and house banks', 'planned', '', ''],
      ['Fixed assets', 'partial', 'Asset assignment posts to the fixed asset account', 'finance'],
      ['Projects', 'partial', 'Project assignment and monthly budgets', 'purchasing'],
      ['Consolidation', 'later', '', '']]],
    ['Enterprise assets', 'Equipment and maintenance', [
      ['Equipment', 'later', '', ''],
      ['Functional locations', 'later', '', ''],
      ['Maintenance bill of materials', 'later', '', '']]]
  ];
  window.mdOpen = t => (TABS.includes(t) ? masterSetView(t) : go(t));

  function mapHtml() {
    const all = AREAS.flatMap(a => a[2]);
    const n = s => all.filter(x => x[1] === s).length;
    const legend = '<div class="md-legend"><span><b>' + n('built') + '</b> built</span><span><b>' + n('partial') +
      '</b> partly built</span><span><b>' + n('planned') + '</b> planned</span><span><b>' + n('later') +
      '</b> later</span><span>Click an item to open the records or the work area it links to.</span></div>';
    return legend + '<div class="md-map">' + AREAS.map(a =>
      '<section class="panel md-area"><h2>' + a[0] + '</h2><div class="md-sub">' + a[1] + '</div>' +
      a[2].map(x => {
        const inner = '<span><b>' + x[0] + '</b>' + (x[2] ? '<small>' + x[2] + '</small>' : '') + '</span><span class="md-st" data-s="' + x[1] + '">' + LABEL[x[1]] + '</span>';
        return x[3] ? '<button class="md-row" onclick="mdOpen(\'' + x[3] + '\')">' + inner + '</button>' : '<div class="md-row">' + inner + '</div>';
      }).join('') + '</section>').join('') + '</div>';
  }

  window.mastersPage = function () {
    const tabs = [['map', 'Data map', ''],
      ['materials', 'Materials & products', db.products.length], ['boms', 'BOM', (db.boms || []).length], ['assembly', 'Assembly sheets', (db.assemblies || []).length], ['customers', 'Customers', db.customerProfiles.length],
      ['suppliers', 'Suppliers', db.supplierProfiles.length], ['warehouses', 'Warehouses', db.warehouses.length],
      ['accounts', 'Chart of accounts', db.chartAccounts.length]];
    if (!tabs.some(t => t[0] === masterView)) masterView = 'map';
    const bar = '<div class="md-tabs" role="tablist">' + tabs.map(t =>
      '<button class="md-tab" role="tab" aria-selected="' + (t[0] === masterView) + '" onclick="masterSetView(\'' + t[0] + '\')">' +
      t[1] + (t[2] === '' ? '' : '<i>' + t[2] + '</i>') + '</button>').join('') + '</div>';
    if (masterView === 'map') {
      return '<div class="md-tabbed">' + heading('Master data', 'The shared records behind every work area, organized like the SAP S/4HANA master data structure', '') + bar + mapHtml() + '</div>';
    }
    if (window.MD_EXT && window.MD_EXT[masterView]) return '<div class="md-tabbed">' + heading('Master data', 'The shared records behind every work area, organized like the SAP S/4HANA master data structure', '') + bar + window.MD_EXT[masterView]() + '</div>';
    const html = masterListPage(masterView);
    const cut = html.indexOf('<div class="page-tools">');
    const head = html.slice(0, cut).replace(/<h1 class="page-title">[^<]*<\/h1>/, '<h1 class="page-title">Master data</h1>');
    return '<div class="md-tabbed">' + head + bar + html.slice(cut) + '</div>';
  };
})();
