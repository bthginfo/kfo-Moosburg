export const PRACTICE = {
  name: "Kieferorthopädie Moosburg",
  doctors: "Dr. Amann & Dr. Burg",
  addressLine1: "Münchener Straße 4a",
  addressLine2: "85368 Moosburg an der Isar",
  phone: "08761 7222750",
  email: "praxis@kfo-moosburg.de",
  website: "https://www.kfo-moosburg.de",
  anamnesisUrl: "https://kfo-moosburg.eu1.documents.adobe.com/public/esignWidget?wid=CBFCIBAA3AAABLblqZhAp6w3YOK7Gd-Z4COCpHHHrn0QFXnQQV0EcpS-R3ixX40TG56zOJu3XUAnnzKZNym0*",
} as const;

export const ANAMNESIS_CTA = {
  label: "Anamnesebogen jetzt digital ausfüllen",
  supportingText: "Das Ausfüllen vor Ihrem Termin erleichtert den Ablauf in der Praxis und spart Zeit beim ersten Besuch.",
  url: PRACTICE.anamnesisUrl,
} as const;
