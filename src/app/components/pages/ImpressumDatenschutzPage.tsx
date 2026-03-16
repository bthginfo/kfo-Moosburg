import { useEffect } from "react";
import { useLocation } from "react-router";

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
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Kontaktformular</h3>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Art und Zweck der Verarbeitung:</h4>
                  <p>
                    Die von Ihnen eingegebenen Daten werden zum Zweck der individuellen Kommunikation mit Ihnen gespeichert. Hierfür ist die Angabe einer validen E-Mail-Adresse sowie Ihres Namens erforderlich. Diese dient der Zuordnung der Anfrage und der anschließenden Beantwortung derselben. Die Angabe weiterer Daten ist optional.
                  </p>
                </div>

                <div>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Rechtsgrundlage:</h4>
                  <p>
                    Die Verarbeitung der in das Kontaktformular eingegebenen Daten erfolgt auf der Grundlage eines berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO).
                  </p>
                  <p>
                    Durch Bereitstellung des Kontaktformulars möchten wir Ihnen eine unkomplizierte Kontaktaufnahme ermöglichen. Ihre gemachten Angaben werden zum Zwecke der Bearbeitung der Anfrage sowie für mögliche Anschlussfragen gespeichert.
                  </p>
                  <p>
                    Sofern Sie mit uns Kontakt aufnehmen, um ein Angebot zu erfragen, erfolgt die Verarbeitung der in das Kontaktformular eingegebenen Daten zur Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO).
                  </p>
                </div>

                <div>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Empfänger:</h4>
                  <p>Empfänger der Daten sind ggf. Auftragsverarbeiter.</p>
                </div>

                <div>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Speicherdauer:</h4>
                  <p>Daten werden spätestens 6 Monate nach Bearbeitung der Anfrage gelöscht.</p>
                  <p>
                    Sofern es zu einem Vertragsverhältnis kommt, unterliegen wir den gesetzlichen Aufbewahrungsfristen nach HGB und löschen Ihre Daten nach Ablauf dieser Fristen.
                  </p>
                </div>

                <div>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Bereitstellung vorgeschrieben oder erforderlich:</h4>
                  <p>
                    Die Bereitstellung Ihrer personenbezogenen Daten erfolgt freiwillig. Wir können Ihre Anfrage jedoch nur bearbeiten, sofern Sie uns Ihren Namen, Ihre E-Mail-Adresse und den Grund der Anfrage mitteilen.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Verwendung von Google Analytics</h3>
                  <p>
                    Soweit Sie ihre Einwilligung gegeben haben, wird auf dieser Website Google Analytics eingesetzt, ein Webanalysedienst der Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043 USA (nachfolgend: „Google"). Google Analytics verwendet sog. „Cookies", also Textdateien, die auf Ihrem Computer gespeichert werden und die eine Analyse der Benutzung der Webseite durch Sie ermöglichen. Die durch das Cookie erzeugten Informationen über Ihre Benutzung dieser Webseite werden in der Regel an einen Server von Google in den USA übertragen und dort gespeichert. Aufgrund der Aktivierung der IP-Anonymisierung auf diesen Webseiten, wird Ihre IP-Adresse von Google jedoch innerhalb von Mitgliedstaaten der Europäischen Union oder in anderen Vertragsstaaten des Abkommens über den Europäischen Wirtschaftsraum zuvor gekürzt. Nur in Ausnahmefällen wird die volle IP-Adresse an einen Server von Google in den USA übertragen und dort gekürzt. Die im Rahmen von Google Analytics von Ihrem Browser übermittelte IP-Adresse wird nicht mit anderen Daten von Google zusammengeführt.
                  </p>
                  <p>
                    Nähere Informationen zu Nutzungsbedingungen und Datenschutz finden Sie unter{" "}
                    <a href="https://www.google.com/analytics/terms/de.html" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      https://www.google.com/analytics/terms/de.html
                    </a>{" "}
                    und unter{" "}
                    <a href="https://policies.google.com/?hl=de" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      https://policies.google.com/?hl=de
                    </a>.
                  </p>
                  <p>
                    Im Auftrag des Betreibers dieser Website wird Google diese Informationen benutzen, um Ihre Nutzung der Webseite auszuwerten, um Reports über die Webseitenaktivitäten zusammenzustellen und um weitere mit der Websitenutzung und der Internetnutzung verbundene Dienstleistungen gegenüber dem Webseitenbetreiber zu erbringen.
                  </p>
                  <p>
                    Die von uns gesendeten und mit Cookies, Nutzerkennungen (z. B. User-ID) oder Werbe-IDs verknüpften Daten werden nach 14 Monaten automatisch gelöscht. Die Löschung von Daten, deren Aufbewahrungsdauer erreicht ist, erfolgt automatisch einmal im Monat.
                  </p>
                </div>

                <div>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Widerruf der Einwilligung:</h4>
                  <p>
                    Sie können das Tracking durch Google Analytics auf unserer Website unterbinden, indem Sie einen Opt-out-Cookie setzen. Damit wird die Erfassung durch Google Analytics für diese Website und für diesen Browser zukünftig verhindert, solange das Cookie in Ihrem Browser installiert bleibt.
                  </p>
                  <p>
                    Sie können darüber hinaus die Speicherung der Cookies durch eine entsprechende Einstellung Ihrer Browser-Software verhindern; wir weisen Sie jedoch darauf hin, dass Sie in diesem Fall gegebenenfalls nicht sämtliche Funktionen dieser Website vollumfänglich werden nutzen können.
                  </p>
                  <p>
                    Sie können darüber hinaus die Erfassung der durch das Cookie erzeugten und auf Ihre Nutzung der Webseite bezogenen Daten (inkl. Ihrer IP-Adresse) an Google sowie die Verarbeitung dieser Daten durch Google verhindern, indem sie das unter dem folgenden Link verfügbare Browser-Plugin herunterladen und installieren:{" "}
                    <a href="http://tools.google.com/dlpage/gaoptout?hl=de" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      Browser Add On zur Deaktivierung von Google Analytics
                    </a>.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Verwendung von Scriptbibliotheken (Google Webfonts)</h3>
                  <p>
                    Um unsere Inhalte browserübergreifend korrekt und grafisch ansprechend darzustellen, verwenden wir auf dieser Website „Google Web Fonts" der Google LLC (1600 Amphitheatre Parkway, Mountain View, CA 94043, USA; nachfolgend „Google") zur Darstellung von Schriften.
                  </p>
                  <p>
                    Weitere Informationen zu Google Web Fonts finden Sie unter{" "}
                    <a href="https://developers.google.com/fonts/faq" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      https://developers.google.com/fonts/faq
                    </a>{" "}
                    und in der Datenschutzerklärung von Google:{" "}
                    <a href="https://www.google.com/policies/privacy/" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      https://www.google.com/policies/privacy/
                    </a>.
                  </p>
                </div>

                <div>
                  <h3 className="text-[#0d1317] text-lg mb-2" style={{ fontWeight: 600 }}>Verwendung von Google Maps</h3>
                  <p>
                    Auf dieser Website nutzen wir das Angebot von Google Maps. Google Maps wird von Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA (nachfolgend „Google") betrieben. Dadurch können wir Ihnen interaktive Karten direkt in der Webseite anzeigen und ermöglichen Ihnen die komfortable Nutzung der Karten-Funktion.
                  </p>
                  <p>
                    Nähere Informationen über die Datenverarbeitung durch Google können Sie den Google-Datenschutzhinweisen entnehmen:{" "}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      https://policies.google.com/privacy
                    </a>. Dort können Sie im Datenschutzcenter auch Ihre persönlichen Datenschutz-Einstellungen verändern.
                  </p>
                  <p>
                    Ausführliche Anleitungen zur Verwaltung der eigenen Daten im Zusammenhang mit Google-Produkten finden Sie hier:{" "}
                    <a href="https://www.dataliberation.org/" target="_blank" rel="noopener noreferrer" className="text-[#f58a07] hover:underline break-all">
                      https://www.dataliberation.org
                    </a>
                  </p>
                  <p>
                    Durch den Besuch der Website erhält Google Informationen, dass Sie die entsprechende Unterseite unserer Webseite aufgerufen haben. Dies erfolgt unabhängig davon, ob Google ein Nutzerkonto bereitstellt, über das Sie eingeloggt sind, oder ob kein Nutzerkonto besteht. Wenn Sie bei Google eingeloggt sind, werden Ihre Daten direkt Ihrem Konto zugeordnet.
                  </p>
                  <p>
                    Wenn Sie die Zuordnung in Ihrem Profil bei Google nicht wünschen, müssen Sie sich vor Aktivierung des Buttons bei Google ausloggen. Google speichert Ihre Daten als Nutzungsprofile und nutzt sie für Zwecke der Werbung, Marktforschung und/oder bedarfsgerechter Gestaltung seiner Websites. Eine solche Auswertung erfolgt insbesondere (selbst für nicht eingeloggte Nutzer) zur Erbringung bedarfsgerechter Werbung und um andere Nutzer des sozialen Netzwerks über Ihre Aktivitäten auf unserer Website zu informieren. Ihnen steht ein Widerspruchsrecht zu gegen die Bildung dieser Nutzerprofile, wobei Sie sich zur Ausübung dessen an Google richten müssen.
                  </p>
                </div>

                <div>
                  <h4 className="text-[#0d1317] mb-1" style={{ fontWeight: 600 }}>Widerruf der Einwilligung:</h4>
                  <p>
                    Vom Anbieter wird derzeit keine Möglichkeit für einen einfachen Opt-out oder ein Blockieren der Datenübertragung angeboten. Wenn Sie eine Nachverfolgung Ihrer Aktivitäten auf unserer Website verhindern wollen, widerrufen Sie bitte im Cookie-Consent-Tool Ihre Einwilligung für die entsprechende Cookie-Kategorie oder alle technisch nicht notwendigen Cookies und Datenübertragungen. In diesem Fall können Sie unsere Website jedoch ggfs. nicht oder nur eingeschränkt nutzen.
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