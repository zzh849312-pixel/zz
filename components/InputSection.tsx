import React, { useState } from 'react';
import { ArrowRight, Sparkles, GraduationCap } from 'lucide-react';

interface InputSectionProps {
  onGenerate: (text: string) => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({ onGenerate, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onGenerate(text);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight flex items-center justify-center gap-3">
          <GraduationCap className="w-12 h-12 text-indigo-600" />
          备考助手
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl mx-auto">
          专为研究考试（考研、考证）设计。粘贴专业理论，获取标准名词解释、核心考点提炼及配套测验。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative group transition-all duration-300 hover:shadow-2xl">
        <textarea
          className="w-full h-48 p-6 text-slate-700 text-lg resize-none focus:outline-none focus:bg-slate-50 transition-colors"
          placeholder="在此粘贴需要背诵的考点（例如：'辩证唯物主义'，'罪刑法定原则'，'细胞信号转导' 等）..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isLoading}
        />
        
        <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {text.length} 字符
          </span>
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition-all transform
              ${!text.trim() || isLoading 
                ? 'bg-slate-300 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-lg hover:shadow-indigo-500/30'}
            `}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                智能提取中...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                生成考点
              </>
            )}
          </button>
        </div>
      </form>

      {/* Quick suggestions */}
      {!text && (
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <span className="text-sm text-slate-500 mr-2">真题示例:</span>
          {['剩余价值理论', '行政复议法', '认知失调理论', '热力学第二定律', 'TCP/IP模型'].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setText(suggestion)}
              className="text-sm px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};