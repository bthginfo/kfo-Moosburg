import { Outlet } from "react-router";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { StickyMobileCTA } from "./StickyMobileCTA";
import { WhatsAppButton } from "./WhatsAppButton";
import { BackToTop } from "./BackToTop";
import { CookieBanner } from "./CookieBanner";
import { StoryblokPopup } from "./StoryblokPopup";

// Storyblok initialisieren (importiert die Config, die storyblokInit ausfuehrt)
import "../../storyblok/storyblokConfig";

export function KFOLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />
      <Outlet />
      <Footer />
      <StickyMobileCTA />
      <WhatsAppButton />
      <BackToTop />
      <CookieBanner />
      <StoryblokPopup />
    </div>
  );
}