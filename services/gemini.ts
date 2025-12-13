import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ResumeAnalysis, InsightResult, InterviewReport, JobMatchResult, Job, SkillSuggestion, ChatMessage } from "../types";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. If you are on Vercel, please add 'API_KEY' to your project's Environment Variables.");
  }
  return new GoogleGenerativeAI(apiKey);
};

const handleGeminiError = async (error: any): Promise<never> => {
  console.error("Gemini Operation Failed:", error);
  
  let errorMessage = error.message || "Unknown error occurred";

  if (errorMessage.toLowerCase().includes("leaked") || errorMessage.includes("403") || errorMessage.includes("permission_denied")) {
     if (typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
        try {
            await (window as any).aistudio.openSelectKey();
            throw new Error("API Key issue. Opening selection dialog...");
        } catch (e) {
            console.error("Failed to open key selector", e);
        }
     }
     throw new Error("Your API key was rejected (403). Please check your quota or refresh the page.");
  }
  
  if (errorMessage.includes("404") || errorMessage.includes("not found")) {
      throw new Error("The AI model is currently unavailable. Please try again later.");
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
  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          score: { type: SchemaType.NUMBER },
          summary: { type: SchemaType.STRING },
          strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          weaknesses: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          improvements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          skills: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["score", "summary", "strengths", "weaknesses", "improvements", "skills"]
      }
    }
  });
  
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
  `;

  try {
    const result = await model.generateContent([
      { inlineData: { data: data, mimeType: normalizedMimeType } },
      prompt
    ]);

    const text = result.response.text();
    if (!text) throw new Error("No response received from AI model.");
    
    return JSON.parse(cleanJson(text)) as ResumeAnalysis;
  } catch (error: any) {
    return handleGeminiError(error);
  }
};

export const generateImprovementExample = async (improvement: string, resumeSummary: string): Promise<string> => {
  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Context: Resume Summary: "${resumeSummary}". Improvement: "${improvement}".
  Task: Write a specific, concrete example (1-2 sentences) of how to implement this improvement.`;
  
  try {
    const result = await model.generateContent(prompt);
    return result.response.text() || "Could not generate example.";
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const generateInterviewReport = async (transcript: string): Promise<InterviewReport> => {
  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          overallScore: { type: SchemaType.NUMBER },
          technicalScore: { type: SchemaType.NUMBER },
          communicationScore: { type: SchemaType.NUMBER },
          strengths: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          improvements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["overallScore", "technicalScore", "communicationScore", "strengths", "improvements"]
      }
    }
  });

  const prompt = `Analyze this interview transcript.
  Transcript: ${transcript}
  Provide JSON assessment: overallScore (0-100), technicalScore, communicationScore, strengths, improvements.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No report generated");
    return JSON.parse(cleanJson(text)) as InterviewReport;
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const getMarketInsights = async (query: string): Promise<InsightResult> => {
  const genAI = getAiClient();
  // Using gemini-1.5-flash-8b as it is often faster for tool use, or standard flash. 
  // Tools config in v1 is different.
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    // tools: [{ googleSearch: {} }] // Note: Google Search tool availability varies by region/key in v1
  });

  try {
    // Basic fallback without live search tool if not available in standard v1 tier
    // For full search, one usually needs Vertex AI or specific beta endpoints.
    // We will attempt a standard generation which often knows recent-ish info, 
    // or return a disclaimer if live data is strictly needed.
    const result = await model.generateContent(`Provide market insights for: ${query}. Include salary ranges and trends.`);
    const text = result.response.text() || "No insights found.";
    
    // V1 SDK does not consistently return grounding metadata in the same structure as V2 for all keys.
    // We'll return text only for stability.
    return { text, sources: [] };
  } catch (error) {
    return { text: "I couldn't access market data at the moment. " + (error as any).message, sources: [] };
  }
};

export const generateTailoredJobs = async (resumeSummary: string, skills: string[]): Promise<Job[]> => {
  const genAI = getAiClient();
  const count = Math.floor(Math.random() * (12 - 5 + 1) + 5);

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            id: { type: SchemaType.STRING },
            title: { type: SchemaType.STRING },
            company: { type: SchemaType.STRING },
            location: { type: SchemaType.STRING },
            salary: { type: SchemaType.STRING },
            type: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
            requirements: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            postedAt: { type: SchemaType.STRING },
          },
          required: ["id", "title", "company", "location", "salary", "type", "description", "requirements", "postedAt"],
        }
      }
    }
  });

  const prompt = `Generate ${count} realistic job postings that are highly relevant to this candidate profile.
  Candidate Summary: ${resumeSummary}
  Candidate Skills: ${skills.join(', ')}

  Task:
  1. Infer the candidate's industry and seniority level.
  2. Create ${count} diverse job opportunities.
  3. Ensure the job titles and requirements are realistic.
  4. Include a mix of "Best Match" and "Stretch" roles.
  
  Return valid JSON.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) return [];
    return JSON.parse(cleanJson(text)) as Job[];
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const analyzeJobMatch = async (resumeSummary: string, resumeSkills: string[], jobDescription: string): Promise<JobMatchResult> => {
  const genAI = getAiClient();
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          matchScore: { type: SchemaType.NUMBER },
          summary: { type: SchemaType.STRING },
          missingKeywords: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          pros: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          cons: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        },
        required: ["matchScore", "summary", "missingKeywords", "pros", "cons"]
      }
    }
  });

  const prompt = `Role: Senior Recruiter & ATS Specialist.
  
  Candidate Profile:
  Summary: ${resumeSummary}
  Skills: ${resumeSkills.join(', ')}
  
  Job Description:
  ${jobDescription}
  
  Evaluate fit. Provide JSON response.`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("No response");
    return JSON.parse(cleanJson(text)) as JobMatchResult;
  } catch (error) {
    return handleGeminiError(error);
  }
};

