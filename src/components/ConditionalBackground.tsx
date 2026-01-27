'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const AnimatedShaderBackground = dynamic(
  () => import('@/components/ui/animated-shader-background'),
  { ssr: false }
);

export default function ConditionalBackground() {
  const pathname = usePathname();

  // Do not render the background on the login page.
  if (pathname.startsWith('/login')) {
    return null;
  }

  return <AnimatedShaderBackground />;
}
