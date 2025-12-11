import { GoogleGenerativeAI, TaskType } from "@google/generative-ai";
import { ResumeAnalysis, InsightResult, InterviewReport, JobMatchResult, Job, SkillSuggestion, ChatMessage } from "../types";
import { v4 as uuidv4 } from 'uuid';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment. Please ensure it is set.");
  return new GoogleGenAI({ apiKey });
};

const handleGeminiError = async (error: any): Promise<never> => {
  console.error("Gemini Operation Failed:", error);
  
  let errorMessage = error.message || "Unknown error occurred";

  // Attempt to parse JSON error from string if present
  try {
    // Sometimes the error message is a JSON string wrapper
    const jsonStart = errorMessage.indexOf('{');
    const jsonEnd = errorMessage.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = errorMessage.substring(jsonStart, jsonEnd + 1);
      const parsed = JSON.parse(jsonStr);
      if (parsed.error?.message) errorMessage = parsed.error.message;
      else if (parsed.message) errorMessage = parsed.message;
    }
  } catch (e) {
    // If parsing fails, use original message
  }

  // Handle Leaked Key / Permission Denied specific case
  if (errorMessage.toLowerCase().includes("leaked") || errorMessage.includes("403") || errorMessage.includes("permission_denied")) {
     if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
        try {
            await (window as any).aistudio.openSelectKey();
            throw new Error("API Key expired or leaked. We've opened the key selector. Please select a valid paid key and try again.");
        } catch (e) {
            console.error("Failed to open key selector", e);
        }
     }
     throw new Error("Your API key was rejected (403). Please refresh the page to provide a valid key.");
  }

  if (errorMessage.includes("400")) {
    throw new Error("The request was invalid. Please check your input format.");
  }

  throw new Error(errorMessage);
};

const cleanJson = (text: string) => {
  return text.replace(/```json|```/g, '').trim();
};

