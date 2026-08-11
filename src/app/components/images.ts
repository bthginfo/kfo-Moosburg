// Lokaler, abstrakter Fallback. So werden ohne freigegebene Praxisbilder weder
// fremde Personen/Räume gezeigt noch Besucher-IP-Adressen an Bilddienste
// übertragen. Echte Bilder können weiterhin über Storyblok gepflegt werden.
export const IMAGE_FALLBACK = "/kfo-fallback.svg";

export const IMAGES = {
  hero: IMAGE_FALLBACK,
  teamGroup: IMAGE_FALLBACK,
  serviceRemovable: IMAGE_FALLBACK,
  serviceFixed: IMAGE_FALLBACK,
  serviceAdults: IMAGE_FALLBACK,
  serviceAligner: IMAGE_FALLBACK,
  ctaSmile: IMAGE_FALLBACK,
  anamnesebogen: IMAGE_FALLBACK,
  praxis1: IMAGE_FALLBACK,
  praxis2: IMAGE_FALLBACK,
  praxis3: IMAGE_FALLBACK,
  praxis4: IMAGE_FALLBACK,
  praxis5: IMAGE_FALLBACK,
  praxis6: IMAGE_FALLBACK,
  praxis7: IMAGE_FALLBACK,
  praxis8: IMAGE_FALLBACK,
  praxisParallax: IMAGE_FALLBACK,
} as const;
