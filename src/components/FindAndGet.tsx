export default function FindAndGet() {
  return (
    <section className="bg-brewhaus-cream py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-brewhaus-green text-5xl md:text-6xl lg:text-7xl mb-16">
          Find and Get<br />What You Love
        </h2>

        {/* Category Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {/* Coffee Category */}
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden mb-8 transition-transform group-hover:scale-105">
              <img
                src="https://ext.same-assets.com/1022434225/2187497136.avif"
                alt="Coffee"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-calistoga text-brewhaus-green text-3xl lg:text-4xl">
              Coffee
            </h3>
          </div>

          {/* Cold Drinks Category */}
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden mb-8 transition-transform group-hover:scale-105">
              <img
                src="https://ext.same-assets.com/1022434225/3438940369.avif"
                alt="Cold Drinks"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-calistoga text-brewhaus-green text-3xl lg:text-4xl">
              Cold Drinks
            </h3>
          </div>

          {/* Bakery Category */}
          <div className="flex flex-col items-center group cursor-pointer">
            <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-full overflow-hidden mb-8 transition-transform group-hover:scale-105">
              <img
                src="https://ext.same-assets.com/1022434225/3614584481.avif"
                alt="Bakery"
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="font-calistoga text-brewhaus-green text-3xl lg:text-4xl">
              Bakery
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
}
