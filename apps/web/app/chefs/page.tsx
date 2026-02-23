"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "../../lib/supabaseClient";
import { Chef, CuisineType } from "@home-chef/shared";
import StarRating from "../../components/StarRating";

interface ChefWithProfile extends Chef {
  profiles?: {
    name: string;
    email: string;
  };
  rating?: number;
  review_count?: number;
}

type SortOption = "rating" | "newest" | "name";

export default function ChefsPage() {
  const [chefs, setChefs] = useState<ChefWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    loadChefs();
  }, []);

  const loadChefs = async () => {
    const sb = getSupabaseClient();
    const { data } = await sb
      .from("chefs")
      .select("*, profiles(name,email)")
      .eq("status", "approved");

    setChefs(data || []);
    setLoading(false);
  };

  const filtered = chefs
    .filter((c) => {
      const name = c.profiles?.name || "";
      const cuisine = (c.cuisine_types || []).join(" ");
      const matchesSearch = (name + cuisine)
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCuisine =
        cuisineFilter === "all" ||
        (c.cuisine_types || []).some(
          (ct) => ct.toLowerCase() === cuisineFilter.toLowerCase()
        );

      const matchesRating = (c.rating || 0) >= minRating;

      return matchesSearch && matchesCuisine && matchesRating;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "name":
          return (
            (a.profiles?.name || "").localeCompare(b.profiles?.name || "")
          );
        default:
          return 0;
      }
    });

  const cuisineOptions = Object.values(CuisineType).map((ct) => ({
    value: ct,
    label: ct.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <div>
      <nav className="nav">
        <Link href="/" className="nav-brand">
          <img
            src="/logo.svg"
            alt="RideNDine"
            style={{ height: 32, width: "auto", verticalAlign: "middle" }}
          />
        </Link>
        <div className="nav-links">
          <Link href="/chefs" className="nav-link active">
            Chefs
          </Link>
          <Link href="/orders" className="nav-link">
            My Orders
          </Link>
          <Link href="/cart" className="btn btn-primary btn-sm">
            🛒 Cart
          </Link>
        </div>
      </nav>
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Our Chefs</h1>
          <p className="page-subtitle">
            Authentic meals made by talented home cooks in your community
          </p>
        </div>

        {/* Search and Filters */}
        <div
          style={{
            marginBottom: 32,
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <input
            className="form-input"
            style={{ flex: "1 1 300px", maxWidth: 400 }}
            placeholder="Search by name or cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="form-input"
            style={{ flex: "0 1 200px" }}
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
          >
            <option value="all">All Cuisines</option>
            {cuisineOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            className="form-input"
            style={{ flex: "0 1 150px" }}
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
          >
            <option value={0}>All Ratings</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>

          <select
            className="form-input"
            style={{ flex: "0 1 150px" }}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
          >
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "var(--text-secondary)",
            }}
          >
            Loading chefs...
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "var(--text-secondary)",
            }}
          >
            No chefs found matching your criteria
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((chef) => (
              <Link
                href={`/chefs/${chef.id}`}
                key={chef.id}
                style={{ textDecoration: "none" }}
              >
                <div className="card chef-card">
                  <div
                    className="chef-card-img"
                    style={{
                      background: chef.photo_url
                        ? `url(${chef.photo_url})`
                        : "linear-gradient(135deg,#fff4e6,#FF7A00)",
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!chef.photo_url && <span style={{ fontSize: 56 }}>🧑‍🍳</span>}
                  </div>
                  <div className="chef-card-body">
                    <div className="chef-name">
                      {chef.profiles?.name || "Chef"}
                    </div>
                    <div className="chef-cuisine">
                      {(chef.cuisine_types || []).join(" · ")}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        margin: "8px 0",
                        lineHeight: 1.5,
                      }}
                    >
                      {(chef.bio || "").slice(0, 80)}
                      {(chef.bio || "").length > 80 ? "..." : ""}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: 12,
                      }}
                    >
                      <StarRating
                        rating={chef.rating || 0}
                        readonly
                        size="sm"
                        showCount
                        reviewCount={chef.review_count || 0}
                      />
                      <span className="btn btn-primary btn-sm">
                        View Menu →
                      </span>
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
