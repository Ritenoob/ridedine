"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";

export default function ChefsPage() {
  const [chefs, setChefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const sb = getSupabaseClient();
    sb.from("chefs").select("*, profiles(name,email)").eq("status","approved")
      .then(({data})=>{ setChefs(data||[]); setLoading(false); });
  }, []);

  const filtered = chefs.filter(c => {
    const name = c.profiles?.name || "";
    const cuisine = (c.cuisine_types||[]).join(" ");
    return (name+cuisine).toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand"><img src="/logo.svg" alt="RideNDine" style={{height:32,width:"auto",verticalAlign:"middle"}} /></Link>
        <div className="nav-links">
          <Link href="/chefs" className="nav-link active">Chefs</Link>
          <Link href="/orders" className="nav-link">My Orders</Link>
          <Link href="/cart" className="btn btn-primary btn-sm">🛒 Cart</Link>
        </div>
      </nav>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Our Home Chefs</h1>
          <p className="page-subtitle">Authentic meals made by talented home cooks in your community</p>
        </div>
        <div style={{marginBottom:24}}>
          <input className="form-input" style={{maxWidth:400}} placeholder="Search by name or cuisine..."
            value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        {loading ? (
          <div style={{textAlign:"center",padding:60,color:"var(--text-secondary)"}}>Loading chefs...</div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:"center",padding:60,color:"var(--text-secondary)"}}>No chefs found</div>
        ) : (
          <div className="grid-3">
            {filtered.map(chef=>(
              <Link href={`/chefs/${chef.id}`} key={chef.id} style={{textDecoration:"none"}}>
                <div className="card chef-card">
                  <div className="chef-card-img" style={{background:"linear-gradient(135deg,#e3f2fd,#1976d2)"}}>
                    <span style={{fontSize:56}}>🧑‍🍳</span>
                  </div>
                  <div className="chef-card-body">
                    <div className="chef-name">{chef.profiles?.name || "Chef"}</div>
                    <div className="chef-cuisine">{(chef.cuisine_types||[]).join(" · ")}</div>
                    <div style={{fontSize:13,color:"var(--text-secondary)",margin:"8px 0",lineHeight:1.5}}>
                      {(chef.bio||"").slice(0,80)}{(chef.bio||"").length>80?"...":""}
                    </div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12}}>
                      <div className="chef-rating">⭐ {chef.rating?.toFixed(1)||"5.0"}</div>
                      <span className="btn btn-primary btn-sm">View Menu →</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
