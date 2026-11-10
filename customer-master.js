/* Customer master data fields from customer_master_data_template-v2.xlsx: type, channel, sub-channel, level,
   payment terms, credit limit, status and reporting group. Load AFTER customer-network.js:
   <script src="customer-master.js"></script> */
(function () {
  const css = document.createElement('style');
  css.textContent = `.cm-note{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;font-size:12px;color:#52636a;margin:0 0 12px}
  .cm-note button{border:1px solid #cfd9dc;background:#fff;border-radius:999px;padding:6px 14px;font:600 11px Manrope,sans-serif;color:#52636a;cursor:pointer}
  .cm-table td,.cm-table th{font-size:12px;padding:10px 10px;vertical-align:top}.cm-table td.cm-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}.cm-table .cm-sub{display:block;font-size:11px;color:#6e7d84;margin-top:2px}
  .cm-group{font-size:12px;font-weight:600;color:var(--green-dark)}`;
  document.head.appendChild(css);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => Number(v) || 0;
  const TYPES = {
    'B2B Wholesaler': { channel: 'Indirect', sub: 'Distributor Network', level: 'Tier 1 (Strategic)', group: 'High Volume / Indirect' },
    'B2B Corporate Account': { channel: 'Direct', sub: 'Inside / Field Sales', level: 'Tier 2 (Key Account)', group: 'High Margin / Direct' },
    'B2C Digital Customer': { channel: 'Direct', sub: 'E-commerce Shop', level: 'Tier 3 (Standard)', group: 'Mass Market / Online' },
    'B2C Retail Customer': { channel: 'Direct', sub: 'Brick-and-Mortar Store', level: 'Tier 3 (Standard)', group: 'Mass Market / Physical' },
    'B2G Government Agency': { channel: 'Direct', sub: 'RFQ / Tender Procurement', level: 'Tier 1 (Strategic)', group: 'Contractual / Public' } };
  const CHANNELS = { Indirect: ['Distributor Network'], Direct: ['Inside / Field Sales', 'E-commerce Shop', 'Brick-and-Mortar Store', 'RFQ / Tender Procurement'] };
  const LEVELS = ['Tier 1 (Strategic)', 'Tier 2 (Key Account)', 'Tier 3 (Standard)'];
  const TERMS = ['Pre-paid', 'Net 30', 'Net 45', 'Net 60', 'Net 90'];
  const STATUSES = ['Active', 'Inactive', 'Blocked'];
  const C = () => db.customerProfiles;
  const statusOf = c => c.custStatus || (c.active === false ? 'Inactive' : 'Active');
  const groupOf = c => (TYPES[c.type] ? TYPES[c.type].group : 'Not set');
  const opts = (list, sel, blank) => (blank ? '<option value="">' + blank + '</option>' : '') + list.map(x => '<option' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>').join('');
  function syncLegacy(c) { // only Active customers can be picked for new sales orders
    if (!Array.isArray(db.customers)) return; const i = db.customers.indexOf(c.name);
    if (statusOf(c) === 'Active') { if (i < 0) db.customers.push(c.name); } else if (i >= 0) db.customers.splice(i, 1);
  }

  /* List */
  function listTable() {
    const some = C().some(c => c.tplExample);
    const note = '<div class="cm-note"><span>Fields follow your customer master data template. Blocked and inactive customers cannot be chosen for new sales orders.</span>' +
      (some ? '<button onclick="cmClear()">Remove template examples</button>' : '<button onclick="cmExample()">Load the template examples</button>') + '</div>';
    const rows = C().map(c => '<tr><td>' + esc(c.id) + '</td><td class="td-strong">' + esc(c.name) + (c.level ? '<small class="cm-sub" style="font-weight:400">' + esc(c.level) + '</small>' : '') + '</td><td>' + esc(c.type || '—') + (c.type ? '<small class="cm-sub">' + esc(groupOf(c)) + '</small>' : '') + '</td><td>' + esc(c.channel || '—') + (c.subChannel ? '<small class="cm-sub">' + esc(c.subChannel) + '</small>' : '') + '</td><td>' + esc(c.paymentTerms || '—') + '</td><td class="cm-num">' + (c.creditLimit == null || c.creditLimit === '' ? '—' : money(num(c.creditLimit))) + '</td><td>' + status(statusOf(c)) + '</td><td><button class="btn btn-sm" onclick="openMasterDetail(\'customer\',\'' + esc(c.id) + '\')">View / edit</button></td></tr>').join('');
    return note + '<div class="panel table-panel"><div class="table-wrap"><table class="cm-table"><thead><tr><th>Customer ID</th><th>Customer</th><th>Customer type</th><th>Channel</th><th>Payment terms</th><th>Credit limit</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  const prevPage = window.mastersPage;
  window.mastersPage = function () {
    const html = prevPage();
    if (masterView !== 'customers') return html;
    const pt = html.indexOf('<div class="page-tools">'), start = pt < 0 ? -1 : html.indexOf('<div class="panel table-panel', pt);
    if (start < 0 || !html.endsWith('</div>')) return html;
    return html.slice(0, start) + listTable() + '</div>';
  };

  /* Detail and form */
  const prevDetail = window.openMasterDetail;
  window.openMasterDetail = function (kind, id) {
    prevDetail.apply(this, arguments);
    if (kind !== 'customer') return; const c = C().find(x => x.id === id), g = document.querySelector('#modal-root .md-detail-grid'); if (!c || !g) return;
    const f = (l, v) => '<div><small>' + l + '</small><b>' + esc(v || 'Not set') + '</b></div>';
    g.insertAdjacentHTML('beforeend', f('Customer type', c.type) + f('Sales channel', c.channel) + f('Sub-channel', c.subChannel) + f('Customer level', c.level) + f('Payment terms', c.paymentTerms) +
      f('Credit limit', c.creditLimit == null || c.creditLimit === '' ? '' : money(num(c.creditLimit))) + f('Status', statusOf(c)) + f('Reporting group', groupOf(c) === 'Not set' ? '' : groupOf(c)));
  };
  const prevForm = window.openMasterForm;
  window.openMasterForm = function (kind, id) {
    prevForm.apply(this, arguments);
    if (kind !== 'customer') return; const c = (id && C().find(x => x.id === id)) || {}, full = document.querySelector('#modal-root form .field.full'); if (!full) return;
    const sub = CHANNELS[c.channel] || Object.values(CHANNELS).flat(), fld = (l, h) => '<div class="field"><label>' + l + '</label>' + h + '</div>';
    full.insertAdjacentHTML('beforebegin',
      fld('Customer type', '<select name="cmType" onchange="cmOnType(this)">' + opts(Object.keys(TYPES), c.type, 'Choose a type') + '</select>') +
      fld('Sales channel', '<select name="cmChannel" onchange="cmOnChannel(this)">' + opts(Object.keys(CHANNELS), c.channel, 'Choose a channel') + '</select>') +
      fld('Sub-channel', '<select name="cmSub">' + opts(sub, c.subChannel, 'Choose a sub-channel') + '</select>') +
      fld('Customer level', '<select name="cmLevel">' + opts(LEVELS, c.level, 'Choose a level') + '</select>') +
      fld('Payment terms', '<select name="cmTerms">' + opts(TERMS, c.paymentTerms, 'Choose terms') + '</select>') +
      fld('Credit limit (USD)', '<input name="cmCredit" type="number" min="0" step="1" value="' + esc(c.creditLimit == null ? '' : c.creditLimit) + '">') +
      fld('Status', '<select name="cmStatus">' + opts(STATUSES, statusOf(c)) + '</select>') +
      fld('Reporting group', '<div class="cm-group" id="cmGroupOut" style="padding:9px 0">' + esc(groupOf(c)) + '</div>'));
  };
  window.cmOnType = sel => { const f = sel.form, m = TYPES[sel.value];
    if (m) { f.cmChannel.value = m.channel; window.cmOnChannel(f.cmChannel, m.sub); f.cmLevel.value = m.level; }
    document.getElementById('cmGroupOut').textContent = m ? m.group : 'Not set'; };
  window.cmOnChannel = (sel, pick) => { const f = sel.form;
    f.cmSub.innerHTML = opts(CHANNELS[sel.value] || Object.values(CHANNELS).flat(), pick || '', 'Choose a sub-channel'); };
  const prevSave = window.saveMasterRecord;
  window.saveMasterRecord = function (e, kind, id) {
    let extra = null, name = '';
    if (kind === 'customer' && e && e.target && e.target.cmType) { const f = e.target; name = (f.name && f.name.value || '').trim();
      extra = { type: f.cmType.value || null, channel: f.cmChannel.value || null, subChannel: f.cmSub.value || null, level: f.cmLevel.value || null, paymentTerms: f.cmTerms.value || null, creditLimit: Math.max(0, num(f.cmCredit.value)), custStatus: f.cmStatus.value }; }
    const out = prevSave.apply(this, arguments);
    if (extra) { const c = C().find(x => x.name === name); if (c) { Object.assign(c, extra); c.active = extra.custStatus === 'Active'; syncLegacy(c); save(); render(); } }
    return out;
  };

  /* Template examples (removable) */
  const EX = [['CUST-1001', 'Global Distribution Inc', 'B2B Wholesaler', 'Net 60', 250000, 'Active'], ['CUST-1002', 'Nexus Tech Solutions', 'B2B Corporate Account', 'Net 30', 50000, 'Active'],
    ['CUST-1003', 'John Doe', 'B2C Digital Customer', 'Pre-paid', 0, 'Active'], ['CUST-1004', 'Jane Smith', 'B2C Retail Customer', 'Pre-paid', 0, 'Active'],
    ['CUST-1005', 'Department of Education', 'B2G Government Agency', 'Net 90', 500000, 'Active'], ['CUST-1006', 'Apex Retailers Ltd', 'B2B Corporate Account', 'Net 30', 15000, 'Inactive']];
  window.cmExample = () => { if (C().some(c => c.tplExample)) return;
    EX.forEach(r => { const m = TYPES[r[2]], c = { id: r[0], name: r[1], contact: '', email: '', phone: '', address: '', arAccount: '1200', salesAccount: '4000', warehouseId: db.warehouses[0] ? db.warehouses[0].id : '', type: r[2], channel: m.channel, subChannel: m.sub,
      level: r[1] === 'Apex Retailers Ltd' ? 'Tier 3 (Standard)' : m.level, paymentTerms: r[3], creditLimit: r[4], custStatus: r[5], active: r[5] === 'Active', tplExample: true }; C().push(c); syncLegacy(c); });
    save(); render(); };
  window.cmClear = () => { C().filter(c => c.tplExample).forEach(c => { const i = db.customers ? db.customers.indexOf(c.name) : -1; if (i >= 0) db.customers.splice(i, 1); });
    db.customerProfiles = C().filter(c => !c.tplExample); save(); render(); };

  /* Reports: Sales > Reports, and the dashboard */
  const salesBy = keyOf => { const m = {}, pf = n => C().find(c => c.name === n);
    C().forEach(c => { const k = keyOf(c); (m[k] = m[k] || { customers: 0, orders: 0, sales: 0 }).customers++; });
    db.sales.forEach(s => { const c = pf(s.customer), k = c ? keyOf(c) : 'Not set', r = m[k] = m[k] || { customers: 0, orders: 0, sales: 0 }; r.orders++; r.sales += num(s.qty) * num(s.unitPrice); });
    const grand = Object.values(m).reduce((a, r) => a + r.sales, 0);
    return Object.entries(m).sort((a, b) => b[1].sales - a[1].sales).map(([k, r]) => [k, r.customers, r.orders, r.sales, grand ? Math.round(r.sales / grand * 100) + '%' : '0%']); };
  if (window.WK_REPORTS) window.WK_REPORTS.sales.push(
    { id: 'segment', name: 'Sales by reporting group', cols: ['Reporting group', 'Customers', 'Orders', 'Sales', 'Share'], money: [3], total: [1, 2, 3], rows: () => salesBy(groupOf) },
    { id: 'level', name: 'Sales by customer level', cols: ['Customer level', 'Customers', 'Orders', 'Sales', 'Share'], money: [3], total: [1, 2, 3], rows: () => salesBy(c => c.level || 'Not set') });
  C().forEach(c => { if (c.custStatus) syncLegacy(c); });
})();
