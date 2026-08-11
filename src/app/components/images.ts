// Eingefrorener, lokaler Snapshot der zuletzt veröffentlichten Praxisbilder.
// Dadurch entstehen keine Requests an ein externes CMS.
export const IMAGE_FALLBACK = "/kfo-fallback.svg";

export const IMAGES = {
  hero: "/site-snapshot/hero.png",
  teamGroup: "/site-snapshot/team-group.jpg",
  serviceRemovable: "/site-snapshot/service-removable.jpg",
  serviceFixed: "/site-snapshot/service-fixed.png",
  serviceAdults: "/site-snapshot/service-adults.jpg",
  serviceAligner: "/site-snapshot/service-aligner.jpg",
  ctaSmile: "/site-snapshot/hero.png",
  anamnesebogen: "/site-snapshot/anamnesis.jpg",
  doctorAmann: "/site-snapshot/doctor-amann.png",
  doctorBurg: "/site-snapshot/doctor-burg.png",
  logo: "/site-snapshot/logo.png",
  footerLogo: "/site-snapshot/footer-logo.png",
  praxis1: "/site-snapshot/practice-01.jpg",
  praxis2: "/site-snapshot/practice-02.jpg",
  praxis3: "/site-snapshot/practice-03.jpg",
  praxis4: "/site-snapshot/practice-04.jpg",
  praxis5: "/site-snapshot/practice-05.jpg",
  praxis6: "/site-snapshot/practice-06.jpg",
  praxis7: "/site-snapshot/practice-07.jpg",
  praxis8: IMAGE_FALLBACK,
  praxisParallax: "/site-snapshot/practice-01.jpg",
} as const;
