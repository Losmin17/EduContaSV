-- SQL Schema para la recopilación de leyes salvadoreñas (EduConvert)
-- Ejecutar en el Editor SQL de Supabase
--
-- ⚠️ SEGURIDAD: las políticas de escritura "publica" de este archivo son INSEGURAS
-- (cualquier visitante puede modificar/borrar). Tras ejecutar este schema, ejecutar
-- SIEMPRE sql/rls_hardening.sql, que las reemplaza por políticas solo-admin/dueño.

-- Habilitar la extensión pgcrypto para generación de UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabla de Leyes (Metadatos)
CREATE TABLE IF NOT EXISTS public.leyes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    abreviatura TEXT,
    categoria TEXT NOT NULL,
    decreto_numero TEXT,
    fecha_publicacion DATE,
    diario_oficial_info TEXT,
    estado TEXT DEFAULT 'Vigente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla de Artículos
CREATE TABLE IF NOT EXISTS public.articulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ley_id UUID REFERENCES public.leyes(id) ON DELETE CASCADE,
    titulo_seccion TEXT,
    capitulo_seccion TEXT,
    seccion TEXT,
    numero TEXT NOT NULL,
    texto TEXT NOT NULL,
    parrafos JSONB DEFAULT '[]'::jsonb,
    orden INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para mejorar rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_leyes_categoria ON public.leyes(categoria);
CREATE INDEX IF NOT EXISTS idx_articulos_ley_id ON public.articulos(ley_id);
CREATE INDEX IF NOT EXISTS idx_articulos_orden ON public.articulos(orden);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.leyes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articulos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de leyes" ON public.leyes FOR SELECT USING (true);
CREATE POLICY "Permitir lectura publica de articulos" ON public.articulos FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de leyes" ON public.leyes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion publica de leyes" ON public.leyes FOR UPDATE USING (true);
CREATE POLICY "Permitir borrado publico de leyes" ON public.leyes FOR DELETE USING (true);
CREATE POLICY "Permitir insercion publica de articulos" ON public.articulos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion publica de articulos" ON public.articulos FOR UPDATE USING (true);
CREATE POLICY "Permitir borrado publico de articulos" ON public.articulos FOR DELETE USING (true);

-- ========================================================
-- MODULO HOJA UNIVERSAL (WORD + EXCEL + VISIO)
-- ========================================================

CREATE TABLE IF NOT EXISTS public.universal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    structure JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_canvases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    template_id UUID REFERENCES public.universal_templates(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    current_blocks JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.universal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_canvases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura publica de universal_templates" ON public.universal_templates FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de universal_templates" ON public.universal_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion publica de universal_templates" ON public.universal_templates FOR UPDATE USING (true);
CREATE POLICY "Permitir borrado publico de universal_templates" ON public.universal_templates FOR DELETE USING (true);

CREATE POLICY "Permitir lectura publica de user_canvases" ON public.user_canvases FOR SELECT USING (true);
CREATE POLICY "Permitir insercion publica de user_canvases" ON public.user_canvases FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir actualizacion publica de user_canvases" ON public.user_canvases FOR UPDATE USING (true);
CREATE POLICY "Permitir borrado publico de user_canvases" ON public.user_canvases FOR DELETE USING (true);
