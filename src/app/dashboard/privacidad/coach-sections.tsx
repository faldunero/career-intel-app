export function NoteVisibilityInfoCard() {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-slate-900">
        Qué ve el usuario de lo que tú escribes — Ley 21.719
        (transparencia)
      </h2>
      <div className="mt-3 flex flex-col gap-3 text-sm text-slate-600">
        <p>
          <span className="font-medium text-slate-900">
            Notas de seguimiento (Notas):
          </span>{" "}
          privadas por defecto. El usuario solo las ve si tú marcas
          explícitamente una nota como &quot;compartida&quot; desde su
          ficha. Si no la compartes, solo tú y los administradores
          pueden verla.
        </p>
        <p>
          <span className="font-medium text-slate-900">
            Comentarios en CV, LinkedIn, Matching, CRM, Tareas,
            Calendario y Psicolaboral:
          </span>{" "}
          estos son siempre visibles para el usuario apenas los
          escribes — no tienen un toggle de privado/compartido. Piensa
          en ellos como feedback directo, no como notas internas.
        </p>
      </div>
    </div>
  );
}

