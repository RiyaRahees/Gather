import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Event from "../models/Event.js";
import User from "../models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const actualWorkshops = [
  // --- DESIGN ---
  {
    title: "Swiss Typography & Editorial Design Systems",
    slug: "swiss-typography-editorial-design-systems",
    category: "Design",
    price: 899,
    currency: "₹",
    totalSeats: 28,
    availableSeats: 28,
    date: "Nov 14, 2026",
    time: "10:00 AM - 4:30 PM IST",
    venue: "Fort Kochi Design Collective, Bastion St",
    image: "/images/event-design-studio.jpg",
    organizerName: "Studio Neue Atelier",
    isPublished: true,
    isFeatured: true,
    description:
      "A deep-dive workshop exploring modular grid systems, contemporary font pairings, hierarchy architectures, and printing craft for print & screen publications. Attendees build their own editorial type specimen book under the guidance of leading publication art directors.",
  },
  {
    title: "Modern Figma Design Systems & Spatial UI",
    slug: "modern-figma-design-systems-spatial-ui",
    category: "Design",
    price: 1199,
    currency: "₹",
    totalSeats: 30,
    availableSeats: 30,
    date: "Nov 28, 2026",
    time: "11:00 AM - 5:00 PM IST",
    venue: "Kakkanad Creative Studio, Infopark Phase II",
    image: "/images/cat-design.jpg",
    organizerName: "Pixel & Craft Lab",
    isPublished: true,
    isFeatured: false,
    description:
      "Master tokenized component architectures, auto-layout engines, dark-mode color primitives, and spatial UI prototyping for enterprise applications with senior product designers.",
  },

  // --- BUSINESS ---
  {
    title: "Venture Capital & Early-Stage Founder Clinic",
    slug: "venture-capital-early-stage-founder-clinic",
    category: "Business",
    price: 1499,
    currency: "₹",
    totalSeats: 25,
    availableSeats: 25,
    date: "Dec 05, 2026",
    time: "9:30 AM - 4:00 PM IST",
    venue: "Grand Hyatt Ballroom & Executive Lounge, Bolgatty",
    image: "/images/event-business-summit.jpg",
    organizerName: "Kerala Angel Network & Ventures",
    isPublished: true,
    isFeatured: true,
    description:
      "Intensive pitch deck tearing, cap table structuring, unit economics modeling, and term sheet negotiation with active angel investors and seed fund partners.",
  },
  {
    title: "Product-Led Growth & SaaS Monetization Masterclass",
    slug: "product-led-growth-saas-monetization",
    category: "Business",
    price: 999,
    currency: "₹",
    totalSeats: 35,
    availableSeats: 35,
    date: "Dec 19, 2026",
    time: "10:00 AM - 3:30 PM IST",
    venue: "Maker Village Innovation Center, Kalamassery",
    image: "/images/cat-business.jpg",
    organizerName: "SaaS Founders Circle",
    isPublished: true,
    isFeatured: false,
    description:
      "Strategic frameworks for freemium-to-paid conversion funnels, churn reduction telemetry, customer onboarding mechanics, and expansion pricing tiers.",
  },

  // --- MARKETING ---
  {
    title: "High-Impact Brand Storytelling & Cultural Marketing",
    slug: "high-impact-brand-storytelling-cultural-marketing",
    category: "Marketing",
    price: 699,
    currency: "₹",
    totalSeats: 30,
    availableSeats: 30,
    date: "Dec 12, 2026",
    time: "1:30 PM - 6:00 PM IST",
    venue: "The Pepper House Courtyard, Fort Kochi",
    image: "/images/event-marketing-mastery.jpg",
    organizerName: "Editorial Collective South",
    isPublished: true,
    isFeatured: true,
    description:
      "Learn how breakthrough indie brands build emotional resonance through non-traditional media, community dispatches, visual essay formats, and organic advocacy.",
  },
  {
    title: "AI-Driven Growth Marketing & Retention Loops",
    slug: "ai-driven-growth-marketing-retention-loops",
    category: "Marketing",
    price: 849,
    currency: "₹",
    totalSeats: 30,
    availableSeats: 30,
    date: "Jan 09, 2027",
    time: "10:00 AM - 4:00 PM IST",
    venue: "KSUM Technology Amphitheater, Kochi",
    image: "/images/cat-marketing.jpg",
    organizerName: "Growth Engineers Lab",
    isPublished: true,
    isFeatured: false,
    description:
      "Practical implementation of automated marketing funnels, LLM-powered personalized content workflows, attribution modeling, and hyper-targeted re-engagement campaigns.",
  },

  // --- CREATIVE ARTS ---
  {
    title: "Visual Storytelling & Analog Film Photography",
    slug: "visual-storytelling-analog-film-photography",
    category: "Creative Arts",
    price: 1250,
    currency: "₹",
    totalSeats: 18,
    availableSeats: 18,
    date: "Dec 06, 2026",
    time: "10:00 AM - 5:30 PM IST",
    venue: "Old Harbour Studio, Mattancherry",
    image: "/images/cat-creative.jpg",
    organizerName: "Mattancherry Print Guild",
    isPublished: true,
    isFeatured: true,
    description:
      "Hands-on medium format film shooting, silver gelatin darkroom development, contact printing, and photographic sequencing for limited-run exhibition zines.",
  },

  // --- PERSONAL GROWTH ---
  {
    title: "Deep Work, Focus & Creative Productivity Lab",
    slug: "deep-work-focus-creative-productivity-lab",
    category: "Personal Growth",
    price: 599,
    currency: "₹",
    totalSeats: 24,
    availableSeats: 24,
    date: "Nov 21, 2026",
    time: "9:00 AM - 2:00 PM IST",
    venue: "Green Pastures Eco Studio, Cherai",
    image: "/images/cat-personal.jpg",
    organizerName: "Monastic Mindset Project",
    isPublished: true,
    isFeatured: true,
    description:
      "A sanctuary retreat workshop breaking digital distraction loops. Includes cognitive attention audits, ritualized workflow construction, and mindful focus systems.",
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  // Find Admin user
  let admin = await User.findOne({ role: "admin" });
  if (!admin) {
    admin = await User.findOne({ email: "admin@gmail.com" });
  }
  const adminId = admin ? admin._id : null;
  console.log("Admin account ID:", adminId);

  // 1. Clean up "testing 1" event into a real workshop
  const testingEvent = await Event.findOne({ slug: "testing-1" });
  if (testingEvent) {
    testingEvent.title = "Generative AI & LLM Application Architecture";
    testingEvent.description =
      "Hands-on laboratory building multi-agent systems, semantic search pipelines, and low-latency streaming inference for production products.";
    testingEvent.category = "Technology";
    testingEvent.venue = "Infopark Tech Amphitheatre, Kakkanad";
    testingEvent.organizerName = "AI Systems Collective";
    testingEvent.image = "/images/event-ai-coding.jpg";
    await testingEvent.save();
    console.log("Upgraded 'testing 1' into realistic event 'Generative AI & LLM Application Architecture'");
  }

  // 2. Clean up "Personal Growth  Development" typo if exists
  const pgEvent = await Event.findOne({ title: /Personal Growth.*Development/i });
  if (pgEvent) {
    pgEvent.title = "Leadership Presence & Executive Communication";
    pgEvent.description =
      "An intensive vocal presence, narrative framing, and impromptu speaking clinic designed for tech leads, engineering managers, and directors.";
    pgEvent.venue = "Kochi Business Hub, Panampilly Nagar";
    pgEvent.organizerName = "Executive Speech Lab";
    await pgEvent.save();
    console.log("Upgraded Personal Growth event title and details");
  }

  // 3. Insert or update actual workshops
  for (const workshop of actualWorkshops) {
    const existing = await Event.findOne({ slug: workshop.slug });
    if (existing) {
      Object.assign(existing, workshop);
      if (adminId) existing.createdBy = adminId;
      await existing.save();
      console.log(`Updated existing: ${workshop.title}`);
    } else {
      const created = await Event.create({
        ...workshop,
        createdBy: adminId,
      });
      console.log(`Created new: ${created.title} (${created.category})`);
    }
  }

  // Summary
  const count = await Event.countDocuments({ isPublished: true });
  console.log(`\nTotal Published Workshops in Database: ${count}`);

  const categories = await Event.aggregate([
    { $match: { isPublished: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  console.log("\nWorkshops per Category:");
  categories.forEach((c) => console.log(`- ${c._id}: ${c.count} workshops`));

  await mongoose.disconnect();
}

seed().catch(console.error);
