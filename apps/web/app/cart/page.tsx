"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../lib/CartContext";

export default function CartPage() {
  const { items, removeItem, updateQty, total, clearCart } = useCart();

  if(items.length===0) return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Image src="/logo.svg" alt="RideNDine" width={130} height={32} style={{verticalAlign:"middle"}} /></Link>
      </nav>
      <div style={{textAlign:"center",padding:80}}>
        <div style={{fontSize:64,marginBottom:16}}>🛒</div>
        <h2 style={{marginBottom:8}}>Your cart is empty</h2>
        <p style={{color:"var(--text-secondary)",marginBottom:24}}>Add some delicious items from our chefs</p>
        <Link href="/chefs" className="btn btn-primary btn-lg">Browse Chefs</Link>
      </div>
    </div>
  );

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand"><Image src="/logo.svg" alt="RideNDine" width={130} height={32} style={{verticalAlign:"middle"}} /></Link>
        <div className="nav-links">
          <Link href="/chefs" className="nav-link">← Continue Shopping</Link>
        </div>
      </nav>
      <div className="page" style={{maxWidth:700}}>
        <div className="page-header">
          <h1 className="page-title">Your Cart</h1>
          <p className="page-subtitle">From {items[0]?.chefName}</p>
        </div>
        <div className="card" style={{marginBottom:24}}>
          {items.map((item,i)=>(
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:16,padding:"16px 20px",borderBottom:i<items.length-1?"1px solid var(--border)":"none"}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:600}}>{item.name}</div>
                <div style={{color:"var(--text-secondary)",fontSize:14}}>${item.price.toFixed(2)} each</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <button onClick={()=>updateQty(item.id,item.quantity-1)} style={{width:28,height:28,borderRadius:"50%",border:"1.5px solid var(--border)",background:"white",cursor:"pointer",fontSize:16}}>-</button>
                <span style={{fontWeight:600,minWidth:20,textAlign:"center"}}>{item.quantity}</span>
                <button onClick={()=>updateQty(item.id,item.quantity+1)} style={{width:28,height:28,borderRadius:"50%",border:"1.5px solid var(--border)",background:"white",cursor:"pointer",fontSize:16}}>+</button>
              </div>
              <div style={{fontWeight:700,minWidth:70,textAlign:"right"}}>${(item.price*item.quantity).toFixed(2)}</div>
              <button onClick={()=>removeItem(item.id)} style={{background:"none",border:"none",cursor:"pointer",color:"var(--danger)",fontSize:18}}>×</button>
            </div>
          ))}
        </div>
        <div className="card card-body" style={{marginBottom:24}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:18,fontWeight:700}}>
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"flex-end"}}>
          <button onClick={clearCart} className="btn btn-outline btn-danger">Clear Cart</button>
          <Link href="/checkout" className="btn btn-primary btn-lg">Proceed to Checkout →</Link>
        </div>
      </div>
    </div>
  );
}
