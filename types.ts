export interface Flashcard {
  question: string;
  answer: string;
}

export interface FillInBlank {
  context: string; // Sentence with _____
  answer: string; // The missing word
}

export interface MicroStep {
  stepNumber: number;
  title: string; // Title of this small chunk
  content: string; // The explanation for this specific chunk
  keyTerm: string; // The specific sub-term to focus on here
}

export interface Deconstruction {
  steps: MicroStep[];
  synthesis: string; // How these steps fit together (The "Assembly")
}

// NEW: Integration & Synthesis Interfaces
export interface ComparisonItem {
  concept: string; // The confusing concept (Concept B)
  difference: string; // Key difference vs current concept
  similarity: string; // Why they look alike
}

export interface Prerequisite {
  concept: string; // The "Old Knowledge"
  connection: string; // How it links to the "New Knowledge"
}

export interface IntegrationData {
  parentCategory: string; // Macro field (e.g., "Civil Law")
  conceptTree: string[]; // Hierarchy: Grandparent > Parent > Current > Child
  prerequisites: Prerequisite[]; // Link to old knowledge
  confusingConcepts: ComparisonItem[]; // Diff table
  comprehensiveCase: string; // A complex case requiring synthesis
}

export interface MemoryData {
  // Beginner Friendly Section
  simpleExplanation: string; // ELI5 style explanation
  backgroundContext: string; // Why does this concept exist?
  misconceptions: string[]; // Common misunderstandings
  
  // Breakdown Section
  deconstruction: Deconstruction;

  // Integration Section (NEW)
  integration: IntegrationData;

  // Academic Section
  definition: string; // Standard academic definition (Noun Explanation)
  coreTheory: string[]; // Key theoretical points (Bullet points)
  analogy: string; // Use a real world analogy
  mnemonic: string; // A rhyme or acronym
  keywords: string[]; // Key concepts (Scoring points)
  memoryPalace: string; // A visual scene description
  
  // Practice
  flashcards: Flashcard[];
  fillInTheBlanks: FillInBlank[]; // New verification practice
}

export interface FeynmanEvaluation {
  score: number; // 0-100
  feedback: string; // Encouraging feedback highlighting what was right/wrong
  missingPoints: string[]; // Key concepts the user missed
  betterExplanation: string; // A refined version of what the user tried to say
}

export type TabType = 'theory' | 'breakdown' | 'integration' | 'visualize' | 'mnemonic' | 'quiz';

export interface GeneratedContentState {
  data: MemoryData | null;
  loading: boolean;
  error: string | null;
}