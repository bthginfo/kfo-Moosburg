/**
 * ================================================================
 * Storyblok FULL RESET + SEED Script
 * ================================================================
 *
 * Dieses Script macht ALLES in einem Durchlauf:
 *   1. Loescht alle Felder aus allen 5 Content Types
 *   2. Erstellt alle Felder NEU in korrekter Reihenfolge
 *      (exakt wie die Sections auf der Website von oben nach unten)
 *   3. Befuellt alle Stories mit den richtigen Werten
 *
 * USAGE:
 *   1. script.google.com > Neues Projekt
 *   2. Diesen gesamten Code einfuegen
 *   3. MGMT_TOKEN unten eintragen
 *   4. Funktion "runAll" auswaehlen > Run
 *   5. Execution Log pruefen
 *
 * HINWEIS: Das Script braucht ca. 2-3 Minuten wegen Rate Limits.
 * ================================================================
 */

var MGMT_TOKEN = "DEIN_MANAGEMENT_TOKEN_HIER";  // <-- HIER EINTRAGEN!
var SPACE_ID   = "291045863485848";
var API_BASE   = "https://mapi.storyblok.com/v1/spaces/" + SPACE_ID;

// ── API Helper ───────────────────────────────────────────────────
function sbApi(method, path, payload) {
  var url = API_BASE + path;
  var opts = {
    method: method,
    headers: { "Authorization": MGMT_TOKEN, "Content-Type": "application/json" },
    muteHttpExceptions: true
  };
  if (payload) opts.payload = JSON.stringify(payload);

  for (var a = 0; a < 5; a++) {
    var r = UrlFetchApp.fetch(url, opts);
    var code = r.getResponseCode();
    if (code === 429) {
      var wait = Math.pow(2, a) * 1500;
      Logger.log("  [Rate Limit] Warte " + wait + "ms...");
      Utilities.sleep(wait);
      continue;
    }
    if (code >= 400) throw new Error("API " + method + " " + path + " -> " + code + ": " + r.getContentText());
    return JSON.parse(r.getContentText());
  }
  throw new Error("Zu viele Retries: " + method + " " + path);
}

function findComponent(name) {
  var d = sbApi("GET", "/components");
  var comps = d.components || [];
  for (var i = 0; i < comps.length; i++) {
    if (comps[i].name === name) return comps[i];
  }
  return null;
}

function findStory(slug) {
  try {
    var d = sbApi("GET", "/stories?with_slug=" + encodeURIComponent(slug));
    return (d.stories && d.stories.length > 0) ? d.stories[0] : null;
  } catch (e) { Logger.log("  findStory error: " + e.message); return null; }
}


// ================================================================
//  STEP 1: SCHEMA DEFINITIONS (in exact page section order)
// ================================================================
// Jedes Feld: [fieldName, type, displayName]
// type: "text" | "textarea"
// Die Reihenfolge hier = Reihenfolge im Storyblok Editor!

function getHomeSchema() {
  return [
    // ── 1. HERO SECTION ──
    ["hero_video",          "text",     "Hero Video URL"],
    ["hero_image",          "text",     "Hero Poster Image URL"],
    ["hero_subtitle_de",    "text",     "Hero Subtitle (DE)"],
    ["hero_subtitle_en",    "text",     "Hero Subtitle (EN)"],
    ["hero_tagline_de",     "text",     "Hero Tagline (DE)"],
    ["hero_tagline_en",     "text",     "Hero Tagline (EN)"],
    ["hero_cta_de",         "text",     "Hero CTA Button (DE)"],
    ["hero_cta_en",         "text",     "Hero CTA Button (EN)"],

    // ── 2. SERVICES SECTION ──
    ["services_title_de",   "text",     "Services Pretitle (DE)"],
    ["services_title_en",   "text",     "Services Pretitle (EN)"],
    ["wedding_title_de",    "text",     "Service: Hochzeiten Title (DE)"],
    ["wedding_title_en",    "text",     "Service: Hochzeiten Title (EN)"],
    ["wedding_desc_de",     "textarea", "Service: Hochzeiten Text (DE)"],
    ["wedding_desc_en",     "textarea", "Service: Hochzeiten Text (EN)"],
    ["wedding_image",       "text",     "Service: Hochzeiten Image URL"],
    ["animals_title_de",    "text",     "Service: Tiere Title (DE)"],
    ["animals_title_en",    "text",     "Service: Tiere Title (EN)"],
    ["animals_desc_de",     "textarea", "Service: Tiere Text (DE)"],
    ["animals_desc_en",     "textarea", "Service: Tiere Text (EN)"],
    ["animals_image",       "text",     "Service: Tiere Image URL"],
    ["portrait_title_de",   "text",     "Service: Portrait Title (DE)"],
    ["portrait_title_en",   "text",     "Service: Portrait Title (EN)"],
    ["portrait_desc_de",    "textarea", "Service: Portrait Text (DE)"],
    ["portrait_desc_en",    "textarea", "Service: Portrait Text (EN)"],
    ["portrait_image",      "text",     "Service: Portrait Image URL"],
    ["view_more_de",        "text",     "View More Button (DE)"],
    ["view_more_en",        "text",     "View More Button (EN)"],

    // ── 3. HOW IT WORKS ──
    ["how_it_works_pretitle_de", "text", "How It Works Pretitle (DE)"],
    ["how_it_works_pretitle_en", "text", "How It Works Pretitle (EN)"],
    ["how_it_works_title_de",    "text", "How It Works Title (DE)"],
    ["how_it_works_title_en",    "text", "How It Works Title (EN)"],
    ["step1_title_de",      "text",     "Step 1 Title (DE)"],
    ["step1_title_en",      "text",     "Step 1 Title (EN)"],
    ["step1_text_de",       "textarea", "Step 1 Text (DE)"],
    ["step1_text_en",       "textarea", "Step 1 Text (EN)"],
    ["step2_title_de",      "text",     "Step 2 Title (DE)"],
    ["step2_title_en",      "text",     "Step 2 Title (EN)"],
    ["step2_text_de",       "textarea", "Step 2 Text (DE)"],
    ["step2_text_en",       "textarea", "Step 2 Text (EN)"],
    ["step3_title_de",      "text",     "Step 3 Title (DE)"],
    ["step3_title_en",      "text",     "Step 3 Title (EN)"],
    ["step3_text_de",       "textarea", "Step 3 Text (DE)"],
    ["step3_text_en",       "textarea", "Step 3 Text (EN)"],

    // ── 4. ABOUT / PHILOSOPHY ──
    ["about_pretitle_de",   "text",     "About Pretitle (DE)"],
    ["about_pretitle_en",   "text",     "About Pretitle (EN)"],
    ["about_title_de",      "text",     "About Title (DE)"],
    ["about_title_en",      "text",     "About Title (EN)"],
    ["about_text_de",       "textarea", "About Text (DE)"],
    ["about_text_en",       "textarea", "About Text (EN)"],
    ["philosophy_text_de",  "textarea", "Philosophy Text (DE)"],
    ["philosophy_text_en",  "textarea", "Philosophy Text (EN)"],
    ["about_image",         "text",     "About Section Image URL"],
    ["about_cta_de",        "text",     "About CTA Button (DE)"],
    ["about_cta_en",        "text",     "About CTA Button (EN)"],

    // ── 5. GALLERY ──
    ["inspired_title_de",   "text",     "Gallery Title (DE)"],
    ["inspired_title_en",   "text",     "Gallery Title (EN)"],
    ["load_more_de",        "text",     "Load More Button (DE)"],
    ["load_more_en",        "text",     "Load More Button (EN)"],

    // ── 6. WYLDWORKS CTA BANNER ──
    ["wyldworks_title_de",  "text",     "Wyldworks CTA Title (DE)"],
    ["wyldworks_title_en",  "text",     "Wyldworks CTA Title (EN)"],
    ["wyldworks_desc_de",   "textarea", "Wyldworks CTA Text (DE)"],
    ["wyldworks_desc_en",   "textarea", "Wyldworks CTA Text (EN)"],

    // ── 7. FINAL CTA ──
    ["cta_title_de",        "text",     "Final CTA Title (DE)"],
    ["cta_title_en",        "text",     "Final CTA Title (EN)"],
    ["cta_text_de",         "textarea", "Final CTA Text (DE)"],
    ["cta_text_en",         "textarea", "Final CTA Text (EN)"],
    ["cta_button_de",       "text",     "Final CTA Button (DE)"],
    ["cta_button_en",       "text",     "Final CTA Button (EN)"]
  ];
}

