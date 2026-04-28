import { useState, useMemo } from "react";

const MODELS = ['BNQ', 'PDI', 'MECH', 'CONT'];
const RATINGS = ['A+', 'A', 'B', 'C', 'F'];
const TIMEFRAMES = ['15S', '30s', '1m', '2M', '3m', '4M', '5M'];
const DOL_OPTIONS = ['ERL', 'HR', 'LR', '1:1', 'PD-X', 'EQ-X', 'Data X', 'HTF Alignment', 'Imbalance', 'Session Liquidity'];
const WL_OPTIONS = ['Win', 'Loss', 'BE→Win', 'BE→Loss', 'Tape'];
const PO3_OPTIONS = ['9:30', '9:30 + 9:45', '10:00', '10:00 + 10:15', '10:00 + 10:30', '10:30', '10:30 + 10:45'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const MONTHS_LIST = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PAIRS = ['NQ', 'ES'];

const SAMPLE_TRADES = [
  { id: 1, name: 'Test', date: '2026-01-04', pair: 'NQ', po3: '9:30', rating: 'A+', model: 'BNQ', entryTF: '1m', dol: 'ERL', wl: 'Win', ls: 'Long', rr: 2, notes: 'Clean BNQ setup at 9:30 open. HTF showed clear bullish displacement. Entry on 1m rejection block. Held to TP.', psych: 'Calm before entry. No hesitation. Felt confident in the setup.', day: 'Monday', month: 'January', sl: 50, tp: 100 },
  { id: 2, name: 'TEST v2', date: '2026-02-10', pair: 'NQ', po3: '10:00', rating: 'F', model: 'PDI', entryTF: '5M', dol: 'LR', wl: 'Loss', ls: 'Short', rr: -1, notes: 'Forced entry. No clear PDI setup. Entered because of FOMO after missing the 9:30 move.', psych: 'Anxious. Felt like I was missing out. Should have stayed patient.', day: 'Tuesday', month: 'February', sl: 50, tp: 100 },
  { id: 3, name: 'TEST v3', date: '2026-11-05', pair: 'NQ', po3: '9:30 + 9:45', rating: 'B', model: 'PDI', entryTF: '30s', dol: 'HR', wl: 'BE→Loss', ls: 'Long', rr: 0, notes: 'Good entry but moved SL to BE too early. Price came back to grab it then went to TP.', psych: 'Nervous after previous loss. Moved SL emotionally.', day: 'Wednesday', month: 'November', sl: 50, tp: 100 },
];

const EMPTY_TRADE = { name: '', date: '', pair: 'NQ', po3: '9:30', rating: 'A+', model: 'BNQ', entryTF: '1m', dol: 'ERL', wl: 'Win', ls: 'Long', rr: '', notes: '', psych: '', day: 'Monday', month: 'January', sl: '', tp: '' };
const EMPTY_EOW = { week: '', what_worked: '', what_didnt: '', next_week: '', psych: '' };

const wlColor = (wl) => wl === 'Win' ? '#00ff88' : wl === 'Loss' ? '#ff4444' : '#ffaa00';
const rrColor = (v) => parseFloat(v) > 0 ? '#00ff88' : parseFloat(v) < 0 ? '#ff4444' : '#888';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [trades, setTrades] = useState(SAMPLE_TRADES);
  const [mistakes, setMistakes] = useState([]);
  const [eowReviews, setEowReviews] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date(2026, 4));
  const [journalFilter, setJournalFilter] = useState('All');
  const [newTrade, setNewTrade] = useState(EMPTY_TRADE);
  const [newMistake, setNewMistake] = useState('');
  const [eowForm, setEowForm] = useState(EMPTY_EOW);

  const calcStats = (items) => {
    if (!items.length) return { trades: 0, winRate: null, totalRR: 0, avgRR: null };
    const wins = items.filter(t => t.wl === 'Win').length;
    const totalRR = items.reduce((s, t) => s + (parseFloat(t.rr) || 0), 0);
    return { trades: items.length, winRate: ((wins / items.length) * 100).toFixed(2), totalRR: totalRR.toFixed(2), avgRR: (totalRR / items.length).toFixed(2) };
  };

  const stats = useMemo(() => ({
    byTF: TIMEFRAMES.map(v => ({ label: v, ...calcStats(trades.filter(t => t.entryTF === v)) })),
    byRating: RATINGS.map(v => ({ label: v, ...calcStats(trades.filter(t => t.rating === v)) })),
    byPO3: PO3_OPTIONS.map(v => ({ label: v, ...calcStats(trades.filter(t => t.po3 === v)) })),
    byModel: MODELS.map(v => ({ label: v, ...calcStats(trades.filter(t => t.model === v)) })),
    byLS: ['Long', 'Short'].map(v => ({ label: v, ...calcStats(trades.filter(t => t.ls === v)) })),
    byWL: WL_OPTIONS.map(v => {
      const items = trades.filter(t => t.wl === v);
      const totalRR = items.reduce((s, t) => s + parseFloat(t.rr || 0), 0);
      return { label: v, trades: items.length, avgRR: items.length ? (totalRR / items.length).toFixed(2) : 0, totalRR: totalRR.toFixed(2) };
    }),
    byDoL: DOL_OPTIONS.map(v => ({ label: v, ...calcStats(trades.filter(t => t.dol === v)) })),
    byDay: DAYS.map(v => ({ label: v, ...calcStats(trades.filter(t => t.day === v)) })),
    byMonth: MONTHS_LIST.map(v => ({ label: v, ...calcStats(trades.filter(t => t.month === v)) })),
    byPair: PAIRS.map(v => ({ label: v, ...calcStats(trades.filter(t => t.pair === v)) })),
  }), [trades]);

  const filteredTrades = useMemo(() => {
    if (journalFilter === 'All' || journalFilter === 'Full Log' || journalFilter === 'Table') return trades;
    if (journalFilter === 'Today') return trades.filter(t => t.date === new Date().toISOString().split('T')[0]);
    if (MONTHS_LIST.includes(journalFilter)) return trades.filter(t => t.month === journalFilter);
    return trades;
  }, [trades, journalFilter]);

  const getDaysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDay = (d) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const addTrade = () => {
    if (!newTrade.name) return;
    setTrades([...trades, { ...newTrade, id: Date.now(), rr: parseFloat(newTrade.rr) || 0, sl: parseFloat(newTrade.sl) || 0, tp: parseFloat(newTrade.tp) || 0 }]);
    setNewTrade(EMPTY_TRADE);
    setShowAdd(false);
  };

  const addMistake = () => {
    if (!newMistake.trim()) return;
    setMistakes([{ id: Date.now(), text: newMistake, date: new Date().toLocaleDateString() }, ...mistakes]);
    setNewMistake('');
  };

  const addEow = () => {
    if (!eowForm.week) return;
    setEowReviews([{ ...eowForm, id: Date.now() }, ...eowReviews]);
    setEowForm(EMPTY_EOW);
  };

  // Styles
  const app = { minHeight: '100vh', background: '#0a0a0a', color: '#d4d4d4', fontFamily: "'IBM Plex Mono', 'Courier New', monospace", display: 'flex', flexDirection: 'column' };
  const nav = { background: '#0f0f0f', borderBottom: '1px solid #1e1e1e', padding: '0 20px', display: 'flex', alignItems: 'center', gap: 2, overflowX: 'auto', flexShrink: 0 };
  const logo = { color: '#00ff88', fontWeight: 700, fontSize: 13, marginRight: 12, letterSpacing: 2, whiteSpace: 'nowrap' };
  const nb = (a) => ({ padding: '14px 14px', background: 'none', border: 'none', color: a ? '#00ff88' : '#555', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', borderBottom: `2px solid ${a ? '#00ff88' : 'transparent'}`, whiteSpace: 'nowrap', transition: 'all 0.15s', letterSpacing: 0.5 });
  const content = { flex: 1, padding: '28px 24px', overflowX: 'auto' };
  const card = { background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 6, padding: '16px', marginBottom: 14 };
  const cardTitle = { color: '#888', fontSize: 11, fontWeight: 600, marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' };
  const table = { width: '100%', borderCollapse: 'collapse', fontSize: 11 };
  const th = { color: '#555', fontWeight: 400, padding: '7px 10px', textAlign: 'left', borderBottom: '1px solid #1a1a1a', whiteSpace: 'nowrap', letterSpacing: 0.5, fontSize: 10 };
  const td = { padding: '7px 10px', borderBottom: '1px solid #141414', color: '#bbb', whiteSpace: 'nowrap', fontSize: 11 };
  const btn = { padding: '8px 18px', background: '#00ff88', color: '#000', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontFamily: 'inherit', fontWeight: 700, letterSpacing: 0.5 };
  const btnSm = { padding: '5px 10px', background: '#161616', color: '#888', border: '1px solid #2a2a2a', borderRadius: 4, cursor: 'pointer', fontSize: 10, fontFamily: 'inherit' };
  const inp = { background: '#141414', border: '1px solid #2a2a2a', color: '#d4d4d4', borderRadius: 4, padding: '7px 10px', fontSize: 11, fontFamily: 'inherit', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const sel = { ...inp, cursor: 'pointer' };
  const lbl = { color: '#555', fontSize: 10, marginBottom: 4, display: 'block', letterSpacing: 0.5, textTransform: 'uppercase' };
  const fGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 14 };
  const filterBar = { display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8, marginBottom: 14, scrollbarWidth: 'none' };
  const fb = (a) => ({ padding: '5px 12px', background: a ? '#0d1f14' : '#111', border: `1px solid ${a ? '#00ff88' : '#222'}`, color: a ? '#00ff88' : '#666', borderRadius: 3, cursor: 'pointer', fontSize: 10, fontFamily: 'inherit', whiteSpace: 'nowrap', letterSpacing: 0.3 });
  const modal = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 };
  const modalBox = { background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 8, padding: 24, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto' };
  const pageTitle = { color: '#e0e0e0', fontSize: 20, fontWeight: 700, marginBottom: 24, letterSpacing: -0.5 };
  const sr = (i) => ({ background: i % 2 === 0 ? 'transparent' : '#0c0c0c' });

  const WLBadge = ({ wl }) => <span style={{ color: wlColor(wl), fontSize: 10 }}>● {wl}</span>;

  const WinBar = ({ rate }) => {
    if (rate === null || rate === undefined) return <span style={{ color: '#333' }}>—</span>;
    const c = parseFloat(rate) >= 50 ? '#00ff88' : '#ff4444';
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: c, minWidth: 52 }}>{rate}%</span>
        <span style={{ width: 30, height: 4, background: '#1a1a1a', borderRadius: 2, display: 'inline-block', overflow: 'hidden' }}>
          <span style={{ display: 'block', width: `${Math.min(parseFloat(rate), 100)}%`, height: '100%', background: c, borderRadius: 2 }} />
        </span>
      </span>
    );
  };

  const StatTbl = ({ title, rows, cols }) => (
    <div style={card}>
      <div style={cardTitle}>{title}</div>
      <table style={table}>
        <thead><tr>{cols.map(c => <th key={c} style={th}>{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={sr(i)}>
              <td style={td}>{r.label}</td>
              <td style={td}>{r.trades || 0}</td>
              <td style={td}><WinBar rate={r.winRate} /></td>
              <td style={td}><span style={{ color: rrColor(r.totalRR) }}>{r.totalRR !== undefined ? r.totalRR : 0}</span></td>
              {r.avgRR !== undefined && <td style={td}><span style={{ color: rrColor(r.avgRR) }}>{r.avgRR}</span></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const AddModal = () => (
    <div style={modal} onClick={e => e.target === e.currentTarget && setShowAdd(false)}>
      <div style={modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: '#00ff88', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>+ NEW TRADE</span>
          <button onClick={() => setShowAdd(false)} style={btnSm}>✕ Close</button>
        </div>
        <div style={fGrid}>
          <div><label style={lbl}>Trade Name</label><input style={inp} value={newTrade.name} onChange={e => setNewTrade({...newTrade, name: e.target.value})} placeholder="e.g. NQ Long 9:30" /></div>
          <div><label style={lbl}>Date</label><input type="date" style={inp} value={newTrade.date} onChange={e => setNewTrade({...newTrade, date: e.target.value})} /></div>
          {[['Pair', 'pair', PAIRS], ['PO3', 'po3', PO3_OPTIONS], ['Rating', 'rating', RATINGS], ['Model', 'model', MODELS], ['Entry TF', 'entryTF', TIMEFRAMES], ['DoL', 'dol', DOL_OPTIONS], ['W/L', 'wl', WL_OPTIONS], ['L/S', 'ls', ['Long', 'Short']], ['Day', 'day', DAYS], ['Month', 'month', MONTHS_LIST]].map(([label, field, opts]) => (
            <div key={field}>
              <label style={lbl}>{label}</label>
              <select style={sel} value={newTrade[field]} onChange={e => setNewTrade({...newTrade, [field]: e.target.value})}>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          {[['R:R', 'rr'], ['SL (pts)', 'sl'], ['TP (pts)', 'tp']].map(([label, field]) => (
            <div key={field}><label style={lbl}>{label}</label><input type="number" style={inp} value={newTrade[field]} onChange={e => setNewTrade({...newTrade, [field]: e.target.value})} /></div>
          ))}
        </div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Notes — Why you entered + Key takeaways</label>
          <textarea style={{ ...inp, minHeight: 65, resize: 'vertical' }} value={newTrade.notes} onChange={e => setNewTrade({...newTrade, notes: e.target.value})} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Psych — Feelings before / during / after</label>
          <textarea style={{ ...inp, minHeight: 65, resize: 'vertical' }} value={newTrade.psych} onChange={e => setNewTrade({...newTrade, psych: e.target.value})} />
        </div>
        <button style={btn} onClick={addTrade}>Save Trade</button>
      </div>
    </div>
  );

  const DetailModal = ({ trade }) => (
    <div style={modal} onClick={e => e.target === e.currentTarget && setSelectedTrade(null)}>
      <div style={modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{trade.name}</span>
          <button onClick={() => setSelectedTrade(null)} style={btnSm}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
          {[['Date', trade.date], ['Pair', trade.pair], ['PO3', trade.po3], ['Rating', trade.rating], ['Model', trade.model], ['Entry TF', trade.entryTF], ['DoL', trade.dol], ['W/L', trade.wl], ['L/S', trade.ls], ['R:R', trade.rr], ['SL', trade.sl], ['TP', trade.tp], ['Day', trade.day], ['Month', trade.month]].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ color: '#444', fontSize: 10, minWidth: 60, letterSpacing: 0.5 }}>{k.toUpperCase()}</span>
              <span style={{ color: '#d0d0d0', fontSize: 12 }}>{k === 'W/L' ? <WLBadge wl={v} /> : k === 'R:R' ? <span style={{ color: rrColor(v) }}>{v > 0 ? '+' : ''}{v}</span> : v}</span>
            </div>
          ))}
        </div>
        {trade.notes && <div style={{ marginBottom: 12 }}><div style={lbl}>Notes</div><div style={{ color: '#999', fontSize: 11, lineHeight: 1.7, background: '#0a0a0a', padding: 12, borderRadius: 4, borderLeft: '2px solid #1e1e1e' }}>{trade.notes}</div></div>}
        {trade.psych && <div><div style={lbl}>Psych</div><div style={{ color: '#999', fontSize: 11, lineHeight: 1.7, background: '#0a0a0a', padding: 12, borderRadius: 4, borderLeft: '2px solid #1e1e1e' }}>{trade.psych}</div></div>}
      </div>
    </div>
  );

  const Dashboard = () => (
    <div>
      <div style={pageTitle}>⚡ Trading Journal</div>
      <div style={{ color: '#333', fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>DAILY ESSENTIALS</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[['📓', 'Journal', 'journal', 'Daily trade log'], ['📋', 'EoW Review', 'eow', 'End of week review']].map(([icon, label, pg, desc]) => (
          <div key={pg} style={{ ...card, cursor: 'pointer', marginBottom: 0 }} onClick={() => setPage(pg)}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <div style={{ color: '#e0e0e0', fontWeight: 600, marginBottom: 4, fontSize: 12 }}>{label}</div>
            <div style={{ color: '#444', fontSize: 10 }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={{ color: '#333', fontSize: 10, letterSpacing: 1, marginBottom: 10 }}>PERFORMANCE</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 24 }}>
        {[['📈', 'Statistics', 'statistics', 'Full breakdown'], ['📅', 'Monthly Performance', 'monthly', 'Calendar + monthly stats'], ['🏆', 'Win/Loss Gallery', 'gallery', 'Trade overview cards'], ['⚠️', 'Mistakes', 'mistakes', 'Error log & lessons']].map(([icon, label, pg, desc]) => (
          <div key={pg} style={{ ...card, cursor: 'pointer', marginBottom: 0 }} onClick={() => setPage(pg)}>
            <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
            <div style={{ color: '#e0e0e0', fontWeight: 600, marginBottom: 4, fontSize: 12 }}>{label}</div>
            <div style={{ color: '#444', fontSize: 10 }}>{desc}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={cardTitle}>Quick Stats</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
          {[
            ['Total Trades', trades.length],
            ['Wins', trades.filter(t => t.wl === 'Win').length],
            ['Losses', trades.filter(t => t.wl === 'Loss').length],
            ['Win Rate', trades.length ? `${((trades.filter(t => t.wl === 'Win').length / trades.length) * 100).toFixed(1)}%` : '—'],
            ['Total R:R', trades.reduce((s, t) => s + parseFloat(t.rr || 0), 0).toFixed(2)],
            ['Avg R:R', trades.length ? (trades.reduce((s, t) => s + parseFloat(t.rr || 0), 0) / trades.length).toFixed(2) : '—'],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ color: '#444', fontSize: 9, letterSpacing: 1, marginBottom: 4 }}>{label.toUpperCase()}</div>
              <div style={{ color: '#00ff88', fontSize: 18, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const Journal = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={pageTitle}>🔒 Journal</div>
        <button style={btn} onClick={() => setShowAdd(true)}>+ New Trade</button>
      </div>
      <div style={filterBar}>
        {['All', 'Today', 'Weekly Gallery', 'Weekly Log', 'Full Gallery', 'Full Log', ...MONTHS_LIST].map(f => (
          <button key={f} style={fb(journalFilter === f)} onClick={() => setJournalFilter(f)}>{f}</button>
        ))}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={table}>
          <thead>
            <tr>{['Trade', 'Rating', 'Day', 'NQ/ES', 'PO3', 'Model', 'L/S', 'Entry TF', 'W/L', 'R:R', 'SL', 'TP'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filteredTrades.map((t, i) => (
              <tr key={t.id} style={{ ...sr(i), cursor: 'pointer' }} onClick={() => setSelectedTrade(t)}>
                <td style={{ ...td, color: '#00ff88' }}>{t.name}</td>
                <td style={td}>{t.rating}</td>
                <td style={td}>{t.day}</td>
                <td style={td}>{t.pair}</td>
                <td style={td}>{t.po3}</td>
                <td style={td}>{t.model}</td>
                <td style={td}>{t.ls}</td>
                <td style={td}>{t.entryTF}</td>
                <td style={td}><WLBadge wl={t.wl} /></td>
                <td style={{ ...td, color: rrColor(t.rr) }}>{t.rr > 0 ? '+' : ''}{t.rr}</td>
                <td style={td}>{t.sl}</td>
                <td style={td}>{t.tp}</td>
              </tr>
            ))}
            {!filteredTrades.length && (
              <tr><td colSpan={12} style={{ ...td, textAlign: 'center', color: '#333', padding: 40 }}>No trades. Click + New Trade to log one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const Statistics = () => (
    <div>
      <div style={pageTitle}>📈 Statistics</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <StatTbl title="Entry Timeframes" rows={stats.byTF} cols={['Timeframe', 'Trades', 'Win Rate', 'Total R:R', 'AVG R:R']} />
          <StatTbl title="Trade Rating Stats" rows={stats.byRating} cols={['Rating', 'Trades', 'Win Rate', 'Total R:R', 'AVG R:R']} />
          <StatTbl title="Entry Model" rows={stats.byModel} cols={['Model', 'Trades', 'Win Rate', 'Total R:R', 'AVG R:R']} />
          <div style={card}>
            <div style={cardTitle}>DoL</div>
            <table style={table}><thead><tr>{['DoL', 'Trades', 'Win Rate', 'Total R:R'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{stats.byDoL.map((r, i) => <tr key={i} style={sr(i)}><td style={td}>{r.label}</td><td style={td}>{r.trades || 0}</td><td style={td}><WinBar rate={r.winRate} /></td><td style={td}><span style={{ color: rrColor(r.totalRR) }}>{r.totalRR || 0}</span></td></tr>)}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={cardTitle}>Months</div>
            <table style={table}><thead><tr>{['Month', 'Trades', 'Win Rate', 'Total R:R'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{stats.byMonth.map((r, i) => <tr key={i} style={sr(i)}><td style={td}>{r.label}</td><td style={td}>{r.trades || 0}</td><td style={td}><WinBar rate={r.winRate} /></td><td style={td}><span style={{ color: rrColor(r.totalRR) }}>{r.totalRR || 0}</span></td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <div style={card}>
            <div style={cardTitle}>Results</div>
            <table style={table}><thead><tr>{['Result', 'Avg R:R', 'Total R:R', 'Trades'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{stats.byWL.map((r, i) => <tr key={i} style={sr(i)}><td style={td}><WLBadge wl={r.label} /></td><td style={td}><span style={{ color: rrColor(r.avgRR) }}>{r.avgRR}</span></td><td style={td}><span style={{ color: rrColor(r.totalRR) }}>{r.totalRR}</span></td><td style={td}>{r.trades}</td></tr>)}</tbody>
            </table>
          </div>
          <StatTbl title="PO3" rows={stats.byPO3} cols={['PO3', 'Trades', 'Win Rate', 'Total R:R', 'AVG R:R']} />
          <StatTbl title="Setup Type" rows={stats.byLS} cols={['Type', 'Trades', 'Win Rate', 'Total R:R', 'AVG R:R']} />
          <div style={card}>
            <div style={cardTitle}>Daily Stats — Weekdays</div>
            <table style={table}><thead><tr>{['Day', 'Trades', 'Win Rate', 'Avg R:R', 'Total R:R'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{stats.byDay.map((r, i) => <tr key={i} style={sr(i)}><td style={td}>{r.label}</td><td style={td}>{r.trades || 0}</td><td style={td}><WinBar rate={r.winRate} /></td><td style={td}><span style={{ color: rrColor(r.avgRR) }}>{r.avgRR || 0}</span></td><td style={td}><span style={{ color: rrColor(r.totalRR) }}>{r.totalRR || 0}</span></td></tr>)}</tbody>
            </table>
          </div>
          <div style={card}>
            <div style={cardTitle}>Pairs</div>
            <table style={table}><thead><tr>{['Ticker', 'Trades', 'Win Rate', 'Avg R:R', 'Total R:R'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>{stats.byPair.map((r, i) => <tr key={i} style={sr(i)}><td style={td}>{r.label}</td><td style={td}>{r.trades || 0}</td><td style={td}><WinBar rate={r.winRate} /></td><td style={td}><span style={{ color: rrColor(r.avgRR) }}>{r.avgRR || 0}</span></td><td style={td}><span style={{ color: rrColor(r.totalRR) }}>{r.totalRR || 0}</span></td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const Monthly = () => {
    const monthName = MONTHS_LIST[calMonth.getMonth()];
    const year = calMonth.getFullYear();
    const calTrades = trades.filter(t => t.month === monthName && t.date && t.date.startsWith(year.toString()));
    const daysInMonth = getDaysInMonth(calMonth);
    const firstDay = getFirstDay(calMonth);
    const today = new Date().toISOString().split('T')[0];

    return (
      <div>
        <div style={pageTitle}>📅 Monthly Performance</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 13 }}>{monthName} {year}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={btnSm} onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}>‹ Prev</button>
                <button style={btnSm} onClick={() => setCalMonth(new Date())}>Today</button>
                <button style={btnSm} onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}>Next ›</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} style={{ color: '#444', fontSize: 9, textAlign: 'center', padding: '4px 0', letterSpacing: 0.5 }}>{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(calMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTrades = calTrades.filter(t => t.date === dateStr);
                const isToday = dateStr === today;
                const allWin = dayTrades.length && dayTrades.every(t => t.wl === 'Win');
                const anyLoss = dayTrades.some(t => t.wl === 'Loss');
                const dotColor = allWin ? '#00ff88' : anyLoss ? '#ff4444' : dayTrades.length ? '#ffaa00' : null;
                return (
                  <div key={day} style={{ background: isToday ? '#0d1f14' : '#0c0c0c', border: `1px solid ${isToday ? '#00ff88' : '#1a1a1a'}`, borderRadius: 3, minHeight: 44, padding: 5 }}>
                    <div style={{ fontSize: 9, color: isToday ? '#00ff88' : '#555' }}>{day}</div>
                    {dotColor && <div style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, marginTop: 4 }} />}
                    {dayTrades.length > 0 && <div style={{ color: '#444', fontSize: 8, marginTop: 2 }}>{dayTrades.length}t</div>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={card}>
            <div style={cardTitle}>Months</div>
            <table style={table}>
              <thead><tr>{['Month', 'Win Rate', 'R:R', 'Trades'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
              <tbody>
                {stats.byMonth.map((r, i) => (
                  <tr key={i} style={sr(i)}>
                    <td style={td}>{r.label.slice(0, 3)}</td>
                    <td style={td}><WinBar rate={r.winRate} /></td>
                    <td style={td}><span style={{ color: rrColor(r.totalRR) }}>{r.totalRR || 0}</span></td>
                    <td style={td}>{r.trades || 0}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: '1px solid #2a2a2a' }}>
                  <td style={{ ...td, color: '#444', fontSize: 9 }}>AVG</td>
                  <td style={{ ...td, color: '#666', fontSize: 9 }} colSpan={3}>
                    {(stats.byMonth.filter(m => m.trades > 0).reduce((s, m) => s + parseFloat(m.winRate || 0), 0) / (stats.byMonth.filter(m => m.trades > 0).length || 1)).toFixed(2)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const Mistakes = () => (
    <div>
      <div style={pageTitle}>⚠️ Mistakes</div>
      <div style={card}>
        <div style={cardTitle}>Log a Mistake</div>
        <textarea style={{ ...inp, minHeight: 80, marginBottom: 10, resize: 'vertical' }} placeholder="Describe the mistake, what triggered it, and how to fix it next time..." value={newMistake} onChange={e => setNewMistake(e.target.value)} />
        <button style={btn} onClick={addMistake}>+ Log Mistake</button>
      </div>
      {!mistakes.length && <div style={{ color: '#333', textAlign: 'center', padding: 48, fontSize: 11 }}>No mistakes logged yet.<br />Every error is a lesson — log them all.</div>}
      {mistakes.map(m => (
        <div key={m.id} style={{ ...card, borderLeft: '2px solid #ff4444' }}>
          <div style={{ color: '#444', fontSize: 9, marginBottom: 8, letterSpacing: 0.5 }}>{m.date}</div>
          <div style={{ color: '#aaa', fontSize: 11, lineHeight: 1.7 }}>{m.text}</div>
        </div>
      ))}
    </div>
  );

  const EoW = () => (
    <div>
      <div style={pageTitle}>📋 EoW Review</div>
      <div style={card}>
        <div style={cardTitle}>New Weekly Review</div>
        <div style={{ marginBottom: 10 }}><label style={lbl}>Week of</label><input type="date" style={{ ...inp, maxWidth: 200 }} value={eowForm.week} onChange={e => setEowForm({...eowForm, week: e.target.value})} /></div>
        {[['What worked this week?', 'what_worked'], ["What didn't work?", 'what_didnt'], ['Focus for next week', 'next_week'], ['Psychology notes', 'psych']].map(([label, field]) => (
          <div key={field} style={{ marginBottom: 10 }}>
            <label style={lbl}>{label}</label>
            <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={eowForm[field]} onChange={e => setEowForm({...eowForm, [field]: e.target.value})} />
          </div>
        ))}
        <button style={btn} onClick={addEow}>Save Review</button>
      </div>
      {eowReviews.map(r => (
        <div key={r.id} style={{ ...card, borderLeft: '2px solid #00ff88' }}>
          <div style={{ color: '#00ff88', fontSize: 11, fontWeight: 600, marginBottom: 14 }}>Week of {r.week}</div>
          {[['✅ What worked', r.what_worked], ['❌ What didn\'t work', r.what_didnt], ['🎯 Next week focus', r.next_week], ['🧠 Psychology', r.psych]].filter(([, v]) => v).map(([label, val]) => (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={lbl}>{label}</div>
              <div style={{ color: '#999', fontSize: 11, lineHeight: 1.7 }}>{val}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const Gallery = () => (
    <div>
      <div style={pageTitle}>🏆 Win / Loss / BE Gallery</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        {trades.map(t => (
          <div key={t.id} style={{ ...card, cursor: 'pointer', marginBottom: 0, borderLeft: `2px solid ${wlColor(t.wl)}` }} onClick={() => setSelectedTrade(t)}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: '#e0e0e0', fontWeight: 600, fontSize: 12 }}>{t.name}</span>
              <WLBadge wl={t.wl} />
            </div>
            <div style={{ color: '#444', fontSize: 10, marginBottom: 8 }}>{t.date} · {t.pair} · {t.model} · {t.entryTF}</div>
            <div style={{ color: rrColor(t.rr), fontSize: 14, fontWeight: 700 }}>{t.rr > 0 ? '+' : ''}{t.rr}R</div>
            {t.notes && <div style={{ color: '#555', fontSize: 10, marginTop: 8, lineHeight: 1.5 }}>{t.notes.slice(0, 80)}{t.notes.length > 80 ? '...' : ''}</div>}
          </div>
        ))}
        {!trades.length && <div style={{ color: '#333', fontSize: 11 }}>No trades yet.</div>}
      </div>
    </div>
  );

  const pageMap = { dashboard: <Dashboard />, journal: <Journal />, statistics: <Statistics />, monthly: <Monthly />, mistakes: <Mistakes />, eow: <EoW />, gallery: <Gallery /> };

  return (
    <div style={app}>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <nav style={nav}>
        <span style={logo}>⚡ JOURNAL</span>
        {[['Dashboard', 'dashboard'], ['Journal', 'journal'], ['Statistics', 'statistics'], ['Monthly', 'monthly'], ['Gallery', 'gallery'], ['Mistakes', 'mistakes'], ['EoW Review', 'eow']].map(([label, pg]) => (
          <button key={pg} style={nb(page === pg)} onClick={() => setPage(pg)}>{label}</button>
        ))}
      </nav>
      <div style={content}>{pageMap[page]}</div>
      {showAdd && <AddModal />}
      {selectedTrade && <DetailModal trade={selectedTrade} />}
    </div>
  );
}
