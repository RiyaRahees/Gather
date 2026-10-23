"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EventCard from "@/components/events/EventCard";
import { getApiUrl } from "@/lib/api";
import {
  Search,
  MapPin,
  Filter,
  Sparkles,
  X,
  RefreshCw,
  ChevronDown,
  Check,
  Globe,
} from "lucide-react";

const CATEGORIES = ["All", "Design", "Technology", "Business", "Marketing", "Personal Growth", "Creative Arts"];

const LOCATIONS = [
  { value: "all", label: "All Locations", subtitle: "All venues & online streams" },
  { value: "Kochi", label: "Kochi", subtitle: "Kerala, India" },
  { value: "Bengaluru", label: "Bengaluru", subtitle: "Karnataka, India" },
  { value: "Hyderabad", label: "Hyderabad", subtitle: "Telangana, India" },
  { value: "Mumbai", label: "Mumbai", subtitle: "Maharashtra, India" },
  { value: "Online", label: "Online / Stream", subtitle: "Interactive live broadcast" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first", subtitle: "Recently scheduled sessions" },
  { value: "price-low", label: "Price: Low to High", subtitle: "Affordable admission passes" },
  { value: "price-high", label: "Price: High to Low", subtitle: "Premium masterclasses" },
  { value: "seats", label: "Most Seats Available", subtitle: "Open capacity sessions" },
];

function EventsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const initialSearch = searchParams.get("search") || "";
  const initialLocation = searchParams.get("location") || "all";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [location, setLocation] = useState(initialLocation);
  const [sort, setSort] = useState("newest");

  // Custom Dropdown Open States
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const locationDropdownRef = useRef(null);
  const sortDropdownRef = useRef(null);

  // Close custom dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
        setLocationDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep state in sync when user clicks navbar links or browser back/forward with query params
  useEffect(() => {
    const urlCategory = searchParams.get("category") || "All";
    const urlSearch = searchParams.get("search") || "";
    const urlLocation = searchParams.get("location") || "all";
    setCategory(urlCategory);
    setSearch(urlSearch);
    setLocation(urlLocation);
  }, [searchParams]);

  useEffect(() => {
    fetchEvents();
  }, [category, location, sort]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (category && category !== "All") params.set("category", category);
      if (location && location !== "all") params.set("location", location);
      if (sort) params.set("sort", sort);

      const res = await fetch(getApiUrl(`/api/events?${params.toString()}`));
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  const selectedLocation = LOCATIONS.find((l) => l.value === location) || LOCATIONS[0];
  const selectedSort = SORT_OPTIONS.find((s) => s.value === sort) || SORT_OPTIONS[0];

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#77776F] block mb-2">
          EXPLORE CATALOGUE
        </span>
        <h1 className="font-serif text-4xl sm:text-5xl font-medium tracking-tight text-[#171915]">
          Curated Experiences &amp; Masterclasses
        </h1>
        <p className="text-sm sm:text-base text-[#77776F] mt-2 max-w-xl">
          Discover high-substance workshops led by practitioners. Reserve your seat with instant confirmation.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-[#E7E2D8] p-4 mb-8 shadow-sm space-y-4">
        
        {/* Top: Search Input and Location */}
        <form onSubmit={handleSearchSubmit} suppressHydrationWarning className="flex flex-col md:flex-row gap-3">
          
          {/* Keyword Search Input */}
          <div className="flex-1 flex items-center px-4 py-2.5 rounded-xl bg-[#F7F4ED] border border-[#E7E2D8] gap-3 focus-within:border-[#073F2E] focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-[#77776F] flex-shrink-0" />
            <input
              suppressHydrationWarning
              type="text"
              placeholder="Search title, topics, organizer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm text-[#171915] placeholder-[#77776F] focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-[#77776F] hover:text-[#171915] p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Professional Custom Location Dropdown */}
          <div className="relative md:w-64" ref={locationDropdownRef}>
            <button
              type="button"
              id="location-dropdown-trigger"
              onClick={() => {
                setLocationDropdownOpen((prev) => !prev);
                setSortDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm transition-all cursor-pointer shadow-2xs ${
                locationDropdownOpen
                  ? "bg-white border-[#073F2E] ring-2 ring-[#073F2E]/10"
                  : "bg-[#F7F4ED] border-[#E7E2D8] hover:bg-white hover:border-[#073F2E]/40"
              }`}
              aria-haspopup="listbox"
              aria-expanded={locationDropdownOpen}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center shrink-0">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-xs sm:text-sm text-[#171915] truncate">
                  {selectedLocation.label}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[#77776F] transition-transform duration-200 shrink-0 ml-1.5 ${
                  locationDropdownOpen ? "rotate-180 text-[#073F2E]" : ""
                }`}
              />
            </button>

            {/* Location Popover Menu */}
            {locationDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[#FFFEFA] border border-[#E7E2D8] rounded-2xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#77776F] border-b border-[#E7E2D8]/60 mb-1">
                  Filter by City / Format
                </div>
                {LOCATIONS.map((loc) => {
                  const isSelected = location === loc.value;
                  return (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => {
                        setLocation(loc.value);
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#EBF3E8] text-[#073F2E] font-bold border border-[#073F2E]/15"
                          : "hover:bg-[#FAF8F5] text-[#171915]"
                      }`}
                    >
                      <div>
                        <span className="text-xs sm:text-sm font-semibold block leading-tight">
                          {loc.label}
                        </span>
                        <span className="text-[10px] text-[#77776F]">
                          {loc.subtitle}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#073F2E] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit Search Button */}
          <button
            suppressHydrationWarning
            type="submit"
            className="btn-forest px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Filter</span>
          </button>
        </form>

        {/* Bottom: Category Pills & Custom Sort Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#E7E2D8]/60">
          
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {["All", ...Array.from(new Set(["Design", "Technology", "Business", "Marketing", "Personal Growth", "Creative Arts", ...events.map((e) => e.category).filter(Boolean)]))].map((cat) => {
              const active = category.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? "bg-[#073F2E] text-white shadow-sm"
                      : "bg-[#F7F4ED] text-[#77776F] hover:text-[#171915] hover:bg-[#E7E2D8]/70"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Professional Custom Sort Dropdown */}
          <div className="relative self-end sm:self-auto flex items-center gap-2" ref={sortDropdownRef}>
            <span className="text-xs text-[#77776F] font-medium">Sort:</span>
            
            <button
              type="button"
              id="sort-dropdown-trigger"
              onClick={() => {
                setSortDropdownOpen((prev) => !prev);
                setLocationDropdownOpen(false);
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                sortDropdownOpen
                  ? "bg-white border-[#073F2E] ring-2 ring-[#073F2E]/10 text-[#073F2E]"
                  : "bg-[#F7F4ED] border-[#E7E2D8] hover:bg-white text-[#171915]"
              }`}
              aria-haspopup="listbox"
              aria-expanded={sortDropdownOpen}
            >
              <span>{selectedSort.label}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#77776F] transition-transform duration-200 ${
                  sortDropdownOpen ? "rotate-180 text-[#073F2E]" : ""
                }`}
              />
            </button>

            {/* Sort Popover Menu */}
            {sortDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 z-40 w-56 bg-[#FFFEFA] border border-[#E7E2D8] rounded-2xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#77776F] border-b border-[#E7E2D8]/60 mb-1">
                  Sort Results By
                </div>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sort === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSort(opt.value);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#EBF3E8] text-[#073F2E] font-bold border border-[#073F2E]/15"
                          : "hover:bg-[#FAF8F5] text-[#171915]"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-semibold block leading-tight">
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-[#77776F]">
                          {opt.subtitle}
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#073F2E] shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#77776F] gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-[#073F2E]" />
          <p className="text-sm font-medium">Loading curated experiences...</p>
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {events.map((evt) => (
            <EventCard key={evt._id || evt.slug} event={evt} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#E7E2D8] p-12 text-center max-w-md mx-auto my-12 space-y-3">
          <p className="font-serif text-xl font-bold text-[#171915]">No workshops match your criteria</p>
          <p className="text-xs text-[#77776F]">
            Try adjusting your search terms or selecting &ldquo;All Disciplines&rdquo;.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setCategory("All");
              setLocation("all");
            }}
            className="btn-forest px-5 py-2 rounded-full text-xs font-semibold inline-block mt-2 cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      )}

    </div>
  );
}

export default function EventsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F4ED] text-[#171915]">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="p-10 text-center">Loading catalogue...</div>}>
          <EventsContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
