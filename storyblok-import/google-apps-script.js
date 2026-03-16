var STORYBLOK_TOKEN = "6ckj1yKfyg2d2Z4hDOiE4gtt-152995764856836-T_JbzD6xTWwcpfZuMnFR";
var SPACE_ID = "291045863485848";
var API_BASE = "https://mapi.storyblok.com/v1/spaces/" + SPACE_ID;

function testVerbindung() {
  Logger.log("Teste Storyblok Verbindung...");
  Logger.log("API Base: " + API_BASE);
  Logger.log("Token: " + STORYBLOK_TOKEN.substring(0, 5) + "...");

  try {
    var response = UrlFetchApp.fetch(API_BASE + "/stories/?per_page=5", {
      method: "get",
      headers: {
        "Authorization": STORYBLOK_TOKEN,
        "Content-Type": "application/json"
      },
      muteHttpExceptions: true
    });

    var code = response.getResponseCode();
    var body = response.getContentText();
    Logger.log("HTTP Status: " + code);

    if (code === 200) {
      var data = JSON.parse(body);
      Logger.log("Verbindung OK! Stories: " + (data.stories || []).length);
      for (var i = 0; i < (data.stories || []).length; i++) {
        var s = data.stories[i];
        Logger.log((s.is_folder ? "ORDNER " : "STORY  ") + s.full_slug + " (ID: " + s.id + ")");
      }
    } else {
      Logger.log("FEHLER! Response: " + body.substring(0, 500));
    }
  } catch (error) {
    Logger.log("Netzwerkfehler: " + error.message);
  }
}

function storyblokAPI(method, path, payload) {
  var options = {
    method: method,
    headers: {
      "Authorization": STORYBLOK_TOKEN,
      "Content-Type": "application/json"
    },
    muteHttpExceptions: true
  };
  if (payload) {
    options.payload = JSON.stringify(payload);
  }

  var response;
  try {
    response = UrlFetchApp.fetch(API_BASE + path, options);
  } catch (e) {
    Logger.log("Netzwerkfehler: " + e.message);
    return null;
  }

  var code = response.getResponseCode();

  if (code === 429) {
    Utilities.sleep(2000);
    return storyblokAPI(method, path, payload);
  }

  if (code >= 400) {
    Logger.log("Fehler " + code + ": " + response.getContentText().substring(0, 300));
    return null;
  }

  return JSON.parse(response.getContentText());
}

function getFolderIds() {
  var folders = {};
  var page = 1;
  while (true) {
    var result = storyblokAPI("GET", "/stories/?per_page=100&page=" + page, null);
    if (!result || !result.stories || result.stories.length === 0) break;
    for (var i = 0; i < result.stories.length; i++) {
      var s = result.stories[i];
      if (s.is_folder) {
        folders[s.slug] = s.id;
      }
    }
    if (result.stories.length < 100) break;
    page++;
    Utilities.sleep(350);
  }
  return folders;
}

function createStory(parentId, contentType, slug, name, content) {
  var storyContent = { component: contentType };
  var keys = Object.keys(content);
  for (var i = 0; i < keys.length; i++) {
    storyContent[keys[i]] = content[keys[i]];
  }

  var payload = {
    story: {
      name: name,
      slug: slug,
      parent_id: parentId,
      content: storyContent
    },
    publish: 1
  };

  var result = storyblokAPI("POST", "/stories/", payload);
  if (result) {
    Logger.log("OK: " + name);
  }
  Utilities.sleep(400);
  return result;
}

function toSlug(text) {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[€]/g, "eur")
    .replace(/[+]/g, "plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

function importPackages(folderId) {
  var tabs = [
    { tabName: "Hochzeit Foto", category: "wedding-photo" },
    { tabName: "Hochzeit Video", category: "wedding-video" },
    { tabName: "Portrait", category: "portrait" },
    { tabName: "Tiere", category: "animals" }
  ];

  var sortOrder = 1;
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  for (var t = 0; t < tabs.length; t++) {
    var sheet = ss.getSheetByName(tabs[t].tabName);
    if (!sheet) {
      Logger.log("Tab nicht gefunden: " + tabs[t].tabName);
      continue;
    }

    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) continue;

    Logger.log(tabs[t].tabName + " (" + (rows.length - 1) + " Zeilen)");

    for (var r = 1; r < rows.length; r++) {
      var row = rows[r];
      var name = String(row[0] || "").trim();
      if (!name) continue;

      var features = String(row[4] || "").replace(/;| \/ /g, "\n").trim();
      var featuresEn = String(row[5] || "").replace(/;| \/ /g, "\n").trim();
      var highlight = String(row[6] || "").toLowerCase().trim() === "ja";

      createStory(folderId, "package", toSlug(name) + "-" + tabs[t].category, name, {
        name: name,
        price: String(row[1] || "").trim(),
        subtitle: String(row[2] || "").trim(),
        subtitle_en: String(row[3] || "").trim(),
        features: features,
        features_en: featuresEn,
        highlight: highlight,
        category: tabs[t].category,
        sort_order: String(sortOrder++)
      });
    }
  }
}

function importAddons(folderId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Hochzeit Addons");
  if (!sheet) {
    Logger.log("Tab nicht gefunden: Hochzeit Addons");
    return;
  }

  var rows = sheet.getDataRange().getValues();
  Logger.log("Hochzeit Addons (" + (rows.length - 1) + " Zeilen)");

  for (var r = 1; r < rows.length; r++) {
    var textDe = String(rows[r][0] || "").trim();
    if (!textDe) continue;
    var textEn = String(rows[r][1] || "").trim();

    createStory(folderId, "addon", toSlug(textDe), textDe.substring(0, 40), {
      text_de: textDe,
      text_en: textEn || textDe,
      sort_order: String(r)
    });
  }
}

