import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Volume2,
  VolumeX,
  Layers,
  List,
  BookA,
  CreditCard,
  FileCheck,
} from 'lucide-react';
import { GradeLevel, Subject } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { saveItemToNotebook, speakText, stopSpeaking } from '../utils/storage';
import { gradeLevelLabels } from './Navbar';

interface MaterialSummarizerProps {
  gradeLevel: GradeLevel;
  subject: Subject;
  onSavedChange?: () => void;
}

type SummaryFormat = 'key_points' | 'executive' | 'glossary' | 'flashcards';

const sampleMaterials = [
  {
    title: 'Cellular Respiration & ATP',
    text: `Cellular respiration is a set of metabolic reactions and processes that take place in the cells of organisms to convert biochemical energy from nutrients into adenosine triphosphate (ATP), and then release waste products. The catabolic reactions involved in respiration include glycolysis, the citric acid cycle (Krebs cycle), and oxidative phosphorylation via the electron transport chain. Glycolysis occurs in the cytosol without oxygen, breaking glucose down into two molecules of pyruvate, yielding a net of 2 ATP and 2 NADH. Under aerobic conditions, pyruvate enters the mitochondrial matrix, where it is converted into Acetyl-CoA. Acetyl-CoA enters the citric acid cycle, producing CO2, NADH, FADH2, and ATP. Finally, the electron transport chain in the inner mitochondrial membrane uses high-energy electrons from NADH and FADH2 to create a proton gradient across the membrane. Protons pass back into the matrix through ATP synthase, a rotary motor enzyme, generating roughly 28 to 32 ATP molecules per glucose molecule. Oxygen acts as the terminal electron acceptor, bonding with protons to form water. Without oxygen, oxidative phosphorylation halts, and cells must rely on fermentation, which produces far less ATP and accumulates lactic acid or ethanol.`,
  },
  {
    title: 'Newtonian Gravitation & Orbits',
    text: `Sir Isaac Newton formulated the Law of Universal Gravitation in 1687, stating that every particle attracts every other particle in the universe with a force proportional to the product of their masses and inversely proportional to the square of the distance between their centers: F = G*(m1*m2)/r^2. G is the gravitational constant (6.674 x 10^-11 N m^2/kg^2). This inverse-square relationship means that doubling the distance between two celestial objects decreases their gravitational attraction by a factor of four. Newton demonstrated that Kepler's laws of planetary motion—stating that planets move in elliptical orbits with the Sun at one focus, sweep out equal areas in equal times, and have orbital periods whose squares are proportional to the cubes of the semi-major axes—were a mathematical consequence of this single inverse-square law. When an object achieves orbital velocity around a planet, it is effectively in perpetual free fall; its forward velocity causes the curved path of its fall to match the curvature of the planet below. Escape velocity, the minimum speed required to break free from a gravitational field without further propulsion, is given by v_esc = sqrt(2GM/r).`,
  },
];

export const MaterialSummarizer: React.FC<MaterialSummarizerProps> = ({
  gradeLevel,
  subject,
  onSavedChange,
}) => {
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<SummaryFormat>('key_points');
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSummarize = async () => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    setIsSaved(false);
    stopSpeaking();
    setIsSpeaking(false);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          format,
          gradeLevel,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (err: any) {
      console.error('Error generating summary:', err);
      setSummary(`⚠️ **Unable to summarize.**\n\n${err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!summary) return;
    const titleSnippet = content.slice(0, 45) + (content.length > 45 ? '...' : '');
    saveItemToNotebook({
      type: 'summary',
      title: `Summary: ${titleSnippet}`,
      content: summary,
      subject,
      gradeLevel,
      metadata: { format },
    });
    setIsSaved(true);
    if (onSavedChange) onSavedChange();
  };

  const handleToggleSpeak = () => {
    if (!summary) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakText(summary, () => setIsSpeaking(false));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md mb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-emerald-100 mb-3 border border-white/15">
          <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span>High-Yield Content Distillation</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Study Material Summarizer
        </h1>
        <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
          Paste dense textbook chapters, lecture transcripts, or articles. EduGenie distills the
          essential ideas into key points, executive summaries, glossaries, or active-recall flashcards.
        </p>
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs mb-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Paste Study Text / Lecture Notes
            </label>
            <span className="text-xs text-slate-400">
              {content.length > 0 ? `${content.split(/\s+/).filter(Boolean).length} words` : 'Any length'}
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste your textbook chapter, article excerpt, or lecture transcript here..."
            rows={6}
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 text-slate-800 text-sm leading-relaxed transition-all"
          />
        </div>

        {/* Format Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Choose Summary Output Format:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'key_points', label: 'Key Points', icon: List, desc: 'Bulleted insights' },
              { id: 'executive', label: 'Executive Summary', icon: Layers, desc: '2-3 paragraph synthesis' },
              { id: 'glossary', label: 'Glossary & Terms', icon: BookA, desc: 'Key definitions' },
              { id: 'flashcards', label: 'Flashcard Q&As', icon: CreditCard, desc: 'Active recall deck' },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id as SummaryFormat)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-1 ring-emerald-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                  <div className="text-xs font-bold">{f.label}</div>
                  <div className="text-[10px] text-slate-500">{f.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sample text buttons */}
        <div className="flex flex-wrap items-center justify-between pt-2 gap-2">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Or try sample:</span>
            {sampleMaterials.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setContent(s.text)}
                className="underline hover:text-emerald-700 font-medium"
              >
                {s.title}
              </button>
            ))}
          </div>

          <button
            onClick={handleSummarize}
            disabled={!content.trim() || isLoading}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all ${
              !content.trim() || isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200'
            }`}
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                <span>Distilling Insights...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Summarize Material</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Output */}
      {summary && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
            <div className="flex items-center space-x-2 text-emerald-950 font-bold">
              <FileText className="w-5 h-5 text-emerald-600" />
              <span>EduGenie Summary Result</span>
              <span className="text-xs text-slate-400 font-normal">
                ({gradeLevelLabels[gradeLevel].label} Level)
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleToggleSpeak}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isSpeaking
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>Stop Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-slate-600" />
                    <span>Listen</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors"
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
                onClick={handleSave}
                disabled={isSaved}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>{isSaved ? 'Saved' : 'Save to Notebook'}</span>
              </button>
            </div>
          </div>

          <MarkdownRenderer content={summary} />
        </div>
      )}
    </div>
  );
};
