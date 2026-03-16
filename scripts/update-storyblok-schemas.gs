/**
 * ================================================================
 * Storyblok Schema Updater - Google Apps Script
 * ================================================================
 * Adds ALL missing fields to the 5 page content types.
 *
 * USAGE:
 * 1. Go to script.google.com > New Project
 * 2. Paste this entire file
 * 3. Set your MGMT_TOKEN below
 * 4. Select function "updateAllSchemas" and click Run
 * 5. Check the Execution Log for results
 *
 * IMPORTANT: This only ADDS new fields. It will NOT modify or
 * delete existing fields. Safe to run multiple times.
 * ================================================================
 */

// -- CONFIGURATION ------------------------------------------------
var MGMT_TOKEN = "DEIN_MANAGEMENT_TOKEN_HIER";  // <-- HIER EINTRAGEN!
var SPACE_ID   = "291045863485848";
var API_BASE   = "https://mapi.storyblok.com/v1/spaces/" + SPACE_ID;

// -- API HELPER ---------------------------------------------------
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
  if (payload) {
    options.payload = JSON.stringify(payload);
  }

  for (var attempt = 0; attempt < 5; attempt++) {
    var response = UrlFetchApp.fetch(url, options);
    var code = response.getResponseCode();

    if (code === 429) {
      var wait = Math.pow(2, attempt) * 1000;
      Logger.log("  Rate limited (429), waiting " + wait + "ms...");
      Utilities.sleep(wait);
      continue;
    }

    if (code >= 400) {
      throw new Error("Storyblok API " + method + " " + path + " -> " + code + ": " + response.getContentText());
    }

    return JSON.parse(response.getContentText());
  }
  throw new Error("Too many retries for " + method + " " + path);
}

// -- FIND COMPONENT BY NAME ----------------------------------------
function findComponent(name) {
  var data = sbApi("GET", "/components");
  var components = data.components || [];
  for (var i = 0; i < components.length; i++) {
    if (components[i].name === name) {
      return components[i];
    }
  }
  return null;
}

// -- FIELD DEFINITION HELPERS --------------------------------------
// Storyblok field types: "text", "textarea", "bloks", "option", etc.
function textField(displayName, pos) {
  return {
    type: "text",
    pos: pos,
    display_name: displayName
  };
}

function textareaField(displayName, pos) {
  return {
    type: "textarea",
    pos: pos,
    display_name: displayName
  };
}

// -- SCHEMA DEFINITIONS FOR ALL NEW FIELDS --------------------------
// Each entry: [fieldName, type("text"|"textarea"), displayName]
// Only fields that are NEW (not already in the seed script)

