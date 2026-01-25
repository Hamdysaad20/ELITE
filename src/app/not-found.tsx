import { getTranslations } from "next-intl/server";
import { Coffee, Home, Menu, MapPin } from "lucide-react";
import Footer from "@/components/Footer";
import LocalizedLink from "@/components/LocalizedLink";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <main>
      <div className="min-h-screen bg-elite-cream flex items-center justify-center px-6">
        <div className="max-w-2xl mx-auto text-center">
          {/* 404 Icon */}
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto bg-elite-burgundy rounded-full flex items-center justify-center mb-6">
              <Coffee className="w-16 h-16 text-elite-cream" />
            </div>
            <h1 className="font-calistoga text-8xl md:text-9xl text-elite-burgundy mb-4">
              404
            </h1>
          </div>

          {/* Error Message */}
          <div className="mb-12">
            <h2 className="font-calistoga text-4xl md:text-5xl text-elite-black mb-4">
              {t("title")}
            </h2>
            <p className="font-cabin text-xl text-elite-black/80 mb-6">
              {t("subtitle")}
            </p>
            <p className="font-cabin text-lg text-elite-black/60">
              {t("description")}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <LocalizedLink
              href="/"
              className="bg-elite-burgundy text-elite-cream px-8 py-4 rounded-full font-cabin text-lg font-semibold hover:bg-elite-black transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              {t("actions.home")}
            </LocalizedLink>
            <LocalizedLink
              href="/menu"
              className="border-2 border-elite-burgundy text-elite-burgundy px-8 py-4 rounded-full font-cabin text-lg font-semibold hover:bg-elite-burgundy hover:text-elite-cream transition-all duration-300 transform hover:scale-105 inline-flex items-center justify-center gap-2"
            >
              <Menu className="w-5 h-5" />
              {t("actions.menu")}
            </LocalizedLink>
          </div>

          {/* Helpful Links */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="font-calistoga text-2xl text-elite-burgundy mb-6">
              {t("popular.title")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LocalizedLink
                href="/menu/classic-drinks"
                className="flex items-center gap-3 p-4 rounded-xl bg-elite-cream hover:bg-elite-burgundy hover:text-elite-cream transition-all duration-300 group"
              >
                <Coffee className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-cabin font-semibold">
                  {t("popular.classic")}
                </span>
              </LocalizedLink>
              <LocalizedLink
                href="/menu/special-drinks"
                className="flex items-center gap-3 p-4 rounded-xl bg-elite-cream hover:bg-elite-burgundy hover:text-elite-cream transition-all duration-300 group"
              >
                <Coffee className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-cabin font-semibold">
                  {t("popular.special")}
                </span>
              </LocalizedLink>
              <LocalizedLink
                href="/menu/kids-corner"
                className="flex items-center gap-3 p-4 rounded-xl bg-elite-cream hover:bg-elite-burgundy hover:text-elite-cream transition-all duration-300 group"
              >
                <Coffee className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-cabin font-semibold">
                  {t("popular.kids")}
                </span>
              </LocalizedLink>
              <LocalizedLink
                href="/shop"
                className="flex items-center gap-3 p-4 rounded-xl bg-elite-cream hover:bg-elite-burgundy hover:text-elite-cream transition-all duration-300 group"
              >
                <Coffee className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-cabin font-semibold">
                  {t("popular.shop")}
                </span>
              </LocalizedLink>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 text-center">
            <p className="font-cabin text-elite-black/60 mb-2">
              {t("help")}
            </p>
            <div className="flex items-center justify-center gap-2 text-elite-burgundy font-cabin font-semibold">
              <MapPin className="w-4 h-4" />
              <span>
                {t("address")}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
