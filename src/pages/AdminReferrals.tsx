import { useEffect, useState } from 'react';
import { Gift, ChevronLeft, ChevronRight, Save, Search, X } from 'lucide-react';
import { getReferralReport, saveReferralBonus, type ReferralReport } from '../services/adminApi';
import './AdminReferrals.scss';

export default function AdminReferrals() {
  const [data, setData] = useState<ReferralReport | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const [reportFailed, setReportFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setMessage(''); setFailed(false); setReportFailed(false);
    getReferralReport(page, search).then(result => {
      if (active) { setData(result); setAmount(previous => previous || String(result.settings.bonus_naira)); }
    }).catch(error => {
      if (active) { setMessage(error instanceof Error ? error.message : 'Could not load referrals.'); setFailed(true); setReportFailed(true); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, retry, search]);

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage(''); setFailed(false);
    try {
      const result = await saveReferralBonus(Number(amount));
      setAmount(String(result.bonus_naira));
      setMessage('Referral bonus saved. New approvals will use this amount.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save bonus.'); setFailed(true);
    } finally { setBusy(false); }
  }

  return <section className="admin-referrals" aria-labelledby="admin-referrals-title" aria-busy={loading}>
    <header className="admin-referrals__header">
      <span className="admin-referrals__icon"><Gift size={24} /></span>
      <div><h2 id="admin-referrals-title">Referrals</h2><p>Track referral activity and manage rewards for your community.</p></div>
    </header>
    {message && <p className={`admin-referrals__notice${failed ? ' admin-referrals__notice--error' : ''}`} role={failed ? 'alert' : 'status'}>{message}</p>}
    {!data ? <div className="admin-referrals__empty" role="status">
      {loading ? 'Loading referrals...' : <>Referral report unavailable. <button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button></>}
    </div> : <>
      <form className="admin-referrals__settings" onSubmit={save}>
        <div><label htmlFor="referral-bonus">Referral bonus</label><p id="referral-bonus-help">Applies to future approvals. Previously approved earnings stay unchanged.</p></div>
        <div className="admin-referrals__controls">
          <div className="admin-referrals__amount"><span>NGN</span><input id="referral-bonus" aria-describedby="referral-bonus-help" type="number" min="0" max="9999999999.99" step="0.01" required disabled={busy} value={amount} onChange={event => setAmount(event.target.value)} /></div>
          <button className="admin-referrals__save" disabled={busy}><Save size={16} />{busy ? 'Saving...' : 'Save bonus'}</button>
        </div>
      </form>
      <p className="admin-referrals__help">Link visits count once per browser. Referrals count registered accounts; rewards are approved on their first post.</p>
      <form className="admin-referrals__search" role="search" onSubmit={event => {
        event.preventDefault(); setPage(1); setSearch(searchInput.trim()); setRetry(value => value + 1);
      }}>
        <label htmlFor="referral-search">Search referral accounts</label>
        <div className="admin-referrals__search-controls">
          <div className="admin-referrals__search-input">
            <Search size={18} aria-hidden="true" />
            <input id="referral-search" type="search" placeholder="Name, referral code or account ID" maxLength={200} value={searchInput} onChange={event => setSearchInput(event.target.value)} />
          </div>
          <button type="submit" disabled={busy}>Search</button>
          {(searchInput || search) && <button type="button" aria-label="Clear referral search" disabled={busy} onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}><X size={16} />Clear</button>}
        </div>
      </form>
      <div className="admin-referrals__table" tabIndex={0} role="region" aria-label="Referral accounts">
        <table><thead><tr>{['User', 'Referral code', 'Link visits', 'Total referrals', 'Approved', 'Earnings (NGN)'].map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead>
          <tbody>{!loading && !reportFailed && data.users.map(user => <tr key={user.user_id}>
            <td><strong>{user.name?.trim() || `User #${user.user_id}`}</strong><small>Account #{user.user_id}</small></td>
            <td><code>{user.referral_code}</code></td><td>{Number(user.visits).toLocaleString()}</td><td>{Number(user.referrals).toLocaleString()}</td>
            <td><span className="admin-referrals__approved">{Number(user.approved).toLocaleString()}</span></td>
            <td className="admin-referrals__earnings">{Number(user.earnings_naira).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          </tr>)}</tbody>
        </table>
        {loading ? <div className="admin-referrals__empty" role="status">Searching referral accounts...</div> : reportFailed ? <div className="admin-referrals__empty"><button type="button" onClick={() => setRetry(value => value + 1)}>Try again</button></div> : !data.users.length && <div className="admin-referrals__empty" role="status">{search ? `No accounts match "${search}". Try another name, code or account ID.` : 'No referral accounts yet.'}</div>}
      </div>
      <footer className="admin-referrals__pagination"><span>{loading ? "Loading results..." : reportFailed ? "Results unavailable" : `${data.users.length.toLocaleString()} accounts on this page${search ? ` matching "${search}"` : ""}`}</span><nav aria-label="Referral pagination">
        <button type="button" disabled={page === 1 || busy || loading || reportFailed} onClick={() => setPage(value => value - 1)}><ChevronLeft size={16} />Previous</button>
        <span>Page {page}</span><button type="button" disabled={!data.has_more || busy || loading || reportFailed} onClick={() => setPage(value => value + 1)}>Next<ChevronRight size={16} /></button>
      </nav></footer>
    </>}
  </section>;
}
