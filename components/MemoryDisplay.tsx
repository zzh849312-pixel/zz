import React, { useState, useRef } from 'react';
import { MemoryData, TabType, FeynmanEvaluation } from '../types';
import { BrainCircuit, Eye, Hash, HelpCircle, Layers, Book, Volume2, Image as ImageIcon, Video, Loader2, CheckCircle2, Edit3, Sprout, Lightbulb, AlertTriangle, MessageCircle, Mic, Square, Send, RotateCcw, ListTree, ArrowRight, ArrowLeft, GitMerge, Network, Link, Scale, Briefcase } from 'lucide-react';
import { generateSpeech, playAudioData, generateImage, generateVideo, evaluateAudioExplanation } from '../services/geminiService';

interface MemoryDisplayProps {
  data: MemoryData;
}

export const MemoryDisplay: React.FC<MemoryDisplayProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<TabType>('theory');
  const [activeCardIndex, setActiveCardIndex] = useState<number | null>(null);
  const [activeQuizMode, setActiveQuizMode] = useState<'blanks' | 'cards'>('blanks');
  
  // Breakdown/Deconstruction State
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Fill in blanks state
  const [blankAnswers, setBlankAnswers] = useState<{ [key: number]: string }>({});
  const [showBlankResults, setShowBlankResults] = useState<{ [key: number]: boolean }>({});

  // Media States
  const [audioLoading, setAudioLoading] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');

  // Feynman Recorder States
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<FeynmanEvaluation | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const toggleCard = (index: number) => {
    setActiveCardIndex(activeCardIndex === index ? null : index);
  };

  const handlePlayAudio = async (text: string, id: string) => {
    if (audioLoading) return;
    setAudioLoading(id);
    try {
      const base64 = await generateSpeech(text);
      await playAudioData(base64);
    } catch (e) {
      alert("播放失败，请重试");
    } finally {
      setAudioLoading(null);
    }
  };

  const handleGenerateImage = async () => {
    if (imageLoading || generatedImage) return;
    setImageLoading(true);
    try {
      const base64 = await generateImage(data.memoryPalace);
      setGeneratedImage(`data:image/png;base64,${base64}`);
    } catch (e) {
      alert("图片生成失败");
    } finally {
      setImageLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (videoLoading || generatedVideo) return;
    if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        try {
          await window.aistudio.openSelectKey();
        } catch (e) {
          console.error("Key selection failed", e);
          return;
        }
      }
    }
    setVideoLoading(true);
    setVideoStatus('正在请求视频生成 (可能需要 1-2 分钟)...');
    try {
      const videoUrl = await generateVideo(data.memoryPalace);
      setGeneratedVideo(videoUrl);
    } catch (e) {
      console.error(e);
      alert("视频生成失败，请确保选择了付费项目的 API Key。");
    } finally {
      setVideoLoading(false);
      setVideoStatus('');
    }
  };

  // --- Recorder Logic ---
  const startRecording = async () => {
    try {
      setEvaluation(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("无法访问麦克风，请检查权限设置。");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitForEvaluation = async () => {
    if (!audioBlob) return;
    setIsEvaluating(true);

    try {
      // Convert Blob to Base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Content = base64data.split(',')[1];
        const mimeType = base64data.split(',')[0].split(':')[1].split(';')[0];

        try {
          const result = await evaluateAudioExplanation(data.definition, base64Content, mimeType);
          setEvaluation(result);
        } catch (err) {
          alert("AI 评估失败，请稍后重试。");
        } finally {
          setIsEvaluating(false);
        }
      };
    } catch (e) {
      console.error(e);
      setIsEvaluating(false);
    }
  };

  const handleBlankCheck = (index: number) => {
    setShowBlankResults(prev => ({ ...prev, [index]: true }));
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabType; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`
        flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-all border-b-2 min-w-[100px]
        ${activeTab === id 
          ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
      `}
    >
      <Icon className={`w-4 h-4 ${activeTab === id ? 'fill-indigo-600/10' : ''}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );

  const PlayButton = ({ text, id }: { text: string, id: string }) => (
    <button
      onClick={() => handlePlayAudio(text, id)}
      disabled={!!audioLoading}
      className="flex-shrink-0 ml-2 p-2 rounded-full text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors disabled:opacity-50"
      title="朗读"
    >
      {audioLoading === id ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Volume2 className="w-5 h-5" />
      )}
    </button>
  );

  return (
    <div className="w-full max-w-5xl mx-auto p-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
      
      {/* Scoring Points (Keywords) - Always Visible - Enhanced Highlighting */}
      <div className="mb-8">
        <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl shadow-sm ring-1 ring-amber-100">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <span className="flex items-center gap-2 text-sm font-extrabold text-amber-800 uppercase tracking-wider flex-shrink-0">
              <Hash className="w-5 h-5 text-amber-600" />
              核心采分词:
            </span>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((kw, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border-2 border-amber-200 text-amber-800 text-sm font-bold rounded-lg shadow-sm transform transition-all hover:-translate-y-0.5 hover:shadow-md cursor-default">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          <TabButton id="theory" label="理解 & 理论" icon={Book} />
          <TabButton id="breakdown" label="拆解学习" icon={ListTree} />
          <TabButton id="integration" label="融会贯通" icon={Network} />
          <TabButton id="visualize" label="视觉 & 视频" icon={Eye} />
          <TabButton id="mnemonic" label="巧记口诀" icon={BrainCircuit} />
          <TabButton id="quiz" label="实战演练" icon={Edit3} />
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-10 flex-grow bg-slate-50/30">
          
          {/* 1. Theory Tab */}
          {activeTab === 'theory' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* === BEGINNER SECTION (NEW) === */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wide">
                    第一步：零基础入门
                  </span>
                  <span className="text-slate-400 text-xs">先看懂，再背诵</span>
                </div>

                {/* ELI5 (Simple Explanation) */}
                <div className="bg-green-50/50 p-6 rounded-xl border border-green-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                      <Sprout className="w-5 h-5 text-green-600" />
                      大白话解释
                    </h3>
                    <PlayButton text={data.simpleExplanation} id="simpleExpl" />
                  </div>
                  <p className="text-green-900/90 text-lg leading-relaxed font-medium">
                    {data.simpleExplanation}
                  </p>
                </div>

                {/* Background & Context */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      为什么要学这个？(背景)
                    </h4>
                    <p className="text-slate-700 text-sm leading-relaxed">
                      {data.backgroundContext}
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      初学者避坑指南 (误区)
                    </h4>
                    <ul className="space-y-2">
                      {data.misconceptions.map((m, i) => (
                        <li key={i} className="flex gap-2 text-sm text-slate-700">
                          <span className="text-orange-400">•</span>
                          {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-slate-50 px-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    第二步：进阶专业背诵
                  </span>
                </div>
              </div>

              {/* Analogy Box */}
              <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    形象类比
                  </h3>
                  <PlayButton text={data.analogy} id="analogy" />
                </div>
                <p className="text-blue-800 leading-relaxed text-justify">
                  {data.analogy}
                </p>
              </div>

              {/* Definition Box */}
              <div className="bg-white p-6 rounded-xl border-l-4 border-indigo-500 shadow-sm relative group">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Book className="w-5 h-5 text-indigo-600" />
                    名词解释 (标准答案)
                  </h3>
                  <PlayButton text={data.definition} id="definition" />
                </div>
                <p className="text-slate-800 leading-relaxed text-lg text-justify font-serif">
                  {data.definition}
                </p>
                <span className="absolute top-2 right-2 text-xs text-indigo-300 font-mono opacity-50 group-hover:opacity-100 transition-opacity">Exam Standard</span>
              </div>

              {/* Core Theory Breakdown */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    理论要点 (简答题框架)
                 </h3>
                 <ul className="space-y-4">
                   {data.coreTheory.map((point, idx) => (
                     <li key={idx} className="flex gap-3">
                       <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm">
                         {idx + 1}
                       </span>
                       <p className="text-slate-700 leading-relaxed">{point}</p>
                     </li>
                   ))}
                 </ul>
              </div>

              {/* === FEYNMAN TECHNIQUE / VOICE INTERACTIVE SECTION === */}
              <div className="mt-12 bg-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-indigo-700 p-2 rounded-lg">
                       <Mic className="w-6 h-6 text-indigo-200" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">费曼技巧 - 模拟口试</h3>
                      <p className="text-indigo-200 text-sm">用自己的话把上面的理论讲一遍，AI 老师会给你打分。</p>
                    </div>
                  </div>

                  <div className="bg-indigo-800/50 rounded-xl p-6 border border-indigo-700 backdrop-blur-sm">
                    
                    {/* Recording Controls */}
                    <div className="flex flex-col items-center justify-center gap-6 py-4">
                       {!audioBlob && !isRecording && (
                         <button 
                           onClick={startRecording}
                           className="flex flex-col items-center gap-2 group"
                         >
                           <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-lg group-hover:bg-red-600 group-hover:scale-110 transition-all">
                             <Mic className="w-8 h-8 text-white" />
                           </div>
                           <span className="text-sm font-medium text-indigo-200 group-hover:text-white">点击开始录音</span>
                         </button>
                       )}

                       {isRecording && (
                         <div className="flex flex-col items-center gap-4">
                           <div className="flex items-center gap-2">
                             <span className="relative flex h-3 w-3">
                               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                               <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                             </span>
                             <span className="text-red-300 font-mono">正在录音...</span>
                           </div>
                           <button 
                             onClick={stopRecording}
                             className="px-8 py-3 bg-white text-indigo-900 rounded-full font-bold hover:bg-slate-100 transition-colors flex items-center gap-2"
                           >
                             <Square className="w-4 h-4 fill-current" /> 停止录音
                           </button>
                         </div>
                       )}

                       {audioBlob && !isEvaluating && !evaluation && (
                         <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in">
                            <p className="text-indigo-200 text-sm">录音已完成</p>
                            <div className="flex gap-3">
                              <button 
                                onClick={startRecording} // Re-record
                                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-600 rounded-lg text-sm text-indigo-100 transition-colors flex items-center gap-2"
                              >
                                <RotateCcw className="w-4 h-4" /> 重录
                              </button>
                              <button 
                                onClick={submitForEvaluation}
                                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold shadow-lg shadow-green-900/20 transition-all flex items-center gap-2"
                              >
                                <Send className="w-4 h-4" /> 提交 AI 评分
                              </button>
                            </div>
                         </div>
                       )}

                       {isEvaluating && (
                         <div className="flex flex-col items-center gap-2 text-indigo-200">
                           <Loader2 className="w-8 h-8 animate-spin text-white" />
                           <span>AI 老师正在认真听讲...</span>
                         </div>
                       )}
                    </div>

                    {/* Evaluation Results */}
                    {evaluation && (
                      <div className="mt-6 bg-white rounded-xl p-6 text-slate-800 animate-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                           <h4 className="font-bold text-lg flex items-center gap-2">
                             <CheckCircle2 className={`w-5 h-5 ${evaluation.score >= 60 ? 'text-green-500' : 'text-red-500'}`} />
                             测评结果
                           </h4>
                           <div className={`text-2xl font-black ${evaluation.score >= 80 ? 'text-green-600' : evaluation.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                             {evaluation.score} <span className="text-sm font-normal text-slate-400">/ 100分</span>
                           </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI 点评</span>
                            <p className="text-slate-700 mt-1 leading-relaxed">{evaluation.feedback}</p>
                          </div>
                          
                          {evaluation.missingPoints.length > 0 && (
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-2">漏掉的知识点</span>
                              <ul className="list-disc list-inside space-y-1">
                                {evaluation.missingPoints.map((point, idx) => (
                                  <li key={idx} className="text-sm text-red-800">{point}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-2">满分回答参考</span>
                            <p className="text-sm text-indigo-900 italic">"{evaluation.betterExplanation}"</p>
                          </div>

                          <div className="flex justify-center pt-2">
                            <button 
                              onClick={() => { setEvaluation(null); setAudioBlob(null); }}
                              className="text-sm text-slate-500 hover:text-indigo-600 underline"
                            >
                              再试一次
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 2. Breakdown / Deconstruction Tab */}
          {activeTab === 'breakdown' && (
            <div className="h-full flex flex-col animate-in fade-in duration-300">
               <div className="text-center mb-8">
                  <h3 className="text-xl font-bold text-slate-900 flex items-center justify-center gap-2">
                    <ListTree className="w-6 h-6 text-blue-600" />
                    原子化拆解学习
                  </h3>
                  <p className="text-slate-500 text-sm mt-2">将复杂理论拆解为微小的步骤，一步步来，最后重组。</p>
               </div>

               <div className="flex-grow flex flex-col md:flex-row gap-8">
                 {/* Steps List (Left/Top) */}
                 <div className="md:w-1/3 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                   {data.deconstruction?.steps.map((step, idx) => (
                     <button
                       key={idx}
                       onClick={() => setActiveStepIndex(idx)}
                       className={`
                         flex-shrink-0 flex items-center p-3 rounded-xl border-2 transition-all text-left w-full
                         ${activeStepIndex === idx 
                            ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-100 ring-offset-2' 
                            : 'border-slate-100 bg-white hover:border-blue-200'}
                       `}
                     >
                       <div className={`
                         w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0
                         ${activeStepIndex === idx ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}
                       `}>
                         {step.stepNumber}
                       </div>
                       <div className="min-w-[120px]">
                         <p className={`text-sm font-bold ${activeStepIndex === idx ? 'text-blue-900' : 'text-slate-600'}`}>
                           {step.title}
                         </p>
                         <p className="text-xs text-slate-400 truncate">{step.keyTerm}</p>
                       </div>
                     </button>
                   ))}
                   
                   {/* Synthesis Button */}
                   <button
                     onClick={() => setActiveStepIndex(data.deconstruction?.steps.length || 0)}
                     className={`
                       flex-shrink-0 flex items-center p-3 rounded-xl border-2 transition-all text-left w-full mt-2
                       ${activeStepIndex === (data.deconstruction?.steps.length) 
                          ? 'border-purple-500 bg-purple-50 shadow-md ring-2 ring-purple-100 ring-offset-2' 
                          : 'border-slate-100 bg-white hover:border-purple-200'}
                     `}
                   >
                     <div className={`
                       w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3 flex-shrink-0
                       ${activeStepIndex === (data.deconstruction?.steps.length) ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'}
                     `}>
                       <GitMerge className="w-4 h-4" />
                     </div>
                     <span className="text-sm font-bold">逻辑重组 (总结)</span>
                   </button>
                 </div>

                 {/* Step Content (Right/Bottom) */}
                 <div className="md:w-2/3">
                   {activeStepIndex < (data.deconstruction?.steps.length || 0) ? (
                     <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                           <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                             Step {data.deconstruction?.steps[activeStepIndex].stepNumber}
                           </span>
                           <PlayButton text={data.deconstruction?.steps[activeStepIndex].content || ''} id={`step-${activeStepIndex}`} />
                        </div>
                        
                        <h2 className="text-2xl font-black text-slate-900 mb-2">
                          {data.deconstruction?.steps[activeStepIndex].title}
                        </h2>
                        <p className="text-sm font-mono text-blue-500 mb-6 bg-blue-50 inline-block px-2 py-1 rounded">
                          关键词: {data.deconstruction?.steps[activeStepIndex].keyTerm}
                        </p>
                        
                        <p className="text-lg text-slate-700 leading-loose flex-grow">
                          {data.deconstruction?.steps[activeStepIndex].content}
                        </p>

                        <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                          <button
                            onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                            disabled={activeStepIndex === 0}
                            className="text-slate-400 hover:text-slate-600 disabled:opacity-30 flex items-center gap-2"
                          >
                            <ArrowLeft className="w-5 h-5" /> 上一步
                          </button>
                          <button
                            onClick={() => setActiveStepIndex(activeStepIndex + 1)}
                            className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/30"
                          >
                            下一步 <ArrowRight className="w-5 h-5" />
                          </button>
                        </div>
                     </div>
                   ) : (
                     <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border border-purple-100 shadow-xl h-full flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-24 bg-purple-200 rounded-full blur-3xl opacity-30 -mr-12 -mt-12"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                          <h2 className="text-2xl font-black text-purple-900 mb-6 flex items-center gap-3">
                            <GitMerge className="w-8 h-8 text-purple-600" />
                            逻辑重组 (Synthesis)
                          </h2>
                          <div className="prose prose-lg prose-purple text-slate-700 leading-relaxed flex-grow">
                             <p>{data.deconstruction?.synthesis}</p>
                          </div>
                          
                          <div className="flex justify-start mt-8">
                             <button
                               onClick={() => setActiveStepIndex(0)}
                               className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-2"
                             >
                               <RotateCcw className="w-4 h-4" /> 重新拆解学习
                             </button>
                          </div>
                        </div>
                     </div>
                   )}
                 </div>
               </div>
            </div>
          )}

          {/* 3. Integration & Synthesis Tab (NEW) */}
          {activeTab === 'integration' && data.integration && (
             <div className="animate-in fade-in duration-300 space-y-8">
               
               {/* Header / Knowledge Map */}
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Network className="w-5 h-5 text-indigo-600" />
                    知识定位 (Macro View)
                 </h3>
                 <div className="flex items-center flex-wrap gap-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg">
                    {data.integration.conceptTree.map((concept, idx) => (
                      <React.Fragment key={idx}>
                        <span className={`px-3 py-1 rounded-full ${idx === data.integration.conceptTree.length - 1 ? 'bg-indigo-600 text-white font-bold' : 'bg-white border border-slate-200'}`}>
                          {concept}
                        </span>
                        {idx < data.integration.conceptTree.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-slate-300" />
                        )}
                      </React.Fragment>
                    ))}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Prerequisites (Old Knowledge) */}
                 <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                       <Link className="w-5 h-5" />
                       前置知识 (旧知识复习)
                    </h3>
                    <div className="space-y-4">
                      {data.integration.prerequisites.map((req, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100">
                           <div className="font-bold text-amber-800 mb-1">{req.concept}</div>
                           <p className="text-sm text-slate-600 leading-relaxed">{req.connection}</p>
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Confusion Matrix (Comparison) */}
                 <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                       <Scale className="w-5 h-5" />
                       易混辨析 (别搞混了)
                    </h3>
                    <div className="space-y-4">
                      {data.integration.confusingConcepts.map((item, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                           <div className="flex justify-between items-center mb-2">
                             <span className="font-bold text-red-800">Vs. {item.concept}</span>
                           </div>
                           <div className="text-xs space-y-2">
                             <p><span className="font-bold text-slate-500">相似点:</span> {item.similarity}</p>
                             <p><span className="font-bold text-slate-500">核心区别:</span> {item.difference}</p>
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>
               </div>

               {/* Comprehensive Case Study */}
               <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-xl">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-slate-300" />
                    综合案例分析 (融会贯通)
                  </h3>
                  <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed">
                    <p>{data.integration.comprehensiveCase}</p>
                  </div>
               </div>

             </div>
          )}

          {/* 4. Visual Palace Tab */}
          {activeTab === 'visualize' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col gap-6">
               <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-2xl shadow-2xl relative overflow-hidden flex-shrink-0">
                <div className="absolute top-0 right-0 p-32 bg-purple-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                    <Eye className="w-6 h-6 text-purple-300" />
                    记忆宫殿场景
                  </h3>
                  <div className="prose prose-invert prose-lg max-w-none">
                    <p className="leading-loose font-light text-slate-100 text-justify">
                      {data.memoryPalace}
                    </p>
                  </div>
                </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                 {/* Image Generator */}
                 <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] shadow-sm relative overflow-hidden">
                   {generatedImage ? (
                     <img src={generatedImage} alt="Generated Scene" className="w-full h-full object-cover rounded-xl" />
                   ) : (
                     <div className="text-center p-6">
                       <div className="bg-indigo-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                         <ImageIcon className="w-8 h-8 text-indigo-500" />
                       </div>
                       <h4 className="text-slate-800 font-bold mb-2">生成场景插图</h4>
                       <p className="text-xs text-slate-500 mb-4 max-w-[200px] mx-auto">将抽象的记忆宫殿描述转化为具体图像，加深视觉印像。</p>
                       <button 
                         onClick={handleGenerateImage}
                         disabled={imageLoading}
                         className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                       >
                         {imageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                         {imageLoading ? "绘图中..." : "生成图片"}
                       </button>
                     </div>
                   )}
                 </div>

                 {/* Video Generator */}
                 <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[300px] shadow-sm relative overflow-hidden">
                   {generatedVideo ? (
                     <video controls className="w-full h-full object-cover rounded-xl bg-black" src={generatedVideo} />
                   ) : (
                     <div className="text-center p-6">
                       <div className="bg-pink-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                         <Video className="w-8 h-8 text-pink-500" />
                       </div>
                       <h4 className="text-slate-800 font-bold mb-2">生成记忆视频 (Veo)</h4>
                       <p className="text-xs text-slate-500 mb-4 max-w-[200px] mx-auto">生成一段动态视频，提供更沉浸的场景联想 (需付费API Key)。</p>
                       <button 
                         onClick={handleGenerateVideo}
                         disabled={videoLoading}
                         className="px-6 py-2 bg-pink-600 text-white rounded-full font-medium hover:bg-pink-700 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                       >
                         {videoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                         {videoLoading ? "制作中..." : "生成视频"}
                       </button>
                       {videoLoading && (
                         <p className="text-xs text-pink-600 mt-4 animate-pulse">{videoStatus}</p>
                       )}
                     </div>
                   )}
                 </div>
               </div>
            </div>
          )}

          {/* 5. Mnemonic Tab */}
          {activeTab === 'mnemonic' && (
            <div className="animate-in fade-in duration-300 flex flex-col items-center justify-center h-full gap-8">
              <div className="text-center w-full max-w-2xl">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <h3 className="text-lg font-semibold text-slate-500 uppercase tracking-widest">记忆口诀</h3>
                  <PlayButton text={data.mnemonic} id="mnemonic" />
                </div>
                
                <div className="bg-white p-8 rounded-2xl border-2 border-indigo-100 shadow-lg">
                  <p className="text-2xl md:text-3xl font-black text-indigo-600 leading-relaxed">
                    {data.mnemonic}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Quiz Tab */}
          {activeTab === 'quiz' && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              
              {/* Quiz Mode Switcher */}
              <div className="flex justify-center mb-6 bg-slate-100 p-1 rounded-lg w-fit mx-auto">
                 <button
                   onClick={() => setActiveQuizMode('blanks')}
                   className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeQuizMode === 'blanks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                 >
                   填空自测
                 </button>
                 <button
                   onClick={() => setActiveQuizMode('cards')}
                   className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeQuizMode === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                 >
                   模拟真题
                 </button>
              </div>

              {activeQuizMode === 'blanks' && (
                <div className="space-y-4 max-w-2xl mx-auto w-full">
                  {data.fillInTheBlanks.map((item, idx) => {
                    const isRevealed = showBlankResults[idx];
                    const userAnswer = blankAnswers[idx] || '';
                    const isCorrect = userAnswer.trim() === item.answer.trim(); // Simplified check

                    return (
                      <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <p className="text-lg text-slate-800 mb-4 leading-relaxed">
                          {item.context.split('_____').map((part, i, arr) => (
                            <React.Fragment key={i}>
                              {part}
                              {i < arr.length - 1 && (
                                <span className="inline-block mx-1">
                                  {isRevealed ? (
                                     <span className="font-bold text-green-600 border-b-2 border-green-200 px-1">{item.answer}</span>
                                  ) : (
                                    <input 
                                      type="text" 
                                      className="w-24 border-b-2 border-indigo-200 bg-indigo-50/50 text-center focus:outline-none focus:border-indigo-500 text-indigo-900 font-medium px-1"
                                      value={blankAnswers[idx] || ''}
                                      onChange={(e) => setBlankAnswers({...blankAnswers, [idx]: e.target.value})}
                                      placeholder="?"
                                    />
                                  )}
                                </span>
                              )}
                            </React.Fragment>
                          ))}
                        </p>
                        
                        {!isRevealed ? (
                           <button 
                             onClick={() => handleBlankCheck(idx)}
                             className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 mt-2"
                           >
                             <CheckCircle2 className="w-4 h-4" /> 检查答案
                           </button>
                        ) : (
                           <div className="flex items-center gap-2 mt-2 text-sm">
                             <span className="font-bold text-slate-500">正确答案: {item.answer}</span>
                           </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {activeQuizMode === 'cards' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.flashcards.map((card, idx) => (
                    <div 
                      key={idx}
                      onClick={() => toggleCard(idx)}
                      className="cursor-pointer perspective-1000 group h-72"
                    >
                      <div className={`
                        relative w-full h-full duration-500 preserve-3d transition-transform shadow-lg rounded-xl
                        ${activeCardIndex === idx ? 'rotate-y-180' : ''}
                      `}>
                        {/* Front */}
                        <div className="absolute w-full h-full backface-hidden bg-white border-2 border-slate-100 p-8 rounded-xl flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors">
                          <span className="absolute top-4 left-4 text-xs font-bold text-slate-400 uppercase">模拟题 {idx + 1}</span>
                          <HelpCircle className="w-8 h-8 text-indigo-100 mb-4" />
                          <p className="text-xl font-medium text-slate-800">{card.question}</p>
                          <span className="absolute bottom-4 text-xs text-indigo-500 font-semibold mt-4">点击查看参考答案</span>
                        </div>

                        {/* Back */}
                        <div className="absolute w-full h-full backface-hidden bg-indigo-600 p-8 rounded-xl flex flex-col items-center justify-center text-center rotate-y-180 overflow-y-auto custom-scrollbar">
                          <span className="absolute top-4 left-4 text-xs font-bold text-indigo-200 uppercase">参考答案</span>
                          <p className="text-white leading-relaxed text-sm md:text-base">{card.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};