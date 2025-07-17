export default function Hero() {
  return (
    <section className="bg-brewhaus-green min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
        <h1 className="font-calistoga text-brewhaus-cream text-6xl md:text-7xl lg:text-8xl leading-tight max-w-4xl mb-6">
          Life Begins After Coffee
        </h1>

        <p className="text-brewhaus-cream font-cabin text-xl md:text-2xl mb-12 max-w-2xl">
          Because great coffee is the start of something even greater.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <button className="bg-brewhaus-cream text-brewhaus-green px-8 py-4 rounded-full font-cabin text-lg font-semibold hover:opacity-90 transition-opacity">
            Explore Menu
          </button>
          <button className="border-2 border-brewhaus-cream text-brewhaus-cream px-8 py-4 rounded-full font-cabin text-lg font-semibold hover:bg-brewhaus-cream hover:text-brewhaus-green transition-colors">
            Our Locations
          </button>
        </div>

        <div className="relative w-full max-w-4xl h-96 mb-20">
          {/* Left Cup - Tilted Left */}
          <div className="absolute left-0 bottom-0 transform -rotate-12 translate-x-8">
            <img
              src="https://ext.same-assets.com/1022434225/3040081048.avif"
              alt="Just Coffee Cup"
              className="w-48 h-64 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Center Cup - Straight */}
          <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 z-10">
            <img
              src="https://ext.same-assets.com/1022434225/3705697434.avif"
              alt="Espresso Cup"
              className="w-56 h-72 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Right Cup - Tilted Right */}
          <div className="absolute right-0 bottom-0 transform rotate-12 -translate-x-8">
            <img
              src="https://ext.same-assets.com/1022434225/515548484.avif"
              alt="Cold Brew Cup"
              className="w-48 h-64 object-contain drop-shadow-2xl"
            />
          </div>
        </div>
      </div>

      <div className="bg-brewhaus-cream py-4 overflow-hidden">
        <div className="flex animate-scroll whitespace-nowrap">
          <div className="flex items-center space-x-8 text-brewhaus-green font-cabin text-lg">
            <span className="flex items-center space-x-2">
              <span>🌎</span>
              <span>Global Flavor</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>☕</span>
              <span>Friendly Baristas</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>⭐</span>
              <span>Great Coffee</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>⚡</span>
              <span>Fast Service</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>🏠</span>
              <span>Cozy Space</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>📸</span>
              <span>Handcrafted Drinks</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>🏆</span>
              <span>Local Roasts</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>🌎</span>
              <span>Global Flavor</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>☕</span>
              <span>Friendly Baristas</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>⭐</span>
              <span>Great Coffee</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>⚡</span>
              <span>Fast Service</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>🏠</span>
              <span>Cozy Space</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>📸</span>
              <span>Handcrafted Drinks</span>
            </span>
            <span className="flex items-center space-x-2">
              <span>🏆</span>
              <span>Local Roasts</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
