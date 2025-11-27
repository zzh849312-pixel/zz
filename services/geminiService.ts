import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { MemoryData, FeynmanEvaluation } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const memorySchema: Schema = {
  type: Type.OBJECT,
  properties: {
    simpleExplanation: {
      type: Type.STRING,
      description: "【至关重要】针对零基础初学者的'大白话'解释。完全抛弃专业术语，用甚至有点'土'但非常直观的语言把概念讲清楚。假设用户只有初中水平。",
    },
    backgroundContext: {
      type: Type.STRING,
      description: "这个理论/概念是为了解决什么问题而诞生的？它的应用场景是什么？简述其背景，帮助用户建立上下文。",
    },
    misconceptions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "初学者容易产生的2-3个误解或混淆点（例如：'很多人以为X就是Y，其实X是...'）。",
    },
    deconstruction: {
      type: Type.OBJECT,
      properties: {
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stepNumber: { type: Type.INTEGER },
              title: { type: Type.STRING, description: "这个微步骤的小标题" },
              content: { type: Type.STRING, description: "这个微步骤的具体知识点解释，短小精悍" },
              keyTerm: { type: Type.STRING, description: "这个步骤涉及的子术语" },
            },
            required: ["stepNumber", "title", "content", "keyTerm"],
          },
          description: "将复杂的大理论拆解为 4-6 个逻辑递进的学习步骤（微学习）。",
        },
        synthesis: {
          type: Type.STRING,
          description: "总结段落：在学完上述步骤后，如何将这些碎片重新组合成完整的理论？",
        },
      },
      required: ["steps", "synthesis"],
    },
    integration: {
      type: Type.OBJECT,
      properties: {
        parentCategory: { type: Type.STRING, description: "该概念所属的上位学科或大类（例如：'民法学 > 债权编'）。" },
        conceptTree: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING },
          description: "概念层级树，从宏观到微观，例如 ['法学', '民法', '物权', '所有权', '不动产所有权']" 
        },
        prerequisites: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING, description: "学习当前知识前，通常需要掌握的'旧知识'。" },
              connection: { type: Type.STRING, description: "解释新旧知识的联系：'这个旧知识是当前理论的基础，因为...'。" }
            },
            required: ["concept", "connection"]
          },
          description: "2个前置知识点，帮助用户建立新旧知识的桥梁。"
        },
        confusingConcepts: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              concept: { type: Type.STRING, description: "容易混淆的相似概念" },
              similarity: { type: Type.STRING, description: "为什么容易混？" },
              difference: { type: Type.STRING, description: "核心区别在哪里？" }
            },
            required: ["concept", "similarity", "difference"]
          },
          description: "2个容易混淆的相关概念对比。"
        },
        comprehensiveCase: { 
          type: Type.STRING, 
          description: "一个复杂的实务案例或综合问题，强迫用户将当前理论与相关知识结合起来运用。" 
        }
      },
      required: ["parentCategory", "conceptTree", "prerequisites", "confusingConcepts", "comprehensiveCase"],
      description: "融会贯通模块：帮助用户建立知识体系，联系新旧知识。"
    },
    definition: {
      type: Type.STRING,
      description: "标准的名词解释答案，语言学术、严谨、精炼，直接对标考研或专业考试的满分答案。",
    },
    coreTheory: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "该理论的3-5个核心要点或特征，分条列出，逻辑清晰。",
    },
    analogy: {
      type: Type.STRING,
      description: "一个具体的、生活化的类比来辅助理解晦涩的理论（例如：'就像水管...'）。",
    },
    mnemonic: {
      type: Type.STRING,
      description: "一个有创意的中文助记口诀、顺口溜或打油诗，包含核心关键词。",
    },
    keywords: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "考试中的核心采分词、关键术语（3-5个）。",
    },
    memoryPalace: {
      type: Type.STRING,
      description: "一个生动、离奇或有趣的视觉场景描述，将核心理论具象化，适合记忆宫殿。",
    },
    flashcards: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          answer: { type: Type.STRING },
        },
        required: ["question", "answer"],
      },
      description: "5个模拟真题，包含名词解释题和简答题。",
    },
    fillInTheBlanks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          context: { type: Type.STRING, description: "从理论中摘取的关键句子，将核心关键词用 '_____' 代替。" },
          answer: { type: Type.STRING, description: "被挖去的那个关键词。" },
        },
        required: ["context", "answer"],
      },
      description: "5个填空自测题，用于检验对关键词的精准记忆。",
    },
  },
  required: ["simpleExplanation", "backgroundContext", "misconceptions", "deconstruction", "integration", "definition", "coreTheory", "analogy", "mnemonic", "keywords", "memoryPalace", "flashcards", "fillInTheBlanks"],
};

