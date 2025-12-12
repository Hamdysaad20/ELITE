"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import MobileHeader from "@/components/MobileHeader";
import Footer from "@/components/Footer";
import ProductDetailClient from "@/components/ProductDetailClient";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import SwipeIndicator from "@/components/SwipeIndicator";

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

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params?.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enable swipe-back gesture
  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch single product using dedicated endpoint
        const productRes = await fetch(`/api/products/${productId}`);
        if (!productRes.ok) throw new Error("Failed to fetch product");
        
        const productData = await productRes.json();
        const foundProduct = productData.data?.product || null;
        
        if (!foundProduct) {
          setError("Product not found");
          setLoading(false);
          return;
        }
        
        setProduct(foundProduct);
        
        // Fetch related products from same category
        if (foundProduct.category?.id) {
          const relatedRes = await fetch(`/api/products?categoryId=${foundProduct.category.id}&limit=4`);
          if (relatedRes.ok) {
            const relatedData = await relatedRes.json();
            // Filter out current product
            const filtered = (relatedData.data || []).filter((p: Product) => p.id !== productId);
            setRelatedProducts(filtered.slice(0, 3));
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError("Failed to load product");
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  if (loading) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <div className="hidden md:block">
        </div>
        <MobileHeader title="Product" showBack={true} />
        <main className="min-h-screen bg-elite-cream pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-elite-burgundy mx-auto"></div>
              <p className="mt-4 font-cabin text-elite-burgundy">Loading product...</p>
            </div>
          </div>
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <div className="hidden md:block">
        </div>
        <MobileHeader title="Product" showBack={true} />
        <main className="min-h-screen bg-elite-cream pt-16 md:pt-0 pb-20 md:pb-0">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <h1 className="font-calistoga text-elite-burgundy text-4xl mb-4">Product Not Found</h1>
              <p className="font-cabin text-elite-black/70 mb-6">
                {error || "The product you're looking for doesn't exist."}
              </p>
              <Link
                href="/menu"
                className="inline-block bg-elite-burgundy text-elite-cream px-8 py-3 rounded-full font-cabin font-medium hover:opacity-90 transition-colors"
              >
                Browse Menu
              </Link>
            </div>
          </div>
        </main>
        <div className="hidden md:block">
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
      <div className="hidden md:block">
      </div>
      <MobileHeader title={product.name} showBack={true} />
      <main className="page-transition loaded min-h-screen bg-elite-burgundy pt-16 md:pt-0 pb-20 md:pb-0">
        <ProductDetailClient 
          product={product} 
          relatedProducts={relatedProducts}
        />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </>
  );
}
