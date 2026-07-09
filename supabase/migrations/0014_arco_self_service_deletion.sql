-- =========================================================
-- Ley 21.719 — solicitud de eliminación propia (coach/admin/headhunter)
-- Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- =========================================================
--
-- coach/admin/headhunter no tienen autoservicio de eliminación
-- instantánea (a diferencia de usuario) porque sus cuentas están
-- vinculadas a otras personas o a flujos administrativos. En su
-- lugar, pueden solicitar la eliminación, que cae directo en el panel
-- ARCO+ que ya gestiona el admin, con el mismo plazo de 30 días.
--
-- La política existente ("administradores gestionan solicitudes
-- ARCO+") ya cubre todo lo que necesita un admin. Esta política nueva
-- SOLO permite crear una solicitud de tipo 'cancelacion' sobre uno
-- mismo — no puede leer, editar ni crear otro tipo de solicitud, ni
-- una sobre otra persona.

create policy "cualquier usuario solicita la eliminación de su propia cuenta"
  on public.arco_requests for insert
  with check (
    request_type = 'cancelacion'
    and target_user_id = auth.uid()
    and created_by = auth.uid()
  );