function getWeddingsSchema() {
  return [
    // ── 1. HERO ──
    ["hero_video",          "text",     "Hero Video URL"],
    ["hero_image",          "text",     "Hero Poster Image URL"],
    ["hero_title_de",       "text",     "Hero Title (DE)"],
    ["hero_title_en",       "text",     "Hero Title (EN)"],
    ["hero_subtitle_de",    "text",     "Hero Subtitle (DE)"],
    ["hero_subtitle_en",    "text",     "Hero Subtitle (EN)"],

    // ── 2. PHOTO SECTION ──
    ["photo_title_de",      "text",     "Photo Section Pretitle (DE)"],
    ["photo_title_en",      "text",     "Photo Section Pretitle (EN)"],
    ["photo_heading_de",    "text",     "Photo Section Heading (DE)"],
    ["photo_heading_en",    "text",     "Photo Section Heading (EN)"],
    ["photo_text_de",       "textarea", "Photo Section Text (DE)"],
    ["photo_text_en",       "textarea", "Photo Section Text (EN)"],
    ["photo1_image",        "text",     "Photo Section Image 1 URL"],
    ["photo2_image",        "text",     "Photo Section Image 2 URL"],
    ["photo_packages_de",   "text",     "Photo CTA Button (DE)"],
    ["photo_packages_en",   "text",     "Photo CTA Button (EN)"],

    // ── 3. VIDEO SECTION ──
    ["video_title_de",      "text",     "Video Section Pretitle (DE)"],
    ["video_title_en",      "text",     "Video Section Pretitle (EN)"],
    ["video_heading_de",    "text",     "Video Section Heading (DE)"],
    ["video_heading_en",    "text",     "Video Section Heading (EN)"],
    ["video_text_de",       "textarea", "Video Section Text (DE)"],
    ["video_text_en",       "textarea", "Video Section Text (EN)"],
    ["video_image",         "text",     "Video Section Image URL"],
    ["details_image",       "text",     "Details Image URL"],
    ["video_packages_de",   "text",     "Video CTA Button (DE)"],
    ["video_packages_en",   "text",     "Video CTA Button (EN)"],

    // ── 4. SHOT LIST ──
    ["shotlist_pretitle_de", "text",    "Shot List Pretitle (DE)"],
    ["shotlist_pretitle_en", "text",    "Shot List Pretitle (EN)"],
    ["shotlist_title_de",   "text",     "Shot List Title (DE)"],
    ["shotlist_title_en",   "text",     "Shot List Title (EN)"],
    ["shotlist_note_de",    "textarea", "Shot List Note (DE)"],
    ["shotlist_note_en",    "textarea", "Shot List Note (EN)"],

    // ── 5. PHOTOGRAPHY STYLES ──
    ["styles_pretitle_de",  "text",     "Styles Pretitle (DE)"],
    ["styles_pretitle_en",  "text",     "Styles Pretitle (EN)"],
    ["styles_title_de",     "text",     "Styles Title (DE)"],
    ["styles_title_en",     "text",     "Styles Title (EN)"],
    ["styles_intro_de",     "textarea", "Styles Intro (DE)"],
    ["styles_intro_en",     "textarea", "Styles Intro (EN)"],
    ["style1_icon",         "text",     "Style 1 Icon (lucide name)"],
    ["style1_title",        "text",     "Style 1 Title"],
    ["style1_text_de",      "textarea", "Style 1 Text (DE)"],
    ["style1_text_en",      "textarea", "Style 1 Text (EN)"],
    ["style2_icon",         "text",     "Style 2 Icon (lucide name)"],
    ["style2_title",        "text",     "Style 2 Title"],
    ["style2_text_de",      "textarea", "Style 2 Text (DE)"],
    ["style2_text_en",      "textarea", "Style 2 Text (EN)"],
    ["style3_icon",         "text",     "Style 3 Icon (lucide name)"],
    ["style3_title",        "text",     "Style 3 Title"],
    ["style3_text_de",      "textarea", "Style 3 Text (DE)"],
    ["style3_text_en",      "textarea", "Style 3 Text (EN)"],
    ["styles_note_de",      "textarea", "Styles Note (DE)"],
    ["styles_note_en",      "textarea", "Styles Note (EN)"],
    ["styles_cta_de",       "text",     "Styles CTA Button (DE)"],
    ["styles_cta_en",       "text",     "Styles CTA Button (EN)"],

    // ── 6. PACKAGES ──
    ["packages_title_de",   "text",     "Packages Section Title (DE)"],
    ["packages_title_en",   "text",     "Packages Section Title (EN)"],
    ["packages_photo_tab_de", "text",   "Photo Tab Label (DE)"],
    ["packages_photo_tab_en", "text",   "Photo Tab Label (EN)"],
    ["packages_video_tab_de", "text",   "Video Tab Label (DE)"],
    ["packages_video_tab_en", "text",   "Video Tab Label (EN)"],
    ["travel_note_de",      "textarea", "Travel Note Photo (DE)"],
    ["travel_note_en",      "textarea", "Travel Note Photo (EN)"],
    ["travel_note_video_de", "textarea","Travel Note Video (DE)"],
    ["travel_note_video_en", "textarea","Travel Note Video (EN)"],
    ["addons_pretitle_de",  "text",     "Add-ons Pretitle (DE)"],
    ["addons_pretitle_en",  "text",     "Add-ons Pretitle (EN)"],
    ["addons_title_de",     "text",     "Add-ons Title (DE)"],
    ["addons_title_en",     "text",     "Add-ons Title (EN)"],
    ["book_now_de",         "text",     "Book Now Button (DE)"],
    ["book_now_en",         "text",     "Book Now Button (EN)"],

    // ── 7. TIMELINE ──
    ["timeline_pretitle_de", "text",    "Timeline Pretitle (DE)"],
    ["timeline_pretitle_en", "text",    "Timeline Pretitle (EN)"],
    ["timeline_title_de",   "text",     "Timeline Title (DE)"],
    ["timeline_title_en",   "text",     "Timeline Title (EN)"],
    ["timeline_intro_de",   "textarea", "Timeline Intro (DE)"],
    ["timeline_intro_en",   "textarea", "Timeline Intro (EN)"],

    // ── 8. GALLERY ──
    ["gallery_title",       "text",     "Gallery Title"],
    ["load_more_de",        "text",     "Load More Button (DE)"],
    ["load_more_en",        "text",     "Load More Button (EN)"],

    // ── 9. TESTIMONIALS ──
    ["testimonials_title_de", "text",   "Testimonials Title (DE)"],
    ["testimonials_title_en", "text",   "Testimonials Title (EN)"],

    // ── 10. BOOKING PROCESS ──
    ["process_pretitle_de", "text",     "Process Pretitle (DE)"],
    ["process_pretitle_en", "text",     "Process Pretitle (EN)"],
    ["process_title_de",    "text",     "Process Title (DE)"],
    ["process_title_en",    "text",     "Process Title (EN)"],
    ["process1_icon",       "text",     "Process Step 1 Icon"],
    ["process1_title_de",   "text",     "Process Step 1 Title (DE)"],
    ["process1_title_en",   "text",     "Process Step 1 Title (EN)"],
    ["process1_text_de",    "textarea", "Process Step 1 Text (DE)"],
    ["process1_text_en",    "textarea", "Process Step 1 Text (EN)"],
    ["process2_icon",       "text",     "Process Step 2 Icon"],
    ["process2_title_de",   "text",     "Process Step 2 Title (DE)"],
    ["process2_title_en",   "text",     "Process Step 2 Title (EN)"],
    ["process2_text_de",    "textarea", "Process Step 2 Text (DE)"],
    ["process2_text_en",    "textarea", "Process Step 2 Text (EN)"],
    ["process3_icon",       "text",     "Process Step 3 Icon"],
    ["process3_title_de",   "text",     "Process Step 3 Title (DE)"],
    ["process3_title_en",   "text",     "Process Step 3 Title (EN)"],
    ["process3_text_de",    "textarea", "Process Step 3 Text (DE)"],
    ["process3_text_en",    "textarea", "Process Step 3 Text (EN)"],
    ["process4_icon",       "text",     "Process Step 4 Icon"],
    ["process4_title_de",   "text",     "Process Step 4 Title (DE)"],
    ["process4_title_en",   "text",     "Process Step 4 Title (EN)"],
    ["process4_text_de",    "textarea", "Process Step 4 Text (DE)"],
    ["process4_text_en",    "textarea", "Process Step 4 Text (EN)"],
    ["process5_icon",       "text",     "Process Step 5 Icon"],
    ["process5_title_de",   "text",     "Process Step 5 Title (DE)"],
    ["process5_title_en",   "text",     "Process Step 5 Title (EN)"],
    ["process5_text_de",    "textarea", "Process Step 5 Text (DE)"],
    ["process5_text_en",    "textarea", "Process Step 5 Text (EN)"],
    ["process6_icon",       "text",     "Process Step 6 Icon"],
    ["process6_title_de",   "text",     "Process Step 6 Title (DE)"],
    ["process6_title_en",   "text",     "Process Step 6 Title (EN)"],
    ["process6_text_de",    "textarea", "Process Step 6 Text (DE)"],
    ["process6_text_en",    "textarea", "Process Step 6 Text (EN)"],

    // ── 11. WEDDING GUIDE ──
    ["guide_pretitle_de",   "text",     "Guide Pretitle (DE)"],
    ["guide_pretitle_en",   "text",     "Guide Pretitle (EN)"],
    ["guide_title",         "text",     "Guide Title"],
    ["guide_season_de",     "text",     "Guide Season (DE)"],
    ["guide_season_en",     "text",     "Guide Season (EN)"],
    ["guide_text_de",       "textarea", "Guide Text (DE)"],
    ["guide_text_en",       "textarea", "Guide Text (EN)"],
    ["guide_pdf",           "text",     "Guide PDF URL"],
    ["guide_button_de",     "text",     "Guide Download Button (DE)"],
    ["guide_button_en",     "text",     "Guide Download Button (EN)"],
    ["guide_note_de",       "text",     "Guide Note (DE)"],
    ["guide_note_en",       "text",     "Guide Note (EN)"],

    // ── 12. FINAL CTA ──
    ["cta_title_de",        "text",     "Final CTA Title (DE)"],
    ["cta_title_en",        "text",     "Final CTA Title (EN)"],
    ["cta_text_de",         "textarea", "Final CTA Text (DE)"],
    ["cta_text_en",         "textarea", "Final CTA Text (EN)"],
    ["cta_button_de",       "text",     "Final CTA Button (DE)"],
    ["cta_button_en",       "text",     "Final CTA Button (EN)"]
  ];
}

function getAnimalsSchema() {
  return [
    // ── 1. HERO ──
    ["hero_image",          "text",     "Hero Image URL"],
    ["hero_title_de",       "text",     "Hero Title (DE)"],
    ["hero_title_en",       "text",     "Hero Title (EN)"],
    ["hero_subtitle_de",    "text",     "Hero Subtitle (DE)"],
    ["hero_subtitle_en",    "text",     "Hero Subtitle (EN)"],

    // ── 2. INTRO ──
    ["intro_de",            "textarea", "Intro Text (DE)"],
    ["intro_en",            "textarea", "Intro Text (EN)"],

    // ── 3. CATEGORIES ──
    ["dogs_title_de",       "text",     "Dogs Title (DE)"],
    ["dogs_title_en",       "text",     "Dogs Title (EN)"],
    ["dogs_text_de",        "textarea", "Dogs Text (DE)"],
    ["dogs_text_en",        "textarea", "Dogs Text (EN)"],
    ["dogs_image",          "text",     "Dogs Image URL"],
    ["horses_title_de",     "text",     "Horses Title (DE)"],
    ["horses_title_en",     "text",     "Horses Title (EN)"],
    ["horses_text_de",      "textarea", "Horses Text (DE)"],
    ["horses_text_en",      "textarea", "Horses Text (EN)"],
    ["horses_image",        "text",     "Horses Image URL"],
    ["other_title_de",      "text",     "Other Animals Title (DE)"],
    ["other_title_en",      "text",     "Other Animals Title (EN)"],
    ["other_text_de",       "textarea", "Other Animals Text (DE)"],
    ["other_text_en",       "textarea", "Other Animals Text (EN)"],
    ["cats_image",          "text",     "Cats/Other Image URL"],

    // ── 4. PACKAGES ──
    ["packages_title_de",   "text",     "Packages Title (DE)"],
    ["packages_title_en",   "text",     "Packages Title (EN)"],
    ["studio_image",        "text",     "Studio Package Image URL"],
    ["outdoor_image",       "text",     "Outdoor Package Image URL"],

    // ── 5. MID CTA ──
    ["midcta_text_de",      "textarea", "Mid CTA Text (DE)"],
    ["midcta_text_en",      "textarea", "Mid CTA Text (EN)"],
    ["midcta_button_de",    "text",     "Mid CTA Button (DE)"],
    ["midcta_button_en",    "text",     "Mid CTA Button (EN)"],

    // ── 6. GALLERY ──
    ["gallery_title",       "text",     "Gallery Title"],

    // ── 7. TIPS ──
    ["tips_pretitle_de",    "text",     "Tips Pretitle (DE)"],
    ["tips_pretitle_en",    "text",     "Tips Pretitle (EN)"],
    ["tips_title_de",       "text",     "Tips Title (DE)"],
    ["tips_title_en",       "text",     "Tips Title (EN)"],
    ["tip1_icon",           "text",     "Tip 1 Icon (lucide name)"],
    ["tip1_title_de",       "text",     "Tip 1 Title (DE)"],
    ["tip1_title_en",       "text",     "Tip 1 Title (EN)"],
    ["tip1_text_de",        "textarea", "Tip 1 Text (DE)"],
    ["tip1_text_en",        "textarea", "Tip 1 Text (EN)"],
    ["tip2_icon",           "text",     "Tip 2 Icon (lucide name)"],
    ["tip2_title_de",       "text",     "Tip 2 Title (DE)"],
    ["tip2_title_en",       "text",     "Tip 2 Title (EN)"],
    ["tip2_text_de",        "textarea", "Tip 2 Text (DE)"],
    ["tip2_text_en",        "textarea", "Tip 2 Text (EN)"],
    ["tip3_icon",           "text",     "Tip 3 Icon (lucide name)"],
    ["tip3_title_de",       "text",     "Tip 3 Title (DE)"],
    ["tip3_title_en",       "text",     "Tip 3 Title (EN)"],
    ["tip3_text_de",        "textarea", "Tip 3 Text (DE)"],
    ["tip3_text_en",        "textarea", "Tip 3 Text (EN)"],
    ["tip4_icon",           "text",     "Tip 4 Icon (lucide name)"],
    ["tip4_title_de",       "text",     "Tip 4 Title (DE)"],
    ["tip4_title_en",       "text",     "Tip 4 Title (EN)"],
    ["tip4_text_de",        "textarea", "Tip 4 Text (DE)"],
    ["tip4_text_en",        "textarea", "Tip 4 Text (EN)"],

    // ── 8. FINAL CTA ──
    ["cta_title_de",        "text",     "Final CTA Title (DE)"],
    ["cta_title_en",        "text",     "Final CTA Title (EN)"],
    ["cta_text_de",         "textarea", "Final CTA Text (DE)"],
    ["cta_text_en",         "textarea", "Final CTA Text (EN)"],
    ["cta_button_de",       "text",     "Final CTA Button (DE)"],
    ["cta_button_en",       "text",     "Final CTA Button (EN)"]
  ];
}

