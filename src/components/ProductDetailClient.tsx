"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Star, Package, TrendingUp } from "lucide-react";
import Image from "next/image";

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

  return (
    <div className="min-h-screen bg-elite-cream">
      {/* Header with Back Button */}
      <div className="bg-elite-burgundy text-elite-cream py-8">
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
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="relative">
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
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-cabin font-bold shadow-lg flex items-center gap-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
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
          <div className="space-y-6">
            {/* Title and Category */}
            <div>
              {product.category && (
                <Link
                  href={`/menu?category=${product.category.id}`}
                  className="inline-block text-elite-burgundy/70 hover:text-elite-burgundy font-cabin text-sm mb-2 transition-colors"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="font-calistoga text-elite-burgundy text-4xl lg:text-5xl font-bold mb-4">
                {product.name}
              </h1>
              
              {product.sku && (
                <p className="font-cabin text-elite-black/50 text-sm">
                  SKU: {product.sku}
                </p>
              )}
            </div>

            {/* Price Display */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="font-calistoga text-elite-burgundy text-4xl font-bold">
                    {product.price} EGP
                  </div>
                  {product.uom && (
                    <p className="font-cabin text-elite-black/60 text-sm mt-1">
                      per {product.uom.name}
                    </p>
                  )}
                </div>
                {product.stock !== null && product.stock !== undefined && (
                  <div className="text-right">
                    <p className="font-cabin text-elite-black/50 text-xs">Stock</p>
                    <p className={`font-cabin font-bold text-lg ${
                      product.stock > 0 ? "text-green-600" : "text-red-600"
                    }`}>
                      {product.stock > 0 ? product.stock : "0"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h3 className="font-calistoga text-elite-burgundy text-xl mb-3">
                  About this Product
                </h3>
                <p className="font-cabin text-elite-black/80 text-base leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Product Details */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h3 className="font-calistoga text-elite-burgundy text-xl mb-4">
                Product Details
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="font-cabin text-elite-black/60">Availability</dt>
                  <dd className={`font-cabin font-medium ${
                    product.available ? "text-green-600" : "text-red-600"
                  }`}>
                    {product.available ? "In Stock" : "Out of Stock"}
                  </dd>
                </div>
                {product.uom && (
                  <div className="flex justify-between">
                    <dt className="font-cabin text-elite-black/60">Unit</dt>
                    <dd className="font-cabin font-medium text-elite-black">
                      {product.uom.name}
                    </dd>
                  </div>
                )}
                {product.sku && (
                  <div className="flex justify-between">
                    <dt className="font-cabin text-elite-black/60">SKU</dt>
                    <dd className="font-mono font-medium text-elite-black text-sm">
                      {product.sku}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Call to Action */}
            <div className="bg-gradient-to-r from-elite-burgundy/10 to-elite-burgundy/5 rounded-2xl p-6 border border-elite-burgundy/20">
              <div className="flex items-start gap-4">
                <div className="bg-elite-burgundy/20 rounded-full p-3">
                  <TrendingUp className="w-6 h-6 text-elite-burgundy" />
                </div>
                <div>
                  <h4 className="font-calistoga text-elite-burgundy text-lg mb-2">
                    Want to order?
                  </h4>
                  <p className="font-cabin text-elite-black/70 text-sm mb-4">
                    Visit us at our location or contact us to place your order
                  </p>
                  <Link
                    href="/contact"
                    className="inline-block bg-elite-burgundy text-elite-cream px-6 py-2 rounded-full font-cabin font-medium hover:bg-elite-dark-burgundy transition-colors"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.id}`}
                  className="block group"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                    {/* Image */}
                    <div className="relative aspect-square bg-gradient-to-b from-elite-burgundy/5 to-elite-burgundy/10">
                      {relatedProduct.images.length > 0 ? (
                        <Image
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.name}
                          fill
                          className="object-contain p-6 group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="w-16 h-16 text-elite-burgundy/30" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-calistoga text-elite-black font-bold text-lg line-clamp-2 group-hover:text-elite-burgundy transition-colors">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-baseline justify-between">
                        <p className="font-cabin text-elite-burgundy font-bold text-xl">
                          {relatedProduct.price} EGP
                        </p>
                        {relatedProduct.available ? (
                          <span className="text-xs font-cabin text-green-600 font-medium">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-xs font-cabin text-red-600 font-medium">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
