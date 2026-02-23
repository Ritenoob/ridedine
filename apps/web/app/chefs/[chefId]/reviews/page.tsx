"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getSupabaseClient } from "../../../../lib/supabaseClient";
import StarRating from "../../../../components/StarRating";
import type { Review, Profile } from "@home-chef/shared";

interface ReviewWithProfile extends Review {
  profiles?: {
    name: string;
  };
}

export default function ChefReviewsPage() {
  const params = useParams();
  const chefId = params.chefId as string;

  const [reviews, setReviews] = useState<ReviewWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [chefName, setChefName] = useState("");
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [chefId]);

  const loadReviews = async () => {
    const sb = getSupabaseClient();

    // Load chef info
    const { data: chef } = await sb
      .from("chefs")
      .select("rating, profiles(name)")
      .eq("id", chefId)
      .single();

    if (chef) {
      setChefName((chef.profiles as any)?.name || "Chef");
      setAvgRating(chef.rating || 0);
    }

    // Load reviews
    const { data: reviewsData } = await sb
      .from("reviews")
      .select("*, profiles(name)")
      .eq("chef_id", chefId)
      .order("created_at", { ascending: false });

    setReviews(reviewsData || []);
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
          <Link href="/chefs" className="nav-link">
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
        <Link
          href={`/chefs/${chefId}`}
          style={{
            color: "#FF7A00",
            textDecoration: "none",
            marginBottom: 16,
            display: "inline-block",
          }}
        >
          ← Back to {chefName}&apos;s Profile
        </Link>

        <div className="page-header">
          <h1 className="page-title">Reviews for {chefName}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
            <StarRating
              rating={avgRating}
              readonly
              size="lg"
              showCount
              reviewCount={reviews.length}
            />
            <span style={{ fontSize: 24, fontWeight: 600, color: "#333" }}>
              {avgRating.toFixed(1)}
            </span>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "var(--text-secondary)",
            }}
          >
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: "var(--text-secondary)",
            }}
          >
            No reviews yet
          </div>
        ) : (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            {reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  background: "white",
                  borderRadius: 12,
                  padding: 24,
                  marginBottom: 16,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 16,
                        marginBottom: 4,
                      }}
                    >
                      {review.profiles?.name || "Anonymous"}
                    </div>
                    <StarRating rating={review.rating} readonly size="sm" />
                  </div>
                  <div style={{ fontSize: 14, color: "#999" }}>
                    {formatDate(review.created_at)}
                  </div>
                </div>
                {review.comment && (
                  <p style={{ color: "#666", lineHeight: 1.6, margin: 0 }}>
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
