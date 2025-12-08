export enum AppView {
  DASHBOARD = 'DASHBOARD',
  INTERVIEW = 'INTERVIEW',
  RESUME = 'RESUME',
  INSIGHTS = 'INSIGHTS',
  JOBS = 'JOBS',
  COVER_LETTER = 'COVER_LETTER'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface ResumeAnalysis {
  score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  skills: string[]; // Added for skills gap analysis
}

export interface InterviewReport {
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  strengths: string[];
  improvements: string[];
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface InsightResult {
  text: string;
  sources: GroundingSource[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: string[];
  postedAt: string;
}

export interface JobMatchResult {
  matchScore: number;
  summary: string;
  missingKeywords: string[];
  pros: string[];
  cons: string[];
}

export interface ActivityLog {
  id: string;
  type: 'interview' | 'resume' | 'job_match' | 'cover_letter';
  title: string;
  timestamp: Date;
  meta: string;
}