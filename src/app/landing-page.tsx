"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const SLIDES = [
  {
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663591706935/RvmxJucBgZkUnsdm.jpg",
    title: "Movilidad Global de Talento",
    subtitle: "Estrategia integral para ejecutivos en transición",
  },
  {
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663591706935/kmtRLSODHPexWzmo.jpg",
    title: "Adaptación Estratégica",
    subtitle: "Posicionamiento en nuevos mercados laborales",
  },
  {
    image:
      "https://files.manuscdn.com/user_upload_by_module/session_file/310519663591706935/ylrhIaSWKKPDepbA.jpg",
    title: "Outplacement de Alto Nivel",
    subtitle: "Coaching personalizado para líderes ejecutivos",
  },
];

const SERVICES = [
  {
    title: "Outplacement Ejecutivo",
    text: "Coaching de carrera personalizado, desarrollo de marca profesional, estrategia de búsqueda de empleo y acceso a nuestra red exclusiva de contactos de alto nivel en el mercado global.",
  },
  {
    title: "Relocación Laboral",
    text: "Asesoramiento integral para adaptación al nuevo mercado laboral, análisis de oportunidades regionales, cumplimiento normativo y estrategia de posicionamiento profesional en el destino.",
  },
  {
    title: "Asesoramiento Estratégico",
    text: "Análisis de oportunidades de carrera, negociación de paquetes ejecutivos, planificación de transición empresarial y desarrollo de estrategia de movilidad profesional a largo plazo.",
  },
];

const ACCESS_CARDS = [
  {
    role: "administrador",
    title: "Administrador",
    text: "Gestión integral del programa, supervisión de coaches, análisis de resultados y administración de usuarios del sistema.",
    cta: "Acceso Admin",
  },
  {
    role: "coach",
    title: "Coach",
    text: "Gestión de clientes asignados, seguimiento de progreso, documentación de sesiones y reportes de avance profesional.",
    cta: "Acceso Coach",
  },
  {
    role: "usuario",
    title: "Usuario",
    text: "Acceso a recursos de desarrollo, seguimiento de tu progreso, comunicación con tu coach y herramientas de carrera.",
    cta: "Acceso Usuario",
  },
];

const VALUES = [
  {
    title: "Discreción Absoluta",
    text: "Confidencialidad garantizada en cada etapa del proceso. Protegemos tu reputación y privacidad con los más altos estándares profesionales.",
  },
  {
    title: "Red Exclusiva Global",
    text: "Acceso a una red internacional de ejecutivos, empresas Fortune 500 y oportunidades no publicadas en el mercado laboral convencional.",
  },
  {
    title: "Experiencia Probada",
    text: "Más de 20 años acompañando a ejecutivos en transiciones exitosas. Tasa de recolocación superior al 95% en mercados globales.",
  },
  {
    title: "Alcance Global",
    text: "Presencia en 50+ países con equipos locales que entienden el mercado laboral y la cultura empresarial de cada región.",
  },
];

const TESTIMONIALS = [
  {
    text: '"El equipo fue extraordinario. En 6 meses logré una posición mejor que la anterior, con mejor compensación y ubicación estratégica en el mercado."',
    author: "Carlos Mendoza",
    position: "CFO, Empresa Tecnológica",
  },
  {
    text: '"La adaptación a un nuevo mercado laboral fue impecable. Desde el análisis de oportunidades hasta la integración profesional, todo fue coordinado profesionalmente."',
    author: "María González",
    position: "Directora Regional, Sector Financiero",
  },
  {
    text: '"Su red de contactos fue invaluable. Accedí a oportunidades que nunca hubiera encontrado por mi cuenta. Altamente recomendado para ejecutivos en transición."',
    author: "Roberto Silva",
    position: "VP Operaciones, Multinacional",
  },
];

