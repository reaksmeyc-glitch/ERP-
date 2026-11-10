/* Material master data in the same template style: type, supply route, sub-route, level, tracking, status and
   reporting group. Load AFTER supplier-master.js: <script src="material-master.js"></script>
   The lists below are PROPOSALS: edit them to match ABC. */
(function () {
  const css = document.createElement('style');
  css.textContent = `.mt-note{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;font-size:12px;color:#52636a;margin:0 0 12px}
  .mt-note button{border:1px solid #cfd9dc;background:#fff;border-radius:999px;padding:6px 14px;font:600 11px Manrope,sans-serif;color:#52636a;cursor:pointer}
  .mt-table td,.mt-table th{font-size:12px;padding:10px 10px;vertical-align:top}.mt-table td.mt-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .mt-table .mt-sub{display:block;font-size:11px;color:#6e7d84;margin-top:2px;font-weight:400}.mt-group{font-size:12px;font-weight:600;color:var(--green-dark)}`;
  document.head.appendChild(css);

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = v => Number(v) || 0;
  const TYPES = {
    'Raw Material': { route: 'Purchased', sub: 'Local supplier', level: 'Class B (Medium value)', group: 'Inputs / Purchased' },
    'Packaging Material': { route: 'Purchased', sub: 'Local supplier', level: 'Class C (Low value)', group: 'Packaging / Purchased' },
    'Semi-finished Good': { route: 'Produced', sub: 'In-house production', level: 'Class B (Medium value)', group: 'Work in Progress / Produced' },
    'Finished Good': { route: 'Produced', sub: 'In-house production', level: 'Class A (High value)', group: 'Sellable / Produced' },
    'Trading Good': { route: 'Purchased', sub: 'Local supplier', level: 'Class A (High value)', group: 'Sellable / Resale' },
    'Service': { route: 'Purchased', sub: 'Service provider', level: 'Class C (Low value)', group: 'Services / Non-stock' },
    'Project': { route: 'Purchased', sub: 'Project procurement', level: 'Class B (Medium value)', group: 'Project / Non-stock' } };
  const ROUTES = { Purchased: ['Local supplier', 'Import', 'Service provider', 'Project procurement'], Produced: ['In-house production', 'Subcontract'] };
  const LEVELS = ['Class A (High value)', 'Class B (Medium value)', 'Class C (Low value)'];
  const TRACK = ['Not tracked', 'Batch', 'Serial'];
  const STATUSES = ['Active', 'Inactive', 'Blocked'];
  const P = () => db.products;
  const statusOf = p => p.matStatus || 'Active';
  const groupOf = p => (TYPES[p.matType] ? TYPES[p.matType].group : 'Not set');
  const linkText = t => (t === 'Semi-finished Good' ? 'BOM (bill of materials), set up after saving' : t === 'Finished Good' ? 'Assembly sheet, set up after saving' : 'None');
  const opts = (list, sel, blank) => (blank ? '<option value="">' + blank + '</option>' : '') + list.map(x => '<option' + (x === sel ? ' selected' : '') + '>' + esc(x) + '</option>').join('');

  function listTable() {
    const todo = P().some(p => !p.matType);
    const note = '<div class="mt-note"><span>Type, supply route and level describe each material for reporting. Blocked and inactive materials are flagged here; stopping their use on orders is not built yet.</span>' +
      (todo ? '<button onclick="mtSuggest()">Fill types from each product group</button>' : '') + '</div>';
    const rows = P().map(p => '<tr><td>' + esc(p.id) + '</td><td class="td-strong">' + esc(p.name) + '<small class="mt-sub">' + esc([p.category, p.uom].filter(Boolean).join(' · ')) + '</small></td><td>' + esc(p.matType || '—') +
      (p.matType ? '<small class="mt-sub">' + esc(groupOf(p)) + '</small>' : '') + (window.bxLink ? window.bxLink(p) : '') + '</td><td>' + esc(p.matRoute || '—') + (p.matSub ? '<small class="mt-sub">' + esc(p.matSub) + '</small>' : '') + '</td><td>' + esc(p.matLevel || '—') +
      '</td><td>' + esc(p.preferredVendor || '—') + (p.leadTimeDays ? '<small class="mt-sub">' + esc(p.leadTimeDays) + ' days lead time</small>' : '') + '</td><td class="mt-num">' + money(num(p.cost)) + '</td><td>' + status(statusOf(p)) +
      '</td><td><button class="btn btn-sm" onclick="openMasterDetail(\'material\',\'' + esc(p.id) + '\')">View / edit</button></td></tr>').join('');
    return note + '<div class="panel table-panel"><div class="table-wrap"><table class="mt-table"><thead><tr><th>Material ID</th><th>Material</th><th>Material type</th><th>Supply route</th><th>Level</th><th>Preferred supplier</th><th>Unit cost</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  const prevPage = window.mastersPage;
  window.mastersPage = function () {
    const html = prevPage();
    if (masterView !== 'materials') return html;
    const pt = html.indexOf('<div class="page-tools">'), start = pt < 0 ? -1 : html.indexOf('<div class="panel table-panel', pt);
    if (start < 0 || !html.endsWith('</div>')) return html;
    return html.slice(0, start) + listTable() + '</div>';
  };

  const prevDetail = window.openMasterDetail;
  window.openMasterDetail = function (kind, id) {
    prevDetail.apply(this, arguments);
    if (kind !== 'material') return; const p = P().find(x => x.id === id), g = document.querySelector('#modal-root .md-detail-grid'); if (!p || !g) return;
    const f = (l, v) => '<div><small>' + l + '</small><b>' + esc(v || 'Not set') + '</b></div>';
    g.insertAdjacentHTML('beforeend', f('Material type', p.matType) + f('Supply route', p.matRoute) + f('Sub-route', p.matSub) + f('Material level', p.matLevel) + f('Tracking', p.matTrack) + f('Status', statusOf(p)) + f('Reporting group', groupOf(p) === 'Not set' ? '' : groupOf(p)));
  };
  const prevForm = window.openMasterForm;
  window.openMasterForm = function (kind, id) {
    prevForm.apply(this, arguments);
    if (kind !== 'material') return; const p = (id && P().find(x => x.id === id)) || {}, form = document.querySelector('#modal-root form'), nameField = form && form.querySelector('[name=name]');
    if (!nameField) return;
    const sub = ROUTES[p.matRoute] || Object.values(ROUTES).flat(), fld = (l, h) => '<div class="field"><label>' + l + '</label>' + h + '</div>';
    nameField.closest('.field').insertAdjacentHTML('afterend',
      fld('Material type', '<select name="mtType" onchange="mtOnType(this)">' + opts(Object.keys(TYPES), p.matType, 'Choose a type') + '</select>') +
      fld('Supply route', '<select name="mtRoute" onchange="mtOnRoute(this)">' + opts(Object.keys(ROUTES), p.matRoute, 'Choose a route') + '</select>') +
      fld('Sub-route', '<select name="mtSub">' + opts(sub, p.matSub, 'Choose a sub-route') + '</select>') +
      fld('Material level', '<select name="mtLevel">' + opts(LEVELS, p.matLevel, 'Choose a level') + '</select>') +
      fld('Tracking', '<select name="mtTrack">' + opts(TRACK, p.matTrack || 'Not tracked') + '</select>') +
      fld('Status', '<select name="mtStatus">' + opts(STATUSES, statusOf(p)) + '</select>') +
      fld('Reporting group', '<div class="mt-group" id="mtGroupOut" style="padding:9px 0">' + esc(groupOf(p)) + '</div>') +
      fld('Linked sheet', '<div class="mt-group" id="mtLinkOut" style="padding:9px 0">' + linkText(p.matType) + '</div>'));
  };
  window.mtOnType = sel => { const f = sel.form, m = TYPES[sel.value];
    if (m) { f.mtRoute.value = m.route; window.mtOnRoute(f.mtRoute, m.sub); f.mtLevel.value = m.level; }
    document.getElementById('mtGroupOut').textContent = m ? m.group : 'Not set'; document.getElementById('mtLinkOut').textContent = linkText(sel.value); };
  window.mtOnRoute = (sel, pick) => { sel.form.mtSub.innerHTML = opts(ROUTES[sel.value] || Object.values(ROUTES).flat(), pick || '', 'Choose a sub-route'); };
  const prevSave = window.saveMasterRecord;
  window.saveMasterRecord = function (e, kind, id) {
    let extra = null, name = '';
    if (kind === 'material' && e && e.target && e.target.mtType) { const f = e.target; name = (f.name && f.name.value || '').trim();
      extra = { matType: f.mtType.value || null, matRoute: f.mtRoute.value || null, matSub: f.mtSub.value || null, matLevel: f.mtLevel.value || null, matTrack: f.mtTrack.value, matStatus: f.mtStatus.value }; }
    const out = prevSave.apply(this, arguments);
    if (extra) { const p = P().find(x => x.name === name); if (p) { Object.assign(p, extra); save(); render(); } }
    return out;
  };
  window.mtSuggest = () => { const map = [['raw', 'Raw Material'], ['pack', 'Packaging Material'], ['finish', 'Finished Good'], ['trading', 'Trading Good'], ['semi', 'Semi-finished Good'], ['service', 'Service']];
    P().forEach(p => { if (p.matType) return; const hit = map.find(m => String(p.category || '').toLowerCase().includes(m[0])); if (!hit) return; const t = TYPES[hit[1]];
      Object.assign(p, { matType: hit[1], matRoute: t.route, matSub: t.sub, matLevel: t.level, matTrack: 'Not tracked', matStatus: 'Active' }); });
    save(); render(); };

  /* Reports: Inventory > Reports, and the dashboard */
  const stockBy = keyOf => { const m = {}; P().forEach(p => { const k = keyOf(p), r = m[k] = m[k] || { materials: 0, value: 0 }; r.materials++; r.value += num(p.onHand) * num(p.cost); });
    const grand = Object.values(m).reduce((a, r) => a + r.value, 0);
    return Object.entries(m).sort((a, b) => b[1].value - a[1].value).map(([k, r]) => [k, r.materials, r.value, grand ? Math.round(r.value / grand * 100) + '%' : '0%']); };
  if (window.WK_REPORTS) window.WK_REPORTS.inventory.push(
    { id: 'matgroup', name: 'Stock value by reporting group', cols: ['Reporting group', 'Materials', 'Stock value', 'Share'], money: [2], total: [1, 2], rows: () => stockBy(groupOf) },
    { id: 'matlevel', name: 'Stock value by material level', cols: ['Material level', 'Materials', 'Stock value', 'Share'], money: [2], total: [1, 2], rows: () => stockBy(p => p.matLevel || 'Not set') });
})();
