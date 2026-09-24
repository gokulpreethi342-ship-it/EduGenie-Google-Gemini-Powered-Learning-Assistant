import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI SDK with server-side API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for error formatting
function handleApiError(res: Response, err: any, customMsg: string) {
  console.error(customMsg, err);
  const errMsg = err?.message || JSON.stringify(err);
  if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('Quota exceeded')) {
    res.status(429).json({
      error: 'Rate limit or free-tier quota briefly reached. Please wait a few seconds and try again.',
      details: customMsg,
    });
    return;
  }
  const message = err?.message || 'An unexpected error occurred while communicating with Gemini.';
  res.status(500).json({ error: message, details: customMsg });
}

// Helper for reliable Gemini calls with automatic fallback on transient high-demand spikes (503) or rate limits (429)
async function callGemini(params: {
  contents: any;
  config?: any;
}) {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-2.5-pro'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      return await ai.models.generateContent({
        ...params,
        model,
      });
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || JSON.stringify(err);
      console.warn(`Model ${model} call error: ${errMsg}`);
      // Retry next model if high-demand 503, transient unavailable, or quota exhausted on this specific model
      if (
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand') ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('Quota exceeded')
      ) {
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

// 1. Q&A and Step-by-Step Solver endpoint
app.post('/api/ask', async (req: Request, res: Response) => {
  try {
    const { question, gradeLevel = 'high_school', subject = 'General', style = 'step_by_step', history = [] } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }

    const gradeLevelDescriptions: Record<string, string> = {
      elementary: 'Elementary school student (ages 6-10). Use simple words, warm encouragement, and fun relatable examples.',
      middle_school: 'Middle school student (ages 11-14). Clear, relatable explanations, breaking concepts into digestible bite-sized ideas.',
      high_school: 'High school student (ages 15-18). Standard academic rigor, clear formulas, structured steps, and practical applications.',
      undergrad: 'College / Undergraduate student. Rigorous academic depth, theoretical foundations, derivations, and formal definitions.',
      graduate: 'Advanced / Graduate researcher. Comprehensive technical depth, edge cases, underlying mechanics, and critical nuances.'
    };

    const styleInstructions: Record<string, string> = {
      step_by_step: 'Structure the response with numbered sequential steps. For each step, clearly state the goal, the action/calculation/reasoning, and why it matters.',
      eli5: 'Explain Like I\'m 5: Use a vivid, memorable analogy from everyday life, avoiding jargon, and then gently bridge back to the real academic concept.',
      deep_dive: 'Provide a comprehensive deep-dive covering foundational theory, key mechanisms, edge cases, real-world relevance, and historical context if applicable.',
      concise: 'Provide an executive summary and bullet points highlighting only the most essential concepts and takeaways.'
    };

    const systemInstruction = `You are EduGenie, an expert, friendly, and patient AI learning assistant powered by Google Gemini.
Your mission is to help students truly understand topics, not just memorize answers.

TARGET AUDIENCE:
- Learning Level: ${gradeLevelDescriptions[gradeLevel] || gradeLevelDescriptions.high_school}
- Subject Domain: ${subject}
- Primary Explanation Style: ${styleInstructions[style] || styleInstructions.step_by_step}

GUIDELINES:
1. Always be supportive, encouraging, and clear.
2. If the user presents a mathematical or scientific problem, show the step-by-step working clearly with explanations for each transformation.
3. Highlight key terms and equations in bold or markdown code blocks for readability.
4. Provide structured, visually pleasing markdown (use headers ##, ###, bullet points, numbered lists).
5. At the end of your answer, include:
   - "💡 Key Takeaway" (1-2 sentences summarizing the core intuition)
   - "🤔 Think About It" (1 stimulating follow-up question to test their comprehension)
6. If the question lacks context or is ambiguous, clarify reasonable assumptions first before explaining.`;

    // Construct contents including conversation history if provided
    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history.slice(-6)) { // keep last 6 turns for context
        contents.push({
          role: turn.role === 'model' ? 'model' : 'user',
          parts: [{ text: turn.text }],
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: question }],
    });

    const response = await callGemini({
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const answer = response.text || 'EduGenie could not generate an answer at this time. Please try again.';
    res.json({ answer });
  } catch (err: any) {
    handleApiError(res, err, 'Error generating answer');
  }
});

