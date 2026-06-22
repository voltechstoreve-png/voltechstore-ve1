'use client';

import PrivateLayout from '@/components/private/PrivateLayout';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <PrivateLayout>{children}</PrivateLayout>;
}