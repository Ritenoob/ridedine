import Link from "next/link";
import { PlaceholderPage, PageTemplate } from "@home-chef/ui";

export default function BecomeChefPage() {
  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="RideNDine" style={{ height: 32, width: "auto", verticalAlign: "middle" }} />
        </Link>
        <div className="nav-links">
          <Link href="/chefs" className="nav-link">Browse Chefs</Link>
          <Link href="/account" className="btn btn-primary btn-sm">Sign In</Link>
        </div>
      </nav>
      <PageTemplate title="Become a Chef" subtitle="Share your passion for cooking and earn from home">
        <PlaceholderPage
          title="Start Cooking for Your Community"
          description="Join RideNDine as a home chef. Set your own menu, hours, and prices. We handle the delivery — you handle the delicious food."
          icon="🧑‍🍳"
        />
      </PageTemplate>
    </div>
  );
}