function getNewFieldsForWeddings() {
  return [
    // Shot List section
    ["shotlist_pretitle_de", "text", "Shotlist Pretitle (DE)"],
    ["shotlist_pretitle_en", "text", "Shotlist Pretitle (EN)"],
    ["shotlist_title_de", "text", "Shotlist Title (DE)"],
    ["shotlist_title_en", "text", "Shotlist Title (EN)"],
    ["shotlist_note_de", "textarea", "Shotlist Note (DE)"],
    ["shotlist_note_en", "textarea", "Shotlist Note (EN)"],

    // Photography Styles section
    ["styles_pretitle_de", "text", "Styles Pretitle (DE)"],
    ["styles_pretitle_en", "text", "Styles Pretitle (EN)"],
    ["styles_title_de", "text", "Styles Title (DE)"],
    ["styles_title_en", "text", "Styles Title (EN)"],
    ["styles_intro_de", "textarea", "Styles Intro (DE)"],
    ["styles_intro_en", "textarea", "Styles Intro (EN)"],
    ["style1_icon", "text", "Style 1 Icon (lucide name)"],
    ["style1_title", "text", "Style 1 Title"],
    ["style1_text_de", "textarea", "Style 1 Text (DE)"],
    ["style1_text_en", "textarea", "Style 1 Text (EN)"],
    ["style2_icon", "text", "Style 2 Icon (lucide name)"],
    ["style2_title", "text", "Style 2 Title"],
    ["style2_text_de", "textarea", "Style 2 Text (DE)"],
    ["style2_text_en", "textarea", "Style 2 Text (EN)"],
    ["style3_icon", "text", "Style 3 Icon (lucide name)"],
    ["style3_title", "text", "Style 3 Title"],
    ["style3_text_de", "textarea", "Style 3 Text (DE)"],
    ["style3_text_en", "textarea", "Style 3 Text (EN)"],
    ["styles_note_de", "textarea", "Styles Note (DE)"],
    ["styles_note_en", "textarea", "Styles Note (EN)"],
    ["styles_cta_de", "text", "Styles CTA (DE)"],
    ["styles_cta_en", "text", "Styles CTA (EN)"],

    // Package tabs & travel notes
    ["packages_photo_tab_de", "text", "Packages Photo Tab (DE)"],
    ["packages_photo_tab_en", "text", "Packages Photo Tab (EN)"],
    ["packages_video_tab_de", "text", "Packages Video Tab (DE)"],
    ["packages_video_tab_en", "text", "Packages Video Tab (EN)"],
    ["travel_note_de", "textarea", "Travel Note Photo (DE)"],
    ["travel_note_en", "textarea", "Travel Note Photo (EN)"],
    ["travel_note_video_de", "textarea", "Travel Note Video (DE)"],
    ["travel_note_video_en", "textarea", "Travel Note Video (EN)"],
    ["addons_pretitle_de", "text", "Add-ons Pretitle (DE)"],
    ["addons_pretitle_en", "text", "Add-ons Pretitle (EN)"],
    ["addons_title_de", "text", "Add-ons Title (DE)"],
    ["addons_title_en", "text", "Add-ons Title (EN)"],
    ["book_now_de", "text", "Book Now Button (DE)"],
    ["book_now_en", "text", "Book Now Button (EN)"],

    // Timeline section
    ["timeline_pretitle_de", "text", "Timeline Pretitle (DE)"],
    ["timeline_pretitle_en", "text", "Timeline Pretitle (EN)"],
    ["timeline_title_de", "text", "Timeline Title (DE)"],
    ["timeline_title_en", "text", "Timeline Title (EN)"],
    ["timeline_intro_de", "textarea", "Timeline Intro (DE)"],
    ["timeline_intro_en", "textarea", "Timeline Intro (EN)"],

    // Gallery
    ["gallery_title", "text", "Gallery Title"],
    ["load_more_de", "text", "Load More (DE)"],
    ["load_more_en", "text", "Load More (EN)"],

    // Testimonials
    ["testimonials_title_de", "text", "Testimonials Title (DE)"],
    ["testimonials_title_en", "text", "Testimonials Title (EN)"],

    // Booking Process
    ["process_pretitle_de", "text", "Process Pretitle (DE)"],
    ["process_pretitle_en", "text", "Process Pretitle (EN)"],
    ["process_title_de", "text", "Process Title (DE)"],
    ["process_title_en", "text", "Process Title (EN)"],
    ["process1_icon", "text", "Process 1 Icon"],
    ["process1_title_de", "text", "Process 1 Title (DE)"],
    ["process1_title_en", "text", "Process 1 Title (EN)"],
    ["process1_text_de", "textarea", "Process 1 Text (DE)"],
    ["process1_text_en", "textarea", "Process 1 Text (EN)"],
    ["process2_icon", "text", "Process 2 Icon"],
    ["process2_title_de", "text", "Process 2 Title (DE)"],
    ["process2_title_en", "text", "Process 2 Title (EN)"],
    ["process2_text_de", "textarea", "Process 2 Text (DE)"],
    ["process2_text_en", "textarea", "Process 2 Text (EN)"],
    ["process3_icon", "text", "Process 3 Icon"],
    ["process3_title_de", "text", "Process 3 Title (DE)"],
    ["process3_title_en", "text", "Process 3 Title (EN)"],
    ["process3_text_de", "textarea", "Process 3 Text (DE)"],
    ["process3_text_en", "textarea", "Process 3 Text (EN)"],
    ["process4_icon", "text", "Process 4 Icon"],
    ["process4_title_de", "text", "Process 4 Title (DE)"],
    ["process4_title_en", "text", "Process 4 Title (EN)"],
    ["process4_text_de", "textarea", "Process 4 Text (DE)"],
    ["process4_text_en", "textarea", "Process 4 Text (EN)"],
    ["process5_icon", "text", "Process 5 Icon"],
    ["process5_title_de", "text", "Process 5 Title (DE)"],
    ["process5_title_en", "text", "Process 5 Title (EN)"],
    ["process5_text_de", "textarea", "Process 5 Text (DE)"],
    ["process5_text_en", "textarea", "Process 5 Text (EN)"],
    ["process6_icon", "text", "Process 6 Icon"],
    ["process6_title_de", "text", "Process 6 Title (DE)"],
    ["process6_title_en", "text", "Process 6 Title (EN)"],
    ["process6_text_de", "textarea", "Process 6 Text (DE)"],
    ["process6_text_en", "textarea", "Process 6 Text (EN)"],

    // Wedding Guide
    ["guide_pretitle_de", "text", "Guide Pretitle (DE)"],
    ["guide_pretitle_en", "text", "Guide Pretitle (EN)"],
    ["guide_title", "text", "Guide Title"],
    ["guide_season_de", "text", "Guide Season (DE)"],
    ["guide_season_en", "text", "Guide Season (EN)"],
    ["guide_text_de", "textarea", "Guide Text (DE)"],
    ["guide_text_en", "textarea", "Guide Text (EN)"],
    ["guide_pdf", "text", "Guide PDF URL"],
    ["guide_button_de", "text", "Guide Button (DE)"],
    ["guide_button_en", "text", "Guide Button (EN)"],
    ["guide_note_de", "text", "Guide Note (DE)"],
    ["guide_note_en", "text", "Guide Note (EN)"],
  ];
}

