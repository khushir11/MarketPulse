import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import './styles.css';

const api = async (p, o = {}) => {
  const token = localStorage.getItem('mp_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...o.headers,
  };

  let r;
  try {
    r = await fetch('/api' + p, { ...o, headers });
  } catch (err) {
    throw new Error('Unable to connect to the backend server. Please verify port 3001 is running.');
  }

  const b = r.status === 204 ? null : await r.json().catch(() => null);
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem('mp_token');
      localStorage.removeItem('mp_user');
      window.dispatchEvent(
        new CustomEvent('mp_unauthorized', {
          detail: b?.error || 'Your session has expired. Please sign in again.',
        })
      );
    }
    throw new Error(b?.error || `Request failed (${r.status})`);
  }
  return b;
};

const nav = [
  ['Dashboard', '⌂'],
  ['Watchlist', '★'],
  ['Explore', '⌕'],
  ['News', '▣'],
  ['Alerts', '♧'],
  ['Portfolio', '▥'],
  ['Insights', '✦'],
  ['Demo Mode', '◉'],
  ['Settings', '⚙'],
];

const cls = {
  'HIGH ATTENTION': 'high',
  'WORTH CHECKING': 'watch',
  STABLE: 'stable',
};

const Badge = ({ s }) => (
  <span className={'badge ' + (cls[s] || 'stable')}>
    <i /> {s === 'HIGH ATTENTION' ? 'High attention' : s === 'WORTH CHECKING' ? 'Worth checking' : 'Stable'}
  </span>
);

function Auth({ done, initialMessage }) {
  const [signup, setSignup] = useState(false);
  const [f, setF] = useState({ name: 'Khushi', email: '', password: '' });
  const [e, setE] = useState(initialMessage || '');

  const submit = async (x) => {
    x.preventDefault();
    setE('');
    try {
      const d = await api('/auth/' + (signup ? 'register' : 'login'), {
        method: 'POST',
        body: JSON.stringify(f),
      });
      localStorage.setItem('mp_token', d.token);
      localStorage.setItem('mp_user', JSON.stringify(d.user));
      done(d.user);
    } catch (err) {
      setE(err.message);
    }
  };

  return (
    <div className="login">
      <section>
        <div className="brand">market<span>pulse</span></div>
        <p className="kicker">INVESTOR CLARITY, NOT NOISE</p>
        <h1>Know what changed.<br /><em>Know why it matters.</em></h1>
        <p>MarketPulse turns your watchlist into a personal briefing with context.</p>
      </section>
      <form onSubmit={submit}>
        <p className="kicker">WELCOME TO MARKETPULSE</p>
        <h2>{signup ? 'Create your account' : 'Welcome back'}</h2>
        {e && <p className="error" style={{ background: '#fde8ea', padding: '10px 14px', borderRadius: 6 }}>{e}</p>}
        {signup && (
          <input
            placeholder="Name"
            value={f.name}
            onChange={(x) => setF({ ...f, name: x.target.value })}
            required
          />
        )}
        <input
          type="email"
          required
          placeholder="Email"
          value={f.email}
          onChange={(x) => setF({ ...f, email: x.target.value })}
        />
        <input
          type="password"
          required
          minLength="6"
          placeholder="Password"
          value={f.password}
          onChange={(x) => setF({ ...f, password: x.target.value })}
        />
        <button className="primary">{signup ? 'Create account' : 'Sign in to MarketPulse'}</button>
        <p>
          {signup ? 'Already registered?' : 'New here?'}{' '}
          <button
            type="button"
            onClick={() => {
              setSignup(!signup);
              setE('');
            }}
          >
            {signup ? 'Sign in' : 'Create account'}
          </button>
        </p>
      </form>
    </div>
  );
}

function Shell({ page, setPage, user, logout, children }) {
  const displayName = user?.name || 'Investor';
  const initial = displayName[0]?.toUpperCase() || 'I';

  return (
    <div className="app">
      <aside>
        <div className="brand">market<span>pulse</span></div>
        <nav>
          {nav.map(([n, i]) => (
            <button
              className={page === n ? 'active' : ''}
              onClick={() => setPage(n)}
              key={n}
            >
              <b>{i}</b>{n}
            </button>
          ))}
        </nav>
        <div className="sideuser">
          <i>{initial}</i>
          <span><b>{displayName}</b><small>Free plan</small></span>
          <button onClick={logout} title="Sign out">↪</button>
        </div>
      </aside>
      <header>
        <div className="brand">market<span>pulse</span></div>
        <button onClick={logout}>Sign out</button>
      </header>
      <main>{children}</main>
      <footer>
        {nav.slice(0, 6).map(([n, i]) => (
          <button
            onClick={() => setPage(n)}
            className={page === n ? 'active' : ''}
            key={n}
          >
            {i}<small>{n}</small>
          </button>
        ))}
      </footer>
    </div>
  );
}

