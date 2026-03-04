import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from 'playwright/test';

type ContrastSample = {
  selector: string;
  text: string;
  contrast: number;
  color: string;
  background: string;
};

const tabLabels = ['中枢总览', '日报记录', '博客管理', '每日想法', '待办事项'] as const;

function withAuthAndPrivacy(page: Page) {
  const auth = {
    token: 'playwright-test-token',
    expiration: '2099-12-31T23:59:59.000Z',
    user: { id: '1', username: 'Admin', email: 'admin@example.com' },
  };

  return page.addInitScript((payload) => {
    localStorage.setItem('auth', JSON.stringify(payload.auth));
    localStorage.setItem('dashboard.privacyMode', '1');
  }, { auth });
}

async function mockDashboardApis(page: Page) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    const json = (body: unknown) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });

    if (path === '/api/works') {
      return json({
        success: true,
        data: {
          works: [
            {
              id: 1,
              title: 'Dark Mode Refactor',
              description: 'Dashboard visual optimization',
              category: 'Frontend',
              status: 'active',
              tags: ['dashboard', 'dark-mode'],
              featured: true,
              created_at: `${today}T10:00:00.000Z`,
            },
          ],
        },
      });
    }

    if (path === '/api/blogs') {
      return json({
        success: true,
        data: {
          blogs: [
            {
              id: 1,
              title: '暗黑模式改造日志',
              excerpt: '优化后台暗黑模式的可读性与视觉一致性。',
              category: '产品设计',
              tags: ['dark', 'ux'],
              published: true,
              views: 199,
              created_at: `${today}T08:00:00.000Z`,
            },
            {
              id: 2,
              title: '未发布草稿示例',
              excerpt: '用于测试草稿状态标签的对比度。',
              category: '工程实践',
              tags: ['draft', 'contrast'],
              published: false,
              views: 12,
              created_at: `${yesterday}T14:00:00.000Z`,
            },
          ],
          total: 2,
          page: 1,
          limit: 100,
        },
      });
    }

    if (path.startsWith('/api/blogs/')) {
      return json({
        success: true,
        data: {
          id: 1,
          title: '暗黑模式改造日志',
          content: '## 暗黑模式记录\n\n- 统一背景层级\n- 修复低对比文本\n- 对编辑页做可读性检查',
          excerpt: '优化后台暗黑模式的可读性与视觉一致性。',
          category: '产品设计',
          tags: ['dark', 'ux'],
          published: true,
          featured: true,
          cover_image: '',
          created_at: `${today}T08:00:00.000Z`,
        },
      });
    }

    if (path.startsWith('/api/works/')) {
      return json({
        success: true,
        data: {
          id: 1,
          title: '动态管理模块暗色优化',
          description: '修复动态管理模块文字与背景对比问题。',
          content: '## 改造内容\n\n- 统一输入框与标签色\n- 补齐编辑页对比度规则\n- 加入自动化检查',
          category: 'Frontend',
          status: 'active',
          tags: ['dashboard', 'contrast'],
          technologies: ['React', 'TypeScript'],
          project_url: '',
          github_url: '',
          cover_image: '',
          screenshots: [],
          features: ['统一色板', '自动化测试'],
          challenges: ['避免硬编码颜色冲突'],
          featured: true,
          created_at: `${today}T10:00:00.000Z`,
        },
      });
    }

    if (path === '/api/moments') {
      return json({
        success: true,
        data: {
          moments: [
            {
              id: 1,
              content: '今天开始统一修复暗黑模式可读性。',
              visibility: 'public',
              created_at: `${today}T09:00:00.000Z`,
            },
          ],
        },
      });
    }

    if (path === '/api/admin/stats') {
      return json({ success: true, data: { totalViews: 1234 } });
    }

    if (path === '/api/admin/view-stats/simple') {
      return json({
        success: true,
        data: {
          todayViews: 12,
          yesterdayViews: 18,
          last7DaysViews: 95,
          totalViews: 1234,
          topLocations: [{ location: 'Shanghai', count: 9 }],
          topLocationsToday: [{ location: 'Shanghai', count: 7 }],
          topLocationsYesterday: [{ location: 'Shanghai', count: 8 }],
        },
      });
    }

    if (path === '/api/tasks/stats/overview') {
      return json({
        success: true,
        data: { total: 7, todo: 3, in_progress: 2, done: 2, cancelled: 0, p0: 1, p1: 2, overdue: 1 },
      });
    }

    if (path === '/api/tasks/projects') {
      return json({ success: true, data: [] });
    }

    if (path === '/api/tasks') {
      return json({ success: true, data: [] });
    }

    if (path === '/api/thoughts') {
      return json({
        success: true,
        data: [
          { thought_date: today, content: '暗色模式下文本可读性要达到 AA。' },
          { thought_date: yesterday, content: '统一 badge 语义色可以减少冲突。' },
        ],
      });
    }

    if (path === '/api/daily-reports') {
      return json({
        success: true,
        data: {
          reports: [
            { id: 1, report_date: today, content: '## 今日日报\n- 修复暗黑对比度', created_at: `${today}T08:00:00.000Z`, updated_at: `${today}T10:00:00.000Z` },
            { id: 2, report_date: yesterday, content: '## 昨日日报\n- 暗黑方案调研', created_at: `${yesterday}T08:00:00.000Z`, updated_at: `${yesterday}T10:00:00.000Z` },
          ],
        },
      });
    }

    if (path.startsWith('/api/daily-reports/')) {
      return json({
        success: true,
        data: {
          content: '## 日报详情\n- 文本与底色对比已检查',
          updated_at: `${today}T10:00:00.000Z`,
        },
      });
    }

    return json({ success: true, data: {} });
  });
}

