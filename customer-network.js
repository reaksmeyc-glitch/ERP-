/* Sales network (distributor > wholesaler > retailer) on the Customers tab of Master data,
   plus network reports in Sales > Reports. Load AFTER work-tabs.js: <script src="customer-network.js"></script> */
(function () {
  let view = 'list';
  const css = document.createElement('style');
  css.textContent = `
  .cn-toggle{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 14px}
  .cn-toggle button{border:1px solid #cfd9dc;background:#fff;border-radius:999px;padding:6px 14px;font:600 11px Manrope,sans-serif;color:#52636a;cursor:pointer}
  .cn-toggle button[aria-pressed="true"]{background:var(--green);border-color:var(--green);color:#fff}
  .cn-note{font-size:12px;color:#52636a;max-width:760px;line-height:1.6;margin:0 0 14px}
  .cn-tree{padding:16px 18px;margin-bottom:14px}.cn-node{margin:2px 0 2px 20px;border-left:1px solid var(--line);padding-left:12px}.cn-tree>.cn-node{margin-left:0;border:0;padding:0}
  .cn-node summary{display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:8px 0;font-size:12px;cursor:pointer}
  .cn-node summary b{font-size:13px}.cn-node small{color:#6e7d84;font-size:11px}.cn-sales{margin-left:auto;font-weight:700}
  .cn-tier{font-size:10px;font-weight:600;padding:2px 9px;border-radius:999px;background:var(--green-pale);color:var(--green-dark)}
  .cn-tier[data-t="Wholesaler"]{background:#eef2f3;color:#52636a}.cn-tier[data-t="Retailer"]{background:#fff;border:1px solid #d5dee0;color:#6e7d84}
  .cn-mix{font-size:11px;color:#52636a;line-height:1.7;margin:0 0 6px 4px}
  .cn-grid select,.cn-grid input{font:inherit;font-size:12px;padding:6px 8px;border:1px solid #cfd9dc;border-radius:7px;background:#fff;max-width:190px}
  .cn-grid td,.cn-grid th{font-size:12px}`;
  document.head.appendChild(css);

  const TIERS = ['Distributor', 'Wholesaler', 'Retailer'];
  const num = v => Number(v) || 0, sum = a => a.reduce((s, x) => s + num(x), 0);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const C = () => db.customerProfiles, kids = id => C().filter(c => c.parentId === id);
  const desc = (id, d = 0) => (d > 6 ? [] : kids(id).flatMap(k => [k].concat(desc(k.id, d + 1))));
  const salesOf = list => db.sales.filter(s => list.some(c => c.name === s.customer));
  const amt = s => num(s.qty) * num(s.unitPrice);
  const cat = id => { const p = product(id); return p ? p.category : 'Other'; };
  const pname = id => { const p = product(id); return p ? p.name : id; };
  const usd = v => money(v);
  const by = (rows, key) => { const m = {}; rows.forEach(r => { const k = key(r); m[k] = (m[k] || 0) + amt(r); }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const place = c => [c.region, c.country].filter(Boolean).join(', ') || 'Place not set';
  const count = (sub, t) => sub.filter(x => x.tier === t).length;

  function node(c) {
    const sub = desc(c.id), list = [c].concat(sub), sales = salesOf(list), total = sum(sales.map(amt));
    const n = (k, w) => count(sub, k) + ' ' + w + (count(sub, k) === 1 ? '' : 's');
    const counts = c.tier === 'Retailer' ? '' : '<small>' + (c.tier === 'Distributor' ? n('Wholesaler', 'wholesaler') + ', ' : '') + n('Retailer', 'retailer') + '</small>';
    const cats = by(sales, s => cat(s.product)), prods = by(sales, s => pname(s.product));
    const mix = sales.length ? '<div class="cn-mix"><b>Categories:</b> ' + cats.map(x => esc(x[0]) + ' ' + usd(x[1])).join(' · ') + '<br><b>Products:</b> ' + prods.slice(0, 5).map(x => esc(x[0]) + ' ' + usd(x[1])).join(' · ') + '</div>' : '<div class="cn-mix">No sales recorded yet.</div>';
    return '<details class="cn-node" open><summary><span class="cn-tier" data-t="' + c.tier + '">' + c.tier + '</span><b>' + esc(c.name) + '</b><small>' + esc(place(c)) + '</small>' + counts + '<span class="cn-sales">' + usd(total) + '</span></summary>' + mix + kids(c.id).map(node).join('') + '</details>';
  }
  const parentOptions = c => c.tier === 'Retailer' ? C().filter(x => x.tier === 'Wholesaler' || x.tier === 'Distributor') : c.tier === 'Wholesaler' ? C().filter(x => x.tier === 'Distributor') : [];
  function netHtml() {
    const roots = C().filter(c => c.tier === 'Distributor');
    const hasExample = C().some(c => c.example), anyTier = C().some(c => c.tier);
    const intro = '<p class="cn-note">Who supplies whom. Each customer gets a type (distributor, wholesaler or retailer), a place, and the account that supplies it. The sales shown are the sales orders recorded to each account, added up through its network.' +
      (!anyTier ? ' Nothing is set yet: use the table below, or load an example to see how it looks.' : '') + '</p>';
    const tree = roots.length ? '<div class="panel cn-tree">' + roots.map(node).join('') + '</div>' : '';
    const grid = '<div class="panel table-panel cn-grid" style="overflow:auto"><table><thead><tr><th>Customer</th><th>Type</th><th>Supplied by</th><th>Country</th><th>Region or area</th></tr></thead><tbody>' +
      C().map(c => '<tr><td><b>' + esc(c.name) + '</b></td><td><select aria-label="Type of ' + esc(c.name) + '" onchange="cnSet(\'' + c.id + '\',\'tier\',this.value)"><option value="">Not set</option>' + TIERS.map(t => '<option' + (c.tier === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></td><td>' +
        (parentOptions(c).length ? '<select aria-label="Supplier of ' + esc(c.name) + '" onchange="cnSet(\'' + c.id + '\',\'parentId\',this.value)"><option value="">Not set</option>' + parentOptions(c).map(x => '<option value="' + x.id + '"' + (c.parentId === x.id ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</select>' : (c.tier === 'Distributor' ? 'We supply directly' : '')) +
        '</td><td><input value="' + esc(c.country || '') + '" aria-label="Country of ' + esc(c.name) + '" onchange="cnSet(\'' + c.id + '\',\'country\',this.value)"></td><td><input value="' + esc(c.region || '') + '" aria-label="Region of ' + esc(c.name) + '" onchange="cnSet(\'' + c.id + '\',\'region\',this.value)"></td></tr>').join('') + '</tbody></table></div>';
    return intro + (hasExample ? '<div class="cn-toggle"><button onclick="cnClear()">Remove example data</button></div>' : (!anyTier ? '<div class="cn-toggle"><button onclick="cnExample()">Load an example network</button></div>' : '')) + tree + grid;
  }
  window.cnSet = (id, f, v) => { const c = C().find(x => x.id === id); if (!c) return; c[f] = v || null;
    if (f === 'tier') { if (!parentOptions(c).some(x => x.id === c.parentId)) c.parentId = null; if (v === 'Distributor') c.parentId = null; }
    save(); render(); };
  window.cnView = v => { view = v; render(); };
  window.cnExample = () => {
    const P = db.products.map(p => p.id), mk = (id, name, tier, parentId, region) => ({ id, name, contact: '', email: '', phone: '', address: '', arAccount: '1200', salesAccount: '4000', warehouseId: db.warehouses[0] ? db.warehouses[0].id : '', active: true, tier, parentId, country: 'Cambodia', region, example: true });
    [mk('EX-1', 'Mekong Foods Distribution', 'Distributor', null, 'Phnom Penh'), mk('EX-2', 'Phnom Penh Wholesale Centre', 'Wholesaler', 'EX-1', 'Phnom Penh'), mk('EX-3', 'Kandal Trading', 'Wholesaler', 'EX-1', 'Kandal'),
      mk('EX-4', 'Toul Kork Mini Mart', 'Retailer', 'EX-2', 'Phnom Penh'), mk('EX-5', 'Daun Penh Grocery', 'Retailer', 'EX-2', 'Phnom Penh'), mk('EX-6', 'Ta Khmau Market Stall', 'Retailer', 'EX-3', 'Kandal'),
      mk('EX-7', 'Angkor Supply Co', 'Distributor', null, 'Siem Reap'), mk('EX-8', 'Siem Reap Wholesale', 'Wholesaler', 'EX-7', 'Siem Reap')].forEach(c => C().push(c));
    [['EX-1', 0, 40], ['EX-1', 1, 30], ['EX-2', 0, 20], ['EX-2', 2, 10], ['EX-3', 2, 15], ['EX-4', 0, 6], ['EX-5', 1, 5], ['EX-6', 2, 4], ['EX-7', 3 % P.length, 25], ['EX-8', 3 % P.length, 12]].forEach((r, i) => {
      const c = C().find(x => x.id === r[0]), p = product(P[r[1] % P.length]);
      db.sales.push({ id: 'SO-EX' + (i + 1), customer: c.name, product: p.id, qty: r[2], unitPrice: p.price, status: 'Invoiced', date: '2026-10-2' + (i % 9), example: true }); });
    save(); render(); };
  window.cnClear = () => { db.customerProfiles = C().filter(c => !c.example); db.sales = db.sales.filter(s => !s.example); save(); render(); };

  const prev = window.mastersPage;
  window.mastersPage = function () {
    const html = prev();
    if (masterView !== 'customers') return html;
    const cut = html.indexOf('<div class="page-tools">'); if (cut < 0) return html;
    const tog = '<div class="cn-toggle"><button aria-pressed="' + (view === 'list') + '" onclick="cnView(\'list\')">List</button><button aria-pressed="' + (view === 'net') + '" onclick="cnView(\'net\')">Sales network</button></div>';
    return view === 'net' ? html.slice(0, cut) + tog + netHtml() + '</div>' : html.slice(0, cut) + tog + html.slice(cut);
  };

  /* Reports in Sales > Reports, and so on the dashboard */
  const dists = () => C().filter(c => c.tier === 'Distributor').map(d => { const sub = desc(d.id), list = [d].concat(sub), sales = salesOf(list); return { d, sub, sales, total: sum(sales.map(amt)) }; }).sort((a, b) => b.total - a.total);
  if (window.WK_REPORTS) window.WK_REPORTS.sales.push(
    { id: 'network', name: 'Network by distributor', cols: ['Distributor', 'Country', 'Region', 'Wholesalers', 'Retailers', 'Wholesalers with no retailers', 'Sales', 'Share', 'Categories not sold'], money: [6], total: [3, 4, 5, 6],
      rows: () => { const all = [...new Set(db.products.map(p => p.category))], grand = sum(dists().map(x => x.total));
        return dists().map((x, i) => [x.d.name + (i === 0 && x.total > 0 ? ' (main)' : ''), x.d.country || '-', x.d.region || '-', count(x.sub, 'Wholesaler'), count(x.sub, 'Retailer'),
          x.sub.filter(w => w.tier === 'Wholesaler' && !kids(w.id).length).length, x.total, grand ? Math.round(x.total / grand * 100) + '%' : '0%',
          all.filter(k => !x.sales.some(s => cat(s.product) === k)).join(', ') || 'None']); } },
    { id: 'regions', name: 'Network by region', cols: ['Country', 'Region or area', 'Distributors', 'Wholesalers', 'Retailers', 'Sales'], money: [5], total: [2, 3, 4, 5],
      rows: () => { const m = {}; C().filter(c => c.tier).forEach(c => { const k = (c.country || '-') + '|' + (c.region || '-'); const r = m[k] = m[k] || [c.country || '-', c.region || '-', 0, 0, 0, 0]; r[2 + TIERS.indexOf(c.tier)]++; r[5] += sum(salesOf([c]).map(amt)); }); return Object.values(m).sort((a, b) => b[5] - a[5]); } },
    { id: 'mix', name: 'Product mix by distributor', cols: ['Distributor', 'Category', 'Product', 'Qty', 'Sales'], money: [4], total: [3, 4],
      rows: () => dists().flatMap(x => { const m = {}; x.sales.forEach(s => { const r = m[s.product] = m[s.product] || [x.d.name, cat(s.product), pname(s.product), 0, 0]; r[3] += num(s.qty); r[4] += amt(s); }); return Object.values(m).sort((a, b) => b[4] - a[4]); }) });
})();