const Title = ({ title, sub, children }) => (
  <div className="title">
    <div>
      <p className="kicker">MARKETPULSE</p>
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
    {children}
  </div>
);

const Empty = () => (
  <div className="empty">
    <b>Your watchlist is empty.</b>
    <p>Add stocks and MarketPulse will tell you what changes.</p>
  </div>
);

function Dashboard({ d, open, user }) {
  const items = d?.items || [];
  const counts = d?.counts || { 'HIGH ATTENTION': 0, 'WORTH CHECKING': 0, STABLE: 0 };
  const top = [...items].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 5);
  const events = top.flatMap((x) => (x.news || []).map((n) => ({ ...n, symbol: x.symbol }))).slice(0, 2);

  return (
    <>
      <Title
        title={`Good morning, ${user?.name || 'Investor'} 👋`}
        sub="Here’s what changed since your last visit."
      />
      <div className="market">
        <i /> <b>US Market Open</b>
        <span>S&P 500 <strong className="up">+0.42%</strong></span>
        <span>NASDAQ <strong className="up">+0.68%</strong></span>
        <small>Updated just now</small>
      </div>
      <section className="stats">
        {[
          [counts['HIGH ATTENTION'] || 0, 'Need attention', 'red', '↗'],
          [counts['WORTH CHECKING'] || 0, 'Worth checking', 'orange', '◌'],
          [counts.STABLE || 0, 'Stable', 'green', '✓'],
        ].map((x) => (
          <article className={x[2]} key={x[1]}>
            <div>
              <small>{x[1].toUpperCase()}</small>
              <b>{x[0]}</b>
              <span>stocks in your watchlist</span>
            </div>
            <i>{x[3]}</i>
          </article>
        ))}
      </section>
      <div className="section">
        <div>
          <p className="kicker">YOUR WATCHLIST, DISTILLED</p>
          <h2>Since you last checked</h2>
        </div>
        <small>Showing the most important changes</small>
      </div>
      <section className="signals">
        {top.length ? (
          top.map((x) => (
            <button key={x.symbol} onClick={() => open(x.symbol)}>
              <i>{x.symbol?.[0] || '?'}</i>
              <span><b>{x.symbol}</b><small>{x.companyName}</small></span>
              <span>
                <small>SINCE LAST CHECK</small>
                <b className={(x.priceChange || 0) >= 0 ? 'up' : 'down'}>
                  {(x.priceChange || 0) >= 0 ? '+' : ''}{x.priceChange}%
                </b>
              </span>
              <span><small>VOLUME</small><b>{x.volumeRatio || 1}× normal</b></span>
              <Badge s={x.status} />
              <em>→</em>
            </button>
          ))
        ) : (
          <Empty />
        )}
      </section>
      <div className="two">
        <Overview />
        <section className="events">
          <div className="section">
            <h2>Recent important events</h2>
            <button>View news →</button>
          </div>
          {events.length ? (
            events.map((e) => (
              <button onClick={() => open(e.symbol)} key={e.title}>
                <i>✦</i>
                <span><b>{e.title}</b><small>{e.symbol} · {e.source}</small></span>
                <em>High impact</em>
              </button>
            ))
          ) : (
            <p style={{ color: 'var(--u)', padding: '12px 0' }}>No high-impact events detected.</p>
          )}
        </section>
      </div>
    </>
  );
}

