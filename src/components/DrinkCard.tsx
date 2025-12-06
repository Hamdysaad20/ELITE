"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Check } from "lucide-react";

interface DrinkCardProps {
  image: string;
  name: string;
  price?: string;
  description?: string;
  size?: "small" | "medium" | "large";
  className?: string;
  href?: string;
  menuItemId?: string;
  numericPrice?: number;
  showAddToOrder?: boolean;
}

const sizeClasses = {
  small: {
    container: "aspect-square",
    imageContainer: "h-52",
  },
  medium: {
    container: "aspect-square",
    imageContainer: "h-60",
  },
  large: {
    container: "aspect-square",
    imageContainer: "h-68",
  },
};

const LoadingOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-elite-dark-burgundy/20 z-10 rounded-2xl sm:rounded-3xl">
    <div className="text-elite-burgundy text-sm font-medium">Loading...</div>
  </div>
);

const ImageErrorOverlay = () => (
  <div className="w-full h-full flex items-center justify-center bg-elite-dark-burgundy/20 rounded-2xl sm:rounded-3xl">
    <div className="text-elite-burgundy text-sm font-medium">
      Image not available
    </div>
  </div>
);

export default function DrinkCard({
  image,
  name,
  price,
  description,
  size = "medium",
  className = "",
  href,
  menuItemId,
  numericPrice,
  showAddToOrder = false,
}: DrinkCardProps) {
  const [imageState, setImageState] = useState({ loaded: false, error: false });
  const [isClient, setIsClient] = useState(false);
  const [addToOrderState, setAddToOrderState] = useState({
    adding: false,
    added: false,
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddToOrder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!menuItemId || addToOrderState.adding) return;

    setAddToOrderState({ adding: true, added: false });
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for NextAuth
        body: JSON.stringify({
          menuItemId,
          quantity: 1,
          size: "Medium",
        }),
      });
      if (res.ok) {
        setAddToOrderState({ adding: false, added: true });
        setTimeout(
          () => setAddToOrderState({ adding: false, added: false }),
          2000,
        );
      } else if (res.status === 401) {
        // Redirect to sign in if not authenticated
        window.location.href = "/auth/signin?callbackUrl=" + encodeURIComponent(window.location.pathname);
      }
    } catch (err) {
      console.error("Failed to add to cart:", err);
      setAddToOrderState({ adding: false, added: false });
    }
  };

  const handleImageLoad = () => setImageState({ loaded: true, error: false });
  const handleImageError = () => setImageState({ loaded: true, error: true });

  const classes = sizeClasses[size];

  const CardContent = () => (
    <div
      className={`bg-white rounded-2xl sm:rounded-3xl shadow-xl border-2 border-elite-burgundy/5 bg-gradient-to-br from-white to-elite-cream/30 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl hover:scale-105 group ${className}`}
    >
      <div className={`relative ${classes.container} p-4 sm:p-6`}>
        <div
          className={`bg-gradient-to-b from-elite-burgundy/8 to-elite-burgundy/15 rounded-2xl sm:rounded-3xl transition-transform group-hover:scale-110 relative overflow-hidden ${classes.imageContainer}`}
        >
          <div className="w-full h-full overflow-hidden rounded-2xl sm:rounded-3xl flex items-end justify-center">
            {isClient && !imageState.loaded && !imageState.error && (
              <LoadingOverlay />
            )}
            {imageState.error ? (
              <ImageErrorOverlay />
            ) : (
              <img
                src={image}
                alt={name}
                className={`w-full h-full object-cover object-bottom transition-opacity duration-300 ${
                  !isClient || imageState.loaded ? "opacity-100" : "opacity-0"
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
              />
            )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-2 sm:space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
        <h4 className="font-calistoga text-elite-black font-bold text-xl sm:text-2xl lg:text-3xl leading-tight h-16 sm:h-20 flex items-center justify-center line-clamp-2">
          {name}
        </h4>
        {price && (
          <p className="font-cabin text-elite-burgundy font-bold text-xl sm:text-2xl lg:text-3xl pt-2">
            {price}
          </p>
        )}
        {description && (
          <p className="font-cabin text-elite-black/70 text-sm leading-relaxed">
            {description}
          </p>
        )}
        {showAddToOrder && menuItemId && (
          <button
            onClick={handleAddToOrder}
            disabled={addToOrderState.adding}
            className={`mt-4 w-full flex items-center justify-center gap-2.5 px-5 py-3 rounded-full text-base tracking-wide shadow-md transition-all duration-300 ${
              addToOrderState.added
                ? "bg-emerald-600 text-white font-calistoga"
                : "bg-elite-burgundy text-elite-cream font-calistoga hover:bg-elite-dark-burgundy hover:scale-105 hover:shadow-lg"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-live="polite"
          >
            {addToOrderState.added ? (
              <>
                <Check className="w-5 h-5" />
                <span>Added!</span>
              </>
            ) : addToOrderState.adding ? (
              <span className="font-cabin">Adding...</span>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5" />
                <span>Add to Order</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );

  return href ? (
    <a href={href} className="block">
      <CardContent />
    </a>
  ) : (
    <CardContent />
  );
}
