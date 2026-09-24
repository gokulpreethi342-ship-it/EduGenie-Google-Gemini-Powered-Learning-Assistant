import React from 'react';
import {
  Sparkles,
  GraduationCap,
  MessageSquare,
  BookOpen,
  FileText,
  HelpCircle,
  Lightbulb,
  Bookmark,
  ChevronDown,
} from 'lucide-react';
import { GradeLevel, Subject } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  gradeLevel: GradeLevel;
  setGradeLevel: (level: GradeLevel) => void;
  subject: Subject;
  setSubject: (subj: Subject) => void;
  savedCount: number;
}

export const gradeLevelLabels: Record<GradeLevel, { label: string; icon: string; desc: string }> = {
  elementary: { label: 'Elementary', icon: '🎒', desc: 'Ages 6-10 • Simple words & friendly examples' },
  middle_school: { label: 'Middle School', icon: '🏫', desc: 'Ages 11-14 • Clear, bite-sized step breakdowns' },
  high_school: { label: 'High School', icon: '🎓', desc: 'Ages 15-18 • Standard academic rigor & formulas' },
  undergrad: { label: 'College / Undergrad', icon: '🏛️', desc: 'Undergraduate • Deep theory & proofs' },
  graduate: { label: 'Advanced / Grad', icon: '🔬', desc: 'Graduate level • Technical rigor & mechanics' },
};

export const subjectsList: Subject[] = [
  'General',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'History',
  'Literature & Language',
  'Economics & Business',
];

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  gradeLevel,
  setGradeLevel,
  subject,
  setSubject,
  savedCount,
}) => {
  const tabs = [
    { id: 'ask', label: 'Ask & Solve', icon: MessageSquare, badge: null },
    { id: 'notes', label: 'Study Notes', icon: BookOpen, badge: 'Smart' },
    { id: 'summarize', label: 'Summarizer', icon: FileText, badge: null },
    { id: 'quiz', label: 'Quiz Arena', icon: HelpCircle, badge: 'Interactive' },
    { id: 'simplify', label: 'Concept Simplifier', icon: Lightbulb, badge: 'ELI5' },
    { id: 'notebook', label: 'My Notebook', icon: Bookmark, badge: savedCount > 0 ? String(savedCount) : null },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Top Bar with Brand, Learning Level, and Subject */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & Slogan */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('ask')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-900 via-indigo-700 to-violet-800 bg-clip-text text-transparent">
                  EduGenie
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Your personalized AI learning tutor & study assistant</p>
            </div>
          </div>

          {/* Context Controls: Learning Level & Subject Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Selector */}
            <div className="flex items-center space-x-1.5 bg-slate-100/90 rounded-lg px-2.5 py-1.5 border border-slate-200 text-xs">
              <span className="text-slate-400 font-medium">Subject:</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as Subject)}
                className="bg-transparent font-semibold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                {subjectsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Grade Level Selector */}
            <div className="relative group">
              <div className="flex items-center space-x-1.5 bg-indigo-50/90 hover:bg-indigo-100/70 transition-colors rounded-lg px-2.5 py-1.5 border border-indigo-200 text-xs text-indigo-950 font-medium cursor-pointer">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                <span className="text-indigo-600 font-semibold">Level:</span>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value as GradeLevel)}
                  className="bg-transparent font-bold text-indigo-900 focus:outline-hidden cursor-pointer"
                >
                  {(Object.keys(gradeLevelLabels) as GradeLevel[]).map((level) => (
                    <option key={level} value={level}>
                      {gradeLevelLabels[level].icon} {gradeLevelLabels[level].label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-indigo-500" />
              </div>

              {/* Hover preview tooltip */}
              <div className="hidden group-hover:block absolute right-0 top-full mt-1.5 w-64 bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl z-50 pointer-events-none">
                <div className="font-semibold text-amber-300 flex items-center gap-1 mb-1">
                  <span>{gradeLevelLabels[gradeLevel].icon}</span>
                  <span>{gradeLevelLabels[gradeLevel].label} Level Active</span>
                </div>
                <p className="text-slate-300 leading-snug">{gradeLevelLabels[gradeLevel].desc}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-300'
                    : 'text-slate-600 hover:text-indigo-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive
                        ? 'bg-indigo-500 text-white'
                        : tab.id === 'notebook'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
