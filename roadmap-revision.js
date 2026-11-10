/* Revised Roadmap page for ABC ERP.
   Load AFTER master-data.js and BEFORE workspace.js in index.html:
   <script src="roadmap-revision.js"></script>
   Click a phase's status button to cycle: Not started > In progress > Done. Saved in this browser. */
(function () {
  const KEY = 'abc-erp-roadmap-v1';
  const STATES = ['Not started', 'In progress', 'Done'];
  const PHASES = [
    { t: 'Local trial', s: 2, d: 'Prove the connected processes with the team using demo data.',
      i: ['Sales order, shipment, invoice, and journals', 'Purchase order, goods receipt, and payable journal', 'Stock inquiry and reorder flags'] },
    { t: 'Discovery and blueprint', s: 0, d: 'Agree how the business runs before building the real system.',
      i: ['Map order-to-cash, procure-to-pay, inventory, and month-end close', 'Confirm Cambodian VAT, withholding tax, KHR and USD handling with an accountant', 'Define roles, approvals, data owners, reports, and what data to migrate'] },
    { t: 'ERP foundation', s: 1, d: 'Replace browser storage with a secure database shared by all users.',
      i: ['PostgreSQL schema and goods-receipt API (started)', 'Login, roles, and permissions', 'Audit history, tax codes, document numbering, and backups'] },
    { t: 'Core operations', s: 0, d: 'Build full document flows, including corrections.',
      i: ['Sales: order, delivery, invoice, credit note, collection', 'Purchasing: request, order, receipt, supplier invoice, payment', 'Stock by warehouse: reservations, transfers, counts, valuation'] },
    { t: 'Finance and controls', s: 0, d: 'Make accounting the trusted record behind every transaction.',
      i: ['Chart of accounts, VAT, tax invoices, and bank reconciliation', 'Posting periods, approvals, close checklist, and statements', 'Separation of duties and a change history nobody can edit'] },
    { t: 'Pilot and rollout', s: 0, d: 'Test with real users and real data before going live.',
      i: ['Load and reconcile masters, open orders, and opening balances', 'User testing, training, security review, and restore test', 'Pilot one location, fix issues, then roll out in waves'] }
  ];
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const stateOf = i => { const o = load(); return o[i] === undefined ? PHASES[i].s : o[i]; };
  window.cycleRoadmap = function (i) {
    const o = load(); o[i] = (stateOf(i) + 1) % 3;
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
    render();
  };

  const css = document.createElement('style');
  css.textContent = `
  .rm-summary{display:flex;align-items:center;gap:16px;margin-bottom:18px}
  .rm-summary b{font-size:12px;white-space:nowrap}
  .rm-bar{flex:1;height:7px;border-radius:4px;background:#e2e8e9;overflow:hidden}
  .rm-bar span{display:block;height:100%;background:var(--green);transition:width .3s}
  .rm-list{position:relative;display:grid;gap:14px;padding-left:26px}
  .rm-list:before{content:"";position:absolute;left:7px;top:8px;bottom:8px;width:2px;background:#dbe3e5}
  .rm-item{position:relative;padding:16px 18px}
  .rm-item:before{content:"";position:absolute;left:-26px;top:20px;width:16px;height:16px;border-radius:50%;background:#fff;border:2px solid #b9c5c9}
  .rm-item[data-s="1"]:before{border-color:var(--green);background:#e5f4f5}
  .rm-item[data-s="2"]:before{border-color:var(--green);background:var(--green)}
  .rm-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
  .rm-head h3{font:700 14px Manrope,sans-serif;margin:0}
  .rm-item p{font-size:11px;color:#6e7d84;margin:4px 0 0}
  .rm-item ul{font-size:11px;line-height:1.8;color:#40545b;margin:10px 0 0;padding-left:18px}
  .rm-state{border:1px solid #cfd9dc;background:#fff;border-radius:999px;padding:5px 12px;font-size:10px;font-weight:600;color:#52636a;cursor:pointer}
  .rm-state:hover{border-color:var(--green)}
  .rm-state:focus-visible{outline:2px solid var(--green);outline-offset:2px}
  .rm-item[data-s="1"] .rm-state{background:#e5f4f5;border-color:#a9d6da;color:#066a75}
  .rm-item[data-s="2"] .rm-state{background:var(--green);border-color:var(--green);color:#fff}
  @media(max-width:720px){.rm-head{align-items:flex-start;flex-direction:column}}`;
  document.head.appendChild(css);

  window.roadmapPage = function () {
    const states = PHASES.map((p, i) => stateOf(i));
    const done = states.filter(s => s === 2).length, working = states.filter(s => s === 1).length;
    const pct = Math.round((done + working * 0.5) / PHASES.length * 100);
    return heading('Implementation plan', 'From this trial to a dependable ERP for ABC Co Ltd', '') +
      '<div class="notice"><b>Scope:</b> A full SAP-level ERP is a long program of work. This trial shows how the processes connect. It is not yet production accounting software, and Cambodian tax rules must be confirmed with your accountant.</div>' +
      '<div class="rm-summary"><b>' + done + ' of ' + PHASES.length + ' phases done' + (working ? ', ' + working + ' in progress' : '') + '</b><div class="rm-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + pct + '%"></span></div></div>' +
      '<div class="rm-list">' + PHASES.map((p, i) =>
        '<div class="panel rm-item" data-s="' + states[i] + '"><div class="rm-head"><h3>Phase ' + i + ': ' + p.t + '</h3>' +
        '<button class="rm-state" onclick="cycleRoadmap(' + i + ')" title="Click to change status">' + STATES[states[i]] + '</button></div>' +
        '<p>' + p.d + '</p><ul>' + p.i.map(x => '<li>' + x + '</li>').join('') + '</ul></div>').join('') + '</div>';
  };
})();
