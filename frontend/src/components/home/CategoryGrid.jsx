import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    name: "Technology",
    query: "Technology",
    image: "/images/cat-tech.jpg",
    count: "4 upcoming",
  },
  {
    name: "Design",
    query: "Design",
    image: "/images/cat-design.jpg",
    count: "6 upcoming",
  },
  {
    name: "Business",
    query: "Business",
    image: "/images/cat-business.jpg",
    count: "3 upcoming",
  },
  {
    name: "Marketing",
    query: "Marketing",
    image: "/images/cat-marketing.jpg",
    count: "5 upcoming",
  },
  {
    name: "Personal Growth",
    query: "Personal+Growth",
    image: "/images/cat-personal.jpg",
    count: "3 upcoming",
  },
  {
    name: "Creative Arts",
    query: "Creative+Arts",
    image: "/images/cat-creative.jpg",
    count: "4 upcoming",
  },
];

export default function CategoryGrid({ categoryCounts = {} }) {
  return (
    <section className="py-10 md:py-16 bg-[#F7F4ED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="mb-8 sm:mb-10">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block mb-1.5 sm:mb-2">
            EXPLORE CATEGORIES
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl lg:text-[46px] font-medium tracking-tight text-[#171915] leading-tight">
            Find what inspires you.
          </h2>
        </div>

        {/* 6 Column Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
          {CATEGORIES.map((cat) => {
            const rawCount = categoryCounts[cat.name];
            const displayCount = rawCount !== undefined ? `${rawCount} upcoming` : cat.count;

            return (
              <Link
                key={cat.name}
                href={`/events?category=${cat.query}`}
                className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-white border border-[#E7E2D8] shadow-sm flex flex-col justify-end p-4 transition-all duration-300 hover:shadow-md hover:border-[#073F2E]/60 hover:-translate-y-1"
                style={{ position: "relative" }}
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

                <div className="relative z-10 text-white">
                  <h3 className="font-serif text-base sm:text-lg font-bold leading-tight group-hover:text-[#A9C3A0] transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-[11px] text-white/70 block mt-1">
                    {displayCount}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