function getPortraitSchema() {
  return [
    // ── 1. HERO ──
    ["hero_image",          "text",     "Hero Image URL"],
    ["hero_title_de",       "text",     "Hero Title (DE)"],
    ["hero_title_en",       "text",     "Hero Title (EN)"],
    ["hero_subtitle_de",    "text",     "Hero Subtitle (DE)"],
    ["hero_subtitle_en",    "text",     "Hero Subtitle (EN)"],

    // ── 2. INTRO ──
    ["intro_de",            "textarea", "Intro Text (DE)"],
    ["intro_en",            "textarea", "Intro Text (EN)"],

    // ── 3. CATEGORIES ──
    ["couple_title_de",     "text",     "Couple Title (DE)"],
    ["couple_title_en",     "text",     "Couple Title (EN)"],
    ["couple_text_de",      "textarea", "Couple Text (DE)"],
    ["couple_text_en",      "textarea", "Couple Text (EN)"],
    ["couple_image",        "text",     "Couple Image URL"],
    ["family_title_de",     "text",     "Family Title (DE)"],
    ["family_title_en",     "text",     "Family Title (EN)"],
    ["family_text_de",      "textarea", "Family Text (DE)"],
    ["family_text_en",      "textarea", "Family Text (EN)"],
    ["family_image",        "text",     "Family Image URL"],
    ["private_title_de",    "text",     "Private Occasions Title (DE)"],
    ["private_title_en",    "text",     "Private Occasions Title (EN)"],
    ["private_text_de",     "textarea", "Private Occasions Text (DE)"],
    ["private_text_en",     "textarea", "Private Occasions Text (EN)"],
    ["baptism_image",       "text",     "Baptism/Private Image URL"],

    // ── 4. PRICING ──
    ["pricing_pretitle_de", "text",     "Pricing Pretitle (DE)"],
    ["pricing_pretitle_en", "text",     "Pricing Pretitle (EN)"],
    ["pricing_title_de",    "text",     "Pricing Title (DE)"],
    ["pricing_title_en",    "text",     "Pricing Title (EN)"],
    ["pricing_text_de",     "textarea", "Pricing Text (DE)"],
    ["pricing_text_en",     "textarea", "Pricing Text (EN)"],
    ["pricing_note_de",     "textarea", "Pricing Note (DE)"],
    ["pricing_note_en",     "textarea", "Pricing Note (EN)"],
    ["pricing_cta_de",      "text",     "Pricing CTA Button (DE)"],
    ["pricing_cta_en",      "text",     "Pricing CTA Button (EN)"],

    // ── 5. OCCASIONS ──
    ["occasions_title_de",  "text",     "Occasions Section Title (DE)"],
    ["occasions_title_en",  "text",     "Occasions Section Title (EN)"],
    ["occasion1_icon",      "text",     "Occasion 1 Icon"],
    ["occasion1_title_de",  "text",     "Occasion 1 Title (DE)"],
    ["occasion1_title_en",  "text",     "Occasion 1 Title (EN)"],
    ["occasion1_text_de",   "text",     "Occasion 1 Text (DE)"],
    ["occasion1_text_en",   "text",     "Occasion 1 Text (EN)"],
    ["occasion2_icon",      "text",     "Occasion 2 Icon"],
    ["occasion2_title_de",  "text",     "Occasion 2 Title (DE)"],
    ["occasion2_title_en",  "text",     "Occasion 2 Title (EN)"],
    ["occasion2_text_de",   "text",     "Occasion 2 Text (DE)"],
    ["occasion2_text_en",   "text",     "Occasion 2 Text (EN)"],
    ["occasion3_icon",      "text",     "Occasion 3 Icon"],
    ["occasion3_title_de",  "text",     "Occasion 3 Title (DE)"],
    ["occasion3_title_en",  "text",     "Occasion 3 Title (EN)"],
    ["occasion3_text_de",   "text",     "Occasion 3 Text (DE)"],
    ["occasion3_text_en",   "text",     "Occasion 3 Text (EN)"],
    ["occasion4_icon",      "text",     "Occasion 4 Icon"],
    ["occasion4_title_de",  "text",     "Occasion 4 Title (DE)"],
    ["occasion4_title_en",  "text",     "Occasion 4 Title (EN)"],
    ["occasion4_text_de",   "text",     "Occasion 4 Text (DE)"],
    ["occasion4_text_en",   "text",     "Occasion 4 Text (EN)"],

    // ── 6. GALLERY ──
    ["gallery_title",       "text",     "Gallery Title"],

    // ── 7. FINAL CTA ──
    ["cta_title_de",        "text",     "Final CTA Title (DE)"],
    ["cta_title_en",        "text",     "Final CTA Title (EN)"],
    ["cta_text_de",         "textarea", "Final CTA Text (DE)"],
    ["cta_text_en",         "textarea", "Final CTA Text (EN)"],
    ["cta_button_de",       "text",     "Final CTA Button (DE)"],
    ["cta_button_en",       "text",     "Final CTA Button (EN)"]
  ];
}

function getAboutSchema() {
  return [
    // ── 1. HEADER / HERO ──
    ["hero_video",          "text",     "Hero Video URL"],
    ["portrait_image",      "text",     "Portrait Image URL"],
    ["mario_action_image",  "text",     "Mario Action Image URL"],
    ["about_title_de",      "text",     "Page Title (DE)"],
    ["about_title_en",      "text",     "Page Title (EN)"],
    ["heading_de",          "text",     "Main Heading (DE)"],
    ["heading_en",          "text",     "Main Heading (EN)"],

    // ── 2. BIO TEXTS ──
    ["text1_de",            "textarea", "Bio Text 1 (DE)"],
    ["text1_en",            "textarea", "Bio Text 1 (EN)"],
    ["text2_de",            "textarea", "Bio Text 2 (DE)"],
    ["text2_en",            "textarea", "Bio Text 2 (EN)"],
    ["text3_de",            "textarea", "Bio Text 3 (DE)"],
    ["text3_en",            "textarea", "Bio Text 3 (EN)"],

    // ── 3. PHILOSOPHY / APPROACH ──
    ["philosophy_title_de", "text",     "Philosophy Section Title (DE)"],
    ["philosophy_title_en", "text",     "Philosophy Section Title (EN)"],
    ["philosophy1_de",      "text",     "Philosophy 1 Title (DE)"],
    ["philosophy1_en",      "text",     "Philosophy 1 Title (EN)"],
    ["philosophy1_text_de", "textarea", "Philosophy 1 Text (DE)"],
    ["philosophy1_text_en", "textarea", "Philosophy 1 Text (EN)"],
    ["philosophy2_de",      "text",     "Philosophy 2 Title (DE)"],
    ["philosophy2_en",      "text",     "Philosophy 2 Title (EN)"],
    ["philosophy2_text_de", "textarea", "Philosophy 2 Text (DE)"],
    ["philosophy2_text_en", "textarea", "Philosophy 2 Text (EN)"],
    ["philosophy3_de",      "text",     "Philosophy 3 Title (DE)"],
    ["philosophy3_en",      "text",     "Philosophy 3 Title (EN)"],
    ["philosophy3_text_de", "textarea", "Philosophy 3 Text (DE)"],
    ["philosophy3_text_en", "textarea", "Philosophy 3 Text (EN)"],

    // ── 4. WHAT TO EXPECT ──
    ["expect_title_de",     "text",     "What To Expect Title (DE)"],
    ["expect_title_en",     "text",     "What To Expect Title (EN)"],

    // ── 5. TAGLINE ──
    ["tagline_de",          "text",     "Tagline (DE)"],
    ["tagline_en",          "text",     "Tagline (EN)"],
    ["tagline_bold_de",     "text",     "Tagline Bold Word (DE)"],
    ["tagline_bold_en",     "text",     "Tagline Bold Word (EN)"],
    ["tagline_desc_de",     "textarea", "Tagline Description (DE)"],
    ["tagline_desc_en",     "textarea", "Tagline Description (EN)"],

    // ── 6. STATS ──
    ["stats_title_de",      "text",     "Stats Section Title (DE)"],
    ["stats_title_en",      "text",     "Stats Section Title (EN)"],
    ["stat1_num",           "text",     "Stat 1 Number"],
    ["stat1_label_de",      "text",     "Stat 1 Label (DE)"],
    ["stat1_label_en",      "text",     "Stat 1 Label (EN)"],
    ["stat2_num",           "text",     "Stat 2 Number"],
    ["stat2_label_de",      "text",     "Stat 2 Label (DE)"],
    ["stat2_label_en",      "text",     "Stat 2 Label (EN)"],
    ["stat3_num",           "text",     "Stat 3 Number"],
    ["stat3_label_de",      "text",     "Stat 3 Label (DE)"],
    ["stat3_label_en",      "text",     "Stat 3 Label (EN)"],
    ["stat4_num",           "text",     "Stat 4 Number"],
    ["stat4_label_de",      "text",     "Stat 4 Label (DE)"],
    ["stat4_label_en",      "text",     "Stat 4 Label (EN)"],

    // ── 7. PASSION SECTION ──
    ["passion_pretitle_de", "text",     "Passion Pretitle (DE)"],
    ["passion_pretitle_en", "text",     "Passion Pretitle (EN)"],
    ["passion_title_de",    "text",     "Passion Title (DE)"],
    ["passion_title_en",    "text",     "Passion Title (EN)"],
    ["passion_text1_de",    "textarea", "Passion Text 1 (DE)"],
    ["passion_text1_en",    "textarea", "Passion Text 1 (EN)"],
    ["passion_text2_de",    "textarea", "Passion Text 2 (DE)"],
    ["passion_text2_en",    "textarea", "Passion Text 2 (EN)"],
    ["passion_cta_de",      "text",     "Passion CTA Button (DE)"],
    ["passion_cta_en",      "text",     "Passion CTA Button (EN)"],

    // ── 8. TESTIMONIALS ──
    ["testimonials_title_de", "text",   "Testimonials Title (DE)"],
    ["testimonials_title_en", "text",   "Testimonials Title (EN)"],

    // ── 9. CONTACT SECTION ──
    ["contact_pretitle_de", "text",     "Contact Pretitle (DE)"],
    ["contact_pretitle_en", "text",     "Contact Pretitle (EN)"],
    ["contact_title_de",    "text",     "Contact Title (DE)"],
    ["contact_title_en",    "text",     "Contact Title (EN)"],
    ["contact_text_de",     "textarea", "Contact Text (DE)"],
    ["contact_text_en",     "textarea", "Contact Text (EN)"],
    ["contact_cta_de",      "text",     "Contact CTA Button (DE)"],
    ["contact_cta_en",      "text",     "Contact CTA Button (EN)"],
    ["contact_or_de",       "text",     "Contact Or Text (DE)"],
    ["contact_or_en",       "text",     "Contact Or Text (EN)"],

    // ── 10. FINAL CTA BANNER ──
    ["cta_pretitle_de",     "text",     "Final CTA Pretitle (DE)"],
    ["cta_pretitle_en",     "text",     "Final CTA Pretitle (EN)"],
    ["cta_title_de",        "text",     "Final CTA Title (DE)"],
    ["cta_title_en",        "text",     "Final CTA Title (EN)"],
    ["cta_text_de",         "textarea", "Final CTA Text (DE)"],
    ["cta_text_en",         "textarea", "Final CTA Text (EN)"],
    ["cta_button_de",       "text",     "Final CTA Button (DE)"],
    ["cta_button_en",       "text",     "Final CTA Button (EN)"]
  ];
}


