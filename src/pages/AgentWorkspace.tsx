import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AgentFeeBenefit from '../components/agents/AgentFeeBenefit';
import AgentJobCard from '../components/agents/AgentJobCard';
import AgentRatingDialog from '../components/agents/AgentRatingDialog';
import AgentStars from '../components/agents/AgentStars';
import WalletSheet from '../components/WalletSheet';
import { Editor, useAgentWorkspace } from '../state/useAgentWorkspace';
import { useQuoteFee } from '../state/useQuoteFee';
import { formatFeePercent } from '../utils/agentFee';
import { formatMoneyInput, parseMoneyInput } from '../utils/moneyInput';
import { isAuthenticated } from '../utils/userUtils';
import { walletApi, WalletSnapshot } from '../services/walletApi';
import type { Job } from '../api/agent';
import './AgentPreview.css';

const money = (value: number) => `NGN ${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;

export function EditForm({ editor, error, busy, close, save }: { editor: Editor; error: string; busy: boolean; close: () => void; save: (values: Record<string,string>, images: File[]) => void }) {
  const [values, setValues] = useState<Record<string,string>>(() => Object.fromEntries(editor.fields.map(f => [f.key, f.value || (f.required ? f.options?.[0]?.value : '') || ''])));
  const [images, setImages] = useState<File[]>([]);
  const quoteFee = useQuoteFee(editor.showFee ? values.productPrice || '' : '');
  return <div className="agent-dialog-backdrop"><form className="agent-card agent-dialog" role="dialog" aria-modal="true" aria-label={editor.title} onSubmit={e => {
    e.preventDefault();
    const payload = { ...values };
    for (const f of editor.fields) {
      if (f.type !== 'money') continue;
      const amount = parseMoneyInput(values[f.key]);
      payload[f.key] = amount == null || Number.isNaN(amount) ? '' : String(amount);
    }
    save(payload, images);
  }}>
    <h2>{editor.title}</h2>
    {editor.copy ? <p>{editor.copy}</p> : null}
    {editor.fields.map(f => (
      <div key={f.key}>
        <label>{f.label}{f.required ? ' *' : ''}{f.options ? <select required={f.required} value={values[f.key]} disabled={busy} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}>{!f.required && <option value="">None</option>}{f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select> : f.type === 'multiline' ? <textarea required={f.required} value={values[f.key]} disabled={busy} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))} /> : <input autoComplete={f.type === 'password' ? 'off' : undefined} required={f.required} type={f.type === 'money' ? 'text' : f.type || 'text'} inputMode={f.type === 'money' || f.type === 'number' ? 'decimal' : undefined} placeholder={f.type === 'money' ? '1,234,500' : undefined} step="any" value={values[f.key]} disabled={busy} onChange={e => setValues(v => ({ ...v, [f.key]: f.type === 'money' ? formatMoneyInput(e.target.value) : e.target.value }))} />}</label>
        {editor.showFee && f.key === 'productPrice' ? (
          <div className="agent-fee-preview">
            <label>Agent fee (%)
              <input readOnly value={quoteFee.fee ? formatFeePercent(quoteFee.fee.feePercent) : quoteFee.loading ? '…' : ''} />
            </label>
            <AgentFeeBenefit feeAmount={quoteFee.fee?.feeAmount} totalPrice={quoteFee.fee?.totalPrice} formatAmount={money} />
          </div>
        ) : null}
      </div>
    ))}
    {!!editor.imageLimit && <label>Photos (up to {editor.imageLimit})<input type="file" accept="image/*" multiple={editor.imageLimit > 1} disabled={busy} onChange={e => setImages(Array.from(e.target.files || []).slice(0, editor.imageLimit))} /></label>}
    {error && <p role="alert">{error}</p>}<button className="primary" disabled={busy}>{busy ? 'Saving…' : 'Confirm'}</button><button type="button" disabled={busy} onClick={close}>Cancel</button>
  </form></div>;
}

function AuthenticatedWorkspace() {
  const location = useLocation(), params = new URLSearchParams(location.search);
  const role = location.pathname.startsWith('/agent-services') ? 'requester' : 'agent';
  const page = location.pathname.split('/').pop() || '';
  const tab = page === 'request' ? 'requests' : ['profile','settings'].includes(page) ? 'profile' : ['wallet','directory'].includes(page) ? page : 'dashboard';
  const w = useAgentWorkspace(role, tab, params.get('service') === 'deliver' ? 'delivery' : 'buy', params.get('agent') || '');
  const [walletOpen, setWalletOpen] = useState(false), [wallet, setWallet] = useState<WalletSnapshot | null>(null);
  const [rateJob, setRateJob] = useState<Job | null>(null);
  const openWallet = () => void w.run(async () => { setWallet(await walletApi.getWallet()); setWalletOpen(true); }, '', false);
  return <div className="agent-preview"><header className="agent-header"><Link to="/newsfeed">JOSCITY</Link>{role === 'agent' && <Link to="/agents/map">Map</Link>}<button onClick={openWallet}>Wallet / top up</button></header><main style={{ maxWidth: 1000, margin: 'auto', padding: '24px 18px 120px' }}>
    <h1>{role === 'agent' ? 'Agent workspace' : 'Shopping & delivery'}</h1><nav className="agent-actions" aria-label="Workspace">{w.tabs.map(t => <button key={t} className={w.tab === t ? 'primary' : ''} aria-pressed={w.tab === t} onClick={() => w.setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</nav>
    <div className="agent-actions">{role === 'requester' && <button className="primary" onClick={() => w.openRequest()}>Create request</button>}{role === 'agent' && w.tab === 'catalogue' && <button onClick={() => w.catalogueEditor()}>Add catalogue item</button>}</div>
    {['directory','requests'].includes(w.tab) && <div className="agent-actions">{(['buy','delivery'] as const).map(s => <button key={s} aria-pressed={w.service === s} className={w.service === s ? 'primary' : ''} onClick={() => w.setService(s)}>{s === 'buy' ? 'Help me buy' : 'Help me deliver'}</button>)}</div>}
    {(w.tab === 'directory' || (role === 'agent' && w.tab === 'catalogue')) && <label>Search<input value={w.search} onChange={e => w.setSearch(e.target.value)} /></label>}
    {w.error && <p role="alert">{w.error}</p>}{w.notice && <p role="status">{w.notice}</p>}
    {w.tab === 'requests' && role === 'agent' ? <p>Open buy and delivery requests. Accepting one takes the job and hides it from other agents.</p> : null}
    {!w.accepting && role === 'agent' && w.tab === 'requests' ? <p>You are not accepting new requests.</p> : null}
    {w.loading ? <p role="status">Loading…</p> : !w.panels.length && !w.error ? <p>Nothing here yet.</p> : w.panels.map(p => p.job ? (
      <AgentJobCard
        key={p.key}
        job={p.job}
        role={role}
        advancing={w.busy}
        onAdvance={() => w.advanceJob(p.job!)}
        onPurchase={() => w.payVendor(p.job!)}
        onConfirm={() => w.confirmJob(p.job!)}
        onRate={() => setRateJob(p.job!)}
        extraActions={p.actions?.length ? <div className="agent-actions">{p.actions.map(a => <button key={a.label} disabled={w.busy || a.disabled} onClick={a.run}>{a.label}</button>)}</div> : null}
      />
    ) : (
      <section key={p.key} className="agent-card">
        {p.request ? (
          <div className="agent-request-summary">
            {p.images?.[0] ? <img src={p.images[0]} alt="" /> : null}
            <div>
              <p className="agent-job-card__kicker">{p.request.source_type === 'delivery' ? 'Help me deliver' : 'Help me buy'}</p>
              <h2>{p.title}</h2>
            </div>
          </div>
        ) : <h2>{p.title}</h2>}
        {p.lines.filter(Boolean).map((line,i) => <p key={i}>{line.startsWith('https://') ? <a href={line} target="_blank" rel="noreferrer">{line}</a> : line}</p>)}
        {!!p.images?.length && !p.request && <div className="agent-images">{p.images.map((src,i) => <img key={i} src={src} alt={`${p.title} ${i + 1}`} loading="lazy" />)}</div>}
        {p.reviews?.length ? (
          <div className="agent-reviews">
            <p className="agent-job-card__section">Public ratings</p>
            {p.reviews.map((review) => (
              <article key={review.review_id} className="agent-review">
                <div className="agent-review__head">
                  <strong>{review.reviewer_name || 'Customer'}</strong>
                  <AgentStars value={review.rating} />
                </div>
                {review.comment ? <p>{review.comment}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
        <div className="agent-actions">{p.actions?.map(a => <button key={a.label} className={a.label === 'Accept' ? 'primary' : ''} disabled={w.busy || a.disabled} onClick={a.run}>{a.label}</button>)}</div>
      </section>
    ))}
    {role === 'agent' && w.tab === 'requests' && w.declinedCount > 0 ? (
      <button type="button" className="agent-restore" onClick={w.restoreRejected}>
        <span>
          <strong>Restore rejected {w.declinedCount === 1 ? 'request' : 'requests'}</strong>
          <small>{w.declinedCount} hidden on this dashboard</small>
        </span>
        Restore
      </button>
    ) : null}
    {['requests','jobs','directory'].includes(w.tab) && (w.page > 1 || w.panels.length >= 20) && <div className="agent-actions"><button disabled={w.loading || w.page <= 1} onClick={() => w.setPage(p => p - 1)}>Previous</button><span>Page {w.page}</span><button disabled={w.loading || w.panels.length < 20} onClick={() => w.setPage(p => p + 1)}>Next</button></div>}
    {page === 'settings' && <Link to="/newsfeed">Account settings</Link>}
  </main>
  <WalletSheet open={walletOpen} wallet={wallet} onClose={() => { setWalletOpen(false); w.refresh(); }} onUpdated={setWallet} />
  {w.editor && <EditForm key={w.editor.title} editor={w.editor} busy={w.busy} error={w.error} close={() => w.setEditor(null)} save={(v, images) => void w.run(() => w.editor!.submit(v, images))} />}
  <AgentRatingDialog job={rateJob} onClose={() => setRateJob(null)} onDone={(message) => { setRateJob(null); w.refresh(); void message; }} />
  </div>;
}
export default function AgentWorkspace() {
  const location = useLocation();
  const role = location.pathname.startsWith('/agent-services') ? 'requester' : 'agent';
  if (!isAuthenticated()) return <div className="agent-preview"><main className="agent-card"><h1>{role === 'agent' ? 'Become an agent' : 'Shopping & delivery'}</h1><p>{role === 'agent' ? 'Sign in with your existing JosCity account to offer shopping and delivery, or create an account first.' : 'Sign in with your existing JosCity account to request shopping and delivery.'}</p><Link to="/signin">Sign in</Link>{role === 'agent' && <Link to="/registernow">Create an account</Link>}</main></div>;
  return <AuthenticatedWorkspace />;
}
