import { AlertTriangle, RefreshCw } from "lucide-react";
import { Link, useRouteError } from "react-router";
import { PageMeta } from "./PageMeta";

export function RouteErrorPage() {
  useRouteError();
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#edf7ff] px-6 py-16 text-center text-[#173249]">
      <PageMeta
        title="Seite vorübergehend nicht verfügbar | KFO Moosburg"
        description="Die aufgerufene Seite konnte nicht geladen werden."
        noIndex
      />
      <div className="max-w-lg rounded-3xl border border-[#d3e2eb] bg-white p-8 shadow-[0_18px_60px_rgba(6,50,85,.12)] sm:p-10">
        <AlertTriangle className="mx-auto h-9 w-9 text-[#f58a07]" aria-hidden="true" />
        <h1 className="mt-5 text-2xl font-semibold">Diese Seite konnte nicht geladen werden.</h1>
        <p className="mt-3 text-sm leading-6 text-[#60798a]">Bitte laden Sie die Seite erneut. Falls das Problem bestehen bleibt, erreichen Sie die Praxis telefonisch.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button onClick={() => window.location.reload()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#063255] px-6 text-sm font-semibold text-white hover:bg-[#f58a07]">
            <RefreshCw className="h-4 w-4" /> Erneut laden
          </button>
          <Link to="/" className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#c9dbe6] px-6 text-sm font-semibold text-[#063255] hover:border-[#f58a07]">Zur Startseite</Link>
        </div>
      </div>
    </main>
  );
}
