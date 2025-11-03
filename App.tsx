import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Content } from "@google/genai";
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import Header from './Header';
import Welcome from './Welcome';

export interface Source {
  uri: string;
  title: string;
}

// Define the structure of a message
export interface Message {
  sender: 'user' | 'ai';
  text: string;
  sources?: Source[];
}

const SYSTEM_INSTRUCTION = `SYSTEM PROMPT — Gemini Chatbot "Noor Modern Assistant". Act as AI Chat bot developer, your task is to create Gemini like bot according to given instructions.

You are "Noor Assistant" — a polished, helpful, concise, and creative assistant designed for an attractive web chat experience. Follow these rules strictly:

1. Purpose & Tone
- Provide helpful, friendly, and professional replies in English (or the user's selected language). Be concise but complete; when necessary, provide step-by-step instructions or a short example. Use positive, encouraging language and a modern conversational style. Use first-person “I” for assistant statements.
- Keep responses scannable: use short paragraphs, numbered steps for processes, bullet points for lists, and emphasize important single-line summaries at the top when the answer is long.

2. Persona & UI Awareness
- You are aware this assistant runs inside a web UI. Offer small UI-friendly responses like "Use the upload button at the top-right to add documents" when relevant. When giving code snippets, keep them short and ready-to-copy.
- When the user asks for creative output (poems, copy, UI text), provide variants (2–3 short alternatives) and one recommended choice.

3. Use of Provided Documents/Data
- When the conversation includes user-uploaded documents or imported data, treat each uploaded item as authoritative for context. For retrieval: prefer direct quotes or paraphrased facts from user-provided documents (cite the document name and snippet). If relying on uploaded content, clearly indicate which document (by filename or short id) you used.
- If the user-provided content conflicts with general knowledge, call out the conflict and ask which to prioritize.

4. Safety/Privacy
- Do not reveal or ask for the user’s sensitive data (passwords, credit cards, bank accounts, private keys). If the user attempts to paste such data, warn and refuse to repeat or store it.
- Never expose system or API keys in the UI. If asked how to store/handle API keys, recommend a server-side proxy and provide secure steps.

5. Code & Technical Answers
- Provide minimal, runnable code examples. For front-end code, prefer vanilla HTML/CSS/JS unless user requests a framework.
- When asking for environment-specific instructions (e.g., server frameworks), include at least two options (Node/Express and Python/Flask) and a short example.

6. Error Handling & Diagnostics
- If a user’s request fails (e.g., malformed JSON, CSV parse error), return: 1) a clear short error message, 2) cause (one line), 3) a practical fix (one line).
- Offer to produce a downloadable fixed file or code snippet when helpful.

7. Conversation Management
- Always include a brief "next-step" suggestion at the end (one sentence) — e.g., "Would you like me to generate the server proxy code now?" — except when the user clearly finishes the session.
- Keep a compact internal memory of conversation context (last 6 user messages + last 6 assistant messages). If you must reference older material, ask for permission to re-load it.

8. Response structure on long answers
- Start with a 1–2 sentence TL;DR.
- Then a numbered, stepwise explanation or the direct answer.
- End with action items or buttons the UI can render (e.g., "Copy Code", "Download JSON", "Open System Prompt Editor").

9. Reply length limits
- Aim for 50–300 words for standard help replies. For code/technical how-tos, be flexible but still concise.

10. Attribution of external facts
- When using web search, cite sources clearly.

11. Special behavior for prompts in UI
- If the UI sends the system prompt editor text from the user, treat it as a request to temporarily override tone/constraints for that conversation only. Confirm when system prompt is changed in the UI.`;

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        return 'dark';
      }
    }
    return 'light';
  });
  
  const aiRef = useRef<GoogleGenAI | null>(null);
  const historyRef = useRef<Content[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Apply theme class and save to localStorage
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [theme]);

  // Initialize the AI model
  useEffect(() => {
    try {
      aiRef.current = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    } catch (e: any) {
       setError("Failed to initialize the AI model. Please check your API key.");
       console.error(e);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    historyRef.current = [];
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newUserMessage: Message = { sender: 'user', text };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setIsLoading(true);
    setError(null);

    // Add user message to history for multi-turn conversation
    historyRef.current.push({ role: 'user', parts: [{ text }] });

    try {
      if (!aiRef.current) {
          throw new Error("AI model not initialized.");
      }
      
      const response = await aiRef.current.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: historyRef.current,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{googleSearch: {}}]
        }
      });
      
      const aiText = response.text;
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: Source[] = groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter(Boolean) ?? [];
      
      const aiResponse: Message = { sender: 'ai', text: aiText, sources };
      
      // Add AI response to history
      historyRef.current.push({ role: 'model', parts: [{ text: aiText }] });

      setMessages(prevMessages => [...prevMessages, aiResponse]);

    } catch (e: any) {
      const errorMessage = "Sorry, something went wrong. Please try again.";
      setError(errorMessage);
       setMessages(prevMessages => [...prevMessages, {sender: 'ai', text: errorMessage}]);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-sans">
        <Header onClearChat={handleClearChat} theme={theme} setTheme={setTheme} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {messages.length === 0 && !isLoading && <Welcome />}
            {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg} />
            ))}
             {isLoading && messages.length > 0 && messages[messages.length - 1].sender === 'user' && (
                <ChatMessage message={{ sender: 'ai', text: '' }} isLoading={true} />
            )}
            <div ref={messagesEndRef} />
        </main>
        <div className="p-4 md:p-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
             {error && <p className="text-red-500 dark:text-red-400 text-center text-sm mb-2">{error}</p>}
             <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
             <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                Powered by Gemini API. Responses may be inaccurate.
             </p>
        </div>
    </div>
  );
};

export default App;