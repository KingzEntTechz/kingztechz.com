import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Wrench, Calendar, Plus, Edit2, Trash2, X, Save,
  TrendingUp, DollarSign, Users, Package, CheckCircle, Clock, XCircle, Settings,
  Monitor, UserCog, RefreshCw, ShieldCheck, Eye, EyeOff, Key, Copy, Image, AlertTriangle,
} from 'lucide-react';
import { supabase, type Tool, type Rental, type SiteSettings, type Profile, type AutomationSettings, type ToolLogin, type MediaImage } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import ImageCropModal from '@/components/ImageCropModal';

type AdminTab = 'dashboard' | 'tools' | 'rentals' | 'customers' | 'automation' | 'settings';

export default function AdminPanel() {
  const { settings, refreshSettings, profile } = useAuth();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [tools, setTools] = useState<Tool[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customers, setCustomers] = useState<Profile[]>([]);
  const [automation, setAutomation] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [showToolForm, setShowToolForm] = useState(false);
  const [toolFormMode, setToolFormMode] = useState<'new' | 'edit' | 'logins'>('new');
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<MediaImage[]>([]);
  const cropCallback = useRef<((blob: Blob) => Promise<void>) | null>(null);

  const openCropModal = (file: File, onCrop: (blob: Blob) => Promise<void>) => {
    setCropFile(file);
    cropCallback.current = onCrop;
  };

  const handleCropComplete = async (blob: Blob) => {
    if (cropCallback.current) await cropCallback.current(blob);
    cropCallback.current = null;
  };

  const uploadMediaFile = async (file: File | Blob) => {
    if (file instanceof File && !file.type.startsWith('image/')) throw new Error('Please select an image file.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Images must be smaller than 5 MB.');
    const path = `admin/${crypto.randomUUID()}.png`;
    const { error } = await supabase.storage.from('media').upload(path, file, { contentType: 'image/png', upsert: false });
    if (error) throw new Error('The image could not be uploaded.');
    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setDataError(null);
    const [toolsRes, rentalsRes, profilesRes, automationRes, galleryRes] = await Promise.all([
      supabase.from('tools').select('id, name, description, image_url, duration, price_usd, price_kes, category, is_active, sort_order, remote_connect, delivery_mode, source, created_at, updated_at').order('sort_order', { ascending: true }),
      supabase.from('rentals').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('automation_settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('media_gallery').select('*').order('created_at', { ascending: false }),
    ]);
    const failed = [toolsRes, rentalsRes, profilesRes, automationRes, galleryRes].find((result) => result.error);
    if (failed?.error) {
      console.error('admin data load failed', failed.error);
      setDataError('The admin data could not be loaded. Please refresh and try again.');
    }
    setTools(toolsRes.data as Tool[] ?? []);
    setRentals(rentalsRes.data as Rental[] ?? []);
    setCustomers(profilesRes.data as Profile[] ?? []);
    setAutomation(automationRes.data as AutomationSettings | null);
    setGalleryImages(galleryRes.data as MediaImage[] ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSaveTool = async (tool: Partial<Tool> & { logins?: { email: string; password: string }[] }) => {
    const { id, logins, ...toolData } = tool;
    const payload = {
      name: toolData.name || '',
      description: toolData.description || '',
      image_url: toolData.image_url || '',
      duration: toolData.duration || '1 Hours',
      price_usd: toolData.price_usd || 0,
      price_kes: toolData.price_kes || 0,
      category: toolData.category || 'Server',
      is_active: toolData.is_active ?? true,
      sort_order: toolData.sort_order ?? tools.length,
      remote_connect: toolData.remote_connect || null,
      delivery_mode: toolData.delivery_mode || 'instant',
      source: toolData.source || 'inventory',
      updated_at: new Date().toISOString(),
    };
    const result = id
      ? await supabase.from('tools').update(payload).eq('id', id)
      : await supabase.from('tools').insert(payload).select('id').maybeSingle();
    if (result.error) { console.error('tool save failed', result.error); throw new Error('This tool could not be saved. Please check the details and try again.'); }
    const toolId = id ?? (result.data as { id: string } | null)?.id;
    if (!toolId) throw new Error('The tool was saved without an inventory ID. Please try again.');
    if (logins && logins.length > 0) {
      const { error: loginError } = await supabase.rpc('admin_add_tool_logins', {
        p_tool_id: toolId,
        p_logins: logins.map((login) => ({ email: login.email, password: login.password })),
      });
      if (loginError) { console.error('login save failed', loginError); throw new Error('Logins could not be saved.'); }
    }
    setShowToolForm(false);
    setEditingTool(null);
    await loadData();
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('Delete this tool?')) return;
    await supabase.from('tools').delete().eq('id', id);
    setShowToolForm(false);
    setEditingTool(null);
    loadData();
  };

  const handleUpdateRentalStatus = async (id: string, status: Rental['status']) => {
    await supabase.rpc('admin_set_rental_status', { p_rental_id: id, p_status: status });
    loadData();
  };

  const copyConnectionDetails = (rental: Rental) => {
    const details = [
      rental.anydesk_id && `AnyDesk ID: ${rental.anydesk_id}`,
      rental.ultraviewer_id && `UltraViewer ID: ${rental.ultraviewer_id}`,
      rental.ultraviewer_password && `UltraViewer Password: ${rental.ultraviewer_password}`,
    ].filter(Boolean).join('\n');
    if (details) navigator.clipboard?.writeText(details);
  };

  const stats = {
    totalTools: tools.length,
    activeTools: tools.filter(t => t.is_active).length,
    totalRentals: rentals.length,
    pendingRentals: rentals.filter(r => r.status === 'pending').length,
    completedRentals: rentals.filter(r => r.status === 'completed').length,
    revenue: rentals.filter(r => r.status === 'completed' || r.status === 'paid').reduce((s, r) => s + r.amount_usd, 0),
  };

  if (loading) {
    return (<div className="flex items-center justify-center py-24"><div className="w-10 h-10 border-4 border-info-500 border-t-transparent rounded-full animate-spin" /></div>);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><LayoutDashboard className="w-7 h-7 text-success-500" /> Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Manage everything on your website</p>
        </div>
      </div>
      {dataError && <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-accent-500/30 bg-accent-500/10 px-4 py-3 text-sm text-accent-400"><span>{dataError}</span><button type="button" onClick={loadData} className="font-semibold text-white hover:text-accent-300">Try again</button></div>}

      <div className="flex gap-1 mb-6 bg-dark-200 p-1 rounded-xl w-fit overflow-x-auto">
        {([
          { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: TrendingUp },
          { id: 'tools' as AdminTab, label: 'Tools', icon: Wrench },
          { id: 'rentals' as AdminTab, label: 'Rentals', icon: Calendar },
          { id: 'customers' as AdminTab, label: 'Customers', icon: UserCog },
          { id: 'automation' as AdminTab, label: 'Automation', icon: RefreshCw },
          { id: 'settings' as AdminTab, label: 'Settings', icon: Settings },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${tab === t.id ? 'bg-info-500 text-white shadow-lg shadow-info-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Package} label="Total Tools" value={stats.totalTools} sub={`${stats.activeTools} active`} color="info" />
            <StatCard icon={Calendar} label="Total Rentals" value={stats.totalRentals} sub={`${stats.pendingRentals} pending`} color="accent" />
            <StatCard icon={DollarSign} label="Revenue (USD)" value={`$${stats.revenue.toFixed(2)}`} sub={`Rate: ${settings?.usdt_rate || 129.22}`} color="success" />
            <StatCard icon={Users} label="Completed" value={stats.completedRentals} sub="rentals" color="warning" />
          </div>
          <div className="card p-6">
            <h3 className="text-lg font-bold text-white mb-4">Recent Rentals</h3>
            {rentals.length === 0 ? <p className="text-gray-400 text-sm text-center py-6">No rentals yet.</p> : (
              <div className="space-y-3">
                {rentals.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between p-3 bg-dark-400/50 rounded-lg">
                    <div><p className="font-semibold text-white text-sm">{r.tool_name}</p><p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</p></div>
                    <StatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tools */}
      {tab === 'tools' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Manage Tools ({tools.length})</h3>
            <button onClick={() => { setEditingTool(null); setToolFormMode('new'); setShowToolForm(true); }} className="btn-success flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Tool</button>
          </div>
          {tools.length === 0 ? (
            <div className="card p-12 text-center"><Package className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400 mb-2">No tools yet</p><p className="text-sm text-gray-500">Click "Add Tool" to create your first tool.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map(tool => (
                <div key={tool.id} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-dark-400 flex items-center justify-center overflow-hidden shrink-0">
                        {tool.image_url ? <img src={tool.image_url} alt={tool.name} className="max-w-full max-h-full object-contain" /> : <Wrench className="w-6 h-6 text-gray-600" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white text-sm">{tool.name}</h4>
                        <p className="text-xs text-gray-400">{tool.category} · {tool.duration}</p>
                        {tool.remote_connect && <p className="text-xs text-warning-500 mt-0.5 flex items-center gap-1"><Monitor className="w-3 h-3" /> {tool.remote_connect === 'anydesk' ? 'AnyDesk' : 'UltraViewer'}</p>}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${tool.is_active ? 'bg-success-500/10 text-success-500' : 'bg-dark-50 text-gray-500'}`}>{tool.is_active ? 'Active' : 'Hidden'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-accent-500 font-bold">${tool.price_usd}</span>
                    <span className="text-gray-400">KES {(tool.price_usd * (settings?.usdt_rate || 129.22)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingTool(tool); setToolFormMode('edit'); setShowToolForm(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-info-500/10 text-info-500 text-sm font-semibold hover:bg-info-500/20 transition-colors"><Edit2 className="w-3.5 h-3.5" /> Edit</button>
                    <button onClick={() => { setEditingTool(tool); setToolFormMode('logins'); setShowToolForm(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-success-500/10 text-success-500 text-sm font-semibold hover:bg-success-500/20 transition-colors"><Key className="w-3.5 h-3.5" /> Add Logins</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rentals */}
      {tab === 'rentals' && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4">All Rentals ({rentals.length})</h3>
          {rentals.length === 0 ? (
            <div className="card p-12 text-center"><Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" /><p className="text-gray-400">No rentals yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="text-left text-xs text-gray-400 uppercase tracking-wider border-b border-dark-50">
                  <th className="pb-3 pr-4">Tool</th><th className="pb-3 pr-4">Amount</th><th className="pb-3 pr-4">Connection / Logins</th><th className="pb-3 pr-4">Date</th><th className="pb-3">Status / Action</th>
                </tr></thead>
                <tbody>
                  {rentals.map(r => (
                    <tr key={r.id} className="border-b border-dark-50/50 text-sm">
                      <td className="py-3 pr-4 font-semibold text-white">{r.tool_name}</td>
                      <td className="py-3 pr-4 text-gray-300">${r.amount_usd}<br /><span className="text-xs text-gray-500">KES {r.amount_kes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">
                        {r.anydesk_id && <p className="font-mono">AnyDesk: {r.anydesk_id}</p>}
                        {r.ultraviewer_id && <p className="font-mono">UV ID: {r.ultraviewer_id}</p>}
                        {r.ultraviewer_password && <p className="font-mono">UV Pass: {r.ultraviewer_password}</p>}
                        {r.delivered_email && <p className="font-mono text-success-500">Login: {r.delivered_email}</p>}
                        {r.delivered_password && <p className="font-mono text-success-500">Pass: {r.delivered_password}</p>}
                        {(r.anydesk_id || r.ultraviewer_id || r.delivered_email) ? (
                          <button type="button" onClick={() => copyConnectionDetails(r)} className="mt-1 inline-flex items-center gap-1 rounded-md bg-info-500/10 px-2 py-1 text-[11px] font-semibold text-info-500 hover:bg-info-500/20" aria-label="Copy connection or login details"><Copy className="w-3 h-3" /> Copy Details</button>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-gray-400 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <select value={r.status} onChange={(e) => handleUpdateRentalStatus(r.id, e.target.value as Rental['status'])} className={`border text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-info-500 ${statusActionClass(r.status)}`} aria-label={`Status and action for ${r.tool_name}`}>
                          <option value="pending">Pending</option><option value="paid">Paid</option><option value="completed">Completed</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Customers */}
      {tab === 'customers' && <CustomersTab customers={customers} canManage={profile?.admin_role === 'main' || profile?.admin_role === 'manager'} canPromote={profile?.admin_role === 'main'} onChanged={loadData} />}

      {/* Automation */}
      {tab === 'automation' && <AutomationTab automation={automation} onChanged={loadData} />}

      {/* Settings */}
      {tab === 'settings' && <SettingsTab settings={settings} onSave={refreshSettings} onUploadImage={uploadMediaFile} onOpenCrop={openCropModal} adminRole={profile?.admin_role ?? 'support'} />}

      {/* Tool form */}
      {showToolForm && <ToolForm tool={editingTool} loginOnly={toolFormMode === 'logins'} galleryImages={galleryImages} onSave={handleSaveTool} onDelete={handleDeleteTool} onClose={() => { setShowToolForm(false); setEditingTool(null); }} />}

      <ImageCropModal open={!!cropFile} file={cropFile} onClose={() => { setCropFile(null); cropCallback.current = null; }} onCropComplete={handleCropComplete} />
    </div>
  );
}

function CustomersTab({ customers, canManage, canPromote, onChanged }: { customers: Profile[]; canManage: boolean; canPromote: boolean; onChanged: () => Promise<void> }) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const adjustBalance = async (customerId: string, currency: 'USD' | 'KES', direction: 1 | -1) => {
    const amount = Number(amounts[customerId]);
    if (!Number.isFinite(amount) || amount <= 0) { setMessage('Enter a valid amount first.'); return; }
    setBusy(customerId); setMessage(null);
    const { error } = await supabase.rpc('admin_adjust_customer_balance', { p_user_id: customerId, p_currency: currency, p_amount: amount * direction });
    setBusy(null);
    if (error) { setMessage('The balance could not be updated.'); return; }
    setAmounts(current => ({ ...current, [customerId]: '' })); await onChanged();
  };

  const toggleDisabled = async (customer: Profile) => {
    setBusy(customer.id); setMessage(null);
    const { error } = await supabase.rpc('admin_set_customer_status', { p_user_id: customer.id, p_disabled: !customer.is_disabled });
    setBusy(null);
    if (error) { setMessage('The customer status could not be updated.'); return; }
    await onChanged();
  };

  const promote = async (customerId: string, role: 'manager' | 'support') => {
    setBusy(customerId); setMessage(null);
    const { error } = await supabase.rpc('main_admin_set_admin_role', { p_user_id: customerId, p_role: role });
    setBusy(null);
    if (error) { setMessage('The administrator role could not be updated.'); return; }
    await onChanged();
  };

  return <div className="space-y-4"><div><h3 className="text-lg font-bold text-white">Customers & Administrators</h3><p className="text-sm text-gray-400">Manage balances and account access without exposing privileged fields to customers.</p></div>{message && <p className="text-sm text-accent-400">{message}</p>}<div className="grid gap-4">{customers.map(customer => <div key={customer.id} className="card p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-white">{customer.full_name || 'Unnamed customer'}</p><p className="text-xs text-gray-500">{customer.phone || 'No phone number'} · Joined {new Date(customer.created_at).toLocaleDateString()}</p><p className="text-xs text-gray-400 mt-2">USDT balance: {customer.balance_usdt.toFixed(2)} · KES balance: {customer.balance_kes.toFixed(2)}</p></div><div className="flex items-center gap-2"><span className={`text-xs px-2 py-1 rounded-full ${customer.is_admin ? 'bg-info-500/10 text-info-500' : 'bg-dark-50 text-gray-400'}`}>{customer.is_admin ? customer.admin_role : 'Customer'}</span>{customer.is_disabled && <span className="text-xs px-2 py-1 rounded-full bg-accent-500/10 text-accent-400">Disabled</span>}</div></div>{!customer.is_admin && canManage && <div className="mt-4 flex flex-wrap gap-2"><input value={amounts[customer.id] || ''} onChange={e => setAmounts(current => ({ ...current, [customer.id]: e.target.value }))} type="number" min="0.01" step="0.01" placeholder="Amount" className="input-field w-28" /><button disabled={busy === customer.id} onClick={() => adjustBalance(customer.id, 'USD', 1)} className="px-3 py-2 rounded-lg bg-success-500/10 text-success-500 text-xs font-semibold">+ USDT</button><button disabled={busy === customer.id} onClick={() => adjustBalance(customer.id, 'USD', -1)} className="px-3 py-2 rounded-lg bg-accent-500/10 text-accent-400 text-xs font-semibold">− USDT</button><button disabled={busy === customer.id} onClick={() => adjustBalance(customer.id, 'KES', 1)} className="px-3 py-2 rounded-lg bg-success-500/10 text-success-500 text-xs font-semibold">+ KES</button><button disabled={busy === customer.id} onClick={() => adjustBalance(customer.id, 'KES', -1)} className="px-3 py-2 rounded-lg bg-accent-500/10 text-accent-400 text-xs font-semibold">− KES</button><button disabled={busy === customer.id} onClick={() => toggleDisabled(customer)} className="px-3 py-2 rounded-lg bg-warning-500/10 text-warning-500 text-xs font-semibold">{customer.is_disabled ? 'Enable' : 'Disable'}</button></div>}{canPromote && !customer.is_admin && <div className="mt-3 flex gap-2"><button onClick={() => promote(customer.id, 'manager')} className="text-xs text-info-500 hover:text-info-400">Make Manager</button><button onClick={() => promote(customer.id, 'support')} className="text-xs text-gray-400 hover:text-white">Make Support Admin</button></div>}</div>)}</div></div>;
}

function AutomationTab({ automation, onChanged }: { automation: AutomationSettings | null; onChanged: () => Promise<void> }) {
  const [form, setForm] = useState({ api_type: automation?.api_type || 'GSM Theme', api_name: automation?.api_name || '', provider_url: automation?.provider_url || '', username: automation?.username || '', provider_status: automation?.provider_status || 'inactive', auto_update_price: automation?.auto_update_price ?? true, auto_update_quantity: automation?.auto_update_quantity ?? true, auto_update_delivery: automation?.auto_update_delivery ?? true, enabled: automation?.enabled || false, cron_enabled: automation?.cron_enabled || false, interval_minutes: automation?.interval_minutes || 60 });
  const [saved, setSaved] = useState(false);
  const save = async () => { const { error } = await supabase.from('automation_settings').upsert({ id: 1, ...form, updated_at: new Date().toISOString() }); if (!error) { await onChanged(); setSaved(true); setTimeout(() => setSaved(false), 2000); } };
  return <div className="card p-6 max-w-3xl"><div className="flex items-start gap-3 mb-5"><RefreshCw className="w-6 h-6 text-info-500" /><div><h3 className="text-lg font-bold text-white">Automation API</h3><p className="text-sm text-gray-400">Configure the provider details shown in your reference screen.</p></div></div><div className="grid md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-gray-300 mb-1.5">API Type</label><select value={form.api_type} onChange={e => setForm({ ...form, api_type: e.target.value })} className="input-field"><option>GSM Theme</option><option>Custom API</option></select></div><div><label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label><select value={form.provider_status} onChange={e => setForm({ ...form, provider_status: e.target.value as 'active' | 'inactive' })} className="input-field"><option value="active">Active</option><option value="inactive">Inactive</option></select></div><div><label className="block text-sm font-medium text-gray-300 mb-1.5">API Name</label><input value={form.api_name} onChange={e => setForm({ ...form, api_name: e.target.value })} className="input-field" placeholder="gc" /></div><div><label className="block text-sm font-medium text-gray-300 mb-1.5">API URL</label><input value={form.provider_url} onChange={e => setForm({ ...form, provider_url: e.target.value })} className="input-field" placeholder="https://provider.example/public" /></div><div><label className="block text-sm font-medium text-gray-300 mb-1.5">Username</label><input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="input-field" /></div><div><label className="block text-sm font-medium text-gray-300 mb-1.5">Access Key</label><input type="password" value="" readOnly placeholder="Stored only as a secure server secret" className="input-field" /><p className="text-xs text-warning-500 mt-1">No access key is configured yet. Never paste it into this page.</p></div></div><div className="grid sm:grid-cols-2 gap-3 mt-5"><label className="flex items-center gap-3 text-sm text-gray-300"><input type="checkbox" checked={form.auto_update_price} onChange={e => setForm({ ...form, auto_update_price: e.target.checked })} className="w-5 h-5 accent-info-500" /> Auto update price</label><label className="flex items-center gap-3 text-sm text-gray-300"><input type="checkbox" checked={form.auto_update_quantity} onChange={e => setForm({ ...form, auto_update_quantity: e.target.checked })} className="w-5 h-5 accent-info-500" /> Auto update quantity</label><label className="flex items-center gap-3 text-sm text-gray-300"><input type="checkbox" checked={form.auto_update_delivery} onChange={e => setForm({ ...form, auto_update_delivery: e.target.checked })} className="w-5 h-5 accent-info-500" /> Auto update delivery time</label><label className="flex items-center gap-3 text-sm text-gray-300"><input type="checkbox" checked={form.cron_enabled} onChange={e => setForm({ ...form, cron_enabled: e.target.checked })} className="w-5 h-5 accent-info-500" /> Enable cron job</label></div><div className="mt-4"><label className="block text-sm font-medium text-gray-300 mb-1.5">Sync interval in minutes</label><input type="number" min="5" max="1440" value={form.interval_minutes} onChange={e => setForm({ ...form, interval_minutes: Math.min(1440, Math.max(5, parseInt(e.target.value) || 60)) })} className="input-field" /></div><button onClick={save} className="btn-success mt-5 flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Save API Settings</button>{saved && <span className="text-success-500 text-sm ml-3">Saved</span>}<p className="text-xs text-gray-500 mt-4">Tool syncing stays disabled until a secure server key and the provider’s response format are available.</p></div>;
}

function SettingsTab({ settings, onSave, onUploadImage, onOpenCrop, adminRole }: { settings: SiteSettings | null; onSave: () => Promise<void>; onUploadImage: (file: File | Blob) => Promise<string>; onOpenCrop: (file: File, onCrop: (blob: Blob) => Promise<void>) => void; adminRole: 'main' | 'manager' | 'support' }) {
  const canEditBusiness = adminRole === 'main' || adminRole === 'manager';
  const canEditFooter = adminRole === 'main';
  const [form, setForm] = useState({
    scrolling_text_1: settings?.scrolling_text_1 || '',
    scrolling_text_2: settings?.scrolling_text_2 || '',
    footer_text: settings?.footer_text || 'Kingz Techz',
    usdt_rate: settings?.usdt_rate || 129.22,
    whatsapp_number: settings?.whatsapp_number || '0752000550',
    mpesa_number: settings?.mpesa_number || '0707398858',
    email: settings?.email || 'kingzenttechz@gmail.com',
    binance_id: settings?.binance_id || '1108869988',
    binance_name: settings?.binance_name || 'Kingz Technologiez',
    hero_title: settings?.hero_title || 'Digital Services',
    hero_subtitle: settings?.hero_subtitle || 'Technicians tools and services',
    server_logo_url: settings?.server_logo_url || '',
    scroll_font_size: settings?.scroll_font_size || 16,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [gallery, setGallery] = useState<MediaImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryPicker, setGalleryPicker] = useState<null | 'tool' | 'server'>(null);
  const [maintenance, setMaintenance] = useState(settings?.maintenance_mode ?? false);
  const [maintSaving, setMaintSaving] = useState(false);

  const loadGallery = useCallback(async () => {
    const { data } = await supabase.from('media_gallery').select('*').order('created_at', { ascending: false });
    setGallery((data as MediaImage[]) ?? []);
  }, []);

  useEffect(() => { loadGallery(); }, [loadGallery]);

  const uploadToGallery = async (file: File) => {
    setGalleryLoading(true);
    try {
      onOpenCrop(file, async (blob) => {
        const url = await onUploadImage(blob);
        const { error } = await supabase.from('media_gallery').insert({ url, label: file.name });
        if (error) { setSaveError('Could not save image to gallery'); setGalleryLoading(false); return; }
        await loadGallery();
        setGalleryLoading(false);
      });
    } catch {
      setGalleryLoading(false);
    }
  };

  const deleteGalleryImage = async (id: string, url: string) => {
    const filePath = url.split('/media/')[1];
    if (filePath) { await supabase.storage.from('media').remove([`admin/${filePath}`]); }
    await supabase.from('media_gallery').delete().eq('id', id);
    await loadGallery();
  };

  const pickFromGallery = (url: string) => {
    if (galleryPicker === 'server') setForm(current => ({ ...current, server_logo_url: url }));
    setGalleryPicker(null);
  };

  const toggleMaintenance = async () => {
    setMaintSaving(true);
    const newVal = !maintenance;
    const { error } = await supabase.rpc('admin_set_maintenance_mode', { p_enabled: newVal });
    setMaintSaving(false);
    if (error) { setSaveError('Could not toggle maintenance mode'); return; }
    setMaintenance(newVal);
    await onSave();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    let failed = false;

    if (canEditBusiness) {
      const { footer_text, ...updatable } = form;
      void footer_text;
      const { error } = await supabase.from('site_settings').update({ ...updatable, updated_at: new Date().toISOString() }).eq('id', 1);
      if (error) { console.error('settings update failed', error); failed = true; }
    } else {
      const { error } = await supabase.rpc('admin_update_branding', {
        p_hero_title: form.hero_title,
        p_hero_subtitle: form.hero_subtitle,
        p_scrolling_text_1: form.scrolling_text_1,
        p_scrolling_text_2: form.scrolling_text_2,
        p_server_logo_url: form.server_logo_url,
        p_scroll_font_size: form.scroll_font_size,
      });
      if (error) { console.error('branding update failed', error); failed = true; }
    }

    if (canEditFooter && form.footer_text !== (settings?.footer_text || '')) {
      const { error } = await supabase.rpc('main_admin_set_footer_text', { p_text: form.footer_text });
      if (error) { console.error('footer update failed', error); failed = true; }
    }

    await onSave();
    setSaving(false);
    if (failed) { setSaveError('Some settings could not be saved. Please check your access level and try again.'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Website Content</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Hero Title</label><input type="text" value={form.hero_title} onChange={e => setForm({ ...form, hero_title: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Hero Subtitle</label><input type="text" value={form.hero_subtitle} onChange={e => setForm({ ...form, hero_subtitle: e.target.value })} className="input-field" /></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Server Logo</label><div className="flex gap-2"><button type="button" onClick={() => setGalleryPicker('server')} className="btn-info text-sm py-2 px-3 flex items-center gap-2"><Image className="w-4 h-4" /> Pick from Gallery</button></div>{form.server_logo_url && <img src={form.server_logo_url} alt="Server logo" className="mt-3 h-16 w-16 rounded-lg object-contain bg-dark-400" />}</div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Scrolling Texts</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Scrolling Text 1 (separate items with |)</label><textarea value={form.scrolling_text_1} onChange={e => setForm({ ...form, scrolling_text_1: e.target.value })} className="input-field min-h-[60px] resize-y" /></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Scrolling Text 2 (separate items with |)</label><textarea value={form.scrolling_text_2} onChange={e => setForm({ ...form, scrolling_text_2: e.target.value })} className="input-field min-h-[60px] resize-y" /></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Scrolling Text Font Size</label><input type="number" min="12" max="24" value={form.scroll_font_size} onChange={e => setForm({ ...form, scroll_font_size: Math.min(24, Math.max(12, parseInt(e.target.value) || 16)) })} className="input-field" /><p className="text-xs text-gray-500 mt-1">Use 12–24px for a subtle but visible change.</p></div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Footer & Contact</h3>
        <div className="space-y-4">
          {canEditFooter && <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Powered By Text</label><input type="text" value={form.footer_text} onChange={e => setForm({ ...form, footer_text: e.target.value })} className="input-field" /><p className="text-xs text-gray-500 mt-1">Shown after “Powered by” in the footer. Only the main administrator can change this.</p></div>}
          {canEditBusiness ? (<>
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">WhatsApp Number</label><input type="text" value={form.whatsapp_number} onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">M-Pesa Number</label><input type="text" value={form.mpesa_number} onChange={e => setForm({ ...form, mpesa_number: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label><input type="text" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" /></div>
          </>) : <p className="text-sm text-gray-500">Contact and payment details can only be changed by the main administrator or a manager.</p>}
        </div>
      </div>

      {canEditBusiness && <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4">Currency & Payment</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-300 mb-1.5">USDT Rate (KES per 1 USD)</label><input type="number" step="0.01" min="0" value={form.usdt_rate} onChange={e => setForm({ ...form, usdt_rate: parseFloat(e.target.value) || 0 })} className="input-field" /><p className="text-xs text-gray-500 mt-1">This rate converts USD tool prices to KES for customers who select KES currency.</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Binance Pay ID</label><input type="text" value={form.binance_id} onChange={e => setForm({ ...form, binance_id: e.target.value })} className="input-field" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Binance Name</label><input type="text" value={form.binance_name} onChange={e => setForm({ ...form, binance_name: e.target.value })} className="input-field" /></div>
          </div>
        </div>
      </div>}

      {/* Maintenance Mode */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-warning-500" /> Maintenance Mode</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">When enabled, the website shows a maintenance notice to visitors.</p>
            <p className="text-xs text-gray-500 mt-1">Admins can still access the panel normally.</p>
          </div>
          <button type="button" onClick={toggleMaintenance} disabled={maintSaving}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${maintenance ? 'bg-warning-500' : 'bg-dark-50'}`}>
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${maintenance ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
        </div>
        {maintenance && <p className="mt-3 text-sm text-warning-500 font-semibold">Maintenance mode is currently ON.</p>}
      </div>

      {/* Media Gallery */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Image className="w-5 h-5 text-info-500" /> Media Gallery</h3>
        <p className="text-sm text-gray-400 mb-4">Upload and manage images, logos and pictures. Tool and server logos are picked from here instead of uploading from your device each time.</p>
        <div className="mb-4">
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={galleryLoading} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; e.target.value = ''; await uploadToGallery(file); }} className="input-field file:mr-3 file:rounded-lg file:border-0 file:bg-info-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white" />
          {galleryLoading && <p className="text-sm text-info-500 mt-2">Uploading...</p>}
        </div>
        {gallery.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No images in the gallery yet.</p>
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
            {gallery.map(img => (
              <div key={img.id} className="relative group rounded-md overflow-hidden bg-dark-400 border border-dark-50 aspect-square">
                <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  {galleryPicker && <button type="button" onClick={() => pickFromGallery(img.url)} className="text-info-500 hover:text-info-400 p-0.5" aria-label="Select image"><CheckCircle className="w-3.5 h-3.5" /></button>}
                  <button type="button" onClick={() => deleteGalleryImage(img.id, img.url)} className="text-accent-500 hover:text-accent-400 p-0.5" aria-label="Delete image"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
        {galleryPicker && (
          <div className="mt-3 flex items-center gap-2 text-sm text-info-500">
            <Image className="w-4 h-4" /> Click an image to select it for the {galleryPicker === 'server' ? 'server logo' : 'tool logo'}.
            <button type="button" onClick={() => setGalleryPicker(null)} className="text-gray-400 hover:text-white ml-2">Cancel</button>
          </div>
        )}
      </div>

      {saveError && <p className="rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-sm text-accent-400">{saveError}</p>}

      <div className="flex items-center gap-4">
        <button onClick={handleSave} disabled={saving} className="btn-success flex items-center gap-2 disabled:opacity-50"><Save className="w-5 h-5" /> {saving ? 'Saving...' : 'Save All Settings'}</button>
        {saved && <span className="text-success-500 text-sm font-semibold flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Saved!</span>}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Package; label: string; value: string | number; sub: string; color: string }) {
  const colorMap: Record<string, string> = { info: 'text-info-500 bg-info-500/10', accent: 'text-accent-500 bg-accent-500/10', success: 'text-success-500 bg-success-500/10', warning: 'text-warning-500 bg-warning-500/10' };
  return (
    <div className="card p-5">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorMap[color]} mb-3`}><Icon className="w-5 h-5" /></div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function statusActionClass(status: Rental['status']) {
  const colors: Record<Rental['status'], string> = {
    pending: 'bg-warning-500/10 border-warning-500/40 text-warning-500',
    paid: 'bg-info-500/10 border-info-500/40 text-info-500',
    completed: 'bg-success-500/10 border-success-500/40 text-success-500',
    expired: 'bg-dark-50 border-dark-50 text-gray-400',
    cancelled: 'bg-accent-500/10 border-accent-500/40 text-accent-400',
  };
  return colors[status];
}

function StatusBadge({ status }: { status: Rental['status'] }) {
  const config: Record<Rental['status'], { label: string; color: string; icon: typeof Clock }> = {
    pending: { label: 'Pending', color: 'bg-warning-500/10 text-warning-500', icon: Clock },
    paid: { label: 'Paid', color: 'bg-info-500/10 text-info-500', icon: CheckCircle },
    completed: { label: 'Completed', color: 'bg-success-500/10 text-success-500', icon: CheckCircle },
    expired: { label: 'Expired', color: 'bg-dark-50 text-gray-400', icon: Clock },
    cancelled: { label: 'Cancelled', color: 'bg-accent-500/10 text-accent-500', icon: XCircle },
  };
  const { label, color, icon: Icon } = config[status];
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${color}`}><Icon className="w-3 h-3" />{label}</span>;
}

function ToolForm({ tool, loginOnly, galleryImages, onSave, onDelete, onClose }: { tool: Tool | null; loginOnly: boolean; galleryImages: MediaImage[]; onSave: (t: Partial<Tool> & { logins?: { email: string; password: string }[] }) => Promise<void>; onDelete: (id: string) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState({
    name: tool?.name || '', description: tool?.description || '', image_url: tool?.image_url || '',
    duration: tool?.duration || '1 Hours', price_usd: tool?.price_usd || 0, price_kes: tool?.price_kes || 0,
    category: ['Server', 'Remote', 'Rental', 'Imei'].includes(tool?.category || '') ? tool?.category || 'Server' : 'Server', is_active: tool?.is_active ?? true,
    sort_order: tool?.sort_order ?? 0, remote_connect: tool?.remote_connect || null as 'anydesk' | 'ultraviewer' | null, delivery_mode: tool?.delivery_mode || 'instant' as 'instant' | 'minutes',
    source: tool?.source || 'inventory' as 'inventory' | 'api',
  });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [existingLogins, setExistingLogins] = useState<ToolLogin[]>([]);
  const [newLogins, setNewLogins] = useState<{ email: string; password: string }[]>([]);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showGallery, setShowGallery] = useState(false);

  useEffect(() => {
    if (tool?.id && tool.source === 'inventory' && !tool.remote_connect) {
      supabase.from('tool_logins').select('*').eq('tool_id', tool.id).order('created_at', { ascending: true }).then(({ data }) => {
        setExistingLogins((data as ToolLogin[]) ?? []);
      });
    }
  }, [tool?.id, tool?.source, tool?.remote_connect]);

  const addLogin = () => {
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    if (existingLogins.length + newLogins.length >= 20) { setSaveError('Maximum 20 logins per tool'); return; }
    setNewLogins([...newLogins, { email: loginEmail.trim(), password: loginPassword.trim() }]);
    setLoginEmail(''); setLoginPassword(''); setShowLoginPass(false);
    setSaveError(null);
  };

  const removeNewLogin = (idx: number) => setNewLogins(newLogins.filter((_, i) => i !== idx));

  const deleteExistingLogin = async (id: string) => {
    if (!confirm('Delete this login permanently?')) return;
    const { error } = await supabase.rpc('admin_delete_tool_login', { p_login_id: id });
    if (error) { setSaveError('Could not delete login'); return; }
    setExistingLogins(existingLogins.filter(l => l.id !== id));
  };

  const returnExistingLogin = async (id: string) => {
    const { error } = await supabase.rpc('admin_return_tool_login', { p_login_id: id });
    if (error) { setSaveError('Could not return login to inventory'); return; }
    setExistingLogins(existingLogins.map(login => login.id === id ? { ...login, status: 'available', rental_id: null } : login));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setSaveError('Tool name is required'); return; }
    if (form.source === 'inventory' && !form.remote_connect && newLogins.length === 0 && existingLogins.length === 0) {
      setSaveError('Add at least one login to the inventory'); return;
    }
    setSaveError(null);
    try {
      await onSave({ ...form, id: tool?.id, logins: newLogins.length > 0 ? newLogins : undefined });
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save this tool.');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div onClick={handleOverlayClick} className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[calc(100vh-2rem)] overflow-y-auto bg-dark-200 border border-dark-50 rounded-2xl shadow-2xl p-6 my-0 animate-slide-up">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-dark-200 pb-4 mb-4">
          <h2 className="text-xl font-bold text-white">{loginOnly ? 'Add Logins' : tool ? 'Edit Tool' : 'Add New Tool'}</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-accent-500 hover:bg-white/5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!loginOnly && <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Tool Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g., AMT Tool" /></div>}
          {!loginOnly && <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field min-h-[70px] resize-y" placeholder="Short description" /></div>}
          {!loginOnly && <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Tool Image</label><button type="button" onClick={() => setShowGallery(!showGallery)} className="btn-info text-sm py-2 px-4 flex items-center gap-2"><Image className="w-4 h-4" /> Pick from Gallery</button>{showGallery && galleryImages.length > 0 && <div className="mt-2 grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-2 bg-dark-400/50 rounded-lg">{galleryImages.map(img => <button key={img.id} type="button" onClick={() => { setForm(current => ({ ...current, image_url: img.url })); setShowGallery(false); }} className="rounded-md overflow-hidden border border-dark-50 hover:border-info-500 transition-colors aspect-square"><img src={img.url} alt={img.label} className="w-full h-full object-cover" /></button>)}</div>}{showGallery && galleryImages.length === 0 && <p className="text-xs text-gray-500 mt-2">No images in the gallery yet. Upload some in Settings first.</p>}<p className="text-xs text-gray-500 mt-1">All tool images are picked from the Media Gallery in Settings.</p>{form.image_url && <img src={form.image_url} alt="Selected tool" className="mt-3 h-16 w-16 rounded-lg object-cover" />}</div>}
          {!loginOnly && <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Duration</label><select value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="input-field">{Array.from({ length: 60 }, (_, index) => `${index + 1} Hours`).map(hours => <option key={hours} value={hours}>{hours}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input-field">{['Server', 'Remote', 'Rental', 'Imei'].map(option => <option key={option} value={option}>{option}</option>)}</select></div>
          </div>}
          {!loginOnly && <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Delivery</label><select value={form.delivery_mode} onChange={e => setForm({ ...form, delivery_mode: e.target.value as 'instant' | 'minutes' })} className="input-field"><option value="instant">Instant</option><option value="minutes">Minutes</option></select><p className="text-xs text-gray-500 mt-1">Shown below the duration on the customer page.</p></div>}
          {!loginOnly && <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">USDT Price</label><input type="number" step="0.01" min="0" value={form.price_usd} onChange={e => setForm({ ...form, price_usd: parseFloat(e.target.value) || 0 })} className="input-field" placeholder="2.00" /></div>
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">KES Price</label><input type="number" step="0.01" min="0" value={form.price_kes} onChange={e => setForm({ ...form, price_kes: parseFloat(e.target.value) || 0 })} className="input-field" placeholder="100.00" /></div>
          </div>}
          {!loginOnly && <p className="text-xs text-gray-500">Both prices are saved to two decimal places and shown according to each customer’s selected currency.</p>}
          {!loginOnly && <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Remote Connect (optional)</label>
            <div className="grid grid-cols-3 gap-3">
              {[{ val: null, label: 'None' }, { val: 'anydesk', label: 'AnyDesk' }, { val: 'ultraviewer', label: 'UltraViewer' }].map(opt => (
                <button key={String(opt.val)} type="button" onClick={() => setForm({ ...form, remote_connect: opt.val as 'anydesk' | 'ultraviewer' | null })}
                  className={`py-2.5 rounded-lg border font-semibold text-sm transition-all ${form.remote_connect === opt.val ? 'border-info-500 bg-info-500/10 text-info-500' : 'border-dark-50 text-gray-400 hover:bg-white/5'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Select if this tool requires remote support software.</p>
          </div>}
          {(loginOnly || form.remote_connect === null) && (
            <div className="space-y-4">
              {!loginOnly && <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Tool Source</label>
                <div className="grid grid-cols-2 gap-3">
                  {[{ val: 'inventory', label: 'Inventory' }, { val: 'api', label: 'API' }].map(opt => (
                    <button key={opt.val} type="button" onClick={() => setForm({ ...form, source: opt.val as 'inventory' | 'api' })}
                      className={`py-2.5 rounded-lg border font-semibold text-sm transition-all ${form.source === opt.val ? 'border-info-500 bg-info-500/10 text-info-500' : 'border-dark-50 text-gray-400 hover:bg-white/5'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{form.source === 'inventory' ? 'Logins are stored and delivered from your saved inventory.' : 'Logins come from an external API you configure. Admin assigns them manually after each rental.'}</p>
              </div>}
              {form.source === 'inventory' && (
                <div className="bg-dark-400/30 rounded-lg p-4 space-y-3 border border-dark-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Key className="w-4 h-4 text-success-500" /><span className="text-sm font-semibold text-gray-300">Login Inventory</span></div>
                    <span className="text-xs text-gray-500">{existingLogins.length + newLogins.length} / 20</span>
                  </div>
                  {existingLogins.length > 0 && (
                    <div className="space-y-2">
                      {existingLogins.map(l => (
                        <div key={l.id} className="flex items-center gap-2 bg-dark-200 rounded-lg px-3 py-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${l.status === 'available' ? 'bg-success-500/10 text-success-500' : 'bg-accent-500/10 text-accent-400'}`}>{l.status === 'available' ? 'Available' : 'Used'}</span>
                          <span className="text-sm text-gray-300 flex-1 truncate font-mono">{l.login_email}</span>
                          {l.status === 'used' && <button type="button" onClick={() => returnExistingLogin(l.id)} className="rounded-md bg-success-500/10 px-2 py-1 text-[11px] font-semibold text-success-500 hover:bg-success-500/20">Return</button>}
                          <button type="button" onClick={() => deleteExistingLogin(l.id)} className="text-gray-500 hover:text-accent-500" aria-label="Delete login"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {newLogins.length > 0 && (
                    <div className="space-y-2">
                      {newLogins.map((l, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-info-500/10 rounded-lg px-3 py-2">
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold bg-info-500/20 text-info-500">New</span>
                          <span className="text-sm text-gray-300 flex-1 truncate font-mono">{l.email}</span>
                          <button type="button" onClick={() => removeNewLogin(idx)} className="text-gray-500 hover:text-accent-500" aria-label="Remove login"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {existingLogins.length + newLogins.length < 20 && (
                    <div className="grid grid-cols-1 gap-2 pt-2 border-t border-dark-50">
                      <div><label className="block text-xs font-medium text-gray-400 mb-1">Add Login Email / Username</label><input type="text" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="input-field text-sm" placeholder="user@example.com" /></div>
                      <div><label className="block text-xs font-medium text-gray-400 mb-1">Add Login Password</label><div className="relative"><input type={showLoginPass ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="input-field text-sm pr-10" placeholder="Password" /><button type="button" onClick={() => setShowLoginPass(!showLoginPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label={showLoginPass ? 'Hide password' : 'Show password'}>{showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
                      <button type="button" onClick={addLogin} disabled={!loginEmail.trim() || !loginPassword.trim()} className="btn-info text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Add to Inventory</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {!loginOnly && <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-300 mb-1.5">Sort Order</label><input type="number" min="0" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="input-field" /></div>
            <div className="flex items-end"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5 rounded accent-info-500" /><span className="text-sm font-medium text-gray-300">Active (visible)</span></label></div>
          </div>}
          {saveError && <p className="rounded-lg border border-accent-500/30 bg-accent-500/10 px-3 py-2 text-sm text-accent-400">{saveError}</p>}
          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" className="btn-success flex-1 flex items-center justify-center gap-2"><Save className="w-5 h-5" /> {loginOnly ? 'Save Logins' : tool ? 'Update' : 'Create'}</button>
            {tool && !loginOnly && <button type="button" onClick={() => onDelete(tool.id)} className="px-4 py-3 rounded-lg bg-accent-500/10 text-accent-400 font-semibold hover:bg-accent-500/20 transition-colors"><Trash2 className="inline-block w-4 h-4 mr-1.5" /> Delete Tool</button>}
            <button type="button" onClick={onClose} className="px-6 py-3 rounded-lg border border-dark-50 text-gray-400 font-semibold hover:bg-white/5 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
