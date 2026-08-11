import { useEffect } from "react";
import { useLocation } from "react-router";
import { PageMeta } from "../PageMeta";

export function ImpressumDatenschutzPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  return (
    <main className="pt-20 md:pt-24">
      <PageMeta
        title="Impressum & Datenschutz | KFO Moosburg"
        description="Impressum und Datenschutzhinweise der Kieferorthopädie Moosburg, Praxis Dr. Amann und Dr. Burg."
        path="/impressum-datenschutz"
      />
      <div className="px-5 md:px-10">
        <div className="max-w-3xl mx-auto py-12 md:py-20">

          {/* ======================== IMPRESSUM ======================== */}
            <section id="impressum" className="mb-16 md:mb-24 scroll-mt-24">
              <h1 className="text-3xl md:text-[3rem] mb-8">Impressum</h1>

              <div className="prose-legal space-y-5 text-[#4a5d69]">
                <p>Angaben gemäß § 5 TMG</p>

                <p>
                  Kieferorthopädie Moosburg<br />
                  Dr. Amann und Dr. Burg<br />
                  Münchener Straße 4a<br />
                  85368 Moosburg
                </p>

                <div>
                  <p style={{ fontWeight: 600 }} className="text-[#0d1317] mb-1">Vertreten durch</p>
                  <p>
                    Dr. med. dent. Christoph Amann<br />
                    Fachzahnarzt für Kieferorthopädie
                  </p>
                  <p>
                    Dr. med. dent. Julian Burg<br />
                    Zahnarzt mit Tätigkeitsschwerpunkt Kieferorthopädie
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 600 }} className="text-[#0d1317] mb-1">Kontakt</p>
                  <p>
                    Tel.: <a href="tel:087617222750" className="text-[#f58a07] hover:underline">08761 7222750</a><br />
                    E-Mail: <a href="mailto:praxis@kfo-moosburg.de" className="text-[#f58a07] hover:underline">praxis@kfo-moosburg.de</a>
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 600 }} className="text-[#0d1317] mb-1">Zuständige Kammer</p>
                  <p>
                    Bayerische Landeszahnärztekammer<br />
                    Fallstr. 34<br />
                    81369 München<br />
                    <a href="https://www.blzk.de" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline">www.blzk.de</a>
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 600 }} className="text-[#0d1317] mb-1">Zuständige Aufsichtsbehörde</p>
                  <p>
                    Kassenzahnärztliche Vereinigung Bayerns<br />
                    Fallstraße 34<br />
                    81369 München<br />
                    <a href="https://www.kzvb.de" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline">www.kzvb.de</a>
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 600 }} className="text-[#0d1317] mb-1">Berufsrechtliche Regelungen</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Zahnheilkundegesetz</li>
                    <li>Heilberufe-Kammergesetz</li>
                    <li>Gebührenordnung für Zahnärzte</li>
                    <li>Berufsordnung für Zahnärzte</li>
                  </ul>
                  <p className="mt-2">
                    Die Regelungen sind auf der Internetseite der Zahnärztekammer oder auf der Internetseite der KZVB einzusehen.
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 600 }} className="text-[#0d1317] mb-1">Haftungsausschluss</p>
                  <p>
                    Diese Webseite wurde mit größtmöglicher Sorgfalt erstellt und überprüft. Der Herausgeber übernimmt jedoch keinerlei Gewähr für die Aktualität, Korrektheit, Vollständigkeit oder Qualität der bereitgestellten Informationen. Der Herausgeber schließt jegliche Haftung für Schäden, die direkt oder indirekt durch die Nutzung oder Nichtnutzung der dargebotenen Informationen bzw. durch die Nutzung fehlerhafter und unvollständiger Informationen verursacht wurden grundsätzlich aus, sofern seitens des Herausgebers kein nachweislich vorsätzliches oder grob fahrlässiges Verschulden vorliegt.
                  </p>
                  <p>
                    Medizinische Informationen, die sich aus dieser Webseite erschließen, können und sollen in keinem Falle eine ärztliche Beratung, Diagnose oder Behandlung ersetzen.
                  </p>
                  <p>
                    Als Herausgeber sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf dieser Webseite nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Herausgeber jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 600 }} className="text-[#0d1317] mb-1">Haftung für Verweise / Verknüpfungen / Links</p>
                  <p>
                    Der Herausgeber erklärt hiermit, dass die vorliegende Webseite Verweise / Verknüpfungen / Links zu externen Webseiten Dritter enthält, die der Haftung der jeweiligen Betreiber unterliegen. Der Herausgeber hat auf die Inhalte und die Gestaltung dieser externen Webseiten keinen Einfluss und kann deshalb für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten externen Webseiten ist stets der jeweilige Betreiber dieser externen Webseiten verantwortlich. Das Setzen von externen Verweisen / Verknüpfungen / Links bedeutet nicht, dass sich der Herausgeber die hinter den Verweisen / Verknüpfungen / Links liegenden Inhalte zu Eigen macht.
                  </p>
                  <p>
                    Die verlinkten externen Webseiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverletzungen überprüft. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar. Eine permanente inhaltliche Kontrolle der verlinkten externen Webseiten ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei Bekanntwerden von Rechtsverletzungen wird der Herausgeber derartige Verweise / Verknüpfungen / Links umgehend entfernen.
                  </p>
                </div>

                <div>
                  <p style={{ fontWeight: 600 }} className="text-[#0d1317] mb-1">Urheberrecht</p>
                  <p>
                    Die durch den Herausgeber auf dieser Webseite veröffentlichten Inhalte und Werke unterliegen dem deutschen Urheber- und Leistungsschutzrecht. Jede vom deutschen Urheber- und Leistungsschutzrecht nicht zugelassene Verwertung bedarf der vorherigen schriftlichen Zustimmung des Herausgebers dieser Webseite oder des jeweiligen Rechteinhabers. Dies gilt insbesondere für die Vervielfältigung, Bearbeitung, Verbreitung, Übersetzung, Einspeicherung, Verarbeitung bzw. Wiedergabe von Inhalten in Datenbanken oder anderen elektronischen Medien und Systemen. Lediglich die Herstellung von Kopien und Downloads für den persönlichen, privaten und nicht kommerziellen Gebrauch ist gestattet.
                  </p>
                  <p>
                    Soweit die Inhalte auf dieser Webseite nicht vom Herausgeber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte und Rechte Dritter als solche gekennzeichnet. Sofern Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen wird der Herausgeber derartige Inhalte umgehend entfernen.
                  </p>
                </div>
              </div>
            </section>

          {/* ======================== DATENSCHUTZ ======================== */}
            <section id="datenschutz" className="scroll-mt-24">
              <h1 className="text-3xl md:text-[3rem] mb-8">Datenschutz</h1>

              <div className="prose-legal space-y-5 text-[#4a5d69]">
                <p>
                  Verantwortlicher im Sinne der Datenschutzgesetze, insbesondere der EU-Datenschutzgrundverordnung (DSGVO), ist:
                </p>
                <p>Dr. med. dent. Christoph Amann &amp; Dr. med. dent. Julian Burg</p>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Ihre Betroffenenrechte</h3>
                  <p>
                    Unter den angegebenen Kontaktdaten unseres Datenschutzbeauftragten können Sie jederzeit folgende Rechte ausüben:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 mt-2">
                    <li>Auskunft über Ihre bei uns gespeicherten Daten und deren Verarbeitung (Art. 15 DSGVO),</li>
                    <li>Berichtigung unrichtiger personenbezogener Daten (Art. 16 DSGVO),</li>
                    <li>Löschung Ihrer bei uns gespeicherten Daten (Art. 17 DSGVO),</li>
                    <li>Einschränkung der Datenverarbeitung, sofern wir Ihre Daten aufgrund gesetzlicher Pflichten noch nicht löschen dürfen (Art. 18 DSGVO),</li>
                    <li>Widerspruch gegen die Verarbeitung Ihrer Daten bei uns (Art. 21 DSGVO) und</li>
                    <li>Datenübertragbarkeit, sofern Sie in die Datenverarbeitung eingewilligt haben oder einen Vertrag mit uns abgeschlossen haben (Art. 20 DSGVO).</li>
                  </ul>
                  <p className="mt-2">
                    Sofern Sie uns eine Einwilligung erteilt haben, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen.
                  </p>
                  <p>
                    Sie können sich jederzeit mit einer Beschwerde an eine Aufsichtsbehörde wenden, z. B. an die zuständige Aufsichtsbehörde des Bundeslands Ihres Wohnsitzes oder an die für uns als verantwortliche Stelle zuständige Behörde.
                  </p>
                  <p>
                    Eine Liste der Aufsichtsbehörden (für den nichtöffentlichen Bereich) mit Anschrift finden Sie unter:{" "}
                    <a href="https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      https://www.bfdi.bund.de/DE/Service/Anschriften/Laender/Laender-node.html
                    </a>.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Hosting und technische Bereitstellung über Vercel</h3>
                  <p>
                    Die Website und ihre serverseitigen Funktionen werden über die Infrastruktur von Vercel bereitgestellt. Beim Aufruf verarbeitet die Hosting-Infrastruktur technisch erforderliche Verbindungsdaten, insbesondere IP-Adresse, Zeitpunkt, aufgerufene Adresse und Browserinformationen, um die Seite auszuliefern sowie Stabilität und Sicherheit zu gewährleisten.
                  </p>
                  <p>
                    Informationen zum Umgang des Anbieters mit personenbezogenen Daten finden Sie in der{" "}
                    <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline">
                      Datenschutzerklärung von Vercel
                    </a>.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Veröffentlichte Website-Inhalte über Storyblok</h3>
                  <p>
                    Texte und freigegebene Medien der öffentlichen Website werden über das Content-Management-System und Content Delivery Network von Storyblok bereitgestellt. Beim Abruf solcher Inhalte kann Ihr Browser eine direkte Verbindung zu Storyblok-Domains herstellen und dabei technisch erforderliche Verbindungsdaten, insbesondere die IP-Adresse, übermitteln.
                  </p>
                  <p>
                    Storyblok dient hier der Veröffentlichung allgemeiner Website-Inhalte. Patientenstammdaten und Vorgänge aus dem internen Verwaltungsbereich werden davon getrennt in der Praxisdatenbank gespeichert. Weitere Anbieterinformationen finden Sie auf{" "}
                    <a href="https://www.storyblok.com" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline">
                      storyblok.com
                    </a>.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Interner Verwaltungsbereich und Praxisdatenbank</h3>
                  <p>
                    Unter <code>/verwaltung</code> betreibt die Praxis einen nicht öffentlichen Verwaltungsbereich. Der Zugriff ist für autorisierte Mitglieder des Praxisteams bestimmt. Dort können unter anderem Patienten- und Kundenstammdaten, Kontaktdaten, Termine, Statusangaben, Erinnerungen und Kostenvoranschläge verarbeitet werden.
                  </p>
                  <p>
                    Die Daten werden in einer PostgreSQL-Datenbank gespeichert, die technisch über Neon bereitgestellt wird. Je nach Eintrag können darunter Gesundheitsdaten und damit besonders geschützte personenbezogene Daten sein. Solche Daten dürfen nur im erforderlichen Umfang erfasst und innerhalb des berechtigten Praxisteams eingesehen werden. Umfang und Dauer der Speicherung richten sich nach dem jeweiligen Behandlungs- oder Verwaltungszweck sowie den für die Praxis geltenden Aufbewahrungspflichten.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>E-Mail-Versand über den Praxis-SMTP-Dienst</h3>
                  <p>
                    Für von der Praxis ausgelöste E-Mails, beispielsweise Terminerinnerungen, wird der im Verwaltungsbereich konfigurierte SMTP-Dienstleister verwendet. Zur Zustellung werden insbesondere Empfängeradresse, Absender, Betreff, Nachrichteninhalt und technische Versanddaten an diesen Dienst übermittelt.
                  </p>
                  <p>
                    Der konkrete SMTP-Anbieter wird von der Praxis konfiguriert und kann wechseln. Auskunft über den aktuell eingesetzten Anbieter und die für einen konkreten Versand verarbeiteten Daten erhalten Sie über die oben genannten Praxiskontaktdaten.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Kontaktaufnahme</h3>
                  <p>
                    Auf dieser Website gibt es kein Kontaktformular. Sie können die Praxis über die angegebenen Telefon-, E-Mail- und WhatsApp-Links kontaktieren. Erst wenn Sie einen solchen Link auswählen, wird die zugehörige Telefon-, E-Mail- oder Drittanbieter-Anwendung geöffnet.
                  </p>
                  <p>
                    Wenn Sie uns kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung und Beantwortung Ihrer Anfrage sowie, soweit erforderlich, zur Vorbereitung oder Durchführung des Behandlungsverhältnisses. Gesetzliche Aufbewahrungspflichten bleiben unberührt.
                  </p>
                  <p>
                    Bitte übermitteln Sie besonders sensible Gesundheitsdaten nicht unaufgefordert per unverschlüsselter E-Mail oder WhatsApp. Rufen Sie uns im Zweifel zunächst an.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Cookies, lokaler Speicher und Webanalyse</h3>
                  <p>
                    Auf den öffentlich zugänglichen Seiten setzen wir derzeit weder Google Analytics noch andere Webanalyse- oder Marketing-Tracker ein. Entsprechend werden hierfür keine Analyse- oder Marketing-Cookies gesetzt.
                  </p>
                  <p>
                    Damit ein bereits geschlossenes Hinweisfenster innerhalb derselben Browser-Sitzung nicht erneut erscheint, kann ausschließlich eine technische Sitzungsmarkierung im Session Storage Ihres Browsers gespeichert werden. Sie enthält keine Kontakt- oder Gesundheitsdaten, wird nicht an uns übertragen und beim Beenden der Browser-Sitzung verworfen.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Schriftarten</h3>
                  <p>
                    Die Website lädt keine Schriftarten von Google Fonts oder einem anderen externen Schriftanbieter. Es werden lokal auf Ihrem Gerät verfügbare Systemschriften verwendet; dabei wird keine Verbindung zu einem Schrift-CDN hergestellt.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Google Maps nach Aktivierung</h3>
                  <p>
                    Die Karte von Google Maps ist beim Aufruf der Seite zunächst deaktiviert. Solange Sie nicht auf „Google Maps laden“ klicken, wird kein Karteninhalt von Google geladen und über die Karte keine Verbindung zu Google hergestellt.
                  </p>
                  <p>
                    Nach Ihrer Aktivierung wird ein Karten-Frame von Google geladen. Dabei können insbesondere Ihre IP-Adresse, Browserinformationen und die aufgerufene Seite an Google übermittelt werden. Sind Sie bei Google angemeldet, kann Google den Aufruf Ihrem Konto zuordnen. Die Aktivierung gilt für den aktuellen Seitenaufruf; nach einem Neuladen ist die Karte wieder deaktiviert.
                  </p>
                  <p>
                    Weitere Informationen finden Sie in den{" "}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      Datenschutzhinweisen von Google
                    </a>.
                  </p>
                </div>

                <div>
                    <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Online-Terminvereinbarung (DR.FLEX)</h3>
                    <p>
                      Die Schaltflächen zur Online-Terminvereinbarung öffnen die externe DR.FLEX-Seite in einem neuen Browser-Tab. Auf dieser Website ist kein DR.FLEX-Skript oder -Frame eingebettet; vor Ihrem Klick wird daher keine Verbindung zu DR.FLEX hergestellt.
                    </p>
                    <p>
                      Nach dem Öffnen gelten die Datenschutzbestimmungen des externen Anbieters. Angaben, die Sie dort eingeben, werden unmittelbar auf dessen Website verarbeitet. Weitere Informationen finden Sie auf{" "}
                      <a href="https://dr-flex.de" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline">
                        dr-flex.de
                      </a>.
                    </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Digitaler Anamnesebogen (Adobe Acrobat Sign)</h3>
                  <p>
                    Der Link zum digitalen Anamnesebogen öffnet eine externe Seite von Adobe Acrobat Sign in einem neuen Browser-Tab. Der Dienst ist nicht in diese Website eingebettet; eine Verbindung zu Adobe wird erst hergestellt, wenn Sie den Link auswählen.
                  </p>
                  <p>
                    Angaben im Anamnesebogen können Gesundheitsdaten und damit besonders geschützte personenbezogene Daten enthalten. Diese Eingaben erfolgen unmittelbar auf der externen Adobe-Seite. Bitte nutzen Sie den Dienst nur, wenn Sie die dort angezeigten Hinweise geprüft haben. Informationen zur Datenverarbeitung finden Sie in der{" "}
                    <a href="https://www.adobe.com/privacy/policy.html" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline">
                      Datenschutzerklärung von Adobe
                    </a>.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>SSL-Verschlüsselung</h3>
                  <p>
                    Um die Sicherheit Ihrer Daten bei der Übertragung zu schützen, verwenden wir dem aktuellen Stand der Technik entsprechende Verschlüsselungsverfahren (z. B. SSL) über HTTPS.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Information über Ihr Widerspruchsrecht nach Art. 21 DSGVO</h3>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Einzelfallbezogenes Widerspruchsrecht</h4>
                  <p>
                    Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit gegen die Verarbeitung Sie betreffender personenbezogener Daten, die aufgrund Art. 6 Abs. 1 lit. f DSGVO (Datenverarbeitung auf der Grundlage einer Interessenabwägung) erfolgt, Widerspruch einzulegen; dies gilt auch für ein auf diese Bestimmung gestütztes Profiling im Sinne von Art. 4 Nr. 4 DSGVO.
                  </p>
                  <p>
                    Legen Sie Widerspruch ein, werden wir Ihre personenbezogenen Daten nicht mehr verarbeiten, es sei denn, wir können zwingende schutzwürdige Gründe für die Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen.
                  </p>
                </div>

                <div>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Empfänger eines Widerspruchs</h4>
                  <p>Dr. med. dent. Julian Burg &amp; Dr. med. dent. Christoph Amann</p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Änderung unserer Datenschutzbestimmungen</h3>
                  <p>
                    Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht oder um Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen, z.B. bei der Einführung neuer Services. Für Ihren erneuten Besuch gilt dann die neue Datenschutzerklärung.
                  </p>
                </div>
              </div>
            </section>
        </div>
      </div>
    </main>
  );
}
