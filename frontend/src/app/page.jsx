import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import SearchPanel from "@/components/home/SearchPanel";
import FeaturedEvents from "@/components/home/FeaturedEvents";
import CategoryGrid from "@/components/home/CategoryGrid";
import CommunityFeature from "@/components/home/CommunityFeature";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import HostBanner from "@/components/home/HostBanner";
import { getApiUrl } from "@/lib/api";

export const dynamic = "force-dynamic";

async function getLandingData() {
  try {
    const res = await fetch(getApiUrl("/api/events"), {
      cache: "no-store",
    });

    if (res.ok) {
      const data = await res.json();
      const allEvents = data.events || [];
      const featured = allEvents.filter((e) => e.isFeatured);
      const featuredEvents = featured.length > 0 ? featured.slice(0, 4) : allEvents.slice(0, 4);

      const categoryCounts = {};
      allEvents.forEach((e) => {
        if (e.category) {
          categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
        }
      });

      return {
        featuredEvents,
        categoryCounts,
        totalEvents: allEvents.length,
      };
    }
  } catch (err) {
    console.error("Failed to fetch events for landing page:", err);
  }

  return { featuredEvents: [], categoryCounts: {}, totalEvents: 0 };
}

export default async function HomePage() {
  const { featuredEvents, categoryCounts } = await getLandingData();

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4ED] text-[#171915]">
      <Navbar />

      <main className="flex-1">
        <HeroSection featuredEvent={featuredEvents[0]} />
        <SearchPanel />
        <FeaturedEvents events={featuredEvents} />
        <CategoryGrid categoryCounts={categoryCounts} />
        <CommunityFeature />
        <TestimonialsSection />
        <HostBanner />
      </main>

      <Footer />
    </div>
  );
}
