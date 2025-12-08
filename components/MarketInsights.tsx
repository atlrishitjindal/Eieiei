import React, { useState } from 'react';
import { Search, Globe, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { getMarketInsights } from '../services/gemini';
import { InsightResult } from '../types';
import ReactMarkdown from 'react-markdown';

const MarketInsights: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InsightResult | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const data = await getMarketInsights(query);
      setResult(data);
    } catch (err) {
      console.error(err);
      // Basic error handling visual
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Market Insights</h2>
        <p className="text-slate-400">
          Discover salary trends, in-demand skills, and company news powered by Google Search Grounding.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-10 group">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., 'Senior React Developer salary in Austin, TX' or 'Tech hiring trends 2025'"
          className="w-full bg-slate-900 text-white pl-12 pr-32 py-4 rounded-full shadow-lg shadow-black/20 border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg placeholder:text-slate-600"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-full font-medium hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-900/20"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
        </button>
      </form>

      {result && (
        <div className="flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
          {/* Main Answer Card */}
          <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 p-8">
            <div className="prose prose-invert max-w-none prose-headings:font-bold prose-h3:text-lg prose-a:text-blue-400 hover:prose-a:underline prose-slate">
              <ReactMarkdown>{result.text}</ReactMarkdown>
            </div>
          </div>

          {/* Sources/Grounding Card */}
          {result.sources.length > 0 && (
            <div className="bg-slate-950/50 rounded-xl border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Globe className="w-5 h-5" />
                <h3 className="font-semibold">Sources & References</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.sources.map((source, idx) => (
                  <a
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-900/10 transition-all group"
                  >
                    <div className="mt-1 flex-none bg-blue-900/30 text-blue-400 rounded p-1">
                      <BookOpen className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-300 truncate group-hover:text-blue-400 transition-colors">
                        {source.title}
                      </p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {source.uri}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-600 pb-20">
          <div className="bg-slate-900 p-4 rounded-full mb-4 border border-slate-800">
             <Search className="w-8 h-8 opacity-50" />
          </div>
          <p>Enter a query to research the job market.</p>
        </div>
      )}
    </div>
  );
};

export default MarketInsights;