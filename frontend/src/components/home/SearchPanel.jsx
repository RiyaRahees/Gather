"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, LayoutGrid, ArrowRight, ChevronDown, Check } from "lucide-react";

const LOCATIONS = [
  { value: "all", label: "Any Location & Format", subtitle: "Physical venues & virtual streams" },
  { value: "Kochi", label: "Kochi", subtitle: "Kerala, India" },
  { value: "Bengaluru", label: "Bengaluru", subtitle: "Karnataka, India" },
  { value: "Hyderabad", label: "Hyderabad", subtitle: "Telangana, India" },
  { value: "Mumbai", label: "Mumbai", subtitle: "Maharashtra, India" },
  { value: "Online", label: "Virtual / Online Stream", subtitle: "Interactive live broadcast" },
];

const CATEGORIES = [
  { value: "all", label: "All Disciplines", subtitle: "All workshop topics" },
  { value: "Design", label: "Design", subtitle: "UI/UX, typography & systems" },
  { value: "Technology", label: "Technology", subtitle: "AI, engineering & dev" },
  { value: "Creative Arts", label: "Creative Arts", subtitle: "Canvas, audio & media" },
  { value: "Business", label: "Business", subtitle: "Strategy & venture scale" },
  { value: "Marketing", label: "Marketing", subtitle: "Brand & growth operations" },
  { value: "Personal Growth", label: "Personal Growth", subtitle: "Mindfulness & craft" },
];

export default function SearchPanel({ onSearch }) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("all");
  const [category, setCategory] = useState("all");

  const [locationOpen, setLocationOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const locationRef = useRef(null);
  const categoryRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setLocationOpen(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setCategoryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("search", keyword.trim());
    if (location && location !== "all") params.set("location", location);
    if (category && category !== "all") params.set("category", category);

    const targetUrl = `/events?${params.toString()}`;
    if (onSearch) {
      onSearch({ keyword, location, category });
    } else {
      router.push(targetUrl);
    }
  };

  const selectedLocation = LOCATIONS.find((l) => l.value === location) || LOCATIONS[0];
  const selectedCategory = CATEGORIES.find((c) => c.value === category) || CATEGORIES[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 mb-10 sm:mb-16 relative z-30">
      <form
        onSubmit={handleSubmit}
        suppressHydrationWarning
        className="bg-white border border-[#E7E2D8] rounded-2xl md:rounded-full px-3 py-2 shadow-sm flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-[#E7E2D8]"
      >
        {/* Search Input */}
        <div className="flex-1 flex items-center px-4 py-2.5 md:py-1 gap-3">
          <Search className="w-4 h-4 text-[#77776F] flex-shrink-0" />
          <input
            suppressHydrationWarning
            type="text"
            placeholder="What would you like to learn?"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-transparent text-[13px] text-[#171915] placeholder-[#77776F] focus:outline-none"
          />
        </div>

        {/* Custom Location Filter */}
        <div className="flex-1 relative" ref={locationRef}>
          <button
            type="button"
            onClick={() => {
              setLocationOpen((prev) => !prev);
              setCategoryOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 md:py-1 gap-2.5 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <MapPin className="w-4 h-4 text-[#073F2E] shrink-0" />
              <div className="truncate">
                <span className="block text-[13px] font-semibold text-[#171915] truncate">
                  {selectedLocation.label}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#77776F] transition-transform duration-200 shrink-0 ${
                locationOpen ? "rotate-180 text-[#073F2E]" : ""
              }`}
            />
          </button>

          {/* Location Popover Menu */}
          {locationOpen && (
            <div className="absolute top-full left-0 right-0 md:w-64 mt-2 z-50 bg-[#FFFEFA] border border-[#E7E2D8] rounded-2xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#77776F] border-b border-[#E7E2D8]/60 mb-1">
                Select Location / Mode
              </div>
              {LOCATIONS.map((loc) => {
                const isSelected = location === loc.value;
                return (
                  <button
                    key={loc.value}
                    type="button"
                    onClick={() => {
                      setLocation(loc.value);
                      setLocationOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#EBF3E8] text-[#073F2E] font-bold border border-[#073F2E]/15"
                        : "hover:bg-[#FAF8F5] text-[#171915]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block leading-tight">{loc.label}</span>
                      <span className="text-[10px] text-[#77776F]">{loc.subtitle}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#073F2E] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Category Filter */}
        <div className="flex-1 relative" ref={categoryRef}>
          <button
            type="button"
            onClick={() => {
              setCategoryOpen((prev) => !prev);
              setLocationOpen(false);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 md:py-1 gap-2.5 text-left cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutGrid className="w-4 h-4 text-[#073F2E] shrink-0" />
              <div className="truncate">
                <span className="block text-[13px] font-semibold text-[#171915] truncate">
                  {selectedCategory.label}
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-[#77776F] transition-transform duration-200 shrink-0 ${
                categoryOpen ? "rotate-180 text-[#073F2E]" : ""
              }`}
            />
          </button>

          {/* Category Popover Menu */}
          {categoryOpen && (
            <div className="absolute top-full left-0 right-0 md:w-64 mt-2 z-50 bg-[#FFFEFA] border border-[#E7E2D8] rounded-2xl shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#77776F] border-b border-[#E7E2D8]/60 mb-1">
                Select Discipline
              </div>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => {
                      setCategory(cat.value);
                      setCategoryOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#EBF3E8] text-[#073F2E] font-bold border border-[#073F2E]/15"
                        : "hover:bg-[#FAF8F5] text-[#171915]"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-semibold block leading-tight">{cat.label}</span>
                      <span className="text-[10px] text-[#77776F]">{cat.subtitle}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#073F2E] shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit Search Button */}
        <div className="pt-2 md:pt-0 pl-0 md:pl-2">
          <button
            suppressHydrationWarning
            type="submit"
            className="btn-forest w-full md:w-auto px-6 py-2.5 rounded-xl md:rounded-full text-[13px] font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Search</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