function Overview() {
  const d = [4, 7, 6, 10, 9, 13, 15].map((p, i) => ({ i, p }));
  return (
    <section className="overview">
      <p className="kicker">MARKET OVERVIEW</p>
      <b>S&P 500 <span>5,282.14 <strong className="up">+0.42%</strong></span></b>
      <ResponsiveContainer width="100%" height={110}>
        <AreaChart data={d}>
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="#40dfbb" stopOpacity=".5" />
              <stop offset="1" stopColor="#40dfbb" stopOpacity="0" />
            </linearGradient>
          </defs>
          <Area dataKey="p" stroke="#35caaa" fill="url(#g)" />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}

function Watchlist({ d, open, reload, toast }) {
  const [q, setQ] = useState('');
  const [f, setF] = useState('All');
  const [r, setR] = useState([]);
  const items = (d?.items || []).filter(
    (x) =>
      (f === 'All' || x.status === f) &&
      `${x.symbol} ${x.companyName}`.toLowerCase().includes(q.toLowerCase())
  );

  const find = async (v) => {
    setQ(v);
    setR(v ? await api('/watchlist/search?q=' + v) : []);
  };

  return (
    <>
      <Title title="My Watchlist" sub="Keep the companies you care about in focus." />
      <div className="controls">
        <input
          value={q}
          onChange={(e) => find(e.target.value)}
          placeholder="Search or add a stock"
        />
        <select value={f} onChange={(e) => setF(e.target.value)}>
          <option>All</option>
          <option>HIGH ATTENTION</option>
          <option>WORTH CHECKING</option>
          <option>STABLE</option>
        </select>
        <div className="suggest">
          {r.map((x) => (
            <button
              key={x.symbol}
              onClick={async () => {
                try {
                  await api('/watchlist', {
                    method: 'POST',
                    body: JSON.stringify({ symbol: x.symbol }),
                  });
                  toast('Stock added');
                  reload();
                } catch (e) {
                  toast(e.message);
                }
              }}
            >
              <b>{x.symbol}</b>{x.companyName}<em>＋</em>
            </button>
          ))}
        </div>
      </div>
      <section className="table">
        <div className="row head">
          <span>Stock</span>
          <span>Current price</span>
          <span>Today</span>
          <span>Since last check</span>
          <span>Volume</span>
          <span>Attention</span>
          <span />
        </div>
        {items.map((x) => (
          <div className="row" key={x.symbol}>
            <button className="co" onClick={() => open(x.symbol)}>
              <i>{x.symbol?.[0] || '?'}</i>
              <span><b>{x.symbol}</b><small>{x.companyName}</small></span>
            </button>
            <span>${x.price}</span>
            <span className={(x.dayChange || 0) >= 0 ? 'up' : 'down'}>
              {(x.dayChange || 0) >= 0 ? '+' : ''}{x.dayChange}%
            </span>
            <span className={(x.priceChange || 0) >= 0 ? 'up' : 'down'}>
              {(x.priceChange || 0) >= 0 ? '+' : ''}{x.priceChange}%
            </span>
            <span>{x.volumeRatio}×</span>
            <Badge s={x.status} />
            <button
              onClick={async () => {
                if (confirm('Remove ' + x.symbol + '?')) {
                  await api('/watchlist/' + x.symbol, { method: 'DELETE' });
                  reload();
                  toast('Stock removed');
                }
              }}
            >
              ⋮
            </button>
          </div>
        ))}
      </section>
    </>
  );
}

function Detail({ x, back }) {
  if (!x) return null;
  return (
    <>
      <button className="back" onClick={back}>← Back to briefing</button>
      <div className="detailhead">
        <div>
          <p className="kicker">{x.companyName}</p>
          <h1>{x.symbol} <Badge s={x.status} /></h1>
          <b className="price">
            ${x.price}{' '}
            <span className={(x.dayChange || 0) >= 0 ? 'up' : 'down'}>
              {(x.dayChange || 0) >= 0 ? '+' : ''}{x.dayChange}% today
            </span>
          </b>
        </div>
        <div className="ranges">
          <button>1D</button>
          <button className="on">1W</button>
          <button>1M</button>
          <button>3M</button>
          <button>1Y</button>
        </div>
      </div>
      <section className="bigchart">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={x.history || []}>
            <defs>
              <linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="#40dfbb" stopOpacity=".45" />
                <stop offset="1" stopColor="#40dfbb" stopOpacity="0" />
              </linearGradient>
            </defs>
            <Area dataKey="price" stroke="#34ccaa" fill="url(#d)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      <section className="detailcards">
        <article>
          <p className="kicker">SINCE YOU LAST CHECKED</p>
          <div>
            <span>
              <small>PRICE</small>
              <b>${x.previousPrice} → ${x.price}</b>
              <strong className={(x.priceChange || 0) >= 0 ? 'up' : 'down'}>
                {(x.priceChange || 0) >= 0 ? '+' : ''}{x.priceChange}%
              </strong>
            </span>
            <span>
              <small>VOLUME</small>
              <b>{x.volumeRatio}× normal</b>
            </span>
            <span>
              <small>NEWS</small>
              <b>{(x.news || []).length} important events</b>
            </span>
          </div>
          <Badge s={x.status} />
        </article>
        <article className="care">
          <p className="kicker">WHY YOU SHOULD CARE</p>
          <h3>{x.why}</h3>
          <small>MarketPulse provides context, not investment advice.</small>
        </article>
      </section>
      <section className="events">
        <p className="kicker">RECENT NEWS & COMPANY EVENTS</p>
        {(x.news || []).length ? (
          x.news.map((n) => (
            <article key={n.title}>
              <i>✦</i>
              <span><b>{n.title}</b><small>{n.description}</small></span>
            </article>
          ))
        ) : (
          <p className="muted" style={{ color: 'var(--u)', padding: '10px 0' }}>No important events detected.</p>
        )}
      </section>
    </>
  );
}

function Explore({ toast, reload }) {
  const [q, setQ] = useState('');
  const [r, setR] = useState([]);

  const s = async (v) => {
    setQ(v);
    setR(v ? await api('/watchlist/search?q=' + v) : []);
  };

  return (
    <>
      <Title title="Explore markets" sub="Discover the signals shaping today’s market." />
      <div className="controls">
        <input
          value={q}
          onChange={(e) => s(e.target.value)}
          placeholder="Search a ticker or company"
        />
      </div>
      <section className="explore">
        {[
          ['Trending stocks', ['NVDA', 'AAPL', 'MSFT']],
          ['Top gainers', ['NVDA', 'AMZN', 'AAPL']],
          ['Most active', ['TSLA', 'NVDA', 'AAPL']],
        ].map(([h, a]) => (
          <article key={h}>
            <p className="kicker">{h.toUpperCase()}</p>
            {a.map((sym, i) => (
              <button
                onClick={async () => {
                  try {
                    await api('/watchlist', {
                      method: 'POST',
                      body: JSON.stringify({ symbol: sym }),
                    });
                    toast(sym + ' added');
                    reload();
                  } catch (e) {
                    toast(e.message);
                  }
                }}
                key={sym}
              >
                <b>{sym}</b>
                <span className="up">+{(4.8 - i * 1.2).toFixed(1)}%</span>
                <em>＋</em>
              </button>
            ))}
          </article>
        ))}
      </section>
      <div className="searchcards">
        {r.map((x) => (
          <button
            key={x.symbol}
            onClick={async () => {
              await api('/watchlist', {
                method: 'POST',
                body: JSON.stringify({ symbol: x.symbol }),
              });
              reload();
              toast(x.symbol + ' added');
            }}
          >
            <b>{x.symbol}</b>
            <span>{x.companyName}</span>＋
          </button>
        ))}
      </div>
    </>
  );
}

function News({ d, open }) {
  const n = (d?.items || []).flatMap((x) =>
    (x.news || []).map((a) => ({ ...a, symbol: x.symbol }))
  );

  return (
    <>
      <Title title="Market news" sub="Important events, filtered for context." />
      <div className="tabs">
        <button className="on">All</button>
        <button>My Watchlist</button>
        <button>Technology</button>
        <button>Finance</button>
        <button>Markets</button>
      </div>
      <section className="newsgrid">
        {n.length ? (
          n.map((x) => (
            <button key={x.title} onClick={() => open(x.symbol)}>
              <span className="newsicon">✦</span>
              <small>{x.symbol} · HIGH IMPACT</small>
              <h3>{x.title}</h3>
              <p>{x.description}</p>
              <footer>{x.source} · 2h ago <b>→</b></footer>
            </button>
          ))
        ) : (
          <Empty />
        )}
      </section>
    </>
  );
}

function Alerts({ d, toast }) {
  const [a, setA] = useState([]);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({
    symbol: d?.items?.[0]?.symbol || 'NVDA',
    type: 'Price movement',
    threshold: 5,
  });

  const load = () => api('/alerts').then(setA).catch(() => {});
  useEffect(load, []);

  return (
    <>
      <Title title="Alerts" sub="Be notified when a market moment deserves your attention.">
        <button className="primary" onClick={() => setShow(true)}>+ Create alert</button>
      </Title>
      <section className="alertlist">
        {a.length ? (
          a.map((x) => (
            <article key={x.id}>
              <i>♧</i>
              <div>
                <b>{x.symbol}</b>
                <p>Alert when {x.type.toLowerCase()} moves more than {x.threshold}%</p>
                <small>{x.enabled ? 'Active' : 'Paused'}</small>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={x.enabled}
                  onChange={async (e) => {
                    await api('/alerts/' + x.id, {
                      method: 'PATCH',
                      body: JSON.stringify({ enabled: e.target.checked }),
                    });
                    load();
                  }}
                />
                <i />
              </label>
              <button
                onClick={async () => {
                  await api('/alerts/' + x.id, { method: 'DELETE' });
                  load();
                }}
              >
                ×
              </button>
            </article>
          ))
        ) : (
          <Empty />
        )}
      </section>
      {show && (
        <div className="modal">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api('/alerts', { method: 'POST', body: JSON.stringify(f) });
              setShow(false);
              load();
              toast('Alert created');
            }}
          >
            <button type="button" className="close" onClick={() => setShow(false)}>×</button>
            <p className="kicker">NEW ALERT</p>
            <h2>Create an alert</h2>
            <label>
              Stock
              <select
                value={f.symbol}
                onChange={(e) => setF({ ...f, symbol: e.target.value })}
              >
                {(d?.items || []).map((x) => (
                  <option key={x.symbol}>{x.symbol}</option>
                ))}
              </select>
            </label>
            <label>
              Alert type
              <select onChange={(e) => setF({ ...f, type: e.target.value })}>
                <option>Price movement</option>
                <option>Volume spike</option>
                <option>News event</option>
              </select>
            </label>
            <label>
              Threshold
              <input
                type="number"
                value={f.threshold}
                onChange={(e) => setF({ ...f, threshold: e.target.value })}
              />
            </label>
            <button className="primary">Save alert</button>
          </form>
        </div>
      )}
    </>
  );
}

