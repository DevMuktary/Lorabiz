'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export function ThemeColorUpdater() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // These values should perfectly match the primary background colors of your application
    const lightThemeColor = '#ffffff';
    const darkThemeColor = '#0a0a0a';

    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }

    // Instantly mutate the content attribute to force a browser UI repaint
    metaThemeColor.setAttribute(
      'content',
      resolvedTheme === 'dark' ? darkThemeColor : lightThemeColor
    );
  }, [resolvedTheme]);

  return null;
}
