
'use client';

import { useTranslation } from '@/i18n';
import React from 'react';

interface PasswordStrengthProps {
  password?: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password = '' }) => {
  const { t } = useTranslation();

  const getStrength = () => {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/\d/.test(password)) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  let label = '';
  let color = '';
  let width = '0%';

  if (password.length > 0) {
      if (strength <= 2) {
        label = t('common.passwordStrength.weak');
        color = 'bg-destructive';
        width = '33%';
      } else if (strength <= 4) {
        label = t('common.passwordStrength.medium');
        color = 'bg-yellow-500';
        width = '66%';
      } else {
        label = t('common.passwordStrength.strong');
        color = 'bg-green-500';
        width = '100%';
      }
  }


  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: width }}
        />
      </div>
      {label && <p className="text-xs text-muted-foreground text-right">{label}</p>}
    </div>
  );
};

export default PasswordStrength;
