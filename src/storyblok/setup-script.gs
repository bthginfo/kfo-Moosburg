// =============================================================================
// Google Apps Script: Storyblok Setup fuer KFO Moosburg
// =============================================================================
// Erstellt 2 flache Komponenten + 2 Stories mit vorpopuliertem Content.
// Keine Verschachtelung, keine genesteten Blocks - alles flat!
//
// ANLEITUNG:
// 1. Gehe zu https://script.google.com > Neues Projekt
// 2. Kopiere dieses Script komplett dort rein
// 3. Trage SPACE_ID und MANAGEMENT_TOKEN unten ein
// 4. Klicke oben: Ausfuehren > setupAll
// 5. Warte bis "Setup komplett!" im Log steht (Ansicht > Logs)
// =============================================================================

// ─── KONFIGURATION ──────────────────────────────────────────────────────────
var SPACE_ID = "DEINE_SPACE_ID_HIER";           // z.B. "282715"
var MANAGEMENT_TOKEN = "DEIN_MANAGEMENT_TOKEN";  // Personal Access Token
// ─────────────────────────────────────────────────────────────────────────────

var API_BASE = "https://mapi.storyblok.com/v1";

function apiCall(method, path, payload) {
  var options = {
    method: method,
    headers: {
      "Authorization": MANAGEMENT_TOKEN,
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };
  if (payload) options.payload = JSON.stringify(payload);
  
  var url = API_BASE + "/spaces/" + SPACE_ID + path;
  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();
  
  if (code >= 400) {
    Logger.log("FEHLER " + code + " bei " + method + " " + path);
    Logger.log(body.substring(0, 300));
    throw new Error("API Fehler " + code);
  }
  
  Utilities.sleep(300); // Rate Limit
  return JSON.parse(body);
}

// =============================================================================
// SCHRITT 1: Komponenten erstellen (nur 2 flache Content-Types)
// =============================================================================

function createComponents() {

  // ─── home_page: Alle Sektionen flat in einem Content-Type ─────────
  Logger.log("Erstelle Komponente: home_page");
  apiCall("POST", "/components", {
    component: {
      name: "home_page",
      display_name: "Startseite",
      is_root: true,
      is_nestable: false,
      schema: {

        // ── TAB: Hero ──
        tab_hero: { type: "tab", display_name: "Hero" },
        hero_trust_badge: { type: "text", display_name: "Trust Badge Text" },
        hero_title_line1: { type: "text", display_name: "Titel Zeile 1" },
        hero_title_line2: { type: "text", display_name: "Titel Zeile 2" },
        hero_subtitle: { type: "textarea", display_name: "Untertitel" },
        hero_cta_primary: { type: "text", display_name: "CTA Button Text" },
        hero_cta_secondary: { type: "text", display_name: "Sekundaerer Button Text" },
        hero_image: { type: "asset", display_name: "Hero Bild", filetypes: ["images"] },

        // ── TAB: Features / Willkommen ──
        tab_features: { type: "tab", display_name: "Willkommen" },
        features_title: { type: "textarea", display_name: "Willkommen Titel" },
        features_description: { type: "textarea", display_name: "Willkommen Beschreibung" },
        feature_1_icon: { type: "text", display_name: "Feature 1 Icon" },
        feature_1_title: { type: "text", display_name: "Feature 1 Titel" },
        feature_2_icon: { type: "text", display_name: "Feature 2 Icon" },
        feature_2_title: { type: "text", display_name: "Feature 2 Titel" },
        feature_3_icon: { type: "text", display_name: "Feature 3 Icon" },
        feature_3_title: { type: "text", display_name: "Feature 3 Titel" },
        feature_4_icon: { type: "text", display_name: "Feature 4 Icon" },
        feature_4_title: { type: "text", display_name: "Feature 4 Titel" },
        feature_5_icon: { type: "text", display_name: "Feature 5 Icon" },
        feature_5_title: { type: "text", display_name: "Feature 5 Titel" },
        feature_6_icon: { type: "text", display_name: "Feature 6 Icon" },
        feature_6_title: { type: "text", display_name: "Feature 6 Titel" },

        // ── TAB: Ueber Uns ──
        tab_about: { type: "tab", display_name: "Ueber Uns" },
        about_title: { type: "text", display_name: "Titel" },
        about_paragraph1: { type: "textarea", display_name: "Absatz 1" },
        about_paragraph2: { type: "textarea", display_name: "Absatz 2" },
        about_image: { type: "asset", display_name: "Bild", filetypes: ["images"] },
        about_stat_1_value: { type: "text", display_name: "Statistik 1 Wert" },
        about_stat_1_label: { type: "text", display_name: "Statistik 1 Label" },
        about_stat_1_icon: { type: "text", display_name: "Statistik 1 Icon" },
        about_stat_2_value: { type: "text", display_name: "Statistik 2 Wert" },
        about_stat_2_label: { type: "text", display_name: "Statistik 2 Label" },
        about_stat_2_icon: { type: "text", display_name: "Statistik 2 Icon" },
        about_stat_3_value: { type: "text", display_name: "Statistik 3 Wert" },
        about_stat_3_label: { type: "text", display_name: "Statistik 3 Label" },
        about_stat_3_icon: { type: "text", display_name: "Statistik 3 Icon" },

        // ── TAB: Reviews ──
        tab_reviews: { type: "tab", display_name: "Bewertungen" },
        reviews_title: { type: "text", display_name: "Titel" },
        reviews_google_rating: { type: "text", display_name: "Google Bewertung (z.B. 5,0)" },
        reviews_google_count: { type: "text", display_name: "Anzahl Rezensionen" },
        reviews_google_url: { type: "text", display_name: "Google Reviews URL" },
        review_1_name: { type: "text", display_name: "Review 1 Name" },
        review_1_date: { type: "text", display_name: "Review 1 Datum" },
        review_1_rating: { type: "number", display_name: "Review 1 Sterne" },
        review_1_text: { type: "textarea", display_name: "Review 1 Text" },
        review_2_name: { type: "text", display_name: "Review 2 Name" },
        review_2_date: { type: "text", display_name: "Review 2 Datum" },
        review_2_rating: { type: "number", display_name: "Review 2 Sterne" },
        review_2_text: { type: "textarea", display_name: "Review 2 Text" },
        review_3_name: { type: "text", display_name: "Review 3 Name" },
        review_3_date: { type: "text", display_name: "Review 3 Datum" },
        review_3_rating: { type: "number", display_name: "Review 3 Sterne" },
        review_3_text: { type: "textarea", display_name: "Review 3 Text" },
        review_4_name: { type: "text", display_name: "Review 4 Name" },
        review_4_date: { type: "text", display_name: "Review 4 Datum" },
        review_4_rating: { type: "number", display_name: "Review 4 Sterne" },
        review_4_text: { type: "textarea", display_name: "Review 4 Text" },
        review_5_name: { type: "text", display_name: "Review 5 Name" },
        review_5_date: { type: "text", display_name: "Review 5 Datum" },
        review_5_rating: { type: "number", display_name: "Review 5 Sterne" },
        review_5_text: { type: "textarea", display_name: "Review 5 Text" },
        review_6_name: { type: "text", display_name: "Review 6 Name" },
        review_6_date: { type: "text", display_name: "Review 6 Datum" },
        review_6_rating: { type: "number", display_name: "Review 6 Sterne" },
        review_6_text: { type: "textarea", display_name: "Review 6 Text" },
        review_7_name: { type: "text", display_name: "Review 7 Name" },
        review_7_date: { type: "text", display_name: "Review 7 Datum" },
        review_7_rating: { type: "number", display_name: "Review 7 Sterne" },
        review_7_text: { type: "textarea", display_name: "Review 7 Text" },
        review_8_name: { type: "text", display_name: "Review 8 Name" },
        review_8_date: { type: "text", display_name: "Review 8 Datum" },
        review_8_rating: { type: "number", display_name: "Review 8 Sterne" },
        review_8_text: { type: "textarea", display_name: "Review 8 Text" },
        review_9_name: { type: "text", display_name: "Review 9 Name" },
        review_9_date: { type: "text", display_name: "Review 9 Datum" },
        review_9_rating: { type: "number", display_name: "Review 9 Sterne" },
        review_9_text: { type: "textarea", display_name: "Review 9 Text" },

        // ── TAB: Leistungen ──
        tab_services: { type: "tab", display_name: "Leistungen" },
        services_title: { type: "text", display_name: "Leistungen Ueberschrift" },
        services_parallax_image: { type: "asset", display_name: "Parallax Hintergrundbild", filetypes: ["images"] },
        service_1_title: { type: "text", display_name: "Leistung 1 Titel" },
        service_1_description: { type: "textarea", display_name: "Leistung 1 Beschreibung" },
        service_1_image: { type: "asset", display_name: "Leistung 1 Bild", filetypes: ["images"] },
        service_1_layout: { type: "option", display_name: "Leistung 1 Layout", options: [{ name: "Bild links", value: "image-left" }, { name: "Bild rechts", value: "image-right" }] },
        service_1_highlight: { type: "text", display_name: "Leistung 1 Highlight Badge" },
        service_2_title: { type: "text", display_name: "Leistung 2 Titel" },
        service_2_description: { type: "textarea", display_name: "Leistung 2 Beschreibung" },
        service_2_image: { type: "asset", display_name: "Leistung 2 Bild", filetypes: ["images"] },
        service_2_layout: { type: "option", display_name: "Leistung 2 Layout", options: [{ name: "Bild links", value: "image-left" }, { name: "Bild rechts", value: "image-right" }] },
        service_2_highlight: { type: "text", display_name: "Leistung 2 Highlight Badge" },
        service_3_title: { type: "text", display_name: "Leistung 3 Titel" },
        service_3_description: { type: "textarea", display_name: "Leistung 3 Beschreibung" },
        service_3_image: { type: "asset", display_name: "Leistung 3 Bild", filetypes: ["images"] },
        service_3_layout: { type: "option", display_name: "Leistung 3 Layout", options: [{ name: "Bild links", value: "image-left" }, { name: "Bild rechts", value: "image-right" }] },
        service_3_highlight: { type: "text", display_name: "Leistung 3 Highlight Badge" },
        service_4_title: { type: "text", display_name: "Leistung 4 Titel" },
        service_4_description: { type: "textarea", display_name: "Leistung 4 Beschreibung" },
        service_4_image: { type: "asset", display_name: "Leistung 4 Bild", filetypes: ["images"] },
        service_4_layout: { type: "option", display_name: "Leistung 4 Layout", options: [{ name: "Bild links", value: "image-left" }, { name: "Bild rechts", value: "image-right" }] },
        service_4_highlight: { type: "text", display_name: "Leistung 4 Highlight Badge" },

        // ── TAB: Retainer ──
        tab_retainer: { type: "tab", display_name: "Retainer" },
        retainer_title: { type: "text", display_name: "Titel" },
        retainer_description: { type: "textarea", display_name: "Beschreibung" },

        // ── TAB: CTA ──
        tab_cta: { type: "tab", display_name: "CTA Bereich" },
        cta_title: { type: "text", display_name: "Titel (vor Highlight)" },
        cta_title_highlight: { type: "text", display_name: "Titel Highlight (orange)" },
        cta_subtitle: { type: "textarea", display_name: "Untertitel" },
        cta_primary_text: { type: "text", display_name: "CTA Button Text" },
        cta_secondary_text: { type: "text", display_name: "Sekundaerer Button Text" },
        cta_trust_1: { type: "text", display_name: "Trust Element 1" },
        cta_trust_2: { type: "text", display_name: "Trust Element 2" },
        cta_trust_3: { type: "text", display_name: "Trust Element 3" },

        // ── TAB: Team ──
        tab_team: { type: "tab", display_name: "Team" },
        team_title: { type: "text", display_name: "Titel" },
        team_subtitle: { type: "text", display_name: "Untertitel" },
        team_1_name: { type: "text", display_name: "Mitglied 1 Name" },
        team_1_role: { type: "text", display_name: "Mitglied 1 Rolle" },
        team_1_image: { type: "asset", display_name: "Mitglied 1 Portrait", filetypes: ["images"] },
        team_2_name: { type: "text", display_name: "Mitglied 2 Name" },
        team_2_role: { type: "text", display_name: "Mitglied 2 Rolle" },
        team_2_image: { type: "asset", display_name: "Mitglied 2 Portrait", filetypes: ["images"] },

        // ── TAB: Anamnesebogen ──
        tab_anamnese: { type: "tab", display_name: "Anamnesebogen" },
        anamnese_title: { type: "text", display_name: "Titel" },
        anamnese_description: { type: "textarea", display_name: "Beschreibung" },
        anamnese_cta_text: { type: "text", display_name: "Button Text" },
        anamnese_cta_link: { type: "text", display_name: "Button Link (URL)" },
        anamnese_image: { type: "asset", display_name: "Bild", filetypes: ["images"] },

        // ── TAB: Galerie ──
        tab_gallery: { type: "tab", display_name: "Galerie" },
        gallery_title: { type: "text", display_name: "Titel" },
        gallery_subtitle: { type: "text", display_name: "Untertitel" },
        gallery_image_1: { type: "asset", display_name: "Bild 1", filetypes: ["images"] },
        gallery_alt_1: { type: "text", display_name: "Bild 1 Alt-Text" },
        gallery_image_2: { type: "asset", display_name: "Bild 2", filetypes: ["images"] },
        gallery_alt_2: { type: "text", display_name: "Bild 2 Alt-Text" },
        gallery_image_3: { type: "asset", display_name: "Bild 3", filetypes: ["images"] },
        gallery_alt_3: { type: "text", display_name: "Bild 3 Alt-Text" },
        gallery_image_4: { type: "asset", display_name: "Bild 4", filetypes: ["images"] },
        gallery_alt_4: { type: "text", display_name: "Bild 4 Alt-Text" },
        gallery_image_5: { type: "asset", display_name: "Bild 5", filetypes: ["images"] },
        gallery_alt_5: { type: "text", display_name: "Bild 5 Alt-Text" },
        gallery_image_6: { type: "asset", display_name: "Bild 6", filetypes: ["images"] },
        gallery_alt_6: { type: "text", display_name: "Bild 6 Alt-Text" },
        gallery_image_7: { type: "asset", display_name: "Bild 7", filetypes: ["images"] },
        gallery_alt_7: { type: "text", display_name: "Bild 7 Alt-Text" },
        gallery_image_8: { type: "asset", display_name: "Bild 8", filetypes: ["images"] },
        gallery_alt_8: { type: "text", display_name: "Bild 8 Alt-Text" },

        // ── TAB: Kontakt ──
        tab_contact: { type: "tab", display_name: "Kontakt" },
        contact_title: { type: "text", display_name: "Titel" },
        contact_description: { type: "textarea", display_name: "Beschreibung (Parkplaetze etc.)" },
        contact_practice_name: { type: "text", display_name: "Praxisname" },
        contact_practice_subtitle: { type: "text", display_name: "Praxis Untertitel" },
        contact_address_line1: { type: "text", display_name: "Adresse Zeile 1" },
        contact_address_line2: { type: "text", display_name: "Adresse Zeile 2" },
        contact_phone: { type: "text", display_name: "Telefon" },
        contact_whatsapp: { type: "text", display_name: "WhatsApp Nummer" },
        contact_email: { type: "text", display_name: "E-Mail" },
        contact_instagram: { type: "text", display_name: "Instagram URL" },
        contact_maps_url: { type: "text", display_name: "Google Maps Embed URL" }
      }
    }
  });

  // ─── global_settings: Navbar + Footer + Popup + Cookie ─────────────
  Logger.log("Erstelle Komponente: global_settings");
  apiCall("POST", "/components", {
    component: {
      name: "global_settings",
      display_name: "Globale Einstellungen",
      is_root: true,
      is_nestable: false,
      schema: {

        // ── TAB: Navigation ──
        tab_nav: { type: "tab", display_name: "Navigation" },
        nav_logo_text: { type: "text", display_name: "Logo Text" },
        nav_logo_highlight: { type: "text", display_name: "Logo Highlight (orange)" },
        nav_link_1_label: { type: "text", display_name: "Nav Link 1 Label" },
        nav_link_1_href: { type: "text", display_name: "Nav Link 1 Anchor" },
        nav_link_2_label: { type: "text", display_name: "Nav Link 2 Label" },
        nav_link_2_href: { type: "text", display_name: "Nav Link 2 Anchor" },
        nav_link_3_label: { type: "text", display_name: "Nav Link 3 Label" },
        nav_link_3_href: { type: "text", display_name: "Nav Link 3 Anchor" },
        nav_link_4_label: { type: "text", display_name: "Nav Link 4 Label" },
        nav_link_4_href: { type: "text", display_name: "Nav Link 4 Anchor" },
        nav_link_5_label: { type: "text", display_name: "Nav Link 5 Label" },
        nav_link_5_href: { type: "text", display_name: "Nav Link 5 Anchor" },
        nav_phone: { type: "text", display_name: "Telefonnummer" },
        nav_cta_text: { type: "text", display_name: "CTA Button Text" },

        // ── TAB: Footer ──
        tab_footer: { type: "tab", display_name: "Footer" },
        footer_subtitle_1: { type: "text", display_name: "Untertitel Zeile 1" },
        footer_subtitle_2: { type: "text", display_name: "Untertitel Zeile 2" },
        footer_phone: { type: "text", display_name: "Telefon" },
        footer_email: { type: "text", display_name: "E-Mail" },
        footer_instagram: { type: "text", display_name: "Instagram URL" },
        footer_copyright: { type: "text", display_name: "Copyright Text" },

        // ── TAB: Popup ──
        tab_popup: { type: "tab", display_name: "Popup" },
        popup_enabled: { type: "boolean", display_name: "Popup aktiv?", default_value: true },
        popup_title: { type: "text", display_name: "Titel" },
        popup_text: { type: "textarea", display_name: "Text" },
        popup_cta_text: { type: "text", display_name: "Button Text" },
        popup_cta_link: { type: "text", display_name: "Button Link (leer = Dr. Flex)" },
        popup_cta_is_drflex: { type: "boolean", display_name: "Button oeffnet Dr. Flex?", default_value: true },
        popup_delay: { type: "number", display_name: "Verzoegerung in Sekunden", default_value: 5 },
        popup_image: { type: "asset", display_name: "Bild (optional)", filetypes: ["images"] },
        popup_once_per_session: { type: "boolean", display_name: "Nur 1x pro Session?", default_value: true },

        // ── TAB: Cookie Banner ──
        tab_cookie: { type: "tab", display_name: "Cookie Banner" },
        cookie_title: { type: "text", display_name: "Titel" },
        cookie_text: { type: "textarea", display_name: "Text" },
        cookie_accept_all: { type: "text", display_name: "Alle akzeptieren Button" },
        cookie_accept_selected: { type: "text", display_name: "Auswahl bestaetigen Button" },
        cookie_reject_all: { type: "text", display_name: "Nur notwendige Button" }
      }
    }
  });

  Logger.log("Beide Komponenten erstellt!");
}

// =============================================================================
// SCHRITT 2: Stories mit vorpopuliertem Content erstellen
// =============================================================================

function createStories() {

  // ─── HOME STORY (mit ALLEM Content vorpopuliert) ──────────────────
  Logger.log("Erstelle Story: Home");
  apiCall("POST", "/stories", {
    story: {
      name: "Home",
      slug: "home",
      content: {
        component: "home_page",

        // Hero
        hero_trust_badge: "5,0 / 5 bei Google (122 Bewertungen)",
        hero_title_line1: "Kieferorthopaedie",
        hero_title_line2: "Moosburg",
        hero_subtitle: "Ihr Kieferorthopaedie in Moosburg fuer einen gesunden Biss und ein strahlendes Laecheln!",
        hero_cta_primary: "Ersttermin vereinbaren",
        hero_cta_secondary: "Mehr erfahren",

        // Features / Willkommen
        features_title: "Herzlich Willkommen in unserer Praxis fuer Kieferorthopaedie in Moosburg an der Isar",
        features_description: "Zusammen mit unserem Team stehen wir sowohl Kindern und Jugendlichen als auch Erwachsenen in kieferorthopaedischen Fragen zur Seite. Wir bieten Ihnen eine hochwertige kieferorthopaedische Behandlung mit moderner Technik und hoher fachlicher Kompetenz in entspannter Atmosphaere.",
        feature_1_icon: "Heart",
        feature_1_title: "Schonende Zahnbewegung",
        feature_2_icon: "Clock",
        feature_2_title: "Kurze Behandlungszeit",
        feature_3_icon: "EyeOff",
        feature_3_title: "Unsichtbare Zahnspangen",
        feature_4_icon: "Shield",
        feature_4_title: "Moeglichst Erhalt aller Zaehne",
        feature_5_icon: "Handshake",
        feature_5_title: "Gemeinsame Therapieplanung",
        feature_6_icon: "Stethoscope",
        feature_6_title: "Dauerhaft stabile Ergebnisse",

        // Ueber uns
        about_title: "Ihr Ansprechpartner des Vertrauens",
        about_paragraph1: "Wir legen grossen Wert darauf, sowohl auf die Beduerfnisse unserer jungen Patienten einzugehen, als auch fuer die Eltern ein Ansprechpartner des Vertrauens zu sein. Unser Ziel sind bestmoegliche Ergebnisse in Funktion und Aesthetik.",
        about_paragraph2: "Dabei ist es uns besonders wichtig die Behandlung so angenehm und kurz wie moeglich zu halten. Wir freuen uns auf Sie!",
        about_stat_1_icon: "Users",
        about_stat_1_value: "2.000+",
        about_stat_1_label: "Patienten",
        about_stat_2_icon: "Award",
        about_stat_2_value: "15+",
        about_stat_2_label: "Jahre Erfahrung",
        about_stat_3_icon: "Heart",
        about_stat_3_value: "5,0",
        about_stat_3_label: "Google Rating",

        // Reviews
        reviews_title: "Das sagen unsere Patienten",
        reviews_google_rating: "5,0",
        reviews_google_count: "122",
        reviews_google_url: "https://www.google.com/search?q=Kieferorthop%C3%A4die+Moosburg+Dr.+Amann+%26+Dr.+Burg+Rezensionen",
        review_1_name: "Anja Schwaiger",
        review_1_date: "vor 3 Monaten",
        review_1_rating: 5,
        review_1_text: "Super nettes Team! Meine Tochter fuehlt sich hier sehr wohl und die Behandlung wurde uns sehr verstaendlich erklaert. Die Praxis ist modern und sauber.",
        review_2_name: "Florian Huber",
        review_2_date: "vor 2 Monaten",
        review_2_rating: 5,
        review_2_text: "Sehr kompetente und freundliche Aerzte. Dr. Amann hat sich wirklich Zeit genommen und alles geduldig erklaert. Die Wartezeiten sind angenehm kurz. Absolut empfehlenswert!",
        review_3_name: "Sarah Meier",
        review_3_date: "vor 1 Monat",
        review_3_rating: 5,
        review_3_text: "Ich bin begeistert von der Aligner-Behandlung! Als Erwachsene war mir wichtig, dass es diskret ist - und das Ergebnis nach nur 8 Monaten ist fantastisch.",
        review_4_name: "Christian Bauer",
        review_4_date: "vor 4 Monaten",
        review_4_rating: 5,
        review_4_text: "Unser Sohn hatte anfangs grosse Angst vor dem Zahnarzt, aber Dr. Burg hat das super gemacht. Sehr einfuehlsam und kindgerecht.",
        review_5_name: "Michaela Gruber",
        review_5_date: "vor 2 Wochen",
        review_5_rating: 5,
        review_5_text: "Die feste Zahnspange war nur 12 Monate noetig - deutlich kuerzer als erwartet! Ergebnis ist top. Parkplaetze in der Tiefgarage sind auch sehr praktisch.",
        review_6_name: "Thomas Reiter",
        review_6_date: "vor 3 Wochen",
        review_6_rating: 5,
        review_6_text: "Professionelle Beratung von Anfang an. Man merkt, dass hier mit Leidenschaft gearbeitet wird. Die Terminvergabe ueber Dr. Flex funktioniert reibungslos.",
        review_7_name: "Lisa Wagner",
        review_7_date: "vor 5 Monaten",
        review_7_rating: 5,
        review_7_text: "Sehr gute Praxis mit modernem Equipment. Das Team ist immer freundlich und hilfsbereit. Klare Empfehlung fuer jeden in der Region!",
        review_8_name: "Markus Schneider",
        review_8_date: "vor 1 Monat",
        review_8_rating: 5,
        review_8_text: "Bin fuer die Behandlung extra von Freising hierher gewechselt - hat sich absolut gelohnt! Hervorragende Arbeit und ein Team, das auf den Patienten eingeht.",
        review_9_name: "Katharina Poell",
        review_9_date: "vor 6 Wochen",
        review_9_rating: 5,
        review_9_text: "Meine beiden Kinder sind hier in Behandlung und wir sind rundum zufrieden. Die Erklaerungen sind immer verstaendlich und es wird nie mehr gemacht als noetig.",

        // Leistungen
        services_title: "Unsere Leistungen",
        service_1_title: "Herausnehmbare Zahnspangen",
        service_1_description: "Jede Behandlung wird individuell geplant. Wenn noch nicht alle bleibenden Zaehne durchgebrochen sind, koennen haeufig herausnehmbare Zahnspangen verwendet werden, um z.B. die Kiefer richtig zueinander einzustellen.",
        service_1_layout: "image-left",
        service_1_highlight: "",
        service_2_title: "Festsitzende Zahnspangen",
        service_2_description: "Mit der festen Zahnspange koennen Zahn- und Kieferfehlstellungen effizient behandelt werden. Uns ist es ein grosses Anliegen, die Behandlungszeit mit der festen Zahnspange auf ein Minimum zu begrenzen. Daher sind wir sehr stolz auf eine durchschnittliche Tragezeit von nur 13 Monaten.",
        service_2_layout: "image-right",
        service_2_highlight: "Oe nur 13 Monate",
        service_3_title: "Behandlung von Erwachsenen",
        service_3_description: "Kieferorthopaedische Behandlungen sind in jedem Alter moeglich. Fuer die Korrektur von einzelnen stoerenden Zahnfehlstellungen reichen oft wenige Monate. Schwere Fehlstellungen der Kiefer koennen begleitend zur Zahnspange mit Hilfe einer Kiefer-OP behandelt werden.",
        service_3_layout: "image-left",
        service_3_highlight: "",
        service_4_title: "Fast unsichtbare Zahnspangen",
        service_4_description: "Durchsichtige Zahnschienen (Aligner) koennen oft eine Alternative zur festen Zahnspange sein. Somit ist die Behandlung fast unsichtbar. Zum Essen koennen sie ausserdem herausgenommen werden.",
        service_4_layout: "image-right",
        service_4_highlight: "",

        // Retainer
        retainer_title: "Dauerhaft stabile Ergebnisse",
        retainer_description: "Zaehne koennen sich ueber das ganze Leben bewegen! Damit die Zaehne auch nach der Behandlung in ihrer neuen Position bleiben, empfehlen wir haeufig duenne geklebte Draehte (Retainer) an der Innenseite der Zaehne. Diese stabilisieren das Behandlungsergebnis dauerhaft.",

        // CTA
        cta_title: "Bereit fuer Ihr",
        cta_title_highlight: "neues Laecheln",
        cta_subtitle: "Vereinbaren Sie jetzt Ihren kostenlosen Ersttermin - wir beraten Sie gerne persoenlich und unverbindlich.",
        cta_primary_text: "Ersttermin vereinbaren",
        cta_secondary_text: "Kontakt aufnehmen",
        cta_trust_1: "5,0/5 Google Bewertung",
        cta_trust_2: "Kostenlose Erstberatung",
        cta_trust_3: "Termine auch online",

        // Team
        team_title: "Unser Praxisteam",
        team_subtitle: "Bei uns sind Sie in guten und professionellen Haenden",
        team_1_name: "Dr. Christoph Amann",
        team_1_role: "Fachzahnarzt fuer Kieferorthopaedie",
        team_2_name: "Dr. Julian Burg",
        team_2_role: "M.Sc. Kieferorthopaedie",

        // Anamnesebogen
        anamnese_title: "Unser Anamnesebogen",
        anamnese_description: "Sie moechten bereits Ihren Anamnesebogen ausfuellen? Kein Problem, fuellen Sie einfach das Formular aus und sparen Sie sich Zeit bei Ihrem ersten Besuch.",
        anamnese_cta_text: "Anamnesebogen ausfuellen",
        anamnese_cta_link: "https://eu1.documents.adobe.com/public/esignWidget?wid=CBFCIBAA3AAABLblqZhDpDJlcHIc7plbMCC53p_3zhyeuNykZ3i6jgurzHScsGT9OC3Dcat0jFAwCgnYbRi0*",

        // Galerie
        gallery_title: "Unsere Praxis",
        gallery_subtitle: "Einblicke in unsere modernen Raeumlichkeiten",
        gallery_alt_1: "Praxis Empfangsbereich",
        gallery_alt_2: "Wartebereich",
        gallery_alt_3: "Behandlungsraum",
        gallery_alt_4: "Praxisraeume",
        gallery_alt_5: "Moderne Ausstattung",
        gallery_alt_6: "Diagnostik",
        gallery_alt_7: "Behandlungsinstrumente",
        gallery_alt_8: "Beratungsgespraech",

        // Kontakt
        contact_title: "Anfahrt & Kontakt",
        contact_description: "Parkplaetze finden Sie in der oeffentlichen Tiefgarage direkt unter der Praxis (Einfahrt Bahnhofstr. 1) oder als Kurzparker vor der Baeckerei Welter (Muenchener Str. 2-4).",
        contact_practice_name: "Kieferorthopaedie Moosburg",
        contact_practice_subtitle: "Dr. Amann & Dr. Burg",
        contact_address_line1: "Muenchener Strasse 4a",
        contact_address_line2: "85368 Moosburg an der Isar",
        contact_phone: "08761 7222750",
        contact_whatsapp: "+491743873065",
        contact_email: "praxis@kfo-moosburg.de",
        contact_instagram: "https://www.instagram.com/kieferorthopaedie_moosburg/?hl=de",
        contact_maps_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2645.456669718668!2d11.931745076738354!3d48.466953528173065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x479e3d88016ac899%3A0xed130e306716fd3a!2sKieferorthop%C3%A4die%20Moosburg%20Dr.%20Amann%20%26%20Dr.%20Burg!5e0!3m2!1sde!2sde!4v1712132681998!5m2!1sde!2sde"
      },
      is_startpage: true
    }
  });

  // ─── GLOBAL SETTINGS STORY ────────────────────────────────────────
  Logger.log("Erstelle Story: Einstellungen");
  apiCall("POST", "/stories", {
    story: {
      name: "Einstellungen",
      slug: "einstellungen",
      content: {
        component: "global_settings",

        // Navigation
        nav_logo_text: "KFO",
        nav_logo_highlight: "Moosburg",
        nav_link_1_label: "Ueber uns",
        nav_link_1_href: "#uber-uns",
        nav_link_2_label: "Leistungen",
        nav_link_2_href: "#leistungen",
        nav_link_3_label: "Team",
        nav_link_3_href: "#team",
        nav_link_4_label: "Anamnesebogen",
        nav_link_4_href: "#anamnesebogen",
        nav_link_5_label: "Kontakt",
        nav_link_5_href: "#kontakt",
        nav_phone: "08761 7222750",
        nav_cta_text: "Ersttermin vereinbaren",

        // Footer
        footer_subtitle_1: "Dr. Amann & Dr. Burg",
        footer_subtitle_2: "Kieferorthopaedie Moosburg",
        footer_phone: "08761 7222750",
        footer_email: "praxis@kfo-moosburg.de",
        footer_instagram: "https://www.instagram.com/kieferorthopaedie_moosburg/?hl=de",
        footer_copyright: "Kieferorthopaedie Moosburg. Alle Rechte vorbehalten.",

        // Popup
        popup_enabled: true,
        popup_title: "Jetzt Ersttermin sichern!",
        popup_text: "Vereinbaren Sie noch heute Ihren kostenlosen Ersttermin und lassen Sie sich unverbindlich beraten. Wir freuen uns auf Sie!",
        popup_cta_text: "Termin vereinbaren",
        popup_cta_link: "",
        popup_cta_is_drflex: true,
        popup_delay: 5,
        popup_once_per_session: true,

        // Cookie Banner
        cookie_title: "Cookie-Einstellungen",
        cookie_text: "Wir verwenden Cookies, um Ihnen die bestmoegliche Erfahrung auf unserer Website zu bieten. Einige Cookies sind notwendig, andere helfen uns, unsere Website und Ihr Erlebnis zu verbessern.",
        cookie_accept_all: "Alle akzeptieren",
        cookie_accept_selected: "Auswahl bestaetigen",
        cookie_reject_all: "Nur notwendige"
      }
    }
  });

  Logger.log("Beide Stories erstellt und mit Content befuellt!");
}

// =============================================================================
// HAUPTFUNKTION - Ausfuehren!
// =============================================================================

function setupAll() {
  Logger.log("========================================");
  Logger.log("KFO Moosburg - Storyblok Setup");
  Logger.log("========================================");
  
  if (SPACE_ID === "DEINE_SPACE_ID_HIER" || MANAGEMENT_TOKEN === "DEIN_MANAGEMENT_TOKEN") {
    Logger.log("FEHLER: Bitte SPACE_ID und MANAGEMENT_TOKEN eintragen!");
    Logger.log("Space ID: Storyblok > Settings > General");
    Logger.log("Token: My Account > Personal Access Tokens");
    return;
  }
  
  Logger.log("\n--- Schritt 1: Komponenten ---");
  createComponents();
  
  Utilities.sleep(2000);
  
  Logger.log("\n--- Schritt 2: Stories mit Content ---");
  createStories();
  
  Logger.log("\n========================================");
  Logger.log("FERTIG! Setup komplett!");
  Logger.log("========================================");
  Logger.log("");
  Logger.log("Naechste Schritte:");
  Logger.log("1. Storyblok oeffnen > Content > 'Home' und 'Einstellungen' oeffnen");
  Logger.log("2. In den Tabs die Bilder hochladen (Asset-Felder)");
  Logger.log("3. Umlaute korrigieren (ae->ae, oe->oe, ue->ue, ss->ss)");
  Logger.log("4. Preview Token kopieren: Settings > Access Tokens");
  Logger.log("5. In Vercel: VITE_STORYBLOK_TOKEN = dein-preview-token setzen");
  Logger.log("6. Fertig! Website liest Content automatisch aus Storyblok");
}