async function openTab(page: Page, label: string) {
  const tab = page.locator('aside button', { hasText: label }).first();
  await expect(tab).toBeVisible();
  await tab.click();
}

async function getContrastSamples(page: Page, selectors: string[]): Promise<ContrastSample[]> {
  return page.evaluate((targetSelectors: string[]) => {
    const parse = (value: string) => {
      const m = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/i);
      if (!m) return null;
      return {
        r: Number(m[1]),
        g: Number(m[2]),
        b: Number(m[3]),
        a: m[4] !== undefined ? Number(m[4]) : 1,
      };
    };

    const blend = (fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number }) => {
      return {
        r: Math.round((1 - fg.a) * bg.r + fg.a * fg.r),
        g: Math.round((1 - fg.a) * bg.g + fg.a * fg.g),
        b: Math.round((1 - fg.a) * bg.b + fg.a * fg.b),
      };
    };

    const luminance = (rgb: { r: number; g: number; b: number }) => {
      const normalize = (channel: number) => {
        const s = channel / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * normalize(rgb.r) + 0.7152 * normalize(rgb.g) + 0.0722 * normalize(rgb.b);
    };

    const contrast = (fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }) => {
      const l1 = luminance(fg);
      const l2 = luminance(bg);
      const light = Math.max(l1, l2);
      const dark = Math.min(l1, l2);
      return Number(((light + 0.05) / (dark + 0.05)).toFixed(2));
    };

    const findBackground = (el: Element) => {
      let current: Element | null = el;
      while (current) {
        const bg = parse(getComputedStyle(current).backgroundColor);
        if (bg && bg.a > 0) {
          return { r: bg.r, g: bg.g, b: bg.b };
        }
        current = current.parentElement;
      }
      return { r: 34, g: 39, b: 46 };
    };

    const samples: Array<{ selector: string; text: string; contrast: number; color: string; background: string }> = [];

    for (const selector of targetSelectors) {
      const elements = Array.from(document.querySelectorAll(selector));
      for (const el of elements) {
        const text = (el.textContent || '').trim();
        if (!text) continue;

        const color = parse(getComputedStyle(el).color);
        if (!color) continue;
        const bg = findBackground(el);
        const fg = color.a < 1 ? blend(color, bg) : { r: color.r, g: color.g, b: color.b };
        samples.push({
          selector,
          text: text.slice(0, 40),
          contrast: contrast(fg, bg),
          color: `rgb(${fg.r}, ${fg.g}, ${fg.b})`,
          background: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
        });
      }
    }

    return samples;
  }, selectors);
}

