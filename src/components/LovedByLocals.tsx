export default function LovedByLocals() {
  const products = [
    {
      name: "Cappuccino",
      price: "$5.25",
      image: "https://ext.same-assets.com/1022434225/2347648118.avif",
      link: "/menu/cappuccino"
    },
    {
      name: "Bubble Tea",
      price: "$6.75",
      image: "https://ext.same-assets.com/1022434225/4278114908.avif",
      link: "/menu/bubble-tea"
    },
    {
      name: "Iced Tea",
      price: "$4.35",
      image: "https://ext.same-assets.com/1022434225/703059297.avif",
      link: "/menu/iced-tea"
    },
    {
      name: "Iced Latte",
      price: "$4.45",
      image: "https://ext.same-assets.com/1022434225/1157300862.avif",
      link: "/menu/iced-latte"
    }
  ];

  return (
    <section className="bg-brewhaus-cream py-20 px-6">
      <div className="max-w-6xl mx-auto text-center">
        {/* Section Heading */}
        <h2 className="font-calistoga text-brewhaus-green text-5xl md:text-6xl lg:text-7xl mb-6">
          Loved by Locals
        </h2>

        {/* Subtext */}
        <p className="text-brewhaus-green font-cabin text-xl md:text-2xl mb-16 max-w-2xl mx-auto">
          Local go-to's everyone loves — handpicked and always fresh.
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {products.map((product, index) => (
            <a
              key={index}
              href={product.link}
              className="group cursor-pointer"
            >
              <div className="bg-brewhaus-green rounded-3xl p-6 transition-transform group-hover:scale-105">
                <div className="aspect-square mb-6 overflow-hidden rounded-2xl">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-left">
                  <h3 className="font-calistoga text-brewhaus-cream text-2xl mb-1">
                    {product.name}
                  </h3>
                  <p className="text-[#73ac8a] font-cabin text-xl font-semibold">
                    {product.price}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Explore Menu Button */}
        <button className="bg-brewhaus-green text-brewhaus-cream px-8 py-4 rounded-full font-cabin text-lg font-semibold hover:opacity-90 transition-opacity">
          Explore Menu
        </button>
      </div>
    </section>
  );
}
