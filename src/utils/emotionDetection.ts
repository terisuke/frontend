/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/utils/emotionDetection.ts を更新
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let isInitializing = false;

export interface EmotionScore {
  timestamp: number;
  confidence: number;
  emotions: {
    happy: number;
    sad: number;
    angry: number;
    surprised: number;
    neutral: number;
  };
}

export async function initializeFaceDetector() {
  if (!faceLandmarker && !isInitializing) {
    try {
      isInitializing = true;
      console.log('Starting face landmarker initialization...');

      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      console.log('FilesetResolver created');

      faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
          delegate: "GPU"
        },
        outputFaceBlendshapes: true,
        runningMode: "VIDEO",
        numFaces: 1
      });
      console.log('Face landmarker created successfully');
    } catch (error) {
      console.error('Error initializing face landmarker:', error);
      throw error;
    } finally {
      isInitializing = false;
    }
  }
  return faceLandmarker;
}

function calculateNeutralScore(blendshapes: any[]) {
  // 他の感情表現が少ない場合をニュートラルとして扱う
  const expressiveFeatures = [
    'mouthSmile',
    'mouthFrown',
    'browDown',
    'browInnerUp',
    'eyeWide',
    'jawOpen'
  ];

  // 表情の変化量を計算
  const expressionIntensity = expressiveFeatures.reduce((total, feature) => {
    const shape = blendshapes.find(b => 
      b.categoryName.toLowerCase().includes(feature.toLowerCase())
    );
    return total + (shape ? shape.score : 0);
  }, 0) / expressiveFeatures.length;

  // 表情の変化が少ないほどニュートラルスコアが高くなる
  return 1 - Math.min(expressionIntensity * 2, 1);
}

export async function detectEmotion(video: HTMLVideoElement): Promise<EmotionScore | null> {
  if (!faceLandmarker) {
    console.log('Initializing face landmarker...');
    await initializeFaceDetector();
  }

  try {
    const results = faceLandmarker!.detectForVideo(video, performance.now());
    console.log('Detection results:', results);

    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0].categories;
      console.log('Blendshapes:', blendshapes);
      
      const emotions = {
        happy: getBlendshapeScore(blendshapes, ['mouthSmile', 'cheekSquint']),
        sad: getBlendshapeScore(blendshapes, ['mouthFrown', 'browInnerUp']),
        angry: getBlendshapeScore(blendshapes, ['browDown', 'noseSneer']),
        surprised: getBlendshapeScore(blendshapes, ['eyeWide', 'jawOpen']),
        neutral: calculateNeutralScore(blendshapes)  // 新しい計算方法を使用
      };
      
      // 全感情スコアの合計が1になるように正規化
      const total = Object.values(emotions).reduce((a, b) => a + b, 0);
      if (total > 0) {
        Object.keys(emotions).forEach(key => {
          emotions[key as keyof typeof emotions] /= total;
        });
      }

      console.log('Calculated emotions:', emotions);

      return {
        timestamp: performance.now(),
        confidence: results.faceBlendshapes[0].categories[0].score,
        emotions
      };
    }
  } catch (error) {
    console.error('Error detecting emotion:', error);
  }

  return null;
}

function getBlendshapeScore(blendshapes: any[], categories: string[]) {
  return categories.reduce((acc, category) => {
    const shape = blendshapes.find(b => b.categoryName.toLowerCase().includes(category.toLowerCase()));
    return acc + (shape ? shape.score : 0);
  }, 0) / categories.length;
}

function calculateOverallConfidence(blendshapes: any[]) {
  const totalScore = blendshapes.reduce((acc, shape) => acc + shape.score, 0);
  return totalScore / blendshapes.length;
}