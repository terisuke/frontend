import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* レイアウトの内容 */}
      {children}
    </div>
  );
}