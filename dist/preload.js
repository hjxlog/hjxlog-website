// 预加载关键资源脚本
(function() {
  'use strict';
  
  // 预加载关键CSS和字体
  const criticalResources = [
    '/favicon.svg',
    '/default-avatar.svg',
    '/fonts/inter.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
  ];
  
  // 预加载图片资源
  const imageResources = [
    '/apple-touch-icon.png',
    '/favicon.svg',
    '/default-avatar.svg'
  ];
  
  // 预加载关键JavaScript模块
  const jsModules = [
    // 核心React库在构建时已经分离到vendor chunk
  ];
  
  // 创建预加载链接
  function preloadResource(href, as, type = null, crossorigin = null) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (type) link.type = type;
    if (crossorigin) link.crossOrigin = crossorigin;
    
    // 添加错误处理
    link.onerror = function() {
      console.warn('Failed to preload resource:', href);
    };
    
    document.head.appendChild(link);
  }
  
  // 预加载CSS资源
  criticalResources.forEach(url => {
    preloadResource(url, 'style');
  });
  
  // 预加载图片资源
  imageResources.forEach(url => {
    preloadResource(url, 'image');
  });
  
  // 预取下一页面可能需要的资源
  function prefetchResource(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
  
  // 在页面加载完成后预取其他页面资源
  window.addEventListener('load', function() {
    // 延迟预取，避免影响当前页面性能
    setTimeout(function() {
      // 预取博客和作品页面的关键资源
      prefetchResource('/api/blogs');
      prefetchResource('/api/works');
    }, 2000);
  });
  
  // 使用Intersection Observer预加载即将进入视口的内容
  if ('IntersectionObserver' in window) {
    const lazyLoadObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          const element = entry.target;
          
          // 如果是图片，开始加载
          if (element.tagName === 'IMG' && element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
            lazyLoadObserver.unobserve(element);
          }
          
          // 如果是需要懒加载的组件容器，触发加载
          if (element.classList.contains('lazy-component')) {
            element.classList.add('load-component');
            lazyLoadObserver.unobserve(element);
          }
        }
      });
    }, {
      rootMargin: '50px 0px' // 提前50px开始加载
    });
    
    // 观察所有懒加载元素
    document.addEventListener('DOMContentLoaded', function() {
      const lazyImages = document.querySelectorAll('img[data-src]');
      const lazyComponents = document.querySelectorAll('.lazy-component');
      
      lazyImages.forEach(img => lazyLoadObserver.observe(img));
      lazyComponents.forEach(component => lazyLoadObserver.observe(component));
    });
  }
  
  // 缓存API响应
  if ('caches' in window) {
    const CACHE_NAME = 'hjxlog-api-cache-v1';
    const API_URLS = [
      '/api/featured',
      '/api/blogs',
      '/api/works'
    ];
    
    // 预缓存API响应
    window.addEventListener('load', function() {
      setTimeout(async function() {
        try {
          const cache = await caches.open(CACHE_NAME);
          
          // 缓存API响应
          for (const url of API_URLS) {
            try {
              const response = await fetch(url);
              if (response.ok) {
                await cache.put(url, response.clone());
              }
            } catch (error) {
              console.warn('Failed to cache API response:', url, error);
            }
          }
        } catch (error) {
          console.warn('Cache API not available:', error);
        }
      }, 3000);
    });
  }
  
  // 性能监控
  if ('performance' in window) {
    window.addEventListener('load', function() {
      setTimeout(function() {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          console.log('页面加载性能:', {
            'DNS查询': perfData.domainLookupEnd - perfData.domainLookupStart,
            'TCP连接': perfData.connectEnd - perfData.connectStart,
            '请求响应': perfData.responseEnd - perfData.requestStart,
            'DOM解析': perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
            '总加载时间': perfData.loadEventEnd - perfData.navigationStart
          });
        }
      }, 1000);
    });
  }
})();