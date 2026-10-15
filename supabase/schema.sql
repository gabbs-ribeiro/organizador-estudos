-- Rode no Supabase: SQL Editor > New query > cole tudo > Run. Pode rodar mais de uma vez.
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists study_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=domingo
  title text not null, category text not null default 'java',
  minutes int not null default 60 check (minutes >= 0), description text, start_time time,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table if not exists study_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  routine_id uuid references study_routines(id) on delete set null,
  task_date date not null, title text not null, category text not null default 'java',
  est_minutes int not null default 30 check (est_minutes >= 0),
  actual_minutes int check (actual_minutes is null or actual_minutes >= 0), -- null = não informado
  status text not null default 'pendente' check (status in ('pendente','em_andamento','concluida','adiada','nao_realizada')),
  description text, start_time time,
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

alter table study_routines add column if not exists start_time time;
alter table study_tasks add column if not exists start_time time;

alter table study_tasks add column if not exists note_title text;
alter table study_tasks add column if not exists note_body text;
-- Cronômetro com pausa: tempo em atividade e tempo pausado são guardados separados.
alter table study_tasks add column if not exists work_seconds int not null default 0;
alter table study_tasks add column if not exists paused_seconds int not null default 0;
alter table study_tasks add column if not exists segment_started_at timestamptz;
alter table study_tasks drop constraint if exists study_tasks_status_check;
alter table study_tasks add constraint study_tasks_status_check check (status in ('pendente','em_andamento','pausada','concluida','adiada','nao_realizada'));

-- Metas diárias: aparecem todo dia; cada "Feito" vira um registro (goal_logs) com anotação.
create table if not exists study_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null, active boolean not null default true,
  created_at timestamptz not null default now());
create table if not exists goal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid not null references study_goals(id) on delete cascade,
  log_date date not null default current_date, note_title text, note_body text,
  created_at timestamptz not null default now(),
  unique (goal_id, log_date));
create index if not exists idx_logs_user_date on goal_logs(user_id, log_date);

create index if not exists idx_tasks_user_date on study_tasks(user_id, task_date);
create index if not exists idx_ex_user_status on exercise_notes(user_id, status);
create index if not exists idx_att_exercise on exercise_attempts(exercise_id);

do $$ declare t text; begin
  foreach t in array array['study_routines','study_tasks','exercise_notes','exercise_attempts','study_goals','goal_logs'] loop
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
  insert into study_routines(weekday,title,category,minutes,start_time,description)
  select * from (values
    (1,'Faculdade','faculdade',60,'18:30'::time,'18h30–19h30 · matérias da graduação, atividades, trabalhos e provas'),
    (2,'Faculdade','faculdade',60,'18:30'::time,'18h30–19h30 · matérias da graduação, atividades, trabalhos e provas'),
    (3,'Faculdade','faculdade',60,'18:30'::time,'18h30–19h30 · matérias da graduação, atividades, trabalhos e provas'),
    (4,'Faculdade','faculdade',60,'18:30'::time,'18h30–19h30 · matérias da graduação, atividades, trabalhos e provas'),
    (5,'Faculdade','faculdade',60,'18:30'::time,'18h30–19h30 · matérias da graduação, atividades, trabalhos e provas'),
    (1,'Java','java',135,'19:30'::time,'19h30–21h45 · até 2h15 de Java'),
    (2,'LeetCode','algoritmos',135,'19:30'::time,'19h30–21h45 · até 2h15. Tentar sozinho antes de pedir ajuda'),
    (3,'Revisão e prática de Java','java',135,'19:30'::time,'19h30–21h45 · até 2h15 de revisão e prática'),
    (4,'Projeto prático','java',135,'19:30'::time,'19h30–21h45 · até 2h15 no projeto'),
    (5,'Flexível: inglês, pendências ou descanso','ingles',0,null::time,'Sem horário fixo. Nada obrigatório.'),
    (6,'Sessão de sábado','algoritmos',120,null::time,'2h: LeetCode, Beecrowd (meta: 1 por semana), revisão ou projeto. Faculdade conforme necessidade'),
    (0,'Descanso','descanso',15,null::time,'Descanso; planejamento opcional de 15 min. Faculdade conforme necessidade')
  ) v(a,b,c,d,e,f)
  where not exists (select 1 from study_routines where user_id = auth.uid());
$$;

-- Meta padrão (só se o usuário nunca teve metas; metas removidas ficam inativas e não voltam).
create or replace function seed_default_goals() returns void language sql as $$
  insert into study_goals(title) select 'Exercício LeetCode'
  where not exists (select 1 from study_goals where user_id = auth.uid());
$$;
