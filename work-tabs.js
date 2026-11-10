/* Transactions | Reports tabs for Sales, Purchasing, Inventory and Finance, plus report links on the dashboard.
   Load AFTER blueprint.js: <script src="work-tabs.js"></script> */
(function () {
  const css = document.createElement('style');
  css.textContent = `
  .wk-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:0 0 18px}
  .wk-tab{border:0;background:none;padding:11px 16px;margin-bottom:-1px;font:600 12px Manrope,sans-serif;color:#52636a;cursor:pointer;border-bottom:2px solid transparent}
  .wk-tab:hover{color:var(--ink)}.wk-tab[aria-selected="true"]{color:var(--green);border-bottom-color:var(--green)}
  .wk-tab:focus-visible,.wk-chip:focus-visible,.wk-link:focus-visible{outline:2px solid var(--green);outline-offset:-2px;border-radius:4px}
  .wk-rep-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:14px}.wk-spacer{flex:1}
  .wk-chip{border:1px solid #cfd9dc;background:#fff;border-radius:999px;padding:6px 13px;font:600 11px Manrope,sans-serif;color:#52636a;cursor:pointer}
  .wk-chip[aria-pressed="true"]{background:var(--green);border-color:var(--green);color:#fff}
  .wk-rep td,.wk-rep th{font-size:12px}.wk-rep .wk-num{text-align:right;font-variant-numeric:tabular-nums}.wk-rep tfoot td{font-weight:700;background:#fafcfc}
  .wk-h2{font:700 15px Manrope,sans-serif;margin:26px 0 12px}
  .wk-dash-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
  .wk-dash{padding:16px 18px 8px}.wk-dash h3{font:700 13px Manrope,sans-serif;margin:0 0 6px}
  .wk-link{display:flex;justify-content:space-between;gap:10px;width:100%;border:0;border-top:1px solid var(--line);background:none;padding:10px 0;font:inherit;font-size:12px;color:inherit;text-align:left;cursor:pointer}
  .wk-link:hover span{color:var(--green)}.wk-link b{font-weight:700;white-space:nowrap}
  @media print{.sidebar,.topbar,.wk-tabs,.wk-rep-bar,.toast{display:none!important}.main-area{margin-left:0!important}}`;
  document.head.appendChild(css);

  const num = v => Number(v) || 0, sum = (a, f) => a.reduce((s, x) => s + num(f(x)), 0);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pn = id => { const p = product(id); return p ? p.name : id; };
  const group = (rows, key, f) => { const m = {}; rows.forEach(r => (m[key(r)] = m[key(r)] || []).push(r)); return Object.entries(m).map(([k, v]) => f(k, v)); };
  const lines = o => (o.lines && o.lines.length ? o.lines : [{ product: o.product, qty: o.qty, unitCost: o.unitCost, pricePer: 1 }]);
  const poAmt = o => sum(lines(o), l => num(l.qty) * num(l.unitCost) / (num(l.pricePer) || 1)) * (num(o.exchangeRate) || 1);
  const TITLE = { sales: 'Sales', purchasing: 'Purchasing', inventory: 'Inventory', finance: 'Finance' };
  const REPORTS = {
    sales: [
      { id: 'transactions', name: 'Sales transactions', cols: ['Order', 'Date', 'Customer', 'Product', 'Qty', 'Unit price', 'Amount', 'Status'], money: [5, 6], total: [4, 6], rows: () => db.sales.map(s => [s.id, s.date, s.customer, pn(s.product), s.qty, s.unitPrice, s.qty * s.unitPrice, s.status]) },
      { id: 'customer', name: 'Sales by customer', cols: ['Customer', 'Orders', 'Qty', 'Revenue'], money: [3], total: [1, 2, 3], rows: () => group(db.sales, s => s.customer, (k, v) => [k, v.length, sum(v, s => s.qty), sum(v, s => s.qty * s.unitPrice)]) },
      { id: 'product', name: 'Sales by product', cols: ['Product', 'Orders', 'Qty', 'Revenue'], money: [3], total: [1, 2, 3], rows: () => group(db.sales, s => s.product, (k, v) => [pn(k), v.length, sum(v, s => s.qty), sum(v, s => s.qty * s.unitPrice)]) }],
    purchasing: [
      { id: 'orders', name: 'Purchase orders', cols: ['PO', 'Date', 'Vendor', 'Lines', 'Amount (USD)', 'Status'], money: [4], total: [3, 4], rows: () => db.purchases.map(o => [o.id, o.date, o.vendor, lines(o).length, poAmt(o), o.status]) },
      { id: 'vendor', name: 'Purchases by vendor', cols: ['Vendor', 'Orders', 'Amount (USD)'], money: [2], total: [1, 2], rows: () => group(db.purchases, o => o.vendor, (k, v) => [k, v.length, sum(v, poAmt)]) },
      { id: 'open', count: true, name: 'Open deliveries', cols: ['PO', 'Vendor', 'Product', 'Ordered', 'Received', 'Outstanding', 'Delivery date'], total: [3, 4, 5], rows: () => db.purchases.flatMap(o => lines(o).map(l => [o.id, o.vendor, pn(l.product), num(l.qty), num(l.receivedQty), num(l.qty) - num(l.receivedQty), l.deliveryDate || '-'])).filter(r => r[5] > 0) }],
    inventory: [
      { id: 'stock', name: 'Stock on hand and value', cols: ['Material', 'Name', 'Unit', 'On hand', 'Unit cost', 'Value', 'Reorder point', 'Status'], money: [4, 5], total: [5], rows: () => db.products.map(p => [p.id, p.name, p.uom, p.onHand, p.cost, p.onHand * p.cost, p.reorder, p.onHand <= p.reorder ? 'Reorder' : 'OK']) },
      { id: 'reorder', count: true, name: 'Items to reorder', cols: ['Material', 'Name', 'On hand', 'Reorder point', 'Shortfall'], total: [4], rows: () => db.products.filter(p => p.onHand <= p.reorder).map(p => [p.id, p.name, p.onHand, p.reorder, p.reorder - p.onHand]) }],
    finance: [
      { id: 'journal', count: true, name: 'Journal entries', cols: ['Entry', 'Date', 'Reference', 'Account', 'Debit', 'Credit', 'Memo'], money: [4, 5], total: [4, 5], rows: () => db.ledger.map(l => [l.id, l.date, l.reference, l.account, l.debit, l.credit, l.memo]) },
      { id: 'trial', name: 'Trial balance', cols: ['Account', 'Debit', 'Credit', 'Balance'], money: [1, 2, 3], total: [1, 2, 3], rows: () => group(db.ledger, l => l.account, (k, v) => { const d = sum(v, l => l.debit), c = sum(v, l => l.credit); return [k, d, c, d - c]; }) }]
  };
  window.WK_REPORTS = REPORTS;
  const wtab = {}, rep = {};
  const cur = a => REPORTS[a].find(r => r.id === rep[a]) || REPORTS[a][0];
  const fmt = (r, i, v) => (r.money && r.money.includes(i) ? money(num(v)) : v);
  const tabs = a => '<div class="wk-tabs" role="tablist">' + [['transactions', 'Transactions'], ['reports', 'Reports']].map(t =>
    '<button class="wk-tab" role="tab" aria-selected="' + ((wtab[a] || 'transactions') === t[0]) + '" onclick="wkTab(\'' + a + '\',\'' + t[0] + '\')">' + t[1] + '</button>').join('') + '</div>';
  function reportView(a) {
    const r = cur(a), rows = r.rows();
    const foot = r.total ? '<tfoot><tr>' + r.cols.map((c, i) => '<td class="' + (i ? 'wk-num' : '') + '">' + (i === 0 ? 'Total' : r.total.includes(i) ? fmt(r, i, sum(rows, x => x[i])) : '') + '</td>').join('') + '</tr></tfoot>' : '';
    return '<div class="wk-rep-bar">' + REPORTS[a].map(x => '<button class="wk-chip" aria-pressed="' + (x.id === r.id) + '" onclick="wkReport(\'' + a + '\',\'' + x.id + '\')">' + x.name + '</button>').join('') +
      '<span class="wk-spacer"></span><button class="btn" onclick="wkCsv(\'' + a + '\')">Download CSV</button><button class="btn" onclick="window.print()">Print</button></div>' +
      '<div class="panel table-panel wk-rep" style="overflow:auto"><table><thead><tr>' + r.cols.map((c, i) => '<th class="' + (i && r.rows().length && typeof rows[0]?.[i] === 'number' ? 'wk-num' : '') + '">' + c + '</th>').join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(x => '<tr>' + x.map((v, i) => '<td class="' + (typeof v === 'number' ? 'wk-num' : '') + '">' + esc(fmt(r, i, v)) + '</td>').join('') + '</tr>').join('') : '<tr><td colspan="' + r.cols.length + '">No records yet.</td></tr>') + '</tbody>' + foot + '</table></div>';
  }
  window.wkTab = (a, t) => { wtab[a] = t; render(); };
  window.wkReport = (a, id) => { rep[a] = id; render(); };
  window.openReport = (a, id) => { wtab[a] = 'reports'; rep[a] = id; go(a); };
  window.wkCsv = a => {
    const r = cur(a), q = v => '"' + String(v).replace(/"/g, '""') + '"';
    const text = [r.cols.map(q).join(',')].concat(r.rows().map(x => x.map(q).join(','))).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([text], { type: 'text/csv' })); link.download = r.name.toLowerCase().replace(/\W+/g, '-') + '.csv'; link.click();
  };
  const PAGES = { sales: 'salesPage', purchasing: 'purchasePage', inventory: 'inventoryPage', finance: 'financePage' };
  Object.keys(PAGES).forEach(a => {
    const orig = window[PAGES[a]];
    window[PAGES[a]] = function () {
      if (wtab[a] === 'reports') return heading(TITLE[a] + ' reports', 'View and export the ' + TITLE[a].toLowerCase() + ' records from this area', '') + tabs(a) + reportView(a);
      const h = window.heading, bar = tabs(a); let used = false, html;
      window.heading = (t, s, x) => { window.heading = h; used = true; return h(t, s, x) + bar; };
      try { html = orig.apply(this, arguments); } finally { window.heading = h; }
      return used ? html : bar + html;
    };
  });
  const overviewPage = window.overview;
  window.overview = function () {
    const tile = (a, r) => { const t = r.total, rows = r.rows(); const last = t ? t[t.length - 1] : null;
      return '<button class="wk-link" onclick="openReport(\'' + a + '\',\'' + r.id + '\')"><span>' + r.name + '</span><b>' + (t && !r.count ? fmt(r, last, sum(rows, x => x[last])) : rows.length + (rows.length === 1 ? ' item' : ' items')) + '</b></button>'; };
    return overviewPage() + '<h2 class="wk-h2">Reports</h2><div class="wk-dash-grid">' + Object.keys(REPORTS).map(a =>
      '<section class="panel wk-dash"><h3>' + TITLE[a] + '</h3>' + REPORTS[a].map(r => tile(a, r)).join('') + '</section>').join('') + '</div>';
  };
})();
