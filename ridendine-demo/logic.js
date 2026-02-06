let orders=[], logs=[];

function show(id){
 document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
 document.getElementById(id).classList.add('active');
}

function createOrder(){
 let v=Number(orderValue.value);
 orders.push(v);
 orderList.innerHTML+=`<li>$${v}</li>`;
}

function runSim(){
 logs=[];
 let count=Number(scenario.value);
 let drivers=Math.ceil(count/10);
 let revenue=0,cost=0,time=0;

 for(let i=0;i<count;i++){
  let val=50+Math.random()*50;
  let platform=val*0.4;
  let dcost=6+Math.random()*4;
  let t=15+Math.random()*25;

  revenue+=platform;
  cost+=dcost;
  time+=t;
  logs.push(`Order ${i+1}: ${t.toFixed(1)}min | $${platform.toFixed(2)}`);
 }

 log.innerText=logs.slice(0,20).join('\n')+'\n...';

 stats.innerHTML='';
 stats.innerHTML+=`<tr><td>Orders</td><td>${count}</td></tr>`;
 stats.innerHTML+=`<tr><td>Drivers</td><td>${drivers}</td></tr>`;
 stats.innerHTML+=`<tr><td>Avg Time</td><td>${(time/count).toFixed(1)} min</td></tr>`;
 stats.innerHTML+=`<tr><td>Platform Revenue</td><td>$${revenue.toFixed(2)}</td></tr>`;
 stats.innerHTML+=`<tr><td>Delivery Cost</td><td>$${cost.toFixed(2)}</td></tr>`;
 stats.innerHTML+=`<tr><td>Net Margin</td><td>$${(revenue-cost).toFixed(2)}</td></tr>`;
}


/* ===== v0.6.0 additions: driver pool controls + routes + clusters + compare ===== */
function getDriverPoolCount(orderCount){
  const modeEl = document.getElementById('driverMode');
  const countEl = document.getElementById('driverCount');
  const mode = modeEl ? modeEl.value : 'auto';
  if(mode === 'manual'){
    const n = Math.max(1, Number(countEl?.value || 1));
    return n;
  }
  return Math.max(10, Math.ceil(orderCount/10));
}

// Simple color hash for batch IDs
const BATCH_COLORS = ['#ff7a00','#00a9a5','#111827','#7c3aed','#ef4444','#0ea5e9','#22c55e','#f97316','#14b8a6','#a855f7'];
function batchColor(id){
  if(!id) return '#64748b';
  let n=0; for(let i=0;i<id.length;i++) n=(n+id.charCodeAt(i))%BATCH_COLORS.length;
  return BATCH_COLORS[n];
}

// Attempt to hook into existing driver generation by monkey-patching if demo exposes generateDrivers/orderCount variables.
// If your existing code uses a different function name, this still won't break anything; it just won't override.
(function(){
  try{
    if(typeof window.generateDrivers === 'function'){
      const _gen = window.generateDrivers;
      window.generateDrivers = function(orderCount){
        const n = getDriverPoolCount(orderCount || window.orders?.length || 50);
        return _gen(n);
      }
    }
  }catch(e){}
})();

