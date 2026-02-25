import React, { useEffect, useMemo, useState } from "react";
import API from "@/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, History, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SearchResult {
  _id: string;
  pseudonym: string;
  isOnline?: boolean;
}

const HISTORY_KEY = "whispernet_explore_history";

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) {
      try {
        setHistory(JSON.parse(raw));
      } catch (_) {}
    }
  }, []);

  const saveHistory = (value: string) => {
    const next = [value, ...history.filter((h) => h !== value)].slice(0, 10);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const doSearch = async (q: string, save = false) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await API.get(`/users/search?q=${encodeURIComponent(trimmed)}`);
      setResults(data);
      if (save) saveHistory(trimmed);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      doSearch(trimmed, false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const subtitle = useMemo(() => {
    if (loading) return "Searching...";
    if (!query.trim()) return "Search by pseudonym";
    return `${results.length} result${results.length === 1 ? "" : "s"}`;
  }, [loading, query, results.length]);

  return (
    <div className="space-y-6">
      <div className="professional-panel p-6 bg-slate-900/70 border-slate-800">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Explore Shadows</h1>
        <p className="text-sm text-slate-400">{subtitle}</p>
        <div className="mt-4 flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pseudonym..."
            onKeyDown={(e) => e.key === "Enter" && doSearch(query, true)}
            className="bg-slate-950 border-slate-700 text-slate-100"
          />
          <Button onClick={() => doSearch(query, true)}>
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      <div className="professional-panel p-6 bg-slate-900/70 border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Results</h2>
        <div className="space-y-3">
          {results.length === 0 && <p className="text-sm text-slate-500">No results yet.</p>}
          {results.map((user) => (
            <div key={user._id} className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 p-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={`https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(user.pseudonym)}`} />
                  <AvatarFallback>{user.pseudonym[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-slate-100 font-medium">{user.pseudonym}</p>
                  <p className="text-xs text-slate-500">{user.isOnline ? "Online" : "Offline"}</p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => navigate("/chat", { state: { contact: user.pseudonym } })}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Message
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="professional-panel p-6 bg-slate-900/70 border-slate-800">
        <h2 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <History className="w-4 h-4" />
          Search History
        </h2>
        <div className="flex flex-wrap gap-2">
          {history.length === 0 && <p className="text-sm text-slate-500">No recent searches.</p>}
          {history.map((item) => (
            <Button key={item} size="sm" variant="outline" onClick={() => { setQuery(item); doSearch(item, true); }}>
              {item}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
