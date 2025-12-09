import React, { useState } from 'react';
import { Search, Globe, ArrowRight, BookOpen, Loader2 } from 'lucide-react';
import { getMarketInsights } from '../services/gemini';
import { InsightResult } from '../types';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import { Card, Button, Input } from './ui/DesignSystem';
import { containerVariants, itemVariants } from '../lib/utils';

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl mx-auto flex flex-col h-full min-h-[500px]">
      <div className="text-center mb-10 space-y-3">
        <h2 className="text-3xl font-bold text-white tracking-tight">Market Insights</h2>
        <p className="text-zinc-400 text-lg">Real-time data on salaries, skills, and hiring trends.</p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-12">
        <div className="relative group">
          <Search className="absolute left-4 top-4 w-5 h-5 text-zinc-500 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask about salaries, skills, or company culture..."
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 pl-12 pr-32 py-4 rounded-xl shadow-lg shadow-black/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-lg placeholder:text-zinc-600"
          />
          <div className="absolute right-2 top-2 bottom-2">
            <Button type="submit" disabled={loading || !query.trim()} className="h-full rounded-lg px-6">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Research"}
            </Button>
          </div>
        </div>
      </form>

      {result ? (
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="p-8 border-zinc-800 bg-zinc-900/50">
            <div className="prose prose-invert max-w-none prose-headings:text-zinc-100 prose-headings:font-bold prose-p:text-zinc-300 prose-strong:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300">
              <ReactMarkdown>{result.text}</ReactMarkdown>
            </div>
          </Card>

          {result.sources.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {result.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-blue-500/50 hover:bg-zinc-800 transition-all group"
                >
                  <div className="mt-0.5 w-6 h-6 bg-blue-500/10 rounded flex items-center justify-center text-blue-400">
                    <Globe className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate group-hover:text-blue-400 transition-colors">{source.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{source.uri}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0" />
                </a>
              ))}
            </div>
          )}
        </motion.div>
      ) : !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 space-y-4 opacity-50">
          <Search className="w-12 h-12" />
          <p>Enter a query to start researching.</p>
        </div>
      )}
    </motion.div>
  );
};

export default MarketInsights;