function getNewFieldsForAnimals() {
  return [
    ["packages_title_de", "text", "Packages Title (DE)"],
    ["packages_title_en", "text", "Packages Title (EN)"],
    ["midcta_text_de", "textarea", "Mid CTA Text (DE)"],
    ["midcta_text_en", "textarea", "Mid CTA Text (EN)"],
    ["midcta_button_de", "text", "Mid CTA Button (DE)"],
    ["midcta_button_en", "text", "Mid CTA Button (EN)"],
    ["gallery_title", "text", "Gallery Title"],
    ["tips_pretitle_de", "text", "Tips Pretitle (DE)"],
    ["tips_pretitle_en", "text", "Tips Pretitle (EN)"],
    ["tips_title_de", "text", "Tips Title (DE)"],
    ["tips_title_en", "text", "Tips Title (EN)"],
    ["tip1_icon", "text", "Tip 1 Icon"],
    ["tip1_title_de", "text", "Tip 1 Title (DE)"],
    ["tip1_title_en", "text", "Tip 1 Title (EN)"],
    ["tip1_text_de", "textarea", "Tip 1 Text (DE)"],
    ["tip1_text_en", "textarea", "Tip 1 Text (EN)"],
    ["tip2_icon", "text", "Tip 2 Icon"],
    ["tip2_title_de", "text", "Tip 2 Title (DE)"],
    ["tip2_title_en", "text", "Tip 2 Title (EN)"],
    ["tip2_text_de", "textarea", "Tip 2 Text (DE)"],
    ["tip2_text_en", "textarea", "Tip 2 Text (EN)"],
    ["tip3_icon", "text", "Tip 3 Icon"],
    ["tip3_title_de", "text", "Tip 3 Title (DE)"],
    ["tip3_title_en", "text", "Tip 3 Title (EN)"],
    ["tip3_text_de", "textarea", "Tip 3 Text (DE)"],
    ["tip3_text_en", "textarea", "Tip 3 Text (EN)"],
    ["tip4_icon", "text", "Tip 4 Icon"],
    ["tip4_title_de", "text", "Tip 4 Title (DE)"],
    ["tip4_title_en", "text", "Tip 4 Title (EN)"],
    ["tip4_text_de", "textarea", "Tip 4 Text (DE)"],
    ["tip4_text_en", "textarea", "Tip 4 Text (EN)"],
  ];
}

