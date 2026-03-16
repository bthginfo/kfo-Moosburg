/**
 * ================================================================
 * Storyblok New Fields Seeder - Google Apps Script
 * ================================================================
 * Populates ALL new fields (added by update-storyblok-schemas.gs)
 * with the correct default/fallback values.
 *
 * USAGE:
 * 1. FIRST run update-storyblok-schemas.gs > updateAllSchemas()
 * 2. Then come here, paste this file in the SAME project
 * 3. Select function "seedAllNewFields" and click Run
 *
 * Mode: FILL EMPTY FIELDS ONLY (won't overwrite existing values)
 * ================================================================
 */

// -- CONFIGURATION ------------------------------------------------
var MGMT_TOKEN = "DEIN_MANAGEMENT_TOKEN_HIER";  // <-- HIER EINTRAGEN!
var SPACE_ID   = "291045863485848";
var API_BASE   = "https://mapi.storyblok.com/v1/spaces/" + SPACE_ID;

// -- API HELPER (same as seed script) -----------------------------
function sbApi(method, path, payload) {
  var url = API_BASE + path;
  var options = {
    method: method,
    headers: {
      "Authorization": MGMT_TOKEN,
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };
  if (payload) options.payload = JSON.stringify(payload);

  for (var attempt = 0; attempt < 5; attempt++) {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();
    if (code === 429) {
      var wait = Math.pow(2, attempt) * 1000;
      Logger.log("  Rate limited, waiting " + wait + "ms...");
      Utilities.sleep(wait);
      continue;
    }
    if (code >= 400) {
      throw new Error("API " + method + " " + path + " -> " + code + ": " + response.getContentText());
    }
    return JSON.parse(response.getContentText());
  }
  throw new Error("Too many retries for " + method + " " + path);
}

function findStory(slug) {
  try {
    var data = sbApi("GET", "/stories?with_slug=" + encodeURIComponent(slug));
    if (data.stories && data.stories.length > 0) return data.stories[0];
    return null;
  } catch (e) {
    Logger.log("  Error finding story: " + e.message);
    return null;
  }
}

// -- NEW SEED DATA ------------------------------------------------

function getNewSeedData() {
  return {

    // =========================================================
    // WEDDINGS - all new fields
    // =========================================================
    weddings: {
      content_type: "page_weddings",
      fields: {
        // Shot List
        shotlist_pretitle_de: "Meine Aufnahmeliste",
        shotlist_pretitle_en: "My Shot List",
        shotlist_title_de: "Was ich an eurem Tag festhalte",
        shotlist_title_en: "What I capture on your day",
        shotlist_note_de: "Nat\u00FCrlich ist jede Hochzeit anders \u2013 wir stimmen den Ablauf vorher gemeinsam ab, damit ich genau die Momente einfange, die euch wichtig sind.",
        shotlist_note_en: "Of course every wedding is different \u2013 we coordinate the schedule together beforehand so I capture exactly the moments that matter to you.",

        // Photography Styles
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

        // Package tabs & notes
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

        // Timeline
        timeline_pretitle_de: "BEISPIEL",
        timeline_pretitle_en: "EXAMPLE",
        timeline_title_de: "So kann euer Tag aussehen",
        timeline_title_en: "What your day could look like",
        timeline_intro_de: "Dieser Ablauf ist ein Orientierungspunkt. Euer Tag ist individuell \u2013 wir passen die Timeline an euer Timing, eure Location und eure W\u00FCnsche an.",
        timeline_intro_en: "This schedule is a guideline. Your day is unique \u2013 we adapt the timeline to your timing, your venue and your wishes.",

        // Gallery
        gallery_title: "GET INSPIRED",
        load_more_de: "Mehr anzeigen",
        load_more_en: "Load more",

        // Testimonials
        testimonials_title_de: "Das sagen meine Paare",
        testimonials_title_en: "What my couples say",

        // Booking Process
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

        // Wedding Guide
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
      }
    },

    // =========================================================
    // ANIMALS - all new fields
    // =========================================================
    animals: {
      content_type: "page_animals",
      fields: {
        packages_title_de: "Meine Pakete",
        packages_title_en: "My Packages",
        midcta_text_de: "Bereit f\u00FCr unvergessliche Bilder von eurem Vierbeiner? Schreibt mir \u2013 ich freue mich auf euch!",
        midcta_text_en: "Ready for unforgettable photos of your furry friend? Drop me a message \u2013 I look forward to hearing from you!",
        midcta_button_de: "Shooting anfragen",
        midcta_button_en: "Inquire now",
        gallery_title: "GET INSPIRED",
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
      }
    },

    // =========================================================
    // PORTRAIT - all new fields
    // =========================================================
    portrait: {
      content_type: "page_portrait",
      fields: {
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

        gallery_title: "GET INSPIRED",
      }
    },

    // =========================================================
    // ABOUT - all new fields
    // =========================================================
    about: {
      content_type: "page_about",
      fields: {
        expect_title_de: "Das erwartet Euch",
        expect_title_en: "What to expect",

        tagline_de: "nat\u00FCrlich. zeitlos. authentisch.",
        tagline_en: "natural. timeless. authentic.",
        tagline_bold_de: "FOTOGRAFIE",
        tagline_bold_en: "PHOTOGRAPHY",
        tagline_desc_de: "Bei der dokumentarischen Begleitung sind Posen und gestellte Aufnahmen ein absolutes No-Go. Mein Fokus liegt darauf, die echten Emotionen und nat\u00FCrlichen Momente festzuhalten.",
        tagline_desc_en: "In documentary coverage, poses and staged shots are an absolute no-go. My focus is on capturing real emotions and natural moments.",

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

        testimonials_title_de: "Was meine Kunden sagen",
        testimonials_title_en: "What my clients say",

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

        cta_pretitle_de: "BEREIT?",
        cta_pretitle_en: "READY?",
        cta_title_de: "Eure Geschichte wartet darauf, erz\u00E4hlt zu werden.",
        cta_title_en: "Your story is waiting to be told.",
        cta_text_de: "Schreibt mir \u2013 die Erstberatung ist kostenlos und unverbindlich.",
        cta_text_en: "Write to me \u2013 the initial consultation is free and non-binding.",
        cta_button_de: "Jetzt Kontakt aufnehmen",
        cta_button_en: "Get in touch now",
      }
    }
  };
}

// -- SEED ONE PAGE ------------------------------------------------
function seedPageNewFields(pageKey, config) {
  var slug = "pages/" + pageKey;
  Logger.log("\n" + "=".repeat(50));
  Logger.log("Seeding new fields: " + slug);
  Logger.log("=".repeat(50));

  var existing = findStory(slug);
  if (!existing) {
    Logger.log("  ERROR: Story '" + slug + "' not found!");
    return false;
  }

  Logger.log("  Found story: id=" + existing.id);

  var currentContent = existing.content || {};
  var mergedContent = {};

  // Copy all existing fields
  var existingKeys = Object.keys(currentContent);
  for (var i = 0; i < existingKeys.length; i++) {
    mergedContent[existingKeys[i]] = currentContent[existingKeys[i]];
  }
  mergedContent.component = config.content_type;

  var updated = 0;
  var skipped = 0;
  var fieldKeys = Object.keys(config.fields);

  for (var j = 0; j < fieldKeys.length; j++) {
    var key = fieldKeys[j];
    var value = config.fields[key];
    var currentValue = currentContent[key];
    var isEmpty = !currentValue || (typeof currentValue === "string" && currentValue.trim() === "");

    if (isEmpty) {
      mergedContent[key] = value;
      updated++;
    } else {
      skipped++;
    }
  }

  Logger.log("  Fields: " + updated + " populated, " + skipped + " skipped (already filled)");

  if (updated === 0) {
    Logger.log("  SKIP: All fields already have values.");
    return true;
  }

  try {
    sbApi("PUT", "/stories/" + existing.id, {
      story: {
        name: existing.name,
        slug: existing.slug,
        content: mergedContent
      },
      publish: 1
    });
    Logger.log("  SUCCESS: " + updated + " new fields populated and published!");
    return true;
  } catch (e) {
    Logger.log("  FAILED: " + e.message);
    return false;
  }
}

// -- MAIN FUNCTION ------------------------------------------------
function seedAllNewFields() {
  if (MGMT_TOKEN === "DEIN_MANAGEMENT_TOKEN_HIER") {
    Logger.log("ERROR: Bitte trage deinen Management Token oben ein!");
    return;
  }

  Logger.log("Storyblok New Fields Seeder");
  Logger.log("Space: " + SPACE_ID);
  Logger.log("Mode: FILL EMPTY FIELDS ONLY");
  Logger.log("");

  var seedData = getNewSeedData();
  var pages = Object.keys(seedData);
  var success = 0;

  for (var i = 0; i < pages.length; i++) {
    var result = seedPageNewFields(pages[i], seedData[pages[i]]);
    if (result) success++;
    if (i < pages.length - 1) Utilities.sleep(500);
  }

  Logger.log("\n" + "=".repeat(50));
  Logger.log("DONE! " + success + "/" + pages.length + " pages seeded with new fields.");
  Logger.log("");
  Logger.log("Alles fertig! Deine Website sollte jetzt alle Felder aus Storyblok ziehen.");
  Logger.log("Tipp: Browser-Cache / localStorage leeren zum Testen.");
  Logger.log("=".repeat(50));
}