// --- Text Generation ---

export const generateMemoryAids = async (inputText: string): Promise<MemoryData> => {
  const ai = getAI();
  const prompt = `
    你是一位经验极其丰富的金牌考研/考证辅导老师，同时也是一位**知识架构师**。
    请分析以下的专业文本，并将其转化为备考资料。
    
    待分析文本:
    "${inputText}"
    
    请严格按照 JSON 格式生成回复，并确保所有内容都使用**中文**。
    
    你的教学策略（重要）：
    1. **先破冰 (Beginner Friendly)**: 用户基础很差，先用"人话"（simpleExplanation）把核心逻辑讲通。
    2. **原子拆解 (Atomic Breakdown)**: 将理论拆解成 4-6 个微步骤（deconstruction）。
    3. **融会贯通 (Integration)**: 
       - 绘制知识地图（conceptTree），告诉用户这个知识点在整个学科里的位置。
       - 寻找"前置知识"（prerequisites），联系旧知识。
       - 对比"易混概念"（confusingConcepts），厘清边界。
    4. **后专业 (Professional)**: 给出严谨的考试标准定义（definition）和采分点（keywords）。
    5. **辅助记忆**: 类比、口诀、记忆宫殿。
    
    目标：不仅记住这个点，还要织成一张网，实现新旧知识的融合。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: memorySchema,
        temperature: 0.3, 
      },
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Gemini 没有返回任何内容。");
    }

    return JSON.parse(textResponse) as MemoryData;
  } catch (error: any) {
    console.error("Gemini API Error (Text):", error);
    throw new Error(error.message || "生成记忆辅助内容失败，请重试。");
  }
};

// --- Audio (TTS) ---

export const generateSpeech = async (text: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("无法生成语音数据");
    return base64Audio;
  } catch (error: any) {
    console.error("Gemini API Error (TTS):", error);
    throw new Error("语音生成失败");
  }
};

// --- Audio Evaluation (Feynman) ---

export const evaluateAudioExplanation = async (
  targetDefinition: string, 
  audioBase64: string, 
  mimeType: string
): Promise<FeynmanEvaluation> => {
  const ai = getAI();

  const prompt = `
    你是一位严格的考试阅卷老师。用户正在尝试用“费曼技巧”（用自己的话解释）来背诵这个概念。
    
    标准定义: "${targetDefinition}"
    
    请听用户的录音。
    任务：
    1. 判断用户是否真正理解了这个概念的核心逻辑。
    2. 指出用户遗漏了哪些关键采分点。
    3. 如果用户只是在死记硬背但没理解，请指出来。
    4. 给出一个 0-100 的评分。
    
    请返回 JSON 格式。
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "0-100 score based on accuracy and understanding." },
      feedback: { type: Type.STRING, description: "Detailed feedback in Chinese." },
      missingPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of key concepts missed." },
      betterExplanation: { type: Type.STRING, description: "A corrected, simple version of what the user SHOULD have said." }
    },
    required: ["score", "feedback", "missingPoints", "betterExplanation"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    return JSON.parse(response.text || "{}") as FeynmanEvaluation;
  } catch (error: any) {
    console.error("Evaluation Error:", error);
    throw new Error("AI 评估音频失败，请重试。");
  }
};

// --- Image Generation ---

export const generateImage = async (prompt: string): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: "Create a vivid, detailed illustration suitable for a memory palace scene: " + prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      },
    });

    let base64Image = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) throw new Error("无法生成图片数据");
    return base64Image;
  } catch (error: any) {
    console.error("Gemini API Error (Image):", error);
    throw new Error("图片生成失败");
  }
};

// --- Video Generation ---

export const generateVideo = async (prompt: string): Promise<string> => {
  const ai = getAI(); 
  
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: "Cinematic, high quality, clear video of: " + prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    // Polling
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("视频生成未能返回下载链接");

    const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!res.ok) throw new Error("无法下载生成的视频");
    
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error("Gemini API Error (Video):", error);
    throw new Error("视频生成失败: " + (error.message || "未知错误"));
  }
};

// --- Audio Utils ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

let audioContext: AudioContext | null = null;

export const playAudioData = async (base64Audio: string) => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  const audioBuffer = await decodeAudioData(
    decode(base64Audio),
    audioContext,
    24000,
    1,
  );

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  
  return source;
};