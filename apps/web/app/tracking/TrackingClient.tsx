"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";

const STATUSES = ["pending","accepted","preparing","ready","picked_up","delivered"];
const LABELS: any = {pending:"Order Placed",accepted:"Accepted",preparing:"Being Prepared",ready:"Ready for Pickup",picked_up:"Out for Delivery",delivered:"Delivered!"};
const ICONS: any = {pending:"📋",accepted:"✅",preparing:"👨‍🍳",ready:"📦",picked_up:"🚗",delivered:"🎉"};

export default function TrackingClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(()=>{
    const supabase = getSupabaseClient();
    if(!token){ setLoading(false); return; }
    supabase.from("orders").select("*, chefs(*, profiles(name))").eq("tracking_token",token).single()
      .then(({data})=>{ setOrder(data); setLoading(false); });
    const channel = supabase.channel(`track-${token}`)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"orders",filter:`tracking_token=eq.${token}`},
        payload=>setOrder((prev:any)=>({...prev,...payload.new})))
      .subscribe();
    return ()=>{ supabase.removeChannel(channel); };
  },[token]);

  const currentStep = order ? STATUSES.indexOf(order.status) : -1;

  if(!token && !loading) return (
    <div>
      <nav className="nav"><Link href="/" className="nav-brand"><img src="/logo.svg" alt="RideNDine" style={{height:32,width:"auto",verticalAlign:"middle"}} /></Link></nav>
      <div style={{textAlign:"center",padding:80}}>
        <div style={{fontSize:64,marginBottom:16}}>📦</div>
        <h2 style={{marginBottom:24}}>Track Your Order</h2>
        <div style={{maxWidth:400,margin:"0 auto"}}>
          <input className="form-input" placeholder="Enter tracking token e.g. TRK-ABC123"
            value={tokenInput} onChange={e=>setTokenInput(e.target.value)} style={{marginBottom:12}}/>
          <Link href={`/tracking?token=${tokenInput}`} className="btn btn-primary btn-lg" style={{width:"100%",display:"block",textAlign:"center"}}>Track Order</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <nav className="nav"><Link href="/" className="nav-brand"><img src="/logo.svg" alt="RideNDine" style={{height:32,width:"auto",verticalAlign:"middle"}} /></Link></nav>
      <div className="page" style={{maxWidth:600}}>
        {loading ? <div style={{textAlign:"center",padding:60}}>Loading...</div> : !order ? (
          <div className="alert alert-error">Order not found. Check your tracking token.</div>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
              <span className="live-dot"></span>
              <span style={{fontSize:13,color:"var(--text-secondary)"}}>Live tracking · Token: {token}</span>
            </div>
            <div className="card card-body" style={{marginBottom:24,textAlign:"center"}}>
              <div style={{fontSize:56,marginBottom:12}}>{ICONS[order.status]}</div>
              <h2 style={{fontSize:24,fontWeight:700}}>{LABELS[order.status]}</h2>
              <p style={{color:"var(--text-secondary)",marginTop:8}}>From {order.chefs?.profiles?.name||"Chef"}</p>
            </div>
            <div className="card card-body">
              <h3 style={{fontWeight:700,marginBottom:20}}>Progress</h3>
              <div className="timeline">
                {STATUSES.map((s,i)=>(
                  <div key={s} className="timeline-item">
                    <div className={`timeline-dot ${i<currentStep?"done":i===currentStep?"active":""}`}></div>
                    <div style={{fontWeight:i<=currentStep?700:400,color:i>currentStep?"var(--text-secondary)":"var(--text)"}}>{LABELS[s]}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
