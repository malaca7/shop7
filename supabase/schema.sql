-- ================================================================
-- SHOP7 - SCHEMA DE BANCO DE DADOS & SEGURANÇA SUPABASE + POSTGRESQL
-- Autenticação, Perfis de Usuários, Anúncios e Moderação por Roles
-- ================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Perfis de Usuários (public.profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'moderator', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Tabela de Anúncios (public.ads)
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('item', 'servico')),
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    images TEXT[] DEFAULT '{}',
    stock INTEGER NOT NULL DEFAULT 1 CHECK (stock >= 0),
    additional_info TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    moderated_by UUID REFERENCES auth.users(id),
    moderated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_ads_user_id ON public.ads(user_id);
CREATE INDEX IF NOT EXISTS idx_ads_status ON public.ads(status);
CREATE INDEX IF NOT EXISTS idx_ads_category ON public.ads(category);
CREATE INDEX IF NOT EXISTS idx_ads_created_at ON public.ads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ================================================================
-- FUNÇÕES AUXILIARES DE SEGURANÇA (SECURITY DEFINER)
-- ================================================================

-- Verifica papel do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role FROM public.profiles WHERE id = auth.uid();
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_moderator_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_current_user_role() IN ('moderator', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN public.get_current_user_role() = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- TRIGGERS DE INTEGRIDADE E AUTOMAÇÃO
-- ================================================================

-- 1. Cria perfil automaticamente ao cadastrar novo usuário no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Forçar status 'pending' na criação e re-aprovação em edições
CREATE OR REPLACE FUNCTION public.enforce_ad_moderation_rules()
RETURNS TRIGGER AS $$
BEGIN
    -- Se for INSERT: Sempre força 'pending' se não for admin
    IF (TG_OP = 'INSERT') THEN
        NEW.status := 'pending';
        NEW.rejection_reason := NULL;
        NEW.moderated_by := NULL;
        NEW.moderated_at := NULL;
        NEW.created_at := timezone('utc'::text, now());
        NEW.updated_at := timezone('utc'::text, now());
        RETURN NEW;
    END IF;

    -- Se for UPDATE:
    NEW.updated_at := timezone('utc'::text, now());

    -- Se for moderador/admin alterando status de moderação, permite
    IF public.is_moderator_or_admin() AND (OLD.status != NEW.status OR NEW.rejection_reason IS NOT NULL) THEN
        NEW.moderated_by := auth.uid();
        NEW.moderated_at := timezone('utc'::text, now());
        RETURN NEW;
    END IF;

    -- Se for o próprio criador do anúncio editando o conteúdo:
    -- Automaticamente reverte para 'pending' para exigir nova aprovação!
    IF (NEW.user_id = auth.uid()) THEN
        NEW.status := 'pending';
        NEW.rejection_reason := NULL;
        NEW.moderated_by := NULL;
        NEW.moderated_at := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_ad_moderation ON public.ads;
CREATE TRIGGER trg_enforce_ad_moderation
    BEFORE INSERT OR UPDATE ON public.ads
    FOR EACH ROW EXECUTE FUNCTION public.enforce_ad_moderation_rules();

-- ================================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: PROFILES
-- 1. Qualquer usuário autenticado pode ver perfis públicos
CREATE POLICY "Perfis visíveis para todos"
    ON public.profiles FOR SELECT
    USING (true);

-- 2. Usuário edita apenas seu próprio perfil (sem alterar o role a não ser que seja admin)
CREATE POLICY "Usuário edita seu próprio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND (
            role = (SELECT role FROM public.profiles WHERE id = auth.uid()) 
            OR public.is_admin()
        )
    );

-- 3. Admin pode atualizar qualquer perfil e qualquer role
CREATE POLICY "Admin gerencia todos os perfis"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- POLÍTICAS: ADS (ANÚNCIOS)
-- 1. SELECT:
--    - 'approved' é público para todos;
--    - Criador pode ver qualquer status dos seus próprios anúncios;
--    - Moderadores e Admins vêem tudo (pending, approved, rejected).
CREATE POLICY "Visualização de anúncios"
    ON public.ads FOR SELECT
    USING (
        status = 'approved'
        OR auth.uid() = user_id
        OR public.is_moderator_or_admin()
    );

-- 2. INSERT:
--    - Usuário autenticado só insere anúncios para si mesmo
CREATE POLICY "Usuário autenticado cria anúncio"
    ON public.ads FOR INSERT
    WITH CHECK (
        auth.uid() IS NOT NULL
        AND auth.uid() = user_id
    );

-- 3. UPDATE:
--    - Dono pode atualizar seu anúncio (revertido para pending pelo trigger);
--    - Moderador e Admin podem moderar qualquer anúncio.
CREATE POLICY "Atualização de anúncios"
    ON public.ads FOR UPDATE
    USING (
        auth.uid() = user_id
        OR public.is_moderator_or_admin()
    );

-- 4. DELETE:
--    - Dono pode apagar seu anúncio;
--    - Admin pode apagar qualquer anúncio.
CREATE POLICY "Exclusão de anúncios"
    ON public.ads FOR DELETE
    USING (
        auth.uid() = user_id
        OR public.is_admin()
    );
