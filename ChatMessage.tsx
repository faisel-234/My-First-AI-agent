import React from 'react';
import { Message, Source } from './App';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
  isLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, isLoading = false }) => {
  const isAi = message.sender === 'ai';

  const LoadingIndicator = () => (
    <div className="flex items-center space-x-2">
      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-pulse"></div>
    </div>
  );

  const Sources = ({ sources }: { sources: Source[] }) => (
    <div className="mt-4 border-t border-gray-300 dark:border-gray-600 pt-3">
      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 tracking-wider">SOURCES</h4>
      <div className="flex flex-col gap-2">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
            title={source.title}
          >
            <span className="font-medium">{index + 1}.</span> {source.title || new URL(source.uri).hostname}
          </a>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`flex items-start gap-4 ${isAi ? 'justify-start' : 'justify-end'}`}>
      {isAi && (
         <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-600 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
        </div>
      )}
      <div 
        className={`max-w-2xl p-4 rounded-2xl ${isAi ? 'bg-gray-100 dark:bg-gray-700 rounded-tl-none' : 'bg-indigo-600 text-white rounded-br-none'}`}
      >
        {isLoading ? <LoadingIndicator /> : (
           <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.text}
              </ReactMarkdown>
              {message.sources && message.sources.length > 0 && <Sources sources={message.sources} />}
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;