function Portfolio({ toast }) {
  const [p, setP] = useState(null);
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ symbol: 'NVDA', shares: 1, averagePrice: 170 });

  const load = () => api('/portfolio').then(setP).catch(() => {});
  useEffect(load, []);

  if (!p) return null;

  return (
    <>
      <Title title="Portfolio" sub="A simple view of your manually tracked holdings.">
        <button className="primary" onClick={() => setShow(true)}>+ Add holding</button>
      </Title>
      <section className="stats portfolio">
        <article>
          <small>TOTAL PORTFOLIO VALUE</small>
          <b>${(p.total || 0).toLocaleString()}</b>
        </article>
        <article>
          <small>OVERALL RETURN</small>
          <b className={(p.gain || 0) >= 0 ? 'up' : 'down'}>
            {(p.gain || 0) >= 0 ? '+' : ''}${Math.abs(p.gain || 0).toLocaleString()}
          </b>
        </article>
        <article>
          <small>HOLDINGS</small>
          <b>{(p.holdings || []).length}</b>
        </article>
      </section>
      <section className="table">
        <div className="row head">
          <span>Stock</span>
          <span>Shares</span>
          <span>Average price</span>
          <span>Current price</span>
          <span>Gain / Loss</span>
        </div>
        {(p.holdings || []).map((x) => (
          <div className="row" key={x.id}>
            <span><b>{x.symbol}</b></span>
            <span>{x.shares}</span>
            <span>${x.averagePrice}</span>
            <span>${x.currentPrice}</span>
            <span className={(x.gain || 0) >= 0 ? 'up' : 'down'}>
              {(x.gain || 0) >= 0 ? '+' : ''}${x.gain}
            </span>
          </div>
        ))}
      </section>
      {show && (
        <div className="modal">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await api('/portfolio', { method: 'POST', body: JSON.stringify(f) });
              setShow(false);
              load();
              toast('Holding added');
            }}
          >
            <button type="button" className="close" onClick={() => setShow(false)}>×</button>
            <h2>Add holding</h2>
            <input
              placeholder="Ticker"
              value={f.symbol}
              onChange={(e) => setF({ ...f, symbol: e.target.value })}
            />
            <input
              type="number"
              placeholder="Shares"
              value={f.shares}
              onChange={(e) => setF({ ...f, shares: e.target.value })}
            />
            <input
              type="number"
              placeholder="Average price"
              value={f.averagePrice}
              onChange={(e) => setF({ ...f, averagePrice: e.target.value })}
            />
            <button className="primary">Save holding</button>
          </form>
        </div>
      )}
    </>
  );
}

