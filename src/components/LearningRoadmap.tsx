import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  ArrowRight,
  BookOpen,
  Video,
  FileText,
  Bookmark,
  CheckCircle,
  ExternalLink,
  Layers,
  Target,
  Award,
  Clock,
  Sparkle,
  Copy,
  Check,
} from 'lucide-react';
import { GradeLevel, LearningPathData, Subject } from '../types';
import { saveItemToNotebook } from '../utils/storage';
import { gradeLevelLabels } from './Navbar';

interface LearningRoadmapProps {
  gradeLevel: GradeLevel;
  subject: Subject;
  onSavedChange?: () => void;
}

const suggestedTopics: Record<string, string[]> = {
  'Computer Science': [
    'Full-Stack Web Development',
    'Data Structures & Algorithms',
    'Machine Learning & Neural Networks',
    'Cybersecurity & Ethical Hacking',
  ],
  Mathematics: [
    'Calculus (Single to Multivariable)',
    'Linear Algebra & Matrix Operations',
    'Probability & Statistics for Data Science',
    'Discrete Mathematics',
  ],
  Physics: [
    'Classical Mechanics & Dynamics',
    'Electromagnetism & Circuits',
    'Quantum Mechanics Foundations',
    'Thermodynamics & Statistical Physics',
  ],
  General: [
    'Critical Thinking & Cognitive Biases',
    'Financial Literacy & Investing',
    'Public Speaking & Rhetoric',
    'Prompt Engineering & Generative AI',
  ],
};

