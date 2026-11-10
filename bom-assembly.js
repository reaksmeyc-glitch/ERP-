/* BOM (for Semi-finished Goods) and Assembly sheets (for Finished Goods) in Master data.
   Load AFTER material-master.js: <script src="bom-assembly.js"></script> */
(function () {
  const css = document.createElement('style');
  css.textContent = `.bx-note{font-size:12px;color:#52636a;max-width:760px;line-height:1.6;margin:0 0 14px}
  .bx-list td,.bx-list th,.bx-ed td,.bx-ed th{font-size:12px;padding:10px 10px;vertical-align:middle}.bx-num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .bx-ed{padding:16px 18px;margin-top:16px}.bx-ed h3{font:700 14px Manrope,sans-serif;margin:0 0 4px}.bx-sum{display:flex;flex-wrap:wrap;gap:6px 26px;font-size:12px;color:#52636a;margin:8px 0 14px}.bx-sum b{color:var(--ink)}
  .bx-ed input,.bx-ed select{font:inherit;font-size:12px;padding:6px 8px;border:1px solid #cfd9dc;border-radius:7px;background:#fff;max-width:280px}.bx-ed input[type=number]{width:90px}
  .bx-ed h4{font:700 12px Manrope,sans-serif;margin:18px 0 6px}.bx-actions{display:flex;gap:8px;margin-top:10px}
  .bx-link{display:block;border:0;background:none;padding:0;margin-top:4px;font:600 11px Manrope,sans-serif;color:var(--green);cursor:pointer;text-align:left}
  .bx-empty{padding:28px;text-align:center;color:#52636a;font-size:13px}.bx-empty button{margin-top:10px}`;
  document.head.appendChild(css);

  const SEMI = 'Semi-finished Good', FIN = 'Finished Good', sel = { bom: null, asm: null };
  const num = v => Number(v) || 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const P = () => db.products, B = () => (db.boms = db.boms || []), A = () => (db.assemblies = db.assemblies || []);
  const mat = id => P().find(p => p.id === id), bomOf = id => B().find(b => b.parentId === id), asmOf = id => A().find(a => a.productId === id);
  const rolled = (id, d = 0) => { const b = bomOf(id); if (!b || !b.components.length || d > 6) return num((mat(id) || {}).cost);
    return b.components.reduce((s, c) => s + num(c.qty) * (1 + num(c.scrap) / 100) * rolled(c.materialId, d + 1), 0); };
  const reaches = (from, to, d = 0) => { if (from === to) return true; if (d > 8) return false; const b = bomOf(from); return !!b && b.components.some(c => reaches(c.materialId, to, d + 1)); };
  const redraw = () => setTimeout(render, 0); // redraw after the current event finishes
  const rec = (kind, id) => (kind === 'bom' ? bomOf(id) : asmOf(id));
  const options = (selected, exclude) => P().filter(p => p.id !== exclude).map(p => '<option value="' + esc(p.id) + '"' + (p.id === selected ? ' selected' : '') + '>' + esc(p.id + ' · ' + p.name) + '</option>').join('');

  window.bxLink = p => { if (p.matType === SEMI) { const b = bomOf(p.id); return '<button class="bx-link" onclick="mdOpenBom(\'' + esc(p.id) + '\')">BOM · ' + (b ? b.components.length : 0) + ' components</button>'; }
    if (p.matType === FIN) { const a = asmOf(p.id); return '<button class="bx-link" onclick="mdOpenAsm(\'' + esc(p.id) + '\')">Assembly sheet · ' + (a ? a.steps.length : 0) + ' steps</button>'; } return ''; };
  window.mdOpenBom = id => { sel.bom = id; masterSetView('boms'); setTimeout(() => { const e = document.getElementById('bxEditor'); if (e) e.scrollIntoView({ block: 'nearest' }); }, 0); };
  window.mdOpenAsm = id => { sel.asm = id; masterSetView('assembly'); setTimeout(() => { const e = document.getElementById('bxEditor'); if (e) e.scrollIntoView({ block: 'nearest' }); }, 0); };
  window.bxClose = kind => { sel[kind] = null; redraw(); };
  window.bxAdd = (kind, id) => { let r = rec(kind, id); if (!r) { r = kind === 'bom' ? { parentId: id, components: [] } : { productId: id, components: [], steps: [] }; (kind === 'bom' ? B() : A()).push(r); }
    const first = P().find(p => p.id !== id); if (!first) { toast('Add another material first.'); return; } r.components.push({ materialId: first.id, qty: 1, scrap: 0 }); save(); redraw(); };
  window.bxSet = (kind, id, i, f, v) => { const c = rec(kind, id).components[i];
    if (f === 'materialId') { if (kind === 'bom' && reaches(v, id)) { toast('That would make the BOM loop back on itself.'); redraw(); return; } c.materialId = v; } else c[f] = Math.max(0, num(v)); save(); redraw(); };
  window.bxDel = (kind, id, i) => { rec(kind, id).components.splice(i, 1); save(); redraw(); };
  window.bxStepAdd = id => { let r = asmOf(id); if (!r) { r = { productId: id, components: [], steps: [] }; A().push(r); } r.steps.push({ text: '', station: '', minutes: 0 }); save(); redraw(); };
  window.bxStepSet = (id, i, f, v) => { asmOf(id).steps[i][f] = f === 'minutes' ? Math.max(0, num(v)) : v; save(); redraw(); };
  window.bxStepDel = (id, i) => { asmOf(id).steps.splice(i, 1); save(); redraw(); };

  function componentTable(kind, id, r) {
    const bom = kind === 'bom', cb = (f, i) => "bxSet('" + kind + "','" + id + "'," + i + ",'" + f + "',this.value)";
    const rows = (r ? r.components : []).map((c, i) => { const m = mat(c.materialId) || {}, line = num(c.qty) * (bom ? 1 + num(c.scrap) / 100 : 1) * rolled(c.materialId);
      return '<tr><td><select aria-label="Component ' + (i + 1) + '" onchange="' + cb('materialId', i) + '">' + options(c.materialId, id) + '</select></td><td><input type="number" min="0" step="any" aria-label="Quantity" value="' + esc(c.qty) + '" onchange="' + cb('qty', i) + '"></td><td>' + esc(m.uom || '') + '</td>' +
        (bom ? '<td><input type="number" min="0" step="any" aria-label="Scrap percent" value="' + esc(c.scrap) + '" onchange="' + cb('scrap', i) + '"></td>' : '') + '<td class="bx-num">' + money(rolled(c.materialId)) + '</td><td class="bx-num">' + money(line) + '</td><td><button class="btn btn-sm" onclick="bxDel(\'' + kind + '\',\'' + id + '\',' + i + ')">Remove</button></td></tr>'; }).join('');
    return '<div class="table-wrap" style="overflow:auto"><table><thead><tr><th>Component</th><th>Qty per 1 unit</th><th>Unit</th>' + (bom ? '<th>Scrap %</th>' : '') + '<th>Unit cost</th><th>Line cost</th><th></th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="' + (bom ? 7 : 6) + '">No components yet.</td></tr>') + '</tbody></table></div><div class="bx-actions"><button class="btn" onclick="bxAdd(\'' + kind + '\',\'' + id + '\')">+ Add component</button></div>';
  }
  function editor(kind, id) {
    const m = mat(id); if (!m) return ''; const bom = kind === 'bom', r = rec(kind, id), cost = bom ? rolled(id) : (r ? r.components.reduce((s, c) => s + num(c.qty) * rolled(c.materialId), 0) : 0);
    const mins = !bom && r ? r.steps.reduce((s, x) => s + num(x.minutes), 0) : 0;
    let steps = '';
    if (!bom) { const cb = (f, i) => "bxStepSet('" + id + "'," + i + ",'" + f + "',this.value)";
      steps = '<h4>Assembly steps</h4><div class="table-wrap" style="overflow:auto"><table><thead><tr><th>Step</th><th>Instruction</th><th>Station</th><th>Minutes</th><th></th></tr></thead><tbody>' +
        ((r ? r.steps : []).map((x, i) => '<tr><td>' + (i + 1) + '</td><td><input aria-label="Instruction" style="min-width:260px" value="' + esc(x.text) + '" onchange="' + cb('text', i) + '"></td><td><input aria-label="Station" value="' + esc(x.station) + '" onchange="' + cb('station', i) + '"></td><td><input type="number" min="0" step="any" aria-label="Minutes" value="' + esc(x.minutes) + '" onchange="' + cb('minutes', i) + '"></td><td><button class="btn btn-sm" onclick="bxStepDel(\'' + id + '\',' + i + ')">Remove</button></td></tr>').join('') || '<tr><td colspan="5">No steps yet.</td></tr>') +
        '</tbody></table></div><div class="bx-actions"><button class="btn" onclick="bxStepAdd(\'' + id + '\')">+ Add step</button></div>'; }
    return '<div class="panel bx-ed" id="bxEditor"><h3>' + (bom ? 'BOM' : 'Assembly sheet') + ': ' + esc(m.name) + '</h3><div class="bx-sum"><span>Makes <b>1 ' + esc(m.uom || 'unit') + '</b></span><span>' + (bom ? 'Rolled-up cost' : 'Material cost') + ' <b>' + money(cost) + '</b></span><span>Master unit cost <b>' + money(num(m.cost)) + '</b></span>' +
      (bom ? '' : '<span>Assembly time <b>' + mins + ' min</b></span>') + '</div>' + (bom ? '<p class="bx-note">Scrap % adds the material lost while making one unit. The master unit cost is not changed by this page.</p>' : '') + componentTable(kind, id, r) + steps +
      '<div class="bx-actions"><button class="btn" onclick="bxClose(\'' + kind + '\')">Close</button></div></div>';
  }
  function body(kind) {
    const bom = kind === 'bom', type = bom ? SEMI : FIN, items = P().filter(p => p.matType === type);
    const intro = '<p class="bx-note">' + (bom ? 'A bill of materials lists what goes into one unit of a <b>semi-finished good</b>.' : 'An assembly sheet lists the components and the steps to build one unit of a <b>finished good</b>.') + ' Set the material type in Materials & products and it appears here.</p>';
    if (!items.length) return intro + '<div class="panel bx-empty">No ' + (bom ? 'semi-finished goods' : 'finished goods') + ' yet.<br>In Materials & products, set a material&rsquo;s type to <b>' + type + '</b>.<br><button class="btn btn-primary" onclick="masterSetView(\'materials\')">Go to Materials & products</button></div>';
    const rows = items.map(p => { const r = rec(kind, p.id), n = r ? r.components.length : 0, cost = bom ? rolled(p.id) : (r ? r.components.reduce((s, c) => s + num(c.qty) * rolled(c.materialId), 0) : 0);
      return '<tr><td class="td-strong">' + esc(p.name) + '<small style="display:block;color:#6e7d84;font-weight:400">' + esc(p.id) + '</small></td><td class="bx-num">' + n + '</td>' + (bom ? '' : '<td class="bx-num">' + (r ? r.steps.length : 0) + '</td>') +
        '<td class="bx-num">' + money(cost) + '</td><td class="bx-num">' + money(num(p.cost)) + '</td><td><button class="btn btn-sm" onclick="' + (bom ? 'mdOpenBom' : 'mdOpenAsm') + '(\'' + esc(p.id) + '\')">' + (n || (r && r.steps && r.steps.length) ? 'Open' : 'Create') + '</button></td></tr>'; }).join('');
    return intro + '<div class="panel table-panel bx-list"><div class="table-wrap"><table><thead><tr><th>' + (bom ? 'Semi-finished good' : 'Finished good') + '</th><th>Components</th>' + (bom ? '' : '<th>Steps</th>') + '<th>' + (bom ? 'Rolled-up cost' : 'Material cost') + '</th><th>Master unit cost</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' + (sel[kind] ? editor(kind, sel[kind]) : '');
  }
  window.MD_EXT = window.MD_EXT || {}; window.MD_EXT.boms = () => body('bom'); window.MD_EXT.assembly = () => body('asm');

  /* Reports: Inventory > Reports, and the dashboard */
  if (window.WK_REPORTS) window.WK_REPORTS.inventory.push(
    { id: 'bomcost', name: 'BOM cost roll-up', count: true, cols: ['Semi-finished good', 'Components', 'Rolled-up cost', 'Master unit cost', 'Difference'], money: [2, 3, 4],
      rows: () => P().filter(p => p.matType === SEMI).map(p => { const b = bomOf(p.id), r = rolled(p.id); return [p.name, b ? b.components.length : 0, r, num(p.cost), r - num(p.cost)]; }) },
    { id: 'asmsheets', name: 'Assembly sheets', count: true, cols: ['Finished good', 'Components', 'Steps', 'Minutes', 'Material cost', 'Master unit cost'], money: [4, 5],
      rows: () => P().filter(p => p.matType === FIN).map(p => { const a = asmOf(p.id); return [p.name, a ? a.components.length : 0, a ? a.steps.length : 0, a ? a.steps.reduce((s, x) => s + num(x.minutes), 0) : 0, a ? a.components.reduce((s, c) => s + num(c.qty) * rolled(c.materialId), 0) : 0, num(p.cost)]; }) });
})();
