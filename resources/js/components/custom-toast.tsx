// resources/js/components/custom-toast.tsx
'use client';

import { Toaster, toast } from 'sonner';
import React from 'react';

export const CustomToast = () => {
  return <Toaster position="top-right" richColors />;
};

export { toast };
