export default function TestimonialsSection() {
  const testimonials = [
    {
      quote: "The spatial design studio in Fort Kochi was the most focused four hours I've spent this year. You leave with an actual prototype, not just slide notes.",
      author: "Aditi Menon",
      role: "Lead Product Designer",
      city: "Bengaluru",
      initials: "AM",
    },
    {
      quote: "Finally an event discovery platform that filters for high-substance, low-noise workshops. The booking was effortless and the cohort was exceptional.",
      author: "Devang Sharma",
      role: "Full-Stack Engineer",
      city: "Hyderabad",
      initials: "DS",
    },
    {
      quote: "Gather feels like an editorial journal rather than an ad-heavy ticketing site. Everything from the typography to the venue curation is intentional.",
      author: "Pooja Roy",
      role: "Independent Creative Director",
      city: "Mumbai",
      initials: "PR",
    },
  ];

  return (
    <section className="py-12 md:py-24 bg-[#F7F4ED]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block mb-1.5 sm:mb-2">
            COMMUNITY PERSPECTIVES
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl lg:text-[44px] font-medium tracking-tight text-[#171915]">
            Real people. Real experiences.
          </h2>
          <p className="text-xs text-[#77776F] mt-2">
            Demonstration reflections from attendee cohorts across design, engineering, and product.
          </p>
        </div>

        {/* 3 Column Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-[#E7E2D8] shadow-sm flex flex-col justify-between"
            >
              <p className="font-serif text-base text-[#171915] leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3.5 pt-6 mt-6 border-t border-[#E7E2D8]/60">
                <div className="w-10 h-10 rounded-full bg-[#073F2E] text-[#A9C3A0] flex items-center justify-center font-bold text-xs">
                  {t.initials}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#171915]">{t.author}</h4>
                  <p className="text-xs text-[#77776F]">{t.role} • {t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
