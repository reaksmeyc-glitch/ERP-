/* System blueprint (Phase 1: Discovery and blueprint). Load AFTER roadmap-revision.js:
   <script src="blueprint.js"></script>   Adds an "Open the blueprint" button to Phase 1 on the roadmap. */
(function () {
  let view = 'plan', tab = 'overview';
  const css = document.createElement('style');
  css.textContent = `
  .bp-tabs{display:flex;gap:4px;border-bottom:1px solid var(--line);margin:0 0 18px;overflow-x:auto}
  .bp-tab{border:0;background:none;padding:11px 14px;margin-bottom:-1px;font:600 12px Manrope,sans-serif;color:#52636a;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent}
  .bp-tab:hover{color:var(--ink)}.bp-tab[aria-selected="true"]{color:var(--green);border-bottom-color:var(--green)}
  .bp-tab:focus-visible,.bp-flow button:focus-visible{outline:2px solid var(--green);outline-offset:-2px;border-radius:4px}
  .bp-note{font-size:12px;color:#52636a;margin:0 0 16px;max-width:760px;line-height:1.6}
  .bp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
  .bp-card{padding:16px 18px}.bp-card h3{font:700 13px Manrope,sans-serif;margin:0 0 4px}
  .bp-card p{font-size:11px;color:#6e7d84;margin:0 0 8px;line-height:1.6}
  .bp-card .bp-post{border-top:1px solid var(--line);padding-top:8px;margin-top:8px}
  .bp-card button{border:0;background:none;padding:0;font:600 11px Manrope,sans-serif;color:var(--green);cursor:pointer;margin-top:8px}
  .bp-proc{padding:16px 18px;margin-bottom:14px}.bp-proc h3{font:700 14px Manrope,sans-serif;margin:0 0 12px}
  .bp-flow{display:flex;flex-wrap:wrap;gap:8px 4px;list-style:none;margin:0 0 12px;padding:0}
  .bp-flow li{display:flex;flex-direction:column;align-items:flex-start;gap:5px;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:#fafcfc;font-size:12px;font-weight:600}
  .bp-flow li:not(:last-child):after{content:"\\2192";position:absolute}
  .bp-flow li{position:relative;margin-right:14px}.bp-flow li:not(:last-child):after{right:-16px;top:12px;color:#9aa8ad}
  .bp-flow button{border:0;background:none;padding:0;font:inherit;color:var(--ink);cursor:pointer;text-align:left}.bp-flow button:hover{color:var(--green)}
  .bp-post-list{font-size:11px;color:#52636a;line-height:1.8;margin:0;padding-left:18px}
  .bp-st{font-size:10px;font-weight:600;padding:2px 9px;border-radius:999px;border:1px solid #d5dee0;color:#52636a;background:#fff;white-space:nowrap}
  .bp-st[data-s="built"]{background:var(--green);border-color:var(--green);color:#fff}
  .bp-st[data-s="partial"]{background:#e5f4f5;border-color:#a9d6da;color:#066a75}
  .bp-table{margin-bottom:16px}.bp-table td,.bp-table th{font-size:12px;vertical-align:top}`;
  document.head.appendChild(css);

  const ST = { built: 'Built', partial: 'Partly', planned: 'Planned' };
  const chip = s => '<span class="bp-st" data-s="' + s + '">' + ST[s] + '</span>';
  const table = (heads, rows) => '<div class="panel table-panel bp-table" style="overflow:auto"><table><thead><tr>' +
    heads.map(h => '<th>' + h + '</th>').join('') + '</tr></thead><tbody>' +
    rows.map(r => '<tr>' + r.map((c, i) => '<td>' + (i === 0 ? '<b>' + c + '</b>' : c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
  const flow = steps => '<ol class="bp-flow">' + steps.map(s => '<li>' +
    (s[2] ? '<button onclick="go(\'' + s[2] + '\')">' + s[0] + '</button>' : '<span>' + s[0] + '</span>') + chip(s[1]) + '</li>').join('') + '</ol>';

  const MODULES = [
    ['Master data', 'The shared records', 'Materials, customers, suppliers, warehouses, accounts. Every other area reads from here.', '', 'masters'],
    ['Sales', 'Customer orders', 'Sales order, delivery, invoice.', 'Revenue, receivable, cost of goods sold', 'sales'],
    ['Purchasing', 'Buying with budget control', 'Purchase order, goods receipt, supplier invoice.', 'Stock, expense or asset, and the payable', 'purchasing'],
    ['Material planning', 'What to reorder', 'Compares stock with demand and inbound orders.', 'Creates purchase orders', 'planning'],
    ['Inventory', 'Stock and its value', 'Receipts, issues, adjustments.', 'Inventory asset', 'inventory'],
    ['Finance', 'The accounting record', 'Journals, receivables, payables, trial balance.', 'Receives postings from every area', 'finance']];
  const PROCESSES = [
    ['Order to cash', [['Quotation', 'planned', ''], ['Sales order', 'built', 'sales'], ['Delivery', 'built', 'sales'], ['Invoice', 'built', 'sales'], ['Credit note', 'planned', ''], ['Customer payment', 'planned', '']],
      ['Invoice: receivable and revenue (plus tax)', 'Delivery: cost of goods sold and stock reduced', 'Payment: cash or bank and receivable cleared']],
    ['Procure to pay', [['Purchase request', 'planned', ''], ['Purchase order with budget check', 'built', 'purchasing'], ['Goods receipt', 'built', 'purchasing'], ['Supplier invoice', 'built', 'purchasing'], ['Payment', 'planned', '']],
      ['Goods receipt: stock, expense or asset, and unbilled payable', 'Supplier invoice: unbilled payable moves to payable', 'Payment: payable cleared against bank']],
    ['Inventory control', [['Receive goods', 'built', 'inventory'], ['Issue to customer', 'built', 'inventory'], ['Adjustment', 'built', 'inventory'], ['Transfer between warehouses', 'planned', ''], ['Stock count', 'planned', ''], ['Valuation', 'partial', 'inventory']],
      ['Every stock movement should create an accounting entry', 'Stock is not yet kept per warehouse']],
    ['Month-end close', [['Review journals', 'built', 'finance'], ['Reconcile receivables and payables', 'partial', 'finance'], ['Reconcile bank', 'planned', ''], ['Accruals', 'planned', ''], ['Lock the period', 'planned', ''], ['Financial statements', 'partial', 'finance']],
      ['The trial balance check exists today', 'Locking periods stops late changes to closed months']]];
  const ROLES = ['Admin', 'Sales', 'Purchasing', 'Warehouse', 'Accountant', 'Manager'];
  const RIGHTS = [
    ['Manage users and roles', 'Full', '-', '-', '-', '-', '-'], ['Edit master data', '-', 'Own area', 'Own area', 'Own area', 'Own area', 'View'],
    ['Create sales order', '-', 'Create', 'View', 'View', 'View', 'View'], ['Post customer invoice', '-', 'Create', '-', '-', 'Approve', 'View'],
    ['Create purchase order', '-', '-', 'Create', '-', 'View', 'View'], ['Issue purchase order', '-', '-', '-', '-', '-', 'Approve'],
    ['Approve monthly budget', '-', '-', '-', '-', 'Create', 'Approve'], ['Receive goods', '-', '-', 'View', 'Create', 'View', 'View'],
    ['Post stock adjustment', '-', '-', '-', 'Create', 'View', 'Approve'], ['Post journals and close period', '-', '-', '-', '-', 'Create', 'Approve']];
  const BODY = {
    overview: () => '<p class="bp-note">This is the finished system on one page. Master data is the foundation. Each work area creates documents, and every document that moves stock or money posts to Finance. Click a name to open that area.</p><div class="bp-grid">' +
      MODULES.map(m => '<section class="panel bp-card"><h3>' + m[0] + '</h3><p><b>' + m[1] + '</b></p><p>' + m[2] + '</p>' +
        (m[3] ? '<p class="bp-post">Posts to accounting: ' + m[3] + '</p>' : '') + '<button onclick="go(\'' + m[4] + '\')">Open ' + m[0] + '</button></section>').join('') + '</div>',
    processes: () => '<p class="bp-note">The four main business flows, step by step. The badge shows how much of each step exists in the trial today.</p>' +
      PROCESSES.map(p => '<section class="panel bp-proc"><h3>' + p[0] + '</h3>' + flow(p[1]) + '<ul class="bp-post-list">' + p[2].map(x => '<li>' + x + '</li>').join('') + '</ul></section>').join(''),
    roles: () => '<p class="bp-note">A proposal to react to, not a decision. The rule behind it is that the person who creates a document should not be the person who approves it. Approval limits (amounts) still need to be agreed.</p>' +
      table(['Action'].concat(ROLES), RIGHTS.map(r => r.map(c => c === '-' ? '&ndash;' : c))) +
      table(['Master data', 'Owner (proposed)', 'Changes approved by'], [['Materials', 'Purchasing', 'Accountant, for cost and accounts'], ['Customers', 'Sales', 'Accountant, for credit and accounts'], ['Suppliers', 'Purchasing', 'Accountant, for terms and bank'], ['Warehouses', 'Warehouse', 'Manager'], ['Chart of accounts and tax codes', 'Accountant', 'Manager'], ['Budgets', 'Accountant', 'Manager']]),
    reports: () => '<p class="bp-note">The questions managers need answered. If a report is not on this list, the system is probably missing the data behind it.</p>' +
      table(['Report', 'Question it answers', 'Status'], [['Stock on hand and value', 'What do we hold and what is it worth?', chip('built')], ['Reorder and shortages', 'What must we buy?', chip('built')], ['Open purchase orders and late deliveries', 'What is still coming, and what is late?', chip('built')], ['Open sales orders', 'What are customers waiting for?', chip('built')], ['Budget against committed', 'Can we still spend here?', chip('built')], ['Receivables and payables', 'Who owes whom?', chip('built')], ['Trial balance', 'Do debits equal credits?', chip('built')], ['Supply chain measures', 'Are we meeting our targets?', chip('built')], ['Receivable and payable ageing', 'Who is late paying, and who are we late paying?', chip('planned')], ['Profit and loss, balance sheet', 'How is the business doing?', chip('planned')], ['VAT summary', 'What do we owe or reclaim?', chip('planned')]]),
    tax: () => '<p class="bp-note">These are questions, not rules. The General Department of Taxation and your accountant decide the answers; the third column shows what the system must be built to hold. Take this list to your accountant.</p>' +
      table(['Topic', 'Ask your accountant', 'The system needs'], [['VAT', 'Which rate applies to which sales, and which cases are zero-rated or exempt?', 'Tax code on every invoice line; tax ID on customers and suppliers'], ['Tax invoices', 'What must a tax invoice show, how is it numbered, and must it be in Khmer?', 'Document numbering and bilingual templates'], ['Withholding tax', 'Which payments carry it, at what rate, and who files the certificate?', 'Withholding codes on supplier invoices and payments'], ['Currency', 'Which is the base currency, and which exchange rate and date apply for USD and KHR?', 'Currency and exchange rate tables; amounts in both currencies'], ['Fixed assets', 'Which depreciation methods and rates are allowed?', 'An asset register with depreciation'], ['Returns', 'Which returns are due, how often, and by when?', 'VAT and withholding summary reports'], ['Records', 'How long must records be kept, and in what form?', 'Audit trail, backups, retention rules']]),
    migration: () => '<p class="bp-note">Moving today\u2019s data into the new system is a project in itself. Each load is checked against a total, so nothing is trusted on sight.</p>' + flow([['Clean the data', 'planned', ''], ['Map columns', 'planned', ''], ['Test load', 'planned', ''], ['Reconcile', 'planned', ''], ['Sign off', 'planned', ''], ['Go live', 'planned', '']]) +
      table(['Data', 'What to load', 'Check by'], [['Chart of accounts', 'Accounts and their types', 'Accountant reviews the types'], ['Materials', 'Code, name, group, unit, cost, warehouse', 'Count and total stock value match'], ['Customers and suppliers', 'Names, tax ID, terms, accounts', 'Counts match; duplicates removed'], ['Opening stock', 'Quantity per material and warehouse', 'A physical count agrees'], ['Open orders', 'Unfinished purchase and sales orders', 'Order totals match the old list'], ['Opening balances', 'Trial balance at the start date', 'Debits equal credits; receivables and payables match their lists']])
  };
  const TABS = [['overview', 'Overview'], ['processes', 'Processes'], ['roles', 'Roles and approvals'], ['reports', 'Reports'], ['tax', 'Cambodia tax and currency'], ['migration', 'Data migration']];
  window.bpOpen = () => { view = 'blueprint'; tab = 'overview'; render(); };
  window.bpBack = () => { view = 'plan'; render(); };
  window.bpTab = t => { tab = t; render(); };
  const plan = window.roadmapPage;
  window.roadmapPage = function () {
    if (view !== 'blueprint') {
      const d = '<p>Agree how the business runs before building the real system.</p>';
      return plan().replace(d, d + '<button class="btn btn-primary" style="margin-top:10px" onclick="bpOpen()">Open the blueprint</button>');
    }
    return heading('System blueprint', 'How the ABC ERP will work: flows, people, reports and data', '<button class="btn" onclick="bpBack()">Back to plan</button>') +
      '<div class="bp-tabs" role="tablist">' + TABS.map(t => '<button class="bp-tab" role="tab" aria-selected="' + (t[0] === tab) + '" onclick="bpTab(\'' + t[0] + '\')">' + t[1] + '</button>').join('') + '</div>' + BODY[tab]();
  };
})();