function getNewFieldsForPortrait() {
  return [
    ["pricing_pretitle_de", "text", "Pricing Pretitle (DE)"],
    ["pricing_pretitle_en", "text", "Pricing Pretitle (EN)"],
    ["pricing_title_de", "text", "Pricing Title (DE)"],
    ["pricing_title_en", "text", "Pricing Title (EN)"],
    ["pricing_text_de", "textarea", "Pricing Text (DE)"],
    ["pricing_text_en", "textarea", "Pricing Text (EN)"],
    ["pricing_note_de", "textarea", "Pricing Note (DE)"],
    ["pricing_note_en", "textarea", "Pricing Note (EN)"],
    ["pricing_cta_de", "text", "Pricing CTA (DE)"],
    ["pricing_cta_en", "text", "Pricing CTA (EN)"],
    ["occasions_title_de", "text", "Occasions Title (DE)"],
    ["occasions_title_en", "text", "Occasions Title (EN)"],
    ["occasion1_icon", "text", "Occasion 1 Icon"],
    ["occasion1_title_de", "text", "Occasion 1 Title (DE)"],
    ["occasion1_title_en", "text", "Occasion 1 Title (EN)"],
    ["occasion1_text_de", "text", "Occasion 1 Text (DE)"],
    ["occasion1_text_en", "text", "Occasion 1 Text (EN)"],
    ["occasion2_icon", "text", "Occasion 2 Icon"],
    ["occasion2_title_de", "text", "Occasion 2 Title (DE)"],
    ["occasion2_title_en", "text", "Occasion 2 Title (EN)"],
    ["occasion2_text_de", "text", "Occasion 2 Text (DE)"],
    ["occasion2_text_en", "text", "Occasion 2 Text (EN)"],
    ["occasion3_icon", "text", "Occasion 3 Icon"],
    ["occasion3_title_de", "text", "Occasion 3 Title (DE)"],
    ["occasion3_title_en", "text", "Occasion 3 Title (EN)"],
    ["occasion3_text_de", "text", "Occasion 3 Text (DE)"],
    ["occasion3_text_en", "text", "Occasion 3 Text (EN)"],
    ["occasion4_icon", "text", "Occasion 4 Icon"],
    ["occasion4_title_de", "text", "Occasion 4 Title (DE)"],
    ["occasion4_title_en", "text", "Occasion 4 Title (EN)"],
    ["occasion4_text_de", "text", "Occasion 4 Text (DE)"],
    ["occasion4_text_en", "text", "Occasion 4 Text (EN)"],
    ["gallery_title", "text", "Gallery Title"],
  ];
}

function getNewFieldsForAbout() {
  return [
    ["expect_title_de", "text", "Expect Title (DE)"],
    ["expect_title_en", "text", "Expect Title (EN)"],
    ["tagline_de", "text", "Tagline (DE)"],
    ["tagline_en", "text", "Tagline (EN)"],
    ["tagline_bold_de", "text", "Tagline Bold (DE)"],
    ["tagline_bold_en", "text", "Tagline Bold (EN)"],
    ["tagline_desc_de", "textarea", "Tagline Desc (DE)"],
    ["tagline_desc_en", "textarea", "Tagline Desc (EN)"],
    ["stats_title_de", "text", "Stats Title (DE)"],
    ["stats_title_en", "text", "Stats Title (EN)"],
    ["stat1_num", "text", "Stat 1 Number"],
    ["stat1_label_de", "text", "Stat 1 Label (DE)"],
    ["stat1_label_en", "text", "Stat 1 Label (EN)"],
    ["stat2_num", "text", "Stat 2 Number"],
    ["stat2_label_de", "text", "Stat 2 Label (DE)"],
    ["stat2_label_en", "text", "Stat 2 Label (EN)"],
    ["stat3_num", "text", "Stat 3 Number"],
    ["stat3_label_de", "text", "Stat 3 Label (DE)"],
    ["stat3_label_en", "text", "Stat 3 Label (EN)"],
    ["stat4_num", "text", "Stat 4 Number"],
    ["stat4_label_de", "text", "Stat 4 Label (DE)"],
    ["stat4_label_en", "text", "Stat 4 Label (EN)"],
    ["passion_pretitle_de", "text", "Passion Pretitle (DE)"],
    ["passion_pretitle_en", "text", "Passion Pretitle (EN)"],
    ["passion_title_de", "text", "Passion Title (DE)"],
    ["passion_title_en", "text", "Passion Title (EN)"],
    ["passion_text1_de", "textarea", "Passion Text 1 (DE)"],
    ["passion_text1_en", "textarea", "Passion Text 1 (EN)"],
    ["passion_text2_de", "textarea", "Passion Text 2 (DE)"],
    ["passion_text2_en", "textarea", "Passion Text 2 (EN)"],
    ["passion_cta_de", "text", "Passion CTA (DE)"],
    ["passion_cta_en", "text", "Passion CTA (EN)"],
    ["testimonials_title_de", "text", "Testimonials Title (DE)"],
    ["testimonials_title_en", "text", "Testimonials Title (EN)"],
    ["contact_pretitle_de", "text", "Contact Pretitle (DE)"],
    ["contact_pretitle_en", "text", "Contact Pretitle (EN)"],
    ["contact_title_de", "text", "Contact Title (DE)"],
    ["contact_title_en", "text", "Contact Title (EN)"],
    ["contact_text_de", "textarea", "Contact Text (DE)"],
    ["contact_text_en", "textarea", "Contact Text (EN)"],
    ["contact_cta_de", "text", "Contact CTA (DE)"],
    ["contact_cta_en", "text", "Contact CTA (EN)"],
    ["contact_or_de", "text", "Contact Or Text (DE)"],
    ["contact_or_en", "text", "Contact Or Text (EN)"],
    ["cta_pretitle_de", "text", "CTA Pretitle (DE)"],
    ["cta_pretitle_en", "text", "CTA Pretitle (EN)"],
    ["cta_title_de", "text", "CTA Title (DE)"],
    ["cta_title_en", "text", "CTA Title (EN)"],
    ["cta_text_de", "textarea", "CTA Text (DE)"],
    ["cta_text_en", "textarea", "CTA Text (EN)"],
    ["cta_button_de", "text", "CTA Button (DE)"],
    ["cta_button_en", "text", "CTA Button (EN)"],
  ];
}