export const analyzeResume = async (
  data: string,
  mimeType: string
): Promise<ResumeAnalysis> => {
  const ai = getAiClient();
  
  // Normalize MIME type
  let normalizedMimeType = mimeType;
  if (mimeType.includes('pdf')) normalizedMimeType = 'application/pdf';
  else if (mimeType.includes('png')) normalizedMimeType = 'image/png';
  else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) normalizedMimeType = 'image/jpeg';

  const prompt = `Analyze this resume acting as a helpful and encouraging Applicant Tracking System (ATS) consultant. 
  Identify the candidate's target role based on experience.
  
  SCORING RULES:
  - Be fair and constructive. A good, standard resume should score between 70-85.
  - Excellent resumes with quantifiable results should score above 85.
  - Only give low scores (<60) if the resume is very sparse, has major formatting errors, or lacks relevant skills entirely.
  - Look for transferrable skills and potential, not just perfect keyword matching.
  
  Provide JSON:
  1. score: 0-100 ATS score.
  2. summary: A professional summary of the candidate's profile.
  3. strengths: 3 strong points or good qualities found in the resume.
  4. weaknesses: 3 areas that could use improvement (be constructive).
  5. improvements: 3 actionable, specific suggestions to reach a higher score.
  6. skills: A list of the top 10 extracted technical and soft skills found in the resume.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: data, mimeType: normalizedMimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["score", "summary", "strengths", "weaknesses", "improvements", "skills"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response received from AI model.");
    
    return JSON.parse(cleanJson(text)) as ResumeAnalysis;
  } catch (error: any) {
    return handleGeminiError(error);
  }
};

export const generateImprovementExample = async (improvement: string, resumeSummary: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Context: Resume Summary: "${resumeSummary}". Improvement: "${improvement}".
  Task: Write a specific, concrete example (1-2 sentences) of how to implement this improvement.`;
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text || "Could not generate example.";
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const generateInterviewReport = async (transcript: string): Promise<InterviewReport> => {
  const ai = getAiClient();
  const prompt = `Analyze this interview transcript.
  Transcript: ${transcript}
  Provide JSON assessment: overallScore (0-100), technicalScore, communicationScore, strengths, improvements.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER },
            technicalScore: { type: Type.NUMBER },
            communicationScore: { type: Type.NUMBER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["overallScore", "technicalScore", "communicationScore", "strengths", "improvements"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No report generated");
    return JSON.parse(cleanJson(text)) as InterviewReport;
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const getMarketInsights = async (query: string): Promise<InsightResult> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: { tools: [{ googleSearch: {} }] }
    });

    const text = response.text || "No insights found.";
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks
      .filter((c: any) => c.web?.uri && c.web?.title)
      .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
    
    // Deduplicate sources
    const uniqueSources = Array.from(new Map(sources.map((item: any) => [item.uri, item])).values()) as any[];

    return { text, sources: uniqueSources };
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const generateTailoredJobs = async (resumeSummary: string, skills: string[]): Promise<Job[]> => {
  const ai = getAiClient();
  const count = Math.floor(Math.random() * (12 - 5 + 1) + 5); // Random between 5 and 12

  const prompt = `Generate ${count} realistic job postings that are highly relevant to this candidate profile.
  Candidate Summary: ${resumeSummary}
  Candidate Skills: ${skills.join(', ')}

  Task:
  1. Infer the candidate's industry and seniority level.
  2. Create ${count} diverse job opportunities (mix of big tech, startups, agencies, etc. if applicable).
  3. Ensure the job titles and requirements are realistic for the candidate's level.
  4. Include a mix of "Best Match" (perfect fit) and "Stretch" (slightly higher level) roles.
  5. Descriptions should be concise (1 sentence).

  Return a JSON array where each object has:
  - id: A unique string
  - title: Job title
  - company: Company name (realistic sounding)
  - location: Location (e.g. "Remote", "New York, NY", etc.)
  - salary: Salary range (e.g. "$120k - $150k")
  - type: "Full-time" | "Contract" | "Hybrid" | "Remote"
  - description: Brief job description (1 sentence)
  - requirements: Array of 3-4 skills
  - postedAt: e.g. "2 days ago"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              salary: { type: Type.STRING },
              type: { type: Type.STRING },
              description: { type: Type.STRING },
              requirements: { type: Type.ARRAY, items: { type: Type.STRING } },
              postedAt: { type: Type.STRING },
            },
            required: ["id", "title", "company", "location", "salary", "type", "description", "requirements", "postedAt"],
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(cleanJson(text)) as Job[];
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const analyzeJobMatch = async (resumeSummary: string, resumeSkills: string[], jobDescription: string): Promise<JobMatchResult> => {
  const ai = getAiClient();
  
  const prompt = `Role: Senior Recruiter & ATS Specialist.
  
  Candidate Profile:
  Summary: ${resumeSummary}
  Skills: ${resumeSkills.join(', ')}
  
  Job Description:
  ${jobDescription}
  
  Task: Evaluate the candidate's fit for this specific job. 
  Provide a JSON response with:
  1. matchScore: 0-100 based on keyword overlap and experience match.
  2. summary: A brief explanation of the fit.
  3. missingKeywords: List of critical keywords/skills in the job description that are missing from the candidate profile.
  4. pros: Why they are a good fit.
  5. cons: Why they might not be selected.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchScore: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["matchScore", "summary", "missingKeywords", "pros", "cons"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    return JSON.parse(cleanJson(text)) as JobMatchResult;
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const generateCoverLetter = async (resumeSummary: string, jobDescription: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Write a professional, persuasive cover letter.
  
  Candidate Summary: ${resumeSummary}
  Job Description: ${jobDescription}
  
  Tone: Professional, confident, and tailored to the company culture implied in the description.
  Structure:
  1. Hook (Why I am writing)
  2. The Match (Connecting my skills to your specific needs)
  3. The "Why You" (Why I want to work for THIS company)
  4. Call to Action.
  
  Return ONLY the cover letter text, no markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Failed to generate cover letter.";
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const suggestSkills = async (currentSkills: string[], roleContext: string): Promise<SkillSuggestion[]> => {
  const ai = getAiClient();
  const prompt = `Based on the following candidate profile and skills, suggest 6 high-value skills they should learn to advance their career or become more competitive.
  
  Role/Context: ${roleContext}
  Current Skills: ${currentSkills.join(', ')}
  
  Return a JSON array of objects. Each object must have:
  - skill: Name of the skill (e.g. "Docker", "Public Speaking")
  - reason: Why this skill is valuable for this specific profile (1 sentence).
  - difficulty: "Beginner", "Intermediate", or "Advanced" based on learning curve relative to their current skills.
  - category: "Technical", "Soft Skill", or "Tool"
  - searchQuery: A highly optimized Google search query string to find the BEST COURSE for this skill (e.g. "Docker complete course for beginners" or "Advanced React patterns course").
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              skill: { type: Type.STRING },
              reason: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
              category: { type: Type.STRING, enum: ["Technical", "Soft Skill", "Tool"] },
              searchQuery: { type: Type.STRING }
            },
            required: ["skill", "reason", "difficulty", "category", "searchQuery"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(cleanJson(text)) as SkillSuggestion[];
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const sendChatMessage = async (history: ChatMessage[], newMessage: string, currentContext: string): Promise<string> => {
  const ai = getAiClient();
  
  const systemInstruction = `You are CarrerBot, the intelligent assistant for the CarrerX platform. 
  Your goal is to help users navigate the website and explain its features.
  
  WEBSITE KNOWLEDGE BASE (What you know about CarrerX):
  1. **Dashboard**: The central hub showing an overview of resume score, active applications, and recommended actions.
  2. **Resume Analyzer**: Allows users to upload a PDF resume. It uses AI to score it (0-100), identify strengths/weaknesses, and suggest specific improvements.
  3. **Interview Prep (Live Interview)**: A real-time voice-based mock interview simulator. Users speak to an AI hiring manager. Requires a resume upload first.
  4. **Job Matches**: Lists jobs tailored to the user's skills found in their resume. Users can "Analyze Fit" to see why they match a specific job.
  5. **Cover Letter Writer**: Generates a tailored cover letter based on the user's resume and a pasted job description.
  6. **Skill Suggestions**: Recommends skills to learn based on the user's profile and provides search queries for courses.
  7. **Market Insights**: A research tool to check salaries, trends, and industry news using Google Search grounding.
  8. **My Applications**: Tracks the status of jobs the user has applied to (New, Shortlisted, Interview, Rejected).
  
  ROLES:
  - **Candidate**: Uses the tools to get hired.
  - **Employer**: Uses the "Recruiter OS" to post jobs and manage applicants.

  CURRENT CONTEXT: The user is currently viewing the "${currentContext}" page.

  GUIDELINES:
  - Be helpful, concise, and professional.
  - If a user asks "How do I...", guide them to the specific tab/feature.
  - If a user asks about their specific data (e.g. "What is my score?"), explain you can't see their private data directly but guide them to the Resume Analyzer tab.
  - You are NOT a general LLM; keep the conversation focused on career, jobs, and using this website.
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage({
        message: newMessage
    });

    return result.text || "I'm sorry, I didn't catch that.";
  } catch (error) {
    console.error("Chat error", error);
    return "I'm having trouble connecting right now. Please try again.";
  }
};