// 2. Structured Study Notes Generator
app.post('/api/notes', async (req: Request, res: Response) => {
  try {
    const { topic, gradeLevel = 'high_school', subject = 'General', additionalDetails = '' } = req.body;

    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ error: 'Topic is required.' });
      return;
    }

    const systemInstruction = `You are EduGenie's Master Study Note Generator.
Create a beautifully structured, comprehensive, and student-ready Revision Guide & Study Note document on the provided topic.

Target level: ${gradeLevel}.
Subject: ${subject}.

Structure the study notes using standard Markdown with these designated sections:
# 📚 [Topic Title] - Comprehensive Study Notes

## 🎯 1. Overview & Core Definition
Brief executive definition and intuitive high-level explanation.

## 🔑 2. Key Concepts & Core Principles
Break down 3-5 foundational principles or sub-topics with clear definitions and bullet points.

## 🪜 3. Step-by-Step Mechanisms & How It Works
Numbered logical steps detailing how the process, formula, theorem, or event works.

## 💡 4. Real-World Analogy & Mental Model
A memorable analogy that makes the concept click intuitively.

## ⚠️ 5. Common Pitfalls & Mistakes to Avoid
Frequent student misconceptions, calculation traps, or confusing distinctions.

## 🧠 6. Quick Mnemonics & Memory Aids
Clever acronyms, memory tricks, or visual cues to remember key points.

## 📝 7. Self-Check Practice Questions
3 rapid-fire review questions with hidden or collapsible answers for testing mastery.`;

    const promptText = `Generate comprehensive study notes for:
Topic: ${topic}
${additionalDetails ? `Additional context / Syllabus focus: ${additionalDetails}` : ''}`;

    const response = await callGemini({
      contents: promptText,
      config: {
        systemInstruction,
        temperature: 0.6,
      },
    });

    const notes = response.text || 'Unable to generate notes. Please retry.';
    res.json({ notes });
  } catch (err: any) {
    handleApiError(res, err, 'Error generating study notes');
  }
});

// 3. Material Summarizer
app.post('/api/summarize', async (req: Request, res: Response) => {
  try {
    const { content, format = 'key_points', gradeLevel = 'high_school' } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'Content to summarize is required.' });
      return;
    }

    const formatInstructions: Record<string, string> = {
      key_points: 'Provide a structured bullet-point breakdown of all core arguments and facts, categorized under clear thematic headers.',
      executive: 'Provide a concise 2-3 paragraph executive summary capturing the central thesis, evidence, and conclusions.',
      glossary: 'Extract all critical terms, concepts, formulas, or historical figures into an alphabetical Glossary of Key Definitions.',
      flashcards: 'Transform the material into 5 to 8 Question & Answer study pairs in markdown format, designed for active recall revision.'
    };

    const systemInstruction = `You are EduGenie's Study Material Summarizer.
Your goal is to distill complex academic text into clear, high-yield insights tailored for a ${gradeLevel} level student.
Formatting format requested: ${formatInstructions[format] || formatInstructions.key_points}

Ensure the summary is crisp, removes filler, retains essential technical keywords, and is formatted with clean Markdown.`;

    const response = await callGemini({
      contents: `Please summarize the following material:\n\n${content}`,
      config: {
        systemInstruction,
        temperature: 0.5,
      },
    });

    const summary = response.text || 'Unable to summarize content.';
    res.json({ summary });
  } catch (err: any) {
    handleApiError(res, err, 'Error summarizing content');
  }
});