// -- UPDATE ONE COMPONENT SCHEMA -----------------------------------
function updateComponentSchema(componentName, newFields) {
  Logger.log("\n" + "=".repeat(50));
  Logger.log("Updating schema: " + componentName);
  Logger.log("=".repeat(50));

  var component = findComponent(componentName);
  if (!component) {
    Logger.log("  ERROR: Component '" + componentName + "' not found!");
    Logger.log("  Make sure the content type exists in Storyblok.");
    return false;
  }

  Logger.log("  Found component: id=" + component.id);

  // Get existing schema fields
  var schema = component.schema || {};
  var existingKeys = Object.keys(schema);
  Logger.log("  Existing fields: " + existingKeys.length);

  // Calculate starting position
  var maxPos = 0;
  for (var i = 0; i < existingKeys.length; i++) {
    var fieldPos = schema[existingKeys[i]].pos || 0;
    if (fieldPos > maxPos) maxPos = fieldPos;
  }

  var added = 0;
  var skipped = 0;

  for (var j = 0; j < newFields.length; j++) {
    var fieldName = newFields[j][0];
    var fieldType = newFields[j][1];
    var displayName = newFields[j][2];

    if (schema[fieldName]) {
      skipped++;
      continue;
    }

    maxPos++;
    if (fieldType === "textarea") {
      schema[fieldName] = textareaField(displayName, maxPos);
    } else {
      schema[fieldName] = textField(displayName, maxPos);
    }
    added++;
  }

  Logger.log("  Fields to add: " + added + ", already exist: " + skipped);

  if (added === 0) {
    Logger.log("  SKIP: No new fields to add.");
    return true;
  }

  // PUT updated component
  try {
    sbApi("PUT", "/components/" + component.id, {
      component: {
        name: component.name,
        schema: schema,
        is_root: component.is_root,
        is_nestable: component.is_nestable
      }
    });
    Logger.log("  SUCCESS: " + added + " fields added to " + componentName);
    return true;
  } catch (e) {
    Logger.log("  FAILED: " + e.message);
    return false;
  }
}

// -- MAIN FUNCTION (run this!) ------------------------------------
function updateAllSchemas() {
  if (MGMT_TOKEN === "DEIN_MANAGEMENT_TOKEN_HIER") {
    Logger.log("ERROR: Bitte trage deinen Management Token oben ein!");
    Logger.log("Hol dir einen unter: Storyblok > Settings > Access Tokens > Generate (Scope: All)");
    return;
  }

  Logger.log("Storyblok Schema Updater");
  Logger.log("Space: " + SPACE_ID);
  Logger.log("Adding missing fields to all 5 content types...");
  Logger.log("");

  var results = [];

  // page_home has no new fields (all were already in the seed script)
  Logger.log("\n--- page_home: Already complete, skipping ---");

  // page_weddings
  results.push(updateComponentSchema("page_weddings", getNewFieldsForWeddings()));
  Utilities.sleep(1000);

  // page_animals
  results.push(updateComponentSchema("page_animals", getNewFieldsForAnimals()));
  Utilities.sleep(1000);

  // page_portrait
  results.push(updateComponentSchema("page_portrait", getNewFieldsForPortrait()));
  Utilities.sleep(1000);

  // page_about
  results.push(updateComponentSchema("page_about", getNewFieldsForAbout()));

  var success = 0;
  for (var i = 0; i < results.length; i++) {
    if (results[i]) success++;
  }

  Logger.log("\n" + "=".repeat(50));
  Logger.log("SCHEMA UPDATE DONE! " + success + "/" + results.length + " content types updated.");
  Logger.log("");
  Logger.log("NEXT STEP:");
  Logger.log("Run the 'seedAllNewFields' function to populate the new fields with default values.");
  Logger.log("=".repeat(50));
}
