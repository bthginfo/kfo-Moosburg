/**
 * ================================================================
 * Storyblok COMPLETE Seeder - ALL Fields, ALL Pages
 * ================================================================
 *
 * Dieses Script befuellt ALLE Felder aller 5 Pages auf einmal.
 * Alte + neue Felder, DE + EN, Bilder, Videos, Icons - alles.
 *
 * MODUS: FORCE OVERWRITE - ueberschreibt ALLE Felder!
 * (Wenn du nur leere Felder befuellen willst, setze
 *  FORCE_OVERWRITE = false)
 *
 * USAGE:
 * 1. script.google.com > Neues Projekt
 * 2. Diesen gesamten Code einfuegen
 * 3. MGMT_TOKEN eintragen
 * 4. Funktion "seedEverything" auswaehlen > Run
 * ================================================================
 */

var MGMT_TOKEN = "DEIN_MANAGEMENT_TOKEN_HIER";  // <-- HIER EINTRAGEN!
var SPACE_ID   = "291045863485848";
var API_BASE   = "https://mapi.storyblok.com/v1/spaces/" + SPACE_ID;
var FORCE_OVERWRITE = true;  // true = alle Felder ueberschreiben

// ── API ──────────────────────────────────────────────────────────
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
    if (code === 429) { Utilities.sleep(Math.pow(2, a) * 1000); continue; }
    if (code >= 400) throw new Error("API " + method + " " + path + " -> " + code + ": " + r.getContentText());
    return JSON.parse(r.getContentText());
  }
  throw new Error("Too many retries: " + method + " " + path);
}

function findStory(slug) {
  try {
    var d = sbApi("GET", "/stories?with_slug=" + encodeURIComponent(slug));
    return (d.stories && d.stories.length > 0) ? d.stories[0] : null;
  } catch (e) { Logger.log("  findStory error: " + e.message); return null; }
}

// ── COMPLETE SEED DATA ───────────────────────────────────────────

