-- Rode no Supabase: SQL Editor > New query > cole tudo > Run. Pode rodar mais de uma vez.
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists study_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=domingo
  title text not null, category text not null default 'java',
  minutes int not null default 60 check (minutes >= 0), description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  routine_id uuid references study_routines(id) on delete set null,
  task_date date not null, title text not null, category text not null default 'java',
  est_minutes int not null default 30 check (est_minutes >= 0),
  actual_minutes int check (actual_minutes is null or actual_minutes >= 0), -- null = não informado
  status text not null default 'pendente' check (status in ('pendente','em_andamento','concluida','adiada','nao_realizada')),
  description text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, routine_id, task_date)); -- impede duplicatas ao gerar a semana

create table if not exists exercise_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  platform text not null default 'leetcode' check (platform in ('leetcode','beecrowd','faculdade','projeto','outro')),
  category text not null default 'java' check (category in ('java','logica','algoritmos','estruturas','sql','spring','git','ingles','faculdade')),
  difficulty text not null default 'facil' check (difficulty in ('facil','medio','dificil')),
  statement text, first_attempt text, code text, notes text, errors text, learned text, next_steps text,
  first_attempt_date date not null default current_date, solved_date date,
  status text not null default 'tentando' check (status in ('tentando','com_ajuda','sozinho','revisar')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id uuid not null references exercise_notes(id) on delete cascade,
  attempt_date date not null default current_date,
  content text, errors text, help_type text, result text, clearer text,
  created_at timestamptz not null default now());

create index if not exists idx_tasks_user_date on study_tasks(user_id, task_date);
create index if not exists idx_ex_user_status on exercise_notes(user_id, status);
create index if not exists idx_att_exercise on exercise_attempts(exercise_id);

do $$ declare t text; begin
  foreach t in array array['study_routines','study_tasks','exercise_notes','exercise_attempts'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists own_rows on %I', t);
    execute format('create policy own_rows on %I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
  foreach t in array array['study_routines','study_tasks','exercise_notes'] loop
    execute format('drop trigger if exists trg_upd on %I', t);
    execute format('create trigger trg_upd before update on %I for each row execute function set_updated_at()', t);
  end loop;
end $$;

-- Rotina padrão (só insere se o usuário ainda não tiver rotina). Chamada pelo app.
create or replace function seed_default_routine() returns void language sql as $$
  insert into study_routines(weekday,title,category,minutes,description)
  select * from (values
    (1,'Java','java',60,'Revisar, conceito novo se preciso, exercícios, registrar dúvidas e erros'),
    (2,'LeetCode (Easy)','algoritmos',45,'Tentar sozinho antes de pedir ajuda; registrar raciocínio'),
    (3,'Java: consolidação','java',60,'Revisar, praticar o que não está firme, revisitar erros'),
    (4,'Projeto prático','java',60,'Implementar/melhorar o projeto; registrar problemas'),
    (5,'Dia flexível','faculdade',30,'Faculdade, inglês, pendências ou descanso. Nada obrigatório.'),
    (6,'Sessão de sábado','algoritmos',120,'2º LeetCode, revisão, Beecrowd (meta: 1/semana, flexível) ou projeto')
  ) v(a,b,c,d,e)
  where not exists (select 1 from study_routines where user_id = auth.uid());
$$;
