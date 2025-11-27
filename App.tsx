import React, { useState } from 'react';
import { generateMemoryAids } from './services/geminiService';
import { InputSection } from './components/InputSection';
import { MemoryDisplay } from './components/MemoryDisplay';
import { MemoryData } from './types';
import { AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [memoryData, setMemoryData] = useState<MemoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (text: string) => {
    setIsLoading(true);
    setError(null);
    setMemoryData(null);

    try {
      const data = await generateMemoryAids(text);
      setMemoryData(data);
    } catch (err: any) {
      setError(err.message || "出错了，请重试。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        
        <InputSection onGenerate={handleGenerate} isLoading={isLoading} />

        {error && (
          <div className="max-w-4xl mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {memoryData && (
          <div className="mt-12">
            <MemoryDisplay data={memoryData} />
          </div>
        )}

      </main>

      <footer className="py-6 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        <p>由 Google Gemini 2.5 Flash 驱动 • 专为快速高效学习设计</p>
      </footer>
    </div>
  );
};

export default App;