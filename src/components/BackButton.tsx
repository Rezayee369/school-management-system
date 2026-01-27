'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/i18n';

export default function BackButton() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft size={18} />
      <span>{t('common.back')}</span>
    </button>
  );
}
