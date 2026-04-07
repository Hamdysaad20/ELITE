"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Footer from "@/components/Footer";
import ProductDetailClient from "@/components/ProductDetailClient";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import SwipeIndicator from "@/components/SwipeIndicator";
import { useTranslations, useLocale } from "next-intl";
import LocalizedLink from "@/components/LocalizedLink";
import { ArrowLeft } from "lucide-react";

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
  const router = useRouter();
  const locale = useLocale();
  const productId = params?.id as string;
  const t = useTranslations("productPage");
  const prefersReduced = useReducedMotion();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { swipeProgress, isSwipingBack } = useSwipeBack({ enabled: true });

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

      try {
        setLoading(true);
        setError(null);

        const productRes = await fetch(`/api/products/${productId}`);
        if (!productRes.ok) throw new Error(t("errors.fetch"));

        const productData = await productRes.json();
        const foundProduct = productData.data?.product || null;

        if (!foundProduct) {
          setError(t("errors.notFound"));
          setLoading(false);
          return;
        }

        setProduct(foundProduct);

        if (foundProduct.category?.id) {
          const relatedRes = await fetch(
            `/api/products?categoryId=${foundProduct.category.id}&limit=4`,
          );
          if (relatedRes.ok) {
            const relatedData = await relatedRes.json();
            const filtered = (relatedData.data || []).filter(
              (p: Product) => p.id !== productId,
            );
            setRelatedProducts(filtered.slice(0, 3));
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(t("errors.loadFailed"));
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, t]);

  if (loading) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <div className="min-h-screen bg-gradient-to-b from-elite-cream via-[#f8f0e4] to-[#f3e6d8]">
          {/* Floating back button while loading */}
          <button
            onClick={() => router.back()}
            className="fixed z-40 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg active:scale-95 transition-transform"
            style={{
              top: "calc(max(env(safe-area-inset-top), 8px) + 12px)",
              insetInlineStart: "16px",
            }}
            aria-label="Go back"
          >
            <ArrowLeft
              className="w-5 h-5 text-elite-burgundy"
              strokeWidth={2.5}
              style={locale === "ar" ? { transform: "rotate(180deg)" } : {}}
            />
          </button>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full border-2 border-elite-burgundy border-t-transparent animate-spin mx-auto" />
              <p className="mt-4 font-cabin text-elite-burgundy/70">
                {t("loading")}
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !product) {
    return (
      <>
        <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />
        <div className="min-h-screen bg-gradient-to-b from-elite-cream via-[#f8f0e4] to-[#f3e6d8] flex items-center justify-center px-4">
          <button
            onClick={() => router.back()}
            className="fixed z-40 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-lg active:scale-95 transition-transform"
            style={{
              top: "calc(max(env(safe-area-inset-top), 8px) + 12px)",
              insetInlineStart: "16px",
            }}
            aria-label="Go back"
          >
            <ArrowLeft
              className="w-5 h-5 text-elite-burgundy"
              strokeWidth={2.5}
              style={locale === "ar" ? { transform: "rotate(180deg)" } : {}}
            />
          </button>
          <div className="text-center max-w-md">
            <h1 className="font-calistoga text-elite-burgundy text-4xl mb-4">
              {t("notFound.title")}
            </h1>
            <p className="font-cabin text-elite-black/70 mb-6">
              {error || t("notFound.description")}
            </p>
            <LocalizedLink
              href="/menu"
              className="inline-block bg-elite-burgundy text-elite-cream px-8 py-3 rounded-full font-cabin font-semibold hover:opacity-90 transition-opacity"
            >
              {t("notFound.browseMenu")}
            </LocalizedLink>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SwipeIndicator progress={swipeProgress} isActive={isSwipingBack} />

      <motion.div
        initial={prefersReduced ? false : { x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1.0] }}
      >
        <ProductDetailClient
          product={product}
          relatedProducts={relatedProducts}
          onBack={() => router.back()}
        />
        <div className="hidden md:block">
          <Footer />
        </div>
      </motion.div>
    </>
  );
}
