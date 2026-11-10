(() => {
  const input = document.querySelector('#globalSearch');
  if (!input) return;
  const nav = document.querySelector('#nav');
  const groups = [{before:'sales',label:'OPERATIONS'},{before:'finance',label:'CONTROL'}];
  groups.forEach(group => {
    const button = nav.querySelector(`[data-page="${group.before}"]`);
    if (button) { const label=document.createElement('div'); label.className='nav-caption nav-group'; label.textContent=group.label; button.before(label); }
  });
  const popup=document.createElement('div'); popup.className='search-results'; popup.hidden=true;
  input.parentElement.append(popup);
  const pages=[['overview','Overview','Workspace'],['sales','Sales orders','Operations'],['purchasing','Purchase orders','Operations'],['planning','Material planning','Operations'],['products','Product hierarchy','Operations'],['supplychain','Supply chain KPIs','Operations'],['inventory','Inventory','Operations'],['finance','Finance & journals','Control'],['masters','Master data','Control'],['roadmap','Setup & plan','Control']];
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function lookup(q){
    q=q.trim().toLowerCase(); if(!q){popup.hidden=true;return}
    const hits=[];
    pages.filter(x=>x[1].toLowerCase().includes(q)).forEach(x=>hits.push({label:x[1],detail:x[2],page:x[0]}));
    db.sales.filter(x=>(x.id+' '+x.customer).toLowerCase().includes(q)).slice(0,4).forEach(x=>hits.push({label:x.id+' · '+x.customer,detail:'Sales order',page:'sales',term:x.id}));
    db.purchases.filter(x=>(x.id+' '+x.vendor).toLowerCase().includes(q)).slice(0,4).forEach(x=>hits.push({label:x.id+' · '+x.vendor,detail:'Purchase order',page:'purchasing',term:x.id}));
    db.products.filter(x=>(x.id+' '+x.name).toLowerCase().includes(q)).slice(0,4).forEach(x=>hits.push({label:x.name,detail:x.id+' · Product',page:'inventory',term:x.name}));
    popup.innerHTML=hits.length?hits.slice(0,8).map((x,i)=>`<button class="search-result" data-index="${i}"><span class="result-icon">⌕</span><span><b>${esc(x.label)}</b><small>${esc(x.detail)}</small></span><span class="result-arrow">↵</span></button>`).join(''):'<div class="search-empty">No matching pages or records</div>';
    popup.hidden=false;
    popup.querySelectorAll('.search-result').forEach((button,i)=>button.onclick=()=>{const hit=hits[i];go(hit.page);popup.hidden=true;input.value='';if(hit.term){const tableSearch=document.querySelector('#tableSearch');if(tableSearch){tableSearch.value=hit.term;tableSearch.dispatchEvent(new Event('input'));}}});
  }
  input.addEventListener('input',()=>lookup(input.value));
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){popup.hidden=true;input.blur()}if(e.key==='Enter'){const first=popup.querySelector('.search-result');if(first)first.click()}});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();input.focus();input.select()}});
  document.addEventListener('click',e=>{if(!input.parentElement.contains(e.target))popup.hidden=true});
})();
