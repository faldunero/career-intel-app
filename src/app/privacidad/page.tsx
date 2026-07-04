import Link from "next/link";

export const metadata = {
  title: "Política de Privacidad — Career Intelligence AI",
};

export default function PrivacyPolicyPage() {
  return (
    <main
      className="min-h-screen bg-white px-6 py-16 text-black"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-xs font-semibold uppercase tracking-widest text-black"
        >
          EXECUTIVE TRANSITION
        </Link>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Política de Privacidad
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          Última actualización: [FECHA]. Este documento es una plantilla
          técnica y debe ser revisado y validado por un abogado antes de
          considerarse definitivo.
        </p>

        <div className="mt-8 flex flex-col gap-8 text-sm leading-7 text-[#222]">
          <section>
            <h2 className="mb-2 text-lg font-semibold">
              1. Responsable del tratamiento
            </h2>
            <p>
              [NOMBRE LEGAL DE LA EMPRESA], RUT [XX.XXX.XXX-X], con domicilio
              en [DIRECCIÓN], es responsable del tratamiento de los datos
              personales recolectados a través de esta plataforma
              ("Career Intelligence AI"). Para consultas o para ejercer tus
              derechos, puedes escribir a{" "}
              <a href="mailto:[correo-privacidad]" className="underline">
                [correo de contacto de privacidad]
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              2. Qué datos recolectamos
            </h2>
            <ul className="list-disc pl-5">
              <li>Datos de cuenta: nombre, correo electrónico, contraseña (almacenada cifrada).</li>
              <li>Datos de perfil profesional: profesión, industria, cargo, años de experiencia, aspiraciones de carrera.</li>
              <li>Documentos que subes: tu CV y su contenido extraído.</li>
              <li>Datos de LinkedIn que nos compartes voluntariamente para su análisis.</li>
              <li>Historial de postulaciones y oportunidades laborales que registras.</li>
              <li>Transcripciones y resultados de las simulaciones de entrevista.</li>
              <li>Eventos de calendario que agendas (sesiones de coaching, entrevistas).</li>
              <li>Metadatos técnicos: dirección IP, tipo de dispositivo, registros de acceso, con fines de seguridad.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              3. Para qué usamos tus datos
            </h2>
            <ul className="list-disc pl-5">
              <li>Prestar el servicio de asesoría y coaching de carrera.</li>
              <li>Generar análisis automatizados (compatibilidad ATS, matching de vacantes, feedback de entrevistas) mediante modelos de inteligencia artificial de terceros.</li>
              <li>Permitir que tu coach asignado revise tu progreso y te entregue retroalimentación.</li>
              <li>Seguridad de la cuenta (autenticación, verificación en dos pasos, prevención de fraude).</li>
              <li>Mejorar la plataforma.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">4. Base legal</h2>
            <p>
              Tratamos tus datos sobre la base de tu consentimiento, otorgado
              al crear tu cuenta y aceptar esta política, y de la ejecución
              del servicio que nos solicitas.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              5. Con quién compartimos tus datos
            </h2>
            <p>
              No vendemos tus datos. Los compartimos únicamente con
              proveedores que procesan datos en nuestro nombre
              (encargados de tratamiento), bajo las instrucciones y
              resguardos correspondientes:
            </p>
            <ul className="mt-2 list-disc pl-5">
              <li>Supabase (base de datos, autenticación, almacenamiento de archivos).</li>
              <li>Groq (procesamiento de IA sobre el contenido que subes, para generar los análisis).</li>
              <li>Vercel (alojamiento de la aplicación).</li>
              <li>Google (si inicias sesión con tu cuenta de Google).</li>
            </ul>
            <p className="mt-2">
              Algunos de estos proveedores pueden procesar o almacenar datos
              fuera de Chile. [DETALLAR PAÍSES/REGIONES Y GARANTÍAS DE
              TRANSFERENCIA INTERNACIONAL SEGÚN CORRESPONDA].
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              6. Cuánto tiempo conservamos tus datos
            </h2>
            <p>
              Conservamos tus datos mientras mantengas una cuenta activa en
              la plataforma. Si solicitas la eliminación de tu cuenta, tus
              datos personales se eliminan según se describe en la sección
              8, salvo que debamos conservar cierta información por
              obligación legal.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              7. Tus derechos (ARCO+)
            </h2>
            <p>Tienes derecho a:</p>
            <ul className="mt-2 list-disc pl-5">
              <li><strong>Acceso:</strong> saber qué datos tenemos sobre ti.</li>
              <li><strong>Rectificación:</strong> corregir datos inexactos.</li>
              <li><strong>Cancelación/Supresión:</strong> solicitar la eliminación de tus datos.</li>
              <li><strong>Oposición:</strong> oponerte a un tratamiento específico.</li>
              <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado.</li>
            </ul>
            <p className="mt-2">
              Puedes ejercer los derechos de acceso, eliminación y
              portabilidad directamente desde{" "}
              <Link href="/dashboard/privacidad" className="underline">
                tu cuenta, en la sección Privacidad
              </Link>
              . Para cualquier otra solicitud, escríbenos a [correo de
              contacto]. Responderemos dentro del plazo legal aplicable.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">8. Eliminación de cuenta</h2>
            <p>
              Puedes eliminar tu cuenta en cualquier momento desde la
              sección Privacidad de tu panel. Esta acción es permanente e
              irreversible, y elimina tu perfil, CVs, análisis, historial de
              postulaciones, transcripciones de entrevistas y demás datos
              asociados a tu cuenta.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">9. Seguridad</h2>
            <p>
              Aplicamos medidas técnicas y organizativas para proteger tus
              datos, incluyendo cifrado de contraseñas, control de acceso
              basado en roles, verificación en dos pasos, y políticas de
              seguridad a nivel de base de datos (Row Level Security) que
              restringen quién puede ver cada dato.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">10. Cambios a esta política</h2>
            <p>
              Podemos actualizar esta política. Te notificaremos los cambios
              relevantes a través de la plataforma o por correo electrónico.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
