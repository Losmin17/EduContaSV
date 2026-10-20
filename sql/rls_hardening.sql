-- =====================================================================
-- EduConta SV · Endurecimiento de seguridad RLS (Row Level Security)
-- Corrige: políticas abiertas USING (true) en INSERT/UPDATE/DELETE que
-- permitían a CUALQUIER visitante (clave anon pública) modificar o borrar
-- leyes, artículos, plantillas y lienzos de todos los usuarios.
--
-- Cómo ejecutar: Supabase → SQL Editor → pegar y ejecutar completo.
-- Es idempotente: puede ejecutarse varias veces sin efectos secundarios.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. DIAGNÓSTICO (opcional): ver las políticas actuales antes del cambio
-- ---------------------------------------------------------------------
-- SELECT tablename, policyname, cmd, qual, with_check
-- FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, cmd;

-- ---------------------------------------------------------------------
-- 1. Función de verificación de administrador (lado servidor)
--    Acepta el claim app_metadata.role = 'admin' (recomendado) o, como
--    transición, el email verificado del JWT emitido por Supabase Auth.
--    El email del JWT lo firma el servidor: el cliente no puede falsificarlo.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopezosmin2021@gmail.com';
$$;

-- Recomendado (una sola vez) para dejar de depender del email:
-- UPDATE auth.users
--    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--  WHERE email = 'lopezosmin2021@gmail.com';

-- ---------------------------------------------------------------------
-- 2. Contenido editorial (biblioteca legal y plantillas):
--    lectura pública, escritura SOLO administrador.
-- ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir insercion publica de leyes"       ON public.leyes;
DROP POLICY IF EXISTS "Permitir actualizacion publica de leyes"   ON public.leyes;
DROP POLICY IF EXISTS "Permitir borrado publico de leyes"         ON public.leyes;
DROP POLICY IF EXISTS "leyes_admin_insert" ON public.leyes;
DROP POLICY IF EXISTS "leyes_admin_update" ON public.leyes;
DROP POLICY IF EXISTS "leyes_admin_delete" ON public.leyes;
CREATE POLICY "leyes_admin_insert" ON public.leyes FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "leyes_admin_update" ON public.leyes FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "leyes_admin_delete" ON public.leyes FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Permitir insercion publica de articulos"     ON public.articulos;
DROP POLICY IF EXISTS "Permitir actualizacion publica de articulos" ON public.articulos;
DROP POLICY IF EXISTS "Permitir borrado publico de articulos"       ON public.articulos;
DROP POLICY IF EXISTS "articulos_admin_insert" ON public.articulos;
DROP POLICY IF EXISTS "articulos_admin_update" ON public.articulos;
DROP POLICY IF EXISTS "articulos_admin_delete" ON public.articulos;
CREATE POLICY "articulos_admin_insert" ON public.articulos FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "articulos_admin_update" ON public.articulos FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "articulos_admin_delete" ON public.articulos FOR DELETE USING (public.is_admin());

DROP POLICY IF EXISTS "Permitir insercion publica de universal_templates"     ON public.universal_templates;
DROP POLICY IF EXISTS "Permitir actualizacion publica de universal_templates" ON public.universal_templates;
DROP POLICY IF EXISTS "Permitir borrado publico de universal_templates"       ON public.universal_templates;
DROP POLICY IF EXISTS "templates_admin_insert" ON public.universal_templates;
DROP POLICY IF EXISTS "templates_admin_update" ON public.universal_templates;
DROP POLICY IF EXISTS "templates_admin_delete" ON public.universal_templates;
CREATE POLICY "templates_admin_insert" ON public.universal_templates FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "templates_admin_update" ON public.universal_templates FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "templates_admin_delete" ON public.universal_templates FOR DELETE USING (public.is_admin());

-- (Las políticas "Permitir lectura publica de ..." se conservan: SELECT abierto es intencional.)

-- ---------------------------------------------------------------------
-- 3. Lienzos de usuario: cada usuario solo ve y modifica los suyos.
--    El admin puede leerlos (auditoría) pero no modificarlos.
-- ---------------------------------------------------------------------
-- canvas.js inserta sin user_id → el servidor lo asigna automáticamente.
ALTER TABLE public.user_canvases ALTER COLUMN user_id SET DEFAULT auth.uid();

