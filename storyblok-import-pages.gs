/**
 * STORYBLOK PAGE CONTENT IMPORT
 * ==============================
 * Google Apps Script – einmal ausfuehren, dann PAT sofort rotieren!
 *
 * Anleitung:
 * 1. script.google.com -> Neues Projekt
 * 2. Diesen Code einfuegen
 * 3. Funktion "main" ausfuehren
 * 4. Danach PAT in Storyblok sofort loeschen/rotieren
 */

var SPACE_ID = "291045863485848";
var PAT = "t9votjn7DKH59wrwerASQQtt-152995764856836-jHMBKy9nHUgXiF3_eY7e";
var BASE_URL = "https://mapi.storyblok.com/v1/spaces/" + SPACE_ID;

// ============================================================
// MAIN
// ============================================================
function main() {
  var folderId = getFolderId("pages");
  if (!folderId) {
    Logger.log("ERROR: Folder 'pages' nicht gefunden! Bitte zuerst in Storyblok anlegen.");
    return;
  }
  Logger.log("Folder 'pages' gefunden, ID: " + folderId);

  var pages = getPageData();

  for (var i = 0; i < pages.length; i++) {
    var page = pages[i];
    Logger.log("--- Verarbeite: " + page.slug + " ---");
    createOrUpdateStory(folderId, page.slug, page.name, page.content);
    // Rate limit: Storyblok erlaubt 3 req/sec fuer Management API
    Utilities.sleep(500);
  }

  Logger.log("=== FERTIG! Alle 5 Seiten importiert. PAT jetzt sofort rotieren! ===");
}

// ============================================================
// API HELPERS
// ============================================================
function storyblokGet(endpoint) {
  var options = {
    method: "get",
    headers: { "Authorization": PAT },
    muteHttpExceptions: true
  };
  var resp = UrlFetchApp.fetch(BASE_URL + endpoint, options);
  return JSON.parse(resp.getContentText());
}

