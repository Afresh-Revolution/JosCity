import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Banknote, CheckCircle2, MapPin, Package, Plus, RefreshCw, Search, Settings2, ShieldAlert, Star, Tags, Truck, Users } from 'lucide-react';
import { apiUrl } from '../api/config';
import { Editor, Field } from '../state/useAgentWorkspace';
import { EditForm } from './AgentWorkspace';
import './AgentPreview.css';
import './AdminAgents.css';
type Row = Record<string, unknown>;
async function request(path: string, method = 'GET', body?: Row) {
  const response = await fetch(apiUrl('/admin/agents' + path), { method, signal: AbortSignal.timeout(20000), headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}` }, body: body ? JSON.stringify(body) : undefined });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success !== true) throw new Error(typeof payload.error === 'string' ? payload.error : payload.message || 'Admin request failed');
  return payload.data;
}
const resources = [
  { title: 'Agents', path: '' }, { title: 'Vendor payouts', path: '/payouts/pending' }, { title: 'Disputes', path: '/disputes' },
  { title: 'General settings', path: '/settings/general' }, { title: 'Fee tiers', path: '/settings/fee-tiers' },
  { title: 'Delivery bounds', path: '/settings/delivery-bounds' }, { title: 'Star levels', path: '/settings/star-levels' }, { title: 'Categories', path: '/settings/categories' },
];
const resourceIcons = [Users, Banknote, ShieldAlert, Settings2, Banknote, MapPin, Star, Tags];
const descriptions: Record<string, string> = {
  '': 'Manage agent profiles, access and service activity.',
  '/payouts/pending': 'When Paystack cannot send a vendor payout, the job stays pending here. Transfer the money, then mark it paid so the agent dashboard updates.',
  '/disputes': 'Review complaints and resolve held service fees.',
  '/settings/general': 'Set the operating rules for shopping and delivery services.',
  '/settings/fee-tiers': 'Manage service fee limits across product price ranges.',
  '/settings/delivery-bounds': 'Set minimum and maximum delivery charges by package size.',
  '/settings/star-levels': 'Configure agent milestones and withdrawal eligibility.',
  '/settings/categories': 'Organize the categories available for agent services.',
};
function displayValue(value: unknown) {
  return typeof value === 'boolean' ? value ? 'Yes' : 'No' : value == null || value === '' ? '?' : Array.isArray(value) ? value.join(', ') : String(value);
}
const labels: Record<string,string> = { user_id: 'Agent ID', user_firstname: 'First name', user_lastname: 'Last name', agent_status: 'Status', agent_type: 'Services', agent_rating_avg: 'Rating', agent_completed_jobs_count: 'Completed jobs', job_id: 'Job', product_amount: 'Vendor amount (NGN)', agent_fee_amount: 'Fee (NGN)', vendor_bank_name: 'Bank', vendor_bank_account_number: 'Account number', vendor_bank_account_name: 'Account name', payout_pending_manual: 'Awaiting manual payment', note: 'Payout note', reason: 'Reason', status: 'Status', fault: 'Fault', min_amount: 'Minimum product price', max_amount: 'Maximum product price', max_percent: 'Maximum fee (%)', package_size: 'Package size', min_charge: 'Minimum charge', max_charge: 'Maximum charge', level: 'Level', label: 'Label', jobs_required: 'Required jobs', can_withdraw: 'Withdrawal allowed', slug: 'Category slug', name: 'Category name', is_active: 'Active', complaint_suspend_threshold: 'Complaint threshold', enforce_delivery_bounds: 'Enforce delivery bounds', business_referral_incentive_naira: 'Referral reward (NGN)', agent_bio: 'Bio', agent_transport_mode: 'Transport', agent_working_areas: 'Working areas' };
const spec: Record<string, [string,string,string?][]> = {
  '/settings/general': [['complaint_suspend_threshold','Complaint threshold','number'],['enforce_delivery_bounds','Enforce delivery bounds','bool'],['business_referral_incentive_naira','Referral reward (NGN)','number']],
  '/settings/fee-tiers': [['tierId','Tier ID (empty for new)','number'],['minAmount','Minimum price','number'],['maxAmount','Maximum price (empty for no ceiling)','number'],['maxPercent','Maximum fee (%)','number'],['sortOrder','Sort order','number'],['isActive','Active','bool']],
  '/settings/delivery-bounds': [['packageSize','Package size'],['minCharge','Minimum charge','number'],['maxCharge','Maximum charge','number']],
  '/settings/star-levels': [['level','Level','number'],['label','Label'],['jobsRequired','Required completed jobs','number'],['canWithdraw','Can withdraw','bool']],
  '/settings/categories': [['slug','Slug'],['name','Name'],['sortOrder','Sort order','number'],['isActive','Active','bool']],
};
const keys: Record<string,string> = { tierId: 'tier_id', minAmount: 'min_amount', maxAmount: 'max_amount', maxPercent: 'max_percent', sortOrder: 'sort_order', isActive: 'is_active', packageSize: 'package_size', minCharge: 'min_charge', maxCharge: 'max_charge', jobsRequired: 'jobs_required', canWithdraw: 'can_withdraw' };
export default function AdminAgents() {
  const [resource, setResource] = useState(resources[0]), [rows, setRows] = useState<Row[]>([]), [search, setSearch] = useState(''), [page,setPage] = useState(1);
  const [error,setError] = useState(''), [busy,setBusy] = useState(false), [loading,setLoading] = useState(false), [editor,setEditor] = useState<Editor|null>(null), [version,setVersion] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    const timer = setTimeout(() => { request(resource.path + (resource.path === '' ? `?search=${encodeURIComponent(search)}&page=${page}&limit=20` : '')).then(data => { if (active) setRows(Array.isArray(data) ? data : data ? [data] : []); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); }, search ? 350 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [resource,search,page,version]);
  function edit(row: Row = {}) {
    const fields: Field[] = spec[resource.path].map(([key,label,type]) => ({ key,label,value: String(row[keys[key] || key] ?? (type === 'bool' ? true : '')), type: type === 'number' ? 'number' : undefined, options: type === 'bool' ? [{ value:'true',label:'Yes' },{ value:'false',label:'No' }] : key === 'packageSize' ? ['small','medium','large','bulky'].map(value => ({ value,label:value })) : undefined, required: !['tierId','maxAmount','sortOrder'].includes(key) }));
    setEditor({ title: resource.title, fields, submit: values => { const body: Row = {}; for (const [key,,type] of spec[resource.path]) { body[key] = type === 'bool' ? values[key] === 'true' : type === 'number' ? values[key] === '' ? null : Number(values[key]) : values[key]; } return request(resource.path, resource.path.endsWith('general') ? 'PUT' : 'POST',body); } });
  }
  function confirm(title: string, path: string, fields: Field[] = [], method = 'POST') { setEditor({ title, fields, submit: values => request(path,method,values) }); }
  async function save(v: Record<string,string>) { if (!editor || lock.current) return; lock.current = true; setBusy(true); setError(''); try { await editor.submit(v,[]); setEditor(null); setVersion(n => n+1); } catch(e) { setError(e instanceof Error ? e.message : 'Save failed'); } finally { lock.current = false; setBusy(false); } }
  return <div className="agent-preview admin-agents">
    <header className="admin-agents__header">
      <div className="admin-agents__heading"><span className="admin-agents__hero-icon"><Truck size={26} /></span><div><span className="admin-agents__eyebrow">SERVICE OPERATIONS</span><h1>Agents & deliveries</h1><p>Manage your service network, payments and delivery rules.</p></div></div>
      <button disabled={loading || busy} onClick={() => setVersion(n => n + 1)}><RefreshCw size={16} className={loading ? 'admin-agents__spin' : ''} />Refresh</button>
    </header>
    <nav className="admin-agents__nav" aria-label="Agent administration">
      {resources.map((r, index) => { const Icon = resourceIcons[index]; return <button key={r.title} aria-pressed={resource.path === r.path} onClick={() => { setResource(r); setRows([]); setLoading(true); setPage(1); }}><Icon size={17} />{r.title}</button>; })}
    </nav>
    <section className="admin-agents__panel" aria-labelledby="agent-resource-title">
      <div className="admin-agents__toolbar"><div><h2 id="agent-resource-title">{resource.title}</h2><p>{descriptions[resource.path]}</p></div>
        {spec[resource.path] && <button className="primary" disabled={busy || loading} onClick={() => edit(resource.path.endsWith('general') ? rows[0] : {})}><Plus size={16} />{resource.path.endsWith('general') ? 'Edit settings' : 'Add record'}</button>}
      </div>
      {resource.path === '' && <div className="admin-agents__filters"><label className="admin-agents__search"><Search size={18} /><span className="admin-agents__sr-only">Search agents</span><input placeholder="Search agents?" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></label><span className="admin-agents__count">{loading ? 'Loading records?' : `${rows.length} agent${rows.length === 1 ? '' : 's'} on this page`}</span></div>}
      {error && <div className="admin-agents__error" role="alert"><AlertCircle size={18} /><span>{error}</span></div>}
      {loading ? <div className="admin-agents__empty" role="status"><RefreshCw size={28} className="admin-agents__spin" /><h3>Loading {resource.title.toLowerCase()}?</h3><p>Your records will appear here shortly.</p></div> : rows.length === 0 ? !error && <div className="admin-agents__empty"><Package size={32} /><h3>{search && resource.path === '' ? 'No matching agents' : 'No records yet'}</h3><p>{search && resource.path === '' ? 'Try a different name or search term.' : 'Records will appear here when available.'}</p></div> : <div className="admin-agents__records">{rows.map((row,index) => {
        const title = resource.path === '' ? [row.user_firstname, row.user_lastname].filter(Boolean).join(' ') || `Agent ${row.user_id}` : String(row.name || row.label || row.package_size || (row.job_id ? `Job #${row.job_id}` : `${resource.title} ${index + 1}`));
        const status = row.agent_status || row.status;
        return <section className="admin-agents__record" key={String(row.user_id || row.job_id || row.tier_id || index)}>
          <header className="admin-agents__record-heading"><div><span className="admin-agents__record-icon">{resource.path === '' ? <Users size={20} /> : <Package size={20} />}</span><h3>{title}</h3></div>{status != null && <span className="admin-agents__status">{displayValue(status)}</span>}</header>
          <dl>{Object.entries(row).filter(([key]) => labels[key] && !['user_firstname', 'user_lastname', 'agent_status', 'status'].includes(key)).map(([key,value]) => <div key={key}><dt>{labels[key]}</dt><dd>{key === 'can_withdraw' && value === true ? <CheckCircle2 size={15} /> : null}{displayValue(value)}</dd></div>)}</dl>
          <div className="admin-agents__actions">
      {resource.path === '' && <><button disabled={busy} onClick={() => { setBusy(true); void request('/'+row.user_id).then(data => setRows([data])).catch(e => setError(e.message)).finally(() => setBusy(false)); }}>Details</button>{['suspend','reinstate','block'].map(action => <button className={action === 'reinstate' ? 'positive' : 'danger'} disabled={busy} key={action} onClick={() => confirm(`${action} agent ${row.user_id}?`, `/${row.user_id}/${action}`, action === 'reinstate' ? [] : [{ key:'reason',label:'Reason',required:true }])}>{action[0].toUpperCase() + action.slice(1)}</button>)}<button disabled={busy} onClick={() => confirm('Remove this agent role? The underlying user account will remain.', '/'+row.user_id, [], 'DELETE')}>Remove agent role</button></>}
      {resource.path === '/payouts/pending' && <button disabled={busy} onClick={() => confirm('Confirm you have sent this vendor payment. The agent dashboard will update from Pending to Paid.', `/payouts/${row.job_id}/complete`)}>Mark paid</button>}
      {resource.path === '/disputes' && <button disabled={busy} onClick={() => confirm('Resolve dispute and refund the held fee', `/disputes/${row.dispute_id}/resolve`, [{ key:'fault',label:'Responsible party',required:true,options:[{value:'requester',label:'Requester'},{value:'agent',label:'Agent'}] },{key:'adminNotes',label:'Resolution notes',required:true}])}>Resolve dispute</button>}
      {spec[resource.path] && <button disabled={busy} onClick={() => edit(row)}>Edit</button>}{resource.path === '/settings/fee-tiers' && <button disabled={busy} onClick={() => confirm('Delete fee tier?', `/settings/fee-tiers/${row.tier_id}`, [], 'DELETE')}>Delete tier</button>}
          </div>
        </section>;
      })}</div>}
      {resource.path === '' && <footer className="admin-agents__pagination"><span>Page {page}</span><div><button disabled={page <= 1 || loading || busy} onClick={() => setPage(p => p - 1)}><ArrowLeft size={16} />Previous</button><button disabled={rows.length < 20 || loading || busy} onClick={() => setPage(p => p + 1)}>Next<ArrowRight size={16} /></button></div></footer>}
    </section>
    {editor && <EditForm editor={editor} key={editor.title} error={error} busy={busy} close={() => setEditor(null)} save={v => void save(v)} />}
  </div>;
}