// ================================================================
//  STEP 1: RESET & REBUILD SCHEMAS
// ================================================================

function buildSchemaObject(fieldDefs) {
  var schema = {};
  for (var i = 0; i < fieldDefs.length; i++) {
    var name = fieldDefs[i][0];
    var type = fieldDefs[i][1];
    var display = fieldDefs[i][2];
    schema[name] = {
      type: type,
      pos: i,
      display_name: display
    };
  }
  return schema;
}

function resetComponentSchema(componentName, fieldDefs) {
  Logger.log("\n" + "=".repeat(50));
  Logger.log("RESET SCHEMA: " + componentName);
  Logger.log("=".repeat(50));

  var comp = findComponent(componentName);
  if (!comp) {
    Logger.log("  FEHLER: Component '" + componentName + "' nicht gefunden!");
    return false;
  }

  Logger.log("  Gefunden: id=" + comp.id);
  Logger.log("  Alte Felder: " + Object.keys(comp.schema || {}).length);

  // Komplett neues Schema erstellen
  var newSchema = buildSchemaObject(fieldDefs);
  Logger.log("  Neue Felder: " + Object.keys(newSchema).length + " (in korrekter Reihenfolge)");

  try {
    sbApi("PUT", "/components/" + comp.id, {
      component: {
        name: comp.name,
        schema: newSchema,
        is_root: comp.is_root,
        is_nestable: comp.is_nestable
      }
    });
    Logger.log("  ERFOLG! Schema komplett neu aufgebaut.");
    return true;
  } catch (e) {
    Logger.log("  FEHLER: " + e.message);
    return false;
  }
}

function resetAllSchemas() {
  Logger.log("\n########################################");
  Logger.log("  STEP 1: ALLE SCHEMAS NEU AUFBAUEN");
  Logger.log("########################################\n");

  var ok = 0;

  if (resetComponentSchema("page_home", getHomeSchema())) ok++;
  Utilities.sleep(1500);

  if (resetComponentSchema("page_weddings", getWeddingsSchema())) ok++;
  Utilities.sleep(1500);

  if (resetComponentSchema("page_animals", getAnimalsSchema())) ok++;
  Utilities.sleep(1500);

  if (resetComponentSchema("page_portrait", getPortraitSchema())) ok++;
  Utilities.sleep(1500);

  if (resetComponentSchema("page_about", getAboutSchema())) ok++;

  Logger.log("\n  Schema-Reset: " + ok + "/5 erfolgreich");
  return ok;
}


// ================================================================
//  STEP 2: SEED CONTENT DATA
// ================================================================

