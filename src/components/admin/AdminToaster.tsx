import { useEffect } from 'react';
import { Toaster } from 'sonner';

const FONT_AWESOME_HREF = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css';
const FONT_AWESOME_ID = 'admin-font-awesome-stylesheet';

export default function AdminToaster() {
  useEffect(() => {
    if (document.getElementById(FONT_AWESOME_ID)) {
      return;
    }

    const link = document.createElement('link');
    link.id = FONT_AWESOME_ID;
    link.rel = 'stylesheet';
    link.href = FONT_AWESOME_HREF;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }, []);

  return <Toaster position="top-right" richColors />;
}
