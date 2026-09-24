import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Bookmark,
  RefreshCw,
  Lightbulb,
  Compass,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { ChatMessage, ExplanationStyle, GradeLevel, Subject } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { saveItemToNotebook, speakText, stopSpeaking } from '../utils/storage';
import { gradeLevelLabels } from './Navbar';

interface AskSolverProps {
  gradeLevel: GradeLevel;
  subject: Subject;
  onSavedChange?: () => void;
}

const samplePrompts = [
  {
    title: 'Quadratic Formula Derivation',
    subject: 'Mathematics',
    question: 'How do you derive the quadratic formula step-by-step using completing the square?',
  },
  {
    title: 'CRISPR Gene Editing',
    subject: 'Biology',
    question: 'How does CRISPR-Cas9 work like a molecular pair of scissors? Explain step by step.',
  },
  {
    title: 'Schrödinger’s Cat Paradox',
    subject: 'Physics',
    question: 'Explain Schrödinger’s Cat thought experiment and quantum superposition with a clear analogy.',
  },
  {
    title: 'Causes of WWI',
    subject: 'History',
    question: 'What were the MAIN causes of World War I (Militarism, Alliances, Imperialism, Nationalism)?',
  },
  {
    title: 'How QuickSort Works',
    subject: 'Computer Science',
    question: 'Explain how the QuickSort divide-and-conquer algorithm works step by step with an array example.',
  },
];

export const AskSolver: React.FC<AskSolverProps> = ({ gradeLevel, subject, onSavedChange }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [style, setStyle] = useState<ExplanationStyle>('step_by_step');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleAsk = async (questionText?: string) => {
    const q = (questionText || input).trim();
    if (!q || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      text: q,
      timestamp: Date.now(),
      subject,
      gradeLevel,
      style,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          gradeLevel,
          subject,
          style,
          history: newMessages.slice(-6).map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const modelMessage: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        text: data.answer || 'EduGenie could not generate an answer. Please try again.',
        timestamp: Date.now(),
        subject,
        gradeLevel,
        style,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Error fetching EduGenie answer:', err);
      const errorMessage: ChatMessage = {
        id: 'msg_' + (Date.now() + 1),
        role: 'model',
        text: `⚠️ **Unable to complete request.**\n\n${err.message || 'Please check your connection and try asking again.'}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSave = (msg: ChatMessage, questionText: string) => {
    saveItemToNotebook({
      type: 'qa',
      title: questionText.slice(0, 50) + (questionText.length > 50 ? '...' : ''),
      content: msg.text,
      subject: msg.subject || subject,
      gradeLevel: msg.gradeLevel || gradeLevel,
      metadata: { style: msg.style },
    });
    setSavedIds((prev) => new Set(prev).add(msg.id));
    if (onSavedChange) onSavedChange();
  };

  const handleToggleSpeak = (msgId: string, text: string) => {
    if (speakingId === msgId) {
      stopSpeaking();
      setSpeakingId(null);
    } else {
      setSpeakingId(msgId);
      speakText(text, () => {
        setSpeakingId(null);
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-5xl mx-auto px-4 py-4">
      {/* Explanation Style Selector Bar */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-semibold text-slate-700">Explanation Style:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'step_by_step', label: '🪜 Step-by-Step' },
            { id: 'eli5', label: '🧸 Intuition & ELI5' },
            { id: 'deep_dive', label: '🔬 Deep Dive & Proofs' },
            { id: 'concise', label: '⚡ Quick Takeaways' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStyle(item.id as ExplanationStyle)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                style === item.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gradient-to-b from-white to-indigo-50/30 rounded-3xl border border-indigo-100/70">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">
              Ask EduGenie Anything
            </h2>
            <p className="text-slate-600 max-w-lg text-sm mb-6 leading-relaxed">
              Tailored for <strong className="text-indigo-600">{gradeLevelLabels[gradeLevel].label}</strong> level{' '}
              {subject !== 'General' && <span>in <strong className="text-indigo-600">{subject}</strong></span>}.
              Break down challenging homework, unpack complex scientific phenomena, or learn step-by-step.
            </p>

            {/* Quick Starters */}
            <div className="w-full max-w-2xl">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-left">
                Suggested exploration topics:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {samplePrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(p.question)}
                    className="p-3 bg-white hover:bg-indigo-50/80 border border-slate-200/80 hover:border-indigo-300 rounded-xl text-left transition-all group flex items-start justify-between shadow-2xs"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        {p.subject}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-900">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {p.question}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 ml-2 mt-1 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            // Find corresponding question for user save
            const relatedQuestion = isUser
              ? msg.text
              : messages[index - 1]?.text || 'EduGenie Explanation';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Message Header */}
                <div className="flex items-center space-x-2 text-[11px] text-slate-400 mb-1 px-1">
                  {isUser ? (
                    <span className="font-semibold text-slate-600">You (Student)</span>
                  ) : (
                    <div className="flex items-center space-x-1.5 text-indigo-700 font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>EduGenie</span>
                    </div>
                  )}
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 max-w-[92%] sm:max-w-[85%] shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-br-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {isUser ? (
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <div>
                      <MarkdownRenderer content={msg.text} />

                      {/* Tool bar under assistant answer */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleToggleSpeak(msg.id, msg.text)}
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                              speakingId === msg.id
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                            title="Listen to explanation"
                          >
                            {speakingId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                                <span>Stop Audio</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>Read Aloud</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-medium transition-colors"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
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
                            onClick={() => handleSave(msg, relatedQuestion)}
                            disabled={savedIds.has(msg.id)}
                            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                              savedIds.has(msg.id)
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                            title="Save to My Notebook"
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{savedIds.has(msg.id) ? 'Saved' : 'Save'}</span>
                          </button>
                        </div>

                        <span className="text-[11px] text-slate-400">
                          Gemini 3.8 Flash • {msg.gradeLevel ? gradeLevelLabels[msg.gradeLevel]?.label : 'Adaptive'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="flex items-center space-x-2 text-[11px] text-indigo-600 font-semibold px-1">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-500" />
              <span>EduGenie is reasoning step-by-step...</span>
            </div>
            <div className="bg-white border border-indigo-200 rounded-2xl rounded-bl-xs p-4 shadow-xs flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-bounce" />
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.15s]" />
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.3s]" />
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Structuring clear explanations and solving formulas...
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mt-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="relative bg-white rounded-2xl border-2 border-slate-200 focus-within:border-indigo-600 focus-within:shadow-md transition-all shadow-xs p-2 flex items-center gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder={`Ask EduGenie a question or enter a problem in ${subject}... (Press Enter)`}
            rows={1}
            className="flex-1 max-h-32 min-h-[44px] py-2 px-3 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden resize-none leading-relaxed"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`h-11 px-4 rounded-xl font-semibold text-sm flex items-center space-x-1.5 transition-all ${
              !input.trim() || isLoading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-300'
            }`}
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] text-slate-400">
          <span>EduGenie adapts tone, terminology & depth to your selected level.</span>
          {messages.length > 0 && (
            <button
              onClick={() => {
                setMessages([]);
                stopSpeaking();
              }}
              className="text-slate-500 hover:text-red-600 flex items-center space-x-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear Thread</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
