'use client';

import dynamic from 'next/dynamic';

const CameraStream = dynamic(() => import('./CameraStream'), {
  ssr: false,
  loading: () => <div>カメラを読み込み中...</div>
});

export default function EmotionAnalysis() {
  return (
    <div>
      <CameraStream />
    </div>
  );
}