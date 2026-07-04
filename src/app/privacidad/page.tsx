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
          Última actualización: [FECHA]
        </p>

        <div className="mt-8 flex flex-col gap-6 text-sm leading-7 text-[#222]">
          <p>
            En [NOMBRE DE LA EMPRESA] nos tomamos en serio tu privacidad.
            Este documento explica, en lenguaje simple, qué información
            recopilamos, para qué la usamos y qué puedes hacer al respecto.
          </p>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              ¿Qué información recopilamos?
            </h2>
            <p>
              Lo básico de tu cuenta (nombre, correo), tu perfil
              profesional, tu CV, tu información de LinkedIn si nos la
              compartes, tu historial de postulaciones, y el contenido de
              las simulaciones de entrevista y sesiones que uses en la
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              ¿Para qué la usamos?
            </h2>
            <p>
              Para darte el servicio: análisis de tu CV y LinkedIn,
              matching de vacantes, simulador de entrevistas, y para que tu
              coach pueda acompañarte con esa información. Usamos
              inteligencia artificial de terceros para generar estos
              análisis. No usamos tus datos para nada fuera de eso, y no
              los vendemos.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              ¿Con quién la compartimos?
            </h2>
            <p>
              Solo con los proveedores que necesitamos para operar la
              plataforma (hosting, base de datos, el modelo de IA que hace
              los análisis). Nadie más ve tu información, salvo tu coach
              asignado y los administradores de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Tus derechos</h2>
            <p>
              Puedes pedirnos acceder, corregir o eliminar tus datos en
              cualquier momento. Desde{" "}
              <Link href="/dashboard/privacidad" className="underline">
                tu cuenta, en la sección Privacidad
              </Link>
              , puedes descargar todos tus datos o eliminar tu cuenta por
              tu cuenta, sin tener que pedírnoslo. Para cualquier otra
              consulta, escríbenos a [correo de contacto].
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">Seguridad</h2>
            <p>
              Protegemos tu información con cifrado, control de acceso por
              rol, y verificación en dos pasos. Solo las personas que
              necesitan ver tu información (tú, tu coach, y los
              administradores) pueden acceder a ella.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-lg font-semibold">
              Cambios a esta política
            </h2>
            <p>
              Si actualizamos este documento de forma relevante, te lo
              vamos a hacer saber dentro de la plataforma.
            </p>
          </section>

          <p className="text-xs text-[#999]">
            ¿Dudas? Escríbenos a [correo de contacto].
          </p>
        </div>
      </div>
    </main>
  );
}
