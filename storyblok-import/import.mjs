#!/usr/bin/env node
/**
 * Storyblok Bulk Import Script for Mario Schubert Website
 * 
 * Usage:
 *   node import.mjs <PERSONAL_ACCESS_TOKEN> <SPACE_ID>
 * 
 * Example:
 *   node import.mjs your-token-here 291345363485848
 * 
 * Get your token: My Account → Personal access tokens → Generate new token
 * Get your Space ID: it's the number in your Storyblok URL
 */

const TOKEN = process.argv[2];
const SPACE_ID = process.argv[3];

if (!TOKEN || !SPACE_ID) {
  console.error("\n❌ Usage: node import.mjs <PERSONAL_ACCESS_TOKEN> <SPACE_ID>\n");
  console.error("  Get your token: My Account → Personal access tokens");
  console.error("  Get your Space ID: the number in your Storyblok URL\n");
  process.exit(1);
}

const API = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}`;
const HEADERS = {
  "Authorization": TOKEN,
  "Content-Type": "application/json",
};

// Rate limiting: Storyblok allows 3 req/sec on free plan
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function apiCall(method, path, body) {
  const url = `${API}${path}`;
  const opts = { method, headers: HEADERS };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Find folder IDs ───
async function getFolderIds() {
  const { stories } = await apiCall("GET", "/stories?per_page=100&sort_by=name:asc");
  const folders = {};
  for (const s of stories) {
    if (s.is_folder) {
      folders[s.slug] = s.id;
    }
  }
  return folders;
}

// ─── Create a single story ───
async function createStory(parentId, contentType, slug, name, content) {
  try {
    await apiCall("POST", "/stories/", {
      story: {
        name,
        slug,
        parent_id: parentId,
        content: {
          component: contentType,
          ...content,
        },
      },
      publish: 1, // auto-publish
    });
    console.log(`  ✅ ${contentType}/${slug}`);
  } catch (err) {
    console.error(`  ❌ ${contentType}/${slug}: ${err.message}`);
  }
  await delay(400); // rate limit
}

// ═══════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════

const PACKAGES = [
  {
    slug: "essential", name: "ESSENTIAL",
    price: "ab 2.090€",
    subtitle: "Für kleinere Hochzeiten & ruhigere Feiern.",
    subtitle_en: "For smaller weddings & quieter celebrations.",
    features: "6 Stunden fotografische Begleitung\n400 vollständig bearbeitete Bilder\n72h bis zur Sneak Peak (20 Bilder)\nPrivate Nutzungsrechte & Download-Galerie\nAnfahrt im Umkreis von 20 km (um Innsbruck) inklusive\nZusatzstunde je 320€",
    features_en: "6 hours of photography coverage\n400 fully edited images\n72h to sneak peek (20 images)\nPrivate usage rights & download gallery\nTravel within 20 km (around Innsbruck) included\nAdditional hour: 320€ each",
    highlight: false, category: "wedding-photo", sort_order: 1,
  },
  {
    slug: "signature", name: "SIGNATURE",
    price: "ab 2.590€",
    subtitle: "Alle wichtigen Momente.",
    subtitle_en: "All the important moments.",
    features: "8 Stunden fotografische Begleitung\n600 vollständig bearbeitete Bilder\n48h bis zur Sneak Peak (20 Bilder)\nPrivate Nutzungsrechte & Download-Galerie\nAnfahrt im Umkreis von 30 km (um Innsbruck) inklusive\nZusatzstunde je 300€",
    features_en: "8 hours of photography coverage\n600 fully edited images\n48h to sneak peek (20 images)\nPrivate usage rights & download gallery\nTravel within 30 km (around Innsbruck) included\nAdditional hour: 300€ each",
    highlight: true, category: "wedding-photo", sort_order: 2,
  },
  {
    slug: "signature-plus", name: "SIGNATURE PLUS+",
    price: "ab 3.290€",
    subtitle: "Foto, Video & Entertainment.",
    subtitle_en: "Photo, video & entertainment.",
    features: "8 Stunden fotografische Begleitung\n700 vollständig bearbeitete Bilder\nHighlight-Video (90–120 Sek)\ndasSpieglein – Fotospiegel\nZusatzstunde je 300€\nErsparnis gegenüber Einzelbuchung: ca. 400 €",
    features_en: "8 hours of photography coverage\n700 fully edited images\nHighlight video (90–120 sec)\ndasSpieglein – photo mirror\nAdditional hour: 300€ each\nSavings vs. individual booking: approx. 400€",
    highlight: false, category: "wedding-photo", sort_order: 3,
  },
  {
    slug: "classic-wedding", name: "CLASSIC",
    price: "ab 3.090€",
    subtitle: "Mehr Zeit, mehr Momente.",
    subtitle_en: "More time, more moments.",
    features: "10 Stunden fotografische Begleitung\n700 vollständig bearbeitete Bilder\n48h bis zur Sneak Peak (25 Bilder)\nPrivate Nutzungsrechte & Download-Galerie\nAnfahrt im Umkreis von 30 km (um Innsbruck) inklusive\nZusatzstunde je 290€",
    features_en: "10 hours of photography coverage\n700 fully edited images\n48h to sneak peek (25 images)\nPrivate usage rights & download gallery\nTravel within 30 km (around Innsbruck) included\nAdditional hour: 290€ each",
    highlight: false, category: "wedding-photo", sort_order: 4,
  },
  {
    slug: "complete-wedding", name: "COMPLETE",
    price: "ab 3.490€",
    subtitle: "Von Früh bis Spät.",
    subtitle_en: "From dawn to dusk.",
    features: "12 Stunden fotografische Begleitung\n900 vollständig bearbeitete Bilder\n48h bis zur Sneak Peak (30 Bilder)\nPrivate Nutzungsrechte & Download-Galerie\nAnfahrt im Umkreis von 50 km (um Innsbruck) inklusive\nZusatzstunde je 250€",
    features_en: "12 hours of photography coverage\n900 fully edited images\n48h to sneak peek (30 images)\nPrivate usage rights & download gallery\nTravel within 50 km (around Innsbruck) included\nAdditional hour: 250€ each",
    highlight: false, category: "wedding-photo", sort_order: 5,
  },
  {
    slug: "essential-video", name: "ESSENTIAL VIDEO",
    price: "ab 1.500€",
    subtitle: "Die wichtigsten Momente.",
    subtitle_en: "The most important moments.",
    features: "6 Stunden videografische Begleitung\n2–3 Minuten Videolänge (Hoch- oder Querformat)\nFULL-HD Qualität\n1 Musiktitel eurer Wahl\nFarbkorrektur & professioneller Schnitt\nAnfahrt im Umkreis von 20 km inklusive\nZusatzstunde je 200€",
    features_en: "6 hours of videography coverage\n2–3 minute video (portrait or landscape format)\nFULL-HD quality\n1 music track of your choice\nColor correction & professional editing\nTravel within 20 km included\nAdditional hour: 200€ each",
    highlight: false, category: "wedding-video", sort_order: 6,
  },
  {
    slug: "signature-video", name: "SIGNATURE VIDEO",
    price: "ab 2.350€",
    subtitle: "Die umfassende Videobegleitung.",
    subtitle_en: "Comprehensive video coverage.",
    features: "8 Stunden videografische Begleitung\n5–7 Min. Cinematischer Film (Querformat)\n4K Ultra-HD Aufnahmen\n4 Songs eurer Wahl\nDrohnenaufnahmen eurer Location\nAnfahrt im Umkreis von 50 km inklusive\nZusatzstunde je 200€\nOptional: Ton (Stimmen, Reden, Atmosphäre)",
    features_en: "8 hours of videography coverage\n5–7 min cinematic film (landscape format)\n4K Ultra-HD footage\n4 songs of your choice\nDrone footage of your location\nTravel within 50 km included\nAdditional hour: 200€ each\nOptional: audio (voices, speeches, atmosphere)",
    highlight: true, category: "wedding-video", sort_order: 7,
  },
  {
    slug: "complete-video", name: "COMPLETE VIDEO",
    price: "ab 2.900€",
    subtitle: "Die umfassende Videobegleitung.",
    subtitle_en: "The comprehensive video coverage.",
    features: "10–12 Stunden videografische Begleitung\n8–10 Min. Cinematischer Film (Querformat)\n4K Ultra-HD Aufnahmen\n6 Songs eurer Wahl\nUmfangreiche Drohnenaufnahmen eurer Location\nAnfahrt im Umkreis von 50 km inklusive\nZusatzstunde je 200€\nOptional: Gesprochene Worte, Reden oder Gelübde im Film",
    features_en: "10–12 hours of videography coverage\n8–10 min cinematic film (landscape format)\n4K Ultra-HD footage\n6 songs of your choice\nExtensive drone footage of your location\nTravel within 50 km included\nAdditional hour: 200€ each\nOptional: spoken words, speeches or vows in the film",
    highlight: false, category: "wedding-video", sort_order: 8,
  },
  {
    slug: "mini-portrait", name: "MINI",
    price: "190€",
    subtitle: "Perfekt für ein schnelles Shooting",
    subtitle_en: "Perfect for a quick shoot",
    features: "ca. 30 Min. Shooting\n10 bearbeitete Bilder\nOnline-Galerie\n1 Location",
    features_en: "approx. 30 min shoot\n10 edited images\nOnline gallery\n1 location",
    highlight: false, category: "portrait", sort_order: 9,
  },
  {
    slug: "classic-portrait", name: "CLASSIC",
    price: "ab 350€",
    subtitle: "Der Allrounder",
    subtitle_en: "The all-rounder",
    features: "ca. 1 Stunde Shooting\n25 bearbeitete Bilder\nOnline-Galerie\nbis zu 2 Locations\nOutfitwechsel möglich",
    features_en: "approx. 1 hour shoot\n25 edited images\nOnline gallery\nup to 2 locations\nOutfit change possible",
    highlight: true, category: "portrait", sort_order: 10,
  },
  {
    slug: "premium-portrait", name: "PREMIUM",
    price: "ab 550€",
    subtitle: "Für besondere Anlässe",
    subtitle_en: "For special occasions",
    features: "ca. 2 Stunden Shooting\n50+ bearbeitete Bilder\nOnline-Galerie\nMehrere Locations\nOutfitwechsel inklusive\n10 Sneak Peeks binnen 48h",
    features_en: "approx. 2 hour shoot\n50+ edited images\nOnline gallery\nMultiple locations\nOutfit changes included\n10 sneak peeks within 48h",
    highlight: false, category: "portrait", sort_order: 11,
  },
];

const ADDONS = [
  { slug: "after-wedding", name: "After-Wedding-Shooting", text_de: "After-Wedding-Shooting (ca. 3h, 80 Bilder): 520€", text_en: "After-wedding shooting (approx. 3h, 80 images): 520€", sort_order: 1 },
  { slug: "mini-video", name: "Mini-Video", text_de: "Mini-Video: 400€", text_en: "Mini video: 400€", sort_order: 2 },
  { slug: "probe-shooting", name: "Probe-Shooting", text_de: "Probe-Shooting: 200€", text_en: "Trial shooting: 200€", sort_order: 3 },
  { slug: "drohnenaufnahmen", name: "Drohnenaufnahmen", text_de: "Drohnenaufnahmen, 10 Bilder: 200€", text_en: "Drone shots, 10 images: 200€", sort_order: 4 },
  { slug: "plotter", name: "Plotter", text_de: "Plotter: 50€", text_en: "Plotter: 50€", sort_order: 5 },
];

const REVIEWS = [
  { slug: "sarah-thomas", name: "Sarah und Thomas", author: "Sarah & Thomas", rating: 5, text: "Mario hat unsere Hochzeit so eingefangen, wie wir sie erlebt haben – echt, emotional und wunderschön. Wir schauen uns die Bilder immer wieder an und bekommen jedes Mal Gänsehaut.", text_en: "Mario captured our wedding exactly as we experienced it – authentic, emotional and beautiful. We look at the photos again and again and get goosebumps every time.", sort_order: 1 },
  { slug: "julia-markus", name: "Julia und Markus", author: "Julia & Markus", rating: 5, text: "Wir hatten eine kleine Berghochzeit und Mario hat jeden Moment perfekt festgehalten. Er war so unauffällig, dass wir oft vergessen haben, dass er da war – und das merkt man an den Bildern.", text_en: "We had a small mountain wedding and Mario captured every moment perfectly. He was so unobtrusive that we often forgot he was there – and you can see it in the photos.", sort_order: 2 },
  { slug: "lisa-m", name: "Lisa M", author: "Lisa M.", rating: 5, text: "Das Shooting mit unserem Hund war mega! Mario hat so eine ruhige Art, dass selbst unser aufgedrehter Golden Retriever total entspannt war. Die Bilder sind der Wahnsinn.", text_en: "The shoot with our dog was amazing! Mario has such a calm manner that even our hyper Golden Retriever was totally relaxed. The photos are incredible.", sort_order: 3 },
  { slug: "anna-florian", name: "Anna und Florian", author: "Anna & Florian", rating: 5, text: "Das Kombi-Paket aus Foto und Video war die beste Entscheidung! Der Film bringt uns jedes Mal zum Weinen – im besten Sinne.", text_en: "The photo and video combo package was the best decision! The film makes us cry every time – in the best way.", sort_order: 4 },
  { slug: "familie-berger", name: "Familie Berger", author: "Familie Berger", rating: 5, text: "Wir hatten ein Familienshooting mit unseren drei Kindern – ich dachte, das wird Chaos. Aber Mario hat aus dem Chaos die schönsten Momente gezaubert. Absolut empfehlenswert!", text_en: "We had a family shoot with our three kids – I thought it would be chaos. But Mario created the most beautiful moments out of the chaos. Absolutely recommended!", sort_order: 5 },
];

const FAQS = [
  { slug: "stil-beschreiben", name: "Stil beschreiben", question_de: "Wie würdest du deinen Stil beschreiben?", question_en: "How would you describe your style?", answer_de: "Mein Stil ist dokumentarisch, natürlich und unauffällig. Ich fange echte Momente ein, statt steife Posen zu inszenieren. In der Bearbeitung bekommen die Bilder einen zeitlosen, cineastischen Look mit einem Hauch Editorial.", answer_en: "My style is documentary, natural and unobtrusive. I capture real moments instead of staging stiff poses. In post-processing, the images get a timeless, cinematic look with a touch of editorial.", category: "allgemein", sort_order: 1 },
  { slug: "foto-und-video", name: "Foto und Video", question_de: "Bietest du sowohl Fotografie als auch Video an?", question_en: "Do you offer both photography and video?", answer_de: "Ja, du kannst mich für reine Fotografie, reine Videografie oder eine Kombination aus beidem buchen. Der Vorteil: ein Ansprechpartner, ein einheitlicher Stil und perfekt aufeinander abgestimmte Aufnahmen.", answer_en: "Yes, you can book me for photography only, videography only, or a combination of both. The advantage: one point of contact, a consistent style and perfectly coordinated shots.", category: "allgemein", sort_order: 2 },
  { slug: "regionen", name: "Regionen", question_de: "In welchen Regionen bist du tätig?", question_en: "What regions do you cover?", answer_de: "Mein Schwerpunkt liegt in Tirol, Südtirol und Bayern, also rund um Innsbruck, Achensee, Zillertal, Dolomiten, Chiemsee, Tegernsee und München. Für besondere Anlässe reise ich aber auch gerne europaweit und weltweit an.", answer_en: "My focus is on Tyrol, South Tyrol and Bavaria, around Innsbruck, Lake Achensee, Zillertal, Dolomites, Lake Chiemsee, Tegernsee and Munich. For special occasions, I'm happy to travel across Europe and worldwide.", category: "allgemein", sort_order: 3 },
  { slug: "art-von-shootings", name: "Art von Shootings", question_de: "Welche Art von Shootings bietest du an?", question_en: "What types of shoots do you offer?", answer_de: "Neben Hochzeiten fotografiere und filme ich auch Paarshootings, After-Wedding-Shootings, Elopements, Business-Reportagen, Imagefilme und persönliche Projekte. Sprich mich einfach mit deiner Idee an.", answer_en: "Besides weddings, I also photograph and film couple shoots, after-wedding shoots, elopements, business reportages, image films and personal projects. Just reach out with your idea.", category: "allgemein", sort_order: 4 },
  { slug: "arbeit-besonders", name: "Arbeit besonders", question_de: "Was macht deine Arbeit besonders?", question_en: "What makes your work special?", answer_de: "Ich mische mich unter die Leute und bleibe unauffällig, sodass natürliche Emotionen entstehen können. Deine Bilder und Filme werden authentisch, zeitlos und mit viel Liebe zum Detail bearbeitet.", answer_en: "I blend in with the crowd and stay unobtrusive, allowing natural emotions to unfold. Your photos and films are edited authentically, timelessly and with great attention to detail.", category: "allgemein", sort_order: 5 },
  { slug: "alleine-oder-team", name: "Alleine oder Team", question_de: "Arbeitest du alleine oder im Team?", question_en: "Do you work alone or with a team?", answer_de: "In der Regel arbeite ich alleine, was den Tag sehr persönlich und entspannt macht. Für größere Events oder mehrtägige Projekte kann ich auf Wunsch auch eine zweite Person oder spezialisierte Kolleginnen und Kollegen hinzuziehen.", answer_en: "Usually I work alone, which makes the day very personal and relaxed. For larger events or multi-day projects, I can bring in a second person or specialized colleagues upon request.", category: "allgemein", sort_order: 6 },
  { slug: "buchung-ablauf", name: "Buchung Ablauf", question_de: "Wie läuft die Buchung bei dir ab?", question_en: "How does the booking process work?", answer_de: "Du schickst mir eine Anfrage mit Datum, Location und grober Vorstellung. Danach telefonieren oder zoomen wir unverbindlich. Wenn die Chemie passt, erhältst du ein Angebot und einen Vertrag. Mit Unterschrift und Anzahlung ist der Termin verbindlich reserviert.", answer_en: "You send me an inquiry with your date, location and rough idea. Then we have a no-obligation call or video chat. If the chemistry is right, you'll receive a quote and contract. With your signature and deposit, the date is firmly reserved.", category: "buchung", sort_order: 7 },
  { slug: "kennenlerngespraech", name: "Kennenlerngespräch", question_de: "Gibt es ein Kennenlerngespräch?", question_en: "Is there a get-to-know meeting?", answer_de: "Ja, unbedingt. Wir treffen uns per Video-Call oder bei einem Kaffee in der Nähe von Innsbruck. Dort lernst du mich kennen, kannst alle Fragen stellen und wir schauen, ob wir menschlich zusammenpassen.", answer_en: "Yes, absolutely. We meet via video call or over coffee near Innsbruck. There you get to know me, can ask all your questions and we see if we're a good personal fit.", category: "buchung", sort_order: 8 },
  { slug: "wie-frueh-anfragen", name: "Wie früh anfragen", question_de: "Wie früh sollte ich dich anfragen?", question_en: "How far in advance should I inquire?", answer_de: "Je früher, desto besser. Vor allem für beliebte Sommer- und Herbst-Termine buchen viele Paare 9 bis 18 Monate im Voraus. Aber auch kurzfristige Anfragen lohnen sich immer, wenn dein Datum noch frei ist.", answer_en: "The earlier, the better. Especially for popular summer and autumn dates, many couples book 9 to 18 months in advance. But last-minute inquiries are always worthwhile if your date is still available.", category: "buchung", sort_order: 9 },
  { slug: "datum-reservieren", name: "Datum reservieren", question_de: "Reservierst du mein Datum, während ich noch überlege?", question_en: "Do you hold my date while I'm still deciding?", answer_de: "Nach unserem Erstgespräch kann ich dein Datum für ein paar Tage unverbindlich vormerken. Erst mit Vertrag und Anzahlung ist der Termin fix gebucht. Bei Parallelanfragen informiere ich dich transparent.", answer_en: "After our initial conversation, I can tentatively hold your date for a few days. Only with a contract and deposit is the date firmly booked. If there are parallel inquiries, I'll let you know transparently.", category: "buchung", sort_order: 10 },
  { slug: "krank-werden", name: "Krank werden", question_de: "Was passiert, wenn du an meinem Termin krank wirst?", question_en: "What happens if you get sick on my date?", answer_de: "Ich habe ein Netzwerk an professionellen Kolleginnen und Kollegen in Tirol, Bayern und darüber hinaus. Sollte ich wider Erwarten ernsthaft ausfallen, organisiere ich gleichwertigen Ersatz. Die bereits vereinbarten Konditionen bleiben für dich dabei bestehen.", answer_en: "I have a network of professional colleagues in Tyrol, Bavaria and beyond. Should I unexpectedly be unable to attend, I'll organize an equivalent replacement. The agreed-upon conditions remain the same for you.", category: "buchung", sort_order: 11 },
  { slug: "mehrere-termine", name: "Mehrere Termine", question_de: "Machst du mehrere Termine an einem Tag?", question_en: "Do you do multiple bookings in one day?", answer_de: "Nein. Pro Tag begleite ich nur ein Event oder Shooting. So kannst du sicher sein, dass meine komplette Aufmerksamkeit dir und deinem Projekt gehört.", answer_en: "No. I only cover one event or shoot per day. This way you can be sure that my complete attention belongs to you and your project.", category: "buchung", sort_order: 12 },
  { slug: "welche-pakete", name: "Welche Pakete", question_de: "Welche Pakete bietest du an?", question_en: "What packages do you offer?", answer_de: "Ich biete verschiedene Pakete je nach Dauer, Umfang und Kombination aus Foto und Video an. Von kurzen Standesamts-Begleitungen über ganztägige Reportagen bis hin zu individuellen Projekten. Eine Übersicht findest du auf der Website oder im persönlichen Angebot.", answer_en: "I offer various packages depending on duration, scope and combination of photo and video. From short civil ceremony coverage to full-day reportages to individual projects. You'll find an overview on the website or in a personal quote.", category: "pakete", sort_order: 13 },
  { slug: "pakete-anpassen", name: "Pakete anpassen", question_de: "Kann man deine Pakete individuell anpassen?", question_en: "Can your packages be customized?", answer_de: "Ja. Die Pakete sind eine gute Orientierung, können aber flexibel an deine Pläne angepasst werden. Zum Beispiel längere Begleitung, zusätzliche Locations oder spezielle Extras.", answer_en: "Yes. The packages are a good starting point but can be flexibly adapted to your plans. For example, longer coverage, additional locations or special extras.", category: "pakete", sort_order: 14 },
  { slug: "preisspanne", name: "Preisspanne", question_de: "In welcher Preisspanne liegen deine Leistungen?", question_en: "What is your price range?", answer_de: "Meine Reportagen und Shootings liegen je nach Dauer, Umfang und ob Foto, Video oder beides im Bereich von etwa 2.500 bis 3.500 Euro und darüber. Eine detaillierte Übersicht der Pakete bekommst du im persönlichen Angebot.", answer_en: "My reportages and shoots range from about 2,500 to 3,500 euros and above, depending on duration, scope and whether it's photo, video or both. You'll get a detailed package overview in a personal quote.", category: "pakete", sort_order: 15 },
  { slug: "bezahlung", name: "Bezahlung", question_de: "Wie funktioniert die Bezahlung?", question_en: "How does payment work?", answer_de: "Mit Vertragsabschluss wird eine Anzahlung fällig, um deinen Termin verbindlich zu reservieren. Der Restbetrag wird in der Regel nach dem Shooting oder Event per Rechnung fällig und kann per Überweisung bezahlt werden.", answer_en: "A deposit is due upon signing the contract to firmly reserve your date. The remaining balance is usually due after the shoot or event via invoice and can be paid by bank transfer.", category: "pakete", sort_order: 16 },
  { slug: "anzahlung", name: "Anzahlung", question_de: "Gibt es eine Anzahlung und wie hoch ist sie?", question_en: "Is there a deposit and how much is it?", answer_de: "Ja, zur Fixierung deines Datums berechne ich eine Anzahlung, die üblicherweise zwischen 30 und 40 Prozent des Gesamtbetrags liegt. Die genaue Höhe steht transparent im Angebot und im Vertrag.", answer_en: "Yes, to secure your date I charge a deposit that is usually between 30 and 40 percent of the total amount. The exact amount is transparently stated in the quote and contract.", category: "pakete", sort_order: 17 },
  { slug: "bilder-bearbeitung-enthalten", name: "Bilder und Bearbeitung enthalten", question_de: "Sind im Preis alle Bilder und die Bearbeitung enthalten?", question_en: "Are all photos and editing included in the price?", answer_de: "In meinen Paketen sind die fotografische oder filmische Begleitung, die sorgfältige Auswahl, professionelle Bearbeitung und die Bereitstellung der finalen Dateien in einer Onlinegalerie enthalten. Eventuelle Zusatzprodukte wie Alben, Prints oder zusätzliche Leistungen buchst du bei Bedarf separat.", answer_en: "My packages include the photographic or film coverage, careful selection, professional editing and delivery of final files in an online gallery. Optional extras like albums, prints or additional services can be booked separately.", category: "pakete", sort_order: 18 },
  { slug: "anfahrt-kosten", name: "Anfahrt Kosten", question_de: "Fallen zusätzliche Kosten für Anfahrt oder Übernachtung an?", question_en: "Are there additional costs for travel or accommodation?", answer_de: "Im Umkreis von etwa 100 Kilometern um Innsbruck ist die Anfahrt meist inklusive. Darüber hinaus berechne ich transparente Kilometersätze oder Reise- und Übernachtungskosten. Diese werden vor der Buchung klar mit dir abgestimmt.", answer_en: "Within about 100 kilometers of Innsbruck, travel is usually included. Beyond that, I charge transparent mileage rates or travel and accommodation costs. These are clearly agreed with you before booking.", category: "pakete", sort_order: 19 },
  { slug: "ratenzahlung", name: "Ratenzahlung", question_de: "Bietest du Ratenzahlung an?", question_en: "Do you offer installment payments?", answer_de: "In Absprache sind auch Teilzahlungen möglich, zum Beispiel in zwei bis drei Raten bis zur finalen Lieferung. Sprich mich einfach darauf an, dann finden wir eine faire Lösung.", answer_en: "Installment payments are possible by arrangement, for example in two to three installments until final delivery. Just ask me about it and we'll find a fair solution.", category: "pakete", sort_order: 20 },
  { slug: "shooting-ablauf", name: "Shooting Ablauf", question_de: "Wie läuft ein Shooting mit dir konkret ab?", question_en: "How does a shoot with you actually work?", answer_de: "Wir besprechen vorab den Ablauf, die Location und deine Wünsche. Am Tag selbst halte ich mich im Hintergrund und fange die wichtigsten Momente und viele kleine Details ein. Du bekommst einfache, natürliche Anweisungen, damit du dich nie steif oder unsicher fühlst.", answer_en: "We discuss the schedule, location and your wishes in advance. On the day itself, I stay in the background and capture the most important moments and many small details. You get simple, natural directions so you never feel stiff or unsure.", category: "vorbereitung", sort_order: 21 },
  { slug: "location-auswahl", name: "Location Auswahl", question_de: "Hilfst du bei der Auswahl der Location?", question_en: "Do you help with choosing the location?", answer_de: "Ja, gerne. Ich kenne viele Spots in Tirol, Bayern und den Bergen und kann dir je nach Licht, Jahreszeit und Zeitplan passende Orte vorschlagen. Wichtig ist mir, dass du dich dort wohlfühlst und wir genug Ruhe haben.", answer_en: "Yes, gladly. I know many spots in Tyrol, Bavaria and the mountains and can suggest suitable locations depending on light, season and schedule. What's important to me is that you feel comfortable there and we have enough peace.", category: "vorbereitung", sort_order: 22 },
  { slug: "dauer-einplanen", name: "Dauer einplanen", question_de: "Wie lange sollte ich für ein Shooting einplanen?", question_en: "How much time should I plan for a shoot?", answer_de: "Für ein entspanntes Paarshooting oder Portraitshooting plane ich in der Regel 30 bis 45 Minuten ein. Wenn du mehrere Locations möchtest oder wir in die Berge fahren, kann etwas mehr Zeit sinnvoll sein.", answer_en: "For a relaxed couple or portrait shoot, I usually plan 30 to 45 minutes. If you want multiple locations or we're heading to the mountains, a bit more time may be useful.", category: "vorbereitung", sort_order: 23 },
  { slug: "mitbringen", name: "Mitbringen", question_de: "Was soll ich zum Shooting mitbringen?", question_en: "What should I bring to the shoot?", answer_de: "Eigentlich nur dich selbst und gute Laune. Wenn du möchtest, kannst du kleine persönliche Dinge einbauen wie Briefe, Erinnerungsstücke oder besondere Accessoires. Wichtiger sind bequeme Schuhe für Wege zwischen Locations.", answer_en: "Really just yourself and a good mood. If you want, you can incorporate small personal items like letters, memorabilia or special accessories. More important are comfortable shoes for walks between locations.", category: "vorbereitung", sort_order: 24 },
  { slug: "anweisungen", name: "Anweisungen", question_de: "Gibst du Anweisungen beim Fotografieren?", question_en: "Do you give directions during the shoot?", answer_de: "Ich lasse dir viel Raum, so zu sein, wie du bist, und gebe nur leichte Hilfestellungen für Licht, Haltung oder Bewegung. Du bekommst einfache, natürliche Anweisungen, damit du dich nie steif oder unsicher fühlst.", answer_en: "I give you plenty of space to be yourself and only provide light guidance for lighting, posture or movement. You get simple, natural directions so you never feel stiff or unsure.", category: "vorbereitung", sort_order: 25 },
  { slug: "unsicher-vor-kamera", name: "Unsicher vor Kamera", question_de: "Was ist, wenn ich vor der Kamera unsicher bin?", question_en: "What if I'm nervous in front of the camera?", answer_de: "Das geht fast allen so. Nach wenigen Minuten vergisst du die Kamera meistens. Durch meine ruhige Art, kleine Aufgaben und Bewegung wird das Shooting eher wie ein Spaziergang als eine steife Fotosession.", answer_en: "Almost everyone feels that way. After a few minutes, you usually forget about the camera. Through my calm nature, small tasks and movement, the shoot feels more like a walk than a stiff photo session.", category: "vorbereitung", sort_order: 26 },
  { slug: "schlechtes-wetter", name: "Schlechtes Wetter", question_de: "Was passiert bei schlechtem Wetter?", question_en: "What happens in bad weather?", answer_de: "Regen ist kein Problem, gute Bilder entstehen bei jedem Wetter. Wir suchen überdachte Orte, nutzen vorhandenes Licht oder ziehen das Shooting flexibel etwas vor oder nach. Ich habe immer Ideen für Plan B und C im Kopf.", answer_en: "Rain is no problem, great photos can be taken in any weather. We look for sheltered spots, use available light or flexibly reschedule the shoot slightly. I always have ideas for Plan B and C in mind.", category: "vorbereitung", sort_order: 27 },
  { slug: "fotos-bearbeiten", name: "Fotos bearbeiten", question_de: "Wie bearbeitest du die Fotos?", question_en: "How do you edit the photos?", answer_de: "Alle ausgewählten Bilder werden von mir sorgfältig farb- und lichtoptimiert und in meinem charakteristischen Look bearbeitet. Hauttöne bleiben natürlich, Kontraste und Farben sind zeitlos und nicht zu extrem.", answer_en: "All selected images are carefully color and light optimized by me and edited in my characteristic look. Skin tones remain natural, contrasts and colors are timeless and not too extreme.", category: "bearbeitung", sort_order: 28 },
  { slug: "retusche", name: "Retusche", question_de: "Retuschierst du auch Haut oder Details?", question_en: "Do you also retouch skin or details?", answer_de: "Störende Kleinigkeiten wie kleine Hautunreinheiten, Pickel oder Ablenkungen im Hintergrund retuschiere ich dezent. Größere Beauty-Retuschen übernehme ich auf Wunsch und nach Absprache.", answer_en: "Minor distractions like small blemishes, pimples or background distractions are subtly retouched. Larger beauty retouching is done upon request and by arrangement.", category: "bearbeitung", sort_order: 29 },
  { slug: "raw-dateien", name: "RAW Dateien", question_de: "Bekomme ich auch unbearbeitete RAW-Dateien?", question_en: "Can I also get unedited RAW files?", answer_de: "Nein. Die Auswahl und Bearbeitung gehören zu meinem kreativen Prozess und sind ein wichtiger Teil meines Stils. Du erhältst hochauflösende, fertig bearbeitete Dateien, die du privat frei nutzen kannst.", answer_en: "No. The selection and editing are part of my creative process and an important part of my style. You receive high-resolution, fully edited files that you can use freely for personal purposes.", category: "bearbeitung", sort_order: 30 },
  { slug: "bearbeitungsstil", name: "Bearbeitungsstil", question_de: "Kann ich den Bearbeitungsstil mitbestimmen?", question_en: "Can I influence the editing style?", answer_de: "Du buchst mich wegen meines Stils, den du in meinen Portfolios siehst. Kleinere Wünsche wie etwas hellere oder etwas kontrastreichere Bearbeitung können wir im Rahmen meines Looks gerne berücksichtigen.", answer_en: "You book me because of my style that you see in my portfolios. Minor preferences like slightly brighter or more contrasty editing can be accommodated within my look.", category: "bearbeitung", sort_order: 31 },
  { slug: "anzahl-bilder", name: "Anzahl Bilder", question_de: "Wie viele Bilder bekomme ich ungefähr?", question_en: "Approximately how many photos will I receive?", answer_de: "Die Anzahl hängt von Dauer und Ablauf ab. Rechne grob mit 50 bis 80 fertigen Bildern pro gebuchter Stunde. Wichtiger als die reine Zahl ist mir eine runde Story ohne Wiederholungen.", answer_en: "The number depends on duration and schedule. Roughly expect 50 to 80 finished images per booked hour. More important to me than the sheer number is a complete story without repetitions.", category: "bearbeitung", sort_order: 32 },
  { slug: "fotos-dauer", name: "Fotos Dauer", question_de: "Wie lange dauert es, bis ich die Fotos bekomme?", question_en: "How long until I receive the photos?", answer_de: "Je nach Saison beträgt die Bearbeitungszeit in der Regel 4 bis 8 Wochen. Eine kleine Preview mit ausgewählten Highlight-Bildern bekommst du oft schon innerhalb weniger Tage nach dem Shooting.", answer_en: "Depending on the season, editing time is usually 4 to 8 weeks. A small preview with selected highlight images is often available within a few days after the shoot.", category: "lieferung", sort_order: 33 },
  { slug: "bilder-erhalten", name: "Bilder erhalten", question_de: "Wie erhalte ich die Bilder und Videos?", question_en: "How do I receive the photos and videos?", answer_de: "Du bekommst eine passwortgeschützte Onlinegalerie, in der du deine Bilder in voller Auflösung herunterladen und mit Familie und Freunden teilen kannst. Videos erhältst du als Download-Link in hoher Qualität und auf Wunsch zusätzlich auf USB-Stick.", answer_en: "You receive a password-protected online gallery where you can download your images in full resolution and share them with family and friends. Videos are delivered as a high-quality download link and optionally on a USB stick.", category: "lieferung", sort_order: 34 },
  { slug: "fotos-privat-nutzen", name: "Fotos privat nutzen", question_de: "Darf ich die Fotos frei privat nutzen und teilen?", question_en: "Can I freely use and share the photos privately?", answer_de: "Ja, für private Zwecke darfst du deine Bilder frei nutzen: ausdrucken, Fotobücher erstellen und auf Social Media teilen. Bei Veröffentlichungen mit Dienstleister-Tags freue ich mich über eine Nennung meines Namens oder einen Link.", answer_en: "Yes, for private purposes you can freely use your images: print them, create photo books and share on social media. For publications with vendor tags, I appreciate a mention of my name or a link.", category: "lieferung", sort_order: 35 },
  { slug: "bilder-fuer-website", name: "Bilder für Website", question_de: "Verwendest du meine Bilder für deine Website oder Social Media?", question_en: "Do you use my photos for your website or social media?", answer_de: "Ich zeige ausgewählte Projekte gerne auf meiner Website, in Portfolios und auf Social Media. Wenn du das nicht möchtest, sprechen wir das vorab ab und halten es im Vertrag fest.", answer_en: "I like to showcase selected projects on my website, in portfolios and on social media. If you prefer otherwise, we discuss it in advance and note it in the contract.", category: "lieferung", sort_order: 36 },
  { slug: "alben-prints", name: "Alben Prints", question_de: "Gibt es auch Alben oder Prints bei dir?", question_en: "Do you also offer albums or prints?", answer_de: "Ja, auf Wunsch gestalte ich hochwertige Fine-Art-Alben und Prints, die perfekt zu deinem Stil passen. Du kannst diese direkt bei der Buchung oder auch nach dem Shooting noch bestellen.", answer_en: "Yes, upon request I design high-quality fine art albums and prints that perfectly match your style. You can order these when booking or even after the shoot.", category: "lieferung", sort_order: 37 },
  { slug: "video-arten", name: "Video Arten", question_de: "Welche Arten von Videos bietest du an?", question_en: "What types of videos do you offer?", answer_de: "Ich produziere emotionale Highlight-Filme, die deine Geschichte in wenigen Minuten erzählen, sowie auf Wunsch längere, dokumentarischere Filme mit Reden und Originalton. Im Gespräch klären wir, welche Variante besser zu dir passt.", answer_en: "I produce emotional highlight films that tell your story in just a few minutes, as well as longer, more documentary-style films with speeches and original audio upon request. We'll discuss which option suits you best.", category: "video", sort_order: 38 },
  { slug: "film-laenge", name: "Film Länge", question_de: "Wie lang ist ein typischer Film?", question_en: "How long is a typical film?", answer_de: "Ein Highlight-Film ist meist 5 bis 8 Minuten lang und fasst deinen Tag emotional zusammen. Längere Filme mit mehr Originalton, Reden und Zeremonie können 15 bis 30 Minuten oder mehr dauern, je nach gebuchtem Umfang.", answer_en: "A highlight film is usually 5 to 8 minutes long and emotionally summarizes your day. Longer films with more original audio, speeches and ceremony can be 15 to 30 minutes or more, depending on the booked scope.", category: "video", sort_order: 39 },
  { slug: "originalton", name: "Originalton", question_de: "Nimmst du auch Originalton wie Gelübde und Reden auf?", question_en: "Do you also record original audio like vows and speeches?", answer_de: "Ja, wichtiger Originalton wie Gelübde, Ansprachen oder Musik wird mit externen Mikrofonen aufgenommen und in den Film integriert. So hörst du später nicht nur die Bilder, sondern auch die Stimmen und Emotionen.", answer_en: "Yes, important original audio like vows, speeches or music is recorded with external microphones and integrated into the film. This way you'll later not only see the images but also hear the voices and emotions.", category: "video", sort_order: 40 },
  { slug: "drohnenaufnahmen-faq", name: "Drohnenaufnahmen", question_de: "Sind Drohnenaufnahmen möglich?", question_en: "Are drone shots possible?", answer_de: "Wenn Location, Wetter und rechtliche Rahmenbedingungen es zulassen, setze ich gerne Drohnenaufnahmen ein. Vor Ort prüfe ich, ob Flüge erlaubt und sicher sind und halte mich strikt an die gesetzlichen Vorgaben.", answer_en: "When location, weather and legal conditions allow, I'm happy to use drone footage. On site, I check whether flights are permitted and safe, and strictly adhere to legal regulations.", category: "video", sort_order: 41 },
  { slug: "musikwuensche", name: "Musikwünsche", question_de: "Kann ich Musikwünsche für den Film äußern?", question_en: "Can I suggest music for the film?", answer_de: "Ja, du kannst mir gerne deinen Musikgeschmack und Lieblingssongs nennen. Aus lizenzrechtlichen Gründen verwende ich jedoch in der Regel lizensierte Musik, die zum Stil deines Films passt.", answer_en: "Yes, feel free to share your music taste and favorite songs. For licensing reasons, I typically use licensed music that matches the style of your film.", category: "video", sort_order: 42 },
  { slug: "vertrag", name: "Vertrag", question_de: "Gibt es einen Vertrag?", question_en: "Is there a contract?", answer_de: "Ja, wir schließen immer einen schriftlichen Vertrag ab. Darin sind Leistungen, Zeiten, Preise, Zahlungsplan, Nutzungsrechte und Stornobedingungen klar geregelt, damit beide Seiten Planungssicherheit haben.", answer_en: "Yes, we always sign a written contract. It clearly outlines services, times, prices, payment plan, usage rights and cancellation terms, giving both sides planning security.", category: "storno", sort_order: 43 },
  { slug: "termin-verschieben", name: "Termin verschieben", question_de: "Was passiert, wenn ich meinen Termin verschieben muss?", question_en: "What happens if I need to reschedule?", answer_de: "Wenn dein neuer Termin noch frei ist, verschieben wir deine Buchung unkompliziert. Bereits geleistete Anzahlungen werden in der Regel auf den neuen Termin übertragen. Details dazu stehen in den Verschiebungsbedingungen im Vertrag.", answer_en: "If your new date is still available, we'll reschedule your booking without hassle. Deposits already paid are typically transferred to the new date. Details are in the rescheduling terms in the contract.", category: "storno", sort_order: 44 },
  { slug: "stornobedingungen", name: "Stornobedingungen", question_de: "Wie sind deine Stornobedingungen?", question_en: "What are your cancellation terms?", answer_de: "Die genauen Stornobedingungen hängen vom Zeitpunkt der Absage ab und sind im Vertrag transparent festgehalten. Grundsätzlich gilt: Je kurzfristiger eine Stornierung, desto höher ist der Anteil der vereinbarten Gage, der fällig wird.", answer_en: "The exact cancellation terms depend on the timing of the cancellation and are transparently documented in the contract. Generally: the shorter notice given, the higher the portion of the agreed fee that is due.", category: "storno", sort_order: 45 },
  { slug: "ablauf-aendert-sich", name: "Ablauf ändert sich", question_de: "Was ist, wenn sich mein Ablauf stark ändert?", question_en: "What if my schedule changes significantly?", answer_de: "Kleinere Änderungen sind kein Problem. Wenn sich Dauer oder Umfang deutlich verändern, passen wir das Paket und das Honorar fair an. Wichtig ist, dass du mich rechtzeitig informierst, damit ich mich organisatorisch darauf einstellen kann.", answer_en: "Minor changes are no problem. If the duration or scope changes significantly, we'll fairly adjust the package and fee. What matters is that you inform me in time so I can organize accordingly.", category: "storno", sort_order: 46 },
  { slug: "versichert", name: "Versichert", question_de: "Bist du versichert?", question_en: "Are you insured?", answer_de: "Ich arbeite mit einer Berufshaftpflichtversicherung. Für Schäden an deiner Location oder an Gästen ist in der Regel die Veranstalter- oder Haftpflichtversicherung zuständig. Bei Fragen dazu helfe ich dir gerne weiter.", answer_en: "I carry professional liability insurance. For damage to your venue or guests, the event organizer's or liability insurance is typically responsible. I'm happy to help with any questions about this.", category: "storno", sort_order: 47 },
  { slug: "hochzeitstag-dauer", name: "Hochzeitstag Dauer", question_de: "Wie lange bist du am Hochzeitstag vor Ort?", question_en: "How long are you on site on the wedding day?", answer_de: "Das hängt von deinem gebuchten Paket ab. In der Regel begleite ich Hochzeiten zwischen 6 und 10 Stunden. Für mehrtägige Feiern oder Destination Weddings sind auch längere Begleitungen möglich.", answer_en: "That depends on your booked package. I typically cover weddings for 6 to 10 hours. For multi-day celebrations or destination weddings, longer coverage is also possible.", category: "hochzeit", sort_order: 48 },
  { slug: "zeitplan-planung", name: "Zeitplan Planung", question_de: "Kannst du uns bei der Planung des Zeitplans helfen?", question_en: "Can you help us plan the timeline?", answer_de: "Ja, sehr gerne. Ich habe viele Hochzeiten begleitet und weiß, wie viel Zeit realistisch für Trauung, Gratulation, Gruppenfotos und Paarshooting einzuplanen ist. Wir gehen deinen Ablauf im Vorgespräch gemeinsam durch.", answer_en: "Yes, very gladly. I've covered many weddings and know how much time to realistically plan for the ceremony, congratulations, group photos and couple shoot. We'll go through your schedule together in advance.", category: "hochzeit", sort_order: 49 },
  { slug: "kleine-hochzeiten", name: "Kleine Hochzeiten Elopements", question_de: "Begleitest du auch sehr kleine Hochzeiten oder Elopements?", question_en: "Do you also cover small weddings or elopements?", answer_de: "Ja, ich liebe intime Trauungen genauso wie große Feiern. Für Elopements in den Bergen oder standesamtliche Trauungen im kleinen Kreis habe ich eigene, kompaktere Pakete.", answer_en: "Yes, I love intimate ceremonies just as much as large celebrations. For mountain elopements or small civil ceremonies, I have dedicated, more compact packages.", category: "hochzeit", sort_order: 50 },
  { slug: "destination-weddings", name: "Destination Weddings", question_de: "Reist du auch für Destination Weddings an?", question_en: "Do you also travel for destination weddings?", answer_de: "Ja, ich begleite euch nicht nur in Tirol und Bayern, sondern auch europaweit und weltweit. Ob Berge, See, Stadt oder Ausland, wir klären Anreise, Übernachtung und eventuelle Reisetage einfach im Vorfeld.", answer_en: "Yes, I'll accompany you not only in Tyrol and Bavaria, but also across Europe and worldwide. Whether mountains, lake, city or abroad, we simply clarify travel, accommodation and any travel days in advance.", category: "hochzeit", sort_order: 51 },
  { slug: "spieglein", name: "Spieglein", question_de: "Was ist das Spieglein?", question_en: "What is the Spieglein (photo mirror)?", answer_de: "Das Spieglein ist ein moderner Fotospiegel für eure Hochzeit. Stilvoll, interaktiv und ein echtes Highlight für eure Gäste. Kein Plastik-Kasten, sondern ein Spiegel, der aussieht, als gehöre er zur Deko. Wenn du bei mir eine Fotobegleitung buchst, bekommst du das Spieglein zum Vorzugspreis.", answer_en: "The Spieglein is a modern photo mirror for your wedding. Stylish, interactive and a real highlight for your guests. Not a plastic box, but a mirror that looks like it belongs to the decor. When you book photo coverage with me, you get the Spieglein at a preferential rate.", category: "hochzeit", sort_order: 52 },
  { slug: "ausruestung", name: "Ausrüstung", question_de: "Mit welcher Ausrüstung arbeitest du?", question_en: "What equipment do you use?", answer_de: "Ich arbeite mit professioneller Vollformat-Kamera-Ausrüstung, hochwertigen Festbrennweiten und lichtstarken Objektiven. Für Videos nutze ich 4K-Kameras, externe Mikrofone und Stabilisatoren. Backup-Equipment ist immer dabei.", answer_en: "I work with professional full-frame camera equipment, high-quality prime lenses and fast aperture lenses. For videos, I use 4K cameras, external microphones and stabilizers. Backup equipment is always with me.", category: "technik", sort_order: 53 },
  { slug: "backup-equipment", name: "Backup Equipment", question_de: "Hast du Backup-Equipment dabei?", question_en: "Do you bring backup equipment?", answer_de: "Ja, immer. Ich habe eine zweite Kamera, zusätzliche Objektive, Akkus, Speicherkarten und Beleuchtung dabei. So bin ich für jede Situation vorbereitet und du musst dir keine Sorgen machen.", answer_en: "Yes, always. I carry a second camera, additional lenses, batteries, memory cards and lighting. This way I'm prepared for any situation and you don't have to worry.", category: "technik", sort_order: 54 },
  { slug: "datensicherung", name: "Datensicherung", question_de: "Wie sicherst du meine Daten?", question_en: "How do you back up my data?", answer_de: "Alle Aufnahmen werden sofort auf mehreren Speicherkarten gleichzeitig gespeichert. Nach dem Shooting werden sie auf externe Festplatten und in der Cloud gesichert. Deine Daten sind jederzeit geschützt.", answer_en: "All recordings are immediately saved on multiple memory cards simultaneously. After the shoot, they are backed up to external hard drives and the cloud. Your data is protected at all times.", category: "technik", sort_order: 55 },
];

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════

async function main() {
  console.log("\n🚀 Storyblok Import für Mario Schubert Website\n");
  console.log(`   Space ID: ${SPACE_ID}`);
  console.log(`   API: ${API}\n`);

  // 1. Get folder IDs
  console.log("📁 Suche Ordner...");
  const folders = await getFolderIds();
  console.log("   Gefunden:", Object.keys(folders).join(", "));

  const required = ["packages", "addons", "reviews", "faqs"];
  for (const f of required) {
    if (!folders[f]) {
      console.error(`\n❌ Ordner "${f}" nicht gefunden! Bitte zuerst in Storyblok anlegen.\n`);
      process.exit(1);
    }
  }

  // 2. Import Packages
  console.log(`\n📦 Importiere ${PACKAGES.length} Pakete...`);
  for (const pkg of PACKAGES) {
    const { slug, name, ...content } = pkg;
    await createStory(folders["packages"], "package", slug, name, content);
  }

  // 3. Import Addons
  console.log(`\n➕ Importiere ${ADDONS.length} Add-ons...`);
  for (const addon of ADDONS) {
    const { slug, name, ...content } = addon;
    await createStory(folders["addons"], "addon", slug, name, content);
  }

  // 4. Import Reviews
  console.log(`\n⭐ Importiere ${REVIEWS.length} Reviews...`);
  for (const review of REVIEWS) {
    const { slug, name, ...content } = review;
    await createStory(folders["reviews"], "review", slug, name, content);
  }

  // 5. Import FAQs
  console.log(`\n❓ Importiere ${FAQS.length} FAQs...`);
  for (const faq of FAQS) {
    const { slug, name, ...content } = faq;
    await createStory(folders["faqs"], "faq_item", slug, name, content);
  }

  console.log("\n✅ Import abgeschlossen!\n");
  console.log("Nächste Schritte:");
  console.log("  1. Prüfe die Inhalte in Storyblok (Content → Ordner durchklicken)");
  console.log("  2. Hol dir den Preview/Public Access Token (Settings → Access Tokens)");
  console.log("  3. Setze VITE_STORYBLOK_TOKEN in .env und Vercel");
  console.log("  4. Teste lokal mit npm run dev\n");
}

main().catch((err) => {
  console.error("\n💥 Fehler:", err.message, "\n");
  process.exit(1);
});
