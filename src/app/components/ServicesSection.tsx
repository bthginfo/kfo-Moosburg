import { IMAGES } from "./images";
import { ScrollReveal } from "./ScrollReveal";
import { motion } from "motion/react";

const services = [
  {
    title: "Herausnehmbare Zahnspangen",
    description:
      "Jede Behandlung wird individuell geplant. Wenn noch nicht alle bleibenden Zähne durchgebrochen sind, können häufig herausnehmbare Zahnspangen verwendet werden, um z.B. die Kiefer richtig zueinander einzustellen.",
    image: IMAGES.serviceRemovable,
    alt: "Herausnehmbare Zahnspangen",
    layout: "image-left" as const,
  },
  {
    title: "Festsitzende Zahnspangen",
    description:
      "Mit der festen Zahnspange können Zahn- und Kieferfehlstellungen effizient behandelt werden. Uns ist es ein großes Anliegen, die Behandlungszeit mit der festen Zahnspange auf ein Minimum zu begrenzen. Daher sind wir sehr stolz auf eine durchschnittliche Tragezeit von nur 13 Monaten.",
    image: IMAGES.serviceFixed,
    alt: "Festsitzende Zahnspangen",
    layout: "image-right" as const,
    highlight: "Ø nur 13 Monate",
  },
  {
    title: "Behandlung von Erwachsenen",
    description:
      "Kieferorthopädische Behandlungen sind in jedem Alter möglich. Für die Korrektur von einzelnen störenden Zahnfehlstellungen reichen oft wenige Monate. Schwere Fehlstellungen der Kiefer können begleitend zur Zahnspange mit Hilfe einer Kiefer-OP behandelt werden.",
    image: IMAGES.serviceAdults,
    alt: "Behandlung von Erwachsenen",
    layout: "image-left" as const,
  },
  {
    title: "Fast unsichtbare Zahnspangen",
    description:
      "Durchsichtige Zahnschienen (Aligner) können oft eine Alternative zur festen Zahnspange sein. Somit ist die Behandlung fast unsichtbar. Zum Essen können sie außerdem herausgenommen werden.",
    image: IMAGES.serviceAligner,
    alt: "Unsichtbare Aligner",
    layout: "image-right" as const,
  },
];

function ServiceBlock({ service, index }: { service: typeof services[0]; index: number }) {
  const isLeft = service.layout === "image-left";

  return (
    <div className="px-5 md:px-10">
      <div className="max-w-[80rem] mx-auto py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Image */}
          <ScrollReveal
            direction={isLeft ? "left" : "right"}
            delay={index * 60}
            className={`relative group ${isLeft ? "order-1" : "order-1 md:order-2"}`}
          >
            <div className="overflow-hidden rounded-[1.25rem]">
              <motion.img
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.5 }}
                src={service.image}
                alt={service.alt}
                className="w-full object-cover max-h-[24rem] md:max-h-[32rem]"
                loading="lazy"
              />
            </div>
            {/* Orange square with gentle rotation */}
            <motion.div
              animate={{ rotate: [0, 2, 0, -2, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:block absolute bg-[#f58a07] rounded-[1.25rem] w-24 h-24 -z-10"
              style={{
                ...(isLeft ? { top: "20%", left: "-5%" } : { top: "70%", right: "-5%" }),
                mixBlendMode: "multiply",
              }}
            />
          </ScrollReveal>

          {/* Text */}
          <ScrollReveal
            direction={isLeft ? "right" : "left"}
            delay={index * 60 + 150}
            className={`flex flex-col justify-center items-start ${isLeft ? "order-2" : "order-2 md:order-1"}`}
          >
            {"highlight" in service && service.highlight && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                className="inline-block bg-[#f58a07]/10 text-[#f58a07] rounded-full px-4 py-1 mb-4 text-sm"
                style={{ fontWeight: 600 }}
              >
                {service.highlight}
              </motion.span>
            )}
            <h2 className="text-2xl md:text-[3rem] leading-tight">{service.title}</h2>
            <div className="h-4" />
            <p>{service.description}</p>
            <div className="h-6" />
            <motion.button
              whileHover={{ x: 4 }}
              onClick={() => {
                if (typeof (window as any).toggleDrFlexAppointments === "function") {
                  (window as any).toggleDrFlexAppointments();
                }
              }}
              className="text-[#f58a07] hover:text-[#ce7305] transition-colors cursor-pointer group/btn flex items-center gap-1"
              style={{ fontWeight: 500 }}
            >
              Beratungstermin vereinbaren
              <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </motion.button>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}

export function ServicesSection() {
  return (
    <div id="leistungen">
      {/* Parallax separator */}
      <div className="relative h-48 md:h-[400px] overflow-hidden">
        <motion.div
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{ backgroundImage: `url(${IMAGES.praxisParallax})` }}
        />
        <div className="absolute inset-0 bg-[#063255]/40" />
        <div className="relative z-10 flex items-center justify-center h-full px-5">
          <ScrollReveal>
            <h2 className="text-white text-2xl md:text-[3rem] text-center drop-shadow-lg">
              Unsere Leistungen
            </h2>
          </ScrollReveal>
        </div>
      </div>
      {services.map((service, index) => (
        <ServiceBlock key={index} service={service} index={index} />
      ))}
    </div>
  );
}
