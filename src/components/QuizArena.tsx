import React, { useState } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Trophy,
  Award,
  Bookmark,
  Share2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { GradeLevel, QuizData, QuizQuestion, Subject } from '../types';
import { saveItemToNotebook } from '../utils/storage';
import { gradeLevelLabels } from './Navbar';

interface QuizArenaProps {
  gradeLevel: GradeLevel;
  subject: Subject;
  onSavedChange?: () => void;
}

export const QuizArena: React.FC<QuizArenaProps> = ({ gradeLevel, subject, onSavedChange }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);

  // Active quiz state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showHints, setShowHints] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleGenerateQuiz = async (chosenTopic?: string) => {
    const t = (chosenTopic || topic).trim();
    if (!t || isLoading) return;

    if (chosenTopic) setTopic(chosenTopic);
    setIsLoading(true);
    setQuiz(null);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setShowHints({});
    setIsCompleted(false);
    setIsSaved(false);

    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: t,
          gradeLevel,
          difficulty,
          numQuestions,
          subject,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to load quiz (${response.status})`);
      }

      const data: QuizData = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('Received empty question set.');
      }
      setQuiz(data);
    } catch (err: any) {
      console.error('Quiz creation error:', err);
      alert(`Could not generate quiz: ${err.message || 'Please retry with another topic'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    // Only allow selecting if not already answered
    if (selectedAnswers[questionIndex] !== undefined) return;
    setSelectedAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentIndex < quiz.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Quiz completed!
      setIsCompleted(true);
      calculateAndCelebrate();
    }
  };

  const calculateAndCelebrate = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) {
        correct++;
      }
    });

    const percent = Math.round((correct / quiz.questions.length) * 100);
    if (percent >= 70) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore in non-browser env
      }
    }
  };

  const handleSaveScore = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) correct++;
    });

    saveItemToNotebook({
      type: 'quiz_score',
      title: `Quiz: ${quiz.quizTitle || quiz.topic}`,
      content: `Score: ${correct}/${quiz.questions.length} (${Math.round((correct / quiz.questions.length) * 100)}%) on ${quiz.topic} (${gradeLevelLabels[gradeLevel].label} Level)`,
      subject,
      gradeLevel,
      metadata: {
        score: correct,
        total: quiz.questions.length,
        difficulty,
      },
    });
    setIsSaved(true);
    if (onSavedChange) onSavedChange();
  };

  // Compute current score
  const totalQuestions = quiz?.questions.length || 0;
  const currentQuestion = quiz?.questions[currentIndex];
  const isCurrentAnswered = currentQuestion && selectedAnswers[currentIndex] !== undefined;

  let correctCount = 0;
  if (quiz) {
    quiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswerIndex) correctCount++;
    });
  }

  const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Quiz Banner */}
      <div className="bg-gradient-to-r from-violet-700 via-purple-700 to-indigo-800 rounded-3xl p-6 sm:p-8 text-white shadow-md mb-6">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-purple-100 mb-3 border border-white/15">
          <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
          <span>Active Recall & Knowledge Assessment</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Interactive Quiz Arena
        </h1>
        <p className="text-purple-100 text-sm mt-1 max-w-xl">
          Test your mastery with AI-generated questions adapted to your learning level. Get instant
          hints, comprehensive explanations, and performance insights.
        </p>
      </div>

      {/* Quiz Generator Setup Form */}
      {!quiz ? (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              What topic would you like to test?
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Photosynthesis, The Solar System, Calculus Derivatives, Python Data Structures..."
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-violet-600 focus:ring-2 focus:ring-violet-100 text-slate-800 text-sm font-medium transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Challenge Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all ${
                      difficulty === d
                        ? 'border-violet-600 bg-violet-50 text-violet-800 ring-1 ring-violet-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Number of Questions
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[3, 5, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNumQuestions(n)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      numQuestions === n
                        ? 'border-violet-600 bg-violet-50 text-violet-800 ring-1 ring-violet-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {n} Questions
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick topics */}
          <div>
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              Quick test topics in {subject}:
            </span>
            <div className="flex flex-wrap gap-2">
              {['Fundamental Concepts', 'Key Terminology & Definitions', 'Problem Solving & Calculations', 'Real-world Applications'].map((t) => (
                <button
                  key={t}
                  onClick={() => handleGenerateQuiz(`${subject}: ${t}`)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-violet-50/70 hover:bg-violet-100 text-violet-800 font-medium border border-violet-200/60 transition-all"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={() => handleGenerateQuiz()}
              disabled={!topic.trim() || isLoading}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all ${
                !topic.trim() || isLoading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200'
              }`}
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Generating Interactive Quiz...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Start Quiz</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : !isCompleted && currentQuestion ? (
        /* Active Quiz Question Screen */
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Header & Progress */}
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-2">
              <span className="text-violet-700 font-bold uppercase tracking-wider">
                {quiz.quizTitle || quiz.topic}
              </span>
              <span>
                Question {currentIndex + 1} of {totalQuestions}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-violet-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Hint Section */}
          <div>
            {showHints[currentIndex] ? (
              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <span className="font-bold">Hint: </span>
                  {currentQuestion.hint}
                </div>
              </div>
            ) : (
              !isCurrentAnswered && (
                <button
                  onClick={() => setShowHints((prev) => ({ ...prev, [currentIndex]: true }))}
                  className="inline-flex items-center space-x-1.5 text-xs text-amber-700 hover:text-amber-800 font-semibold"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Need a hint?</span>
                </button>
              )
            )}
          </div>

          {/* 4 Choices */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, optIdx) => {
              const selectedOpt = selectedAnswers[currentIndex];
              const isSelected = selectedOpt === optIdx;
              const isCorrect = currentQuestion.correctAnswerIndex === optIdx;

              let styleClasses =
                'border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 text-slate-800';

              if (isCurrentAnswered) {
                if (isCorrect) {
                  styleClasses = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500 font-semibold';
                } else if (isSelected && !isCorrect) {
                  styleClasses = 'border-rose-400 bg-rose-50 text-rose-950 ring-1 ring-rose-400';
                } else {
                  styleClasses = 'border-slate-200 opacity-60 text-slate-500';
                }
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(currentIndex, optIdx)}
                  disabled={isCurrentAnswered}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start space-x-3 transition-all ${styleClasses}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isCurrentAnswered && isCorrect
                        ? 'bg-emerald-600 text-white'
                        : isCurrentAnswered && isSelected
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </div>
                  <div className="flex-1 text-sm font-medium">{option}</div>
                  {isCurrentAnswered && (
                    <div className="shrink-0 mt-0.5">
                      {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                      {isSelected && !isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation if answered */}
          {isCurrentAnswered && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs sm:text-sm text-slate-800 space-y-1">
              <div className="font-bold text-indigo-900 flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>EduGenie Explanation:</span>
              </div>
              <p className="leading-relaxed text-slate-700">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Next / Finish Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400">
              {isCurrentAnswered ? 'Review explanation and continue' : 'Select an answer to reveal explanation'}
            </span>

            <button
              onClick={handleNext}
              disabled={!isCurrentAnswered}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all ${
                !isCurrentAnswered
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200'
              }`}
            >
              <span>{currentIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next Question'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Quiz Completion / Results Dashboard */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-center">
          <div className="inline-flex p-4 rounded-3xl bg-amber-100 text-amber-800 shadow-inner">
            <Trophy className="w-12 h-12 text-amber-600" />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Quiz Completed!
            </h2>
            <p className="text-slate-600 text-sm mt-1">
              You scored <strong className="text-violet-700 font-bold">{correctCount}</strong> out of{' '}
              <strong className="text-slate-900">{totalQuestions}</strong> ({scorePercentage}%)
            </p>
          </div>

          {/* Performance Badge */}
          <div className="inline-block px-4 py-2 rounded-2xl bg-violet-50 border border-violet-200 text-violet-900 font-bold text-sm">
            {scorePercentage >= 90
              ? '🌟 Academic Mastery! Outstanding understanding.'
              : scorePercentage >= 70
              ? '👏 Great Job! Solid conceptual grasp.'
              : '💡 Good Effort! Review the explanations below to master this topic.'}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setSelectedAnswers({});
                setCurrentIndex(0);
                setIsCompleted(false);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Quiz</span>
            </button>

            <button
              onClick={handleSaveScore}
              disabled={isSaved}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                isSaved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-violet-600 hover:bg-violet-700 text-white border-transparent'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Score Saved to Notebook' : 'Save Score to Notebook'}</span>
            </button>

            <button
              onClick={() => {
                setQuiz(null);
                setTopic('');
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              <span>New Topic Quiz</span>
            </button>
          </div>

          {/* Detailed Question Review */}
          <div className="pt-6 border-t border-slate-100 text-left space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Question by Question Review:
            </h3>

            {quiz?.questions.map((q, idx) => {
              const studentChoice = selectedAnswers[idx];
              const isCorrect = studentChoice === q.correctAnswerIndex;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/30'
                      : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Q{idx + 1}: {q.question}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </span>
                  </div>

                  <div className="text-slate-600">
                    <span className="font-semibold">Correct Answer: </span>
                    <strong className="text-emerald-700">{q.options[q.correctAnswerIndex]}</strong>
                  </div>

                  {!isCorrect && studentChoice !== undefined && (
                    <div className="text-slate-600">
                      <span className="font-semibold">Your Answer: </span>
                      <span className="text-rose-700 line-through">{q.options[studentChoice]}</span>
                    </div>
                  )}

                  <div className="text-slate-500 pt-1 border-t border-slate-200/50">
                    <span className="font-semibold text-indigo-900">Explanation: </span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
