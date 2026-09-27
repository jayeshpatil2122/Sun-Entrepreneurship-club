import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

/* ========================================================= API & Auth */
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const TOKEN_KEY = 'sebc_admin_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event('sebc-admin-change'));
};
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event('sebc-admin-change'));
};

async function request(path, { method = 'GET', body, form = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !form) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : form ? body : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data;
}

export const api = {
  events: () => request('/api/events'),
  team: () => request('/api/team'),
  rsvp: (id, body) => request(`/api/events/${id}/rsvp`, { method: 'POST', body }),
  registration: (body) => request('/api/registrations', { method: 'POST', body }),
  uploadDeck: (file) => {
    const body = new FormData();
    body.append('deck', file);
    return request('/api/registrations/upload-deck', { method: 'POST', body, form: true });
  },
  login: (body) => request('/api/auth/login', { method: 'POST', body }),
  me: () => request('/api/auth/me'),
  forgot: (body) => request('/api/auth/forgot', { method: 'POST', body }),
  reset: (body) => request('/api/auth/reset', { method: 'POST', body }),
  registrations: () => request('/api/registrations?limit=100'),
  updateRegistration: (id, body) => request(`/api/registrations/${id}`, { method: 'PATCH', body }),
  deleteRegistration: (id) => request(`/api/registrations/${id}`, { method: 'DELETE' }),
  accept: (id) => request(`/api/registrations/${id}/accept`, { method: 'POST' }),
  resend: (id) => request(`/api/registrations/${id}/resend`, { method: 'POST' }),
  eventsAll: () => request('/api/events/all'),
  createEvent: (body) => request('/api/events', { method: 'POST', body }),
  updateEvent: (id, body) => request(`/api/events/${id}`, { method: 'PUT', body }),
  deleteEvent: (id) => request(`/api/events/${id}`, { method: 'DELETE' }),
  teamAll: () => request('/api/team/all'),
  createMember: (body) => request('/api/team', { method: 'POST', body }),
  deleteMember: (id) => request(`/api/team/${id}`, { method: 'DELETE' }),
  admins: () => request('/api/admins'),
  createAdmin: (body) => request('/api/admins', { method: 'POST', body }),
  deleteAdmin: (id) => request(`/api/admins/${id}`, { method: 'DELETE' }),
  audit: () => request('/api/audit?limit=100'),
};

const NAV = [
  ['home', 'Home'],
  ['events', 'Events'],
  ['team', 'Team'],
  ['arcade', 'Arcade'],
];

const FOOTER_NAV = [
  ['home', 'Home'],
  ['events', 'Events'],
  ['team', 'Team'],
  ['arcade', 'Arcade'],
  ['register', 'Register'],
];

const schools = [
  'SOCSE - School of Computer Sciences & Engineering',
  'SOET - School of Engineering & Technology',
  'SOL - School of Law',
  'SOMS - School of Management Studies',
  'SOP - School of Pharmaceutical Sciences',
  'SOD - School of Design',
  'SOS - School of Science',
  'SOSA - School of Agricultural Sciences',
  'Other — not listed above',
];

const domains = [
  'Artificial Intelligence & SaaS',
  'Healthcare & BioTech',
  'AgriTech & Rural Innovation',
  'FinTech & Blockchain',
  'CleanTech & Renewable Energy',
  'EdTech & Social Impact',
  'Hardware, Robotics & IoT',
  'Consumer / E-Commerce',
  'Other — not listed above',
];

function route() {
  const path = location.pathname.replace(/^\//, '').replace(/\/$/, '').split('/')[0];
  const hash = (location.hash || '').replace(/^#\/?/, '').split('?')[0];
  
  if (path && path !== 'index.html') {
    return path;
  }
  return hash === '' ? 'home' : hash;
}
function go(page) {
  const target = page === 'home' ? '/home' : `/${page}`;
  history.pushState(null, '', target);
  window.dispatchEvent(new Event('popstate'));
  window.scrollTo(0, 0);
}
function photo(url) {
  return url?.startsWith('/uploads/') ? `${BASE}${url}` : url;
}

/* ========================================================= Modal */
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">×</button>
        {title && <p className="eyebrow">{title}</p>}
        {children}
      </div>
    </div>
  );
}

