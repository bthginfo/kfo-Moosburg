export const BEMA_SOURCE_VERSION = "2026-01-01";
export const BEMA_SOURCE_URL = "https://www.kzbv.de/wp-content/uploads/KZBV_BEMA_Kurzfassung_2026-01-01.pdf";
export const KZVB_POINT_VALUE_PAGE_URL = "https://www.kzvb.de/abrechnung/punktwerte";

export type OfficialBemaItem = {
  code: string;
  name: string;
  points: number;
  category: string;
  unit: string;
};

// Curated from the official KZBV BEMA short form, valid from 1 January 2026.
// These are the orthodontic core positions plus common KFO examination/radiology positions.
export const OFFICIAL_BEMA_KFO_2026: OfficialBemaItem[] = [
  { code: "Ä 1", name: "Beratung eines Kranken, auch fernmündlich", points: 9, category: "Untersuchung", unit: "Leistung" },
  { code: "01k", name: "Kieferorthopädische Untersuchung zur Klärung von Indikation und Zeitpunkt therapeutischer Maßnahmen", points: 28, category: "Untersuchung", unit: "Leistung" },
  { code: "12", name: "Besondere Maßnahmen, insbesondere Separieren vor Bebänderung", points: 10, category: "Begleitleistung", unit: "Sitzung" },
  { code: "Ä 925a", name: "Röntgendiagnostik der Zähne, bis zwei Aufnahmen", points: 12, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 925b", name: "Röntgendiagnostik der Zähne, bis fünf Aufnahmen", points: 19, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 925c", name: "Röntgendiagnostik der Zähne, bis acht Aufnahmen", points: 27, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 925d", name: "Röntgenstatus bei mehr als acht Aufnahmen", points: 34, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 934a", name: "Aufnahme des Schädels, eine Aufnahme (auch Fernröntgenaufnahme)", points: 19, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 934b", name: "Aufnahme des Schädels, zwei Aufnahmen", points: 30, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 934c", name: "Aufnahme des Schädels, mehr als zwei Aufnahmen", points: 36, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 935a", name: "Teilaufnahme des Schädels, eine Aufnahme", points: 21, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 935b", name: "Teilaufnahme des Schädels, zwei Aufnahmen", points: 25, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 935c", name: "Teilaufnahme des Schädels, mehr als zwei Aufnahmen", points: 31, category: "Röntgen", unit: "Leistung" },
  { code: "Ä 935d", name: "Orthopantomogramm bzw. Panoramaaufnahme aller Zähne", points: 36, category: "Röntgen", unit: "Leistung" },
  { code: "63", name: "Freilegung eines retinierten oder verlagerten Zahnes zur kieferorthopädischen Einstellung", points: 80, category: "Begleitleistung", unit: "Leistung" },
  { code: "5", name: "Kieferorthopädische Behandlungsplanung", points: 95, category: "KFO-Planung", unit: "Plan" },
  { code: "116", name: "Fotografie", points: 15, category: "KFO-Diagnostik", unit: "Leistung" },
  { code: "117", name: "Modellanalyse", points: 35, category: "KFO-Diagnostik", unit: "Leistung" },
  { code: "118", name: "Kephalometrische Auswertung", points: 29, category: "KFO-Diagnostik", unit: "Leistung" },
  { code: "119a", name: "Umformung eines Kiefers einschließlich Retention, einfach", points: 132, category: "KFO-Behandlung", unit: "Leistung" },
  { code: "119b", name: "Umformung eines Kiefers einschließlich Retention, mittelschwer", points: 204, category: "KFO-Behandlung", unit: "Leistung" },
  { code: "119c", name: "Umformung eines Kiefers einschließlich Retention, schwierig", points: 276, category: "KFO-Behandlung", unit: "Leistung" },
  { code: "119d", name: "Umformung eines Kiefers einschließlich Retention, besonders schwierig", points: 336, category: "KFO-Behandlung", unit: "Leistung" },
  { code: "120a", name: "Einstellung des Unterkiefers in den Regelbiss einschließlich Retention, einfach", points: 204, category: "KFO-Behandlung", unit: "Leistung" },
  { code: "120b", name: "Einstellung des Unterkiefers in den Regelbiss einschließlich Retention, mittelschwer", points: 228, category: "KFO-Behandlung", unit: "Leistung" },
  { code: "120c", name: "Einstellung des Unterkiefers in den Regelbiss einschließlich Retention, schwierig", points: 276, category: "KFO-Behandlung", unit: "Leistung" },
  { code: "120d", name: "Einstellung des Unterkiefers in den Regelbiss einschließlich Retention, besonders schwierig", points: 336, category: "KFO-Behandlung", unit: "Leistung" },
  { code: "121", name: "Beseitigung von Habits bei habituellem Distal- oder offenem Biss", points: 17, category: "KFO-Behandlung", unit: "Sitzung" },
  { code: "122a", name: "Kontrolle des Behandlungsverlaufs einschließlich kleiner Änderungen", points: 21, category: "KFO-Kontrolle", unit: "Sitzung" },
  { code: "122b", name: "Vorbereitende Maßnahmen zur Herstellung kieferorthopädischer Behandlungsmittel", points: 43, category: "KFO-Behandlung", unit: "Kiefer" },
  { code: "122c", name: "Einfügen von kieferorthopädischen Behandlungsmitteln", points: 27, category: "KFO-Behandlung", unit: "Kiefer" },
  { code: "123a", name: "Herausnehmbarer Lückenhalter nach vorzeitigem Milchzahnverlust", points: 40, category: "KFO-Behandlung", unit: "Kiefer" },
  { code: "123b", name: "Kontrolle eines Lückenhalters", points: 14, category: "KFO-Kontrolle", unit: "Quartal" },
  { code: "124", name: "Einschleifen von Milchzähnen bei Kreuz- oder Zwangsbiss", points: 16, category: "KFO-Behandlung", unit: "Sitzung" },
  { code: "125", name: "Wiederherstellung von Behandlungsmitteln einschließlich Wiedereinfügen", points: 30, category: "KFO-Reparatur", unit: "Kiefer" },
  { code: "126a", name: "Eingliedern eines Brackets oder Attachments aus Edelstahl bzw. nickelfreiem Metall", points: 18, category: "KFO-Apparatur", unit: "Stück" },
  { code: "126b", name: "Eingliedern eines Bandes", points: 42, category: "KFO-Apparatur", unit: "Stück" },
  { code: "126c", name: "Wiedereingliederung eines Bandes", points: 30, category: "KFO-Apparatur", unit: "Stück" },
  { code: "126d", name: "Entfernen eines Bandes, Brackets oder Attachments", points: 6, category: "KFO-Apparatur", unit: "Stück" },
  { code: "127a", name: "Eingliederung eines Teilbogens aus Edelstahl", points: 25, category: "KFO-Apparatur", unit: "Bogen" },
  { code: "127b", name: "Ausgliederung eines Teilbogens", points: 7, category: "KFO-Apparatur", unit: "Bogen" },
  { code: "128a", name: "Eingliederung eines konfektionierten Vollbogens aus Edelstahl", points: 32, category: "KFO-Apparatur", unit: "Bogen" },
  { code: "128b", name: "Eingliederung eines individualisierten Vollbogens aus Edelstahl", points: 40, category: "KFO-Apparatur", unit: "Bogen" },
  { code: "128c", name: "Ausgliederung von Vollbögen", points: 9, category: "KFO-Apparatur", unit: "Bogen" },
  { code: "129", name: "Wiedereingliederung eines Voll- oder Teilbogens", points: 24, category: "KFO-Apparatur", unit: "Bogen" },
  { code: "130", name: "Eingliederung ergänzender festsitzender Apparaturen", points: 72, category: "KFO-Apparatur", unit: "Leistung" },
  { code: "131a", name: "Ein- und Ausgliederung einer Gaumennahterweiterungsapparatur", points: 50, category: "KFO-Apparatur", unit: "Leistung" },
  { code: "131b", name: "Ein- und Ausgliederung einer festsitzenden Apparatur zur Bisslagekorrektur, je Seite", points: 50, category: "KFO-Apparatur", unit: "Seite" },
  { code: "131c", name: "Eingliederung einer Gesichtsmaske", points: 50, category: "KFO-Apparatur", unit: "Leistung" },
];

export const FUND_TYPE_LABELS: Record<string, string> = {
  "1": "AOK",
  "2": "BKK",
  "3": "IKK",
  "4": "Landwirtschaftliche Krankenkasse",
  "6": "Knappschaft",
  "8": "Ersatzkassen (TK, BARMER, DAK, KKH, HEK, hkk)",
  "9": "Sonstige Kostenträger",
  B: "BAS",
  D: "Deutsche Rentenversicherung",
  F: "Fremdkassen",
};

export function pointValueCsvUrl(quarter: string): string {
  const match = /^(\d{4})Q([1-4])$/.exec(quarter);
  if (!match) throw new Error("Ungültiges Quartal.");
  return `https://www.kzvb.de/fileadmin/user_upload/Abrechnung/Punktwerte/11Q${match[2]}${match[1].slice(-2)}PWD.csv`;
}
