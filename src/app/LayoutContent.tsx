'use client';

import Header from "../components/Header";

export default function LayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white relative">
      <Header />
      {children}
    </div>
  );
}