function Insights({ d }) {
  const items = d?.items || [];
  const counts = d?.counts || { 'HIGH ATTENTION': 0, 'WORTH CHECKING': 0, STABLE: 0 };
  const h = counts['HIGH ATTENTION'] || 0;
  const up = items.filter((x) => (x.priceChange || 0) > 3).length;
  const sortedNews = [...items].sort((a, b) => (b.news?.length || 0) - (a.news?.length || 0));
  const topNewsStock = sortedNews[0];
  const sortedVol = [...items].sort((a, b) => (b.volumeRatio || 0) - (a.volumeRatio || 0));
  const topVolStock = sortedVol[0];

  return (
    <>
      <Title title="Insights" sub="A calmer view of patterns in your watchlist." />
      <section className="insights">
        <article>
          <i>⚡</i>
          <div>
            <p className="kicker">VOLUME SPIKE</p>
            <h3>
              {topVolStock?.symbol || '—'} is trading at {topVolStock?.volumeRatio || 0}× normal volume.
            </h3>
          </div>
        </article>
        <article>
          <i>↗</i>
          <div>
            <p className="kicker">MOMENTUM</p>
            <h3>{up} stocks in your watchlist have significant upward movement.</h3>
          </div>
        </article>
        <article>
          <i>✦</i>
          <div>
            <p className="kicker">NEWS ACTIVITY</p>
            <h3>{topNewsStock?.symbol || '—'} has the highest news activity in your watchlist.</h3>
          </div>
        </article>
        <article>
          <i>⚠</i>
          <div>
            <p className="kicker">WATCHLIST HEALTH</p>
            <h3>{h} stocks need attention. {counts.STABLE || 0} are stable.</h3>
          </div>
        </article>
      </section>
    </>
  );
}

