import Image from "next/image";
import { Sparkles, Users, Compass } from "lucide-react";

export default function CommunityFeature() {
  const benefits = [
    {
      icon: <Sparkles className="w-5 h-5 text-[#073F2E]" />,
      title: "Learn from seasoned practitioners",
      description: "Direct studio time with architects, engineers, and founders doing the actual work daily.",
    },
    {
      icon: <Users className="w-5 h-5 text-[#073F2E]" />,
      title: "Meet thoughtful collaborators",
      description: "Small cohort sizes designed to foster real dialogue, creative chemistry, and long-term relationships.",
    },
    {
      icon: <Compass className="w-5 h-5 text-[#073F2E]" />,
      title: "Turn inspiration into tangible work",
      description: "Step away from passive feeds. Every masterclass is centered on hands-on creation and tangible prototypes.",
    },
  ];

  return (
    <section id="about" className="py-12 md:py-24 bg-white border-y border-[#E7E2D8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left: Large Workshop Photograph */}
          <div className="lg:col-span-6">
            <div
              className="relative rounded-2xl sm:rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[16/11] shadow-xl"
              style={{ position: "relative" }}
            >
              <Image
                src="/images/community-gathering.jpg"
                alt="Community workshop gathering in an airy studio"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 text-white">
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest uppercase bg-[#073F2E]/80 backdrop-blur-md px-3 py-1 rounded-full inline-block mb-1.5 sm:mb-2">
                  Studio Atmosphere
                </span>
                <p className="text-xs sm:text-sm font-medium text-white/90">
                  Real people in real physical rooms, sharing tools and craft.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Editorial Narrative & 3 Benefits */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block mb-1.5 sm:mb-2">
                THE GATHER PHILOSOPHY
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl lg:text-[46px] font-medium tracking-tight text-[#171915] leading-tight">
                Less scrolling.
                <br />
                <span className="italic font-normal text-[#073F2E]">
                  More doing.
                </span>
              </h2>
              <p className="text-[14px] sm:text-base text-[#77776F] mt-3 sm:mt-4 leading-relaxed font-normal">
                Digital spaces are great for discovering ideas, but depth happens when curious people sit across a table, share screens, and build together.
              </p>
            </div>

            {/* 3 Concise Benefit Items */}
            <div className="space-y-6">
              {benefits.map((b, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#EBF3E8] border border-[#A9C3A0]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {b.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#171915]">
                      {b.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#77776F] mt-1 leading-relaxed">
                      {b.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
