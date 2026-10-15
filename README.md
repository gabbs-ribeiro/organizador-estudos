# Organizador de Estudos (React + Vite + Supabase)

## Rodar localmente
1. `npm install`
2. No Supabase (supabase.com) crie um projeto. Em **SQL Editor**, cole e rode `supabase/schema.sql`.
3. Em **Project Settings > API** copie *Project URL* e a chave **anon public**.
4. `cp .env.example .env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (nunca use a chave service_role).
5. (Opcional, para testar rápido) Em **Authentication > Providers > Email**, desative "Confirm email".
6. `npm run dev` e abra o endereço exibido. Crie a conta, vá em **Semana** e clique em **Gerar semana pela rotina**.

## Deploy na Vercel
1. Suba o projeto para o GitHub (`.env` já está no `.gitignore`).
2. Na Vercel: *Add New > Project*, importe o repositório (preset Vite).
3. Em *Environment Variables* adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Deploy.
4. No Supabase, em **Authentication > URL Configuration**, coloque a URL da Vercel em *Site URL*.

## Segurança
RLS ligado em todas as tabelas: cada usuário só acessa linhas com `user_id = auth.uid()`.