// 4. Interactive Quiz Generator with Structured JSON (from topic or passage)
app.post('/api/quiz', async (req: Request, res: Response) => {
  try {
    const { topic, passage, gradeLevel = 'high_school', difficulty = 'medium', numQuestions = 3, subject = 'General' } = req.body;

    const sourceContent = (passage && typeof passage === 'string' && passage.trim().length > 0)
      ? passage.trim()
      : (topic && typeof topic === 'string' ? topic.trim() : '');

    if (!sourceContent) {
      res.status(400).json({ error: 'A passage or topic is required to generate the quiz.' });
      return;
    }

    const count = Math.min(Math.max(Number(numQuestions) || 3, 1), 10);

    const isPassageBased = Boolean(passage && passage.trim().length > 0);

    const prompt = isPassageBased
      ? `Generate exactly ${count} multiple-choice questions directly from the following given passage.
Target grade level: ${gradeLevel}
Difficulty: ${difficulty}
Subject context: ${subject}

GIVEN PASSAGE:
"""
${sourceContent}
"""

STRICT REQUIREMENTS:
1. Generate exactly ${count} questions (default 3) based strictly on facts, deductions, and concepts from the passage.
2. Provide exactly 4 distinct multiple-choice options per question.
3. Indicate the zero-indexed correct option (0, 1, 2, or 3).
4. Provide a helpful hint to nudge the learner without immediately revealing the answer.
5. Provide a detailed explanation explaining why the correct choice is accurate and why the other options are incorrect.`
      : `Create an interactive multiple-choice quiz on the topic "${sourceContent}" in subject "${subject}".
Target grade level: ${gradeLevel}
Difficulty: ${difficulty}
Total questions: ${count}

Each question must be thought-provoking, testing genuine conceptual understanding rather than trivial trivia.
Provide exactly 4 distinct options per question.
Indicate the zero-indexed correct option (0, 1, 2, or 3).
Provide a helpful hint that nudges the student in the right direction without directly giving away the answer.
Provide a clear explanation explaining why the correct answer is right and why other options are incorrect.`;

    const response = await callGemini({
      contents: prompt,
      config: {
        systemInstruction: 'You are an expert academic assessment designer. Return ONLY valid JSON adhering to the specified schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quizTitle: {
              type: Type.STRING,
              description: 'A catchy, descriptive title for the quiz',
            },
            topic: {
              type: Type.STRING,
              description: 'The core topic or passage summary being tested',
            },
            gradeLevel: {
              type: Type.STRING,
              description: 'The academic level',
            },
            questions: {
              type: Type.ARRAY,
              description: 'Array of quiz questions',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.INTEGER },
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Exactly 4 multiple choice options',
                  },
                  correctAnswerIndex: {
                    type: Type.INTEGER,
                    description: 'Index of correct answer (0 to 3)',
                  },
                  hint: {
                    type: Type.STRING,
                    description: 'Clue to assist the student',
                  },
                  explanation: {
                    type: Type.STRING,
                    description: 'Detailed explanation of the solution',
                  },
                },
                required: ['id', 'question', 'options', 'correctAnswerIndex', 'hint', 'explanation'],
              },
            },
          },
          required: ['quizTitle', 'topic', 'gradeLevel', 'questions'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    const parsedData = JSON.parse(rawJson);
    res.json(parsedData);
  } catch (err: any) {
    handleApiError(res, err, 'Error generating quiz');
  }
});