test.beforeEach(async ({ page }) => {
  await withAuthAndPrivacy(page);
  await mockDashboardApis(page);
  await page.goto('/dashboard');
  await page.waitForSelector('.dashboard-privacy--dimmed');
  await expect(page.getByText('管理后台')).toBeVisible();
});

test('dashboard tabs pass serious/critical axe checks', async ({ page }) => {
  for (const label of tabLabels) {
    await openTab(page, label);
    await page.waitForTimeout(200);
    const result = await new AxeBuilder({ page }).analyze();
    const serious = result.violations.filter(
      (v) => v.id === 'color-contrast' && (v.impact === 'serious' || v.impact === 'critical')
    );
    expect(
      serious,
      `${label} 存在严重对比度问题: ${serious.map((v) => v.id).join(', ')}`
    ).toEqual([]);
  }
});

test('daily report date list keeps readable contrast in dark mode', async ({ page }) => {
  await openTab(page, '日报记录');
  await expect(page.getByText('日报日期')).toBeVisible();
  const samples = await getContrastSamples(page, [
    '.dh-list-item__date',
    '.dh-badge--success',
    'aside button .text-sm.font-medium',
  ]);
  const failed = samples.filter((sample) => sample.contrast < 4.5);
  expect(
    failed,
    `日报日期区域对比度不足: ${failed
      .map((item) => `${item.text}(${item.contrast}) ${item.color} on ${item.background}`)
      .join('; ')}`
  ).toEqual([]);
});

test('blogs badges/tags keep readable contrast in dark mode', async ({ page }) => {
  await openTab(page, '博客管理');
  await expect(page.getByRole('heading', { name: '博客管理' })).toBeVisible();
  const samples = await getContrastSamples(page, [
    '.dh-badge--success',
    '.dh-badge--neutral',
    '.text-slate-600.text-sm',
    '.text-slate-500.text-sm',
  ]);
  const failed = samples.filter((sample) => sample.contrast < 4.5);
  expect(
    failed,
    `博客标签区域对比度不足: ${failed
      .map((item) => `${item.text}(${item.contrast}) ${item.color} on ${item.background}`)
      .join('; ')}`
  ).toEqual([]);
});

test('blog editor keeps readable contrast in dark mode', async ({ page }) => {
  await page.goto('/admin/blog/edit/1?from=dashboard');
  await page.waitForSelector('.dashboard-privacy--dimmed');
  await expect(page.getByText('编辑博客')).toBeVisible();
  const samples = await getContrastSamples(page, [
    'header .text-sm.font-medium',
    'header .text-xs',
    '.blog-editor-toolbar-btn',
    '.blog-editor-shell .ProseMirror p',
    '.blog-editor-shell .ProseMirror h2',
    '.blog-editor-shell .ProseMirror li',
    '.blog-editor-shell .text-xs.text-slate-500',
    'aside label.text-slate-700',
    'aside span.text-slate-700',
  ]);
  const failed = samples.filter((sample) => sample.contrast < 4.5);
  expect(
    failed,
    `博客编辑页对比度不足: ${failed
      .map((item) => `${item.text}(${item.contrast}) ${item.color} on ${item.background}`)
      .join('; ')}`
  ).toEqual([]);
});

test('work editor keeps readable contrast in dark mode', async ({ page }) => {
  await page.goto('/admin/work/edit/1?from=dashboard');
  await page.waitForSelector('.dashboard-privacy--dimmed');
  await expect(page.getByText('编辑作品')).toBeVisible();
  const samples = await getContrastSamples(page, [
    'header .text-sm.font-medium',
    'header .text-xs',
    'section p.text-slate-700',
    '.blog-editor-toolbar-btn',
    '.blog-editor-shell .ProseMirror p',
    '.blog-editor-shell .ProseMirror li',
    'aside label.text-slate-700',
    'aside span.text-slate-700',
    'aside .text-sm',
  ]);
  const failed = samples.filter((sample) => sample.contrast < 4.5);
  expect(
    failed,
    `作品编辑页对比度不足: ${failed
      .map((item) => `${item.text}(${item.contrast}) ${item.color} on ${item.background}`)
      .join('; ')}`
  ).toEqual([]);
});