function importReviews(folderId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Reviews");
  if (!sheet) {
    Logger.log("Tab nicht gefunden: Reviews");
    return;
  }

  var rows = sheet.getDataRange().getValues();
  Logger.log("Reviews (" + (rows.length - 1) + " Zeilen)");

  for (var r = 1; r < rows.length; r++) {
    var author = String(rows[r][0] || "").trim();
    if (!author) continue;

    createStory(folderId, "review", toSlug(author), author, {
      author: author,
      rating: "5",
      text: String(rows[r][1] || "").trim(),
      text_en: String(rows[r][2] || "").trim() || String(rows[r][1] || "").trim(),
      sort_order: String(r)
    });
  }
}

function importImages(folderId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Bilder");
  if (!sheet) {
    Logger.log("Tab nicht gefunden: Bilder");
    return;
  }

  var rows = sheet.getDataRange().getValues();
  Logger.log("Bilder (" + (rows.length - 1) + " Zeilen)");

  for (var r = 1; r < rows.length; r++) {
    var page = String(rows[r][0] || "").trim().toLowerCase();
    if (!page) continue;

    var category = String(rows[r][1] || "").trim().toLowerCase();
    var imageUrl = String(rows[r][2] || "").trim();
    var altDe = String(rows[r][3] || "").trim();
    var altEn = String(rows[r][4] || "").trim();

    if (!imageUrl) continue;

    var slug = page + "-" + category + "-" + r;
    var displayName = altDe || (page + " " + category + " " + r);

    createStory(folderId, "gallery_image", slug, displayName.substring(0, 50), {
      page: page,
      category: category,
      image_url: imageUrl,
      alt_de: altDe,
      alt_en: altEn || altDe,
      sort_order: String(r)
    });
  }
}

function importAlles() {
  Logger.log("Storyblok Import gestartet...");

  Logger.log("Suche Ordner...");
  var folders = getFolderIds();
  Logger.log("Gefunden: " + Object.keys(folders).join(", "));

  var required = ["packages", "addons", "reviews", "gallery"];
  var missing = [];
  for (var i = 0; i < required.length; i++) {
    if (!folders[required[i]]) missing.push(required[i]);
  }
  if (missing.length > 0) {
    Logger.log("FEHLER - Fehlende Ordner: " + missing.join(", "));
    Logger.log("Bitte zuerst in Storyblok unter Content anlegen!");
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = ss.getSheets().map(function(s) { return s.getName(); });
  Logger.log("Sheet-Tabs: " + sheetNames.join(", "));

  Logger.log("--- Pakete ---");
  importPackages(folders["packages"]);

  Logger.log("--- Addons ---");
  importAddons(folders["addons"]);

  Logger.log("--- Reviews ---");
  importReviews(folders["reviews"]);

  Logger.log("--- Bilder ---");
  importImages(folders["gallery"]);

  Logger.log("--- FAQs ---");
  if (folders["faqs"]) {
    importFAQs(folders["faqs"]);
  } else {
    Logger.log("faqs Ordner nicht gefunden, überspringe FAQs");
  }

  Logger.log("FERTIG!");
}

function nurPakete() {
  var folders = getFolderIds();
  if (!folders["packages"]) { Logger.log("packages Ordner fehlt!"); return; }
  importPackages(folders["packages"]);
  Logger.log("Fertig!");
}

function nurAddons() {
  var folders = getFolderIds();
  if (!folders["addons"]) { Logger.log("addons Ordner fehlt!"); return; }
  importAddons(folders["addons"]);
  Logger.log("Fertig!");
}

function nurReviews() {
  var folders = getFolderIds();
  if (!folders["reviews"]) { Logger.log("reviews Ordner fehlt!"); return; }
  importReviews(folders["reviews"]);
  Logger.log("Fertig!");
}

function nurBilder() {
  var folders = getFolderIds();
  if (!folders["gallery"]) { Logger.log("gallery Ordner fehlt!"); return; }
  importImages(folders["gallery"]);
  Logger.log("Fertig!");
}

function importFAQs(folderId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("FAQs");
  if (!sheet) {
    Logger.log("Tab nicht gefunden: FAQs");
    return;
  }

  var rows = sheet.getDataRange().getValues();
  Logger.log("FAQs (" + (rows.length - 1) + " Zeilen)");

  for (var r = 1; r < rows.length; r++) {
    var catKey = String(rows[r][0] || "").trim();
    if (!catKey) continue;

    var questionDe = String(rows[r][3] || "").trim();
    if (!questionDe) continue;

    createStory(folderId, "faq_item", toSlug(questionDe) + "-" + r, questionDe.substring(0, 50), {
      question_de: questionDe,
      question_en: String(rows[r][4] || "").trim(),
      answer_de: String(rows[r][5] || "").trim(),
      answer_en: String(rows[r][6] || "").trim(),
      category_key: catKey,
      category_label_de: String(rows[r][1] || "").trim(),
      category_label_en: String(rows[r][2] || "").trim(),
      sort_order: String(r)
    });
  }
}

function nurFAQs() {
  var folders = getFolderIds();
  if (!folders["faqs"]) { Logger.log("faqs Ordner fehlt!"); return; }
  importFAQs(folders["faqs"]);
  Logger.log("Fertig!");
}