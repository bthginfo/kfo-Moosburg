import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { StickyMobileCTA } from "./StickyMobileCTA";
import { WhatsAppButton } from "./WhatsAppButton";
import { BackToTop } from "./BackToTop";
import { BookingOverlay } from "./BookingOverlay";

export function KFOLayout() {
  const isHomePage = useLocation().pathname === "/";

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Outlet />
      <Footer />
      {isHomePage && <StickyMobileCTA />}
      {isHomePage && <WhatsAppButton />}
      <BackToTop />
      {isHomePage && <BookingOverlay />}
    </div>
  );
}
