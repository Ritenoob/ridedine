import Link from "next/link";
import Image from "next/image";
import { PlaceholderPage, PageTemplate } from "@home-chef/ui";

export default function AboutPage() {
  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">
          <Image src="/logo.svg" alt="RideNDine" width={130} height={32} style={{ verticalAlign: "middle" }} />
        </Link>
        <div className="nav-links">
          <Link href="/chefs" className="nav-link">Chefs</Link>
          <Link href="/become-chef" className="nav-link">Become a Chef</Link>
        </div>
      </nav>
      <PageTemplate title="About RideNDine" subtitle="Our story and mission">
        <PlaceholderPage
          title="About Us"
          description="RideNDine connects food lovers with talented home chefs in their community. Fresh, authentic, home-cooked meals delivered to your door."
          icon="🍜"
        />
      </PageTemplate>
    </div>
  );
}
