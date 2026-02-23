import Link from "next/link";

export default function Home() {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#FF7A00 0%,#0F766E 100%)"}}>
      <nav className="nav" style={{background:"transparent",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
        <span className="nav-brand" style={{color:"white",fontSize:"24px"}}><img src="/logo.svg" alt="RideNDine" style={{height:36,width:"auto",filter:"brightness(0) invert(1)",verticalAlign:"middle"}} /></span>
        <div className="nav-links">
          <Link href="/chefs" className="btn btn-outline" style={{color:"white",borderColor:"white"}}>Browse Chefs</Link>
          <Link href="/cart" className="btn" style={{background:"white",color:"#FF7A00"}}>🛒 Cart</Link>
        </div>
      </nav>
      <div style={{maxWidth:900,margin:"0 auto",padding:"80px 24px",textAlign:"center",color:"white"}}>
        <div style={{fontSize:72,marginBottom:16}}>🍜</div>
        <h1 style={{fontSize:52,fontWeight:800,marginBottom:16,lineHeight:1.1}}>
          Real food from<br/>real home chefs
        </h1>
        <p style={{fontSize:20,opacity:0.85,marginBottom:40,maxWidth:500,margin:"0 auto 40px"}}>
          Order authentic home-cooked meals delivered fresh. No restaurants — just talented home chefs cooking what they love.
        </p>
        <div style={{display:"flex",gap:16,justifyContent:"center",flexWrap:"wrap"}}>
          <Link href="/chefs" className="btn btn-lg" style={{background:"white",color:"#FF7A00",fontSize:18}}>
            🍽 Browse Chefs
          </Link>
          <Link href="/tracking" className="btn btn-lg btn-outline" style={{color:"white",borderColor:"white",fontSize:18}}>
            📦 Track Order
          </Link>
        </div>
        <div style={{display:"flex",gap:48,justifyContent:"center",marginTop:64,flexWrap:"wrap"}}>
          {[["🧑‍🍳","Real Home Chefs","Authentic recipes, made with love"],
            ["🚀","Fast Delivery","Fresh to your door"],
            ["💳","Secure Payment","Powered by Stripe"]].map(([icon,title,desc])=>(
            <div key={title} style={{textAlign:"center"}}>
              <div style={{fontSize:32,marginBottom:8}}>{icon}</div>
              <div style={{fontWeight:700,fontSize:16}}>{title}</div>
              <div style={{opacity:0.7,fontSize:14}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
