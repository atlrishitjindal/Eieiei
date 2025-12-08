import { GoogleGenAI, Type } from "@google/genai";
import { ResumeAnalysis, InsightResult, InterviewReport, JobMatchResult, Job } from "../types";
import { v4 as uuidv4 } from 'uuid';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found in environment");
  return new GoogleGenAI({ apiKey });
};

export const analyzeResume = async (
  data: string,
  mimeType: string
): Promise<ResumeAnalysis> => {
  const ai = getAiClient();
  
  const prompt = `Analyze this resume. Identify the candidate's target role.
  Conduct a strict ATS evaluation based on that role.
  
  Provide JSON:
  1. score: 0-100 ATS score.
  2. summary: Executive summary.
  3. strengths: 3 strong points.
  4. weaknesses: 3 gaps/weaknesses.
  5. improvements: 3 specific improvements.
  6. skills: A list of the top 10 extracted technical and soft skills found in the resume.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { inlineData: { data: data, mimeType: mimeType } },
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
  if (!text) throw new Error("No response from model");
  
  return JSON.parse(text) as ResumeAnalysis;
};

export const generateImprovementExample = async (improvement: string, resumeSummary: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Context: Resume Summary: "${resumeSummary}". Improvement: "${improvement}".
  Task: Write a specific, concrete example (1-2 sentences) of how to implement this improvement.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  return response.text || "Could not generate example.";
};

export const generateInterviewReport = async (transcript: string): Promise<InterviewReport> => {
  const ai = getAiClient();
  const prompt = `Analyze this interview transcript.
  Transcript: ${transcript}
  Provide JSON assessment: overallScore (0-100), technicalScore, communicationScore, strengths, improvements.`;

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
  return JSON.parse(text) as InterviewReport;
};

export const getMarketInsights = async (query: string): Promise<InsightResult> => {
  const ai = getAiClient();
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
};

export const generateTailoredJobs = async (resumeSummary: string, skills: string[]): Promise<Job[]> => {
  const ai = getAiClient();
  const prompt = `Generate 12 realistic job postings that are highly relevant to this candidate profile.
  Candidate Summary: ${resumeSummary}
  Candidate Skills: ${skills.join(', ')}

  Task:
  1. Infer the candidate's industry and seniority level.
  2. Create 12 diverse job opportunities (mix of big tech, startups, agencies, etc. if applicable).
  3. Ensure the job titles and requirements are realistic for the candidate's level.
  4. Include a mix of "Best Match" (perfect fit) and "Stretch" (slightly higher level) roles.

  Return a JSON array where each object has:
  - id: A unique string
  - title: Job title
  - company: Company name (realistic sounding)
  - location: Location (e.g. "Remote", "New York, NY", etc.)
  - salary: Salary range (e.g. "$120k - $150k")
  - type: "Full-time" | "Contract" | "Hybrid" | "Remote"
  - description: Brief job description (2 sentences)
  - requirements: Array of 4-6 skills (mix of candidate skills and others)
  - postedAt: e.g. "2 days ago"`;

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
  return JSON.parse(text) as Job[];
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
  return JSON.parse(text) as JobMatchResult;
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

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  return response.text || "Failed to generate cover letter.";
};