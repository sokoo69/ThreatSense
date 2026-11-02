'use client';

import React, { useState } from 'react';
import { Send, FileText, Bot, User, Sparkles } from 'lucide-react';
import { useThreatStore } from '../store/useThreatStore';

export const ConversationSection: React.FC = () => {
  const { conversationMessages, askQuestion, summarizeSession } = useThreatStore();
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    askQuestion(inputText.trim());
    setInputText('');
  };

  return (
    <div className="space-y-2">
      {/* Small caps label */}
      <div className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase font-semibold">
        CONVERSATION
      </div>

      {/* Dark Bordered Box */}
      <div className="rounded-[10px] bg-[#121214] border border-[#27272a] p-4 flex flex-col justify-between min-h-[220px]">
        {/* Messages Feed */}
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
          {conversationMessages.map((msg) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 text-xs ${isBot ? 'items-start' : 'items-start justify-end'}`}
              >
                {isBot && (
                  <div className="w-5 h-5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3 h-3" />
                  </div>
                )}

                <div
                  className={`p-2.5 rounded-lg max-w-[85%] whitespace-pre-wrap leading-relaxed ${
                    isBot
                      ? 'bg-[#18181b] border border-white/5 text-zinc-300 font-mono text-[11px]'
                      : 'bg-[#5b5bd6]/20 border border-[#5b5bd6]/40 text-indigo-200'
                  }`}
                >
                  {msg.text}
                </div>

                {!isBot && (
                  <div className="w-5 h-5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Input Row */}
        <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-white/5 flex gap-2">
          <input
            type="text"
            placeholder="Ask a question about your expression..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-[#18181b] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#5b5bd6] font-mono"
          />

          {/* Indigo [Ask] button */}
          <button
            type="submit"
            className="btn-primary-indigo px-3.5 py-2 text-xs flex items-center gap-1.5 font-semibold"
          >
            <span>Ask</span>
            <Send className="w-3 h-3" />
          </button>

          {/* Dark [Summarize session] button */}
          <button
            type="button"
            onClick={summarizeSession}
            className="btn-control px-3 py-2 text-xs flex items-center gap-1.5 whitespace-nowrap"
            title="Generate executive session summary"
          >
            <FileText className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Summarize session</span>
          </button>
        </form>
      </div>

      {/* Optional Adapter Slot for Real LLM */}
      {/*
        TODO: REAL LLM ADAPTER HOOK
        Replace deterministic template responses in `askQuestion` with:
        const response = await fetch('/api/llm/chat', { method: 'POST', body: JSON.stringify({ prompt, telemetryHistory }) });
      */}
    </div>
  );
};
