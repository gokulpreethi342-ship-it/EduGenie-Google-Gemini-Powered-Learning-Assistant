import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Download,
  Copy,
  Check,
  Bookmark,
  FileText,
  Printer,
  ListRestart,
  Tag,
  GraduationCap,
} from 'lucide-react';
import { GradeLevel, Subject } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { downloadAsFile, saveItemToNotebook } from '../utils/storage';
import { gradeLevelLabels } from './Navbar';

interface StudyNotesProps {
  gradeLevel: GradeLevel;
  subject: Subject;
  onSavedChange?: () => void;
}

const suggestedTopics: Record<string, string[]> = {
  Mathematics: ['Calculus: Derivatives & Chain Rule', 'Trigonometric Identities & Unit Circle', 'Linear Algebra: Eigenvalues & Vectors'],
  Physics: ['Newton’s 3 Laws of Motion', 'Electromagnetism & Faraday’s Law', 'Special Relativity & Time Dilation'],
  Chemistry: ['Periodic Trends & Electronegativity', 'Chemical Equilibrium & Le Chatelier', 'Organic Chemistry Functional Groups'],
  Biology: ['Photosynthesis: Light & Calvin Cycle', 'DNA Replication & Polymerase Steps', 'Cellular Respiration & Krebs Cycle'],
  'Computer Science': ['Big-O Complexity & Master Theorem', 'Graph Traversal: BFS vs DFS', 'RESTful API Architecture Principles'],
  History: ['Causes & Consequences of French Revolution', 'The Cold War & Nuclear Deterrence', 'The Industrial Revolution Transformation'],
  General: ['The Scientific Method & Experimental Design', 'Cognitive Biases & Critical Thinking', 'Climate Change Science & Carbon Cycles'],
};

export const StudyNotes: React.FC<StudyNotesProps> = ({ gradeLevel, subject, onSavedChange }) => {
  const [topic, setTopic] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [generatedNotes, setGeneratedNotes] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerateNotes = async (chosenTopic?: string) => {
    const t = (chosenTopic || topic).trim();
    if (!t || isLoading) return;

    if (chosenTopic) setTopic(chosenTopic);
    setIsLoading(true);
    setIsSaved(false);

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t,
          gradeLevel,
          subject,
          additionalDetails,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate notes (${response.status})`);
      }

      const data = await response.json();
      setGeneratedNotes(data.notes);
    } catch (err: any) {
      console.error('Error generating notes:', err);
      setGeneratedNotes(`⚠️ **Failed to generate notes.**\n\n${err.message || 'Please retry in a moment.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedNotes) return;
    navigator.clipboard.writeText(generatedNotes);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!generatedNotes) return;
    const filename = `${topic.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_notes.md`;
    downloadAsFile(filename, generatedNotes);
  };

  const handleSave = () => {
    if (!generatedNotes) return;
    saveItemToNotebook({
      type: 'note',
      title: topic || 'Study Notes',
      content: generatedNotes,
      subject,
      gradeLevel,
    });
    setIsSaved(true);
    if (onSavedChange) onSavedChange();
  };

  const handlePrint = () => {
    window.print();
  };

  const topicList = suggestedTopics[subject] || suggestedTopics.General;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 rounded-3xl p-6 sm:p-8 text-white shadow-md shadow-indigo-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-indigo-100 mb-3 border border-white/15">
              <BookOpen className="w-3.5 h-3.5 text-amber-300" />
              <span>Smart Revision Guides & Cheat Sheets</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AI Study Notes Generator
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-xl">
              Turn any academic topic into structured notes featuring core definitions, step-by-step
              mechanisms, real-world analogies, common pitfalls, and memory mnemonics.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-xs sm:text-right shrink-0">
            <div className="text-indigo-200">Current Target:</div>
            <div className="font-bold text-white text-sm">
              {gradeLevelLabels[gradeLevel].icon} {gradeLevelLabels[gradeLevel].label}
            </div>
            <div className="text-indigo-200 mt-1">{subject}</div>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Enter Topic or Chapter Title
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, The French Revolution, Navier-Stokes Equations, Binary Search Trees..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm font-medium transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Specific Focus or Syllabus Requirements (Optional)
            </label>
            <textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="e.g., Focus on AP Exam questions, emphasize math proofs, include formulas for kinetic energy..."
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm transition-all"
            />
          </div>

          {/* Quick suggestions */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              Popular topics in {subject}:
            </span>
            <div className="flex flex-wrap gap-2">
              {topicList.map((t) => (
                <button
                  key={t}
                  onClick={() => handleGenerateNotes(t)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50/70 hover:bg-indigo-100 text-indigo-800 font-medium border border-indigo-200/60 transition-all flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3 text-indigo-500" />
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => handleGenerateNotes()}
              disabled={!topic.trim() || isLoading}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all ${
                !topic.trim() || isLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Drafting Comprehensive Notes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Study Notes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Notes Output */}
      {generatedNotes && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 relative">
          {/* Notes Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span className="text-base">Comprehensive Study Guide</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                title="Copy markdown text"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                title="Download as .md file"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export (.md)</span>
              </button>

              <button
                onClick={handleSave}
                disabled={isSaved}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
                title="Save into My Notebook"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved to Notebook' : 'Save to Notebook'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
                title="Print or Save as PDF"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Print / PDF</span>
              </button>
            </div>
          </div>

          {/* Notes Content */}
          <div className="printable-area">
            <MarkdownRenderer content={generatedNotes} />
          </div>
        </div>
      )}
    </div>
  );
};