export const generateCoverLetter = async (resumeSummary: string, jobDescription: string): Promise<string> => {
  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  
  const prompt = `Write a professional, persuasive cover letter.
  
  Candidate Summary: ${resumeSummary}
  Job Description: ${jobDescription}
  
  Tone: Professional, confident.
  Return ONLY the cover letter text, no markdown.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text() || "Failed to generate cover letter.";
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const suggestSkills = async (currentSkills: string[], roleContext: string): Promise<SkillSuggestion[]> => {
  const genAI = getAiClient();
  
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            skill: { type: SchemaType.STRING },
            reason: { type: SchemaType.STRING },
            difficulty: { type: SchemaType.STRING, enum: ["Beginner", "Intermediate", "Advanced"] },
            category: { type: SchemaType.STRING, enum: ["Technical", "Soft Skill", "Tool"] },
            searchQuery: { type: SchemaType.STRING }
          },
          required: ["skill", "reason", "difficulty", "category", "searchQuery"]
        }
      }
    }
  });

  const prompt = `Based on the following candidate profile and skills, suggest 6 high-value skills they should learn.
  
  Role/Context: ${roleContext}
  Current Skills: ${currentSkills.join(', ')}
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) return [];
    return JSON.parse(cleanJson(text)) as SkillSuggestion[];
  } catch (error) {
    return handleGeminiError(error) as any;
  }
};

export const sendChatMessage = async (history: ChatMessage[], newMessage: string, currentContext: string): Promise<string> => {
  const genAI = getAiClient();
  
  const systemInstruction = `You are CarrerBot, the intelligent assistant for the CarrerX platform. 
  Your goal is to help users navigate the website and explain its features.
  
  WEBSITE KNOWLEDGE BASE (What you know about CarrerX):
  1. **Dashboard**: The central hub showing an overview of resume score, active applications, and recommended actions.
  2. **Resume Analyzer**: Allows users to upload a PDF resume. It uses AI to score it (0-100), identify strengths/weaknesses, and suggest specific improvements.
  3. **Interview Prep (Live Interview)**: A voice-based mock interview simulator.
  4. **Job Matches**: Lists jobs tailored to the user's skills found in their resume.
  5. **Cover Letter Writer**: Generates a tailored cover letter based on the user's resume and a pasted job description.
  6. **Skill Suggestions**: Recommends skills to learn based on the user's profile.
  7. **Market Insights**: A research tool to check salaries, trends, and industry news.
  8. **My Applications**: Tracks the status of jobs the user has applied to.
  
  CURRENT CONTEXT: The user is currently viewing the "${currentContext}" page.

  GUIDELINES:
  - Be helpful, concise, and professional.
  - You are NOT a general LLM; keep the conversation focused on career, jobs, and using this website.
  `;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: systemInstruction
    });

    const chat = model.startChat({
      history: history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }))
    });

    const result = await chat.sendMessage(newMessage);
    return result.response.text() || "I'm sorry, I didn't catch that.";
  } catch (error) {
    console.error("Chat error", error);
    return "I'm having trouble connecting right now. Please try again.";
  }
};

export const generateInterviewResponse = async (audioBase64: string, resumeContext: string, history: {role: string, text: string}[]): Promise<string> => {
  const genAI = getAiClient();
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: `You are an experienced hiring manager conducting a job interview.
    Context from resume: ${resumeContext}
    
    Goal: Assess their fit for a Senior role.
    Keep your responses concise and conversational (spoken word style). Do not be too verbose.
    If the candidate struggles, offer a small hint. Be professional but encouraging.
    `
  });
  
  try {
     const result = await model.generateContent([
       { inlineData: { data: audioBase64, mimeType: "audio/webm" } },
       "Please respond to the candidate's answer naturally."
     ]);
     return result.response.text();
  } catch (e) {
     console.error("Interview Error", e);
     throw e;
  }
}