/* ========================================================= Shell Layout */
function Shell({ children, page, onLogout, showAdminLink, isDark, setIsDark }) {
  const [menu, setMenu] = useState(false);
  const [isStuck, setIsStuck] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsStuck(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app-shell">
      <div id="grain" />
      <div id="vignette" />
      <div id="cursor" className="cur-dot" />

      {/* Navigation Header */}
      <header className={`app-nav ${isStuck ? 'stuck' : ''}`}>
        <a className="app-brand" href="/home" onClick={(e) => { e.preventDefault(); go('home'); }} data-cursor aria-label="SEBC Home">
          <img
            src="/sandip-university-logo.png"
            alt="Sandip University"
            className="brand-logo-img"
          />
          <span className="brand-tx">
            <b>SEBC × SUN</b>
            <i>SANDIP E-CLUB · NASHIK</i>
          </span>
        </a>

        <nav className="app-links">
          {NAV.map(([id, label]) => (
            <a
              key={id}
              className={page === id ? 'on' : ''}
              href={`/${id}`}
              onClick={(e) => { e.preventDefault(); go(id); }}
              data-cursor
            >
              {label}
            </a>
          ))}
          {(showAdminLink || page === 'admin') && (
            <a
              className={page === 'admin' ? 'on' : ''}
              href="/admin"
              onClick={(e) => { e.preventDefault(); go('admin'); }}
              data-cursor
            >
              Admin
            </a>
          )}
        </nav>

        <div className="nav-actions">
          <a
            className="small-cta red desktop-only"
            href="/register"
            onClick={(e) => { e.preventDefault(); go('register'); }}
            data-cursor
          >
            Register Now →
          </a>
          {onLogout && (
            <button className="theme-btn" onClick={onLogout} title="Sign out" data-cursor>
              <i className="fa-solid fa-arrow-right-from-bracket" />
            </button>
          )}
          <button
            type="button"
            className={`menu-button ${menu ? 'active' : ''}`}
            onClick={() => setMenu(!menu)}
            aria-label="Toggle navigation menu"
            data-cursor
          >
            <i className={`fa-solid ${menu ? 'fa-xmark' : 'fa-bars'}`} />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {menu && (
        <div className="mobile-nav-drawer" onClick={() => setMenu(false)}>
          <div className="mobile-nav-content" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-links">
              {NAV.map(([id, label]) => (
                <a
                  key={id}
                  className={`mobile-nav-item ${page === id ? 'on' : ''}`}
                  href={`/${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setMenu(false);
                    go(id);
                  }}
                >
                  <span>{label}</span>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', opacity: 0.5 }} />
                </a>
              ))}
              <a
                className={`mobile-nav-item ${page === 'register' ? 'on' : ''}`}
                href="/register"
                onClick={(e) => {
                  e.preventDefault();
                  setMenu(false);
                  go('register');
                }}
              >
                <span>Register</span>
                <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', opacity: 0.5 }} />
              </a>
              {(showAdminLink || page === 'admin') && (
                <a
                  className={`mobile-nav-item ${page === 'admin' ? 'on' : ''}`}
                  href="/admin"
                  onClick={(e) => {
                    e.preventDefault();
                    setMenu(false);
                    go('admin');
                  }}
                >
                  <span>Admin</span>
                  <i className="fa-solid fa-chevron-right" style={{ fontSize: '11px', opacity: 0.5 }} />
                </a>
              )}
            </div>
            <a
              className="solid-cta red"
              style={{ width: '100%', marginTop: '20px', textAlign: 'center', justifyContent: 'center' }}
              href="/register"
              onClick={(e) => {
                e.preventDefault();
                setMenu(false);
                go('register');
              }}
            >
              Register Now →
            </a>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="route-main">{children}</main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="foot-grid-sebc">
          <div className="foot-brand-sebc">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src="/sandip-university-logo.png"
                alt="Sandip University"
                style={{ width: '34px', height: '34px', objectFit: 'contain', display: 'block', flexShrink: 0 }}
              />
              <div>
                <strong style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: '16px', color: 'var(--bone)', letterSpacing: '0.12em' }}>SUN Entrepreneurship Club</strong>
                <div style={{ fontSize: '10.5px', letterSpacing: '0.18em', color: 'var(--bone-dim)', fontWeight: 600 }}>Sandip University, Nashik</div>
              </div>
            </div>
            <p style={{ fontWeight: 600, color: 'var(--bone-dim)', fontSize: '13px', lineHeight: '1.6' }}>
              A student-led entrepreneurship community focused on ideas, learning, collaboration and opportunities to explore venture building.
            </p>
          </div>

          <div className="foot-col">
            <h4 style={{ fontWeight: 700, color: 'var(--bone)' }}>Navigation</h4>
            <ul>
              <li><button onClick={() => go('home')} style={{ fontWeight: 600 }} data-cursor>Home</button></li>
              <li><button onClick={() => go('events')} style={{ fontWeight: 600 }} data-cursor>Events</button></li>
              <li><button onClick={() => go('register')} style={{ fontWeight: 600 }} data-cursor>Register</button></li>
              <li><button onClick={() => go('team')} style={{ fontWeight: 600 }} data-cursor>Team</button></li>
              <li><button onClick={() => go('events')} style={{ fontWeight: 600 }} data-cursor>Contact / Social Links</button></li>
            </ul>
          </div>

          <div className="foot-col">
            <h4 style={{ fontWeight: 700, color: 'var(--bone)' }}>Program</h4>
            <ul>
              <li><button onClick={() => go('events')} style={{ fontWeight: 600 }} data-cursor>SUN Launchpad 2026</button></li>
              <li><button onClick={() => go('events')} style={{ fontWeight: 600 }} data-cursor>Round 1 — Idea Pitch</button></li>
              <li><button onClick={() => go('events')} style={{ fontWeight: 600 }} data-cursor>Round 2 — Deeper Business Pitch</button></li>
              <li><button onClick={() => go('events')} style={{ fontWeight: 600 }} data-cursor>6-Month Incubation Program</button></li>
            </ul>
          </div>

          <div className="foot-col">
            <h4 style={{ fontWeight: 700, color: 'var(--bone)' }}>Find Us</h4>
            <p style={{ color: 'var(--bone-dim)', fontSize: '13px', lineHeight: '1.7', textTransform: 'none', fontWeight: 600 }}>
              Sandip University Campus,<br />
              Nashik, Maharashtra
            </p>
            <div style={{ marginTop: '14px' }}>
              <span style={{ fontSize: '10.5px', letterSpacing: '0.16em', color: 'var(--gold)', textTransform: 'uppercase', fontWeight: 700 }}>SUN Launchpad 2026</span>
              <div style={{ fontSize: '11px', color: 'var(--bone-dim)', margin: '2px 0 6px', fontWeight: 600 }}>Free to participate.</div>
              <button onClick={() => go('register')} className="small-cta red" style={{ padding: '4px 14px', fontSize: '10.5px', fontWeight: 700 }} data-cursor>Register Your Idea</button>
            </div>
          </div>
        </div>

        <div className="foot-base-sebc">
          <span style={{ fontWeight: 600, color: 'var(--bone-dim)' }}>© 2026 SEBC · Sandip University. All rights reserved.</span>
          <span style={{ fontWeight: 600, color: 'var(--bone-dim)' }}>
            <button onClick={() => go('admin')} style={{ fontWeight: 600, color: 'var(--bone-dim)' }} data-cursor>Admin</button> · Built by the SEBC Technical Team
          </span>
          <CreatorCredits />
        </div>
      </footer>
    </div>
  );
}

function CreatorCredits() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const trigger = () => {
    setOpen(true);
    setTimeout(() => setStep(1), 120);
    setTimeout(() => setStep(2), 650);
    setTimeout(() => setStep(3), 1200);
  };

  return (
    <div className="creator-credits-box" style={{ width: '100%', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--line-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', textAlign: 'center' }}>
      {!open ? (
        <button
          type="button"
          onClick={trigger}
          data-cursor
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 90, 78, 0.3)',
            color: 'var(--bone)',
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            fontWeight: 700,
            padding: '8px 20px',
            borderRadius: '30px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 18px rgba(255, 90, 78, 0.15)',
          }}
        >
          <span style={{ color: 'var(--light-red, #ff5a4e)' }}>◆</span> <span>CURIOUS WHO BUILT THIS WORLD? ↗</span>
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.06em', color: '#fff', background: 'rgba(255,90,78,0.14)', border: '1px solid rgba(255,90,78,0.4)', padding: '6px 14px', borderRadius: '8px', boxShadow: '0 0 16px rgba(255,90,78,0.3)', opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.45s ease' }}>
            1. Jayesh Patil
          </span>
          <span style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.06em', color: '#fff', background: 'rgba(255,150,50,0.14)', border: '1px solid rgba(255,150,50,0.4)', padding: '6px 14px', borderRadius: '8px', boxShadow: '0 0 16px rgba(255,150,50,0.3)', opacity: step >= 2 ? 1 : 0, transform: step >= 2 ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.45s ease' }}>
            2. Ashirwad Deshmukh
          </span>
          <span style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.06em', color: '#fff', background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.4)', padding: '6px 14px', borderRadius: '8px', boxShadow: '0 0 16px rgba(212,175,55,0.3)', opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.45s ease' }}>
            3. M.D. Praveen
          </span>
        </div>
      )}
    </div>
  );
}

function Notice({ message, error }) {
  return message ? <p className={error ? 'notice error' : 'notice'}>{message}</p> : null;
}
function Loading() {
  return <div className="loading">Loading live SEBC data...</div>;
}

/* ========================================================= Events Page Data */
const STATIC_EVENTS = [
  {
    _id: 'ev-launchpad-2026',
    type: 'flagship',
    title: 'SUN Launchpad 2026',
    tagLeft: 'FLAGSHIP · DATES TO BE ANNOUNCED',
    tagRight: 'SUN ENTREPRENEURSHIP CLUB',
    subtitle: 'A PLATFORM FOR STUDENT IDEAS',
    status: 'UPCOMING',
    description: 'SUN Launchpad 2026 is the flagship pitch event of the SUN Entrepreneurship Club, created to discover promising student ideas, encourage entrepreneurial thinking and identify participants who may benefit from the next stage of support.',
    when: 'To be announced',
    venue: 'To be announced',
    fee: 'Free, subject to official confirmation',
    format: 'Two-round pitch and evaluation program',
    participants: 'Students / student teams',
    nextStage: 'Selected/promising teams may be considered for the 6-month incubation program',
    stage1: {
      num: 'Round 01',
      title: 'Idea Pitch',
      desc: 'Open to students with an idea. Present the problem, who it affects, your proposed solution and why the idea matters. Designed for participation, confidence and clear communication.',
    },
    stage2: {
      num: 'Round 02',
      title: 'Deeper Business Pitch',
      desc: 'Shortlisted/promising participants go deeper into the idea: users/market, solution feasibility, business model, differentiation and execution plan.',
    },
  },
  {
    _id: 'ev-reg-drive',
    type: 'subcard',
    category: 'STUDENT PITCH PROGRAM',
    overtitle: 'SUN LAUNCHPAD 2026',
    title: 'SUN Launchpad 2026',
    status: 'PRESENT',
    description: 'Two-round student pitch program. Bring your idea, present it, receive feedback and explore the next step. Dates and detailed event information will be announced officially.',
    when: 'Dates to be announced',
    venue: 'To be announced',
    ctaText: 'Register your idea →',
    ctaAction: 'register',
  },
];

/* ========================================================= Events Page */
export function Events({ openRsvpModal, showAdminLink, isDark, setIsDark }) {
  const [events, setEvents] = useState(STATIC_EVENTS);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.events()
      .then((d) => {
        const items = d?.items || d;
        if (Array.isArray(items) && items.length > 0) {
          // If server returns items, make sure we keep the flagship + subcard hierarchy or format appropriately
          setEvents(items);
        }
      })
      .catch(() => {
        // Fallback to static SEBC Launchpad without disrupting public UI
      });
  }, []);

  const allEvents = (events && events.length > 0) ? events : STATIC_EVENTS;
  const shown = useMemo(() => {
    return allEvents.filter((event) => {
      const status = String(event.status || 'UPCOMING').toUpperCase();
      const matchesFilter = filter === 'ALL' || status === filter;
      if (!matchesFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const t = (event.title || '').toLowerCase();
      const d = (event.description || '').toLowerCase();
      const v = (event.venue || '').toLowerCase();
      const sub = (event.subtitle || '').toLowerCase();
      const cat = (event.category || '').toLowerCase();
      return t.includes(q) || d.includes(q) || v.includes(q) || sub.includes(q) || cat.includes(q);
    });
  }, [allEvents, filter, search]);

  const flagshipEvents = shown.filter((e) => e.type === 'flagship' || (!e.type && e._id === 'ev-launchpad-2026'));
  const subEvents = shown.filter((e) => e.type === 'subcard' || (e.type !== 'flagship' && e._id !== 'ev-launchpad-2026'));

  return (
    <Shell page="events" showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark}>
      <section className="route-hero">
        <p className="eyebrow"><span className="dot" /> SUN LAUNCHPAD 2026</p>
        <h1>A platform for<br /><span style={{ color: 'var(--vermilion)' }}>student ideas.</span></h1>
        <p>SUN Launchpad 2026 is the flagship pitch event of the SUN Entrepreneurship Club, created to discover promising student ideas, encourage entrepreneurial thinking and identify participants who may benefit from the next stage of support.</p>
      </section>

      <div className="event-filter-bar">
        <div className="event-search-box">
          <i className="fa-solid fa-magnifying-glass" />
          <input
            type="text"
            placeholder="Search events, topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="clear-search" onClick={() => setSearch('')} aria-label="Clear search">×</button>
          )}
        </div>

        <div className="filter-row" style={{ marginBottom: 0 }}>
          {['ALL', 'PRESENT', 'UPCOMING', 'COMPLETED'].map((item) => (
            <button
              key={item}
              className={filter === item ? 'selected' : ''}
              onClick={() => setFilter(item)}
              data-cursor
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="events-empty-state">
          <div className="events-empty-icon">
            <i className="fa-regular fa-calendar-xmark" />
          </div>
          <h3>No events found</h3>
          <p>
            {filter === 'COMPLETED'
              ? 'No past events yet — check back after our first pitch rounds.'
              : filter === 'PRESENT'
                ? 'No live events right now — check back soon.'
                : 'No events match your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="event-list-wrap">
          {flagshipEvents.map((event) => {
            const dateStr = event.when || (event.date ? new Date(event.date).toLocaleDateString('en-IN', { dateStyle: 'long' }) : event.time || 'To be announced');
            const venueStr = event.venue || 'To be announced';
            const feeStr = event.fee || 'Free to participate';
            const tagLeft = event.tagLeft || 'FLAGSHIP · DATES TO BE ANNOUNCED';
            const tagRight = event.tagRight || 'SUN ENTREPRENEURSHIP CLUB';

            return (
              <article className="event-flagship-card" key={event._id || event.title}>
                <div className="event-flagship-topbar">
                  <span className="event-flagship-tag">
                    <span className="dot-gold" /> {tagLeft}
                  </span>
                  <span className="event-partner-pill">{tagRight}</span>
                </div>

                <h2 className="event-flagship-title">{event.title}</h2>
                <span className="event-flagship-sub">{event.subtitle}</span>
                <p className="event-flagship-desc">{event.description}</p>

                <div className="event-meta-grid-3">
                  <div className="event-meta-box">
                    <span className="meta-box-label">
                      <i className="fa-solid fa-list-check" /> FORMAT
                    </span>
                    <span className="meta-box-val">{event.format || 'Two-round pitch and evaluation program'}</span>
                  </div>
                  <div className="event-meta-box">
                    <span className="meta-box-label">
                      <i className="fa-regular fa-clock" /> DATE &amp; VENUE
                    </span>
                    <span className="meta-box-val">{dateStr} · {venueStr}</span>
                  </div>
                  <div className="event-meta-box">
                    <span className="meta-box-label">
                      <i className="fa-solid fa-ticket" /> PARTICIPATION
                    </span>
                    <span className="meta-box-val highlight">{feeStr}</span>
                  </div>
                </div>

                {(event.stage1 || event.stage2) && (
                  <div className="event-stages-grid-2">
                    {event.stage1 && (
                      <div className="event-stage-card">
                        <span className="stage-card-tag">{event.stage1.num || 'Round 01'}</span>
                        <h4>{event.stage1.title}</h4>
                        <p>{event.stage1.desc}</p>
                      </div>
                    )}
                    {event.stage2 && (
                      <div className="event-stage-card">
                        <span className="stage-card-tag">{event.stage2.num || 'Round 02'}</span>
                        <h4>{event.stage2.title}</h4>
                        <p>{event.stage2.desc}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="event-flagship-actions">
                  <button
                    type="button"
                    className="solid-cta gold"
                    onClick={() => openRsvpModal(event.title, dateStr, venueStr, event._id)}
                    data-cursor
                  >
                    <i className="fa-solid fa-bell" style={{ marginRight: '6px' }} /> Notify me of updates
                  </button>
                  <a className="solid-cta red" href="#/register" onClick={() => go('register')} data-cursor>
                    Register your idea →
                  </a>
                </div>
              </article>
            );
          })}

          {subEvents.length > 0 && (
            <div className="event-subgrid-2">
              {subEvents.map((event) => {
                const isPresent = String(event.status).toUpperCase() === 'PRESENT';
                const isUpcoming = String(event.status).toUpperCase() === 'UPCOMING';
                const dateStr = event.when || (event.date ? new Date(event.date).toLocaleDateString('en-IN', { dateStyle: 'long' }) : event.time || 'Dates to be announced');
                const venueStr = event.venue || 'Sandip University Campus';

                return (
                  <article className="event-subcard" key={event._id || event.title}>
                    <div className="event-subcard-body">
                      <div className="event-subcard-topbar">
                        <span className="event-subcard-tag">{event.category || 'EVENT'}</span>
                        <span className={`event-status-badge ${isPresent ? 'present' : isUpcoming ? 'upcoming' : 'completed'}`}>
                          <span className="badge-dot" /> {event.status || 'UPCOMING'}
                        </span>
                      </div>

                      <span className="event-subcard-overtitle">{event.overtitle || 'SUN LAUNCHPAD 2026'}</span>
                      <h3 className="event-subcard-title">{event.title}</h3>
                      <p className="event-subcard-desc">{event.description}</p>

                      <div className="event-subcard-meta-list">
                        <div className="event-subcard-meta-item">
                          <i className="fa-regular fa-clock" />
                          <span>{dateStr}</span>
                        </div>
                        <div className="event-subcard-meta-item">
                          <i className="fa-solid fa-location-dot" />
                          <span>{venueStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="event-subcard-actions">
                      {event.ctaAction === 'register' || event._id === 'ev-reg-drive' ? (
                        <a className="event-subcard-btn-solid" href="#/register" data-cursor>
                          {event.ctaText || 'Register now →'}
                        </a>
                      ) : (
                        <button
                          type="button"
                          className="event-subcard-btn-outline"
                          onClick={() => openRsvpModal(event.title, dateStr, venueStr, event._id)}
                          data-cursor
                        >
                          <i className="fa-solid fa-bell" style={{ marginRight: '6px', fontSize: '11px' }} /> {event.ctaText || 'Get event alert'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA Banner */}
      <div className="event-cta-banner">
        <div className="event-cta-text">
          <span className="eyebrow" style={{ color: 'var(--gold)', margin: 0 }}>NEVER MISS A PITCH NIGHT</span>
          <h3>Get WhatsApp + email alerts for every round.</h3>
        </div>
        <button
          className="solid-cta gold"
          onClick={() => openRsvpModal('SEBC Pitch Alert List', 'Upcoming Round Updates', 'WhatsApp & Email Notifications', null)}
          data-cursor
        >
          Join the list →
        </button>
      </div>
    </Shell>
  );
}

/* ========================================================= Home Page (Cinematic Kage/ThreeUI) */
export function Home({ showAdminLink, isDark, setIsDark }) {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', overflow: 'hidden', background: '#05070a' }}>
      <iframe
        src="/landing-pages/kage.html"
        title="SEBC — Build Your Startup Before You Graduate"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />
    </div>
  );
}

/* ========================================================= Arcade Page (2 Independent Games) */
export function Arcade({ showAdminLink, isDark, setIsDark }) {
  return (
    <Shell page="arcade" showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark}>
      <main className="content" style={{ maxWidth: '1080px', margin: '0 auto', padding: 'clamp(40px, 6vh, 80px) 20px' }}>
        <header className="page-head" style={{ marginBottom: '40px' }}>
          <p className="eyebrow"><span className="dot" /> FOUNDER ARCADE · 2 SEPARATE EXPERIENCES</p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 400, textTransform: 'uppercase', letterSpacing: '-0.02em', color: 'var(--bone)' }}>
            Break from the pitch. <span style={{ color: 'var(--light-red, #ff5a4e)', textShadow: '0 0 14px rgba(255, 90, 78, 0.45)' }}>Arcade.</span>
          </h1>
          <p className="lead" style={{ maxWidth: '720px', marginTop: '12px', color: 'var(--bone-dim)', fontSize: '15px', lineHeight: '1.6' }}>
            Take a break from building. Two verified standalone modules — play the retro space shooter or practice your shots on the 3D court.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          {/* Game 1: SUBLEVEL DEFENDER */}
          <section style={{
            position: 'relative',
            width: '100%',
            background: 'rgba(10, 14, 18, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(223, 231, 224, 0.12)',
            borderRadius: '16px',
            padding: 'clamp(14px, 2.5vw, 24px)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 90, 78, 0.10)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold, #d4af37)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  GAME 01 // ARCADE SHOOTER
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--bone)', margin: 0, letterSpacing: '-0.01em' }}>
                  Sublevel Defender
                </h2>
              </div>
              <span className="desktop-only" style={{ fontSize: '11px', color: 'var(--bone-dim)', fontFamily: 'var(--font-mono, monospace)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                TOUCH D-PAD OR [← / → / SPACE]
              </span>
            </div>
            <div style={{
              width: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#060204',
              border: '1px solid rgba(255, 77, 0, 0.25)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <iframe
                src="/games/sublevel-defender/index.html"
                title="Sublevel Defender Arcade Game"
                style={{
                  width: '100%',
                  height: 'clamp(480px, 68vh, 600px)',
                  border: 'none',
                  display: 'block',
                }}
              />
            </div>
          </section>

          {/* Game 2: SBLVL SHOT (BASKETBALL) */}
          <section style={{
            position: 'relative',
            width: '100%',
            background: 'rgba(10, 14, 18, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(223, 231, 224, 0.12)',
            borderRadius: '16px',
            padding: 'clamp(10px, 2.5vw, 24px)',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 150, 50, 0.10)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold, #d4af37)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                  GAME 02 // 3D BASKETBALL
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--bone)', margin: 0, letterSpacing: '-0.01em' }}>
                  SBLVL SHOT
                </h2>
              </div>
              <span className="desktop-only" style={{ fontSize: '11px', color: 'var(--bone-dim)', fontFamily: 'var(--font-mono, monospace)', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                [DRAG UP] SHOOT · [SPACE] AUTO-THROW · [R] RESET
              </span>
            </div>
            <div style={{
              width: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              background: '#0d0c0a',
              border: '1px solid rgba(255, 150, 50, 0.25)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <iframe
                src="/games/basketball/index.html"
                title="SBLVL SHOT 3D Basketball Game"
                style={{
                  width: '100%',
                  height: 'clamp(460px, 68vh, 600px)',
                  border: 'none',
                  display: 'block',
                }}
              />
            </div>
          </section>
        </div>
      </main>
    </Shell>
  );
}

/* ========================================================= Register Page */
export function Register({ onApplicationReceived, showAdminLink, isDark, setIsDark }) {
  const [data, setData] = useState({
    fullName: '',
    prn: '',
    university: 'Sandip University, Nashik',
    school: schools[0],
    academicYear: '2nd Year',
    gender: 'Male',
    email: '',
    phone: '',
    ideaTitle: '',
    domain: domains[0],
    targetUsers: '',
    stage: 'Idea',
    problemStatement: '',
    solutionOverview: '',
    teamType: 'Solo',
    teamMembers: '',
  });
  const [otherSchool, setOtherSchool] = useState('');
  const [otherDomain, setOtherDomain] = useState('');
  const [otherStage, setOtherStage] = useState('');
  const [deck, setDeck] = useState(null);
  const [deckDrag, setDeckDrag] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const change = (event) => setData({ ...data, [event.target.name]: event.target.value });

  // Core required fields for 0/7 progress calculation
  const coreFields = ['fullName', 'email', 'phone', 'ideaTitle', 'problemStatement', 'solutionOverview', 'targetUsers'];
  const progressCount = coreFields.filter((f) => Boolean(data[f] && data[f].trim())).length;

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDeckDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 15 * 1024 * 1024) {
        setError('Pitch deck file exceeds the 15MB limit.');
        return;
      }
      setDeck(file);
      setError('');
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        setError('Pitch deck file exceeds the 15MB limit.');
        return;
      }
      setDeck(file);
      setError('');
    }
  };

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      let pitchDeckUrl = '';
      if (deck) {
        const uploaded = await api.uploadDeck(deck);
        pitchDeckUrl = uploaded.url || '';
      }
      await api.registration({
        ...data,
        school: data.school.startsWith('Other') ? otherSchool : data.school,
        domain: data.domain.startsWith('Other') ? otherDomain : data.domain,
        stage: data.stage === 'Other' ? otherStage : data.stage,
        pitchDeckUrl,
      });
      if (onApplicationReceived) {
        onApplicationReceived({ name: data.fullName, title: data.ideaTitle });
      } else {
        setMessage(`Thanks, ${data.fullName.split(' ')[0] || 'founder'}. Your idea has been registered. You will receive updates about Round 1 schedule and details.`);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell page="register" showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark}>
      <section className="route-hero">
        <p className="eyebrow"><span className="dot" /> SUN LAUNCHPAD 2026 · REGISTRATION</p>
        <h1>Register your idea.</h1>
        <p>Tell us who you are, what problem you want to solve and how you think your solution could help. Your idea does not need to be a finished product.</p>
      </section>

      <div className="reg-layout-wrap">
        {/* Left Column: Sticky Progress Sidebar */}
        <aside className="reg-sidebar">
          <div className="reg-sidebar-card">
            <div className="reg-progress-head">
              <span className="eyebrow">YOUR PROGRESS</span>
              <div className="reg-progress-counter">
                {progressCount}<span>/7</span>
              </div>
            </div>

            <div className="reg-progress-track">
              <div
                className="reg-progress-bar"
                style={{ width: `${Math.round((progressCount / 7) * 100)}%` }}
              />
            </div>

            <div className="reg-sidebar-steps">
              <div className={`reg-step-row ${progressCount >= 1 ? 'completed' : ''}`}>
                <div className="reg-step-circle">1</div>
                <div className="reg-step-info">
                  <strong>Submit your idea</strong>
                  <p>Tell us about yourself and your problem &amp; solution.</p>
                </div>
              </div>

              <div className={`reg-step-row ${progressCount >= 5 ? 'completed' : ''}`}>
                <div className="reg-step-circle">2</div>
                <div className="reg-step-info">
                  <strong>Receive feedback</strong>
                  <p>Pitch in Round 1 and learn from evaluator questions.</p>
                </div>
              </div>

              <div className={`reg-step-row ${progressCount === 7 ? 'completed' : ''}`}>
                <div className="reg-step-circle">3</div>
                <div className="reg-step-info">
                  <strong>Take the next step</strong>
                  <p>Selected teams explore the 6-month incubation opportunity.</p>
                </div>
              </div>
            </div>

            <div className="reg-trust-pills">
              <span className="reg-trust-pill">Free to participate</span>
              <span className="reg-trust-pill">Early ideas welcome</span>
              <span className="reg-trust-pill">Solo or teams</span>
            </div>
          </div>
        </aside>

        {/* Right Column: Multi-Section Form */}
        <div className="reg-form-col">
          <form className="application-form" onSubmit={submit}>
            {/* Section 01 */}
            <div className="form-card-section">
              <div className="form-card-header">
                <span className="form-sec-num">01</span>
                <div>
                  <h3>Who you are</h3>
                  <p>Your details so we can reach you with event updates.</p>
                </div>
              </div>
              <div className="form-grid">
                <Input
                  label="Full name *"
                  name="fullName"
                  value={data.fullName}
                  onChange={change}
                  required
                  placeholder="e.g. Aarav Sharma"
                />
                <Input
                  label="University / College"
                  name="university"
                  value={data.university}
                  onChange={change}
                  placeholder="e.g. Sandip University, Nashik"
                />
                <Input
                  label="PRN / Roll no."
                  name="prn"
                  value={data.prn}
                  onChange={change}
                  placeholder="e.g. 220101234001"
                />
                <Select
                  label="School / Department *"
                  name="school"
                  value={data.school}
                  onChange={change}
                  options={schools}
                />
                {data.school.startsWith('Other') && (
                  <Input
                    label="Your school / department *"
                    value={otherSchool}
                    onChange={(e) => setOtherSchool(e.target.value)}
                    required
                    placeholder="Enter school or department name"
                  />
                )}
                <Select
                  label="Year of study"
                  name="academicYear"
                  value={data.academicYear}
                  onChange={change}
                  options={['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate / M.Tech / MBA', 'Alumni / Researcher']}
                />
                <Select
                  label="Gender"
                  name="gender"
                  value={data.gender}
                  onChange={change}
                  options={['Male', 'Female', 'Other / Prefer not to say']}
                />
                <Input
                  label="Email *"
                  name="email"
                  type="email"
                  value={data.email}
                  onChange={change}
                  required
                  placeholder="name@sandipuniversity.edu.in"
                />
                <Input
                  label="WhatsApp / Contact number *"
                  name="phone"
                  value={data.phone}
                  onChange={change}
                  required
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            {/* Section 02 */}
            <div className="form-card-section">
              <div className="form-card-header">
                <span className="form-sec-num">02</span>
                <div>
                  <h3>Your idea</h3>
                  <p>Tell us about the problem and your proposed solution.</p>
                </div>
              </div>
              <div className="form-grid">
                <Input
                  label="Idea / Venture title *"
                  name="ideaTitle"
                  value={data.ideaTitle}
                  onChange={change}
                  required
                  placeholder="e.g. AgriSync / PulseAI"
                />
                <Select
                  label="Sector / Domain"
                  name="domain"
                  value={data.domain}
                  onChange={(e) => {
                    change(e);
                    if (!e.target.value.startsWith('Other')) {
                      setOtherDomain('');
                    }
                  }}
                  options={domains}
                />
                {data.domain.startsWith('Other') && (
                  <Input
                    label="Your sector / domain *"
                    value={otherDomain}
                    onChange={(e) => setOtherDomain(e.target.value)}
                    required
                    placeholder="Enter your sector / domain"
                  />
                )}
                <div className="full-field">
                  <label>Participation type</label>
                  <div className="choice-row">
                    {['Solo', 'Team'].map((value) => (
                      <button
                        type="button"
                        className={data.teamType === value ? 'selected' : ''}
                        onClick={() => setData({ ...data, teamType: value })}
                        key={value}
                        data-cursor
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>

                {data.teamType === 'Team' && (
                  <div className="full-field">
                    <Text
                      label="Team member details"
                      name="teamMembers"
                      value={data.teamMembers}
                      onChange={change}
                      placeholder="Please list other team member names, emails and departments."
                    />
                  </div>
                )}

                <div className="full-field">
                  <Select
                    label="Current stage"
                    name="stage"
                    value={data.stage}
                    onChange={(e) => {
                      change(e);
                      if (e.target.value !== 'Other') setOtherStage('');
                    }}
                    options={['Idea', 'Prototype', 'Early users', 'Other']}
                  />
                  {data.stage === 'Other' && (
                    <Input
                      label="Specify stage *"
                      value={otherStage}
                      onChange={(e) => setOtherStage(e.target.value)}
                      required
                      placeholder="Describe your current stage"
                    />
                  )}
                </div>

                <div className="full-field">
                  <Input
                    label="Who is affected / Target users *"
                    name="targetUsers"
                    value={data.targetUsers}
                    onChange={change}
                    required
                    placeholder="Who experiences this problem daily? Who would use this?"
                  />
                </div>

                <Text
                  label="Problem statement *"
                  name="problemStatement"
                  value={data.problemStatement}
                  onChange={change}
                  required
                  placeholder="What exact problem or unmet need are you trying to solve?"
                />
                <Text
                  label="Proposed solution *"
                  name="solutionOverview"
                  value={data.solutionOverview}
                  onChange={change}
                  required
                  placeholder="What is your proposed solution and how does it help the target users?"
                />

                {/* Optional Pitch Deck Dropzone */}
                <div className="full-field">
                  <label>Optional pitch deck / supporting document</label>
                  <div
                    className={`deck-dropzone ${deckDrag ? 'dragover' : ''} ${deck ? 'has-file' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDeckDrag(true); }}
                    onDragLeave={() => setDeckDrag(false)}
                    onDrop={handleFileDrop}
                    onClick={() => document.getElementById('deck-file-input')?.click()}
                  >
                    <input
                      id="deck-file-input"
                      type="file"
                      accept=".pdf,.ppt,.pptx,.doc,.docx"
                      onChange={handleFileInput}
                      style={{ display: 'none' }}
                    />
                    <div className="deck-dropzone-content">
                      <div className="deck-icon-badge">
                        <i className={`fa-solid ${deck ? 'fa-file-pdf' : 'fa-cloud-arrow-up'}`} />
                      </div>
                      {deck ? (
                        <div className="deck-file-info">
                          <strong>{deck.name}</strong>
                          <span>{(deck.size / (1024 * 1024)).toFixed(2)} MB · Ready to upload</span>
                          <button
                            type="button"
                            className="deck-remove-btn"
                            onClick={(e) => { e.stopPropagation(); setDeck(null); }}
                          >
                            Remove file
                          </button>
                        </div>
                      ) : (
                        <div className="deck-upload-text">
                          <strong>Drop your deck or document here, or click to browse</strong>
                          <span>PDF / PPTX / DOCX · up to 15MB</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Notice message={error || message} error={!!error} />

            <div className="form-submit-footer">
              <p className="reg-acknowledgement" style={{ fontSize: '12px', color: 'var(--bone-dim)', lineHeight: '1.6', marginBottom: '14px', textAlign: 'center' }}>
                Submitting an idea does not guarantee progression to Round 2 or incubation. Selection is subject to event evaluation and applicable conditions.
              </p>
              <button
                type="submit"
                className="reg-submit-btn"
                disabled={busy}
                data-cursor
              >
                {busy ? 'Registering Your Idea...' : 'Register Your Idea →'}
              </button>
              <p className="form-submit-sub">
                Participation is planned as free. An early-stage idea is welcome. No registered company or prototype required.
              </p>
            </div>
          </form>
        </div>
      </div>
    </Shell>
  );
}

/* ========================================================= Team Page Data */
const STATIC_TEAM_MEMBERS = [
  {
    initials: 'RK',
    name: 'Rishi Kumar Mishra',
    role: 'President',
    description: 'Owns the vision — partnerships, incubation strategy and the ecosystem roadmap.',
    year: '3rd Year',
    department: 'Computer Science & Engineering',
    category: 'PRESIDENTS',
  },
  {
    initials: 'AS',
    name: 'Atul Sahane',
    role: 'Vice President',
    description: 'Runs cross-team operations, pitch programs and founder support.',
    year: '3rd Year',
    department: 'Engineering & Technology',
    category: 'PRESIDENTS',
  },
  {
    initials: 'SJ',
    name: 'Saurav Jha',
    role: 'Secretary',
    description: 'Keeps the institution running — compliance, records, official correspondence.',
    year: '3rd Year',
    department: 'School of Management Studies',
    category: 'SECRETARIES',
  },
  {
    initials: 'SM',
    name: 'Shaik Maksud Ahmad',
    role: 'Secretary',
    description: 'Connects teams, outreach and day-to-day operational tracking.',
    year: '3rd Year',
    department: 'Computer Science & Engineering',
    category: 'SECRETARIES',
  },
  {
    initials: 'JA',
    name: 'Jahan Ara Khan',
    role: 'Treasurer',
    description: 'Manages club budgets, event spends and finance operations.',
    year: '3rd Year',
    department: 'School of Management Studies',
    category: 'TREASURERS',
  },
  {
    initials: 'MP',
    name: 'M.D. Praveen',
    role: 'Technical Team Head',
    description: 'Architects the portals, platforms and digital infrastructure.',
    year: '3rd Year',
    department: '',
    category: 'TECHNICAL',
  },
  {
    initials: 'AD',
    name: 'Ashirwad Deshmukh',
    role: 'Technical Team Co-Head',
    description: 'Co-leads backend integrations and platform reliability.',
    year: '3rd Year',
    department: '',
    category: 'TECHNICAL',
  },
  {
    initials: 'JR',
    name: 'Jayesh Ranjit Patil',
    role: 'Technical Team Co-Head',
    description: 'Crafts frontend interfaces and design systems.',
    year: '3rd Year',
    department: '',
    category: 'TECHNICAL',
  },
  {
    initials: 'DK',
    name: 'Darshana Kushwaha',
    role: 'Event Team Head',
    description: 'Designs pitch nights, workshops and venue experiences.',
    year: '3rd Year',
    department: '',
    category: 'EVENT & MARKETING',
  },
  {
    initials: 'MP',
    name: 'Manish Patil',
    role: 'Event Team Co-Head',
    description: 'Owns logistics, hospitality and stage management.',
    year: '3rd Year',
    department: '',
    category: 'EVENT & MARKETING',
  },
  {
    initials: 'KP',
    name: 'Komal Pimple',
    role: 'Event Team Member',
    description: 'Runs registrations and on-ground coordination.',
    year: '',
    department: '',
    category: 'EVENT & MARKETING',
  },
  {
    initials: 'AS',
    name: 'Aparna Sambhari',
    role: 'Marketing Team Co-Head',
    description: 'Leads campaigns that fill every seat on pitch night.',
    year: '3rd Year',
    department: '',
    category: 'EVENT & MARKETING',
  },
  {
    initials: 'AT',
    name: 'Ankit Tiwari',
    role: 'Social Media Team Head',
    description: 'Directs channels, branding and announcements.',
    year: '3rd Year',
    department: '',
    category: 'EVENT & MARKETING',
  },
  {
    initials: 'MN',
    name: 'Mansi Nikumbh',
    role: 'Social Media Team Co-Head',
    description: 'Creates the visuals and content the campus shares.',
    year: '3rd Year',
    department: '',
    category: 'EVENT & MARKETING',
  },
  {
    initials: 'P',
    name: 'Pratima',
    role: 'Student Engagement Head',
    description: 'Guides first-timers from signup to stage-ready.',
    year: '3rd Year',
    department: '',
    category: 'MEDIA & ENGAGEMENT',
  },
  {
    initials: 'KS',
    name: 'Komal Sonawane',
    role: 'Student Engagement Co-Head',
    description: 'Answers queries and runs the support desks.',
    year: '3rd Year',
    department: '',
    category: 'MEDIA & ENGAGEMENT',
  },
  {
    initials: 'MG',
    name: 'Mahesh Gaikwad',
    role: 'Videographer & Video Editor',
    description: 'Shoots and edits event coverage and highlights.',
    year: '',
    department: '',
    category: 'MEDIA & PRODUCTION',
  },
  {
    initials: 'SV',
    name: 'Siddam Vaibhav',
    role: 'Videographer & Video Editor',
    description: 'Handles cinematography and post-production.',
    year: '',
    department: '',
    category: 'MEDIA & PRODUCTION',
  },
  {
    initials: 'KY',
    name: 'Kamsali Yashwanth',
    role: 'Videographer & Video Editor',
    description: 'Directs shoots, montages and visual stories.',
    year: '',
    department: '',
    category: 'MEDIA & PRODUCTION',
  },
  {
    initials: 'RK',
    name: 'Rohan Kolla',
    role: 'Videographer',
    description: 'Captures the moments that matter on event day.',
    year: '',
    department: '',
    category: 'MEDIA & PRODUCTION',
  },
  {
    initials: 'CM',
    name: 'Chityala Manikanteswarareddy',
    role: 'Video Editor',
    description: 'Cuts promos, reels and pitch-night highlights.',
    year: '',
    department: '',
    category: 'MEDIA & PRODUCTION',
  },
  {
    initials: 'PP',
    name: 'Prathmesh Patil',
    role: 'Video Editor',
    description: 'Designs teasers and recap edits.',
    year: '',
    department: '',
    category: 'MEDIA & PRODUCTION',
  },
  {
    initials: 'TA',
    name: 'Tejas Adhav Patil',
    role: 'Sponsorship Team Head',
    description: 'Builds corporate alliances and mentor links.',
    year: '3rd Year',
    department: '',
    category: 'SPONSORSHIP',
  },
  {
    initials: 'YD',
    name: 'Yash Dange',
    role: 'Sponsorship Team Co-Head',
    description: 'Manages partners and the prize pool.',
    year: '3rd Year',
    department: '',
    category: 'SPONSORSHIP',
  },
];

const TEAM_CATEGORIES = [
  { id: 'ALL', label: 'ALL' },
  { id: 'PRESIDENTS', label: 'PRESIDENTS' },
  { id: 'SECRETARIES', label: 'SECRETARIES' },
  { id: 'TREASURERS', label: 'TREASURERS' },
  { id: 'TECHNICAL', label: 'TECHNICAL' },
  { id: 'EVENT & MARKETING', label: 'EVENT & MARKETING' },
  { id: 'MEDIA & ENGAGEMENT', label: 'MEDIA & ENGAGEMENT' },
  { id: 'MEDIA & PRODUCTION', label: 'MEDIA & PRODUCTION' },
  { id: 'SPONSORSHIP', label: 'SPONSORSHIP' },
];

/* ========================================================= Team Page */
export function Team({ showAdminLink, isDark, setIsDark }) {
  const [members, setMembers] = useState(STATIC_TEAM_MEMBERS);
  const [category, setCategory] = useState('ALL');

  useEffect(() => {
    api.team()
      .then((d) => {
        const items = d.items || d;
        if (Array.isArray(items) && items.length > 0) {
          // Merge with any custom API team members
          setMembers(items);
        }
      })
      .catch(() => {
        // Fallback to static verified members
        setMembers(STATIC_TEAM_MEMBERS);
      });
  }, []);

  const shown = useMemo(() => {
    return (members || []).filter((item) => {
      if (category === 'ALL') return true;
      return (item.category || '').toUpperCase() === category;
    });
  }, [members, category]);

  return (
    <Shell page="team" showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark}>
      <section className="route-hero">
        <p className="eyebrow"><span className="dot" /> SUN ENTREPRENEURSHIP CLUB</p>
        <h1>
          Meet the SUN<br />
          <span style={{ color: 'var(--vermilion)' }}>Entrepreneurship Club team.</span>
        </h1>
        <p>A student-led team working to create opportunities for entrepreneurship, innovation and practical learning on campus.</p>
      </section>

      <div className="filter-row">
        {TEAM_CATEGORIES.map((item) => (
          <button
            key={item.id}
            className={category === item.id ? 'selected' : ''}
            onClick={() => setCategory(item.id)}
            data-cursor
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="team-grid">
        {shown.map((member, idx) => {
          const initials = member.initials || (member.name ? member.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase() : 'SB');
          const role = member.role || 'Team Member';
          const desc = member.description || member.bio || '';
          const yr = member.year && member.year !== 'N/A' ? member.year : '';
          const dept = member.department && member.department !== 'N/A' ? member.department : (member.branch && member.branch !== 'N/A' ? member.branch : '');

          return (
            <article className="team-item" key={member._id || `${member.name}-${idx}`} style={{ animationDelay: `${(idx % 12) * 40}ms` }}>
              <div className="team-card-top">
                {member.photoUrl ? (
                  <img src={photo(member.photoUrl)} alt={member.name} className="team-avatar" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="team-avatar">
                    {initials}
                  </div>
                )}
                <div className="team-info-head">
                  <span className="team-role">{role}</span>
                  <h2 className="team-name">{member.name}</h2>
                </div>
              </div>

              {desc && <p className="team-desc">{desc}</p>}

              {(yr || dept) && (
                <div className="team-meta">
                  {yr && <span className="tag">{yr}</span>}
                  {yr && dept && <span className="sep">·</span>}
                  {dept && <span className="tag">{dept}</span>}
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Team CTA Section */}
      <section className="team-cta-box" data-rv="fade">
        <div className="team-cta-content">
          <p className="eyebrow"><span className="dot" /> OPEN CALL · VOLUNTEERS &amp; LEADS</p>
          <h3>Want your name on this wall next?</h3>
          <p>Join as a volunteer this semester, grow into a team lead.</p>
        </div>
        <button
          className="solid-cta gold"
          onClick={() => go('register')}
          data-cursor
        >
          Apply as founder <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M3 11 11 3M5 3h6v6" stroke="#05070a" strokeWidth="1.3" /></svg>
        </button>
      </section>
    </Shell>
  );
}

/* ========================================================= Admin Page */
export function Admin({ showAdminLink, isDark, setIsDark }) {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('registrations');
  const [data, setData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [eventForm, setEventForm] = useState({ title: '', description: '', date: '', time: '', venue: '', status: 'Upcoming', capacity: '' });
  const [memberForm, setMemberForm] = useState({ name: '', role: '', category: '', year: '', branch: '', bio: '' });
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' });

  const reload = async (active = tab) => {
    setData(null);
    setError('');
    try {
      const loaders = {
        registrations: api.registrations,
        events: api.eventsAll,
        team: api.teamAll,
        admins: api.admins,
        audit: api.audit,
      };
      const result = await loaders[active]();
      setData(result.items || result);
    } catch (e) {
      setError(e.message);
      setData([]);
    }
  };

  useEffect(() => {
    if (getToken()) {
      api.me()
        .then(setUser)
        .catch(() => clearToken());
    }
  }, []);

  useEffect(() => {
    if (user) reload();
  }, [tab, user]);

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const result = await api.login({ email: form.get('email'), password: form.get('password') });
      setToken(result.token);
      setUser(result.user || (await api.me()));
    } catch (e) {
      setError(e.message);
    }
  }

  const action = async (work) => {
    try {
      await work();
      setMessage('Saved.');
      reload();
    } catch (e) {
      setError(e.message);
    }
  };

  if (!user) {
    return (
      <Shell page="admin" showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark}>
        <section className="route-hero">
          <p className="eyebrow"><span className="dot" /> SEBC Operations</p>
          <h1>Admin access.</h1>
          <p>Sign in with your verified SEBC team credentials.</p>
        </section>
        <form className="login-form" onSubmit={login}>
          <Input label="Email" name="email" type="email" required />
          <Input label="Password" name="password" type="password" required />
          <Notice message={error} error />
          <button className="solid-cta" data-cursor>Sign in</button>
        </form>
        <PasswordTools setMessage={setMessage} setError={setError} />
      </Shell>
    );
  }

  return (
    <Shell
      page="admin"
      showAdminLink={showAdminLink}
      isDark={isDark}
      setIsDark={setIsDark}
      onLogout={() => {
        clearToken();
        setUser(null);
        go('home');
      }}
    >
      <section className="admin-head">
        <p className="eyebrow"><span className="dot" /> SEBC Operations</p>
        <h1>Welcome, {user.name || user.email}.</h1>
      </section>

      <div className="admin-tabs">
        {['registrations', 'events', 'team', 'admins', 'audit'].map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={tab === item ? 'selected' : ''}
            data-cursor
          >
            {item}
          </button>
        ))}
      </div>

      <Notice message={error || message} error={!!error} />

      {!data ? (
        <Loading />
      ) : (
        <AdminPanel
          tab={tab}
          data={data}
          action={action}
          eventForm={eventForm}
          setEventForm={setEventForm}
          memberForm={memberForm}
          setMemberForm={setMemberForm}
          adminForm={adminForm}
          setAdminForm={setAdminForm}
        />
      )}
    </Shell>
  );
}

function PasswordTools({ setMessage, setError }) {
  const [mode, setMode] = useState('forgot');
  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      if (mode === 'forgot') {
        await api.forgot({ email: form.get('email') });
        setMessage('A reset code has been sent to your email.');
      } else {
        await api.reset({ email: form.get('email'), code: form.get('code'), newPassword: form.get('password') });
        setMessage('Password updated successfully. You can now sign in.');
      }
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <form className="password-tools" onSubmit={submit}>
      <button
        type="button"
        onClick={() => setMode(mode === 'forgot' ? 'reset' : 'forgot')}
        className="line-cta"
        data-cursor
      >
        {mode === 'forgot' ? 'Have a reset code?' : 'Request a reset code'}
      </button>
      <Input label="Email" name="email" type="email" required />
      {mode === 'reset' && (
        <>
          <Input label="Reset code" name="code" required />
          <Input label="New password" name="password" type="password" required />
        </>
      )}
      <button className="solid-cta" data-cursor>
        {mode === 'forgot' ? 'Send reset code' : 'Set new password'}
      </button>
    </form>
  );
}

function AdminPanel({ tab, data, action, eventForm, setEventForm, memberForm, setMemberForm, adminForm, setAdminForm }) {
  if (tab === 'registrations') {
    return (
      <section className="admin-list">
        {data.map((item) => (
          <article key={item._id}>
            <div>
              <strong>{item.fullName}</strong>
              <span>{item.ideaTitle} · {item.email}</span>
              <small>Status: {item.status || 'Pending'}</small>
            </div>
            <div className="row-actions">
              <button onClick={() => action(() => api.accept(item._id))} data-cursor>Accept</button>
              <button onClick={() => action(() => api.resend(item._id))} data-cursor>Resend pass</button>
              <button onClick={() => action(() => api.updateRegistration(item._id, { status: 'Rejected' }))} data-cursor>Reject</button>
              <button onClick={() => action(() => api.deleteRegistration(item._id))} data-cursor>Delete</button>
            </div>
          </article>
        ))}
      </section>
    );
  }

  if (tab === 'events') {
    return (
      <>
        <CrudForm
          title="Create new event"
          data={eventForm}
          setData={setEventForm}
          fields={['title', 'description', 'date', 'time', 'venue', 'status', 'capacity']}
          onSubmit={() => action(() => api.createEvent({ ...eventForm, capacity: Number(eventForm.capacity) || null }))}
        />
        <List
          data={data}
          render={(item) => (
            <>
              <div>
                <strong>{item.title}</strong>
                <span>{item.status} · {item.venue}</span>
              </div>
              <div className="row-actions">
                <button
                  onClick={() => action(() => api.updateEvent(item._id, { ...item, status: item.status === 'Completed' ? 'Upcoming' : 'Completed' }))}
                  data-cursor
                >
                  Toggle status
                </button>
                <button onClick={() => action(() => api.deleteEvent(item._id))} data-cursor>Delete</button>
              </div>
            </>
          )}
        />
      </>
    );
  }

  if (tab === 'team') {
    return (
      <>
        <CrudForm
          title="Add team member"
          data={memberForm}
          setData={setMemberForm}
          fields={['name', 'role', 'category', 'year', 'branch', 'bio']}
          onSubmit={() => action(() => api.createMember(memberForm))}
        />
        <List
          data={data}
          render={(item) => (
            <>
              <div>
                <strong>{item.name}</strong>
                <span>{item.role} · {item.category}</span>
              </div>
              <div className="row-actions">
                <button onClick={() => action(() => api.deleteMember(item._id))} data-cursor>Delete</button>
              </div>
            </>
          )}
        />
      </>
    );
  }

  if (tab === 'admins') {
    return (
      <>
        <CrudForm
          title="Create sub-admin"
          data={adminForm}
          setData={setAdminForm}
          fields={['name', 'email', 'password']}
          onSubmit={() => action(() => api.createAdmin(adminForm))}
        />
        <List
          data={data}
          render={(item) => (
            <>
              <div>
                <strong>{item.name || item.email}</strong>
                <span>{item.email}</span>
              </div>
              <div className="row-actions">
                <button onClick={() => action(() => api.deleteAdmin(item._id))} data-cursor>Delete</button>
              </div>
            </>
          )}
        />
      </>
    );
  }

  return (
    <List
      data={data}
      render={(item) => (
        <div>
          <strong>{item.action}</strong>
          <span>{item.actor} · {item.entity}</span>
          <small>{item.createdAt && new Date(item.createdAt).toLocaleString()}</small>
        </div>
      )}
    />
  );
}

function List({ data, render }) {
  return (
    <section className="admin-list">
      {data.map((item) => (
        <article key={item._id}>{render(item)}</article>
      ))}
    </section>
  );
}

function CrudForm({ title, data, setData, fields, onSubmit }) {
  return (
    <form
      className="crud-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2>{title}</h2>
      {fields.map((field) => (
        <label key={field}>
          {field}
          <input
            type={field === 'password' ? 'password' : field === 'date' ? 'date' : field === 'capacity' ? 'number' : 'text'}
            value={data[field] || ''}
            onChange={(event) => setData({ ...data, [field]: event.target.value })}
            required={['title', 'name', 'email'].includes(field)}
          />
        </label>
      ))}
      <button className="solid-cta" data-cursor>Add</button>
    </form>
  );
}

function Input({ label, ...props }) {
  return <label>{label}<input {...props} /></label>;
}
function Select({ label, options, ...props }) {
  return (
    <label>
      {label}
      <select {...props}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
function Text({ label, ...props }) {
  return <label className="full-field">{label}<textarea rows="4" {...props} /></label>;
}

/* ========================================================= Root App Component */
export default function App() {
  const [page, setPage] = useState(route);
  const [isDark, setIsDark] = useState(true);
  const [showAdminLink, setShowAdminLink] = useState(false);
  const [modalData, setModalData] = useState({ isOpen: false, title: '', content: null });

  const closeModal = () => setModalData((m) => ({ ...m, isOpen: false }));

  // Admin auth check
  useEffect(() => {
    let alive = true;
    const check = async () => {
      if (!getToken()) {
        if (alive) setShowAdminLink(false);
        return;
      }
      try {
        await api.me();
        if (alive) setShowAdminLink(true);
      } catch {
        clearToken();
        if (alive) setShowAdminLink(false);
      }
    };
    check();
    window.addEventListener('sebc-admin-change', check);
    window.addEventListener('storage', check);
    return () => {
      alive = false;
      window.removeEventListener('sebc-admin-change', check);
      window.removeEventListener('storage', check);
    };
  }, []);

  // Theme synchronization
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Routing
  useEffect(() => {
    if (location.pathname === '/' && !location.hash) {
      history.replaceState(null, '', '/home');
    }
    const update = () => {
      const r = route();
      setPage(r);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('popstate', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('popstate', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  // Scroll reveals
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('rv-in');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    const targets = document.querySelectorAll('[data-rv], .mask-line, .word-mask');
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [page]);

  // Custom Cursor
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const cursor = document.getElementById('cursor');
    if (!cursor) return;

    let targetX = -100, targetY = -100;
    let currX = -100, currY = -100;
    let animId;

    const onMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      const target = e.target;
      const isInteractive = target && (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[data-cursor]') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('.card') ||
        target.closest('.event-item') ||
        target.closest('.team-item')
      );
      if (isInteractive) cursor.classList.add('act');
      else cursor.classList.remove('act');
    };

    const render = () => {
      currX += (targetX - currX) * 0.25;
      currY += (targetY - currY) * 0.25;
      cursor.style.transform = `translate3d(${currX}px, ${currY}px, 0)`;
      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove);
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Modal Handlers
  const openRsvpModal = (title, time, venue, eventId = null) => {
    const showDone = (heading, sub) => {
      setModalData({
        isOpen: true,
        title: 'RSVP Confirmed',
        content: (
          <div style={{ textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="modal-icon-badge success">
              <i className="fa-solid fa-check" />
            </div>
            <p style={{ fontFamily: 'Wordmark, serif', fontSize: '20px', color: 'var(--bone)', margin: 0 }}>{heading}</p>
            <p style={{ fontSize: '13px', color: 'var(--bone-dim)', lineHeight: '1.6', margin: 0 }}>{sub}</p>
            <button className="solid-cta" onClick={closeModal} style={{ width: '100%' }} data-cursor>Done</button>
          </div>
        ),
      });
    };

    const submitRsvp = async (name, email) => {
      if (!eventId) {
        showDone("You're on the list.", 'Watch your inbox for venue and reporting details.');
        return;
      }
      try {
        const d = await api.rsvp(eventId, { name, email });
        showDone(
          "You're on the list.",
          d.seatsLeft === null || d.seatsLeft === undefined
            ? 'Watch your inbox for venue and reporting details.'
            : d.seatsLeft === 0
              ? 'That was the last seat — see you there!'
              : `${d.seatsLeft} seat${d.seatsLeft === 1 ? '' : 's'} still open — see you there!`
        );
      } catch (err) {
        setModalData({
          isOpen: true,
          title: 'RSVP Note',
          content: (
            <div style={{ textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontFamily: 'Wordmark, serif', fontSize: '18px', color: '#ff9d99', margin: 0 }}>{err.message}</p>
              <button className="solid-cta" onClick={closeModal} style={{ width: '100%' }} data-cursor>OK</button>
            </div>
          ),
        });
      }
    };

    setModalData({
      isOpen: true,
      title: 'Confirm Event RSVP',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="modal-card-preview">
            <strong style={{ fontFamily: 'Wordmark, serif', fontSize: '18px', color: 'var(--bone)' }}>{title}</strong>
            <span style={{ fontSize: '12px', color: 'var(--gold)' }}>{time}</span>
            <small style={{ color: 'var(--muted)' }}>{venue}</small>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              submitRsvp(String(fd.get('name') || '').trim(), String(fd.get('email') || '').trim());
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <Input name="name" type="text" required placeholder="Your Full Name" label="Full Name" />
            <Input name="email" type="email" required placeholder="Sandip Email Address" label="Sandip Email" />
            <button type="submit" className="solid-cta gold" style={{ width: '100%', marginTop: '6px' }} data-cursor>
              Confirm Spot
            </button>
          </form>
        </div>
      ),
    });
  };

  const openReceiptModal = ({ name, title }) => {
    const first = String(name || '').trim().split(' ')[0];
    setModalData({
      isOpen: true,
      title: 'Application received',
      content: (
        <div style={{ textAlign: 'center', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="modal-icon-badge gold">
            <i className="fa-solid fa-inbox" />
          </div>
          <p style={{ fontFamily: 'Wordmark, serif', fontSize: '20px', color: 'var(--bone)', margin: 0 }}>
            Thanks{first ? `, ${first}` : ''} — we got it.
          </p>
          <p style={{ fontSize: '13px', color: 'var(--bone-dim)', lineHeight: '1.6', margin: 0 }}>
            “{title}” has been registered. You will receive updates about Round 1 schedule and details via email and WhatsApp.
          </p>
          <button className="solid-cta gold" onClick={closeModal} style={{ width: '100%' }} data-cursor>
            Done
          </button>
        </div>
      ),
    });
  };

  if (page === 'arcade' || page === 'game') {
    return (
      <Arcade showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark} />
    );
  }

  if (page === 'events') {
    return (
      <>
        <Events openRsvpModal={openRsvpModal} showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark} />
        <Modal isOpen={modalData.isOpen} onClose={closeModal} title={modalData.title}>
          {modalData.content}
        </Modal>
      </>
    );
  }

  if (page === 'register') {
    return (
      <>
        <Register onApplicationReceived={openReceiptModal} showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark} />
        <Modal isOpen={modalData.isOpen} onClose={closeModal} title={modalData.title}>
          {modalData.content}
        </Modal>
      </>
    );
  }

  if (page === 'team') {
    return (
      <>
        <Team showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark} />
        <Modal isOpen={modalData.isOpen} onClose={closeModal} title={modalData.title}>
          {modalData.content}
        </Modal>
      </>
    );
  }

  if (page === 'admin') {
    return (
      <>
        <Admin showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark} />
        <Modal isOpen={modalData.isOpen} onClose={closeModal} title={modalData.title}>
          {modalData.content}
        </Modal>
      </>
    );
  }

  if (page === 'home' || !page) {
    return (
      <Home showAdminLink={showAdminLink} isDark={isDark} setIsDark={setIsDark} />
    );
  }

  return null;
}
