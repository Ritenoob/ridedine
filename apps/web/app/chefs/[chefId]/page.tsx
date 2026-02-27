"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCart } from "../../../lib/CartContext";

type ChefRow = {
  id: string;
  bio?: string | null;
  address?: string | null;
  rating?: number | null;
  cuisine_types?: string[] | null;
  profiles?: { name?: string | null } | null;
};

type DishRow = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  cuisine_type?: string | null;
  dietary_tags?: string[] | null;
};

export default function ChefPage() {
  const { chefId } = useParams();
  const [chef, setChef] = useState<ChefRow | null>(null);
  const [dishes, setDishes] = useState<DishRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<string|null>(null);
  const { addItem, totalItems, total } = useCart();

  useEffect(()=>{
    const supabase = getSupabaseClient();
    Promise.all([
      supabase.from("chefs").select("*, profiles(name)").eq("id", chefId).single(),
      supabase.from("dishes").select("*").eq("chef_id", chefId).eq("available", true)
    ]).then(([{data:c},{data:d}])=>{
      setChef(c as ChefRow | null); setDishes((d as DishRow[]) || []); setLoading(false);
    });
  },[chefId]);

  const handleAdd = (dish: DishRow) => {
    addItem({
      id: dish.id,
      name: dish.name,
      price: dish.price,
      chefId: chefId as string,
      chefName: chef?.profiles?.name || "Chef"
    });
    setAdded(dish.id);
    setTimeout(()=>setAdded(null), 1500);
  };

  const grouped = dishes.reduce((acc: Record<string, DishRow[]>, d) => {
    const key = d.cuisine_type || "Other";
    if(!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  if(loading) return <div style={{textAlign:"center",padding:80,fontSize:18}}>Loading menu...</div>;
  if(!chef) return <div style={{textAlign:"center",padding:80}}>Chef not found</div>;

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand"><img src="/logo.svg" alt="RideNDine" style={{height:32,width:"auto",verticalAlign:"middle"}} /></Link>
        <div className="nav-links">
          <Link href="/chefs" className="nav-link">← All Chefs</Link>
          <Link href="/cart" className="btn btn-primary btn-sm">
            🛒 {totalItems > 0 ? `${totalItems} items · $${total.toFixed(2)}` : "Cart"}
          </Link>
        </div>
      </nav>

      <div style={{background:"linear-gradient(135deg,#FF7A00,#0F766E)",color:"white",padding:"48px 24px"}}>
        <div style={{maxWidth:1200,margin:"0 auto",display:"flex",alignItems:"center",gap:24,flexWrap:"wrap"}}>
          <div style={{fontSize:80}}>🧑‍🍳</div>
          <div>
            <h1 style={{fontSize:36,fontWeight:800}}>{chef.profiles?.name}</h1>
            <p style={{opacity:0.85,fontSize:16,margin:"8px 0"}}>{(chef.cuisine_types||[]).join(" · ")}</p>
            <p style={{opacity:0.75,maxWidth:600,lineHeight:1.6}}>{chef.bio}</p>
            <div style={{display:"flex",gap:16,marginTop:16,flexWrap:"wrap",fontSize:14}}>
              <span>⭐ {chef.rating?.toFixed(1)||"5.0"}</span>
              <span>📍 {chef.address||"Local area"}</span>
              <span>🚚 Delivery only</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page">
        {Object.entries(grouped).map(([category, categoryDishes]) => (
          <div key={category} style={{marginBottom:40}}>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:16,paddingBottom:8,borderBottom:"2px solid var(--primary)",display:"inline-block"}}>{category}</h2>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {categoryDishes.map((dish) => (
                <div key={dish.id} className="card">
                  <div className="dish-card">
                    <div className="dish-info">
                      <div className="dish-name">{dish.name}</div>
                      <div className="dish-desc">{dish.description}</div>
                      <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
                        {(dish.dietary_tags||[]).map((t:string) => (
                          <span key={t} style={{fontSize:11,background:"var(--primary-light)",color:"var(--primary)",padding:"2px 8px",borderRadius:999}}>{t}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:12,flexShrink:0}}>
                      <div className="dish-price">${dish.price?.toFixed(2)}</div>
                      <button className="dish-add-btn" onClick={()=>handleAdd(dish)}
                        style={{background:added===dish.id?"var(--success)":"var(--primary)"}}>
                        {added===dish.id ? "✓" : "+"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
