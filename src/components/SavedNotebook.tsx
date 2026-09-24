import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Search,
  Trash2,
  Copy,
  Check,
  Download,
  BookOpen,
  FileText,
  HelpCircle,
  Lightbulb,
  Trophy,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { SavedItem } from '../types';
import { deleteSavedItem, downloadAsFile, getSavedItems } from '../utils/storage';
import { MarkdownRenderer } from './MarkdownRenderer';
import { gradeLevelLabels } from './Navbar';

interface SavedNotebookProps {
  onSavedChange?: () => void;
  onOpenItem?: (item: SavedItem) => void;
}

export const SavedNotebook: React.FC<SavedNotebookProps> = ({ onSavedChange }) => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadItems = () => {
    const list = getSavedItems();
    setItems(list);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove this saved item from your notebook?')) {
      const updated = deleteSavedItem(id);
      setItems(updated);
      if (onSavedChange) onSavedChange();
      if (expandedId === id) setExpandedId(null);
    }
  };

  const handleCopy = (id: string, content: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (item: SavedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const safeTitle = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadAsFile(`edugenie_${safeTitle}.md`, `# ${item.title}\n\n${item.content}`);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.content.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'note':
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case 'qa':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'summary':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'concept':
        return <Lightbulb className="w-4 h-4 text-amber-600" />;
      case 'quiz_score':
        return <Trophy className="w-4 h-4 text-purple-600" />;
      default:
        return <Bookmark className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md mb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-indigo-200 mb-3 border border-white/15">
          <Bookmark className="w-3.5 h-3.5 text-amber-300" />
          <span>Personal Knowledge Repository</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              My EduGenie Notebook
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Access your bookmarked study notes, Q&A solutions, summaries, and quiz scores for
              offline review and exam prep.
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl px-4 py-2.5 border border-white/10 text-xs shrink-0 sm:text-right">
            <span className="text-slate-400">Total Saved: </span>
            <span className="font-bold text-white text-sm">{items.length} items</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved materials..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-hidden"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All' },
            { id: 'note', label: 'Notes' },
            { id: 'qa', label: 'Q&A' },
            { id: 'summary', label: 'Summaries' },
            { id: 'concept', label: 'Concepts' },
            { id: 'quiz_score', label: 'Scores' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                filterType === f.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto mb-4">
            <Bookmark className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Your Notebook is Empty</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
            Click the "Save to Notebook" bookmark button in any tool (Ask & Solve, Study Notes,
            Summaries, or Quizzes) to collect key learning resources here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map((item) => {
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all overflow-hidden"
              >
                {/* Item header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                      {getItemIcon(item.type)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          {item.type.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {item.subject}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-400">
                          {gradeLevelLabels[item.gradeLevel]?.label || item.gradeLevel}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">{item.date}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5 self-end sm:self-center">
                    <button
                      onClick={(e) => handleCopy(item.id, item.content, e)}
                      className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Copy content"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={(e) => handleDownload(item, e)}
                      className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors"
                      title="Export as markdown"
                    >
                      <Download className="w-4 h-4 text-indigo-600" />
                    </button>

                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-2 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Content preview */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40">
                    <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                      <MarkdownRenderer content={item.content} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