function getAllSeedData() {
  return {

// ── HOME ─────────────────────────────────────────────────────────
home: {
  content_type: "page_home",
  fields: {
    // 1. Hero
    hero_video: "https://ik.imagekit.io/r2yqrg6np/Wedding%20Clip%20fu%CC%88r%20Wesbeite_ProRes422_1080p.mp4?updatedAt=1773071703884",
    hero_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/E00A5635-2.jpg?updatedAt=1773007052923",
    hero_subtitle_de: "Fotografie & Videografie",
    hero_subtitle_en: "Photography & Videography",
    hero_tagline_de: "Timeless photos. Unforgettable stories.",
    hero_tagline_en: "Timeless photos. Unforgettable stories.",
    hero_cta_de: "Jetzt anfragen",
    hero_cta_en: "Inquire now",
    // 2. Services
    services_title_de: "Was ich anbiete",
    services_title_en: "What I offer",
    wedding_title_de: "Hochzeiten",
    wedding_title_en: "Weddings",
    wedding_desc_de: "Euer gro\u00DFer Tag verdient mehr als nur Fotos \u2013 er verdient Erinnerungen, die sich anf\u00FChlen. Ich begleite euch von den ersten aufgeregten Momenten beim Getting Ready bis zum letzten Tanz und halte alles fest, was dazwischen passiert: echte Emotionen, leise Gesten und pure Lebensfreude.",
    wedding_desc_en: "Your big day deserves more than just photos \u2013 it deserves memories that feel real. I accompany you from the first excited moments of getting ready to the last dance and capture everything in between: genuine emotions, quiet gestures and pure joy.",
    wedding_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_151924_0405(LowRes).jpg?updatedAt=1773007048480",
    animals_title_de: "Tierfotografie",
    animals_title_en: "Animal Photography",
    animals_desc_de: "Ob treuer Hundeblick, die Eleganz eures Pferdes oder das verschmitzte Grinsen eurer Katze \u2013 eure Fellnase hat einen ganz eigenen Charakter, und genau den fange ich ein. Entspannt, geduldig und mit ganz viel Liebe zum Detail.",
    animals_desc_en: "Whether a loyal dog\u2019s gaze, the elegance of your horse or the mischievous grin of your cat \u2013 your pet has a unique character, and that\u2019s exactly what I capture. Relaxed, patient and with lots of attention to detail.",
    animals_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_R52_1038_(WebRes).jpg?updatedAt=1773000802084",
    portrait_title_de: "Portrait & Mehr",
    portrait_title_en: "Portrait & More",
    portrait_desc_de: "Verliebte Blicke beim Couple Shooting, das Lachen eurer Kinder beim Familienfoto oder die Emotionen bei der Taufe \u2013 ich halte die Momente fest, die ihr nie vergessen wollt. Nat\u00FCrlich, ungezwungen und voller W\u00E4rme.",
    portrait_desc_en: "Loving glances during a couple shoot, your children\u2019s laughter in a family photo or the emotions at a baptism \u2013 I capture the moments you never want to forget. Natural, relaxed and full of warmth.",
    portrait_image: "https://ik.imagekit.io/r2yqrg6np/Other/R52_0832.jpg?updatedAt=1773014105220",
    view_more_de: "Mehr erfahren",
    view_more_en: "Learn more",
    // 3. How it works
    how_it_works_pretitle_de: "SO L\u00C4UFT'S AB",
    how_it_works_pretitle_en: "HOW IT WORKS",
    how_it_works_title_de: "In 3 Schritten zu euren Bildern",
    how_it_works_title_en: "3 steps to your images",
    step1_title_de: "Anfrage & Kennenlernen",
    step1_title_en: "Inquiry & Getting to know",
    step1_text_de: "Schreibt mir und erz\u00E4hlt mir von euch. In einem unverbindlichen Erstgespr\u00E4ch kl\u00E4ren wir alle Fragen.",
    step1_text_en: "Write to me and tell me about yourselves. In a free initial conversation we'll clarify everything.",
    step2_title_de: "Planung & Vorbereitung",
    step2_title_en: "Planning & Preparation",
    step2_text_de: "Gemeinsam planen wir euer Shooting \u2013 von der Location \u00FCber den Zeitplan bis zur Stimmung.",
    step2_text_en: "Together we plan your shoot \u2013 from location to schedule to mood.",
    step3_title_de: "Shooting & Ergebnis",
    step3_title_en: "Shoot & Results",
    step3_text_de: "Am Tag selbst seid ihr entspannt, ich fange alles ein. Innerhalb weniger Wochen erhaltet ihr eure Galerie.",
    step3_text_en: "On the day you relax, I capture everything. Within a few weeks you'll receive your gallery.",
    // 4. About / Philosophy
    about_pretitle_de: "\u00DCber mich",
    about_pretitle_en: "About me",
    about_title_de: "Ich bin Mario",
    about_title_en: "I'm Mario",
    about_text_de: "Geboren in Bayern, in Innsbruck h\u00E4ngen geblieben. Mit 15 habe ich meine erste Kamera in der Hand gehabt und bin seitdem nicht mehr davon losgekommen. Aus dem Hobby wurde Leidenschaft, aus der Leidenschaft mein Beruf.",
    about_text_en: "Born in Bavaria, settled in Innsbruck. At 15, I held my first camera and never looked back. What started as a hobby became passion, and passion became my profession.",
    philosophy_text_de: "Heute begleite ich Hochzeiten so, wie sie sind: echt, ungestellt, voller Gef\u00FChl. Ich mische mich unter die G\u00E4ste, bleibe unauff\u00E4llig und fange die Momente ein, die man nicht inszenieren kann. In der Bearbeitung bekommen eure Bilder einen Hauch Editorial, cineastisch und zeitlos \u2013 Erinnerungen, die euch f\u00FCr immer bleiben.",
    philosophy_text_en: "Today I accompany weddings as they are: real, unposed, full of feeling. I mingle with the guests, stay unobtrusive and capture the moments that cannot be staged. In editing, your images get a touch of editorial, cinematic and timeless \u2013 memories that stay with you forever.",
    about_image: "https://ik.imagekit.io/r2yqrg6np/68e54c497a9dde9d00252dcb_WhatsApp%20Image%202025-09-16%20at%2022.32.17.avif",
    about_cta_de: "Mehr zu mir",
    about_cta_en: "More about me",
    // 5. Gallery
    inspired_title_de: "GET INSPIRED",
    inspired_title_en: "GET INSPIRED",
    load_more_de: "Mehr anzeigen",
    load_more_en: "Load more",
    // 6. Wyldworks CTA
    wyldworks_title_de: "Foto & Video f\u00FCr Unternehmen?",
    wyldworks_title_en: "Photo & video for businesses?",
    wyldworks_desc_de: "Employer Branding, Imagefilme, Events & Social Media Content \u2013 das l\u00E4uft \u00FCber meine Agentur.",
    wyldworks_desc_en: "Employer branding, image films, events & social media content \u2013 that\u2019s handled by my agency.",
    // 7. Final CTA
    cta_title_de: "Lass uns reden!",
    cta_title_en: "Let's talk!",
    cta_text_de: "Ihr plant eure Hochzeit, w\u00FCnscht euch ein Shooting mit eurer Familie oder eurem Vierbeiner, oder habt einfach eine Idee im Kopf? Schreibt mir ganz unverbindlich \u2013 ich freu mich, eure Geschichte zu h\u00F6ren und gemeinsam etwas Sch\u00F6nes daraus zu machen.",
    cta_text_en: "Planning your wedding, want a shoot with your family or your furry friend, or just have an idea in mind? Drop me a message \u2013 no strings attached. I'd love to hear your story and create something beautiful together.",
    cta_button_de: "Kontakt aufnehmen",
    cta_button_en: "Get in touch"
  }
},

// ── WEDDINGS ─────────────────────────────────────────────────────
weddings: {
  content_type: "page_weddings",
  fields: {
    // 1. Hero
    hero_video: "https://ik.imagekit.io/r2yqrg6np/Lo%CC%88wenClip_fu%CC%88r_Webseite_compressed.mp4?updatedAt=1773077988312",
    hero_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_152738_0428(LowRes).jpg?updatedAt=1773007053353",
    hero_title_de: "Hochzeitsfotografie & Videografie",
    hero_title_en: "Wedding Photography & Videography",
    hero_subtitle_de: "Zeitlos & Authentisch",
    hero_subtitle_en: "Timeless & Authentic",
    // 2. Photo Section
    photo_title_de: "WEDDING PHOTOGRAPHY",
    photo_title_en: "WEDDING PHOTOGRAPHY",
    photo_heading_de: "Zeitlos & Authentisch",
    photo_heading_en: "Timeless & Authentic",
    photo_text_de: "Egal ob ihr euch im kleinen Kreis das Ja-Wort gebt, in den Bergen ganz f\u00FCr euch allein heiratet oder mit all euren Lieblingsmenschen eine wilde Party feiert \u2013 ich halte eure Geschichte so fest, wie sie ist: ehrlich, ungezwungen und voller Leben. Kein gestelltes Posing, keine steifen Gruppenfotos. Stattdessen echte Emotionen, stille Momente und die pure Freude, die euren Tag so besonders macht. Mein Ziel: Wenn ihr eure Bilder anschaut, sollt ihr euch sofort zur\u00FCckerinnern, wie es sich angef\u00FChlt hat.",
    photo_text_en: "Whether you say 'I do' in an intimate circle, elope to the mountains just the two of you, or throw a wild party with all your favorite people \u2013 I capture your story as it is: honest, relaxed and full of life. No stiff posing, no awkward group photos. Instead, real emotions, quiet moments and the pure joy that makes your day so special. My goal: when you look at your photos, you should instantly remember how it all felt.",
    photo1_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/5048_IG.jpg?updatedAt=1773007053682",
    photo2_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_151924_0405(LowRes).jpg?updatedAt=1773007048480",
    photo_packages_de: "Meine Foto-Pakete",
    photo_packages_en: "My Photo Packages",
    // 3. Video Section
    video_title_de: "WEDDING VIDEOGRAPHY",
    video_title_en: "WEDDING VIDEOGRAPHY",
    video_heading_de: "Dynamisch & Emotional",
    video_heading_en: "Dynamic & Emotional",
    video_text_de: "Ein Film f\u00E4ngt mehr ein als nur Bilder \u2013 er bewahrt Stimmen, Bewegungen und Stimmungen. Das Zittern in der Stimme beim Eheversprechen, das Lachen eurer besten Freunde, die Musik beim ersten Tanz. So k\u00F6nnt ihr auch Jahre sp\u00E4ter noch sp\u00FCren, wie es sich angef\u00FChlt hat. Meine Hochzeitsfilme sind cineastisch, emotional und genau so einzigartig wie euer Tag selbst.",
    video_text_en: "A film captures more than just images \u2013 it preserves voices, movements and moods. The trembling in your voice during the vows, the laughter of your best friends, the music during your first dance. So you can still feel years later what it was like. My wedding films are cinematic, emotional and just as unique as your day itself.",
    video_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/20251025_8D2A5136_(WebRes)-2.jpg?updatedAt=1773007047706",
    details_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_153606_0453(LowRes).jpg?updatedAt=1773007049638",
    video_packages_de: "Meine Video-Pakete",
    video_packages_en: "My Video Packages",
    // 4. Shot List
    shotlist_pretitle_de: "Meine Aufnahmeliste",
    shotlist_pretitle_en: "My Shot List",
    shotlist_title_de: "Was ich an eurem Tag festhalte",
    shotlist_title_en: "What I capture on your day",
    shotlist_note_de: "Nat\u00FCrlich ist jede Hochzeit anders \u2013 wir stimmen den Ablauf vorher gemeinsam ab, damit ich genau die Momente einfange, die euch wichtig sind.",
    shotlist_note_en: "Of course every wedding is different \u2013 we coordinate the schedule together beforehand so I capture exactly the moments that matter to you.",
    // 5. Photography Styles
    styles_pretitle_de: "BILDSPRACHE",
    styles_pretitle_en: "VISUAL LANGUAGE",
    styles_title_de: "Mein Stil. Euer Look.",
    styles_title_en: "My Style. Your Look.",
    styles_intro_de: "Wir jagen keinen Pinterest-Trends hinterher, die in zwei Jahren veraltet sind. Wir jagen dem Gef\u00FChl hinterher. Eure Bilder sollen in zehn, zwanzig oder drei\u00DFig Jahren noch genau denselben Herzschlag ausl\u00F6sen wie heute.",
    styles_intro_en: "We don't chase Pinterest trends that will be outdated in two years. We chase the feeling. Your images should trigger the exact same heartbeat in ten, twenty or thirty years as they do today.",
    style1_icon: "sun",
    style1_title: "True to Life",
    style1_text_de: "So, wie es wirklich war. Die Farben bleiben nat\u00FCrlich und zeitlos. Das Gras ist gr\u00FCn, der Himmel blau und eure Hautt\u00F6ne sind genau so, wie sie in echt aussehen.",
    style1_text_en: "Just as it really was. Colors stay natural and timeless. The grass is green, the sky is blue and your skin tones are exactly as they look in real life.",
    style2_icon: "sparkles",
    style2_title: "Bright & Airy",
    style2_text_de: "Lichtdurchflutet, weich und freundlich. Dieser Look zaubert Leichtigkeit in die Bilder. Schatten werden aufgehellt, alles wirkt strahlender und pastelliger. Perfekt f\u00FCr Sommerhochzeiten und helle Locations.",
    style2_text_en: "Flooded with light, soft and friendly. This look adds airiness to the images. Shadows are lifted, everything looks brighter and more pastel. Perfect for summer weddings and bright venues.",
    style3_icon: "contrast",
    style3_title: "Editorial",
    style3_text_de: "Ein bisschen mehr Drama, bitte. Hier orientieren wir uns an Magazinen und Modefotografie. Der Look ist kontrastreicher, mutiger und spielt bewusst mit Licht und Schatten.",
    style3_text_en: "A little more drama, please. Here we draw inspiration from magazines and fashion photography. The look is more contrasted, bolder and deliberately plays with light and shadow.",
    styles_note_de: "Wir stimmen den finalen Look gemeinsam ab. Licht und Wetter machen 90% der Bildstimmung aus \u2013 wir veredeln die echte Atmosph\u00E4re, statt die Realit\u00E4t zu verbiegen.",
    styles_note_en: "We decide on the final look together. Light and weather make up 90% of the mood \u2013 we enhance the real atmosphere instead of bending reality.",
    styles_cta_de: "Unverbindlich anfragen",
    styles_cta_en: "Inquire now",
    // 6. Packages
    packages_title_de: "Meine Pakete",
    packages_title_en: "My Packages",
    packages_photo_tab_de: "Meine Foto-Pakete",
    packages_photo_tab_en: "My Photo Packages",
    packages_video_tab_de: "Meine Video-Pakete",
    packages_video_tab_en: "My Video Packages",
    travel_note_de: "Innerhalb 20 km Umkreis fallen keine Kosten an. Ab 20 km um Innsbruck berechne ich f\u00FCr die Anfahrt 60ct/Kilometer.",
    travel_note_en: "Within 20 km radius there are no travel costs. Beyond 20 km from Innsbruck I charge 60ct/kilometer for travel.",
    travel_note_video_de: "F\u00FCr Anfahrten berechne ich 60ct/Kilometer. Ich berechne die Kilometer ab Innsbruck. Innerhalb und bis 100km Umkreis fallen keine Kosten an.",
    travel_note_video_en: "For travel I charge 60ct/kilometer. I calculate kilometers from Innsbruck. Within 100km radius there are no travel costs.",
    addons_pretitle_de: "ADD-ONS & EXTRAS",
    addons_pretitle_en: "ADD-ONS & EXTRAS",
    addons_title_de: "zum dazu buchen",
    addons_title_en: "available add-ons",
    book_now_de: "Jetzt buchen!",
    book_now_en: "Book now!",
    // 7. Timeline
    timeline_pretitle_de: "BEISPIEL",
    timeline_pretitle_en: "EXAMPLE",
    timeline_title_de: "So kann euer Tag aussehen",
    timeline_title_en: "What your day could look like",
    timeline_intro_de: "Dieser Ablauf ist ein Orientierungspunkt. Euer Tag ist individuell \u2013 wir passen die Timeline an euer Timing, eure Location und eure W\u00FCnsche an.",
    timeline_intro_en: "This schedule is a guideline. Your day is unique \u2013 we adapt the timeline to your timing, your venue and your wishes.",
    // 8. Gallery
    gallery_title: "GET INSPIRED",
    load_more_de: "Mehr anzeigen",
    load_more_en: "Load more",
    // 9. Testimonials
    testimonials_title_de: "Das sagen meine Paare",
    testimonials_title_en: "What my couples say",
    // 10. Booking Process
    process_pretitle_de: "PROZESS",
    process_pretitle_en: "PROCESS",
    process_title_de: "So geht\u2019s los",
    process_title_en: "How it works",
    process1_icon: "message-circle",
    process1_title_de: "Anfrage",
    process1_title_en: "Inquiry",
    process1_text_de: "F\u00FCllt das Kontaktformular aus und erz\u00E4hlt mir von euch. Je mehr Infos, desto besser kann ich euch eine erste Kosteneinsch\u00E4tzung geben.",
    process1_text_en: "Fill out the contact form and tell me about yourselves. The more info, the better I can give you an initial estimate.",
    process2_icon: "smartphone",
    process2_title_de: "Vibe Check",
    process2_title_en: "Vibe Check",
    process2_text_de: "Wir machen einen Video- oder Telefonanruf und lernen uns besser kennen. Wir sehen, ob die Chemie stimmt \u2013 denn das ist am Ende das Wichtigste.",
    process2_text_en: "We do a video or phone call and get to know each other. We'll see if the chemistry is right \u2013 because that's what matters most.",
    process3_icon: "file-text",
    process3_title_de: "Buchung & Vertrag",
    process3_title_en: "Booking & Contract",
    process3_text_de: "Wenn alles passt, bekommt ihr einen Vertrag. 25% Anzahlung sichert euren Termin. Der Restbetrag ist 2 Wochen nach der Hochzeit f\u00E4llig.",
    process3_text_en: "If everything fits, you'll get a contract. 25% deposit secures your date. The balance is due 2 weeks after the wedding.",
    process4_icon: "calendar-check",
    process4_title_de: "Catch-Up",
    process4_title_en: "Catch-Up",
    process4_text_de: "4\u20136 Wochen vor der Hochzeit setzen wir uns zusammen und gehen den Ablaufplan durch. Der perfekte Moment f\u00FCr besondere W\u00FCnsche.",
    process4_text_en: "4\u20136 weeks before the wedding we sit down and go through the schedule. The perfect moment for special requests.",
    process5_icon: "camera",
    process5_title_de: "Euer gro\u00DFer Tag",
    process5_title_en: "Your Big Day",
    process5_text_de: "Euer Tag ist da! Ich begleite eure Hochzeit so lange wie besprochen und fange all die wundersch\u00F6nen Momente f\u00FCr immer ein.",
    process5_text_en: "Your day is here! I'll accompany your wedding as long as discussed and capture all those beautiful moments forever.",
    process6_icon: "gift",
    process6_title_de: "Bild\u00FCbergabe",
    process6_title_en: "Image Delivery",
    process6_text_de: "Nach 72h bekommt ihr die ersten Sneak Peeks. Die vollst\u00E4ndige Galerie folgt innerhalb von 6\u20138 Wochen \u2013 handbearbeitet in eurem gew\u00E4hlten Stil.",
    process6_text_en: "After 72h you get the first sneak peeks. The complete gallery follows within 6\u20138 weeks \u2013 hand-edited in your chosen style.",
    // 11. Wedding Guide
    guide_pretitle_de: "Kostenloser Download",
    guide_pretitle_en: "Free Download",
    guide_title: "Wedding Guide",
    guide_season_de: "Saison 2026/27",
    guide_season_en: "Season 2026/27",
    guide_text_de: "Alle Infos zu meinen Paketen, meinem Stil und wertvolle Tipps f\u00FCr eure Hochzeitsplanung \u2013 kompakt zusammengefasst.",
    guide_text_en: "All the info about my packages, my style and valuable tips for your wedding planning \u2013 in one compact guide.",
    guide_pdf: "https://ik.imagekit.io/r2yqrg6np/WeddingGuide_MarioSchubert_Saison26_27_compressed.pdf?updatedAt=1773007904883",
    guide_button_de: "Guide herunterladen",
    guide_button_en: "Download Guide",
    guide_note_de: "Kostenlos & unverbindlich",
    guide_note_en: "Free & no strings attached",
    // 12. Final CTA
    cta_title_de: "Bereit f\u00FCr eure Geschichte?",
    cta_title_en: "Ready for your story?",
    cta_text_de: "Euer Tag, eure Geschichte \u2013 und ich freu mich riesig, sie erz\u00E4hlen zu d\u00FCrfen. Schreibt mir einfach, ganz unverbindlich. Wir quatschen kurz, und ihr merkt schnell, ob die Chemie stimmt.",
    cta_text_en: "Your day, your story \u2013 and I'm so excited to tell it. Just message me, no strings attached. We'll have a quick chat and you'll know right away if the chemistry is right.",
    cta_button_de: "Kontakt aufnehmen",
    cta_button_en: "Get in touch"
  }
},

// ── ANIMALS ──────────────────────────────────────────────────────
animals: {
  content_type: "page_animals",
  fields: {
    // 1. Hero
    hero_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_R52_1038_(WebRes).jpg?updatedAt=1773000802084",
    hero_title_de: "Tierfotografie",
    hero_title_en: "Animal Photography",
    hero_subtitle_de: "Pers\u00F6nlichkeit einfangen",
    hero_subtitle_en: "Capturing Personality",
    // 2. Intro
    intro_de: "Ob treuer Begleiter, majest\u00E4tisches Pferd oder verschmuster Stubentiger \u2013 jedes Tier hat seinen ganz eigenen Charakter, und genau den m\u00F6chte ich einfangen. Ich nehme mir die Zeit, die es braucht, damit sich euer Liebling wohlf\u00FChlt und ganz er selbst sein kann. Das Ergebnis: nat\u00FCrliche, emotionale Bilder, die euch noch Jahre sp\u00E4ter zum L\u00E4cheln bringen. Denn mal ehrlich \u2013 unsere Vierbeiner verdienen die besten Fotos der Welt.",
    intro_en: "Whether loyal companion, majestic horse or cuddly cat \u2013 every animal has its very own character, and that\u2019s exactly what I want to capture. I take all the time needed so your beloved pet feels comfortable and can be completely themselves. The result: natural, emotional images that will make you smile for years to come. Because let\u2019s be honest \u2013 our four-legged friends deserve the best photos in the world.",
    // 3. Categories
    dogs_title_de: "Hundefotografie",
    dogs_title_en: "Dog Photography",
    dogs_text_de: "Euer Hund ist nicht nur ein Haustier, sondern euer bester Freund, euer Seelenverwandter auf vier Pfoten? Dann verdient er Bilder, die genau das zeigen. Ob der treue Blick, das wilde Herumtollen im Wald oder das zufriedene D\u00F6sen auf der Couch \u2013 ich fange die kleinen und gro\u00DFen Momente ein, die euren Hund so besonders machen. Und ja: Leckerlis bringe ich selbst mit.",
    dogs_text_en: "Your dog isn\u2019t just a pet, but your best friend, your soulmate on four paws? Then they deserve photos that show exactly that. Whether it\u2019s the loyal gaze, the wild romping through the forest or the content snoozing on the couch \u2013 I capture the big and small moments that make your dog so special. And yes: I bring the treats myself.",
    dogs_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_Hundeshooting-3474_(WebRes).jpg?updatedAt=1772999916029",
    horses_title_de: "Pferdefotografie",
    horses_title_en: "Horse Photography",
    horses_text_de: "Die Verbindung zwischen Mensch und Pferd ist etwas ganz Besonderes \u2013 kraftvoll, elegant und voller Vertrauen. Ob auf der Koppel, beim Ausritt oder im goldenen Abendlicht: Ich halte diese einzigartigen Momente fest. Mit Geduld und Ruhe, damit sich auch euer Pferd vor der Kamera wohlf\u00FChlt. Die Bilder werden so ausdrucksstark wie die Tiere selbst.",
    horses_text_en: "The bond between human and horse is something truly special \u2013 powerful, elegant and full of trust. Whether in the paddock, on a ride or in the golden evening light: I capture these unique moments. With patience and calm, so your horse feels comfortable in front of the camera too. The images will be as expressive as the animals themselves.",
    horses_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/8D2A8472.jpg?updatedAt=1773000809216",
    other_title_de: "Katzen, Kleintiere & Co.",
    other_title_en: "Cats, Small Animals & More",
    other_text_de: "Katzen, Kaninchen, V\u00F6gel oder auch mal ein ganz besonderes Haustier \u2013 bei mir ist jedes Tier willkommen. Erz\u00E4hlt mir von eurem Liebling und seinen Eigenheiten, und wir planen gemeinsam ein Shooting, das zu euch passt. Ob im Studio mit schickem Hintergrund oder drau\u00DFen in der Natur \u2013 Hauptsache, euer Tier f\u00FChlt sich wohl und die Bilder werden einzigartig.",
    other_text_en: "Cats, rabbits, birds or even a very special pet \u2013 every animal is welcome. Tell me about your pet and their quirks, and we'll plan a shoot together that suits you. Whether in the studio with a stylish backdrop or outdoors in nature \u2013 the main thing is your pet feels comfortable and the photos are unique.",
    cats_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_Hundeshooting-4431_(WebRes).jpg?updatedAt=1772999913745",
    // 4. Packages
    packages_title_de: "Meine Pakete",
    packages_title_en: "My Packages",
    studio_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_Hundeshooting-3474_(WebRes).jpg?updatedAt=1772999916029",
    outdoor_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_R52_1038_(WebRes).jpg?updatedAt=1773000802084",
    // 5. Mid CTA
    midcta_text_de: "Bereit f\u00FCr unvergessliche Bilder von eurem Vierbeiner? Schreibt mir \u2013 ich freue mich auf euch!",
    midcta_text_en: "Ready for unforgettable photos of your furry friend? Drop me a message \u2013 I look forward to hearing from you!",
    midcta_button_de: "Shooting anfragen",
    midcta_button_en: "Inquire now",
    // 6. Gallery
    gallery_title: "GET INSPIRED",
    // 7. Tips
    tips_pretitle_de: "TIPPS",
    tips_pretitle_en: "TIPS",
    tips_title_de: "So bereitet ihr euch vor",
    tips_title_en: "How to prepare",
    tip1_icon: "heart",
    tip1_title_de: "Geduld mitbringen",
    tip1_title_en: "Be patient",
    tip1_text_de: "Tiere brauchen Zeit, um sich wohlzuf\u00FChlen. Plant genug Puffer ein \u2013 Stress ist der gr\u00F6\u00DFte Feind guter Bilder.",
    tip1_text_en: "Animals need time to feel comfortable. Plan enough buffer \u2013 stress is the enemy of great photos.",
    tip2_icon: "leaf",
    tip2_title_de: "Lieblingsort w\u00E4hlen",
    tip2_title_en: "Choose favorite spot",
    tip2_text_de: "Wo f\u00FChlt sich euer Tier am wohlsten? Der Lieblingspark, der Wald oder euer Garten \u2013 das merkt man an den Bildern.",
    tip2_text_en: "Where does your pet feel most at home? The favorite park, forest or your garden \u2013 it shows in the photos.",
    tip3_icon: "sun",
    tip3_title_de: "Goldene Stunde",
    tip3_title_en: "Golden hour",
    tip3_text_de: "Das beste Licht gibt es morgens oder abends. Ich empfehle Shootings 1\u20132 Stunden vor Sonnenuntergang.",
    tip3_text_en: "The best light is in the morning or evening. I recommend shoots 1\u20132 hours before sunset.",
    tip4_icon: "camera",
    tip4_title_de: "Leckerlis nicht vergessen",
    tip4_title_en: "Don't forget treats",
    tip4_text_de: "Kleine Belohnungen sorgen f\u00FCr Aufmerksamkeit und gl\u00FCckliche Gesichter \u2013 euer Tier wird es lieben.",
    tip4_text_en: "Small rewards ensure attention and happy faces \u2013 your pet will love it.",
    // 8. Final CTA
    cta_title_de: "Shooting f\u00FCr euren Liebling?",
    cta_title_en: "Shoot for your beloved pet?",
    cta_text_de: "Meldet euch einfach bei mir \u2013 erz\u00E4hlt mir von eurem Tier, und wir finden zusammen den perfekten Rahmen f\u00FCr euer Shooting. Ich freu mich auf eure Fellnasen, Samtpfoten und Huftiere!",
    cta_text_en: "Just reach out \u2013 tell me about your pet and we'll find the perfect setup for your shoot together. I look forward to your furry, feathery and hoofed friends!",
    cta_button_de: "Anfrage senden",
    cta_button_en: "Send inquiry"
  }
},

// ── PORTRAIT ─────────────────────────────────────────────────────
portrait: {
  content_type: "page_portrait",
  fields: {
    // 1. Hero
    hero_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_Hundeshooting-4431_(WebRes).jpg?updatedAt=1772999913745",
    hero_title_de: "Portrait & Mehr",
    hero_title_en: "Portrait & More",
    hero_subtitle_de: "Authentische Momente",
    hero_subtitle_en: "Authentic Moments",
    // 2. Intro
    intro_de: "Das Leben steckt voller besonderer Momente \u2013 und die meisten davon passieren nicht vor einem perfekt inszenierten Hintergrund, sondern mittendrin im echten Leben. Genau dort bin ich am liebsten. Ob ihr als Paar ein paar gemeinsame Stunden genie\u00DFen wollt, eure Familie festhalten m\u00F6chtet oder einen besonderen Anlass feiert: Ich bin dabei und sorge daf\u00FCr, dass ihr euch vor der Kamera wohlf\u00FChlt. Nat\u00FCrlich, entspannt und mit Bildern, die eure Geschichte erz\u00E4hlen.",
    intro_en: "Life is full of special moments \u2013 and most of them don't happen in front of a perfectly staged backdrop, but right in the middle of real life. That\u2019s exactly where I love to be. Whether you want to enjoy some time together as a couple, capture your family or celebrate a special occasion: I'm there and make sure you feel comfortable in front of the camera. Natural, relaxed and with images that tell your story.",
    // 3. Categories
    couple_title_de: "Couple Shooting",
    couple_title_en: "Couple Shooting",
    couple_text_de: "Ob frisch verliebt, frisch verlobt oder seit 20 Jahren ein Team \u2013 ein Paarshooting ist eure Zeit. Kein steifes Posieren, sondern gemeinsam lachen, spazieren, einfach ihr sein. Ich gebe euch sanfte Anweisungen, aber die sch\u00F6nsten Momente passieren von ganz allein. Ob in den Bergen bei Sonnenuntergang, in der Altstadt oder an eurem Lieblingsplatz \u2013 wir finden die perfekte Location f\u00FCr eure Geschichte.",
    couple_text_en: "Whether freshly in love, newly engaged or a team for 20 years \u2013 a couple shoot is your time. No stiff posing, just laughing together, walking, simply being yourselves. I give gentle directions, but the best moments happen all on their own. Whether in the mountains at sunset, in the old town or at your favorite spot \u2013 we'll find the perfect location for your story.",
    couple_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Getting%20Ready/20251004_8D2A0221_(WebRes).jpg?updatedAt=1773002917508",
    family_title_de: "Familie & Taufe",
    family_title_en: "Family & Baptism",
    family_text_de: "Kinder werden so schnell gro\u00DF, und die kleinen Momente verfliegen im Alltag. Ein Familienshooting ist eure Chance, innezuhalten und festzuhalten, was wirklich z\u00E4hlt: das Lachen, die Umarmungen, das Chaos \u2013 und die Liebe, die alles zusammenh\u00E4lt. Auch bei Taufen bin ich gerne dabei und dokumentiere diesen besonderen Tag diskret und einf\u00FChlsam.",
    family_text_en: "Kids grow up so fast, and the little moments fly by in everyday life. A family shoot is your chance to pause and capture what truly matters: the laughter, the hugs, the chaos \u2013 and the love that holds it all together. I'm also happy to be there for baptisms, documenting this special day discreetly and sensitively.",
    family_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_153525_0450(LowRes).jpg?updatedAt=1773007047995",
    private_title_de: "Private Anl\u00E4sse",
    private_title_en: "Private Occasions",
    private_text_de: "Ob Geburtstag, Jubil\u00E4um, Firmenevent oder einfach ein Tag, der gefeiert werden soll \u2013 erz\u00E4hlt mir, was ihr vorhabt, und ich k\u00FCmmere mich um die Bilder. Ich passe mich eurem Event an, bleibe unauff\u00E4llig und halte die Momente fest, die den Tag besonders machen. Keine steifen Gruppenfotos, sondern echte Erinnerungen.",
    private_text_en: "Whether birthday, anniversary, corporate event or simply a day worth celebrating \u2013 tell me what you're planning and I'll take care of the photos. I adapt to your event, stay unobtrusive and capture the moments that make the day special. No stiff group photos, just real memories.",
    baptism_image: "https://ik.imagekit.io/r2yqrg6np/Other/7561IG.jpg?updatedAt=1773014105229",
    // 4. Pricing
    pricing_pretitle_de: "INDIVIDUELL & PERS\u00D6NLICH",
    pricing_pretitle_en: "INDIVIDUAL & PERSONAL",
    pricing_title_de: "Jedes Shooting ist einzigartig",
    pricing_title_en: "Every shoot is unique",
    pricing_text_de: "Ob Couple Shooting, Familienportrait, Taufe oder ein ganz besonderer Anlass \u2013 ich schn\u00FCre f\u00FCr jedes Shooting ein individuelles Angebot, das perfekt zu euch passt. Keine starren Pakete, sondern genau das, was ihr braucht.",
    pricing_text_en: "Whether it's a couple shoot, family portrait, baptism or a special occasion \u2013 I create a custom offer for every shoot that's perfectly tailored to you. No rigid packages, just exactly what you need.",
    pricing_note_de: "Schreibt mir einfach \u2013 ich melde mich innerhalb von 24 Stunden mit einem unverbindlichen Angebot bei euch.",
    pricing_note_en: "Just send me a message \u2013 I'll get back to you within 24 hours with a non-binding offer.",
    pricing_cta_de: "Unverbindlich anfragen",
    pricing_cta_en: "Inquire now",
    // 5. Occasions
    occasions_title_de: "Perfekt f\u00FCr jeden Anlass",
    occasions_title_en: "Perfect for every occasion",
    occasion1_icon: "heart",
    occasion1_title_de: "Couple Shootings",
    occasion1_title_en: "Couple Shoots",
    occasion1_text_de: "Verlobung, Jahrestag oder einfach so",
    occasion1_text_en: "Engagement, anniversary or just because",
    occasion2_icon: "users",
    occasion2_title_de: "Familienshootings",
    occasion2_title_en: "Family Shoots",
    occasion2_text_de: "Mit Kindern, Gro\u00DFeltern oder der ganzen Bande",
    occasion2_text_en: "With kids, grandparents or the whole gang",
    occasion3_icon: "baby",
    occasion3_title_de: "Taufe & Baby",
    occasion3_title_en: "Baptism & Baby",
    occasion3_text_de: "Die ersten Monate festhalten",
    occasion3_text_en: "Capture the first months",
    occasion4_icon: "party-popper",
    occasion4_title_de: "Events & Feiern",
    occasion4_title_en: "Events & Parties",
    occasion4_text_de: "Geburtstage, Jubil\u00E4en, Firmenfeiern",
    occasion4_text_en: "Birthdays, anniversaries, corporate events",
    // 6. Gallery
    gallery_title: "GET INSPIRED",
    // 7. Final CTA
    cta_title_de: "Euer Moment, eure Bilder",
    cta_title_en: "Your moment, your images",
    cta_text_de: "Egal ob Paar, Familie oder besonderer Anlass \u2013 schreibt mir einfach, was ihr euch vorstellt. Wir quatschen kurz und planen gemeinsam etwas, das sich f\u00FCr euch richtig anf\u00FChlt.",
    cta_text_en: "Whether couple, family or special occasion \u2013 just tell me what you have in mind. We'll have a quick chat and plan something together that feels right for you.",
    cta_button_de: "Jetzt anfragen",
    cta_button_en: "Inquire now"
  }
},

// ── ABOUT ────────────────────────────────────────────────────────
about: {
  content_type: "page_about",
  fields: {
    // 1. Header
    hero_video: "https://ik.imagekit.io/r2yqrg6np/Madeira%20Clip%20fu%CC%88r%20Webseite.mp4?updatedAt=1773024774420",
    portrait_image: "https://ik.imagekit.io/r2yqrg6np/68e54c497a9dde9d00252dcb_WhatsApp%20Image%202025-09-16%20at%2022.32.17.avif",
    mario_action_image: "https://ik.imagekit.io/r2yqrg6np/6966a461e78df6320fd2fd1e_20251019_Hundeshooting-3528_(WebRes).jpg",
    about_title_de: "\u00DCber mich",
    about_title_en: "About me",
    heading_de: "Ich bin Mario",
    heading_en: "I'm Mario",
    // 2. Bio
    text1_de: "Geboren in Bayern, in Innsbruck h\u00E4ngen geblieben. Mit 15 habe ich meine erste Kamera in der Hand gehabt und bin seitdem nicht mehr davon losgekommen. Aus dem Hobby wurde Leidenschaft, aus der Leidenschaft mein Beruf.",
    text1_en: "Born in Bavaria, settled in Innsbruck. At 15, I held my first camera and never looked back. What started as a hobby became passion, and passion became my profession.",
    text2_de: "Heute begleite ich Hochzeiten so, wie sie sind: echt, ungestellt, voller Gef\u00FChl. Ich mische mich unter die G\u00E4ste, bleibe unauff\u00E4llig und fange die Momente ein, die man nicht inszenieren kann. In der Bearbeitung bekommen eure Bilder einen Hauch Editorial, cineastisch und zeitlos \u2013 Erinnerungen, die euch f\u00FCr immer bleiben.",
    text2_en: "Today I accompany weddings as they are: real, unposed, full of feeling. I mingle with the guests, stay unobtrusive and capture the moments that cannot be staged. In editing, your images get a touch of editorial, cinematic and timeless \u2013 memories that stay with you forever.",
    text3_de: "Neben Hochzeiten fotografiere ich auch Tiere, Paare, Familien und andere besondere Anl\u00E4sse. Was alle meine Arbeiten verbindet: Authentizit\u00E4t und Emotion.",
    text3_en: "Besides weddings, I also photograph animals, couples, families and other special occasions. What connects all my work: authenticity and emotion.",
    // 3. Philosophy
    philosophy_title_de: "Meine Arbeitsweise",
    philosophy_title_en: "My Approach",
    philosophy1_de: "Echt & Ungestellt",
    philosophy1_en: "Real & Unposed",
    philosophy1_text_de: "Keine gestellten Posen \u2013 ich fange ein, was wirklich passiert.",
    philosophy1_text_en: "No staged poses \u2013 I capture what really happens.",
    philosophy2_de: "Cineastisch & Editorial",
    philosophy2_en: "Cinematic & Editorial",
    philosophy2_text_de: "Meine Bearbeitung gibt euren Bildern einen filmischen, zeitlosen Look.",
    philosophy2_text_en: "My editing gives your images a filmic, timeless look.",
    philosophy3_de: "Pers\u00F6nlich & Nahbar",
    philosophy3_en: "Personal & Approachable",
    philosophy3_text_de: "Ich nehme mir Zeit f\u00FCr euch, lerne euch kennen und begleite euren Tag wie ein Freund.",
    philosophy3_text_en: "I take time for you, get to know you and accompany your day like a friend.",
    // 4. What to expect
    expect_title_de: "Das erwartet Euch",
    expect_title_en: "What to expect",
    // 5. Tagline
    tagline_de: "nat\u00FCrlich. zeitlos. authentisch.",
    tagline_en: "natural. timeless. authentic.",
    tagline_bold_de: "FOTOGRAFIE",
    tagline_bold_en: "PHOTOGRAPHY",
    tagline_desc_de: "Bei der dokumentarischen Begleitung sind Posen und gestellte Aufnahmen ein absolutes No-Go. Mein Fokus liegt darauf, die echten Emotionen und nat\u00FCrlichen Momente festzuhalten.",
    tagline_desc_en: "In documentary coverage, poses and staged shots are an absolute no-go. My focus is on capturing real emotions and natural moments.",
    // 6. Stats
    stats_title_de: "In Zahlen",
    stats_title_en: "By the numbers",
    stat1_num: "76+",
    stat1_label_de: "Hochzeiten begleitet",
    stat1_label_en: "Weddings captured",
    stat2_num: "420+",
    stat2_label_de: "Zufriedene Kunden",
    stat2_label_en: "Happy clients",
    stat3_num: "11+",
    stat3_label_de: "Jahre Erfahrung",
    stat3_label_en: "Years of experience",
    stat4_num: "140+",
    stat4_label_de: "Videos produziert",
    stat4_label_en: "Videos produced",
    // 7. Passion
    passion_pretitle_de: "LEIDENSCHAFT",
    passion_pretitle_en: "PASSION",
    passion_title_de: "Mehr als nur Hochzeiten",
    passion_title_en: "More than just weddings",
    passion_text1_de: "Neben Hochzeiten ist die Tierfotografie meine zweite gro\u00DFe Leidenschaft. Ob im Studio oder in freier Natur \u2013 ich bringe die Pers\u00F6nlichkeit eures Vierbeiners in Bildern zum Ausdruck, die euch ein Leben lang begleiten.",
    passion_text1_en: "Besides weddings, animal photography is my second great passion. Whether in the studio or in the wild \u2013 I bring out the personality of your four-legged friend in images that will accompany you for a lifetime.",
    passion_text2_de: "Was mich antreibt? Die Freude in den Augen meiner Kunden, wenn sie ihre Bilder zum ersten Mal sehen. Jedes Shooting ist f\u00FCr mich eine neue Geschichte, die darauf wartet, erz\u00E4hlt zu werden.",
    passion_text2_en: "What drives me? The joy in my clients' eyes when they see their photos for the first time. Every shoot is a new story waiting to be told.",
    passion_cta_de: "Tierfotos entdecken",
    passion_cta_en: "Discover animal photos",
    // 8. Testimonials
    testimonials_title_de: "Was meine Kunden sagen",
    testimonials_title_en: "What my clients say",
    // 9. Contact
    contact_pretitle_de: "KONTAKT",
    contact_pretitle_en: "CONTACT",
    contact_title_de: "Lass uns reden!",
    contact_title_en: "Let's talk!",
    contact_text_de: "Zusammen erstellen wir unvergessliche Erinnerungen f\u00FCr euch.",
    contact_text_en: "Together we'll create unforgettable memories for you.",
    contact_cta_de: "Unverbindlich anfragen",
    contact_cta_en: "Get in touch \u2013 no strings attached",
    contact_or_de: "Oder direkt erreichen:",
    contact_or_en: "Or reach me directly:",
    // 10. Final CTA
    cta_pretitle_de: "BEREIT?",
    cta_pretitle_en: "READY?",
    cta_title_de: "Eure Geschichte wartet darauf, erz\u00E4hlt zu werden.",
    cta_title_en: "Your story is waiting to be told.",
    cta_text_de: "Schreibt mir \u2013 die Erstberatung ist kostenlos und unverbindlich.",
    cta_text_en: "Write to me \u2013 the initial consultation is free and non-binding.",
    cta_button_de: "Jetzt Kontakt aufnehmen",
    cta_button_en: "Get in touch now"
  }
}

  }; // end return
} // end getAllSeedData


