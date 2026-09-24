import React, { useState, useEffect } from 'react';
import { GradeLevel, Subject } from './types';
import { Navbar, gradeLevelLabels } from './components/Navbar';
import { AskSolver } from './components/AskSolver';
import { StudyNotes } from './components/StudyNotes';
import { MaterialSummarizer } from './components/MaterialSummarizer';
import { QuizArena } from './components/QuizArena';
import { ConceptSimplifier } from './components/ConceptSimplifier';
import { LearningRoadmap } from './components/LearningRoadmap';
import { SavedNotebook } from './components/SavedNotebook';
import { getSavedItems } from './utils/storage';
import { Sparkles, Heart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('ask');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>('high_school');
  const [subject, setSubject] = useState<Subject>('General');
  const [savedCount, setSavedCount] = useState<number>(0);

  const refreshSavedCount = () => {
    setSavedCount(getSavedItems().length);
  };

  useEffect(() => {
    refreshSavedCount();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Sticky Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        gradeLevel={gradeLevel}
        setGradeLevel={setGradeLevel}
        subject={subject}
        setSubject={setSubject}
        savedCount={savedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {activeTab === 'ask' && (
          <AskSolver
            gradeLevel={gradeLevel}
            subject={subject}
            onSavedChange={refreshSavedCount}
          />
        )}

        {activeTab === 'notes' && (
          <StudyNotes
            gradeLevel={gradeLevel}
            subject={subject}
            onSavedChange={refreshSavedCount}
          />
        )}

        {activeTab === 'summarize' && (
          <MaterialSummarizer
            gradeLevel={gradeLevel}
            subject={subject}
            onSavedChange={refreshSavedCount}
          />
        )}

        {activeTab === 'quiz' && (
          <QuizArena
            gradeLevel={gradeLevel}
            subject={subject}
            onSavedChange={refreshSavedCount}
          />
        )}

        {activeTab === 'simplify' && (
          <ConceptSimplifier
            gradeLevel={gradeLevel}
            subject={subject}
            onSavedChange={refreshSavedCount}
          />
        )}

        {activeTab === 'roadmap' && (
          <LearningRoadmap
            gradeLevel={gradeLevel}
            subject={subject}
            onSavedChange={refreshSavedCount}
          />
        )}

        {activeTab === 'notebook' && (
          <SavedNotebook onSavedChange={refreshSavedCount} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xs py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5">
            <span className="font-bold text-indigo-900">EduGenie</span>
            <span>— AI Learning Assistant powered by</span>
            <span className="font-semibold text-indigo-600 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Google Gemini
            </span>
          </div>

          <div className="text-slate-400">
            Active Mode: <span className="font-semibold text-slate-700">{gradeLevelLabels[gradeLevel].label}</span>
            {subject !== 'General' && <span> • {subject}</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
