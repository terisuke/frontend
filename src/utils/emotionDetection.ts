/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/utils/emotionDetection.ts を更新
import { FaceLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;

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
  if (!faceLandmarker) {
    const filesetResolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1
    });
  }
  return faceLandmarker;
}

export async function detectEmotion(video: HTMLVideoElement): Promise<EmotionScore | null> {
  if (!faceLandmarker) {
    await initializeFaceDetector();
  }

  try {
    const results = faceLandmarker!.detectForVideo(video, performance.now());
    if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
      const blendshapes = results.faceBlendshapes[0].categories;
      
      // MediaPipeの表情特徴点から感情スコアを計算
      const emotions = {
        happy: getBlendshapeScore(blendshapes, ['mouthSmile', 'cheekSquint']),
        sad: getBlendshapeScore(blendshapes, ['mouthFrown', 'browDown']),
        angry: getBlendshapeScore(blendshapes, ['browDown', 'noseSneer']),
        surprised: getBlendshapeScore(blendshapes, ['eyeWide', 'jawOpen']),
        neutral: getBlendshapeScore(blendshapes, ['neutral'])
      };

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