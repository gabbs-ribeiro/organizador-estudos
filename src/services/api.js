import { supabase } from '../lib/supabase'
const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data }
export const tasks = {
  range: (a, b) => supabase.from('study_tasks').select('*').gte('task_date', a).lte('task_date', b).order('task_date').order('start_time', { nullsFirst: false }).order('created_at').then(ok),
  add: (t) => supabase.from('study_tasks').insert(t).then(ok),
  update: (id, p) => supabase.from('study_tasks').update(p).eq('id', id).then(ok),
  remove: (id) => supabase.from('study_tasks').delete().eq('id', id).then(ok),
  // gera tarefas a partir da rotina; o índice único (user, rotina, data) ignora o que já existe
  async generateDays(start, iso, onlyDate) {
    await supabase.rpc('seed_default_routine').then(ok)
    const rs = await supabase.from('study_routines').select('*').then(ok)
    const rows = rs.map((r) => ({ routine_id: r.id, task_date: iso(new Date(start.getTime() + r.weekday * 864e5)), title: r.title, category: r.category, est_minutes: r.minutes, start_time: r.start_time, description: r.description }))
      .filter((r) => !onlyDate || r.task_date === onlyDate)
    if (!rows.length) return []
    return supabase.from('study_tasks').upsert(rows, { onConflict: 'user_id,routine_id,task_date', ignoreDuplicates: true }).then(ok)
  },
  generateWeek(start, iso) { return this.generateDays(start, iso) },
}
export const routines = {
  list: () => supabase.from('study_routines').select('*').order('weekday').order('start_time', { nullsFirst: false }).then(ok),
  add: (r) => supabase.from('study_routines').insert(r).then(ok),
  update: (id, p) => supabase.from('study_routines').update(p).eq('id', id).then(ok),
  remove: (id) => supabase.from('study_routines').delete().eq('id', id).then(ok),
  // propaga a edição para tarefas já geradas que ainda estão pendentes (de hoje em diante)
  applyToTasks: (id, p, from) => supabase.from('study_tasks').update(p).eq('routine_id', id).eq('status', 'pendente').gte('task_date', from).then(ok),
}
export const exercises = {
  list: () => supabase.from('exercise_notes').select('*').order('created_at', { ascending: false }).then(ok),
  save: (e) => (e.id ? supabase.from('exercise_notes').update(e).eq('id', e.id) : supabase.from('exercise_notes').insert(e)).then(ok),
  remove: (id) => supabase.from('exercise_notes').delete().eq('id', id).then(ok),
}
export const attempts = {
  list: (exId) => supabase.from('exercise_attempts').select('*').eq('exercise_id', exId).order('attempt_date', { ascending: false }).then(ok),
  add: (a) => supabase.from('exercise_attempts').insert(a).then(ok),
  remove: (id) => supabase.from('exercise_attempts').delete().eq('id', id).then(ok),
}
export const goals = {
  async list() { await supabase.rpc('seed_default_goals').then(ok); return supabase.from('study_goals').select('*').eq('active', true).order('created_at').then(ok) },
  add: (title) => supabase.from('study_goals').insert({ title }).then(ok),
  remove: (id) => supabase.from('study_goals').update({ active: false }).eq('id', id).then(ok),
  logs: (a, b) => supabase.from('goal_logs').select('*, study_goals(title)').gte('log_date', a).lte('log_date', b).order('created_at').then(ok),
  done: (l) => supabase.from('goal_logs').insert(l).select().single().then(ok),
  undo: (id) => supabase.from('goal_logs').delete().eq('id', id).then(ok),
}
export const notebook = {
  subjects: () => supabase.from('subjects').select('*').order('name').then(ok),
  addSubject: (name) => supabase.from('subjects').insert({ name }).select().single().then(ok),
  removeSubject: (id) => supabase.from('subjects').delete().eq('id', id).then(ok),
  notes: () => supabase.from('notebook_notes').select('*').order('created_at', { ascending: false }).then(ok),
  saveNote: (n) => (n.id ? supabase.from('notebook_notes').update({ title: n.title, body: n.body, body_html: n.body_html }).eq('id', n.id).select().single() : supabase.from('notebook_notes').insert(n).select().single()).then(ok),
  removeNote: (id) => supabase.from('notebook_notes').delete().eq('id', id).then(ok),
  bySource: (type, id) => supabase.from('notebook_notes').select('*').eq('source_type', type).eq('source_id', id).maybeSingle().then(ok),
  linked: (n) => supabase.from('notebook_notes').upsert(n, { onConflict: 'user_id,source_type,source_id' }).then(ok),
  moveBySource: (type, id, subject_id) => supabase.from('notebook_notes').update({ subject_id }).eq('source_type', type).eq('source_id', id).then(ok),
  unlink: (type, id) => supabase.from('notebook_notes').delete().eq('source_type', type).eq('source_id', id).then(ok),
}
