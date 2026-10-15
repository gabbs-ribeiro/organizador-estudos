import { supabase } from '../lib/supabase'
const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data }
export const tasks = {
  range: (a, b) => supabase.from('study_tasks').select('*').gte('task_date', a).lte('task_date', b).order('task_date').order('created_at').then(ok),
  add: (t) => supabase.from('study_tasks').insert(t).then(ok),
  update: (id, p) => supabase.from('study_tasks').update(p).eq('id', id).then(ok),
  remove: (id) => supabase.from('study_tasks').delete().eq('id', id).then(ok),
  // gera a semana a partir da rotina; o índice único (user, rotina, data) ignora o que já existe
  async generateWeek(start, iso) {
    await supabase.rpc('seed_default_routine').then(ok)
    const routines = await supabase.from('study_routines').select('*').then(ok)
    const rows = routines.map((r) => ({ routine_id: r.id, task_date: iso(new Date(start.getTime() + r.weekday * 864e5)), title: r.title, category: r.category, est_minutes: r.minutes, description: r.description }))
    return supabase.from('study_tasks').upsert(rows, { onConflict: 'user_id,routine_id,task_date', ignoreDuplicates: true }).then(ok)
  },
}
export const routines = {
  list: () => supabase.from('study_routines').select('*').order('weekday').then(ok),
  add: (r) => supabase.from('study_routines').insert(r).then(ok),
  update: (id, p) => supabase.from('study_routines').update(p).eq('id', id).then(ok),
  remove: (id) => supabase.from('study_routines').delete().eq('id', id).then(ok),
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
