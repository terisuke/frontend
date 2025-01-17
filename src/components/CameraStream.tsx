'use client';

import { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { detectEmotion, EmotionScore, initializeFaceDetector } from '@/utils/emotionDetection';
import EmotionDisplay from './EmotionDisplay';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CameraStream = () => {
  const webcamRef = useRef<Webcam>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [emotionScore, setEmotionScore] = useState<EmotionScore | null>(null);
  const [emotionHistory, setEmotionHistory] = useState<EmotionScore[]>([]);

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

  useEffect(() => {
    if (emotionScore) {
      setEmotionHistory(prev => {
        const newHistory = [...prev, emotionScore];
        return newHistory.slice(-30);
      });
    }
  }, [emotionScore]);

  const handleUserMedia = () => {
    setIsInitialized(true);
  };

  return (
    <div className="space-y-4">
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
          <div className="absolute top-4 right-4 w-64">
            <EmotionDisplay emotions={emotionScore.emotions} />
          </div>
        )}
      </div>
      {emotionHistory.length > 0 && (
        <div className="w-full h-64 bg-gray-900 rounded-lg p-4">
          <ResponsiveContainer>
            <LineChart data={emotionHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" domain={['auto', 'auto']} hide />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="emotions.happy" name="喜び" stroke="#4ade80" />
              <Line type="monotone" dataKey="emotions.sad" name="悲しみ" stroke="#60a5fa" />
              <Line type="monotone" dataKey="emotions.angry" name="怒り" stroke="#ef4444" />
              <Line type="monotone" dataKey="emotions.surprised" name="驚き" stroke="#fbbf24" />
              <Line type="monotone" dataKey="emotions.neutral" name="無表情" stroke="#94a3b8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default CameraStream;