// Route + cluster drawing: if canvas draw function exists, extend it without breaking existing map rendering.
(function(){
  const c = document.getElementById('map') || document.getElementById('mapCanvas') || document.querySelector('canvas');
  if(!c) return;
  const ctx = c.getContext('2d');

  function project(lat,lng,b){
    const W=c.width, H=c.height;
    const pad=40;
    const x=pad + ((lng-b.minLng)/(b.maxLng-b.minLng||1))*(W-pad*2);
    const y=pad + ((b.maxLat-lat)/(b.maxLat-b.minLat||1))*(H-pad*2);
    return {x,y};
  }

  function boundsFromPoints(points){
    const lats=points.map(p=>p.lat), lngs=points.map(p=>p.lng);
    return {minLat:Math.min(...lats),maxLat:Math.max(...lats),minLng:Math.min(...lngs),maxLng:Math.max(...lngs)};
  }

  // expose helper for existing draw routines if needed
  window.__rd_project = project;
  window.__rd_bounds = boundsFromPoints;

  window.__rd_drawRoutesAndClusters = function(state, tMin){
    if(!state || !state.batches) return;
    const pts=[];
    (state.cooks||[]).forEach(x=>pts.push({lat:x.lat||x.loc?.lat, lng:x.lng||x.loc?.lng}));
    (state.orders||[]).forEach(o=>pts.push({lat:o.dropLat||o.dropLoc?.lat, lng:o.dropLng||o.dropLoc?.lng}));
    if(pts.length<2) return;
    const b=boundsFromPoints(pts);

    // clusters
    ctx.save();
    ctx.globalAlpha=0.12;
    ctx.lineWidth=2;
    (state.batches||[]).forEach(bat=>{
      const orders = bat.orders || [];
      if(!orders.length) return;
      const first = orders[0];
      const orderAt = first.orderAtMin ?? first.orderAt ?? 0;
      if(orderAt > tMin) return;
      let lat=0,lng=0;
      orders.forEach(o=>{
        const dl = o.dropLoc || {lat:o.dropLat, lng:o.dropLng};
        lat+=dl.lat; lng+=dl.lng;
      });
      lat/=orders.length; lng/=orders.length;
      const p=project(lat,lng,b);
      ctx.strokeStyle=batchColor(bat.id||bat.batchId);
      ctx.beginPath(); ctx.arc(p.x,p.y,30,0,Math.PI*2); ctx.stroke(); // visual cluster circle
    });
    ctx.restore();

    // routes (if batchResults exist)
    if(!state.batchResults) return;
    ctx.save();
    ctx.globalAlpha=0.65;
    ctx.lineWidth=3;
    state.batchResults.forEach(br=>{
      const depart = br.departAtMin ?? br.departAt ?? 0;
      if(depart > tMin) return;
      const bat = (state.batches||[]).find(x=>(x.id||x.batchId)===(br.batchId||br.id));
      if(!bat) return;
      const cook = bat.cookLoc || bat.cook || {lat:bat.cookLat, lng:bat.cookLng};
      const orders = (bat.orders||[]).slice().sort((a,b)=>(a.deliveredAtMin||1e9)-(b.deliveredAtMin||1e9));
      const ptsRoute=[cook].concat(orders.map(o=>o.dropLoc || {lat:o.dropLat, lng:o.dropLng}));
      ctx.strokeStyle=batchColor(br.batchId||bat.id);
      ctx.beginPath();
      ptsRoute.forEach((pt,i)=>{
        const pp=project(pt.lat, pt.lng, b);
        if(i===0) ctx.moveTo(pp.x,pp.y); else ctx.lineTo(pp.x,pp.y);
      });
      ctx.stroke();
    });
    ctx.restore();
  };
})();

// Scenario compare: runs three simulations by clicking existing buttons if present.
(function(){
  const btn = document.getElementById('btnCompare');
  if(!btn) return;
  btn.addEventListener('click', ()=>{
    const status = document.getElementById('compareStatus');
    const table = document.getElementById('compareTable');
    if(status) status.textContent='Running…';

    const orderCountEl = document.getElementById('orderCount');
    const hoursEl = document.getElementById('hours');
    const genBtn = document.getElementById('btnGenerate') || document.querySelector('[data-generate]');
    const runBtn = document.getElementById('btnRun') || document.querySelector('[data-run]');
    const kMargin = document.getElementById('kMargin');
    const kBatches = document.getElementById('kBatches');
    const kBatched = document.getElementById('kBatched');
    const kDrivers = document.getElementById('kDrivers');
    const kAvg = document.getElementById('kAvg');

    const scenarios=[50,100,200];
    const results=[];

    function readTotals(){
      // try read from any totals table if exists
      const totals = Array.from(document.querySelectorAll('#totalsTable td:last-child')).map(x=>x.textContent.trim());
      return {platformRev: totals[0]||'—', driverCost: totals[2]||'—'};
    }

    function runOne(i){
      if(i>=scenarios.length){
        // render
        const headers=['Orders','Batches','Batched %','Drivers','Avg Delivery (min)','Platform Rev','Driver Cost','Net Margin'];
        const h = `<tr>${headers.map(x=>`<th>${x}</th>`).join('')}</tr>`;
        const b = results.map(r=>`<tr>${headers.map(k=>`<td>${r[k]}</td>`).join('')}</tr>`).join('');
        table.innerHTML = h + b;
        if(status) status.textContent='Completed';
        return;
      }
      const sc=scenarios[i];
      if(orderCountEl) orderCountEl.value=String(sc);
      if(genBtn) genBtn.click();
      if(runBtn) runBtn.click();

      setTimeout(()=>{
        const totals=readTotals();
        results.push({
          'Orders': String(sc),
          'Batches': kBatches?.textContent || '—',
          'Batched %': kBatched?.textContent || '—',
          'Drivers': kDrivers?.textContent || '—',
          'Avg Delivery (min)': (kAvg?.textContent||'—').replace(' min',''),
          'Platform Rev': totals.platformRev,
          'Driver Cost': totals.driverCost,
          'Net Margin': kMargin?.textContent || '—'
        });
        runOne(i+1);
      }, 150);
    }

    runOne(0);
  });
})();

