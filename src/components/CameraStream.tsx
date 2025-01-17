'use client';

import { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { detectEmotion, EmotionScore, initializeFaceDetector } from '@/utils/emotionDetection';

const CameraStream = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [emotionScore, setEmotionScore] = useState<EmotionScore | null>(null);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user"
  };

  useEffect(() => {
    let animationFrameId: number;
    const runEmotionDetection = async () => {
      if (webcamRef.current && webcamRef.current.video) {
        const score = await detectEmotion(webcamRef.current.video);
        if (score) {
          setEmotionScore(score);
        }
        animationFrameId = requestAnimationFrame(runEmotionDetection);
      }
    };

    if (isInitialized) {
      initializeFaceDetector().then(() => {
        runEmotionDetection();
      });
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInitialized]);

  const handleUserMedia = () => {
    setIsInitialized(true);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-gray-900 rounded-lg overflow-hidden">
      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
          <p className="text-white">カメラを初期化中...</p>
        </div>
      )}
      <Webcam
        ref={webcamRef}
        audio={false}
        width={640}
        height={480}
        screenshotFormat="image/jpeg"
        videoConstraints={videoConstraints}
        onUserMedia={handleUserMedia}
        className="rounded-lg shadow-lg"
        mirrored={true}
      />
      {emotionScore && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 p-4 rounded-lg">
          <p className="text-white">信頼度: {(emotionScore.confidence * 100).toFixed(1)}%</p>
          <div className="mt-2">
            {Object.entries(emotionScore.emotions).map(([emotion, score]) => (
              <div key={emotion} className="flex justify-between text-white">
                <span className="capitalize">{emotion}:</span>
                <span>{(score * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraStream;