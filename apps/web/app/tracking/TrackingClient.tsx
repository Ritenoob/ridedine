"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { MapView } from "../../components/MapView";

const STATUSES = ["pending","accepted","preparing","ready","picked_up","delivered"];
const LABELS: any = {pending:"Order Placed",accepted:"Accepted",preparing:"Being Prepared",ready:"Ready for Pickup",picked_up:"Out for Delivery",delivered:"Delivered!"};
const ICONS: any = {pending:"📋",accepted:"✅",preparing:"👨‍🍳",ready:"📦",picked_up:"🚗",delivered:"🎉"};

interface Delivery {
  id: string;
  driver_lat: number | null;
  driver_lng: number | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  dropoff_lat: number | null;
  dropoff_lng: number | null;
  pickup_address: string;
  dropoff_address: string;
}

export default function TrackingClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [order, setOrder] = useState<any>(null);
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState("");

  useEffect(()=>{
    const supabase = getSupabaseClient();
    if(!token){ setLoading(false); return; }

    // Fetch order with delivery data
    supabase.from("orders").select("*, chefs(*, profiles(name))").eq("tracking_token",token).single()
      .then(async ({data})=>{
        setOrder(data);

        // Fetch delivery if order is picked_up or later
        if (data && (data.status === 'picked_up' || data.status === 'delivered')) {
          const { data: deliveryData } = await supabase
            .from('deliveries')
            .select('*')
            .eq('order_id', data.id)
            .single();

          if (deliveryData) {
            setDelivery(deliveryData);
          }
        }

        setLoading(false);
      });

    // Subscribe to order updates
    const orderChannel = supabase.channel(`track-${token}`)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"orders",filter:`tracking_token=eq.${token}`},
        async payload=>{
          setOrder((prev:any)=>({...prev,...payload.new}));

          // Fetch delivery when order transitions to picked_up
          if (payload.new.status === 'picked_up' || payload.new.status === 'delivered') {
            const { data: deliveryData } = await supabase
              .from('deliveries')
              .select('*')
              .eq('order_id', payload.new.id)
              .single();

            if (deliveryData) {
              setDelivery(deliveryData);
            }
          }
        })
      .subscribe();

    // Subscribe to delivery location updates
    const deliveryChannel = supabase.channel(`delivery-location-${token}`)
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"deliveries"},
        payload=>{
          if (delivery && payload.new.id === delivery.id) {
            setDelivery((prev) => prev ? {...prev, ...payload.new} : null);
          }
        })
      .subscribe();

    return ()=>{
      supabase.removeChannel(orderChannel);
      supabase.removeChannel(deliveryChannel);
    };
  },[token, delivery?.id]);

  const currentStep = order ? STATUSES.indexOf(order.status) : -1;

  // Show map when order is out for delivery and we have location data
  const showMap = delivery && (
    delivery.pickup_lat && delivery.pickup_lng &&
    delivery.dropoff_lat && delivery.dropoff_lng
  );

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
      <div className="page" style={{maxWidth:800}}>
        {loading ? <div style={{textAlign:"center",padding:60}}>Loading...</div> : !order ? (
          <div className="alert alert-error">Order not found. Check your tracking token.</div>
        ) : (
          <>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:24}}>
              <span className="live-dot"></span>
              <span style={{fontSize:13,color:"var(--text-secondary)"}}>Live tracking · Token: {token}</span>
            </div>

            {/* Map View - shown when delivery is in progress */}
            {showMap && (
              <div className="card card-body" style={{marginBottom:24,padding:0,overflow:"hidden"}}>
                <MapView
                  center={{
                    lat: delivery.driver_lat || delivery.pickup_lat!,
                    lng: delivery.driver_lng || delivery.pickup_lng!,
                  }}
                  markers={[
                    // Pickup location
                    {
                      lat: delivery.pickup_lat!,
                      lng: delivery.pickup_lng!,
                      label: "P",
                      icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                    },
                    // Driver location (if available)
                    ...(delivery.driver_lat && delivery.driver_lng ? [{
                      lat: delivery.driver_lat,
                      lng: delivery.driver_lng,
                      label: "🚗",
                    }] : []),
                    // Dropoff location
                    {
                      lat: delivery.dropoff_lat!,
                      lng: delivery.dropoff_lng!,
                      label: "D",
                      icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                    },
                  ]}
                  zoom={13}
                  height="400px"
                />
                <div style={{padding:16,backgroundColor:"#f9f9f9",borderTop:"1px solid #ddd"}}>
                  <div style={{fontSize:14,marginBottom:8}}>
                    <strong>Pickup:</strong> {delivery.pickup_address}
                  </div>
                  <div style={{fontSize:14}}>
                    <strong>Dropoff:</strong> {delivery.dropoff_address}
                  </div>
                </div>
              </div>
            )}

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