function storyblokPost(endpoint, payload) {
  var options = {
    method: "post",
    headers: {
      "Authorization": PAT,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  var resp = UrlFetchApp.fetch(BASE_URL + endpoint, options);
  Logger.log("POST " + endpoint + " -> " + resp.getResponseCode());
  if (resp.getResponseCode() >= 400) {
    Logger.log("Error: " + resp.getContentText());
  }
  return JSON.parse(resp.getContentText());
}

function storyblokPut(endpoint, payload) {
  var options = {
    method: "put",
    headers: {
      "Authorization": PAT,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  var resp = UrlFetchApp.fetch(BASE_URL + endpoint, options);
  Logger.log("PUT " + endpoint + " -> " + resp.getResponseCode());
  if (resp.getResponseCode() >= 400) {
    Logger.log("Error: " + resp.getContentText());
  }
  return JSON.parse(resp.getContentText());
}

function getFolderId(slug) {
  // Versuch 1: mit is_folder Filter
  var data = storyblokGet("/stories?is_folder=true&per_page=100");
  var stories = data.stories || [];
  for (var i = 0; i < stories.length; i++) {
    if (stories[i].slug === slug) {
      return stories[i].id;
    }
  }
  // Versuch 2: ohne Filter, alle Root-Stories durchsuchen
  Logger.log("is_folder Filter hat nichts gefunden, suche ohne Filter...");
  data = storyblokGet("/stories?per_page=100&with_parent=0");
  stories = data.stories || [];
  for (var i = 0; i < stories.length; i++) {
    if (stories[i].slug === slug) {
      Logger.log("Gefunden via Fallback! is_startpage=" + stories[i].is_startpage + ", is_folder=" + stories[i].is_folder);
      return stories[i].id;
    }
  }
  // Versuch 3: by_slugs
  Logger.log("Versuche by_slugs...");
  data = storyblokGet("/stories?by_slugs=" + slug);
  stories = data.stories || [];
  if (stories.length > 0) {
    Logger.log("Gefunden via by_slugs! ID: " + stories[0].id);
    return stories[0].id;
  }
  // Versuch 4: Alle Stories loggen zur Diagnose
  Logger.log("Nichts gefunden. Alle Stories zur Diagnose:");
  data = storyblokGet("/stories?per_page=100");
  stories = data.stories || [];
  for (var i = 0; i < stories.length; i++) {
    Logger.log("  -> slug: " + stories[i].slug + " | id: " + stories[i].id + " | is_folder: " + stories[i].is_folder + " | full_slug: " + stories[i].full_slug);
  }
  return null;
}

function createOrUpdateStory(folderId, slug, name, content) {
  // Pruefen ob Story schon existiert
  var data = storyblokGet("/stories?starts_with=pages/" + slug + "&per_page=1");
  var existing = (data.stories && data.stories.length > 0) ? data.stories[0] : null;

  if (existing) {
    Logger.log("Story '" + slug + "' existiert bereits (ID: " + existing.id + "), wird aktualisiert...");
    storyblokPut("/stories/" + existing.id, {
      story: {
        name: name,
        slug: slug,
        parent_id: folderId,
        content: content
      },
      publish: 1
    });
  } else {
    Logger.log("Story '" + slug + "' wird neu angelegt...");
    storyblokPost("/stories", {
      story: {
        name: name,
        slug: slug,
        parent_id: folderId,
        content: content
      },
      publish: 1
    });
  }
}

// ============================================================
// PAGE DATA – Alle Texte aus den Translations
// ============================================================
function getPageData() {
  return [
    getHomePage(),
    getWeddingsPage(),
    getAnimalsPage(),
    getPortraitPage(),
    getAboutPage()
  ];
}

// ----- HOME -----
function getHomePage() {
  return {
    slug: "home",
    name: "Home",
    content: {
      component: "page_content",

      hero_subtitle_de: "Fotografie & Videografie",
      hero_subtitle_en: "Photography & Videography",

      hero_tagline_de: "Timeless photos. Unforgettable stories.",
      hero_tagline_en: "Timeless photos. Unforgettable stories.",

      hero_cta_de: "Jetzt anfragen",
      hero_cta_en: "Inquire now",

      services_title_de: "Was ich anbiete",
      services_title_en: "What I offer",

      wedding_title_de: "Hochzeiten",
      wedding_title_en: "Weddings",

      wedding_desc_de: "Euer gro\u00dfer Tag verdient mehr als nur Fotos \u2013 er verdient Erinnerungen, die sich anf\u00fchlen. Ich begleite euch von den ersten aufgeregten Momenten beim Getting Ready bis zum letzten Tanz und halte alles fest, was dazwischen passiert: echte Emotionen, leise Gesten und pure Lebensfreude.",
      wedding_desc_en: "Your big day deserves more than just photos \u2013 it deserves memories that feel real. I accompany you from the first excited moments of getting ready to the last dance and capture everything in between: genuine emotions, quiet gestures and pure joy.",

      animals_title_de: "Tierfotografie",
      animals_title_en: "Animal Photography",

      animals_desc_de: "Ob treuer Hundeblick, die Eleganz eures Pferdes oder das verschmitzte Grinsen eurer Katze \u2013 eure Fellnase hat einen ganz eigenen Charakter, und genau den fange ich ein. Entspannt, geduldig und mit ganz viel Liebe zum Detail.",
      animals_desc_en: "Whether a loyal dog\u2019s gaze, the elegance of your horse or the mischievous grin of your cat \u2013 your pet has a unique character, and that\u2019s exactly what I capture. Relaxed, patient and with lots of attention to detail.",

      portrait_title_de: "Portrait & Mehr",
      portrait_title_en: "Portrait & More",

      portrait_desc_de: "Verliebte Blicke beim Couple Shooting, das Lachen eurer Kinder beim Familienfoto oder die Emotionen bei der Taufe \u2013 ich halte die Momente fest, die ihr nie vergessen wollt. Nat\u00fcrlich, ungezwungen und voller W\u00e4rme.",
      portrait_desc_en: "Loving glances during a couple shoot, your children\u2019s laughter in a family photo or the emotions at a baptism \u2013 I capture the moments you never want to forget. Natural, relaxed and full of warmth.",

      view_more_de: "Mehr erfahren",
      view_more_en: "Learn more",

      how_it_works_pretitle_de: "SO L\u00c4UFT'S AB",
      how_it_works_pretitle_en: "HOW IT WORKS",

      how_it_works_title_de: "In 3 Schritten zu euren Bildern",
      how_it_works_title_en: "3 steps to your images",

      step1_title_de: "Anfrage & Kennenlernen",
      step1_title_en: "Inquiry & Getting to know",

      step1_text_de: "Schreibt mir und erz\u00e4hlt mir von euch. In einem unverbindlichen Erstgespr\u00e4ch kl\u00e4ren wir alle Fragen.",
      step1_text_en: "Write to me and tell me about yourselves. In a free initial conversation we\u2019ll clarify everything.",

      step2_title_de: "Planung & Vorbereitung",
      step2_title_en: "Planning & Preparation",

      step2_text_de: "Gemeinsam planen wir euer Shooting \u2013 von der Location \u00fcber den Zeitplan bis zur Stimmung.",
      step2_text_en: "Together we plan your shoot \u2013 from location to schedule to mood.",

      step3_title_de: "Shooting & Ergebnis",
      step3_title_en: "Shoot & Results",

      step3_text_de: "Am Tag selbst seid ihr entspannt, ich fange alles ein. Innerhalb weniger Wochen erhaltet ihr eure Galerie.",
      step3_text_en: "On the day you relax, I capture everything. Within a few weeks you\u2019ll receive your gallery.",

      about_pretitle_de: "\u00dcber mich",
      about_pretitle_en: "About me",

      about_title_de: "Ich bin Mario",
      about_title_en: "I\u2019m Mario",

      about_text_de: "Geboren in Bayern, in Innsbruck h\u00e4ngen geblieben. Mit 15 habe ich meine erste Kamera in der Hand gehabt und bin seitdem nicht mehr davon losgekommen. Aus dem Hobby wurde Leidenschaft, aus der Leidenschaft mein Beruf.",
      about_text_en: "Born in Bavaria, settled in Innsbruck. At 15, I held my first camera and never looked back. What started as a hobby became passion, and passion became my profession.",

      philosophy_text_de: "Heute begleite ich Hochzeiten so, wie sie sind: echt, ungestellt, voller Gef\u00fchl. Ich mische mich unter die G\u00e4ste, bleibe unauff\u00e4llig und fange die Momente ein, die man nicht inszenieren kann. In der Bearbeitung bekommen eure Bilder einen Hauch Editorial, cineastisch und zeitlos \u2013 Erinnerungen, die euch f\u00fcr immer bleiben.",
      philosophy_text_en: "Today I accompany weddings as they are: real, unposed, full of feeling. I mingle with the guests, stay unobtrusive and capture the moments that cannot be staged. In editing, your images get a touch of editorial, cinematic and timeless \u2013 memories that stay with you forever.",

      about_cta_de: "Mehr zu mir",
      about_cta_en: "More about me",

      inspired_title_de: "GET INSPIRED",
      inspired_title_en: "GET INSPIRED",

      load_more_de: "Mehr anzeigen",
      load_more_en: "Load more",

      wyldworks_title_de: "Foto & Video f\u00fcr Unternehmen?",
      wyldworks_title_en: "Photo & video for businesses?",

      wyldworks_desc_de: "Employer Branding, Imagefilme, Events & Social Media Content \u2013 das l\u00e4uft \u00fcber meine Agentur.",
      wyldworks_desc_en: "Employer branding, image films, events & social media content \u2013 that\u2019s handled by my agency.",

      cta_title_de: "Lass uns reden!",
      cta_title_en: "Let\u2019s talk!",

      cta_text_de: "Ihr plant eure Hochzeit, w\u00fcnscht euch ein Shooting mit eurer Familie oder eurem Vierbeiner, oder habt einfach eine Idee im Kopf? Schreibt mir ganz unverbindlich \u2013 ich freu mich, eure Geschichte zu h\u00f6ren und gemeinsam etwas Sch\u00f6nes daraus zu machen.",
      cta_text_en: "Planning your wedding, want a shoot with your family or your furry friend, or just have an idea in mind? Drop me a message \u2013 no strings attached. I\u2019d love to hear your story and create something beautiful together.",

      cta_button_de: "Kontakt aufnehmen",
      cta_button_en: "Get in touch"
    }
  };
}

// ----- WEDDINGS -----
function getWeddingsPage() {
  return {
    slug: "weddings",
    name: "Weddings",
    content: {
      component: "page_content",

      hero_title_de: "Hochzeitsfotografie & Videografie",
      hero_title_en: "Wedding Photography & Videography",

      hero_subtitle_de: "Zeitlos & Authentisch",
      hero_subtitle_en: "Timeless & Authentic",

      photo_title_de: "WEDDING PHOTOGRAPHY",
      photo_title_en: "WEDDING PHOTOGRAPHY",

      photo_heading_de: "Zeitlos & Authentisch",
      photo_heading_en: "Timeless & Authentic",

      photo_text_de: "Egal ob ihr euch im kleinen Kreis das Ja-Wort gebt, in den Bergen ganz f\u00fcr euch allein heiratet oder mit all euren Lieblingsmenschen eine wilde Party feiert \u2013 ich halte eure Geschichte so fest, wie sie ist: ehrlich, ungezwungen und voller Leben. Kein gestelltes Posing, keine steifen Gruppenfotos. Stattdessen echte Emotionen, stille Momente und die pure Freude, die euren Tag so besonders macht. Mein Ziel: Wenn ihr eure Bilder anschaut, sollt ihr euch sofort zur\u00fcckerinnern, wie es sich angef\u00fchlt hat.",
      photo_text_en: "Whether you say \u2018I do\u2019 in an intimate circle, elope to the mountains just the two of you, or throw a wild party with all your favorite people \u2013 I capture your story as it is: honest, relaxed and full of life. No stiff posing, no awkward group photos. Instead, real emotions, quiet moments and the pure joy that makes your day so special. My goal: when you look at your photos, you should instantly remember how it all felt.",

      photo_packages_de: "Meine Foto-Pakete",
      photo_packages_en: "My Photo Packages",

      video_title_de: "WEDDING VIDEOGRAPHY",
      video_title_en: "WEDDING VIDEOGRAPHY",

      video_heading_de: "Dynamisch & Emotional",
      video_heading_en: "Dynamic & Emotional",

      video_text_de: "Ein Film f\u00e4ngt mehr ein als nur Bilder \u2013 er bewahrt Stimmen, Bewegungen und Stimmungen. Das Zittern in der Stimme beim Eheversprechen, das Lachen eurer besten Freunde, die Musik beim ersten Tanz. So k\u00f6nnt ihr auch Jahre sp\u00e4ter noch sp\u00fcren, wie es sich angef\u00fchlt hat. Meine Hochzeitsfilme sind cineastisch, emotional und genau so einzigartig wie euer Tag selbst.",
      video_text_en: "A film captures more than just images \u2013 it preserves voices, movements and moods. The trembling in your voice during the vows, the laughter of your best friends, the music during your first dance. So you can still feel years later what it was like. My wedding films are cinematic, emotional and just as unique as your day itself.",

      video_packages_de: "Meine Video-Pakete",
      video_packages_en: "My Video Packages",

      packages_title_de: "Meine Pakete",
      packages_title_en: "My Packages",

      cta_title_de: "Bereit f\u00fcr eure Geschichte?",
      cta_title_en: "Ready for your story?",

      cta_text_de: "Euer Tag, eure Geschichte \u2013 und ich freu mich riesig, sie erz\u00e4hlen zu d\u00fcrfen. Schreibt mir einfach, ganz unverbindlich. Wir quatschen kurz, und ihr merkt schnell, ob die Chemie stimmt.",
      cta_text_en: "Your day, your story \u2013 and I\u2019m so excited to tell it. Just message me, no strings attached. We\u2019ll have a quick chat and you\u2019ll know right away if the chemistry is right.",

      cta_button_de: "Kontakt aufnehmen",
      cta_button_en: "Get in touch"
    }
  };
}

// ----- ANIMALS -----
function getAnimalsPage() {
  return {
    slug: "animals",
    name: "Animals",
    content: {
      component: "page_content",

      hero_title_de: "Tierfotografie",
      hero_title_en: "Animal Photography",

      hero_subtitle_de: "Pers\u00f6nlichkeit einfangen",
      hero_subtitle_en: "Capturing Personality",

      intro_de: "Ob treuer Begleiter, majest\u00e4tisches Pferd oder verschmuster Stubentiger \u2013 jedes Tier hat seinen ganz eigenen Charakter, und genau den m\u00f6chte ich einfangen. Ich nehme mir die Zeit, die es braucht, damit sich euer Liebling wohlf\u00fchlt und ganz er selbst sein kann. Das Ergebnis: nat\u00fcrliche, emotionale Bilder, die euch noch Jahre sp\u00e4ter zum L\u00e4cheln bringen. Denn mal ehrlich \u2013 unsere Vierbeiner verdienen die besten Fotos der Welt.",
      intro_en: "Whether loyal companion, majestic horse or cuddly cat \u2013 every animal has its very own character, and that\u2019s exactly what I want to capture. I take all the time needed so your beloved pet feels comfortable and can be completely themselves. The result: natural, emotional images that will make you smile for years to come. Because let\u2019s be honest \u2013 our four-legged friends deserve the best photos in the world.",

      dogs_title_de: "Hundefotografie",
      dogs_title_en: "Dog Photography",

      dogs_text_de: "Euer Hund ist nicht nur ein Haustier, sondern euer bester Freund, euer Seelenverwandter auf vier Pfoten? Dann verdient er Bilder, die genau das zeigen. Ob der treue Blick, das wilde Herumtollen im Wald oder das zufriedene D\u00f6sen auf der Couch \u2013 ich fange die kleinen und gro\u00dfen Momente ein, die euren Hund so besonders machen. Und ja: Leckerlis bringe ich selbst mit.",
      dogs_text_en: "Your dog isn\u2019t just a pet, but your best friend, your soulmate on four paws? Then they deserve photos that show exactly that. Whether it\u2019s the loyal gaze, the wild romping through the forest or the content snoozing on the couch \u2013 I capture the big and small moments that make your dog so special. And yes: I bring the treats myself.",

      horses_title_de: "Pferdefotografie",
      horses_title_en: "Horse Photography",

      horses_text_de: "Die Verbindung zwischen Mensch und Pferd ist etwas ganz Besonderes \u2013 kraftvoll, elegant und voller Vertrauen. Ob auf der Koppel, beim Ausritt oder im goldenen Abendlicht: Ich halte diese einzigartigen Momente fest. Mit Geduld und Ruhe, damit sich auch euer Pferd vor der Kamera wohlf\u00fchlt. Die Bilder werden so ausdrucksstark wie die Tiere selbst.",
      horses_text_en: "The bond between human and horse is something truly special \u2013 powerful, elegant and full of trust. Whether in the paddock, on a ride or in the golden evening light: I capture these unique moments. With patience and calm, so your horse feels comfortable in front of the camera too. The images will be as expressive as the animals themselves.",

      other_title_de: "Katzen, Kleintiere & Co.",
      other_title_en: "Cats, Small Animals & More",

      other_text_de: "Katzen, Kaninchen, V\u00f6gel oder auch mal ein ganz besonderes Haustier \u2013 bei mir ist jedes Tier willkommen. Erz\u00e4hlt mir von eurem Liebling und seinen Eigenheiten, und wir planen gemeinsam ein Shooting, das zu euch passt. Ob im Studio mit schickem Hintergrund oder drau\u00dfen in der Natur \u2013 Hauptsache, euer Tier f\u00fchlt sich wohl und die Bilder werden einzigartig.",
      other_text_en: "Cats, rabbits, birds or even a very special pet \u2013 every animal is welcome. Tell me about your pet and their quirks, and we\u2019ll plan a shoot together that suits you. Whether in the studio with a stylish backdrop or outdoors in nature \u2013 the main thing is your pet feels comfortable and the photos are unique.",

      cta_title_de: "Shooting f\u00fcr euren Liebling?",
      cta_title_en: "Shoot for your beloved pet?",

      cta_text_de: "Meldet euch einfach bei mir \u2013 erz\u00e4hlt mir von eurem Tier, und wir finden zusammen den perfekten Rahmen f\u00fcr euer Shooting. Ich freu mich auf eure Fellnasen, Samtpfoten und Huftiere!",
      cta_text_en: "Just get in touch \u2013 tell me about your pet and we\u2019ll find the perfect setting for your shoot together. I can\u2019t wait to meet your furry, feathered and hoofed friends!",

      cta_button_de: "Anfrage senden",
      cta_button_en: "Send inquiry"
    }
  };
}

// ----- PORTRAIT -----
function getPortraitPage() {
  return {
    slug: "portrait",
    name: "Portrait",
    content: {
      component: "page_content",

      hero_title_de: "Portrait & Mehr",
      hero_title_en: "Portrait & More",

      hero_subtitle_de: "Authentische Momente",
      hero_subtitle_en: "Authentic Moments",

      intro_de: "Das Leben steckt voller besonderer Momente \u2013 und die meisten davon passieren nicht vor einem perfekt inszenierten Hintergrund, sondern mittendrin im echten Leben. Genau dort bin ich am liebsten. Ob ihr als Paar ein paar gemeinsame Stunden genie\u00dfen wollt, eure Familie festhalten m\u00f6chtet oder einen besonderen Anlass feiert: Ich bin dabei und sorge daf\u00fcr, dass ihr euch vor der Kamera wohlf\u00fchlt. Nat\u00fcrlich, entspannt und mit Bildern, die eure Geschichte erz\u00e4hlen.",
      intro_en: "Life is full of special moments \u2013 and most of them don\u2019t happen in front of a perfectly staged backdrop, but right in the middle of real life. That\u2019s exactly where I love to be. Whether you want to enjoy some time together as a couple, capture your family or celebrate a special occasion: I\u2019m there and make sure you feel comfortable in front of the camera. Natural, relaxed and with images that tell your story.",

      couple_title_de: "Couple Shooting",
      couple_title_en: "Couple Shooting",

      couple_text_de: "Ob frisch verliebt, frisch verlobt oder seit 20 Jahren ein Team \u2013 ein Paarshooting ist eure Zeit. Kein steifes Posieren, sondern gemeinsam lachen, spazieren, einfach ihr sein. Ich gebe euch sanfte Anweisungen, aber die sch\u00f6nsten Momente passieren von ganz allein. Ob in den Bergen bei Sonnenuntergang, in der Altstadt oder an eurem Lieblingsplatz \u2013 wir finden die perfekte Location f\u00fcr eure Geschichte.",
      couple_text_en: "Whether freshly in love, newly engaged or a team for 20 years \u2013 a couple shoot is your time. No stiff posing, just laughing together, walking, simply being yourselves. I give gentle directions, but the best moments happen all on their own. Whether in the mountains at sunset, in the old town or at your favorite spot \u2013 we\u2019ll find the perfect location for your story.",

      family_title_de: "Familie & Taufe",
      family_title_en: "Family & Baptism",

      family_text_de: "Kinder werden so schnell gro\u00df, und die kleinen Momente verfliegen im Alltag. Ein Familienshooting ist eure Chance, innezuhalten und festzuhalten, was wirklich z\u00e4hlt: das Lachen, die Umarmungen, das Chaos \u2013 und die Liebe, die alles zusammenh\u00e4lt. Auch bei Taufen bin ich gerne dabei und dokumentiere diesen besonderen Tag diskret und einf\u00fchlsam.",
      family_text_en: "Kids grow up so fast, and the little moments fly by in everyday life. A family shoot is your chance to pause and capture what truly matters: the laughter, the hugs, the chaos \u2013 and the love that holds it all together. I\u2019m also happy to be there for baptisms, documenting this special day discreetly and sensitively.",

      private_title_de: "Private Anl\u00e4sse",
      private_title_en: "Private Occasions",

      private_text_de: "Ob Geburtstag, Jubil\u00e4um, Firmenevent oder einfach ein Tag, der gefeiert werden soll \u2013 erz\u00e4hlt mir, was ihr vorhabt, und ich k\u00fcmmere mich um die Bilder. Ich passe mich eurem Event an, bleibe unauff\u00e4llig und halte die Momente fest, die den Tag besonders machen. Keine steifen Gruppenfotos, sondern echte Erinnerungen.",
      private_text_en: "Whether birthday, anniversary, corporate event or simply a day worth celebrating \u2013 tell me what you\u2019re planning and I\u2019ll take care of the photos. I adapt to your event, stay unobtrusive and capture the moments that make the day special. No stiff group photos, just real memories.",

      cta_title_de: "Euer Moment, eure Bilder",
      cta_title_en: "Your moment, your images",

      cta_text_de: "Egal ob Paar, Familie oder besonderer Anlass \u2013 schreibt mir einfach, was ihr euch vorstellt. Wir quatschen kurz und planen gemeinsam etwas, das sich f\u00fcr euch richtig anf\u00fchlt.",
      cta_text_en: "Whether couple, family or special occasion \u2013 just tell me what you have in mind. We\u2019ll have a quick chat and plan something together that feels right for you.",

      cta_button_de: "Jetzt anfragen",
      cta_button_en: "Inquire now"
    }
  };
}

// ----- ABOUT -----
function getAboutPage() {
  return {
    slug: "about",
    name: "About",
    content: {
      component: "page_content",

      about_title_de: "\u00dcber mich",
      about_title_en: "About me",

      heading_de: "Ich bin Mario",
      heading_en: "I\u2019m Mario",

      text1_de: "Geboren in Bayern, in Innsbruck h\u00e4ngen geblieben. Mit 15 habe ich meine erste Kamera in der Hand gehabt und bin seitdem nicht mehr davon losgekommen. Aus dem Hobby wurde Leidenschaft, aus der Leidenschaft mein Beruf.",
      text1_en: "Born in Bavaria, settled in Innsbruck. At 15, I held my first camera and never looked back. What started as a hobby became passion, and passion became my profession.",

      text2_de: "Heute begleite ich Hochzeiten so, wie sie sind: echt, ungestellt, voller Gef\u00fchl. Ich mische mich unter die G\u00e4ste, bleibe unauff\u00e4llig und fange die Momente ein, die man nicht inszenieren kann. In der Bearbeitung bekommen eure Bilder einen Hauch Editorial, cineastisch und zeitlos \u2013 Erinnerungen, die euch f\u00fcr immer bleiben.",
      text2_en: "Today I accompany weddings as they are: real, unposed, full of feeling. I mingle with the guests, stay unobtrusive and capture the moments that cannot be staged. In editing, your images get a touch of editorial, cinematic and timeless \u2013 memories that stay with you forever.",

      text3_de: "Neben Hochzeiten fotografiere ich auch Tiere, Paare, Familien und andere besondere Anl\u00e4sse. Was alle meine Arbeiten verbindet: Authentizit\u00e4t und Emotion.",
      text3_en: "Besides weddings, I also photograph animals, couples, families and other special occasions. What connects all my work: authenticity and emotion.",

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

      philosophy3_de: "Pers\u00f6nlich & Nahbar",
      philosophy3_en: "Personal & Approachable",

      philosophy3_text_de: "Ich nehme mir Zeit f\u00fcr euch, lerne euch kennen und begleite euren Tag wie ein Freund.",
      philosophy3_text_en: "I take time for you, get to know you and accompany your day like a friend."
    }
  };
}