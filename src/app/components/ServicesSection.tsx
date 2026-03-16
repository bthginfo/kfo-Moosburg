import { motion } from "motion/react";
import { useHomeContent } from "./hooks/useHomeContent";

interface ServiceItem {
  title: string;
  description: string;
  image: string;
  alt: string;
  layout: "image-left" | "image-right";
  highlight: string;
}

function ServiceBlock({ service, index }: { service: ServiceItem; index: number }) {
  const isLeft = service.layout === "image-left";

  return (
    <div className="px-5 md:px-10">
      <div className="max-w-[80rem] mx-auto py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Image */}
          <motion.div
            initial={{ x: isLeft ? -50 : 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 60 }}
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
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ x: isLeft ? 50 : -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 60 + 150 }}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export function ServicesSection() {
  const c = useHomeContent();

  const services: ServiceItem[] = [1, 2, 3, 4].map((i) => ({
    title: c[`service_${i}_title`],
    description: c[`service_${i}_description`],
    image: c[`service_${i}_image`],
    alt: c[`service_${i}_title`],
    layout: (c[`service_${i}_layout`] || (i % 2 === 1 ? "image-left" : "image-right")) as "image-left" | "image-right",
    highlight: c[`service_${i}_highlight`] || "",
  }));

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
          style={{ backgroundImage: `url(${c.services_parallax_image})` }}
        />
        <div className="absolute inset-0 bg-[#063255]/40" />
        <div className="relative z-10 flex items-center justify-center h-full px-5">
          <motion.div>
            <h2 className="text-white text-2xl md:text-[3rem] text-center drop-shadow-lg">
              {c.services_title}
            </h2>
          </motion.div>
        </div>
      </div>
      {services.map((service, index) => (
        <ServiceBlock key={index} service={service} index={index} />
      ))}
    </div>
  );
}