// 5. Concept Simplifier (Analogies & Mental Models)
app.post('/api/simplify', async (req: Request, res: Response) => {
  try {
    const { concept, gradeLevel = 'high_school', audienceFocus = 'Visual & Intuitive' } = req.body;

    if (!concept || typeof concept !== 'string') {
      res.status(400).json({ error: 'Concept is required.' });
      return;
    }

    const systemInstruction = `You are EduGenie's Chief Intuition Officer.
Your superpower is turning intimidating, abstract academic concepts into vivid, unforgettable mental models and step-by-step intuitive explanations.

Format the output strictly as JSON with this structure:
{
  "conceptTitle": string,
  "oneSentenceSummary": string,
  "everydayAnalogy": {
    "title": string,
    "story": string,
    "parallelMapping": [
      { "analogyPart": string, "realConceptPart": string, "explanation": string }
    ]
  },
  "stepByStepIntuition": [
    { "stepNumber": number, "title": string, "detail": string }
  ],
  "whyItMatters": string,
  "miniCheckQuestion": {
    "question": string,
    "answer": string
  }
}`;

    const prompt = `Simplify and provide an intuitive breakdown for the concept: "${concept}"
Target grade level: ${gradeLevel}
Learner Profile: ${audienceFocus}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            conceptTitle: { type: Type.STRING },
            oneSentenceSummary: { type: Type.STRING },
            everydayAnalogy: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                story: { type: Type.STRING },
                parallelMapping: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      analogyPart: { type: Type.STRING },
                      realConceptPart: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['analogyPart', 'realConceptPart', 'explanation'],
                  },
                },
              },
              required: ['title', 'story', 'parallelMapping'],
            },
            stepByStepIntuition: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  detail: { type: Type.STRING },
                },
                required: ['stepNumber', 'title', 'detail'],
              },
            },
            whyItMatters: { type: Type.STRING },
            miniCheckQuestion: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
              },
              required: ['question', 'answer'],
            },
          },
          required: [
            'conceptTitle',
            'oneSentenceSummary',
            'everydayAnalogy',
            'stepByStepIntuition',
            'whyItMatters',
            'miniCheckQuestion',
          ],
        },
      },
    });

    const raw = response.text?.trim() || '{}';
    res.json(JSON.parse(raw));
  } catch (err: any) {
    handleApiError(res, err, 'Error simplifying concept');
  }
});

// 6. Personalized Learning Path & Resource Recommendation Engine
app.post('/api/roadmap', async (req: Request, res: Response) => {
  try {
    const { topic, gradeLevel = 'high_school', learnerProfile = 'General Learner', currentProficiency = 'Beginner', targetGoal = '' } = req.body;

    if (!topic || typeof topic !== 'string') {
      res.status(400).json({ error: 'Topic is required to create a learning path.' });
      return;
    }

    const systemInstruction = `You are EduGenie's Curriculum & Pedagogical Roadmap Architect.
Your task is to build a structured, actionable, and inspiring step-by-step Personalized Learning Path from Beginner to Advanced mastery for the requested topic.

For each milestone (Beginner, Intermediate, Advanced):
- Provide clear milestone titles and estimated durations (e.g., "Weeks 1-2" or "3-4 Hours").
- List 3-4 core concepts mastered in this phase.
- List 2-3 hands-on actionable projects/tasks the student should build or solve to solidify mastery.
- List 2 clear learning objectives.

Also curate 4 to 6 high-quality, practical recommended learning resources across different formats:
- Videos (e.g. YouTube channels, landmark video series, lectures)
- Articles & Documentation (interactive sites, seminal papers, or authoritative blogs)
- Books (acclaimed textbooks or popular science/domain books)
- Interactive Tools or Courses (sandboxes, interactive tutorials)

Provide specific, realistic titles, difficulty levels, rich descriptions, and search queries or direct URLs.
Return ONLY valid JSON strictly adhering to the schema.`;

    const prompt = `Create a comprehensive personalized learning path for: "${topic}"
Target Grade/Level: ${gradeLevel}
Current Proficiency: ${currentProficiency}
Learner Goal/Context: ${targetGoal || 'Complete mastery from beginner to advanced with recommended study resources'}`;

    const response = await callGemini({
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            targetLevel: { type: Type.STRING },
            learnerProfile: { type: Type.STRING },
            overview: { type: Type.STRING, description: 'Motivational executive summary of the journey' },
            prerequisites: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key foundation skills needed before starting',
            },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stage: { type: Type.STRING, description: 'Beginner, Intermediate, or Advanced' },
                  milestoneTitle: { type: Type.STRING },
                  estimatedDuration: { type: Type.STRING },
                  coreConcepts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  actionableTasks: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  learningObjectives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['stage', 'milestoneTitle', 'estimatedDuration', 'coreConcepts', 'actionableTasks', 'learningObjectives'],
              },
            },
            recommendedResources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, description: 'video, article, book, interactive, or course' },
                  description: { type: Type.STRING },
                  searchQueryOrUrl: { type: Type.STRING },
                  difficulty: { type: Type.STRING, description: 'Beginner, Intermediate, or Advanced' },
                },
                required: ['title', 'type', 'description', 'searchQueryOrUrl', 'difficulty'],
              },
            },
          },
          required: ['topic', 'targetLevel', 'learnerProfile', 'overview', 'prerequisites', 'milestones', 'recommendedResources'],
        },
      },
    });

    const rawJson = response.text?.trim() || '{}';
    res.json(JSON.parse(rawJson));
  } catch (err: any) {
    handleApiError(res, err, 'Error generating personalized learning path');
  }
});

// Vite middleware in development vs static serving in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`EduGenie server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start EduGenie server:', err);
  process.exit(1);
});
