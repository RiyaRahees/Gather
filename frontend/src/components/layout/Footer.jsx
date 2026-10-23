import Link from "next/link";
import Logo from "@/components/common/Logo";

export default function Footer() {
  return (
    <footer className="bg-[#F7F4ED] border-t border-[#E7E2D8] pt-12 sm:pt-16 pb-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#E7E2D8]">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <Logo size="md" href="/" />
            <p className="text-sm text-[#77776F] max-w-sm leading-relaxed">
              Curated masterclasses, workshops, and immersive gatherings designed for curious minds, practitioners, and craft-driven creators.
            </p>
            <p className="text-xs text-[#77776F] pt-2">
              Good things happen when we gather.
            </p>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#171915] mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5 text-sm text-[#77776F]">
                <li>
                  <Link href="/events" className="hover:text-[#073F2E] transition-colors">
                    Discover Events
                  </Link>
                </li>
                <li>
                  <Link href="/events?category=Design" className="hover:text-[#073F2E] transition-colors">
                    Design Workshops
                  </Link>
                </li>
                <li>
                  <Link href="/events?category=Technology" className="hover:text-[#073F2E] transition-colors">
                    Tech & AI Gatherings
                  </Link>
                </li>
                <li>
                  <Link href="/events?category=Creative+Arts" className="hover:text-[#073F2E] transition-colors">
                    Creative Arts
                  </Link>
                </li>
                <li>
                  <Link href="/host" className="text-[#073F2E] font-medium hover:underline transition-colors flex items-center gap-1">
                    <span>Host with Gather</span>
                    <span className="text-[10px] bg-[#EBF3E8] px-1.5 py-0.5 rounded font-bold uppercase">New</span>
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#171915] mb-4">
                Account
              </h4>
              <ul className="space-y-2.5 text-sm text-[#77776F]">
                <li>
                  <Link href="/account" className="hover:text-[#073F2E] transition-colors">
                    My Bookings
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#073F2E] transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-[#073F2E] transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/admin/login" className="hover:text-[#073F2E] transition-colors">
                    Admin Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#171915] mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5 text-sm text-[#77776F]">
                <li>
                  <span className="text-[#77776F]">Privacy Policy</span>
                </li>
                <li>
                  <span className="text-[#77776F]">Terms of Service</span>
                </li>
                <li>
                  <span className="text-[#77776F]">Refund Policy</span>
                </li>
                <li>
                  <span className="text-[#77776F]">Community Guidelines</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#77776F] gap-4">
          <p>© {new Date().getFullYear()} Gather. Built with craft and care for curated sessions.</p>
          <div className="flex items-center gap-6">
            <span>Next.js App Router</span>
            <span>•</span>
            <span>Express.js & MongoDB</span>
            <span>•</span>
            <span>Razorpay Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
