import { useEffect, useState } from 'react'
import { USER_NAME, CITY } from '../lib/config'

const GERAL = ['Como está se sentindo hoje?', 'Vamos ao trabalho?', 'Pronto para mais um passo?', 'O que vamos aprender hoje?', 'Um passo de cada vez, combinado?', 'Que bom ver você por aqui.', 'Bora codar?', 'Qual é o plano de hoje?']
const POR_HORA = { manha: ['Café pronto? Vamos começar o dia.', 'Dia novo, página em branco.'], tarde: ['Como está sendo a sua tarde?', 'Ainda dá tempo de avançar bastante hoje.'], noite: ['Hora de focar nos estudos.', 'Vamos fechar o dia com chave de ouro?'] }
const pick = () => { const h = new Date().getHours(), p = POR_HORA[h < 12 ? 'manha' : h < 18 ? 'tarde' : 'noite'], all = [...GERAL, ...p]; return all[Math.floor(Math.random() * all.length)] }

// "Olá, Gabriel" + uma frase de boas-vindas (sorteada a cada vez que a tela abre).
export function Greeting() {
  const [phrase] = useState(pick)
  return <div className="hero-hi"><h2>Olá, {USER_NAME}</h2><p className="hero-phrase">{phrase}</p></div>
}

const Svg = ({ children }) => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
const CLOUD = 'M7 18a4 4 0 01-.5-8 5.5 5.5 0 0110.7 1.4A3.3 3.3 0 0117 18z'
const rays = (cx, cy, r1, r2) => [0, 45, 90, 135, 180, 225, 270, 315].map((a) => { const t = (a * Math.PI) / 180; return <line key={a} x1={cx + r1 * Math.cos(t)} y1={cy + r1 * Math.sin(t)} x2={cx + r2 * Math.cos(t)} y2={cy + r2 * Math.sin(t)} /> })
const ICONS = {
  sun: <Svg><circle cx="12" cy="12" r="4" />{rays(12, 12, 6.5, 9)}</Svg>,
  moon: <Svg><path d="M20 13.5A8 8 0 1110.5 4a6.5 6.5 0 009.5 9.5z" /></Svg>,
  partly: <Svg><circle cx="8" cy="8" r="2.6" />{rays(8, 8, 4.2, 5.6).slice(0, 5)}<path d="M9.5 21a4 4 0 01-.4-8 5 5 0 019.6 1.2A3.4 3.4 0 0118 21z" /></Svg>,
  cloud: <Svg><path d={CLOUD} transform="translate(0 1)" /></Svg>,
  rain: <Svg><path d="M7 15a4 4 0 01-.5-8 5.5 5.5 0 0110.7 1.4A3.3 3.3 0 0117 15z" /><path d="M8 18l-1 2.5M12 18l-1 2.5M16 18l-1 2.5" /></Svg>,
  storm: <Svg><path d="M7 14a4 4 0 01-.5-8 5.5 5.5 0 0110.7 1.4A3.3 3.3 0 0117 14z" /><path d="M12.5 14l-2 3.5h3l-2 3.5" /></Svg>,
}
// códigos WMO do Open-Meteo -> ícone
const iconFor = (code, day) => code === 0 ? (day ? 'sun' : 'moon') : code <= 2 ? (day ? 'partly' : 'cloud') : code === 3 || code === 45 || code === 48 || (code >= 71 && code <= 77) ? 'cloud' : code >= 95 ? 'storm' : 'rain'

function useWeather() {
  const [w, setW] = useState(null), [fail, setFail] = useState(false)
  useEffect(() => {
    let alive = true
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${CITY.lat}&longitude=${CITY.lon}&current=temperature_2m,weather_code,is_day&timezone=${encodeURIComponent(CITY.tz)}`
    const go = () => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error('clima')))).then((j) => { if (alive) { setW(j.current); setFail(false) } }).catch(() => alive && setFail(true))
    go(); const i = setInterval(go, 15 * 60 * 1000)
    return () => { alive = false; clearInterval(i) }
  }, [])
  return { w, fail }
}
function useNow() { const [n, setN] = useState(new Date()); useEffect(() => { const i = setInterval(() => setN(new Date()), 15000); return () => clearInterval(i) }, []); return n }

// Chips pequenos: clima de Curitiba e hora atual.
export function InfoChips() {
  const { w, fail } = useWeather(), now = useNow()
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return (
    <div className="hero-chips">
      <span className="chip-i" title={fail ? 'Não foi possível carregar o clima' : `Clima em ${CITY.name}`}>
        {w ? ICONS[iconFor(w.weather_code, w.is_day === 1)] : ICONS.cloud}
        <b>{w ? `${Math.round(w.temperature_2m)}°C` : '--°C'}</b><small>{CITY.name}</small>
      </span>
      <span className="chip-i" title="Horário atual">
        <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></Svg>
        <b>{time}</b>
      </span>
    </div>
  )
}
