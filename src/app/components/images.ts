// Eingefrorener, lokaler Snapshot der zuletzt veröffentlichten Praxisbilder.
// Dadurch entstehen keine Requests an ein externes CMS.
export const IMAGE_FALLBACK = "/kfo-fallback.svg";

export const IMAGES = {
  hero: "/site-snapshot/hero.webp",
  teamGroup: "/site-snapshot/team-group.webp",
  serviceRemovable: "/site-snapshot/service-removable.webp",
  serviceFixed: "/site-snapshot/service-fixed.webp",
  serviceAdults: "/site-snapshot/service-adults.webp",
  serviceAligner: "/site-snapshot/service-aligner.webp",
  ctaSmile: "/site-snapshot/hero.webp",
  anamnesebogen: "/site-snapshot/anamnesis.webp",
  doctorAmann: "/site-snapshot/doctor-amann.webp",
  doctorBurg: "/site-snapshot/doctor-burg.webp",
  logo: "/site-snapshot/logo.webp",
  footerLogo: "/site-snapshot/footer-logo.webp",
  praxis1: "/site-snapshot/practice-01.webp",
  praxis2: "/site-snapshot/practice-02.webp",
  praxis3: "/site-snapshot/practice-03.webp",
  praxis4: "/site-snapshot/practice-04.webp",
  praxis5: "/site-snapshot/practice-05.webp",
  praxis6: "/site-snapshot/practice-06.webp",
  praxis7: "/site-snapshot/practice-07.webp",
  praxis8: IMAGE_FALLBACK,
  praxisParallax: "/site-snapshot/practice-01.webp",
} as const;
