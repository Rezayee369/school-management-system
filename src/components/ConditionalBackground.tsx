'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const AnimatedShaderBackground = dynamic(
  () => import('@/components/ui/animated-shader-background'),
  { 
    ssr: false,
    loading: () => null,
  }
);

export default function ConditionalBackground() {
  const pathname = usePathname();

  // Do not render the background on the login page (now at root) or the old /login path.
  if (pathname === '/' || pathname.startsWith('/login')) {
    return null;
  }

  return <AnimatedShaderBackground />;
}
