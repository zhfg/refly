'use client';

import { ReactNode } from 'react';

export default function CodeViewerLayout({
  children,
  isShowing,
}: {
  children: ReactNode;
  isShowing: boolean;
}) {
  return (
    <div
      className={`${isShowing ? 'w-full' : 'w-0'} h-full overflow-hidden py-5 transition-[width]`}
    >
      <div className="flex h-full flex-col rounded-xl">
        <div className="flex h-full flex-col rounded-xl">{children}</div>
      </div>
    </div>
  );
}
