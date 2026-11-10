/* Supplier master data in the same template style as customers: type, sourcing route, sub-channel, level,
   payment terms, credit limit, status and reporting group. Load AFTER customer-master.js:
   <script src="supplier-master.js"></script>   The supplier lists below are PROPOSALS: edit them to match ABC. */
(function () {
  const css = document.createElement('style');
  css.textContent = `.sm-note{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;font-size:12px;color:#52636a;margin:0 0 12px}
  .sm-note button{border:1px solid #cfd9dc;background:#fff;border-radius:999px;padding:6px 14px;font:600 11px Manrope,sans-serif;color:#52636a;cursor:pointer}
  .sm-table td,.sm-table th{font-size:12px;padding:10px 10px;vertical-align:top}.sm-table td.sm-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .sm-table .sm-sub{display:block;font-size:11px;color:#6e7d84;margin-top:2px;font-weight:400}.sm-group{font-size:12px;font-weight:600;color:var(--green-dark)}`;
  document.head.appendChild(css);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => Number(v) || 0;
  const TYPES = {
    'Manufacturer': { route: 'Direct', sub: 'Factory / Producer', level: 'Tier 1 (Strategic)', group: 'Core Supply / Direct' },
    'Authorized Distributor': { route: 'Indirect', sub: 'Distributor / Agent', level: 'Tier 2 (Preferred)', group: 'Stock Supply / Indirect' },
    'Trader / Wholesaler': { route: 'Indirect', sub: 'Local Market / Trader', level: 'Tier 3 (Standard)', group: 'Spot Buying / Indirect' },
    'Overseas Supplier': { route: 'Direct', sub: 'Import Shipment', level: 'Tier 2 (Preferred)', group: 'Import / Long Lead Time' },
    'Service Provider': { route: 'Direct', sub: 'Contracted Service', level: 'Tier 3 (Standard)', group: 'Services / Contracted' } };
  const ROUTES = { Direct: ['Factory / Producer', 'Import Shipment', 'Contracted Service'], Indirect: ['Distributor / Agent', 'Local Market / Trader'] };
  const LEVELS = ['Tier 1 (Strategic)', 'Tier 2 (Preferred)', 'Tier 3 (Standard)'];
  const TERMS = ['Pre-paid', 'Net 15', 'Net 30', 'Net 45', 'Net 60'];
  const STATUSES = ['Active', 'Inactive', 'Blocked'];
  const S = () => db.supplierProfiles;
  const statusOf = s => s.supStatus || (s.active === false ? 'Inactive' : 'Active');
  const groupOf = s => (TYPES[s.type] ? TYPES[s.type].group : 'Not set');
  const opts = (list, sel, blank) => (blank ? '<option value="">' + blank + '</option>' : '') + list.map(x => '<option' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
  function syncLegacy(s) { // only Active suppliers can be picked for new purchase orders
    if (!Array.isArray(db.vendors)) return; const i = db.vendors.indexOf(s.name);
    if (statusOf(s) === 'Active') { if (i < 0) db.vendors.push(s.name); } else if (i >= 0) db.vendors.splice(i, 1);
  }

  /* List */
  function listTable() {
    const some = S().some(s => s.tplExample);
    const note = '<div class="sm-note"><span>Credit limit is the most we may owe this supplier on credit. Blocked and inactive suppliers cannot be chosen for new purchase orders.</span>' +
      (some ? '<button onclick="smClear()">Remove examples</button>' : '<button onclick="smExample()">Load example suppliers</button>') + '</div>';
    const rows = S().map(s => '<tr><td>' + esc(s.id) + '</td><td class="td-strong">' + esc(s.name) + (s.level ? '<small class="sm-sub">' + esc(s.level) + '</small>' : '') + '</td><td>' + esc(s.type || '—') + (s.type ? '<small class="sm-sub">' + esc(groupOf(s)) + '</small>' : '') +
      '</td><td>' + esc(s.route || '—') + (s.subChannel ? '<small class="sm-sub">' + esc(s.subChannel) + '</small>' : '') + '</td><td>' + esc(s.paymentTerms || '—') + '<small class="sm-sub">' + esc(s.currency || '') + '</small></td><td class="sm-num">' +
      (s.creditLimit == null || s.creditLimit === '' ? '—' : money(num(s.creditLimit))) + '</td><td>' + status(statusOf(s)) + '</td><td><button class="btn btn-sm" onclick="openMasterDetail(\'supplier\',\'' + esc(s.id) + '\')">View / edit</button></td></tr>').join('');
    return note + '<div class="panel table-panel"><div class="table-wrap"><table class="sm-table"><thead><tr><th>Supplier ID</th><th>Supplier</th><th>Supplier type</th><th>Sourcing route</th><th>Payment terms</th><th>Credit limit</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  const prevPage = window.mastersPage;
  window.mastersPage = function () {
    const html = prevPage();
    if (masterView !== 'suppliers') return html;
    const pt = html.indexOf('<div class="page-tools">'), start = pt < 0 ? -1 : html.indexOf('<div class="panel table-panel', pt);
    if (start < 0 || !html.endsWith('</div>')) return html;
    return html.slice(0, start) + listTable() + '</div>';
  };

  /* Detail and form */
  const prevDetail = window.openMasterDetail;
  window.openMasterDetail = function (kind, id) {
    prevDetail.apply(this, arguments);
    if (kind !== 'supplier') return; const s = S().find(x => x.id === id), g = document.querySelector('#modal-root .md-detail-grid'); if (!s || !g) return;
    const f = (l, v) => '<div><small>' + l + '</small><b>' + esc(v || 'Not set') + '</b></div>';
    g.insertAdjacentHTML('beforeend', f('Supplier type', s.type) + f('Sourcing route', s.route) + f('Sub-channel', s.subChannel) + f('Supplier level', s.level) +
      f('Credit limit', s.creditLimit == null || s.creditLimit === '' ? '' : money(num(s.creditLimit))) + f('Status', statusOf(s)) + f('Reporting group', groupOf(s) === 'Not set' ? '' : groupOf(s)));
  };
  const prevForm = window.openMasterForm;
  window.openMasterForm = function (kind, id) {
    prevForm.apply(this, arguments);
    if (kind !== 'supplier') return; const s = (id && S().find(x => x.id === id)) || {}, form = document.querySelector('#modal-root form'), full = form && form.querySelector('.field.full'); if (!full) return;
    const terms = form.querySelector('input[name=paymentTerms]'); // replace the free-text terms box with a dropdown (same field name)
    if (terms) { const sel = document.createElement('select'); sel.name = 'paymentTerms'; sel.innerHTML = opts(TERMS, terms.value || 'Net 30'); terms.replaceWith(sel); }
    const cur = form.querySelector('select[name=currency]'); // USD and KHR for Cambodia, plus EUR and GBP
    if (cur) { const v = cur.value || 'USD'; cur.innerHTML = opts(['USD', 'KHR', 'EUR', 'GBP'].concat(['USD', 'KHR', 'EUR', 'GBP'].includes(v) ? [] : [v]), v); }
    const sub = ROUTES[s.route] || Object.values(ROUTES).flat(), fld = (l, h) => '<div class="field"><label>' + l + '</label>' + h + '</div>';
    full.insertAdjacentHTML('beforebegin',
      fld('Supplier type', '<select name="smType" onchange="smOnType(this)">' + opts(Object.keys(TYPES), s.type, 'Choose a type') + '</select>') +
      fld('Sourcing route', '<select name="smRoute" onchange="smOnRoute(this)">' + opts(Object.keys(ROUTES), s.route, 'Choose a route') + '</select>') +
      fld('Sub-channel', '<select name="smSub">' + opts(sub, s.subChannel, 'Choose a sub-channel') + '</select>') +
      fld('Supplier level', '<select name="smLevel">' + opts(LEVELS, s.level, 'Choose a level') + '</select>') +
      fld('Credit limit (USD)', '<input name="smLimit" type="number" min="0" step="1" value="' + esc(s.creditLimit == null ? '' : s.creditLimit) + '">') +
      fld('Status', '<select name="smStatus">' + opts(STATUSES, statusOf(s)) + '</select>') +
      fld('Reporting group', '<div class="sm-group" id="smGroupOut" style="padding:9px 0">' + esc(groupOf(s)) + '</div>'));
  };
  window.smOnType = sel => { const f = sel.form, m = TYPES[sel.value];
    if (m) { f.smRoute.value = m.route; window.smOnRoute(f.smRoute, m.sub); f.smLevel.value = m.level; }
    document.getElementById('smGroupOut').textContent = m ? m.group : 'Not set'; };
  window.smOnRoute = (sel, pick) => { sel.form.smSub.innerHTML = opts(ROUTES[sel.value] || Object.values(ROUTES).flat(), pick || '', 'Choose a sub-channel'); };
  const prevSave = window.saveMasterRecord;
  window.saveMasterRecord = function (e, kind, id) {
    let extra = null, name = '';
    if (kind === 'supplier' && e && e.target && e.target.smType) { const f = e.target; name = (f.name && f.name.value || '').trim();
      extra = { type: f.smType.value || null, route: f.smRoute.value || null, subChannel: f.smSub.value || null, level: f.smLevel.value || null, creditLimit: Math.max(0, num(f.smLimit.value)), supStatus: f.smStatus.value }; }
    const out = prevSave.apply(this, arguments);
    if (extra) { const s = S().find(x => x.name === name); if (s) { Object.assign(s, extra); s.active = extra.supStatus === 'Active'; syncLegacy(s); save(); render(); } }
    return out;
  };

  /* Examples (removable) */
  const EX = [['SUP-1001', 'Mekong Packaging Factory', 'Manufacturer', 'Net 30', 100000, 'Active'], ['SUP-1002', 'Kampong Agro Distributors', 'Authorized Distributor', 'Net 45', 60000, 'Active'],
    ['SUP-1003', 'Phsar Thmey Trading', 'Trader / Wholesaler', 'Pre-paid', 0, 'Active'], ['SUP-1004', 'Pacific Imports Ltd', 'Overseas Supplier', 'Net 60', 150000, 'Active'],
    ['SUP-1005', 'ProClean Services', 'Service Provider', 'Net 15', 5000, 'Inactive'], ['SUP-1006', 'Quick Cargo Trading', 'Trader / Wholesaler', 'Net 30', 0, 'Blocked']];
  window.smExample = () => { if (S().some(s => s.tplExample)) return;
    EX.forEach(r => { const m = TYPES[r[2]], s = { id: r[0], name: r[1], contact: '', email: '', phone: '', address: '', paymentTerms: r[3], currency: r[2] === 'Overseas Supplier' ? 'USD' : 'USD', apAccount: '2100',
      type: r[2], route: m.route, subChannel: m.sub, level: m.level, creditLimit: r[4], supStatus: r[5], active: r[5] === 'Active', tplExample: true }; S().push(s); syncLegacy(s); });
    save(); render(); };
  window.smClear = () => { S().filter(s => s.tplExample).forEach(s => { const i = db.vendors ? db.vendors.indexOf(s.name) : -1; if (i >= 0) db.vendors.splice(i, 1); });
    db.supplierProfiles = S().filter(s => !s.tplExample); save(); render(); };

  /* Reports: Purchasing > Reports, and the dashboard */
  const lines = o => (o.lines && o.lines.length ? o.lines : [{ qty: o.qty, unitCost: o.unitCost, pricePer: 1 }]);
  const poAmt = o => lines(o).reduce((a, l) => a + num(l.qty) * num(l.unitCost) / (num(l.pricePer) || 1), 0) * (num(o.exchangeRate) || 1);
  const buyBy = keyOf => { const m = {};
    S().forEach(s => { const k = keyOf(s); (m[k] = m[k] || { suppliers: 0, orders: 0, amount: 0 }).suppliers++; });
    db.purchases.forEach(o => { const s = S().find(x => x.name === o.vendor), k = s ? keyOf(s) : 'Not set', r = m[k] = m[k] || { suppliers: 0, orders: 0, amount: 0 }; r.orders++; r.amount += poAmt(o); });
    const grand = Object.values(m).reduce((a, r) => a + r.amount, 0);
    return Object.entries(m).sort((a, b) => b[1].amount - a[1].amount).map(([k, r]) => [k, r.suppliers, r.orders, r.amount, grand ? Math.round(r.amount / grand * 100) + '%' : '0%']); };
  if (window.WK_REPORTS) window.WK_REPORTS.purchasing.push(
    { id: 'supgroup', name: 'Purchases by supplier group', cols: ['Reporting group', 'Suppliers', 'Orders', 'Amount (USD)', 'Share'], money: [3], total: [1, 2, 3], rows: () => buyBy(groupOf) },
    { id: 'suplevel', name: 'Purchases by supplier level', cols: ['Supplier level', 'Suppliers', 'Orders', 'Amount (USD)', 'Share'], money: [3], total: [1, 2, 3], rows: () => buyBy(s => s.level || 'Not set') });
  S().forEach(s => { if (s.supStatus) syncLegacy(s); });
})();
