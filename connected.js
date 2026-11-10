function connectedPage(){
  const items=[
    ['✉','Communication','Announcements, event updates, newsletters, and member notifications.','Communications hub'],
    ['▣','Digital Access','Member app, secure sign-in, QR check-in, and access permissions.','Identity and access'],
    ['▤','Member Data','A shared member profile, membership status, preferences, and activity history.','Member 360'],
    ['♙','CRM','Prospect pipeline, onboarding, renewals, service requests, and relationship history.','Customer relationship']
  ];
  return heading('Connected platform','A shared member experience connected across communication, access, data, and CRM.','<span class="status received">Product concept</span>')+
  '<div class="notice"><b>Reference direction:</b> The attached Northstar Club Management Software image places one connected platform at the center of four capabilities. This page translates that concept into a module map for the trial.</div>'+
  '<div class="connected-map"><svg class="map-lines" viewBox="0 0 1000 470" preserveAspectRatio="none" aria-hidden="true"><path d="M500 235 C390 235 360 105 220 105M500 235 C610 235 640 105 780 105M500 235 C390 235 360 365 220 365M500 235 C610 235 640 365 780 365"/></svg><div class="hub"><div class="hub-mark">NS</div><b>Northstar</b><small>CONNECTED PLATFORM</small></div>'+items.map((x,i)=>'<article class="connected-node node-'+i+'"><span class="node-icon">'+x[0]+'</span><div><div class="node-kicker">'+x[3]+'</div><h2>'+x[1]+'</h2><p>'+x[2]+'</p><span class="status draft">Planned module</span></div></article>').join('')+'</div>'+
  '<div class="panel connected-principle"><div><div class="panel-title">One member record, shared across the platform</div><div class="panel-subtitle">A member update should flow to the teams and services that need it, with permissions and an audit trail.</div></div><div class="connected-tags"><span>Consent</span><span>Role-based access</span><span>Audit history</span><span>Integrations</span></div></div>';
}
