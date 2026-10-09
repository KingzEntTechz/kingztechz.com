import { useState, useMemo } from 'react';
import { Clock, Zap, Key, Search, Tag } from 'lucide-react';
import type { Tool } from '@/lib/supabase';

type ToolsProps = {
  tools: Tool[];
  onRent: (tool: Tool) => void;
};

export default function Tools({ tools, onRent }: ToolsProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const categories = useMemo(() => {
    const cats = new Set(tools.map((t) => t.category || 'General'));
    return ['all', ...Array.from(cats)];
  }, [tools]);

  const filtered = useMemo(() => {
    return tools
      .filter((t) => t.is_active)
      .filter((t) => category === 'all' || (t.category || 'General') === category)
      .filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [tools, search, category]);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="bg-gradient-to-br from-dark-500 to-dark-300 border-b border-dark-50 py-12 sm:py-16 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <span className="inline-block bg-accent-500 text-white px-5 py-1.5 rounded-full text-sm font-semibold mb-4">
            Instant 24/7 Auto-Delivery
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Our Rental Tools</h1>
          <p className="text-gray-400 text-lg">Get instant ID/password automatically after payment. No waiting!</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="section-title mb-4">Available Tools</h2>
        <p className="text-center text-gray-400 mb-8">Select a tool to rent instantly</p>

        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
              placeholder="Search tools..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  category === cat
                    ? 'bg-info-500 text-white'
                    : 'bg-dark-200 text-gray-400 hover:bg-dark-50 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'All Tools' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tools grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-dark-200 mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No tools found</h3>
            <p className="text-gray-500">
              {tools.length === 0
                ? 'Tools will appear here once the admin adds them to the inventory.'
                : 'Try a different search or category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((tool, idx) => (
              <div
                key={tool.id}
                className="card card-hover animate-slide-up flex flex-col"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                {/* Tool header */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-dark-400/50 border-b border-dark-50">
                  <span className="text-sm font-semibold text-gray-200 truncate">{tool.name}</span>
                  <span className="text-xs font-semibold text-info-500 bg-info-500/10 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                    {tool.duration}
                  </span>
                </div>

                {/* Tool image */}
                <div className="h-40 flex items-center justify-center bg-dark-400/30 overflow-hidden">
                  {tool.image_url ? (
                    <img
                      src={tool.image_url}
                      alt={tool.name}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-dark-50">
                      <Tag className="w-8 h-8 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Tool body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold text-white mb-3">{tool.name}</h3>

                  {tool.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">{tool.description}</p>
                  )}

                  <div className="space-y-1.5 mb-4 flex-1">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Clock className="w-4 h-4 text-info-500 shrink-0" />
                      Duration: {tool.duration}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Zap className="w-4 h-4 text-accent-500 shrink-0" />
                      Delivery: Instant
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Key className="w-4 h-4 text-success-500 shrink-0" />
                      User ID & Password
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline justify-between mb-4 pb-3 border-b border-dashed border-dark-50">
                    <span className="text-2xl font-bold text-accent-500">${tool.price_usd}</span>
                    <span className="text-sm font-semibold text-gray-300">
                      KES {tool.price_kes.toLocaleString()}
                    </span>
                  </div>

                  <button onClick={() => onRent(tool)} className="btn-primary w-full">
                    Rent Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
