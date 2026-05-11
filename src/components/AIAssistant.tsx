import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { processUserMessage } from '../lib/ai';
import { useWorkoutStore } from '../store/workoutStore';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { settings } = useWorkoutStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent, presetMessage?: string) => {
    e?.preventDefault();
    const userMsg = (presetMessage || input).trim();
    if (!userMsg || isLoading) return;
    
    setInput('');
    const newHistory = [...messages, { role: 'user' as const, content: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    const response = await processUserMessage(userMsg, messages);
    
    setMessages([...newHistory, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="glass-card w-80 sm:w-96 mb-4 flex flex-col shadow-2xl border border-dark-600 overflow-hidden"
              style={{ height: '500px', maxHeight: '80vh' }}
            >
              {/* Header */}
              <div className="bg-dark-800 p-4 border-b border-dark-600 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-white font-semibold">AI Coach</h3>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-dark-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-dark-300 text-sm mt-10">
                    <Bot className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p>Ask me about your PRs, tell me to start a workout, or ask for advice!</p>
                    {!settings.aiApiKey && (
                      <p className="text-red-400 mt-4 text-xs">
                        ⚠️ Please add your Gemini API Key in Settings first.
                      </p>
                    )}
                    {settings.aiApiKey && (
                      <div className="flex flex-wrap gap-2 justify-center mt-6">
                        {[
                          "Analyze my recent workouts",
                          "What is my Bench Press PR?",
                          "Start a 15m cardio run",
                          "Generate a quick core routine",
                        ].map(suggestion => (
                          <button
                            key={suggestion}
                            onClick={() => handleSend(undefined, suggestion)}
                            className="bg-dark-700 hover:bg-dark-600 text-xs text-dark-100 border border-dark-500 rounded-full px-3 py-1.5 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white rounded-tr-sm' 
                          : 'bg-dark-700 text-dark-100 rounded-tl-sm border border-dark-600'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-dark-700 rounded-2xl rounded-tl-sm px-4 py-3 border border-dark-600">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-dark-800 border-t border-dark-600">
                <form onSubmit={(e) => handleSend(e)} className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Message your coach..."
                    className="flex-1 bg-dark-900 border border-dark-600 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white disabled:opacity-50 hover:bg-purple-500 transition-colors shrink-0"
                  >
                    <Send className="w-4 h-4 ml-1" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shadow-lg hover:bg-purple-500 transition-colors relative"
        >
          {isOpen ? <X className="w-6 h-6 text-white" /> : <Sparkles className="w-6 h-6 text-white" />}
          {!settings.aiApiKey && !isOpen && (
             <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-dark-900" />
          )}
        </motion.button>
      </div>
    </>
  );
}