DROP POLICY IF EXISTS "Permitir lectura publica de user_canvases"       ON public.user_canvases;
DROP POLICY IF EXISTS "Permitir insercion publica de user_canvases"     ON public.user_canvases;
DROP POLICY IF EXISTS "Permitir actualizacion publica de user_canvases" ON public.user_canvases;
DROP POLICY IF EXISTS "Permitir borrado publico de user_canvases"       ON public.user_canvases;
DROP POLICY IF EXISTS "canvases_select_own" ON public.user_canvases;
DROP POLICY IF EXISTS "canvases_insert_own" ON public.user_canvases;
DROP POLICY IF EXISTS "canvases_update_own" ON public.user_canvases;
DROP POLICY IF EXISTS "canvases_delete_own" ON public.user_canvases;
CREATE POLICY "canvases_select_own" ON public.user_canvases FOR SELECT
  USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "canvases_insert_own" ON public.user_canvases FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "canvases_update_own" ON public.user_canvases FOR UPDATE
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "canvases_delete_own" ON public.user_canvases FOR DELETE
  USING (user_id = auth.uid());

-- NOTA: los lienzos antiguos con user_id NULL quedarán visibles solo para el admin.
-- Para asignarlos a un usuario concreto:
-- UPDATE public.user_canvases SET user_id = '<uuid-del-usuario>' WHERE user_id IS NULL;

-- ---------------------------------------------------------------------
-- 4. proyectos_contables (Unificadas y blindadas para papelera/auditoría)
-- ---------------------------------------------------------------------
ALTER TABLE public.proyectos_contables ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas antiguas/duplicadas
DROP POLICY IF EXISTS "Admin_Select_All" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Admin_Update_All" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Admin_Delete_All" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Admin puede ver todo" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios proyectos" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios proyectos" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios proyectos" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Usuarios pueden insertar sus propios proyectos" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Permitir lectura para creadores y colaboradores" ON public.proyectos_contables;
DROP POLICY IF EXISTS "Permitir edición para creadores y colaboradores" ON public.proyectos_contables;
DROP POLICY IF EXISTS "proyectos_select" ON public.proyectos_contables;
DROP POLICY IF EXISTS "proyectos_insert" ON public.proyectos_contables;
DROP POLICY IF EXISTS "proyectos_update" ON public.proyectos_contables;
DROP POLICY IF EXISTS "proyectos_delete" ON public.proyectos_contables;

-- SELECT: Alumno lee los suyos, compartidos con él, y ADMIN lee TODOS
CREATE POLICY "proyectos_select" ON public.proyectos_contables
FOR SELECT USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopezosmin2021@gmail.com'
  OR ((data -> 'shared_with') ? auth.uid()::text)
);

-- INSERT: Cada usuario inserta asignado a su UID, o ADMIN
CREATE POLICY "proyectos_insert" ON public.proyectos_contables
FOR INSERT WITH CHECK (
  user_id = auth.uid() 
  OR public.is_admin()
  OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopezosmin2021@gmail.com'
);

-- UPDATE: Alumno actualiza suyos (incluyendo papelera), colaboradores o ADMIN
CREATE POLICY "proyectos_update" ON public.proyectos_contables
FOR UPDATE USING (
  user_id = auth.uid() 
  OR public.is_admin()
  OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopezosmin2021@gmail.com'
  OR ((data -> 'shared_with') ? auth.uid()::text)
);

-- DELETE: Borrado físico en disco EXCLUSIVO del Administrador
CREATE POLICY "proyectos_delete" ON public.proyectos_contables
FOR DELETE USING (
  public.is_admin()
  OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopezosmin2021@gmail.com'
);

-- ---------------------------------------------------------------------
-- 5. catalogo_maestro (Protección del catálogo de cuentas)
--    Resuelve la alerta: "RLS Disabled in Public"
-- ---------------------------------------------------------------------
ALTER TABLE public.catalogo_maestro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "catalogo_maestro_select_public" ON public.catalogo_maestro;
DROP POLICY IF EXISTS "catalogo_maestro_admin_all" ON public.catalogo_maestro;

-- Lectura abierta para todos (alumnos, docentes, visitantes y anónimos)
CREATE POLICY "catalogo_maestro_select_public" 
ON public.catalogo_maestro FOR SELECT 
USING (true);

-- Escritura y modificación exclusiva del Administrador
CREATE POLICY "catalogo_maestro_admin_all" 
ON public.catalogo_maestro FOR ALL 
USING (
  public.is_admin() 
  OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopezosmin2021@gmail.com'
) 
WITH CHECK (
  public.is_admin() 
  OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'lopezosmin2021@gmail.com'
);

-- ---------------------------------------------------------------------
-- 6. vw_catalogo_formularios_tributarios (Aislamiento de seguridad)
--    Resuelve la alerta: "Security Definer View"
-- ---------------------------------------------------------------------
ALTER VIEW public.vw_catalogo_formularios_tributarios SET (security_invoker = true);
