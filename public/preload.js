// Minimal preload script for public pages.
(function () {
  'use strict';

  const resources = [
    { href: '/fonts/inter.css', as: 'style' },
    { href: '/favicon.svg', as: 'image' },
    { href: '/default-avatar.svg', as: 'image' }
  ];

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSlowConnection = Boolean(
    connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g')
  );

  const preload = (resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource.href;
    link.as = resource.as;

    if (resource.as === 'style') {
      link.fetchPriority = 'high';
    }

    link.onerror = function () {
      // Fail silently; preload should not block rendering.
    };

    document.head.appendChild(link);
  };

  resources.forEach((resource) => {
    // On slow connections, only prioritize core font styles.
    if (isSlowConnection && resource.as !== 'style') {
      return;
    }
    preload(resource);
  });
})();