const CSS = `
* { margin: 0; padding: 0; box-sizing: border-box; }
.landing-root {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #222;
  background-color: #fff;
}
.landing-root header { background: #000; color: #fff; padding: 1.5rem 0; position: sticky; top: 0; z-index: 100; }
.header-container { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 0 2rem; }
.logo { font-size: 1.3rem; font-weight: 600; letter-spacing: 0.5px; }
.landing-root nav ul { display: flex; list-style: none; gap: 2.5rem; }
.landing-root nav a { color: #fff; text-decoration: none; font-size: 0.9rem; font-weight: 500; transition: color 0.3s ease; cursor: pointer; }
.landing-root nav a:hover { color: #999; }
.cta-button { background: #000; color: #fff; padding: 0.7rem 1.8rem; border: 1px solid #fff; border-radius: 0; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: all 0.3s ease; }
.cta-button:hover { background: #fff; color: #000; }
.hero { position: relative; height: 600px; overflow: hidden; background: #000; }
.carousel-container { position: relative; width: 100%; height: 100%; }
.carousel-slide { position: absolute; width: 100%; height: 100%; opacity: 0; transition: opacity 0.8s ease-in-out; background-size: cover; background-position: center; }
.carousel-slide.active { opacity: 1; }
.slide-overlay { position: absolute; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; flex-direction: column; }
.slide-content { text-align: center; color: #fff; animation: slideInUp 0.8s ease-out; }
@keyframes slideInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.slide-content h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 600; letter-spacing: -0.5px; }
.slide-content p { font-size: 1.1rem; margin-bottom: 2rem; font-weight: 300; }
.slide-cta { background: #fff; color: #000; padding: 0.8rem 2rem; border: none; border-radius: 0; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; }
.slide-cta:hover { background: #000; color: #fff; border: 1px solid #fff; }
.carousel-controls { position: absolute; bottom: 2rem; left: 50%; transform: translateX(-50%); display: flex; gap: 0.8rem; z-index: 10; }
.carousel-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.3s ease; border: none; }
.carousel-dot.active { background: #fff; transform: scale(1.2); }
.carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); color: #fff; border: none; font-size: 1.5rem; padding: 1rem 1.2rem; cursor: pointer; transition: all 0.3s ease; z-index: 10; }
.carousel-arrow:hover { background: rgba(255,255,255,0.4); }
.carousel-arrow.prev { left: 2rem; }
.carousel-arrow.next { right: 2rem; }
.services { max-width: 1200px; margin: 5rem auto; padding: 0 2rem; }
.section-title { text-align: center; font-size: 2.2rem; margin-bottom: 3.5rem; color: #000; font-weight: 600; letter-spacing: -0.5px; }
.services-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 3rem; margin-bottom: 4rem; }
.service-card { background: #fff; padding: 2rem; transition: all 0.3s ease; }
.service-card:hover { transform: translateY(-5px); }
.service-card h3 { font-size: 1.3rem; margin-bottom: 1rem; color: #000; font-weight: 600; }
.service-card p { color: #555; line-height: 1.8; font-size: 0.95rem; }
.access-section { background: #f5f5f5; padding: 4rem 2rem; margin: 4rem 0; }
.access-container { max-width: 1200px; margin: 0 auto; }
.access-title { text-align: center; font-size: 2.2rem; margin-bottom: 3.5rem; color: #000; font-weight: 600; letter-spacing: -0.5px; }
.access-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; }
.access-card { background: #fff; padding: 2.5rem; text-align: center; transition: all 0.3s ease; }
.access-card:hover { transform: translateY(-5px); }
.access-card h3 { font-size: 1.4rem; margin-bottom: 1rem; color: #000; font-weight: 600; }
.access-card p { color: #666; margin-bottom: 1.5rem; font-size: 0.95rem; line-height: 1.7; }
.access-button { background: #000; color: #fff; padding: 0.9rem 2rem; border: none; border-radius: 0; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.3s ease; display: inline-block; }
.access-button:hover { background: #333; }
.value-prop { background: #fff; padding: 4rem 2rem; margin: 4rem 0; }
.value-prop-container { max-width: 1200px; margin: 0 auto; }
.value-prop h2 { text-align: center; font-size: 2.2rem; margin-bottom: 3.5rem; color: #000; font-weight: 600; letter-spacing: -0.5px; }
.value-items { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2.5rem; }
.value-item { text-align: center; padding: 2rem; background: #f5f5f5; transition: all 0.3s ease; }
.value-item:hover { transform: translateY(-5px); }
.value-item h3 { font-size: 1.1rem; margin-bottom: 0.8rem; color: #000; font-weight: 600; }
.value-item p { font-size: 0.9rem; line-height: 1.7; color: #666; }
.testimonials { max-width: 1200px; margin: 4rem auto; padding: 0 2rem; }
.testimonials-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2.5rem; }
.testimonial-card { background: #f5f5f5; padding: 2rem; transition: all 0.3s ease; }
.testimonial-card:hover { transform: translateY(-5px); }
.testimonial-text { font-style: italic; color: #555; margin-bottom: 1.5rem; line-height: 1.8; font-size: 0.95rem; }
.testimonial-author { font-weight: 600; color: #000; font-size: 0.9rem; }
.testimonial-position { color: #888; font-size: 0.8rem; margin-top: 0.3rem; }
.landing-root footer { background: #000; color: #fff; padding: 3rem 2rem 1.5rem; margin-top: 4rem; }
.footer-container { max-width: 1200px; margin: 0 auto; }
.footer-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem; margin-bottom: 2rem; }
.footer-section h4 { margin-bottom: 1rem; color: #fff; font-weight: 600; font-size: 0.95rem; }
.footer-section ul { list-style: none; }
.footer-section a { color: #999; text-decoration: none; transition: color 0.3s ease; display: block; margin-bottom: 0.5rem; font-size: 0.9rem; cursor: pointer; }
.footer-section a:hover { color: #fff; }
.footer-section p { color: #999; font-size: 0.9rem; line-height: 1.6; }
.footer-bottom { border-top: 1px solid #333; padding-top: 1.5rem; text-align: center; color: #666; font-size: 0.8rem; }
.social-links { display: flex; gap: 1rem; margin-top: 1rem; }
.social-links a { display: inline-flex; width: 36px; height: 36px; align-items: center; justify-content: center; background: #222; color: #fff; text-decoration: none; transition: all 0.3s ease; font-size: 0.8rem; font-weight: 600; }
.social-links a:hover { background: #fff; color: #000; }
@media (max-width: 768px) {
  .landing-root nav ul { display: none; }
  .slide-content h1 { font-size: 1.8rem; }
  .slide-content p { font-size: 0.95rem; }
  .section-title, .access-title, .value-prop h2 { font-size: 1.6rem; }
  .hero { height: 400px; }
  .carousel-arrow { padding: 0.7rem 0.9rem; font-size: 1.2rem; }
  .services-grid, .access-grid { gap: 2rem; }
  .value-items { gap: 1.5rem; }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.fade-in { animation: fadeIn 0.6s ease-out; }
`;

