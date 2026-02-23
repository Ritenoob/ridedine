"use client";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  reviewCount?: number;
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
  showCount = false,
  reviewCount = 0,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeMap = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const iconSize = sizeMap[size];

  const handleClick = (value: number) => {
    if (!readonly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (!readonly) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readonly) {
      setHoverRating(0);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
          disabled={readonly}
          style={{
            background: "none",
            border: "none",
            padding: 2,
            cursor: readonly ? "default" : "pointer",
            display: "flex",
            alignItems: "center",
          }}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}
        >
          <svg
            width={iconSize}
            height={iconSize}
            viewBox="0 0 24 24"
            fill={star <= displayRating ? "#FFB800" : "#E0E0E0"}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
          </svg>
        </button>
      ))}
      {showCount && reviewCount > 0 && (
        <span style={{ fontSize: size === "sm" ? 12 : size === "md" ? 14 : 16, color: "#666", marginLeft: 4 }}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
