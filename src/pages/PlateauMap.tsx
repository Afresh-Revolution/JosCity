import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { agentApi as api } from '../api/agent';
import { directionsUrl, usePlateauMap } from '../state/usePlateauMap';
import GooglePlateauMap from '../components/GooglePlateauMap';
import { getProfileUsername, getUserAccountType } from '../utils/userUtils';
import NewsFeedHeader from './NewsFeed/NewsFeedHeader';
import NewsFeedSidebar from './NewsFeed/NewsFeedSidebar';
import './PlateauMap.css';

export default function PlateauMap({ mode = 'personal' }: { mode?: 'personal' | 'business' | 'agent' }) {
  const navigate = useNavigate();
  const accountMode = mode === 'personal' && getUserAccountType() === 'business' ? 'business' : mode;
  const m = usePlateauMap(accountMode);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(false);
  const lastSent = useRef(0);

  function locate() {
    if (!navigator.geolocation) { m.setError('Your browser does not support location.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => { m.locate({ lat: p.coords.latitude, lng: p.coords.longitude }); setLocating(false); },
      () => { setLocating(false); m.setError('Location unavailable. Enable location in your browser settings, or browse without it.'); },
      { timeout: 15000, maximumAge: 30000 }
    );
  }

  useEffect(() => {
    if (accountMode !== 'agent' || !m.sharing || !m.accepting) return;
    let watcher: number | undefined, active = true, sending = false;
    const stop = () => { if (watcher !== undefined) navigator.geolocation?.clearWatch(watcher); watcher = undefined; };
    const start = () => {
      if (document.hidden || watcher !== undefined) return;
      if (!navigator.geolocation) { m.setSharing(false); m.setError('Location is unavailable in this browser.'); return; }
      watcher = navigator.geolocation.watchPosition(p => {
        if (!active || document.hidden || sending || Date.now() - lastSent.current < 30000) return;
        lastSent.current = Date.now(); sending = true;
        void api.liveLocation({ lat: p.coords.latitude, lng: p.coords.longitude }).catch(e => { m.setError(e.message); m.setSharing(false); }).finally(() => { sending = false; });
      }, () => { m.setSharing(false); m.setError('Location sharing stopped. Check browser permissions.'); }, { timeout: 15000, maximumAge: 30000 });
    };
    const visibility = () => document.hidden ? stop() : start();
    start();
    document.addEventListener('visibilitychange', visibility);
    return () => { active = false; stop(); document.removeEventListener('visibilitychange', visibility); };
  }, [accountMode, m.sharing, m.accepting]);

  return (
    <div className="news-page plateau-map-page">
      <NewsFeedHeader
        isLeftSidebarOpen={isLeftSidebarOpen}
        onToggleLeftSidebar={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
        unreadNotificationsCount={0}
        unreadMessagesCount={0}
        showRightSidebarToggle={false}
        onNotificationClick={() => navigate('/newsfeed')}
        onMessageClick={() => navigate('/newsfeed')}
        onAddFriendClick={() => navigate('/people')}
        onCreatePost={() => navigate('/newsfeed')}
        onCreateStory={() => navigate('/newsfeed')}
        onProfileClick={() => navigate(`/profile/${encodeURIComponent(getProfileUsername())}`)}
      />
      {isLeftSidebarOpen && <div className="newsfeed-overlay" onClick={() => setIsLeftSidebarOpen(false)} />}
      <div className="newsfeed-container newsfeed-container--no-aside">
        <NewsFeedSidebar isOpen={isLeftSidebarOpen} onClose={() => setIsLeftSidebarOpen(false)} />
        <main className="newsfeed-main">
          <div className="plateau-map-intro">
            <h1>Plateau map</h1>
            <p>Find places, businesses, and your delivery locations across Plateau State.</p>
          </div>
          <div className="plateau-layers" role="tablist" aria-label="Map layers">
            {['Places', 'Businesses', 'Deliveries'].map(layer => (
              <button key={layer} type="button" aria-pressed={m.layer === layer} onClick={() => m.setLayer(layer)}>{layer}</button>
            ))}
          </div>
          {m.layer !== 'Deliveries' && (
            <label className="plateau-search">
              <Search size={18} aria-hidden="true" />
              <input value={m.query} onChange={e => m.setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') m.searchNow(); }} placeholder="Search places in Plateau" aria-label="Search Plateau places" />
            </label>
          )}
          {m.error && <p role="alert">{m.error}</p>}
          {m.notice && <p role="status">{m.notice}</p>}
          <div className="plateau-columns">
            <section className="plateau-canvas" aria-label="Map">
              <GooglePlateauMap apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''} pins={m.pins} point={m.point} me={m.me} selection={m.selection} route={m.route} bounds={m.config.bounds} onSelect={m.select} />
              <button type="button" className="plateau-locate" disabled={locating} onClick={locate}>{locating ? 'Locating…' : 'My location'}</button>
            </section>
            <aside>
              <section className="plateau-panel">
                <h2>{m.layer}</h2>
                <p>Tap the map to select a position inside the Plateau service area. You can browse without sharing your location.</p>
                <div className="plateau-actions">
                  <button type="button" disabled={m.loading || m.busy} onClick={m.refresh}>Refresh</button>
                  {accountMode === 'agent' && <Link to="/agents">Agent dashboard</Link>}
                  {accountMode === 'business' && <Link to="/newsfeed">Business overview</Link>}
                </div>
                {m.destination && m.layer === 'Places' ? (
                  <div className="plateau-route">
                    <h3>{m.destination.label}</h3>
                    {m.destination.address ? <p>{m.destination.address}</p> : null}
                    {m.routing ? <p>Getting the driving route from your location…</p> : null}
                    {!m.routing && m.route ? (
                      <p>{m.route.durationText || 'Route ready'}{m.route.distanceText ? ` · ${m.route.distanceText}` : ''} from your location.</p>
                    ) : null}
                    {!m.me ? <p>Turn on location to draw the route from where you are.</p> : null}
                  </div>
                ) : null}
                {m.selection && <p>Selected: {m.selection.lat.toFixed(6)}, {m.selection.lng.toFixed(6)}</p>}
                {m.loading ? <p role="status">Loading locations…</p> : !m.pins.length && !m.error ? <p>{m.layer === 'Places' ? 'Enter at least two characters to search places.' : 'No map pins found.'}</p> : null}
                {m.layer === 'Places' && <p>Place results powered by Google Maps.</p>}
              </section>
              {m.pins.map(pin => (
                <section key={pin.id} className="plateau-panel">
                  <h2>{pin.label}</h2>
                  {pin.address && <p>{pin.address}</p>}
                  {pin.attributions?.map((a, i) => <p key={i}>{a.provider}</p>)}
                  <div className="plateau-actions">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pin.address || `${pin.lat},${pin.lng}`)}`} target="_blank" rel="noreferrer">Show on map</a>
                    <a href={directionsUrl(pin, m.me)} target="_blank" rel="noreferrer">Open in Google Maps</a>
                    <button type="button" onClick={() => { m.select(pin); if (pin.address) setAddress(pin.address); }}>Draw route</button>
                  </div>
                </section>
              ))}
              {m.layer === 'Deliveries' && (
                <section className="plateau-panel">
                  <h2>Deliveries</h2>
                  <p>Only your active jobs appear here. Customer addresses are private.</p>
                  <label>Address for selected position<input value={address} onChange={e => setAddress(e.target.value)} /></label>
                  {m.jobs.map(job => (
                    <div key={job.job_id}>
                      <h2>Job #{job.job_id}</h2>
                      <p>Pickup: {job.pickup_address || 'Not set'}</p>
                      <p>Delivery: {job.destination_address || 'Not set'}</p>
                      <button type="button" disabled={!m.selection || !address.trim() || m.busy} onClick={() => void m.run(() => api.jobLocations(job.job_id, { [accountMode === 'agent' ? 'pickup' : 'destination']: { ...m.selection, address } }), 'Job location saved.')}>
                        {accountMode === 'agent' ? 'Set pickup to selected position' : 'Set delivery to selected position'}
                      </button>
                    </div>
                  ))}
                </section>
              )}
              {accountMode === 'business' && (
                <section className="plateau-panel">
                  <h2>Add to map</h2>
                  <p>{m.config.listing_price ? `Publish a named pin for NGN ${m.config.listing_price.toLocaleString('en-NG')} from your wallet.` : 'Map listing payments have not been enabled yet.'}</p>
                  <button type="button" className="primary" disabled={!m.selection || m.busy} onClick={() => void m.run(() => api.createPin(m.selection!), 'Position saved. Name and pay below to publish.')}>Save selected position</button>
                  <label>Business location name<input value={label} onChange={e => setLabel(e.target.value)} /></label>
                  {m.mine.map(pin => (
                    <div key={pin.id}>
                      <p>{pin.label || 'Unnamed location'} · {pin.payment_status}</p>
                      {pin.payment_status !== 'paid' && (
                        <button type="button" disabled={!m.config.listing_price || !label.trim() || m.busy} onClick={() => { if (window.confirm(`Charge NGN ${m.config.listing_price} from your wallet to publish “${label.trim()}”?`)) void m.run(() => api.payPin(pin.id, label, m.config.listing_price!), 'Your business pin is published.'); }}>
                          Pay NGN {m.config.listing_price || '—'} and publish
                        </button>
                      )}
                    </div>
                  ))}
                </section>
              )}
              {accountMode === 'agent' && (
                <section className="plateau-panel">
                  <h2>Agent location sharing</h2>
                  <p>Share your position for nearby request matching while this map is open and visible. Stops when you leave or switch it off.</p>
                  <label><input type="checkbox" checked={m.sharing && m.accepting} disabled={!m.accepting} onChange={e => m.setSharing(e.target.checked)} /> Share my location</label>
                  {!m.accepting && <p>Enable accepting requests in your agent profile first.</p>}
                </section>
              )}
              <section className="plateau-panel">
                <h2>How this map works</h2>
                <ol>
                  <li>Search or browse pins without turning on location.</li>
                  <li>Use My location only if you want the map centred on you.</li>
                  <li>Business listings appear after they are paid and published.</li>
                  <li>Delivery pins are limited to jobs you are part of.</li>
                </ol>
              </section>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