// ── SEED ONE PAGE ────────────────────────────────────────────────
function seedPage(pageKey, config) {
  var slug = "pages/" + pageKey;
  Logger.log("\n" + "=".repeat(50));
  Logger.log("SEED CONTENT: " + slug);
  Logger.log("=".repeat(50));

  var existing = findStory(slug);
  if (!existing) {
    Logger.log("  FEHLER: Story '" + slug + "' nicht gefunden!");
    Logger.log("  Erstelle sie zuerst: Content > pages > + Entry > '" + pageKey + "' > Content Type: " + config.content_type);
    return false;
  }

  // Komplett neuen Content aufbauen (FORCE OVERWRITE)
  var newContent = { component: config.content_type };
  var fk = Object.keys(config.fields);
  for (var j = 0; j < fk.length; j++) {
    newContent[fk[j]] = config.fields[fk[j]];
  }

  Logger.log("  Story ID: " + existing.id + ", Felder: " + fk.length);

  try {
    sbApi("PUT", "/stories/" + existing.id, {
      story: { name: existing.name, slug: existing.slug, content: newContent },
      publish: 1
    });
    Logger.log("  ERFOLG! " + fk.length + " Felder geschrieben und published.");
    return true;
  } catch (e) {
    Logger.log("  FEHLER: " + e.message);
    return false;
  }
}