export default function LandingPage() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(id);
  }, []);

  function scrollToAccess() {
    document.getElementById("acceso")?.scrollIntoView({ behavior: "smooth" });
  }

  function scrollToId(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  function handleAccess(role: string) {
    window.location.href = `/login?role=${role}`;
  }

  return (
    <div className="landing-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header>
        <div className="header-container">
          <div className="logo">EXECUTIVE TRANSITION</div>
          <nav>
            <ul>
              <li>
                <a onClick={() => scrollToId("inicio")}>Inicio</a>
              </li>
              <li>
                <a onClick={() => scrollToId("servicios")}>Servicios</a>
              </li>
              <li>
                <a onClick={scrollToAccess}>Acceso</a>
              </li>
              <li>
                <a onClick={() => scrollToId("propuesta")}>Propuesta</a>
              </li>
              <li>
                <a onClick={() => scrollToId("testimonios")}>Testimonios</a>
              </li>
              <li>
                <a onClick={() => scrollToId("contacto")}>Contacto</a>
              </li>
            </ul>
          </nav>
          <button className="cta-button" onClick={scrollToAccess}>
            Acceder
          </button>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="carousel-container">
          {SLIDES.map((s, i) => (
            <div
              key={i}
              className={`carousel-slide ${i === slide ? "active" : ""}`}
              style={{ backgroundImage: `url('${s.image}')` }}
            >
              <div className="slide-overlay">
                <div className="slide-content">
                  <h1>{s.title}</h1>
                  <p>{s.subtitle}</p>
                  <button className="slide-cta" onClick={scrollToAccess}>
                    Acceder al Programa
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            className="carousel-arrow prev"
            onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}
          >
            ‹
          </button>
          <button
            className="carousel-arrow next"
            onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}
          >
            ›
          </button>

          <div className="carousel-controls">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === slide ? "active" : ""}`}
                onClick={() => setSlide(i)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="services" id="servicios">
        <h2 className="section-title">Nuestros Servicios</h2>
        <div className="services-grid">
          {SERVICES.map((s) => (
            <div key={s.title} className="service-card fade-in">
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="access-section" id="acceso">
        <div className="access-container">
          <h2 className="access-title">Acceso al Programa</h2>
          <div className="access-grid">
            {ACCESS_CARDS.map((c) => (
              <div key={c.role} className="access-card fade-in">
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <button
                  className="access-button"
                  onClick={() => handleAccess(c.role)}
                >
                  {c.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="value-prop" id="propuesta">
        <div className="value-prop-container">
          <h2>Por Qué Elegirnos</h2>
          <div className="value-items">
            {VALUES.map((v) => (
              <div key={v.title} className="value-item">
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="testimonials" id="testimonios">
        <h2 className="section-title">Lo Que Dicen Nuestros Clientes</h2>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t) => (
            <div key={t.author} className="testimonial-card fade-in">
              <div className="testimonial-text">{t.text}</div>
              <div className="testimonial-author">{t.author}</div>
              <div className="testimonial-position">{t.position}</div>
            </div>
          ))}
        </div>
      </section>

      <footer id="contacto">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Sobre Nosotros</h4>
              <p>
                Somos especialistas en transiciones ejecutivas, outplacement
                y relocación laboral para mandos medios y alta dirección a
                nivel global.
              </p>
            </div>

            <div className="footer-section">
              <h4>Servicios</h4>
              <ul>
                <li>
                  <a onClick={() => scrollToId("servicios")}>
                    Outplacement Ejecutivo
                  </a>
                </li>
                <li>
                  <a onClick={() => scrollToId("servicios")}>
                    Relocación Laboral
                  </a>
                </li>
                <li>
                  <a onClick={() => scrollToId("servicios")}>
                    Coaching Estratégico
                  </a>
                </li>
                <li>
                  <a onClick={() => scrollToId("servicios")}>
                    Asesoramiento Ejecutivo
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Contacto</h4>
              <ul>
                <li>
                  <a href="mailto:info@example.com">info@example.com</a>
                </li>
                <li>
                  <a href="tel:+1234567890">+1 (234) 567-890</a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Headhunters</h4>
              <p>
                ¿Buscas talento ejecutivo? Solicita acceso a nuestra base
                de candidatos.
              </p>
              <ul>
                <li>
                  <a href="/solicitar-acceso-headhunter">
                    Solicitar acceso
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Síguenos</h4>
              <div className="social-links">
                <a href="#" title="LinkedIn">
                  in
                </a>
                <a href="#" title="Twitter">
                  𝕏
                </a>
                <a href="#" title="Facebook">
                  f
                </a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; 2026 Executive Transition. Todos los derechos
              reservados. |{" "}
              <a href="/privacidad" style={{ color: "#666", textDecoration: "none" }}>
                Política de Privacidad
              </a>{" "}
              |{" "}
              <a href="#" style={{ color: "#666", textDecoration: "none" }}>
                Términos de Servicio
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