function getAllSeedData() {
  return {

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOME - 37 fields
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
home: {
  content_type: "page_home",
  fields: {
    // Assets
    hero_video: "https://ik.imagekit.io/r2yqrg6np/Wedding%20Clip%20fu%CC%88r%20Wesbeite_ProRes422_1080p.mp4?updatedAt=1773071703884",
    hero_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/E00A5635-2.jpg?updatedAt=1773007052923",
    wedding_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_151924_0405(LowRes).jpg?updatedAt=1773007048480",
    animals_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_R52_1038_(WebRes).jpg?updatedAt=1773000802084",
    portrait_image: "https://ik.imagekit.io/r2yqrg6np/Other/R52_0832.jpg?updatedAt=1773014105220",
    about_image: "https://ik.imagekit.io/r2yqrg6np/68e54c497a9dde9d00252dcb_WhatsApp%20Image%202025-09-16%20at%2022.32.17.avif",

    // Hero
    hero_subtitle_de: "Fotografie & Videografie",
    hero_subtitle_en: "Photography & Videography",
    hero_tagline_de: "Timeless photos. Unforgettable stories.",
    hero_tagline_en: "Timeless photos. Unforgettable stories.",
    hero_cta_de: "Jetzt anfragen",
    hero_cta_en: "Inquire now",

    // Services
    services_title_de: "Was ich anbiete",
    services_title_en: "What I offer",
    wedding_title_de: "Hochzeiten",
    wedding_title_en: "Weddings",
    wedding_desc_de: "Euer gro\u00DFer Tag verdient mehr als nur Fotos \u2013 er verdient Erinnerungen, die sich anf\u00FChlen. Ich begleite euch von den ersten aufgeregten Momenten beim Getting Ready bis zum letzten Tanz und halte alles fest, was dazwischen passiert: echte Emotionen, leise Gesten und pure Lebensfreude.",
    wedding_desc_en: "Your big day deserves more than just photos \u2013 it deserves memories that feel real. I accompany you from the first excited moments of getting ready to the last dance and capture everything in between: genuine emotions, quiet gestures and pure joy.",
    animals_title_de: "Tierfotografie",
    animals_title_en: "Animal Photography",
    animals_desc_de: "Ob treuer Hundeblick, die Eleganz eures Pferdes oder das verschmitzte Grinsen eurer Katze \u2013 eure Fellnase hat einen ganz eigenen Charakter, und genau den fange ich ein. Entspannt, geduldig und mit ganz viel Liebe zum Detail.",
    animals_desc_en: "Whether a loyal dog\u2019s gaze, the elegance of your horse or the mischievous grin of your cat \u2013 your pet has a unique character, and that\u2019s exactly what I capture. Relaxed, patient and with lots of attention to detail.",
    portrait_title_de: "Portrait & Mehr",
    portrait_title_en: "Portrait & More",
    portrait_desc_de: "Verliebte Blicke beim Couple Shooting, das Lachen eurer Kinder beim Familienfoto oder die Emotionen bei der Taufe \u2013 ich halte die Momente fest, die ihr nie vergessen wollt. Nat\u00FCrlich, ungezwungen und voller W\u00E4rme.",
    portrait_desc_en: "Loving glances during a couple shoot, your children\u2019s laughter in a family photo or the emotions at a baptism \u2013 I capture the moments you never want to forget. Natural, relaxed and full of warmth.",
    view_more_de: "Mehr erfahren",
    view_more_en: "Learn more",

    // How it works
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

    // About / Philosophy
    about_pretitle_de: "\u00DCber mich",
    about_pretitle_en: "About me",
    about_title_de: "Ich bin Mario",
    about_title_en: "I'm Mario",
    about_text_de: "Geboren in Bayern, in Innsbruck h\u00E4ngen geblieben. Mit 15 habe ich meine erste Kamera in der Hand gehabt und bin seitdem nicht mehr davon losgekommen. Aus dem Hobby wurde Leidenschaft, aus der Leidenschaft mein Beruf.",
    about_text_en: "Born in Bavaria, settled in Innsbruck. At 15, I held my first camera and never looked back. What started as a hobby became passion, and passion became my profession.",
    about_cta_de: "Mehr zu mir",
    about_cta_en: "More about me",
    philosophy_text_de: "Heute begleite ich Hochzeiten so, wie sie sind: echt, ungestellt, voller Gef\u00FChl. Ich mische mich unter die G\u00E4ste, bleibe unauff\u00E4llig und fange die Momente ein, die man nicht inszenieren kann. In der Bearbeitung bekommen eure Bilder einen Hauch Editorial, cineastisch und zeitlos \u2013 Erinnerungen, die euch f\u00FCr immer bleiben.",
    philosophy_text_en: "Today I accompany weddings as they are: real, unposed, full of feeling. I mingle with the guests, stay unobtrusive and capture the moments that cannot be staged. In editing, your images get a touch of editorial, cinematic and timeless \u2013 memories that stay with you forever.",

    // Gallery & CTA
    inspired_title_de: "GET INSPIRED",
    inspired_title_en: "GET INSPIRED",
    load_more_de: "Mehr anzeigen",
    load_more_en: "Load more",
    wyldworks_title_de: "Foto & Video f\u00FCr Unternehmen?",
    wyldworks_title_en: "Photo & video for businesses?",
    wyldworks_desc_de: "Employer Branding, Imagefilme, Events & Social Media Content \u2013 das l\u00E4uft \u00FCber meine Agentur.",
    wyldworks_desc_en: "Employer branding, image films, events & social media content \u2013 that\u2019s handled by my agency.",
    cta_title_de: "Lass uns reden!",
    cta_title_en: "Let's talk!",
    cta_text_de: "Ihr plant eure Hochzeit, w\u00FCnscht euch ein Shooting mit eurer Familie oder eurem Vierbeiner, oder habt einfach eine Idee im Kopf? Schreibt mir ganz unverbindlich \u2013 ich freu mich, eure Geschichte zu h\u00F6ren und gemeinsam etwas Sch\u00F6nes daraus zu machen.",
    cta_text_en: "Planning your wedding, want a shoot with your family or your furry friend, or just have an idea in mind? Drop me a message \u2013 no strings attached. I'd love to hear your story and create something beautiful together.",
    cta_button_de: "Kontakt aufnehmen",
    cta_button_en: "Get in touch"
  }
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WEDDINGS - 83 fields
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
weddings: {
  content_type: "page_weddings",
  fields: {
    // Assets
    hero_video: "https://ik.imagekit.io/r2yqrg6np/Lo%CC%88wenClip_fu%CC%88r_Webseite_compressed.mp4?updatedAt=1773077988312",
    hero_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_152738_0428(LowRes).jpg?updatedAt=1773007053353",
    photo1_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/5048_IG.jpg?updatedAt=1773007053682",
    photo2_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_151924_0405(LowRes).jpg?updatedAt=1773007048480",
    video_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/20251025_8D2A5136_(WebRes)-2.jpg?updatedAt=1773007047706",
    details_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_153606_0453(LowRes).jpg?updatedAt=1773007049638",
    guide_pdf: "https://ik.imagekit.io/r2yqrg6np/WeddingGuide_MarioSchubert_Saison26_27_compressed.pdf?updatedAt=1773007904883",

    // Hero
    hero_title_de: "Hochzeitsfotografie & Videografie",
    hero_title_en: "Wedding Photography & Videography",
    hero_subtitle_de: "Zeitlos & Authentisch",
    hero_subtitle_en: "Timeless & Authentic",

    // Photo Section
    photo_title_de: "WEDDING PHOTOGRAPHY",
    photo_title_en: "WEDDING PHOTOGRAPHY",
    photo_heading_de: "Zeitlos & Authentisch",
    photo_heading_en: "Timeless & Authentic",
    photo_text_de: "Egal ob ihr euch im kleinen Kreis das Ja-Wort gebt, in den Bergen ganz f\u00FCr euch allein heiratet oder mit all euren Lieblingsmenschen eine wilde Party feiert \u2013 ich halte eure Geschichte so fest, wie sie ist: ehrlich, ungezwungen und voller Leben. Kein gestelltes Posing, keine steifen Gruppenfotos. Stattdessen echte Emotionen, stille Momente und die pure Freude, die euren Tag so besonders macht. Mein Ziel: Wenn ihr eure Bilder anschaut, sollt ihr euch sofort zur\u00FCckerinnern, wie es sich angef\u00FChlt hat.",
    photo_text_en: "Whether you say 'I do' in an intimate circle, elope to the mountains just the two of you, or throw a wild party with all your favorite people \u2013 I capture your story as it is: honest, relaxed and full of life. No stiff posing, no awkward group photos. Instead, real emotions, quiet moments and the pure joy that makes your day so special. My goal: when you look at your photos, you should instantly remember how it all felt.",
    photo_packages_de: "Meine Foto-Pakete",
    photo_packages_en: "My Photo Packages",

    // Video Section
    video_title_de: "WEDDING VIDEOGRAPHY",
    video_title_en: "WEDDING VIDEOGRAPHY",
    video_heading_de: "Dynamisch & Emotional",
    video_heading_en: "Dynamic & Emotional",
    video_text_de: "Ein Film f\u00E4ngt mehr ein als nur Bilder \u2013 er bewahrt Stimmen, Bewegungen und Stimmungen. Das Zittern in der Stimme beim Eheversprechen, das Lachen eurer besten Freunde, die Musik beim ersten Tanz. So k\u00F6nnt ihr auch Jahre sp\u00E4ter noch sp\u00FCren, wie es sich angef\u00FChlt hat. Meine Hochzeitsfilme sind cineastisch, emotional und genau so einzigartig wie euer Tag selbst.",
    video_text_en: "A film captures more than just images \u2013 it preserves voices, movements and moods. The trembling in your voice during the vows, the laughter of your best friends, the music during your first dance. So you can still feel years later what it was like. My wedding films are cinematic, emotional and just as unique as your day itself.",
    video_packages_de: "Meine Video-Pakete",
    video_packages_en: "My Video Packages",

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

    // Packages
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
    guide_button_de: "Guide herunterladen",
    guide_button_en: "Download Guide",
    guide_note_de: "Kostenlos & unverbindlich",
    guide_note_en: "Free & no strings attached",

    // Final CTA
    cta_title_de: "Bereit f\u00FCr eure Geschichte?",
    cta_title_en: "Ready for your story?",
    cta_text_de: "Euer Tag, eure Geschichte \u2013 und ich freu mich riesig, sie erz\u00E4hlen zu d\u00FCrfen. Schreibt mir einfach, ganz unverbindlich. Wir quatschen kurz, und ihr merkt schnell, ob die Chemie stimmt.",
    cta_text_en: "Your day, your story \u2013 and I'm so excited to tell it. Just message me, no strings attached. We'll have a quick chat and you'll know right away if the chemistry is right.",
    cta_button_de: "Kontakt aufnehmen",
    cta_button_en: "Get in touch"
  }
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ANIMALS - 32 fields
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
animals: {
  content_type: "page_animals",
  fields: {
    // Assets
    hero_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_R52_1038_(WebRes).jpg?updatedAt=1773000802084",
    dogs_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_Hundeshooting-3474_(WebRes).jpg?updatedAt=1772999916029",
    horses_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/8D2A8472.jpg?updatedAt=1773000809216",
    cats_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_Hundeshooting-4431_(WebRes).jpg?updatedAt=1772999913745",
    studio_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_Hundeshooting-3474_(WebRes).jpg?updatedAt=1772999916029",
    outdoor_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_R52_1038_(WebRes).jpg?updatedAt=1773000802084",

    // Hero
    hero_title_de: "Tierfotografie",
    hero_title_en: "Animal Photography",
    hero_subtitle_de: "Pers\u00F6nlichkeit einfangen",
    hero_subtitle_en: "Capturing Personality",

    // Intro
    intro_de: "Ob treuer Begleiter, majest\u00E4tisches Pferd oder verschmuster Stubentiger \u2013 jedes Tier hat seinen ganz eigenen Charakter, und genau den m\u00F6chte ich einfangen. Ich nehme mir die Zeit, die es braucht, damit sich euer Liebling wohlf\u00FChlt und ganz er selbst sein kann. Das Ergebnis: nat\u00FCrliche, emotionale Bilder, die euch noch Jahre sp\u00E4ter zum L\u00E4cheln bringen. Denn mal ehrlich \u2013 unsere Vierbeiner verdienen die besten Fotos der Welt.",
    intro_en: "Whether loyal companion, majestic horse or cuddly cat \u2013 every animal has its very own character, and that\u2019s exactly what I want to capture. I take all the time needed so your beloved pet feels comfortable and can be completely themselves. The result: natural, emotional images that will make you smile for years to come. Because let\u2019s be honest \u2013 our four-legged friends deserve the best photos in the world.",

    // Categories
    dogs_title_de: "Hundefotografie",
    dogs_title_en: "Dog Photography",
    dogs_text_de: "Euer Hund ist nicht nur ein Haustier, sondern euer bester Freund, euer Seelenverwandter auf vier Pfoten? Dann verdient er Bilder, die genau das zeigen. Ob der treue Blick, das wilde Herumtollen im Wald oder das zufriedene D\u00F6sen auf der Couch \u2013 ich fange die kleinen und gro\u00DFen Momente ein, die euren Hund so besonders machen. Und ja: Leckerlis bringe ich selbst mit.",
    dogs_text_en: "Your dog isn\u2019t just a pet, but your best friend, your soulmate on four paws? Then they deserve photos that show exactly that. Whether it\u2019s the loyal gaze, the wild romping through the forest or the content snoozing on the couch \u2013 I capture the big and small moments that make your dog so special. And yes: I bring the treats myself.",
    horses_title_de: "Pferdefotografie",
    horses_title_en: "Horse Photography",
    horses_text_de: "Die Verbindung zwischen Mensch und Pferd ist etwas ganz Besonderes \u2013 kraftvoll, elegant und voller Vertrauen. Ob auf der Koppel, beim Ausritt oder im goldenen Abendlicht: Ich halte diese einzigartigen Momente fest. Mit Geduld und Ruhe, damit sich auch euer Pferd vor der Kamera wohlf\u00FChlt. Die Bilder werden so ausdrucksstark wie die Tiere selbst.",
    horses_text_en: "The bond between human and horse is something truly special \u2013 powerful, elegant and full of trust. Whether in the paddock, on a ride or in the golden evening light: I capture these unique moments. With patience and calm, so your horse feels comfortable in front of the camera too. The images will be as expressive as the animals themselves.",
    other_title_de: "Katzen, Kleintiere & Co.",
    other_title_en: "Cats, Small Animals & More",
    other_text_de: "Katzen, Kaninchen, V\u00F6gel oder auch mal ein ganz besonderes Haustier \u2013 bei mir ist jedes Tier willkommen. Erz\u00E4hlt mir von eurem Liebling und seinen Eigenheiten, und wir planen gemeinsam ein Shooting, das zu euch passt. Ob im Studio mit schickem Hintergrund oder drau\u00DFen in der Natur \u2013 Hauptsache, euer Tier f\u00FChlt sich wohl und die Bilder werden einzigartig.",
    other_text_en: "Cats, rabbits, birds or even a very special pet \u2013 every animal is welcome. Tell me about your pet and their quirks, and we'll plan a shoot together that suits you. Whether in the studio with a stylish backdrop or outdoors in nature \u2013 the main thing is your pet feels comfortable and the photos are unique.",

    // Packages
    packages_title_de: "Meine Pakete",
    packages_title_en: "My Packages",

    // Mid CTA
    midcta_text_de: "Bereit f\u00FCr unvergessliche Bilder von eurem Vierbeiner? Schreibt mir \u2013 ich freue mich auf euch!",
    midcta_text_en: "Ready for unforgettable photos of your furry friend? Drop me a message \u2013 I look forward to hearing from you!",
    midcta_button_de: "Shooting anfragen",
    midcta_button_en: "Inquire now",

    // Gallery
    gallery_title: "GET INSPIRED",

    // Tips
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

    // CTA
    cta_title_de: "Shooting f\u00FCr euren Liebling?",
    cta_title_en: "Shoot for your beloved pet?",
    cta_text_de: "Meldet euch einfach bei mir \u2013 erz\u00E4hlt mir von eurem Tier, und wir finden zusammen den perfekten Rahmen f\u00FCr euer Shooting. Ich freu mich auf eure Fellnasen, Samtpfoten und Huftiere!",
    cta_text_en: "Just get in touch \u2013 tell me about your pet and we'll find the perfect setting for your shoot together. I can't wait to meet your furry, feathered and hoofed friends!",
    cta_button_de: "Anfrage senden",
    cta_button_en: "Send inquiry"
  }
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PORTRAIT - 35 fields
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
portrait: {
  content_type: "page_portrait",
  fields: {
    // Assets
    hero_image: "https://ik.imagekit.io/r2yqrg6np/Tiere/20251019_Hundeshooting-4431_(WebRes).jpg?updatedAt=1772999913745",
    couple_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Getting%20Ready/20251004_8D2A0221_(WebRes).jpg?updatedAt=1773002917508",
    family_image: "https://ik.imagekit.io/r2yqrg6np/Wedding/Paarfotos/250830_LJ_153525_0450(LowRes).jpg?updatedAt=1773007047995",
    baptism_image: "https://ik.imagekit.io/r2yqrg6np/Other/7561IG.jpg?updatedAt=1773014105229",

    // Hero
    hero_title_de: "Portrait & Mehr",
    hero_title_en: "Portrait & More",
    hero_subtitle_de: "Authentische Momente",
    hero_subtitle_en: "Authentic Moments",

    // Intro
    intro_de: "Das Leben steckt voller besonderer Momente \u2013 und die meisten davon passieren nicht vor einem perfekt inszenierten Hintergrund, sondern mittendrin im echten Leben. Genau dort bin ich am liebsten. Ob ihr als Paar ein paar gemeinsame Stunden genie\u00DFen wollt, eure Familie festhalten m\u00F6chtet oder einen besonderen Anlass feiert: Ich bin dabei und sorge daf\u00FCr, dass ihr euch vor der Kamera wohlf\u00FChlt. Nat\u00FCrlich, entspannt und mit Bildern, die eure Geschichte erz\u00E4hlen.",
    intro_en: "Life is full of special moments \u2013 and most of them don't happen in front of a perfectly staged backdrop, but right in the middle of real life. That\u2019s exactly where I love to be. Whether you want to enjoy some time together as a couple, capture your family or celebrate a special occasion: I'm there and make sure you feel comfortable in front of the camera. Natural, relaxed and with images that tell your story.",

    // Categories
    couple_title_de: "Couple Shooting",
    couple_title_en: "Couple Shooting",
    couple_text_de: "Ob frisch verliebt, frisch verlobt oder seit 20 Jahren ein Team \u2013 ein Paarshooting ist eure Zeit. Kein steifes Posieren, sondern gemeinsam lachen, spazieren, einfach ihr sein. Ich gebe euch sanfte Anweisungen, aber die sch\u00F6nsten Momente passieren von ganz allein. Ob in den Bergen bei Sonnenuntergang, in der Altstadt oder an eurem Lieblingsplatz \u2013 wir finden die perfekte Location f\u00FCr eure Geschichte.",
    couple_text_en: "Whether freshly in love, newly engaged or a team for 20 years \u2013 a couple shoot is your time. No stiff posing, just laughing together, walking, simply being yourselves. I give gentle directions, but the best moments happen all on their own. Whether in the mountains at sunset, in the old town or at your favorite spot \u2013 we'll find the perfect location for your story.",
    family_title_de: "Familie & Taufe",
    family_title_en: "Family & Baptism",
    family_text_de: "Kinder werden so schnell gro\u00DF, und die kleinen Momente verfliegen im Alltag. Ein Familienshooting ist eure Chance, innezuhalten und festzuhalten, was wirklich z\u00E4hlt: das Lachen, die Umarmungen, das Chaos \u2013 und die Liebe, die alles zusammenh\u00E4lt. Auch bei Taufen bin ich gerne dabei und dokumentiere diesen besonderen Tag diskret und einf\u00FChlsam.",
    family_text_en: "Kids grow up so fast, and the little moments fly by in everyday life. A family shoot is your chance to pause and capture what truly matters: the laughter, the hugs, the chaos \u2013 and the love that holds it all together. I'm also happy to be there for baptisms, documenting this special day discreetly and sensitively.",
    private_title_de: "Private Anl\u00E4sse",
    private_title_en: "Private Occasions",
    private_text_de: "Ob Geburtstag, Jubil\u00E4um, Firmenevent oder einfach ein Tag, der gefeiert werden soll \u2013 erz\u00E4hlt mir, was ihr vorhabt, und ich k\u00FCmmere mich um die Bilder. Ich passe mich eurem Event an, bleibe unauff\u00E4llig und halte die Momente fest, die den Tag besonders machen. Keine steifen Gruppenfotos, sondern echte Erinnerungen.",
    private_text_en: "Whether birthday, anniversary, corporate event or simply a day worth celebrating \u2013 tell me what you're planning and I'll take care of the photos. I adapt to your event, stay unobtrusive and capture the moments that make the day special. No stiff group photos, just real memories.",

    // Pricing Section
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

    // Occasions
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

    // Gallery
    gallery_title: "GET INSPIRED",

    // CTA
    cta_title_de: "Euer Moment, eure Bilder",
    cta_title_en: "Your moment, your images",
    cta_text_de: "Egal ob Paar, Familie oder besonderer Anlass \u2013 schreibt mir einfach, was ihr euch vorstellt. Wir quatschen kurz und planen gemeinsam etwas, das sich f\u00FCr euch richtig anf\u00FChlt.",
    cta_text_en: "Whether couple, family or special occasion \u2013 just tell me what you have in mind. We'll have a quick chat and plan something together that feels right for you.",
    cta_button_de: "Jetzt anfragen",
    cta_button_en: "Inquire now"
  }
},

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ABOUT - 43 fields
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
about: {
  content_type: "page_about",
  fields: {
    // Assets
    hero_video: "https://ik.imagekit.io/r2yqrg6np/Madeira%20Clip%20fu%CC%88r%20Webseite.mp4?updatedAt=1773024774420",
    portrait_image: "https://ik.imagekit.io/r2yqrg6np/68e54c497a9dde9d00252dcb_WhatsApp%20Image%202025-09-16%20at%2022.32.17.avif",
    mario_action_image: "https://ik.imagekit.io/r2yqrg6np/6966a461e78df6320fd2fd1e_20251019_Hundeshooting-3528_(WebRes).jpg",

    // Header
    about_title_de: "\u00DCber mich",
    about_title_en: "About me",
    heading_de: "Ich bin Mario",
    heading_en: "I'm Mario",

    // Bio texts
    text1_de: "Geboren in Bayern, in Innsbruck h\u00E4ngen geblieben. Mit 15 habe ich meine erste Kamera in der Hand gehabt und bin seitdem nicht mehr davon losgekommen. Aus dem Hobby wurde Leidenschaft, aus der Leidenschaft mein Beruf.",
    text1_en: "Born in Bavaria, settled in Innsbruck. At 15, I held my first camera and never looked back. What started as a hobby became passion, and passion became my profession.",
    text2_de: "Heute begleite ich Hochzeiten so, wie sie sind: echt, ungestellt, voller Gef\u00FChl. Ich mische mich unter die G\u00E4ste, bleibe unauff\u00E4llig und fange die Momente ein, die man nicht inszenieren kann. In der Bearbeitung bekommen eure Bilder einen Hauch Editorial, cineastisch und zeitlos \u2013 Erinnerungen, die euch f\u00FCr immer bleiben.",
    text2_en: "Today I accompany weddings as they are: real, unposed, full of feeling. I mingle with the guests, stay unobtrusive and capture the moments that cannot be staged. In editing, your images get a touch of editorial, cinematic and timeless \u2013 memories that stay with you forever.",
    text3_de: "Neben Hochzeiten fotografiere ich auch Tiere, Paare, Familien und andere besondere Anl\u00E4sse. Was alle meine Arbeiten verbindet: Authentizit\u00E4t und Emotion.",
    text3_en: "Besides weddings, I also photograph animals, couples, families and other special occasions. What connects all my work: authenticity and emotion.",

    // Philosophy
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

    // "What to expect" section
    expect_title_de: "Das erwartet Euch",
    expect_title_en: "What to expect",

    // Tagline
    tagline_de: "nat\u00FCrlich. zeitlos. authentisch.",
    tagline_en: "natural. timeless. authentic.",
    tagline_bold_de: "FOTOGRAFIE",
    tagline_bold_en: "PHOTOGRAPHY",
    tagline_desc_de: "Bei der dokumentarischen Begleitung sind Posen und gestellte Aufnahmen ein absolutes No-Go. Mein Fokus liegt darauf, die echten Emotionen und nat\u00FCrlichen Momente festzuhalten.",
    tagline_desc_en: "In documentary coverage, poses and staged shots are an absolute no-go. My focus is on capturing real emotions and natural moments.",

    // Stats
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

    // Passion section
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

    // Testimonials
    testimonials_title_de: "Was meine Kunden sagen",
    testimonials_title_en: "What my clients say",

    // Contact section
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

    // Final CTA banner
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
  Logger.log("Seeding: " + slug + " (" + config.content_type + ")");
  Logger.log("=".repeat(50));

  var existing = findStory(slug);
  if (!existing) {
    Logger.log("  ERROR: Story '" + slug + "' not found!");
    Logger.log("  Create it first: Content > pages > + Entry > '" + pageKey + "' > Content Type: " + config.content_type);
    return false;
  }
  Logger.log("  Found: id=" + existing.id + ", name='" + existing.name + "'");

  var currentContent = existing.content || {};
  var mergedContent = {};

  // Copy existing
  var ek = Object.keys(currentContent);
  for (var i = 0; i < ek.length; i++) mergedContent[ek[i]] = currentContent[ek[i]];
  mergedContent.component = config.content_type;

  var updated = 0, skipped = 0;
  var fk = Object.keys(config.fields);

  for (var j = 0; j < fk.length; j++) {
    var key = fk[j];
    var value = config.fields[key];
    var cur = currentContent[key];
    var isEmpty = !cur || (typeof cur === "string" && cur.trim() === "");

    if (FORCE_OVERWRITE || isEmpty) {
      mergedContent[key] = value;
      updated++;
    } else {
      skipped++;
    }
  }

  Logger.log("  Fields: " + updated + " written, " + skipped + " skipped");
  Logger.log("  Mode: " + (FORCE_OVERWRITE ? "FORCE OVERWRITE" : "FILL EMPTY ONLY"));

  try {
    sbApi("PUT", "/stories/" + existing.id, {
      story: { name: existing.name, slug: existing.slug, content: mergedContent },
      publish: 1
    });
    Logger.log("  SUCCESS! Published.");
    return true;
  } catch (e) {
    Logger.log("  FAILED: " + e.message);
    return false;
  }
}

// ── MAIN FUNCTION (run this!) ────────────────────────────────────
function seedEverything() {
  if (MGMT_TOKEN === "DEIN_MANAGEMENT_TOKEN_HIER") {
    Logger.log("ERROR: Bitte trage deinen Management Token ein!");
    Logger.log("Storyblok > Settings > Access Tokens > Generate (Scope: All)");
    return;
  }

  Logger.log("========================================");
  Logger.log("  STORYBLOK COMPLETE SEEDER");
  Logger.log("  Space: " + SPACE_ID);
  Logger.log("  Mode: " + (FORCE_OVERWRITE ? "FORCE OVERWRITE" : "FILL EMPTY ONLY"));
  Logger.log("========================================\n");

  var data = getAllSeedData();
  var pages = Object.keys(data);
  var ok = 0, fail = 0;

  for (var i = 0; i < pages.length; i++) {
    var result = seedPage(pages[i], data[pages[i]]);
    if (result) ok++; else fail++;
    if (i < pages.length - 1) Utilities.sleep(500);
  }

  Logger.log("\n========================================");
  Logger.log("  FERTIG! " + ok + " OK, " + fail + " fehlgeschlagen");
  Logger.log("========================================");
  Logger.log("");
  Logger.log("Felder gesamt pro Page:");
  for (var p = 0; p < pages.length; p++) {
    Logger.log("  " + pages[p] + ": " + Object.keys(data[pages[p]].fields).length + " Felder");
  }
  Logger.log("");
  Logger.log("Naechste Schritte:");
  Logger.log("1. Storyblok oeffnen und pruefen ob Felder befuellt sind");
  Logger.log("2. Browser-Cache / localStorage leeren");
  Logger.log("3. Website testen");
}