function seedAllContent() {
  Logger.log("\n########################################");
  Logger.log("  STEP 2: ALLE INHALTE BEFUELLEN");
  Logger.log("########################################\n");

  var data = getAllSeedData();
  var pages = Object.keys(data);
  var ok = 0;

  for (var i = 0; i < pages.length; i++) {
    if (seedPage(pages[i], data[pages[i]])) ok++;
    if (i < pages.length - 1) Utilities.sleep(1000);
  }

  Logger.log("\n  Content-Seed: " + ok + "/" + pages.length + " erfolgreich");
  return ok;
}


// ================================================================
//  MAIN FUNCTION – RUNS EVERYTHING
// ================================================================

function runAll() {
  if (MGMT_TOKEN === "DEIN_MANAGEMENT_TOKEN_HIER") {
    Logger.log("FEHLER: Bitte trage deinen Management Token oben ein!");
    Logger.log("Storyblok > Settings > Access Tokens > Generate (Scope: All)");
    return;
  }

  Logger.log("╔══════════════════════════════════════════╗");
  Logger.log("║  STORYBLOK FULL RESET + SEED             ║");
  Logger.log("║  Space: " + SPACE_ID + "              ║");
  Logger.log("╚══════════════════════════════════════════╝\n");

  // Step 1: Reset all schemas
  var schemaOk = resetAllSchemas();
  Logger.log("\n--- Pause 3s zwischen Schema-Reset und Content-Seed ---");
  Utilities.sleep(3000);

  // Step 2: Seed all content
  var contentOk = seedAllContent();

  // Summary
  Logger.log("\n╔══════════════════════════════════════════╗");
  Logger.log("║  FERTIG!                                 ║");
  Logger.log("║  Schemas: " + schemaOk + "/5 OK                        ║");
  Logger.log("║  Content: " + contentOk + "/5 OK                        ║");
  Logger.log("╚══════════════════════════════════════════╝");
  Logger.log("");
  Logger.log("Felder pro Page (in korrekter Editor-Reihenfolge):");
  Logger.log("  page_home:     " + getHomeSchema().length + " Felder");
  Logger.log("  page_weddings: " + getWeddingsSchema().length + " Felder");
  Logger.log("  page_animals:  " + getAnimalsSchema().length + " Felder");
  Logger.log("  page_portrait: " + getPortraitSchema().length + " Felder");
  Logger.log("  page_about:    " + getAboutSchema().length + " Felder");
  Logger.log("");
  Logger.log("Naechste Schritte:");
  Logger.log("1. Storyblok oeffnen > Content Types pruefen (Felder-Reihenfolge)");
  Logger.log("2. Pages oeffnen > Inhalte pruefen");
  Logger.log("3. Browser-Cache leeren + Website testen");
}
