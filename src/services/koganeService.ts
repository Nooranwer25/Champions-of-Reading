import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export interface BookRecommendation {
  title: string;
  author: string;
  genres: string[];
  reason: string;
  jjkTechniqueName: string;
  jjkTechniqueDesc: string;
  resonance: number;
  pagesEstimate: number;
}

export async function getKoganeJudgment(bookTitle: string, progress: string, isApproval: boolean = false) {
  const prompt = `You are "Kogane", the announcer and referee of the Culling Game from Jujutsu Kaisen. 
  You are now the referee for a reading competition called "Champions of Reading Books".
  Your tone is high-pitched, excited, slightly annoying, and mechanical. 
  You often say "Rule Added!" or "Points Awarded!" or "Judgment!".
  
  A champion has submitted their progress.
  Book: ${bookTitle}
  Progress/Summary: ${progress}
  Context: ${isApproval ? 'This submission is being APPROVED by an admin.' : 'This is a new submission by a player.'}
  
  Generate a short (max 20 words) announcement from Kogane about this. 
  Include terms related to JJK like "Cursed Energy", "Points", "Domain", or "Archive".
  Example: "JUDGMENT! Champion has gained 10 points! Your cursed energy grows with every page! NEXT!"
  `;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    return (response.text || "JUDGMENT!").trim().replace(/"/g, '');
  } catch (error) {
    return "JUDGMENT! YOU HAVE GAINED POINTS!";
  }
}

export async function getKoganeMotto() {
  const prompt = `Generate a very short greeting from Kogane (Jujutsu Kaisen). He is the referee of the reading champions. MAX 10 words.`;
  
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    return (response.text || "JUDGMENT!").trim().replace(/"/g, '');
  } catch {
    return "JUDGMENT! New rule added to the archive!";
  }
}

export async function getTechniqueSummary(bookTitle: string, author: string, synopsis: string, assessment: string) {
  const prompt = `You are a Sorcerer Librarian in the Colony of Reading Champions.
  You need to synthesize a "Technique Summary" for a registered reading manifest.
  
  Book: ${bookTitle} by ${author}
  Champion's Synopsis: ${synopsis}
  Champion's Assessment: ${assessment}
  
  Write a concise, high-impact summary (max 100 words) that blends the book's core themes with JJK-style sorcery terminology. 
  Describe the "Technique" learned from this book. Use Markdown for formatting.
  Example: "By digesting the core themes of ${bookTitle}, the user manifests the 'Curse of Infinite Loneliness'. This technique allows for..."
  `;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });
    return response.text || "Technique synthesis failed. Cursebore interference detected.";
  } catch (error) {
    return "The Archive is currently unstable. Cosmic radiation from the Domain Expansion has blocked the synthesis.";
  }
}

export async function getBookRecommendations(
  favoriteGenres: string[],
  submissions: { bookTitle: string; author: string; synopsis: string; status: string }[]
): Promise<BookRecommendation[]> {
  const genresStr = favoriteGenres.length > 0 ? favoriteGenres.join(', ') : 'any literary genres';
  const historyStr = submissions.length > 0 
    ? submissions.map(s => `"${s.bookTitle}" by ${s.author} (Status: ${s.status}, Synopsis: ${s.synopsis})`).join('\n')
    : 'None yet (Brand new sorcerer class)';

  const prompt = `You are "Kogane", the announcer, advisor, and referee of the Culling Game. 
  Your job is to recommend exactly 3 real, actual, highly-intellectual books for a Reading Sorcerer to conquer next.
  
  The reader's current details:
  Favorite/Focused Genres: ${genresStr}
  Submissions history of books already read:
  ${historyStr}
  
  Recommend EXACTLY 3 books that match the user's genre tastes AND contrast or complement their past readings. DO NOT suggest books they've already read.
  For each book, synthesize a Jujutsu Kaisen cursed technique alignment name and description based on the intellectual core of that book.
  
  Provide creative, fun, JJK-themed content mapped to the formal schema!`;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Book title" },
              author: { type: Type.STRING, description: "Book author" },
              genres: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Matching genres/categories" },
              reason: { type: Type.STRING, description: "Why this book fits the user's focus" },
              jjkTechniqueName: { type: Type.STRING, description: "A creative JJK sorcery technique name they will extract by reading this book (e.g., 'Curse of Divine Comedy', 'Innate Calculus')" },
              jjkTechniqueDesc: { type: Type.STRING, description: "What this cursed technique allows them to do, flavored with literary wisdom and JJK jargon" },
              resonance: { type: Type.INTEGER, description: "Expected cursed energy resonance style index (integer from 50 to 100)" },
              pagesEstimate: { type: Type.INTEGER, description: "An estimated page count for this book" }
            },
            required: ["title", "author", "genres", "reason", "jjkTechniqueName", "jjkTechniqueDesc", "resonance", "pagesEstimate"]
          }
        }
      }
    });

    if (response.text) {
      const recommendations: BookRecommendation[] = JSON.parse(response.text.trim());
      return recommendations;
    }
    return [];
  } catch (error) {
    return [];
  }
}
