"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import PriceTag from "@/components/common/PriceTag";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  Calendar,
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Users,
  CreditCard,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  Image as ImageIcon,
  IndianRupee,
  Tag,
  Globe,
  Building2,
  Check,
  Armchair,
  PieChart,
  SlidersHorizontal,
  ChevronDown,
  Star,
  MoreVertical,
  Search,
  ArrowUpRight,
  Eye,
  EyeOff,
} from "lucide-react";

const IMAGE_PRESETS = [
  { label: "Design Studio Workshop", path: "/images/event-design-studio.jpg" },
  { label: "AI & Tech Workshop", path: "/images/event-ai-coding.jpg" },
  { label: "Creative Coding Shaders", path: "/images/event-creative-coding.jpg" },
  { label: "Business Summit", path: "/images/event-business-summit.jpg" },
  { label: "Editorial Marketing", path: "/images/event-marketing-mastery.jpg" },
  { label: "Personal Growth & Work", path: "/images/cat-personal.jpg" },
  { label: "Community Gathering", path: "/images/community-gathering.jpg" },
];

const CATEGORIES = [
  "Design",
  "Technology",
  "Business",
  "Marketing",
  "Personal Growth",
  "Creative Arts",
];

export default function AdminEventsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, isAdmin } = useAuth();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [deleteEventState, setDeleteEventState] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [unpublishLoading, setUnpublishLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technology");
  const [image, setImage] = useState("/images/event-design-studio.jpg");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [price, setPrice] = useState(0);
  const [totalSeats, setTotalSeats] = useState(30);
  const [organizerName, setOrganizerName] = useState("Gather Curator");
  const [isPublished, setIsPublished] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Custom Dropdown States for Modal
  const [isModalCategoryOpen, setIsModalCategoryOpen] = useState(false);
  const [isModalImageOpen, setIsModalImageOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      fetchEvents();

      // Check for pre-fill parameters from curator proposal conversion
      if (searchParams.get("create") === "true") {
        setEditingEvent(null);
        if (searchParams.get("title")) setTitle(searchParams.get("title"));
        if (searchParams.get("category")) setCategory(searchParams.get("category"));
        if (searchParams.get("venue")) setVenue(searchParams.get("venue"));
        if (searchParams.get("price")) setPrice(parseInt(searchParams.get("price"), 10) || 0);
        if (searchParams.get("organizer")) setOrganizerName(searchParams.get("organizer"));
        if (searchParams.get("description")) setDescription(searchParams.get("description"));
        setDate("Dec 15, 2026");
        setTime("10:00 AM - 3:00 PM IST");
        setTotalSeats(25);
        setImage(
          searchParams.get("category") === "Design"
            ? "/images/event-design-studio.jpg"
            : searchParams.get("category") === "Technology"
            ? "/images/event-ai-coding.jpg"
            : "/images/event-business-summit.jpg"
        );
        setIsPublished(true);
        setIsFeatured(true);
        setModalOpen(true);
      }
    }
  }, [user, authLoading, isAdmin, searchParams]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const adminToken =
        (typeof window !== "undefined" ? localStorage.getItem("admintoken") : null) ||
        (typeof window !== "undefined" ? localStorage.getItem("usertoken") : null);
      const headers = adminToken
        ? { "x-admin-token": adminToken, Authorization: `Bearer ${adminToken}` }
        : {};

      const res = await fetch("/api/admin/events", {
        headers,
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load admin events:", err);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingEvent(null);
    setTitle("");
    setDescription("");
    setCategory("Design");
    setImage("/images/event-design-studio.jpg");
    setDate("Dec 10, 2026");
    setTime("10:00 AM - 3:00 PM IST");
    setVenue("Fort Kochi Studio Hub");
    setPrice(499);
    setTotalSeats(25);
    setOrganizerName("Gather Curator");
    setIsPublished(true);
    setIsFeatured(true);
    setFormError("");
    setIsModalCategoryOpen(false);
    setIsModalImageOpen(false);
    setModalOpen(true);
  };

  const openEditModal = (evt) => {
    setEditingEvent(evt);
    setTitle(evt.title);
    setDescription(evt.description);
    setCategory(evt.category);
    setImage(evt.image);
    setDate(evt.date);
    setTime(evt.time);
    setVenue(evt.venue);
    setPrice(evt.price);
    setTotalSeats(evt.totalSeats);
    setOrganizerName(evt.organizerName || "Gather Curator");
    setIsPublished(evt.isPublished !== false);
    setIsFeatured(!!evt.isFeatured);
    setFormError("");
    setIsModalCategoryOpen(false);
    setIsModalImageOpen(false);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    setFeedback("");

    const payload = {
      title,
      description,
      category,
      image,
      date,
      time,
      venue,
      price: parseFloat(price) || 0,
      totalSeats: parseInt(totalSeats, 10),
      organizerName,
      isPublished,
      isFeatured,
    };

    try {
      const url = editingEvent ? `/api/events/${editingEvent._id}` : "/api/events";
      const method = editingEvent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save event");
      }

      setFeedback(editingEvent ? "Event updated successfully." : "Event created successfully.");
      setModalOpen(false);
      fetchEvents();
    } catch (err) {
      setFormError(err.message || "Operation failed.");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteEventState) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/events/${deleteEventState.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        // Show the exact message inside the dialog so the admin understands why deletion was prevented
        setDeleteEventState((prev) => ({
          ...prev,
          errorMessage: data.error || "Failed to delete event.",
          bookedCount: data.bookedCount ?? prev?.bookedCount ?? 1,
        }));
      } else {
        setFeedback(`"${deleteEventState.title}" was deleted successfully.`);
        setDeleteEventState(null);
        fetchEvents();
      }
    } catch (err) {
      setDeleteEventState((prev) => ({
        ...prev,
        errorMessage: "Error deleting event: " + err.message,
      }));
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleQuickUnpublish = async () => {
    if (!deleteEventState) return;
    setUnpublishLoading(true);

    try {
      const res = await fetch(`/api/events/${deleteEventState.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isPublished: false }),
      });

      const data = await res.json();
      if (!res.ok) {
        setDeleteEventState((prev) => ({
          ...prev,
          errorMessage: data.error || "Failed to unpublish event.",
        }));
      } else {
        setFeedback(`"${deleteEventState.title}" was unpublished. Attendees' existing passes remain safe.`);
        setDeleteEventState(null);
        fetchEvents();
      }
    } catch (err) {
      setDeleteEventState((prev) => ({
        ...prev,
        errorMessage: "Error unpublishing event: " + err.message,
      }));
    } finally {
      setUnpublishLoading(false);
    }
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [dateFilter, setDateFilter] = useState("All Dates");

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [activeActionId, setActiveActionId] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getCategoryStyle = (category) => {
    switch (category) {
      case "Technology":
        return "bg-[#ECFDF5] text-[#059669]";
      case "Creative Arts":
        return "bg-[#F3E8FF] text-[#7E22CE]";
      case "Personal Growth":
        return "bg-[#FFEDD5] text-[#C2410C]";
      case "Design":
        return "bg-[#FCE7F3] text-[#BE185D]";
      case "Business":
        return "bg-[#E0F2FE] text-[#0369A1]";
      case "Marketing":
        return "bg-[#EDE9FE] text-[#6D28D9]";
      default:
        return "bg-[#FAF8F5] text-[#073F2E] border border-[#E7E2D8]";
    }
  };

  const filteredEvents = events.filter((evt) => {
    const matchesSearch =
      !searchQuery.trim() ||
      evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.venue?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.organizerName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "All Categories" ||
      evt.category?.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "All Statuses" ||
      (statusFilter === "Published" && evt.isPublished !== false) ||
      (statusFilter === "Draft" && evt.isPublished === false);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalSeatsAll = events.reduce((acc, curr) => acc + (curr.totalSeats || 0), 0);
  const totalAvailableSeats = events.reduce((acc, curr) => acc + (curr.availableSeats || 0), 0);
  const totalBookedSeats = totalSeatsAll - totalAvailableSeats;
  const publishedCount = events.filter((e) => e.isPublished).length;
  const occupancyRate = totalSeatsAll > 0 ? Math.round((totalBookedSeats / totalSeatsAll) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAF8F5] pb-14 text-[#171915]">
      {/* Top Header Bar matching Photo 1 */}
      <div className="h-16 px-4 sm:px-6 lg:px-10 border-b border-[#E7E2D8] bg-[#FAF8F5] flex items-center justify-end gap-3 sticky top-0 z-30">
        <button
          type="button"
          onClick={() => {}}
          className="p-2 rounded-xl text-[#77776F] hover:text-[#171915] hover:bg-white transition-colors cursor-pointer"
          title="Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl bg-white border border-[#E7E2D8] text-xs font-semibold text-[#171915] shadow-2xs cursor-pointer hover:bg-white/80 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#0E3B2E] text-white flex items-center justify-center text-xs font-bold font-numeric">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <span>Admin</span>
            <ChevronDown className={`w-3.5 h-3.5 text-[#77776F] transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb & Page Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#77776F] hover:text-[#073F2E] transition-colors"
              >
                <span>←</span>
                <span>Back to Dashboard</span>
              </Link>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-[#171915]">
              Events
            </h1>
            <p className="text-xs sm:text-sm text-[#77776F] mt-1">
              Manage your workshops, conferences, and attendee capacity.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#073F2E] hover:bg-[#052F22] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 self-start md:self-auto shadow-sm shadow-[#073F2E]/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create event</span>
          </button>
        </div>

        {feedback && (
          <div className="p-4 bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center justify-between shadow-sm animate-fadeIn">
            <div className="flex items-center gap-2.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{feedback}</span>
            </div>
            <button onClick={() => setFeedback("")} className="text-emerald-700 hover:text-emerald-900 p-1 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 4 Metric KPI Cards matching Photo 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Total Events */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EBF3E8] border border-[#D5E3D2]/60 text-[#073F2E] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#77776F]">Total events</div>
              <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">{events.length}</div>
              <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-0.5">
                <span>↗</span>
                <span>{publishedCount} active & public</span>
              </div>
            </div>
          </div>

          {/* Card 2: Registrations */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EBF2FE] border border-[#D0E1FD]/60 text-[#2563EB] flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#77776F]">Registrations</div>
              <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">{totalBookedSeats}</div>
              <div className="text-[11px] text-[#77776F]">Across all scheduled sessions</div>
            </div>
          </div>

          {/* Card 3: Available Seats */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEF6E8] border border-[#FDE5BE]/60 text-[#D97706] flex items-center justify-center shrink-0">
              <Armchair className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#77776F]">Available seats</div>
              <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">{totalAvailableSeats}</div>
              <div className="text-[11px] text-[#77776F]">Remaining seats to sell</div>
            </div>
          </div>

          {/* Card 4: Occupancy Rate */}
          <div className="bg-white rounded-2xl border border-[#E7E2D8] p-5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#FEECEC] border border-[#FDCACA]/60 text-[#DC2626] flex items-center justify-center shrink-0">
              <PieChart className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="text-xs font-medium text-[#77776F]">Occupancy rate</div>
              <div className="text-2xl font-numeric font-bold tracking-tight text-[#171915] my-0.5">{occupancyRate}%</div>
              <div className="text-[11px] text-[#77776F]">Overall catalog occupancy</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls matching Photo 1 */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#77776F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search events, venues, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E7E2D8] bg-white text-xs text-[#171915] placeholder-[#77776F] focus:outline-none focus:border-[#073F2E] transition-all shadow-2xs"
            />
          </div>

          {/* Right Filter Cluster matching exact photo */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* 1. All Categories Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryOpen(!isCategoryOpen);
                  setIsStatusOpen(false);
                  setIsDateOpen(false);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E2D8] text-xs font-medium text-[#171915] hover:border-[#073F2E] transition-colors shadow-2xs cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-[#77776F]" />
                <span>{categoryFilter}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#77776F] transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
              </button>
              {isCategoryOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 w-48 bg-white border border-[#E7E2D8] rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {["All Categories", "Technology", "Design", "Business", "Marketing", "Creative Arts", "Personal Growth"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategoryFilter(cat);
                        setIsCategoryOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                        categoryFilter === cat
                          ? "bg-[#EBF3E8] text-[#073F2E] font-semibold"
                          : "text-[#171915] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <span>{cat}</span>
                      {categoryFilter === cat && <Check className="w-3.5 h-3.5 text-[#073F2E]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. All Statuses Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsStatusOpen(!isStatusOpen);
                  setIsCategoryOpen(false);
                  setIsDateOpen(false);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E2D8] text-xs font-medium text-[#171915] hover:border-[#073F2E] transition-colors shadow-2xs cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full ${statusFilter === "Published" ? "bg-emerald-500" : statusFilter === "Draft" ? "bg-gray-400" : "bg-[#171915]"}`} />
                <span>{statusFilter}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#77776F] transition-transform ${isStatusOpen ? "rotate-180" : ""}`} />
              </button>
              {isStatusOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 w-40 bg-white border border-[#E7E2D8] rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {["All Statuses", "Published", "Draft"].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        setStatusFilter(st);
                        setIsStatusOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                        statusFilter === st
                          ? "bg-[#EBF3E8] text-[#073F2E] font-semibold"
                          : "text-[#171915] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <span>{st}</span>
                      {statusFilter === st && <Check className="w-3.5 h-3.5 text-[#073F2E]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. All Dates Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsDateOpen(!isDateOpen);
                  setIsCategoryOpen(false);
                  setIsStatusOpen(false);
                }}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E2D8] text-xs font-medium text-[#171915] hover:border-[#073F2E] transition-colors shadow-2xs cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#77776F]" />
                <span>{dateFilter}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#77776F] transition-transform ${isDateOpen ? "rotate-180" : ""}`} />
              </button>
              {isDateOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 w-40 bg-white border border-[#E7E2D8] rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                  {["All Dates", "Upcoming", "This Month"].map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => {
                        setDateFilter(dt);
                        setIsDateOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between ${
                        dateFilter === dt
                          ? "bg-[#EBF3E8] text-[#073F2E] font-semibold"
                          : "text-[#171915] hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <span>{dt}</span>
                      {dateFilter === dt && <Check className="w-3.5 h-3.5 text-[#073F2E]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Filters Button */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("All Categories");
                setStatusFilter("All Statuses");
                setDateFilter("All Dates");
              }}
              title="Reset filters"
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-[#E7E2D8] text-xs font-medium text-[#171915] hover:border-[#073F2E] transition-colors shadow-2xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#77776F]" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Events Table matching Photo 1 */}
        <div className="bg-white rounded-2xl border border-[#E7E2D8] shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-[#77776F]">
              <Loader2 className="w-7 h-7 animate-spin mx-auto text-[#073F2E] mb-3" />
              <p className="text-xs font-medium">Loading event catalogue...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#E7E2D8] text-[#77776F] uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-5 font-bold">EVENT</th>
                    <th className="py-3 px-4 font-bold">CATEGORY</th>
                    <th className="py-3 px-4 font-bold">DATE & VENUE</th>
                    <th className="py-3 px-4 font-bold">PRICE</th>
                    <th className="py-3 px-4 font-bold">CAPACITY</th>
                    <th className="py-3 px-4 font-bold">STATUS</th>
                    <th className="py-3 px-5 font-bold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E2D8]/70">
                  {filteredEvents.map((evt) => {
                    const booked = Math.max(0, (evt.totalSeats || 50) - (evt.availableSeats ?? 49));
                    const total = evt.totalSeats || 50;
                    const percentFilled = total > 0 ? Math.round((booked / total) * 100) : 0;
                    const isDropdownActive = activeActionId === evt._id;

                    return (
                      <tr key={evt._id} className="hover:bg-[#FAF8F5]/80 transition-colors group">
                        {/* 1. EVENT */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#FAF8F5] border border-[#E7E2D8] shrink-0 relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={evt.image || "/images/event-design-studio.jpg"}
                                alt={evt.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="min-w-0 max-w-xs sm:max-w-sm">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm text-[#171915] truncate" title={evt.title}>
                                  {evt.title}
                                </span>
                                {evt.isFeatured && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#FEF3C7] text-[#92400E] px-2 py-0.5 rounded-full shrink-0">
                                    <Star className="w-2.5 h-2.5 fill-[#D97706] text-[#D97706]" />
                                    <span>Featured</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-[#77776F] truncate mt-0.5">
                                by {evt.organizerName || "Gather Curator"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 2. CATEGORY */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`inline-block px-3 py-1 rounded-lg text-[11px] font-semibold ${getCategoryStyle(evt.category)}`}>
                            {evt.category || "Workshop"}
                          </span>
                        </td>

                        {/* 3. DATE & VENUE */}
                        <td className="py-4 px-4">
                          <div className="text-xs font-medium text-[#171915] whitespace-nowrap flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#77776F] shrink-0" />
                            <span>{evt.date || "Oct 25, 2026"}</span>
                          </div>
                          <div className="text-[11px] text-[#77776F] truncate max-w-[160px] flex items-center gap-1.5 mt-0.5" title={evt.venue}>
                            <MapPin className="w-3.5 h-3.5 text-[#77776F] shrink-0" />
                            <span className="truncate">{evt.venue || "Fort Kochi Studio Hub"}</span>
                          </div>
                        </td>

                        {/* 4. PRICE */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-semibold text-xs sm:text-sm text-[#171915] font-numeric">
                            {evt.price === 0 ? "Free" : `₹${Number(evt.price).toLocaleString("en-IN")}`}
                          </span>
                        </td>

                        {/* 5. CAPACITY */}
                        <td className="py-4 px-4 min-w-[130px]">
                          <div className="text-xs font-medium text-[#171915]">
                            <span>{booked}</span>
                            <span className="text-[#77776F]"> / {total} seats</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-20 sm:w-24 bg-[#E7E2D8] rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-[#073F2E] h-full rounded-full transition-all"
                                style={{ width: `${percentFilled}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[#77776F] font-numeric font-medium">{percentFilled}%</span>
                          </div>
                        </td>

                        {/* 6. STATUS */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {evt.isPublished !== false ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EBF3E8] text-[#073F2E]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                              <span>Published</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F3F4F6] text-[#4B5563]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#9CA3AF]" />
                              <span>Draft</span>
                            </span>
                          )}
                        </td>

                        {/* 7. ACTIONS (Three-dots button with dropdown) */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setActiveActionId(isDropdownActive ? null : evt._id)}
                              className="p-1.5 text-[#77776F] hover:text-[#171915] rounded-lg hover:bg-white transition-colors cursor-pointer"
                              title="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {isDropdownActive && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E7E2D8] rounded-xl shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionId(null);
                                    openEditModal(evt);
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-[#171915] hover:bg-[#FAF8F5] flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Edit Event</span>
                                </button>

                                <Link
                                  href={`/events/${evt.slug || evt._id}`}
                                  target="_blank"
                                  onClick={() => setActiveActionId(null)}
                                  className="w-full text-left px-3.5 py-2 text-xs text-[#171915] hover:bg-[#FAF8F5] flex items-center gap-2"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-[#073F2E]" />
                                  <span>Preview Page</span>
                                </Link>

                                <Link
                                  href={`/admin/bookings?search=${encodeURIComponent(evt.title)}`}
                                  onClick={() => setActiveActionId(null)}
                                  className="w-full text-left px-3.5 py-2 text-xs text-[#171915] hover:bg-[#FAF8F5] flex items-center gap-2"
                                >
                                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Attendees ({booked})</span>
                                </Link>

                                <div className="border-t border-[#E7E2D8] my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveActionId(null);
                                    const bookedCount = Math.max(0, (evt.totalSeats || 0) - (evt.availableSeats || 0));
                                    setDeleteEventState({
                                      id: evt._id,
                                      title: evt.title,
                                      bookedCount,
                                      isPublished: evt.isPublished,
                                      errorMessage: "",
                                    });
                                  }}
                                  className="w-full text-left px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete Event</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-[#77776F] space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF3E8] text-[#073F2E] flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-7 h-7" />
              </div>
              <div>
                <p className="font-serif text-xl font-bold text-[#171915]">No events created yet</p>
                <p className="text-xs text-[#77776F] max-w-sm mx-auto mt-1">
                  Your event catalog is completely clear. Click below to publish your first masterclass or workshop.
                </p>
              </div>
              <button
                onClick={openCreateModal}
                className="btn-forest px-5 py-2.5 rounded-full text-xs font-semibold inline-flex items-center gap-2 shadow-sm shadow-[#073F2E]/20 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Create Your First Event</span>
              </button>
            </div>
          ) : (
            <div className="py-16 text-center text-[#77776F]">
              <p className="text-sm font-medium">No events found matching your filter criteria.</p>
              <p className="text-xs text-[#77776F]/80 mt-1">Try resetting the search or category filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E7E2D8] max-w-2xl w-full shadow-2xl my-auto overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Modal Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 px-4 sm:px-8 py-4 sm:py-5 border-b border-[#E7E2D8] flex items-center justify-between shrink-0">
              <div>
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <h2 className="font-serif text-lg sm:text-2xl font-bold text-[#171915]">
                    {editingEvent ? "Edit Event" : "Create Masterclass / Event"}
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E8F8F0] text-[#065F46] border border-[#A7F3D0]">
                    {editingEvent ? "Editing" : "Catalogue"}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#77776F] mt-0.5">
                  Configure event metadata, ticketing, schedule, and discovery settings.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full border border-[#E7E2D8] hover:bg-[#FAF8F5] text-[#77776F] hover:text-[#171915] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div
                onClick={() => {
                  setIsModalCategoryOpen(false);
                  setIsModalImageOpen(false);
                }}
                className="overflow-y-auto px-4 sm:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6 flex-1 text-xs"
              >
                {formError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span className="font-medium">{formError}</span>
                  </div>
                )}

                {/* Section 1: General Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>General Information</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                      Event Title <span className="text-emerald-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Next-Gen Generative AI & Creative Coding Masterclass"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF9F6] focus:bg-white text-sm text-[#171915] placeholder-[#9CA3AF] focus:outline-none focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                      Description <span className="text-emerald-600">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Outline the curriculum, prerequisites, hands-on projects, and attendee outcomes..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF9F6] focus:bg-white text-sm text-[#171915] placeholder-[#9CA3AF] focus:outline-none focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10 transition-all resize-y"
                    />
                  </div>
                </div>

                {/* Section 2: Category & Cover Media */}
                <div className="space-y-4 pt-4 border-t border-[#F2EDE4]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] uppercase tracking-wider">
                    <Tag className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Category & Visuals</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Professional Custom Category Dropdown */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Category <span className="text-emerald-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsModalCategoryOpen(!isModalCategoryOpen);
                          setIsModalImageOpen(false);
                        }}
                        className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#FAF9F6] text-xs font-semibold text-[#171915] flex items-center justify-between transition-all cursor-pointer ${
                          isModalCategoryOpen
                            ? "border-[#073F2E] bg-white ring-4 ring-[#073F2E]/10 shadow-xs"
                            : "border-[#E7E2D8] hover:border-[#073F2E] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-[#073F2E]" />
                          <span>{category}</span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#77776F] transition-transform duration-200 ${
                            isModalCategoryOpen ? "rotate-180 text-[#073F2E]" : ""
                          }`}
                        />
                      </button>

                      {isModalCategoryOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E7E2D8] rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto"
                        >
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setCategory(cat);
                                setIsModalCategoryOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                category === cat
                                  ? "bg-[#EBF3E8] text-[#073F2E] font-bold"
                                  : "text-[#171915] hover:bg-[#FAF8F5]"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    category === cat ? "bg-[#073F2E]" : "bg-[#D5D0C7]"
                                  }`}
                                />
                                <span>{cat}</span>
                              </div>
                              {category === cat && (
                                <Check className="w-3.5 h-3.5 text-[#073F2E] shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Professional Custom Cover Image Preset Dropdown */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Cover Image Preset <span className="text-emerald-600">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsModalImageOpen(!isModalImageOpen);
                          setIsModalCategoryOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-xl border bg-[#FAF9F6] text-xs font-semibold text-[#171915] flex items-center justify-between transition-all cursor-pointer ${
                          isModalImageOpen
                            ? "border-[#073F2E] bg-white ring-4 ring-[#073F2E]/10 shadow-xs"
                            : "border-[#E7E2D8] hover:border-[#073F2E] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="w-7 h-5 rounded-md overflow-hidden shrink-0 border border-[#E7E2D8] bg-[#E7E2D8]/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={image} alt="preset" className="w-full h-full object-cover" />
                          </div>
                          <span className="truncate">
                            {IMAGE_PRESETS.find((p) => p.path === image)?.label || "Select Preset"}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-[#77776F] shrink-0 transition-transform duration-200 ${
                            isModalImageOpen ? "rotate-180 text-[#073F2E]" : ""
                          }`}
                        />
                      </button>

                      {isModalImageOpen && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E7E2D8] rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-64 overflow-y-auto"
                        >
                          {IMAGE_PRESETS.map((p) => (
                            <button
                              key={p.path}
                              type="button"
                              onClick={() => {
                                setImage(p.path);
                                setIsModalImageOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                image === p.path
                                  ? "bg-[#EBF3E8] text-[#073F2E] font-bold"
                                  : "text-[#171915] hover:bg-[#FAF8F5]"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                <div className="w-8 h-5 rounded-md overflow-hidden shrink-0 border border-[#E7E2D8] bg-[#E7E2D8]/40">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={p.path} alt={p.label} className="w-full h-full object-cover" />
                                </div>
                                <span className="truncate">{p.label}</span>
                              </div>
                              {image === p.path && (
                                <Check className="w-3.5 h-3.5 text-[#073F2E] shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clean Visual Preview Card */}
                  {image && (
                    <div className="rounded-2xl border border-[#E7E2D8] p-2.5 bg-[#FAF9F6] flex items-center gap-3.5">
                      <div className="relative w-28 h-16 rounded-xl overflow-hidden shrink-0 border border-[#E7E2D8] bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#064E3B] px-1.5 py-0.5 rounded bg-[#E8F8F0]">
                            {category}
                          </span>
                          <span className="text-[11px] text-[#77776F]">16:9 Cover Banner</span>
                        </div>
                        <p className="text-xs font-medium text-[#171915] truncate mt-1">
                          {IMAGE_PRESETS.find((p) => p.path === image)?.label || "Custom Image Asset"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Schedule & Venue */}
                <div className="space-y-4 pt-4 border-t border-[#F2EDE4]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Schedule & Location</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Date <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-[#77776F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                          placeholder="e.g. Dec 10, 2026"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF9F6] focus:bg-white text-sm text-[#171915] placeholder-[#9CA3AF] focus:outline-none focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Time Slot <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative">
                        <Clock className="w-4 h-4 text-[#77776F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          placeholder="e.g. 10:00 AM – 3:00 PM IST"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF9F6] focus:bg-white text-sm text-[#171915] placeholder-[#9CA3AF] focus:outline-none focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                      Venue / Studio Location <span className="text-emerald-600">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-[#77776F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g. Fort Kochi Design Studio Hub, Kochi, Kerala"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF9F6] focus:bg-white text-sm text-[#171915] placeholder-[#9CA3AF] focus:outline-none focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 4: Ticketing & Capacity */}
                <div className="space-y-4 pt-4 border-t border-[#F2EDE4]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] uppercase tracking-wider">
                    <IndianRupee className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Ticketing & Capacity</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Price in INR <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#77776F] font-numeric pointer-events-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={0}
                          required
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                          className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF9F6] focus:bg-white text-sm font-numeric text-[#171915] focus:outline-none focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-[#77776F] mt-1">Set 0 for free attendance</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Seat Capacity <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-[#77776F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="number"
                          min={1}
                          required
                          value={totalSeats}
                          onChange={(e) => setTotalSeats(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF9F6] focus:bg-white text-sm font-numeric text-[#171915] focus:outline-none focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-[#77776F] mt-1">Total seats available</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#171915] mb-1.5">
                        Host / Curator <span className="text-emerald-600">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="w-4 h-4 text-[#77776F] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={organizerName}
                          onChange={(e) => setOrganizerName(e.target.value)}
                          placeholder="e.g. Gather Curator"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#E7E2D8] bg-[#FAF9F6] focus:bg-white text-sm text-[#171915] placeholder-[#9CA3AF] focus:outline-none focus:border-[#064E3B] focus:ring-4 focus:ring-[#064E3B]/10 transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-[#77776F] mt-1">Organizer display name</p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Visibility & Publishing Switches */}
                <div className="space-y-3 pt-4 border-t border-[#F2EDE4]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-2">
                    <Globe className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Visibility & Discovery</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Switch 1: Publish immediately */}
                    <div
                      onClick={() => setIsPublished(!isPublished)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isPublished
                          ? "bg-[#E8F8F0]/40 border-[#A7F3D0]"
                          : "bg-[#FAF9F6] border-[#E7E2D8] hover:bg-white"
                      }`}
                    >
                      <div className="pr-3">
                        <p className="text-xs font-bold text-[#171915]">Publish immediately</p>
                        <p className="text-[11px] text-[#77776F] mt-0.5">
                          Make live in the attendee catalogue
                        </p>
                      </div>
                      {/* Modern iOS/Linear Toggle Switch */}
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                          isPublished ? "bg-[#064E3B]" : "bg-neutral-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center ${
                            isPublished ? "translate-x-5" : "translate-x-0"
                          }`}
                        >
                          {isPublished && <Check className="w-3 h-3 text-[#064E3B]" />}
                        </div>
                      </div>
                    </div>

                    {/* Switch 2: Feature on Homepage */}
                    <div
                      onClick={() => setIsFeatured(!isFeatured)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isFeatured
                          ? "bg-[#E8F8F0]/40 border-[#A7F3D0]"
                          : "bg-[#FAF9F6] border-[#E7E2D8] hover:bg-white"
                      }`}
                    >
                      <div className="pr-3">
                        <p className="text-xs font-bold text-[#171915]">Feature on Homepage</p>
                        <p className="text-[11px] text-[#77776F] mt-0.5">
                          Spotlight in featured catalogue cards
                        </p>
                      </div>
                      {/* Modern Toggle Switch */}
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                          isFeatured ? "bg-[#064E3B]" : "bg-neutral-300"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center ${
                            isFeatured ? "translate-x-5" : "translate-x-0"
                          }`}
                        >
                          {isFeatured && <Check className="w-3 h-3 text-[#064E3B]" />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky Modal Action Footer */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md px-6 sm:px-8 py-4 border-t border-[#E7E2D8] flex items-center justify-between gap-3 shrink-0">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#77776F]">
                  <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Real-time catalog synchronization</span>
                </div>

                <div className="flex items-center gap-2.5 ml-auto">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 sm:px-5 py-2.5 rounded-xl border border-[#E7E2D8] bg-white text-xs font-semibold text-[#171915] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="btn-forest px-5 sm:px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm shadow-[#064E3B]/20 cursor-pointer disabled:opacity-50"
                  >
                    {formLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>{editingEvent ? "Save Changes" : "Create Event"}</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modern Confirmation Dialog with Attendee Safeguard */}
      <ConfirmDialog
        isOpen={Boolean(deleteEventState)}
        title="Delete Event?"
        description={
          <>
            Are you sure you want to permanently delete{" "}
            <span className="font-semibold text-[#171915]">
              &ldquo;{deleteEventState?.title}&rdquo;
            </span>
            ? This action cannot be undone.
          </>
        }
        errorMessage={deleteEventState?.errorMessage}
        extraContent={
          deleteEventState?.bookedCount > 0 ? (
            <div className="p-4 rounded-2xl bg-[#FFF9F2] border border-[#F3DEC3] text-[#7A3F0E] space-y-1.5 shadow-xs">
              <div className="flex items-center gap-2 font-bold text-xs text-[#8C430B]">
                <Users className="w-4 h-4 text-[#C4681E] shrink-0" />
                <span>
                  {deleteEventState.bookedCount} {deleteEventState.bookedCount === 1 ? "person has" : "people have"} booked seats
                </span>
              </div>
              <p className="text-[11px] text-[#77776F] leading-relaxed">
                Attendees currently hold confirmed reservations for this session. Deleting will cancel the masterclass. We recommend <strong>unpublishing</strong> instead to hide it from new registrations while keeping booked passes intact.
              </p>
            </div>
          ) : null
        }
        alternativeAction={
          deleteEventState?.isPublished && deleteEventState?.bookedCount > 0
            ? {
                label: "Unpublish Event Instead",
                onClick: handleQuickUnpublish,
                loading: unpublishLoading,
              }
            : null
        }
        confirmText={deleteEventState?.bookedCount > 0 ? "Delete Anyway" : "Delete Event"}
        cancelText="Cancel"
        variant="danger"
        loading={deleteLoading}
        onConfirm={confirmDelete}
        onClose={() => !deleteLoading && !unpublishLoading && setDeleteEventState(null)}
      />
    </div>
  );
}
