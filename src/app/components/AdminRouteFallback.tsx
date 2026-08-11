import { LoaderCircle } from "lucide-react";
import { PageMeta } from "./PageMeta";

export function AdminRouteFallback() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#edf7ff] px-6 text-center text-[#173249]">
      <PageMeta
        title="Verwaltung | KFO Moosburg"
        description="Geschützter interner Verwaltungsbereich der KFO Moosburg."
        noIndex
      />
      <div className="rounded-xl bg-[#063255] px-4 py-3 font-semibold text-white">KFO <span className="text-[#f58a07]">Moosburg</span></div>
      <LoaderCircle className="mt-8 h-7 w-7 animate-spin text-[#f58a07]" aria-hidden="true" />
      <p className="mt-4 text-sm text-[#60798a]">Sichere Verwaltung wird geladen …</p>
    </main>
  );
}
