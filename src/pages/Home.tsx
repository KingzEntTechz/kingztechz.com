import { useState, useMemo, useEffect } from 'react';
import { Clock, Search, Tag, Shield, Globe, PackageX } from 'lucide-react';
import type { Tool } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

type HomeProps = {
  tools: Tool[];
  onRent: (tool: Tool) => void;
};

export default function Home({ tools, onRent }: HomeProps) {
  const { settings, profile } = useAuth();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'KES'>(profile?.preferred_currency || 'USD');
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (profile?.preferred_currency) setDisplayCurrency(profile.preferred_currency);
  }, [profile?.preferred_currency]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc('get_public_tool_stock');
      if (error) {
        setStockMap({});
        return;
      }
      const counts: Record<string, number> = {};
      (data ?? []).forEach((row: { tool_id: string; available_count: number }) => {
        counts[row.tool_id] = row.available_count;
      });
      setStockMap(counts);
    })();
  }, [tools]);

  const currency = displayCurrency;
  const usdtRate = settings?.usdt_rate || 129.22;

  const categories = useMemo(() => {
    const cats = new Set(tools.filter(t => t.is_active).map(t => t.category || 'General'));
    return ['all', ...Array.from(cats)];
  }, [tools]);

  const filtered = useMemo(() => {
    return tools
      .filter(t => t.is_active)
      .filter(t => category === 'all' || (t.category || 'General') === category)
      .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [tools, search, category]);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-dark-500 via-dark-400 to-dark-300 border-b border-dark-50">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,152,219,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(231,76,60,0.12),transparent_40%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-400 via-dark-400/80 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-center">
          <span className="inline-block bg-accent-500 text-white px-5 py-1.5 rounded-full text-sm font-semibold mb-4 shadow-lg shadow-accent-500/30">
            Instant 24/7 Auto-Delivery
          </span>
          <h1 className="text-3xl sm:text-5xl font-bold text-white mb-4 leading-tight">
            {settings?.hero_title || 'Digital Services'}
          </h1>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto mb-6">
            {settings?.hero_subtitle || 'Technicians tools and services'}
          </p>

        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 card p-4">
            <Shield className="w-7 h-7 text-info-500 shrink-0" />
            <div><p className="font-semibold text-white text-sm">Secure & Reliable</p><p className="text-xs text-gray-400">99.9% uptime</p></div>
          </div>
          <div className="flex items-center gap-3 card p-4">
            <Globe className="w-7 h-7 text-accent-500 shrink-0" />
            <div><p className="font-semibold text-white text-sm">Global Access</p><p className="text-xs text-gray-400">Available 24/7</p></div>
          </div>
          <div className="flex items-center gap-3 card p-4">
            <Clock className="w-7 h-7 text-success-500 shrink-0" />
            <div><p className="font-semibold text-white text-sm">Instant Delivery</p><p className="text-xs text-gray-400">As guaranteed</p></div>
          </div>
        </div>
      </section>

      {/* Tools section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="section-title mb-4">All Digital Solutions</h2>

        {/* Search and filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" placeholder="Search tools..." />
          </div>
          {categories.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`shrink-0 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${category === cat ? 'bg-info-500 text-white' : 'bg-dark-200 text-gray-400 hover:bg-dark-50 hover:text-white'}`}>
                  {cat === 'all' ? 'All' : cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-dark-200 mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No tools found</h3>
            <p className="text-sm text-gray-500">
              {tools.length === 0 ? 'Tools will appear here once added by admin.' : 'Try a different search.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((tool, idx) => {
              const outOfStock = !tool.remote_connect && tool.source === 'inventory' && (stockMap[tool.id] ?? 0) === 0;
              return (
                <div key={tool.id} className="card card-hover animate-slide-up flex items-start gap-2.5 sm:gap-5 p-3 sm:p-4" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="w-16 h-16 sm:w-28 sm:h-28 shrink-0 rounded-xl bg-dark-400/40 border border-dark-50 flex items-center justify-center overflow-hidden">
                    {tool.image_url ? (
                      <img src={tool.image_url} alt={tool.name} loading="lazy" decoding="async" className="w-full h-full object-contain transition-transform duration-500 hover:scale-105" />
                    ) : (
                      <Tag className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className="break-words text-sm font-semibold leading-tight text-white sm:text-lg">{tool.name}</h3>
                      <span className="shrink-0 rounded-md bg-dark-400 px-2 py-0.5 text-[10px] font-semibold text-gray-400 sm:text-xs">{tool.duration}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="rounded-md bg-info-500/10 px-2 py-0.5 text-[11px] font-semibold text-info-400 sm:text-xs">
                        {currency === 'KES' ? `KES ${(tool.price_kes || tool.price_usd * usdtRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `USDT ${tool.price_usd.toFixed(2)}`}
                      </span>
                      <span className="rounded-md bg-warning-500/10 px-2 py-0.5 text-[11px] font-semibold text-warning-500 sm:text-xs">{tool.delivery_mode === 'minutes' ? 'MINUTES' : 'INSTANT'}</span>
                    </div>

                  </div>
                  <button onClick={() => onRent(tool)} disabled={outOfStock} className="shrink-0 rounded-md bg-info-500 px-2.5 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-info-400 disabled:cursor-not-allowed disabled:bg-dark-50 disabled:text-gray-500 sm:px-3 sm:py-2 sm:text-xs">
                    {outOfStock ? <><PackageX className="inline-block w-3.5 h-3.5 mr-1" />Out of Stock</> : 'Rent Now'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
