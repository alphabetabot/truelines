import { Link } from 'react-router-dom'
import LogoLink from '../components/LogoLink'
import { PREMIUM_PRICE_DISPLAY } from '../lib/pickAccess'

const TEAM_FONT = "'Oswald', 'Arial Narrow', system-ui, sans-serif"

const CENTERED = {
  marginLeft: 'auto',
  marginRight: 'auto',
  width: '100%',
  maxWidth: 1024,
}

const WHAT_WE_DO_ROWS = [
  { label: 'Our approach', value: 'Real odds data + AI analysis — not hype' },
  { label: 'Every morning', value: 'Daily picks published & graded in public' },
  { label: 'Full transparency', value: 'See exactly how we perform' },
]

export default function WelcomeDesktop({ onPlans, perf, recordLabel, unitsLabel, gradedLabel }) {
  return (
    <div className="w-full min-w-0" style={{ fontFamily: "'Instrument Sans', system-ui, sans-serif" }}>
      <header
        className="relative overflow-hidden text-center w-full"
        style={{
          background: 'linear-gradient(165deg, #0a0f1a 0%, #0f172a 45%, #1a2332 100%)',
          color: '#fff',
          minHeight: 'min(85vh, 820px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '48px 0 64px',
        }}
      >
        <div className="relative z-10 px-8" style={CENTERED}>
          <div className="flex justify-center mb-10">
            <LogoLink height={112} maxWidth={520} />
          </div>

          <h1
            className="font-black leading-tight mb-6"
            style={{
              fontSize: 'clamp(2.25rem, 5vw, 4.5rem)',
              letterSpacing: '-0.01em',
              color: '#fff',
              lineHeight: 1.08,
              maxWidth: 720,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Where Sharp Bettors
            <span className="block" style={{ color: '#fbbf24' }}>Get Their Edge</span>
          </h1>

          <p
            className="font-bold uppercase"
            style={{
              fontFamily: TEAM_FONT,
              fontSize: 'clamp(1.1rem, 2vw, 1.5rem)',
              letterSpacing: '0.06em',
              color: '#fff',
              maxWidth: 640,
              marginBottom: '2.5rem',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Top Pick · Every Morning · Graded In Public
          </p>

          <div
            className="flex flex-row flex-wrap gap-4 justify-center"
            style={{ maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}
          >
            <button
              type="button"
              onClick={() => onPlans('hero_free_newsletter')}
              className="flex-1 px-8 py-4 rounded-xl font-bold"
              style={{ background: '#f59e0b', color: '#0f172a', fontSize: 19 }}
            >
              Free Newsletter + 1 Daily Pick
            </button>
            <button
              type="button"
              onClick={() => onPlans('hero_premium')}
              className="flex-1 px-8 py-4 rounded-xl font-bold"
              style={{ background: '#fff', color: '#0f172a', fontSize: 19 }}
            >
              Premium — {PREMIUM_PRICE_DISPLAY}
            </button>
          </div>
          <button
            type="button"
            onClick={() => onPlans('hero_compare')}
            className="mt-6 text-sm font-semibold underline"
            style={{ color: '#fff', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Compare free vs Premium →
          </button>
        </div>
      </header>

      <section
        id="public-record"
        className="w-full"
        style={{ background: '#f0f4f8', borderTop: '4px solid #0f172a' }}
      >
        <div className="px-8 py-16" style={CENTERED}>
          <div
            className="rounded-2xl overflow-hidden w-full"
            style={{ border: '2px solid #f59e0b', background: '#fff' }}
          >
            <div
              className="px-8 py-4 text-center"
              style={{ background: '#f59e0b', borderBottom: '2px solid #d97706' }}
            >
              <h2
                className="font-black text-2xl uppercase tracking-wide"
                style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}
              >
                Graded In Public
              </h2>
            </div>
            <div className="p-8 lg:p-10">
              <p
                className="mb-8 font-bold text-center"
                style={{
                  fontSize: 21,
                  color: '#0f172a',
                  lineHeight: 1.55,
                  maxWidth: 640,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                We grade every newsletter pick after games finish — wins, losses, and units tracked openly.
              </p>
              <div
                className="grid grid-cols-3 gap-6 rounded-2xl p-8 w-full mb-8"
                style={{
                  background: '#f8fafc',
                  border: '2px solid #0f172a',
                  maxWidth: 720,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {[
                  { label: 'Record', val: recordLabel, color: '#16a34a' },
                  { label: 'Units', val: unitsLabel, color: '#16a34a' },
                  { label: 'Graded', val: gradedLabel, color: '#b45309' },
                ].map(({ label, val, color }) => (
                  <div key={label} className="text-center px-2">
                    <span
                      className="block font-bold uppercase mb-2"
                      style={{ fontSize: 16, color: '#0f172a', letterSpacing: '0.1em' }}
                    >
                      {label}
                    </span>
                    <span className="font-black text-3xl" style={{ fontFamily: TEAM_FONT, color }}>
                      {perf.loading ? '…' : val}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link
                  to="/odds?tracker=1#pick-tracker"
                  className="inline-block font-bold px-6 py-3 rounded-xl"
                  style={{ background: '#0f172a', color: '#fff', fontSize: 17 }}
                >
                  View full tracker →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full" style={{ background: '#f1f5f9' }}>
        <div className="px-8 py-16" style={CENTERED}>
          <div className="rounded-2xl overflow-hidden w-full" style={{ border: '2px solid #f59e0b' }}>
            <div
              className="px-8 py-4 text-center"
              style={{ background: '#f59e0b', borderBottom: '2px solid #d97706' }}
            >
              <h2
                className="font-black text-2xl uppercase tracking-wide"
                style={{ fontFamily: TEAM_FONT, color: '#0f172a' }}
              >
                What We Do
              </h2>
            </div>
            <table className="w-full" style={{ borderCollapse: 'collapse' }}>
              <tbody>
                {WHAT_WE_DO_ROWS.map(({ label, value }, i) => (
                  <tr
                    key={label}
                    style={{
                      background: i % 2 === 0 ? '#fffbeb' : '#fef3c7',
                      borderBottom: i < WHAT_WE_DO_ROWS.length - 1 ? '1px solid #fcd34d' : 'none',
                    }}
                  >
                    <td
                      className="py-5 pl-8 pr-4 font-bold uppercase"
                      style={{
                        fontFamily: TEAM_FONT,
                        fontSize: 19,
                        color: '#0f172a',
                        width: '38%',
                        verticalAlign: 'middle',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {label}
                    </td>
                    <td
                      className="py-5 pr-8 font-bold"
                      style={{ fontSize: 21, color: '#0f172a', verticalAlign: 'middle', lineHeight: 1.45 }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              className="px-8 py-5 text-center"
              style={{ background: '#f59e0b', borderTop: '2px solid #d97706' }}
            >
              <p className="font-black uppercase" style={{ fontFamily: TEAM_FONT, fontSize: 21, color: '#0f172a' }}>
                TrueOddsIQ — data-driven picks, graded in public
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