export const LearningRoadmap: React.FC<LearningRoadmapProps> = ({
  gradeLevel,
  subject,
  onSavedChange,
}) => {
  const [topic, setTopic] = useState('');
  const [currentProficiency, setCurrentProficiency] = useState<'Beginner' | 'Intermediate'>('Beginner');
  const [targetGoal, setTargetGoal] = useState('');
  const [roadmap, setRoadmap] = useState<LearningPathData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [copiedResource, setCopiedResource] = useState<string | null>(null);

  const handleGenerate = async (selectedTopic?: string) => {
    const t = (selectedTopic || topic).trim();
    if (!t || isLoading) return;

    if (selectedTopic) setTopic(selectedTopic);
    setIsLoading(true);
    setRoadmap(null);
    setIsSaved(false);

    try {
      const response = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t,
          gradeLevel,
          subject,
          currentProficiency,
          targetGoal: targetGoal.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate roadmap (${response.status})`);
      }

      const data: LearningPathData = await response.json();
      setRoadmap(data);
    } catch (err: any) {
      console.error('Roadmap error:', err);
      alert(`Could not build learning path: ${err.message || 'Please retry.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToNotebook = () => {
    if (!roadmap) return;

    const milestonesText = roadmap.milestones
      .map(
        (m) =>
          `### ${m.stage}: ${m.milestoneTitle} (${m.estimatedDuration})\n` +
          `**Core Concepts:**\n${m.coreConcepts.map((c) => `- ${c}`).join('\n')}\n\n` +
          `**Actionable Projects:**\n${m.actionableTasks.map((t) => `- ${t}`).join('\n')}\n`
      )
      .join('\n\n');

    const resourcesText = roadmap.recommendedResources
      .map((r) => `- [${r.type.toUpperCase()}] **${r.title}** (${r.difficulty}): ${r.description}`)
      .join('\n');

    const content = `# Learning Roadmap: ${roadmap.topic}\n\n${roadmap.overview}\n\n## Prerequisites\n${roadmap.prerequisites
      .map((p) => `- ${p}`)
      .join('\n')}\n\n## Mastery Milestones\n${milestonesText}\n\n## Recommended Resources\n${resourcesText}`;

    saveItemToNotebook({
      type: 'learning_path',
      title: `Roadmap: ${roadmap.topic}`,
      content,
      subject,
      gradeLevel,
      metadata: { targetLevel: roadmap.targetLevel },
    });

    setIsSaved(true);
    if (onSavedChange) onSavedChange();
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'book':
        return <BookOpen className="w-4 h-4 text-amber-600" />;
      case 'article':
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-indigo-500" />;
    }
  };

  const activeSuggestions = suggestedTopics[subject] || suggestedTopics['General'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md mb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-violet-200 mb-3 border border-white/15">
          <Compass className="w-3.5 h-3.5 text-amber-300" />
          <span>Curriculum Architect • Beginner to Advanced</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Personalized Learning Path & Resource Guide
        </h1>
        <p className="text-violet-200 text-sm mt-1 max-w-2xl">
          Generate an end-to-end learning roadmap structured from foundational concepts to advanced
          mastery, complete with curated videos, books, and articles tailored to your goals.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-6 space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            What topic or skill do you want to master?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Quantum Computing, Organic Chemistry, Neural Networks, Macroeconomics"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-800 text-sm font-medium transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          />
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Your Current Starting Level:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Beginner', 'Intermediate'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setCurrentProficiency(lvl)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all text-center ${
                    currentProficiency === lvl
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  {lvl === 'Beginner' ? '🌱 Complete Beginner' : '🌿 Some Foundations'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Specific Goal or Exam Target (Optional):
            </label>
            <input
              type="text"
              value={targetGoal}
              onChange={(e) => setTargetGoal(e.target.value)}
              placeholder="e.g. Pass AP exam, build an AI side-project, prepare for university"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-indigo-600 focus:outline-hidden text-xs text-slate-700"
            />
          </div>
        </div>

        {/* Quick Picks */}
        <div>
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Popular Learning Paths in {subject}:
          </span>
          <div className="flex flex-wrap gap-2">
            {activeSuggestions.map((sug) => (
              <button
                key={sug}
                onClick={() => handleGenerate(sug)}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium transition-all"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleGenerate()}
            disabled={!topic.trim() || isLoading}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all ${
              !topic.trim() || isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
            }`}
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-white" />
                <span>Designing Learning Roadmap...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Generate Roadmap & Resources</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Roadmap Output */}
      {roadmap && (
        <div className="space-y-6">
          {/* Top Banner with Save */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-indigo-600 mb-1">
                  <span>Custom Learning Path</span>
                  <span>•</span>
                  <span>{gradeLevelLabels[gradeLevel]?.label || gradeLevel}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {roadmap.topic}
                </h2>
              </div>

              <button
                onClick={handleSaveToNotebook}
                disabled={isSaved}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                  isSaved
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Bookmark className="w-4 h-4" />
                <span>{isSaved ? 'Saved to Notebook' : 'Save Roadmap'}</span>
              </button>
            </div>

            {/* Executive Overview */}
            <p className="text-slate-700 text-sm leading-relaxed mt-4">
              {roadmap.overview}
            </p>

            {/* Prerequisites */}
            {roadmap.prerequisites && roadmap.prerequisites.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Recommended Prerequisites:
                </span>
                <div className="flex flex-wrap gap-2">
                  {roadmap.prerequisites.map((p, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 font-medium"
                    >
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Stepped Milestones (Beginner -> Intermediate -> Advanced) */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-lg px-1">
              <Target className="w-5 h-5 text-indigo-600" />
              <span>Roadmap Progression: Beginner to Advanced</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {roadmap.milestones.map((m, idx) => {
                const badgeColor =
                  m.stage === 'Beginner'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : m.stage === 'Intermediate'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-purple-100 text-purple-800 border-purple-200';

                return (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-7 relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-xs uppercase font-extrabold px-3 py-1 rounded-full border ${badgeColor}`}
                        >
                          Stage {idx + 1}: {m.stage}
                        </span>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900">
                          {m.milestoneTitle}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Est. Duration: {m.estimatedDuration}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs sm:text-sm">
                      {/* Concepts Mastered */}
                      <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                        <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                          Core Concepts Mastered
                        </span>
                        <ul className="space-y-1.5">
                          {m.coreConcepts.map((concept, cIdx) => (
                            <li key={cIdx} className="flex items-start space-x-2 text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                              <span>{concept}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actionable Projects & Tasks */}
                      <div className="space-y-2 bg-indigo-50/40 p-4 rounded-2xl border border-indigo-100/60">
                        <span className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] block flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          Hands-On Projects & Practice Tasks
                        </span>
                        <ul className="space-y-1.5">
                          {m.actionableTasks.map((task, tIdx) => (
                            <li key={tIdx} className="flex items-start space-x-2 text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Curated Resource Recommendations */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-lg">
              <Award className="w-5 h-5 text-amber-500" />
              <span>Curated Learning Resources (Videos, Articles & Books)</span>
            </div>
            <p className="text-xs text-slate-500">
              Hand-picked educational media based on your topic and academic level. Click to search
              or explore.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
              {roadmap.recommendedResources.map((res, rIdx) => {
                const searchLink = `https://www.google.com/search?q=${encodeURIComponent(
                  res.searchQueryOrUrl || res.title
                )}`;

                return (
                  <div
                    key={rIdx}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-indigo-300 bg-slate-50/50 hover:bg-white transition-all space-y-2 flex flex-col justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <div className="p-1.5 rounded-lg bg-white shadow-2xs border border-slate-200">
                            {getResourceIcon(res.type)}
                          </div>
                          <span className="text-[11px] uppercase font-bold tracking-wider text-slate-500">
                            {res.type}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                          {res.difficulty}
                        </span>
                      </div>

                      <h4 className="font-bold text-slate-900 text-sm">{res.title}</h4>
                      <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                        {res.description}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 mt-2">
                      <span className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        Query: {res.searchQueryOrUrl || res.title}
                      </span>
                      <a
                        href={searchLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>Explore</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