function Demo({ reload, toast }) {
  const scenarios = [
    ['rise', 'Significant Price Rise', 'Simulate a sharp price move with elevated volume and news.'],
    ['fall', 'Significant Price Drop', 'Show a significant negative market movement.'],
    ['volume', 'Volume Spike', 'Simulate unusual trading activity.'],
    ['news', 'Breaking News', 'Inject an important company event.'],
    ['calm', 'No Meaningful Changes', 'Return to a calm, stable market.'],
    ['outage', 'API Failure / Stale Data', 'Use a last-known value and surface a data warning.'],
  ];

  return (
    <>
      <Title title="MarketPulse Demo" sub="Simulate market events and see how MarketPulse responds." />
      <section className="scenario">
        {scenarios.map((x) => (
          <article key={x[0]}>
            <i>◉</i>
            <div>
              <b>{x[1]}</b>
              <p>{x[2]}</p>
            </div>
            <button
              className="outline"
              onClick={async () => {
                await api('/demo/scenario', {
                  method: 'POST',
                  body: JSON.stringify({ scenario: x[0] }),
                });
                await reload();
                toast(x[1] + ' is now active');
              }}
            >
              Run scenario
            </button>
          </article>
        ))}
      </section>
    </>
  );
}

function Settings({ user, toast }) {
  const [p, setP] = useState({ notifications: true, darkMode: true, demoMode: true });
  useEffect(() => {
    api('/preferences').then(setP).catch(() => {});
  }, []);

  const save = async (x) => {
    const n = { ...p, ...x };
    setP(n);
    await api('/preferences', { method: 'PATCH', body: JSON.stringify(n) });
    toast('Settings saved');
  };

  return (
    <>
      <Title title="Settings" sub="Manage your MarketPulse experience." />
      <section className="settings">
        <article>
          <p className="kicker">PROFILE</p>
          <label>Name<input defaultValue={user?.name || ''} /></label>
          <label>Email<input defaultValue={user?.email || ''} /></label>
          <button
            className="outline"
            onClick={() => toast('Profile changes are ready for a server-side profile update.')}
          >
            Save profile
          </button>
        </article>
        <article>
          <p className="kicker">PREFERENCES</p>
          {[
            ['notifications', 'Notifications', 'Receive alert and event notifications'],
            ['darkMode', 'Dark interface', 'Use the premium dark navigation theme'],
            ['demoMode', 'Demo mode', 'Show hackathon scenario controls'],
          ].map(([k, h, s]) => (
            <div className="pref" key={k}>
              <span><b>{h}</b><small>{s}</small></span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={Boolean(p[k])}
                  onChange={(e) => save({ [k]: e.target.checked })}
                />
                <i />
              </label>
            </div>
          ))}
        </article>
      </section>
    </>
  );
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('mp_token');
      const userStr = localStorage.getItem('mp_user');
      if (!token || !userStr) return null;
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState('Dashboard');
  const [d, setD] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toast, setToast] = useState('');

  const logout = () => {
    localStorage.removeItem('mp_token');
    localStorage.removeItem('mp_user');
    setUser(null);
    setD(null);
    setDetail(null);
    setLoadError(null);
  };

  useEffect(() => {
    const onAuthExpired = (e) => {
      logout();
      setToast(e.detail || 'Your session has expired. Please sign in again.');
    };
    window.addEventListener('mp_unauthorized', onAuthExpired);
    return () => window.removeEventListener('mp_unauthorized', onAuthExpired);
  }, []);

  const reload = async () => {
    const token = localStorage.getItem('mp_token');
    if (!token) {
      logout();
      return;
    }
    setLoadError(null);
    try {
      const data = await api('/changes');
      setD(data);
    } catch (e) {
      setLoadError(e.message || 'Failed to load briefing.');
      setToast(e.message);
    }
  };

  useEffect(() => {
    if (user) {
      reload();
    } else {
      setD(null);
      setLoadError(null);
    }
  }, [user]);

  const open = async (s) => {
    try {
      const res = await api('/changes/' + s);
      setDetail(res);
      setPage('Detail');
    } catch (e) {
      setToast(e.message);
    }
  };

  if (!user) {
    return (
      <>
        <Auth
          done={(u) => {
            setUser(u);
          }}
          initialMessage={toast}
        />
        {toast && (
          <div className="toast">
            {toast}
            <button onClick={() => setToast('')}>×</button>
          </div>
        )}
      </>
    );
  }

  if (loadError && !d) {
    return (
      <div className="loading">
        <div className="error-card">
          <div className="brand">market<span>pulse</span></div>
          <h3>Unable to load your briefing</h3>
          <p>{loadError}</p>
          <div className="error-actions">
            <button className="primary" onClick={reload}>Try again</button>
            <button className="outline" onClick={logout}>Sign out</button>
          </div>
        </div>
      </div>
    );
  }

  if (!d) {
    return (
      <div className="loading">
        <div className="loading-content">
          <div className="spinner" />
          <p>Loading your briefing…</p>
          <button className="outline" style={{ marginTop: 14, fontSize: 12 }} onClick={logout}>
            Taking too long? Sign out
          </button>
        </div>
      </div>
    );
  }

  const content = detail ? (
    <Detail
      x={detail}
      back={() => {
        setDetail(null);
        setPage('Dashboard');
      }}
    />
  ) : page === 'Dashboard' ? (
    <Dashboard d={d} open={open} user={user} />
  ) : page === 'Watchlist' ? (
    <Watchlist d={d} open={open} reload={reload} toast={setToast} />
  ) : page === 'Explore' ? (
    <Explore reload={reload} toast={setToast} />
  ) : page === 'News' ? (
    <News d={d} open={open} />
  ) : page === 'Alerts' ? (
    <Alerts d={d} toast={setToast} />
  ) : page === 'Portfolio' ? (
    <Portfolio toast={setToast} />
  ) : page === 'Insights' ? (
    <Insights d={d} />
  ) : page === 'Demo Mode' ? (
    <Demo reload={reload} toast={setToast} />
  ) : (
    <Settings user={user} toast={setToast} />
  );

  return (
    <Shell
      page={page}
      setPage={(p) => {
        setDetail(null);
        setPage(p);
      }}
      user={user}
      logout={logout}
    >
      {content}
      {toast && (
        <div className="toast">
          {toast}
          <button onClick={() => setToast('')}>×</button>
        </div>
      )}
    </Shell>
  );
}

createRoot(document.getElementById('root')).render(<App />);
