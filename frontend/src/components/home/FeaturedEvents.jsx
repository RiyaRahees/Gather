import Link from "next/link";
import { ArrowRight } from "lucide-react";
import EventCard from "@/components/events/EventCard";

export default function FeaturedEvents({ events = [] }) {
  return (
    <section className="py-10 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-3 sm:gap-4">
          <div>
            <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block mb-1.5 sm:mb-2">
              FEATURED EVENTS
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl lg:text-[46px] font-medium tracking-tight text-[#171915] leading-tight">
              Curated for curious minds.
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#171915] hover:text-[#073F2E] group transition-colors self-start sm:self-auto"
          >
            <span>View all events</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4 Column Event Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {events.length > 0 ? (
            events.map((evt) => (
              <EventCard key={evt._id || evt.slug || evt.id} event={evt} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-[#77776F] bg-white rounded-3xl border border-[#E7E2D8]">
              <p className="text-sm">No featured events found. Visit the events directory or seed demo events.</p>
              <Link href="/events" className="inline-block mt-3 text-xs font-semibold text-[#073F2E] underline">
                Browse all events →
              </Link>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
