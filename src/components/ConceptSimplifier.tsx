import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  HelpCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Layers,
  HeartHandshake,
  Workflow,
  Bookmark,
} from 'lucide-react';
import { GradeLevel, SimplifiedConcept, Subject } from '../types';
import { saveItemToNotebook } from '../utils/storage';
import { gradeLevelLabels } from './Navbar';

interface ConceptSimplifierProps {
  gradeLevel: GradeLevel;
  subject: Subject;
  onSavedChange?: () => void;
}

const popularConcepts = [
  'Schrödinger’s Cat & Quantum Superposition',
  'Neural Networks & Gradient Descent',
  'Central Banking & Inflation Control',
  'CRISPR-Cas9 Gene Editing',
  'Special Relativity & Time Dilation',
  'Recursion in Computer Programming',
];

export const ConceptSimplifier: React.FC<ConceptSimplifierProps> = ({
  gradeLevel,
  subject,
  onSavedChange,
}) => {
  const [concept, setConcept] = useState('');
  const [audienceFocus, setAudienceFocus] = useState('Visual & Everyday Analogy');
  const [result, setResult] = useState<SimplifiedConcept | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSimplify = async (customConcept?: string) => {
    const c = (customConcept || concept).trim();
    if (!c || isLoading) return;

    if (customConcept) setConcept(customConcept);
    setIsLoading(true);
    setResult(null);
    setShowAnswer(false);
    setIsSaved(false);

    try {
      const response = await fetch('/api/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: c,
          gradeLevel,
          audienceFocus,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to simplify concept (${response.status})`);
      }

      const data: SimplifiedConcept = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error simplifying concept:', err);
      alert(`Could not simplify concept: ${err.message || 'Please retry.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!result) return;
    saveItemToNotebook({
      type: 'concept',
      title: `Concept: ${result.conceptTitle}`,
      content: `${result.oneSentenceSummary}\n\n**Everyday Analogy:** ${result.everydayAnalogy.title}\n${result.everydayAnalogy.story}\n\n**Why it Matters:** ${result.whyItMatters}`,
      subject,
      gradeLevel,
    });
    setIsSaved(true);
    if (onSavedChange) onSavedChange();
  };

  // Support both stepByStepIntuition and stepStepIntuition from response
  const steps = result?.stepByStepIntuition || result?.stepStepIntuition || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 rounded-3xl p-6 sm:p-8 text-white shadow-md mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-amber-100 border border-white/15">
            <Lightbulb className="w-3.5 h-3.5 text-amber-200" />
            <span>Intuition First • Mental Models</span>
          </div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/30 backdrop-blur-xs text-[11px] font-semibold text-amber-200 border border-amber-300/20">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>Fast Distillation Engine (LaMini / Flash)</span>
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Concept Explanation & Simplifier
        </h1>
        <p className="text-amber-100 text-sm mt-1 max-w-xl">
          Tackle intimidating academic concepts through vivid real-world analogies, step-by-step
          intuitive breakdowns, parallel mapping, and practical mental models.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            What difficult concept would you like simplified?
          </label>
          <input
            type="text"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="e.g., How does blockchain work? Explain Black Holes, How does an airplane wing create lift?"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-100 text-slate-800 text-sm font-medium transition-all"
          />
        </div>

        {/* Audience Focus */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Learning Preference:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              'Visual & Everyday Analogy',
              'Logical & Step-by-Step Flow',
              'Real-World Impact & Applications',
            ].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setAudienceFocus(f)}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-left ${
                  audienceFocus === f
                    ? 'border-amber-600 bg-amber-50 text-amber-900 ring-1 ring-amber-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Picks */}
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Try breaking down:
          </span>
          <div className="flex flex-wrap gap-2">
            {popularConcepts.map((c) => (
              <button
                key={c}
                onClick={() => handleSimplify(c)}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-medium border border-amber-200/60 transition-all flex items-center space-x-1"
              >
                <span>{c}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleSimplify()}
            disabled={!concept.trim() || isLoading}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all ${
              !concept.trim() || isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200'
            }`}
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Crafting Intuitive Mental Model...</span>
              </>
            ) : (
              <>
                <Lightbulb className="w-4 h-4" />
                <span>Simplify Concept</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
                Mental Model & Intuition Breakdown
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {result.conceptTitle}
              </h2>
            </div>

            <button
              onClick={handleSave}
              disabled={isSaved}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved to Notebook' : 'Save to Notebook'}</span>
            </button>
          </div>

          {/* One-Sentence Punchline */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-amber-950 font-medium text-sm sm:text-base leading-relaxed">
            <span className="font-bold text-amber-800 block text-xs uppercase tracking-wider mb-1">
              💡 The Core Intuition in One Sentence:
            </span>
            {result.oneSentenceSummary}
          </div>

          {/* Everyday Analogy Story Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 to-purple-50/60 border border-indigo-100 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-900 font-bold text-base">
              <HeartHandshake className="w-5 h-5 text-indigo-600" />
              <span>The Everyday Analogy: {result.everydayAnalogy.title}</span>
            </div>
            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {result.everydayAnalogy.story}
            </p>

            {/* Parallel Mapping */}
            {result.everydayAnalogy.parallelMapping && (
              <div className="mt-4 pt-3 border-t border-indigo-100/80">
                <span className="text-xs font-bold text-indigo-900 block mb-2">
                  Parallel Comparison:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.everydayAnalogy.parallelMapping.map((map, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white/90 rounded-xl border border-indigo-100 text-xs space-y-1 shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-amber-700">Analogy: {map.analogyPart}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-indigo-700">Concept: {map.realConceptPart}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-snug">{map.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step-by-Step Intuition */}
          {steps.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 font-bold text-slate-900 text-base">
                <Workflow className="w-5 h-5 text-amber-600" />
                <span>How It Works Step-by-Step</span>
              </div>
              <div className="space-y-2.5">
                {steps.map((st) => (
                  <div
                    key={st.stepNumber}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start space-x-3.5"
                  >
                    <div className="w-7 h-7 rounded-xl bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {st.stepNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{st.title}</h4>
                      <p className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed">
                        {st.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why It Matters */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs sm:text-sm text-emerald-950">
            <span className="font-bold text-emerald-900 block mb-1">
              🌍 Why Does This Matter in the Real World?
            </span>
            <p className="leading-relaxed text-emerald-900">{result.whyItMatters}</p>
          </div>

          {/* Mini Check Question */}
          {result.miniCheckQuestion && (
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4" />
                  <span>Quick Intuition Check</span>
                </div>
                <button
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="text-xs text-indigo-300 hover:text-white flex items-center space-x-1"
                >
                  {showAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showAnswer ? 'Hide Solution' : 'Reveal Solution'}</span>
                </button>
              </div>

              <p className="text-sm font-semibold">{result.miniCheckQuestion.question}</p>

              {showAnswer && (
                <div className="mt-2 p-3 bg-white/10 rounded-xl text-xs text-amber-200 border border-white/10 animate-fade-in">
                  <span className="font-bold text-white">Answer: </span>
                  {result.miniCheckQuestion.answer}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
