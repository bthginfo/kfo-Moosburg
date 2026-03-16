import { ShieldCheck } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";
import { useHomeContent } from "./hooks/useHomeContent";

export function RetainerSection() {
  const c = useHomeContent();

  return (
    <section className="bg-[#edf7ff]">
      <div className="px-5 md:px-10">
        <div className="max-w-[80rem] mx-auto py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
            <ScrollReveal direction="left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#f58a07]/10 flex items-center justify-center shrink-0 mt-1">
                  <ShieldCheck className="w-6 h-6 text-[#f58a07]" />
                </div>
                <h3 className="text-2xl md:text-[2.25rem] leading-tight">
                  {c.retainer_title}
                </h3>
              </div>
            </ScrollReveal>
            <ScrollReveal direction="right" delay={150}>
              <p>{c.retainer_description}</p>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}