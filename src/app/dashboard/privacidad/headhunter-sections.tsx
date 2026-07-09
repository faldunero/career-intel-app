export function HeadhunterAccessInfoCard({
  expiresAt,
}: {
  expiresAt: string | null;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-slate-900">
        Tu acceso — Ley 21.719
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Tu acceso a la base de candidatos fue aprobado manualmente por
        un administrador, tiene una duración definida, y solo alcanza
        a los perfiles que cada candidato marcó explícitamente como
        visibles para headhunters — nunca ves el análisis interno de
        su coach ni sus comentarios. Cada CV que descargas queda
        registrado, con aviso al administrador.
      </p>
      <p className="mt-3 text-sm text-slate-600">
        {expiresAt ? (
          <>
            Tu acceso vence el{" "}
            <span className="font-medium text-slate-900">
              {new Date(expiresAt).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            . Para extenderlo, contacta a un administrador.
          </>
        ) : (
          "No tienes una fecha de vencimiento de acceso configurada — consulta con un administrador si esto no te parece correcto."
        )}
      </p>
    </div>
  );
}

export function HeadhunterOffboardingCard() {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-lg font-medium text-slate-900">
        Otros derechos ARCO+ — Ley 21.719
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Para rectificar tus datos u oponerte a algún tratamiento en
        particular, contacta a un administrador de la plataforma.
      </p>
    </div>
  );
}
