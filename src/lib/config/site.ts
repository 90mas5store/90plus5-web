
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://90mas5.store";

export const SITE_CONFIG = {
  name: "90+5 Store",
  nameShort: "90+5",
  domain: "90mas5.store",
  locale: "es_HN",
  currency: "HNL",
  foundingDate: "2024",
  country: "Honduras",
  location: "Tegucigalpa, Honduras",
  priceRange: "HNL 350 - HNL 900",
} as const;

export const CONTACT = {
  email: "contacto@90mas5.store",
  notificationEmail:
    process.env.ADMIN_NOTIFICATION_EMAIL || "contacto@90mas5.store",
  alertEmail: "90mas5.store@gmail.com",
  phone: "+50432488860",
  phoneDisplay: "+504 3248-8860",
} as const;

export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/90mas5store",
  facebook: "https://www.facebook.com/90mas5store",
  tiktok: "https://www.tiktok.com/@90mas5",
  whatsapp: "https://wa.me/50432488860",
  twitterHandle: "@90mas5store",
} as const;

export const SEO = {
  googleVerification: "CzTKVzB0AjaAMCpZbKFoVnPrICCmgkyRV70C5sJO8Qo",
  themeColor: "#E50914",
} as const;
