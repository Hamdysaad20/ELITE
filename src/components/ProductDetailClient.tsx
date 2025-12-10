"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Package, TrendingUp, ShoppingCart, Check, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import AttributeSelector from "./AttributeSelector";
import QuantitySelector from "./QuantitySelector";
import { useLocalCart, type LocalCartItem } from "@/hooks/useLocalCart";
import { useToast } from "@/components/ToastProvider";
import DrinkCard from "@/components/DrinkCard";
import { ReviewCard, ReviewForm } from "@/components/ReviewCard";
import { useReviews } from "@/hooks/useReviews";
import { useUserPurchases } from "@/hooks/useUserPurchases";
import { cn } from "@/lib/utils";

interface AttributeValue {
  id: number;
  name: string;
  priceExtra: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  images: string[];
  available: boolean;
  stock: number | null;
  sequence: number;
  uom?: { id: number; name: string };
  taxes?: number[];
  category?: { id: string; name: string };
  attributes?: Record<string, AttributeValue[]>;
}

interface ProductDetailClientProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetailClient({
  product,
  relatedProducts,
}: ProductDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, number | number[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useLocalCart();
  const { error: toastError, success: toastSuccess } = useToast();
  const { data: session } = useSession();
  
  // Fetch reviews for this product
  const { 
    reviews, 
    stats, 
    loading: reviewsLoading, 
    submitReview, 
    submitting: submittingReview 
  } = useReviews({
    productId: product.id,
  });

  // Check if user has purchased this product
  const { hasPurchased, loading: purchaseLoading } = useUserPurchases();
  const userHasPurchased = hasPurchased(product.id);

  // Detect multi-select attributes
  const isMultiSelect = (attributeName: string): boolean => {
    const multiSelectKeywords = [
      'topping', 'toppings',
      'extra', 'extras',
      'sauce', 'sauces',
      'vegetable', 'vegetables',
      'ingredient', 'ingredients',
      'addition', 'additions',
      'protein', 'cheese', 'bread'
    ];
    const lower = attributeName.toLowerCase();
    return multiSelectKeywords.some(keyword => lower.includes(keyword));
  };

  // Calculate total price
  const calculateTotalPrice = (): number => {
    let total = product.price;
    
    if (product.attributes) {
      Object.entries(selectedAttributes).forEach(([attrName, selected]) => {
        const attribute = product.attributes?.[attrName];
        if (!attribute) return;
        
        if (Array.isArray(selected)) {
          // Multi-select: sum all selected
          selected.forEach(valueId => {
            const value = attribute.find(v => v.id === valueId);
            if (value) total += value.priceExtra;
          });
        } else {
          // Single-select: add priceExtra
          const value = attribute.find(v => v.id === selected);
          if (value) total += value.priceExtra;
        }
      });
    }
    
    return total * quantity;
  };

  // Validate selections (check required attributes)
  const validateSelections = (): { valid: boolean; message?: string } => {
    if (!product.attributes) return { valid: true };
    
    // Size is typically required if present
    const hasSize = product.attributes['Size'];
    if (hasSize && !selectedAttributes['Size']) {
      return { valid: false, message: 'Please select a size' };
    }
    
    return { valid: true };
  };

  // Handle add to cart
  const handleAddToCart = () => {
    const validation = validateSelections();
    
    if (!validation.valid) {
      toastError(validation.message || 'Please select all required options');
      return;
    }
    
    // Transform selected attributes to cart format
    const cartAttributes: LocalCartItem['attributes'] = {};
    
    if (product.attributes) {
      Object.entries(selectedAttributes).forEach(([attrName, selected]) => {
        const attribute = product.attributes?.[attrName];
        if (!attribute) return;
        
        if (Array.isArray(selected)) {
          // Multi-select
          cartAttributes[attrName] = selected.map(valueId => {
            const value = attribute.find(v => v.id === valueId);
            return {
              valueId,
              valueName: value?.name || '',
              priceExtra: value?.priceExtra || 0,
            };
          }).filter(v => v.valueName);
        } else {
          // Single-select
          const value = attribute.find(v => v.id === selected);
          if (value) {
            cartAttributes[attrName] = [{
              valueId: value.id,
              valueName: value.name,
              priceExtra: value.priceExtra,
            }];
          }
        }
      });
    }
    
    // Calculate unit price (price for 1 item with selected attributes)
    const unitPrice = Object.values(cartAttributes).reduce((sum, values) => {
      return sum + values.reduce((s, v) => s + v.priceExtra, 0);
    }, product.price);
    
    // Add to cart
    addItem({
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      quantity,
      attributes: cartAttributes,
      totalPrice: unitPrice * quantity,
      image: product.images?.[0],
    });
    
    // Show success feedback
    setAddedToCart(true);
    toastSuccess(`${product.name} added to cart!`);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const nextImage = () => {
    if (product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  // Fallback image if no images available
  const displayImages = product.images.length > 0 
    ? product.images 
    : ["/images/placeholder-product.jpg"];

  const hasImages = product.images.length > 0;
  const hasMultipleImages = product.images.length > 1;

  // Render component
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with Back Button */}
      <div className="bg-elite-burgundy text-elite-cream py-8 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href="/menu"
            className="inline-flex items-center gap-2 bg-elite-cream/20 text-elite-cream px-4 py-2 rounded-full font-cabin font-medium transition-all duration-300 hover:bg-elite-cream/30 hover:scale-105"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Menu
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-elite-cream rounded-t-[2.5rem] -mt-8">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="relative lg:sticky lg:top-32 h-fit">
            <div className="aspect-square bg-elite-cream relative rounded-3xl overflow-hidden">
              {/* Main Image Container */}
              <div className="absolute inset-0 bg-gradient-to-b from-elite-burgundy/5 to-elite-burgundy/10 rounded-3xl flex items-center justify-center">
                {hasImages ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={displayImages[currentImageIndex]}
                      alt={product.name}
                      fill
                      className="object-contain p-8"
                      priority
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-elite-burgundy/40">
                    <Package className="w-24 h-24 mb-4" />
                    <p className="font-cabin text-sm">No image available</p>
                  </div>
                )}
              </div>

              {/* Stock Badge */}
              <div className="absolute top-6 right-6 z-10">
                {product.available ? (
                  <div className="bg-elite-burgundy text-elite-cream px-4 py-2 rounded-full text-sm font-cabin font-bold shadow-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-elite-cream rounded-full animate-pulse"></div>
                    In Stock
                  </div>
                ) : (
                  <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-cabin font-bold shadow-lg">
                    Out of Stock
                  </div>
                )}
              </div>

              {/* Image Navigation */}
              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 text-elite-burgundy rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg z-20"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/90 text-elite-burgundy rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 shadow-lg z-20"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Image Indicators */}
              {hasMultipleImages && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
                  {product.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentImageIndex
                          ? "bg-elite-burgundy scale-125"
                          : "bg-elite-burgundy/50 hover:bg-elite-burgundy/75"
                      }`}
                      aria-label={`View image ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Gallery (if multiple images) */}
            {hasMultipleImages && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {product.images.slice(0, 4).map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? "border-elite-burgundy shadow-lg scale-105"
                        : "border-elite-burgundy/20 hover:border-elite-burgundy/50"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} thumbnail ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              {product.category && (
                <Link
                  href={`/menu?category=${product.category.id}`}
                  className="inline-flex items-center gap-1 text-elite-burgundy/60 hover:text-elite-burgundy font-cabin text-base font-medium uppercase tracking-wider transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              
              <h1 className="font-calistoga text-elite-burgundy text-4xl lg:text-5xl font-bold leading-tight">
                {product.name}
              </h1>

              {/* Description - Moved up for better context */}
              {product.description && (
                <p className="font-cabin text-elite-black/70 text-lg leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Base Price */}
              <div className="flex items-baseline gap-2 pt-2">
                <span className="font-calistoga text-elite-burgundy text-3xl">
                  {product.price} EGP
                </span>
                {product.attributes && Object.keys(product.attributes).length > 0 && (
                  <span className="font-cabin text-elite-black/40 text-base">
                    Base Price
                  </span>
                )}
              </div>
            </div>

            <div className="h-px bg-elite-burgundy/10 w-full" />

            {/* Configuration Section */}
            <div className="space-y-8">
              {/* Attributes */}
              {product.attributes && Object.keys(product.attributes).length > 0 && (
                <div className="space-y-6">
                  {Object.entries(product.attributes).map(([attributeName, values]) => (
                    <AttributeSelector
                      key={attributeName}
                      label={attributeName}
                      values={values}
                      selected={selectedAttributes[attributeName]}
                      multiSelect={isMultiSelect(attributeName)}
                      onChange={(selected) => setSelectedAttributes(prev => ({
                        ...prev,
                        [attributeName]: selected
                      }))}
                      required={attributeName === 'Size'}
                    />
                  ))}
                  <div className="h-px bg-elite-black/5 w-full" />
                </div>
              )}

              {/* Quantity & Total & Action - Grouped in a card for better UX */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="w-full sm:w-auto">
                    <QuantitySelector
                      value={quantity}
                      onChange={setQuantity}
                      min={1}
                      max={50}
                      disabled={!product.available}
                    />
                  </div>
                  
                  <div className="text-center sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-4">
                    <p className="font-cabin text-lg text-elite-black/50 mb-1">Total Price</p>
                    <p className="font-calistoga text-4xl text-elite-burgundy">
                      {calculateTotalPrice()} EGP
                    </p>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={!product.available || addedToCart}
                  className={cn(
                    "w-full py-4 rounded-xl font-calistoga text-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform active:scale-[0.98]",
                    !product.available
                      ? 'bg-elite-black/10 text-elite-black/40 cursor-not-allowed'
                      : addedToCart
                        ? 'bg-green-600 text-white'
                        : 'bg-elite-burgundy text-elite-cream hover:bg-elite-dark-burgundy'
                  )}
                >
                  {!product.available ? (
                    'Temporarily Unavailable'
                  ) : addedToCart ? (
                    <>
                      <Check className="w-6 h-6" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-6 h-6" />
                      Add to Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 bg-elite-cream rounded-3xl shadow-xl border-2 border-elite-burgundy/10 p-6 sm:p-8 lg:p-10">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
              <h2 className="font-calistoga text-elite-burgundy text-3xl sm:text-4xl font-bold">
                Customer Reviews
              </h2>
              {stats && stats.total > 0 && (
                <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-full border-2 border-elite-burgundy/20 shadow-md">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          star <= Math.round(stats.averageRating)
                            ? "fill-elite-burgundy text-elite-burgundy"
                            : "text-elite-burgundy/20"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-cabin text-elite-burgundy font-bold text-lg sm:text-xl">
                    {stats.averageRating.toFixed(1)}
                  </span>
                  <span className="font-cabin text-elite-black/60 text-sm font-medium">
                    ({stats.total} {stats.total === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            {/* Review Form */}
            <div className="mb-8 bg-white rounded-3xl p-6 sm:p-8 border-2 border-elite-burgundy/10 shadow-lg">
              <h3 className="font-calistoga text-elite-burgundy text-2xl sm:text-3xl mb-6">
                Share Your Experience
              </h3>
              
              {!session ? (
                // Not logged in
                <div className="text-center py-6 bg-elite-cream/30 rounded-xl">
                  <p className="font-cabin text-elite-black/70 text-sm mb-3">
                    Sign in to leave a review
                  </p>
                  <Link
                    href={`/auth/signin?callbackUrl=/products/${product.id}`}
                    className="inline-flex items-center gap-2 bg-elite-burgundy text-elite-cream px-5 py-2 rounded-full font-cabin font-medium text-sm hover:bg-elite-dark-burgundy transition-all duration-300 active:scale-95"
                  >
                    Sign In
                  </Link>
                </div>
              ) : purchaseLoading ? (
                // Loading purchase history
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-elite-burgundy border-t-transparent mx-auto"></div>
                </div>
              ) : !userHasPurchased ? (
                // Not purchased - compact message
                <div className="text-center py-4 bg-elite-cream/30 rounded-xl">
                  <p className="font-cabin text-elite-black/70 text-sm">
                    Purchase required to review
                  </p>
                </div>
              ) : (
                // Can review
                <ReviewForm
                  productId={product.id}
                  productName={product.name}
                  onSubmit={async (rating, comment) => {
                    try {
                      await submitReview(rating, comment);
                      toastSuccess("Review submitted successfully!");
                    } catch (err) {
                      toastError(
                        err instanceof Error ? err.message : "Failed to submit review"
                      );
                    }
                  }}
                  submitting={submittingReview}
                />
              )}
            </div>

            {/* Reviews List */}
            <div className="space-y-5">
              <h3 className="font-calistoga text-elite-black text-xl sm:text-2xl mb-4">
                {reviews.length > 0 ? `All Reviews (${reviews.length})` : 'Reviews'}
              </h3>
              {reviewsLoading ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-elite-burgundy/10">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-elite-burgundy border-t-transparent mx-auto"></div>
                  <p className="mt-6 font-cabin text-elite-burgundy font-semibold text-lg">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border-2 border-elite-burgundy/10 shadow-md">
                  <div className="w-20 h-20 rounded-full bg-elite-burgundy/10 flex items-center justify-center mx-auto mb-6">
                    <Star className="w-10 h-10 text-elite-burgundy" />
                  </div>
                  <h4 className="font-calistoga text-elite-black text-2xl mb-3">
                    No Reviews Yet
                  </h4>
                  <p className="font-cabin text-elite-black/60 text-base">
                    Be the first to share your experience with this product!
                  </p>
                </div>
              ) : (
                reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="text-center mb-8">
              <h2 className="font-calistoga text-elite-burgundy text-3xl font-bold mb-2">
                You Might Also Like
              </h2>
              <p className="font-cabin text-elite-black/60">
                More products from {product.category?.name || "this category"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <DrinkCard
                  key={relatedProduct.id}
                  id={relatedProduct.id}
                  name={relatedProduct.name}
                  price={relatedProduct.price}
                  images={relatedProduct.images}
                  available={relatedProduct.available}
                  href={`/products/${relatedProduct.id}`}
                  menuItemId={relatedProduct.id}
                  showAddToOrder={true}
                  className="h-full"
                />
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
