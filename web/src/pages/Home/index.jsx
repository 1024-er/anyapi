
import React, { useContext, useEffect, useState } from 'react';
import {
  API,
  showError,
  showSuccess,
  getSystemName,
  stripScriptTags,
} from '../../helpers';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { StatusContext } from '../../context/Status';
import { useActualTheme } from '../../context/Theme';
import { marked } from 'marked';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import NoticeModal from '../../components/layout/NoticeModal';
import {
  ArrowRight,
  ArrowUp,
  Zap,
  Shield,
  Globe,
  Key,
  BarChart3,
  Cpu,
  Calculator,
  CreditCard,
  Check,
  Copy,
} from 'lucide-react';
import {
  SiAndroid,
  SiCloudflare,
  SiDocker,
  SiGithub,
  SiGoogle,
  SiHuggingface,
  SiJavascript,
  SiMeta,
  SiMysql,
  SiNextdotjs,
  SiNvidia,
  SiOpenai,
  SiPostgresql,
  SiPython,
  SiReact,
  SiRedis,
  SiStripe,
  SiSupabase,
  SiVercel,
} from 'react-icons/si';

// ─── LogoMark (matches web2/src/components/ui/logo-mark.tsx) ─────────────────
function LogoMark({ size = 'md', className = '' }) {
  const cfg = {
    sm: { box: 'w-6 h-6 rounded', icon: 'w-3.5 h-3.5' },
    md: { box: 'w-8 h-8 rounded-lg', icon: 'w-5 h-5' },
  };
  const { box, icon } = cfg[size] || cfg.md;
  return (
    <span
      className={`inline-flex items-center justify-center select-none shrink-0 bg-primary text-white ${box} ${className}`}
    >
      <svg viewBox='0 0 24 24' fill='none' className={icon}>
        <path
          d='M2 20L7.5 4L12 17L16.5 4L22 20'
          stroke='currentColor'
          strokeWidth='2.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path d='M4.5 14H10.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <path d='M13.5 14H19.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      </svg>
    </span>
  );
}

// ─── Data constants ──────────────────────────────────────────────────────────
const CREDIT_PACKAGES = [
  { id: 'pkg_10', amount: 10, bonus: 0, inputTokens: 3333333, outputTokens: 666666 },
  { id: 'pkg_20', amount: 20, bonus: 6, inputTokens: 8666666, outputTokens: 1733333, isPopular: true },
  { id: 'pkg_50', amount: 50, bonus: 15, inputTokens: 21666666, outputTokens: 4333333 },
  { id: 'pkg_100', amount: 100, bonus: 35, inputTokens: 45000000, outputTokens: 9000000 },
  { id: 'pkg_200', amount: 200, bonus: 80, inputTokens: 93333333, outputTokens: 18666666 },
  { id: 'pkg_1000', amount: 1000, bonus: 500, inputTokens: 500000000, outputTokens: 100000000 },
];

const FEATURE_ICONS = [
  { icon: Key, color: 'text-primary', bg: 'bg-primary/10' },
  { icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10' },
  { icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { icon: Calculator, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: CreditCard, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { icon: Globe, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

const FEATURE_KEYS = [
  { titleKey: 'API 密钥管理', descKey: '创建多个 API 密钥并设置精细权限。支持 IP 白名单、配额限制、模型限制和过期时间配置。' },
  { titleKey: '用量统计', descKey: '实时仪表盘展示请求数、Token 消耗、费用及模型分布，并提供 30 天趋势图表。' },
  { titleKey: '安全访问', descKey: '企业级安全防护，支持双因素认证、IP 白名单和加密密钥存储，数据安全有保障。' },
  { titleKey: '主流模型全覆盖', descKey: '通过统一的 OpenAI 兼容端点访问 Claude、GPT-4o、Gemini、DeepSeek 等所有主流模型。' },
  { titleKey: '价格计算器', descKey: '在运行任务前预估费用。跨模型比较价格和计费模式，优化使用成本。' },
  { titleKey: '灵活计费', descKey: '按量付费或购买点数套餐。支持多种支付方式，包括信用卡、微信支付和支付宝。' },
  { titleKey: '高性能', descKey: '低延迟路由与自动故障转移。实时流式响应，带来最佳使用体验。' },
  { titleKey: '兼容 OpenAI', descKey: 'OpenAI API 的无缝替代方案。只需修改 base URL 和 API Key，无需任何代码改动。' },
];

const PLATFORM_FEATURES = [
  '访问所有 AI 模型',
  'API 密钥管理',
  '用量统计与日志',
  '价格计算器',
  '邀请奖励计划',
  '7×24 小时平台监控',
];

const MODEL_LOGO_ROWS = [
  [
    { id: 'android', icon: SiAndroid, color: 'text-orange-300' },
    { id: 'openai', icon: SiOpenai, color: 'text-zinc-700 dark:text-zinc-100' },
    { id: 'cloudflare', icon: SiCloudflare, color: 'text-orange-400' },
    { id: 'google', icon: SiGoogle, color: 'text-blue-500' },
    { id: 'vercel', icon: SiVercel, color: 'text-zinc-700 dark:text-zinc-100' },
    { id: 'meta', icon: SiMeta, color: 'text-indigo-400' },
    { id: 'huggingface', icon: SiHuggingface, color: 'text-amber-400' },
    { id: 'github', icon: SiGithub, color: 'text-zinc-800 dark:text-zinc-100' },
    { id: 'nvidia', icon: SiNvidia, color: 'text-green-500' },
    { id: 'stripe', icon: SiStripe, color: 'text-violet-500' },
    { id: 'supabase', icon: SiSupabase, color: 'text-emerald-400' },
    { id: 'android-end', icon: SiAndroid, color: 'text-orange-300' },
  ],
  [
    { id: 'react', icon: SiReact, color: 'text-cyan-400' },
    { id: 'javascript', icon: SiJavascript, color: 'text-yellow-400' },
    { id: 'docker', icon: SiDocker, color: 'text-sky-500' },
    { id: 'redis', icon: SiRedis, color: 'text-rose-500' },
    { id: 'mysql', icon: SiMysql, color: 'text-sky-700 dark:text-sky-400' },
    { id: 'postgres', icon: SiPostgresql, color: 'text-blue-700 dark:text-blue-400' },
    { id: 'python', icon: SiPython, color: 'text-blue-500' },
    { id: 'nextjs', icon: SiNextdotjs, color: 'text-zinc-700 dark:text-zinc-100' },
    { id: 'google-stack', icon: SiGoogle, color: 'text-rose-400' },
    { id: 'github-stack', icon: SiGithub, color: 'text-zinc-700 dark:text-zinc-100' },
    { id: 'openai-stack', icon: SiOpenai, color: 'text-zinc-700 dark:text-zinc-100' },
    { id: 'cloudflare-stack', icon: SiCloudflare, color: 'text-orange-300' },
  ],
];

const HERO_CODE_TABS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'gemini', label: 'Gemini' },
];

const HERO_CODE_SNIPPETS = {
  openai: `from openai import OpenAI

client = OpenAI(
  base_url="https://api.anyapi.pro/v1",
  api_key="<YOUR_API_KEY>"
)

response = client.chat.completions.create(
  model="gpt-4o",
  messages=[{"role": "user", "content": "Hello!"}]
)`,
  anthropic: `from anthropic import Anthropic

client = Anthropic(
  base_url="https://api.anyapi.pro",
  api_key="<YOUR_API_KEY>"
)

message = client.messages.create(
  model="claude-sonnet-4-20250514",
  max_tokens=1024,
  messages=[{"role": "user", "content": "Hello!"}]
)`,
  gemini: `import google.generativeai as genai

genai.configure(api_key="<YOUR_API_KEY>")

model = genai.GenerativeModel("gemini-2.0-flash")
response = model.generate_content("Hello!")`,
};

// ─── Hero code block (tabs + copy + stats) ───────────────────────────────────
function HeroCodeDemo({ t }) {
  const [activeTab, setActiveTab] = useState('openai');

  const handleCopy = async () => {
    const text = HERO_CODE_SNIPPETS[activeTab];
    try {
      await navigator.clipboard.writeText(text);
      showSuccess(t('复制成功'));
    } catch {
      showError(t('复制失败'));
    }
  };

  const kw = 'text-blue-500 dark:text-blue-400';
  const str = 'text-pink-600 dark:text-pink-400';
  const sym = 'text-muted-foreground';
  const name = 'text-foreground';

  return (
    <div className='mt-12 md:mt-16 max-w-2xl mx-auto w-full'>
      <div className='rounded-xl border border-border bg-card shadow-xl overflow-hidden text-left'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-3 py-2.5 bg-muted/40 border-b border-border'>
          <div className='inline-flex items-center gap-0.5 rounded-lg bg-muted/70 p-1'>
            {HERO_CODE_TABS.map(({ id, label }) => (
              <button
                key={id}
                type='button'
                onClick={() => setActiveTab(id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === id
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type='button'
            onClick={handleCopy}
            className='inline-flex items-center justify-center gap-1.5 self-start sm:self-auto rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors'
          >
            <Copy className='w-4 h-4 shrink-0' />
          </button>
        </div>
        <pre className='p-5 text-sm font-mono overflow-x-auto leading-relaxed bg-card'>
          {activeTab === 'openai' && (
            <code>
              <span className={kw}>from</span> <span className={name}>openai</span>{' '}
              <span className={kw}>import</span> <span className={name}>OpenAI</span>
              {'\n\n'}
              <span className={name}>client</span>
              <span className={sym}> = </span>
              <span className={name}>OpenAI</span>
              <span className={sym}>(</span>
              {'\n  '}
              <span className={name}>base_url</span>
              <span className={sym}>=</span>
              <span className={str}>&quot;https://api.anyapi.pro/v1&quot;</span>
              <span className={sym}>,</span>
              {'\n  '}
              <span className={name}>api_key</span>
              <span className={sym}>=</span>
              <span className={str}>&quot;&lt;YOUR_API_KEY&gt;&quot;</span>
              {'\n'}
              <span className={sym}>)</span>
              {'\n\n'}
              <span className={name}>response</span>
              <span className={sym}> = </span>
              <span className={name}>client.chat.completions.create</span>
              <span className={sym}>(</span>
              {'\n  '}
              <span className={name}>model</span>
              <span className={sym}>=</span>
              <span className={str}>&quot;gpt-4o&quot;</span>
              <span className={sym}>,</span>
              {'\n  '}
              <span className={name}>messages</span>
              <span className={sym}>=[</span>
              <span className={sym}>&#123;</span>
              <span className={str}>&quot;role&quot;</span>
              <span className={sym}>: </span>
              <span className={str}>&quot;user&quot;</span>
              <span className={sym}>, </span>
              <span className={str}>&quot;content&quot;</span>
              <span className={sym}>: </span>
              <span className={str}>&quot;Hello!&quot;</span>
              <span className={sym}>&#125;]</span>
              {'\n'}
              <span className={sym}>)</span>
            </code>
          )}
          {activeTab === 'anthropic' && (
            <code>
              <span className={kw}>from</span> <span className={name}>anthropic</span>{' '}
              <span className={kw}>import</span> <span className={name}>Anthropic</span>
              {'\n\n'}
              <span className={name}>client</span>
              <span className={sym}> = </span>
              <span className={name}>Anthropic</span>
              <span className={sym}>(</span>
              {'\n  '}
              <span className={name}>base_url</span>
              <span className={sym}>=</span>
              <span className={str}>&quot;https://api.anyapi.pro&quot;</span>
              <span className={sym}>,</span>
              {'\n  '}
              <span className={name}>api_key</span>
              <span className={sym}>=</span>
              <span className={str}>&quot;&lt;YOUR_API_KEY&gt;&quot;</span>
              {'\n'}
              <span className={sym}>)</span>
              {'\n\n'}
              <span className={name}>message</span>
              <span className={sym}> = </span>
              <span className={name}>client.messages.create</span>
              <span className={sym}>(</span>
              {'\n  '}
              <span className={name}>model</span>
              <span className={sym}>=</span>
              <span className={str}>&quot;claude-sonnet-4-20250514&quot;</span>
              <span className={sym}>,</span>
              {'\n  '}
              <span className={name}>max_tokens</span>
              <span className={sym}>=</span>
              <span className={name}>1024</span>
              <span className={sym}>,</span>
              {'\n  '}
              <span className={name}>messages</span>
              <span className={sym}>=[</span>
              <span className={sym}>&#123;</span>
              <span className={str}>&quot;role&quot;</span>
              <span className={sym}>: </span>
              <span className={str}>&quot;user&quot;</span>
              <span className={sym}>, </span>
              <span className={str}>&quot;content&quot;</span>
              <span className={sym}>: </span>
              <span className={str}>&quot;Hello!&quot;</span>
              <span className={sym}>&#125;]</span>
              {'\n'}
              <span className={sym}>)</span>
            </code>
          )}
          {activeTab === 'gemini' && (
            <code>
              <span className={kw}>import</span> <span className={name}>google.generativeai</span>{' '}
              <span className={kw}>as</span> <span className={name}>genai</span>
              {'\n\n'}
              <span className={name}>genai</span>
              <span className={sym}>.</span>
              <span className={name}>configure</span>
              <span className={sym}>(</span>
              <span className={name}>api_key</span>
              <span className={sym}>=</span>
              <span className={str}>&quot;&lt;YOUR_API_KEY&gt;&quot;</span>
              <span className={sym}>)</span>
              {'\n\n'}
              <span className={name}>model</span>
              <span className={sym}> = </span>
              <span className={name}>genai</span>
              <span className={sym}>.</span>
              <span className={name}>GenerativeModel</span>
              <span className={sym}>(</span>
              <span className={str}>&quot;gemini-2.0-flash&quot;</span>
              <span className={sym}>)</span>
              {'\n'}
              <span className={name}>response</span>
              <span className={sym}> = </span>
              <span className={name}>model</span>
              <span className={sym}>.</span>
              <span className={name}>generate_content</span>
              <span className={sym}>(</span>
              <span className={str}>&quot;Hello!&quot;</span>
              <span className={sym}>)</span>
            </code>
          )}
        </pre>
      </div>

      <div className='grid grid-cols-4 gap-6 md:gap-8 mt-10 text-center'>
        <div>
          <div className='text-2xl md:text-3xl font-extrabold gradient-text'>100+</div>
          <div className='text-xs sm:text-sm text-muted-foreground mt-1'>{t('hero_stat_1')}</div>
        </div>
        <div>
          <div className='text-2xl md:text-3xl font-extrabold gradient-text'>99.9%</div>
          <div className='text-xs sm:text-sm text-muted-foreground mt-1'>{t('hero_stat_2')}</div>
        </div>
        <div>
          <div className='text-2xl md:text-3xl font-extrabold gradient-text'>&lt;300ms</div>
          <div className='text-xs sm:text-sm text-muted-foreground mt-1'>{t('hero_stat_3')}</div>
        </div>
        <div>
          <div className='text-2xl md:text-3xl font-extrabold gradient-text'>24/7</div>
          <div className='text-xs sm:text-sm text-muted-foreground mt-1'>{t('hero_stat_4')}</div>
        </div>
      </div>
    </div>
  );
}

// ─── HeroSection ─────────────────────────────────────────────────────────────
function HeroSection({ t, docsLink }) {
  return (
    <section className='relative pt-16 pb-12 md:pt-24 md:pb-12 overflow-hidden hero-glow'>
      <div className='absolute inset-0 -z-10 h-full w-full hero-grid-bg' />
      <div className='absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-[120px] -z-10 pointer-events-none' />

      <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
        <h1 className='text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] text-foreground'>
          {t('hero_title1')}{' '}
          <span className='gradient-text'>{t('hero_title2')}</span>
        </h1>
        <p className='text-lg text-muted-foreground max-w-xl mx-auto my-8'>{t('hero_title3')}</p>

        <div className='flex flex-col sm:flex-row items-center justify-center gap-3 mb-12'>
          <Link
            to='/login'
            className='inline-flex items-center justify-center gap-2 px-8 h-12 text-base font-medium rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors'
          >
            {t('开始使用')}
            <ArrowRight className='w-4 h-4' />
          </Link>
          {docsLink ? (
            <a
              href={docsLink}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center justify-center gap-2 px-8 h-12 text-base font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors'
            >
              {t('了解更多')}
            </a>
          ) : (
            <Link
              to='/about'
              className='inline-flex items-center justify-center gap-2 px-8 h-12 text-base font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors'
            >
              {t('了解更多')}
            </Link>
          )}
        </div>

        <HeroCodeDemo t={t} />
      </div>
    </section>
  );
}

// ─── FeaturesSection ─────────────────────────────────────────────────────────
function FeaturesSection({ t }) {
  return (
    <section id='features' className='py-12 md:py-16'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-14'>
          <div className='inline-flex items-center gap-2 text-sm text-primary font-medium mb-3'>
            <div className='w-1 h-4 rounded-full bg-primary' />
            {t('一切功能，尽在其中')}
          </div>
          <p className='text-lg text-muted-foreground max-w-xl mx-auto'>
            {t('一个完整的 API 管理平台，提供集成、监控和扩展 AI 能力所需的一切工具。')}
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {FEATURE_KEYS.map((feat, i) => {
            const { icon: Icon, color, bg } = FEATURE_ICONS[i];
            return (
              <div
                key={feat.titleKey}
                className='group p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-default'
              >
                <div className={`inline-flex p-2.5 rounded-lg ${bg} mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className='font-semibold text-base mb-2 text-foreground'>{t(feat.titleKey)}</h3>
                <p className='text-sm text-muted-foreground leading-relaxed'>{t(feat.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── ModelsSection ───────────────────────────────────────────────────────────
function LogoCloudRow({ logos, reverse = false }) {
  const repeatedLogos = [...logos, ...logos];

  return (
    <div className='logo-cloud-mask'>
      <div className={`logo-cloud-track ${reverse ? 'logo-cloud-track-reverse' : ''}`}>
        {repeatedLogos.map(({ id, icon: Icon, color }, idx) => (
          <div key={`${id}-${idx}`} className='logo-cloud-item' title={id}>
            <Icon className={`w-6 h-6 md:w-7 md:h-7 ${color}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ModelsSection({ t }) {
  return (
    <section id='models'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-6'>
          <div className='inline-flex items-center gap-2 text-sm text-primary font-medium mb-3'>
            <div className='w-1 h-4 rounded-full bg-primary' />
            {t('model_section_title1')}
          </div>
          <p className='text-lg text-muted-foreground max-w-xl mx-auto'>
            {t('model_section_title2')}
          </p>
        </div>
        <div className='space-y-2.5 md:space-y-4'>
            <LogoCloudRow logos={MODEL_LOGO_ROWS[0]} />
            <LogoCloudRow logos={MODEL_LOGO_ROWS[1]} reverse />
          </div>
      </div>
    </section>
  );
}

// ─── PricingSection ──────────────────────────────────────────────────────────
function PricingSection({ t }) {
  return (
    <section id='pricing' className='py-12 md:py-16'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center mb-14'>
          <div className='inline-flex items-center gap-2 text-sm text-primary font-medium mb-3'>
            <div className='w-1 h-4 rounded-full bg-primary' />
            {t('透明定价')}
          </div>
          <h2 className='text-3xl sm:text-4xl font-bold tracking-tight mb-4 text-foreground'>
            {t('只为使用付费')}
          </h2>
          <p className='text-lg text-muted-foreground max-w-xl mx-auto'>
            {t('无订阅费，无隐藏费用。充值点数，按 Token 计费 —— 购买更大套餐最高可节省 35%。')}
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'>
          {/* Free platform card */}
          <div className='rounded-xl border border-border bg-card p-6'>
            <div className='flex items-center justify-between mb-1'>
              <h3 className='text-xl font-bold text-foreground'>{t('平台')}</h3>
              <span className='inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-secondary text-secondary-foreground'>
                {t('免费')}
              </span>
            </div>
            <p className='text-sm text-muted-foreground mb-3'>{t('平台功能完全免费')}</p>
            <div className='pt-2 mb-6'>
              <span className='text-4xl font-extrabold text-foreground'>$0</span>
              <span className='text-muted-foreground ml-2'>/ {t('月')}</span>
            </div>
            <ul className='space-y-3 mb-6'>
              {PLATFORM_FEATURES.map((f) => (
                <li key={f} className='flex items-center gap-2.5 text-sm text-foreground'>
                  <div className='w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center shrink-0'>
                    <Check className='w-2.5 h-2.5 text-primary' />
                  </div>
                  {t(f)}
                </li>
              ))}
            </ul>
            <Link
              to='/register'
              className='flex items-center justify-center w-full h-9 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors'
            >
              {t('开始')}
            </Link>
          </div>

          {/* Credit packages */}
          <div>
            <h3 className='font-semibold text-lg mb-4 text-foreground'>{t('点数套餐')}</h3>
            <div className='space-y-3'>
              {CREDIT_PACKAGES.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative p-4 rounded-xl border transition-all ${
                    pkg.isPopular
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  {pkg.isPopular && (
                    <span className='absolute -top-2.5 right-4 inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary text-white'>
                      {t('最受欢迎')}
                    </span>
                  )}
                  <div className='flex items-center justify-between'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='text-xl font-bold text-foreground'>${pkg.amount}</span>
                        {pkg.bonus > 0 && (
                          <span className='inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-green-500/10 text-green-600'>
                            +${pkg.bonus} bonus
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground mt-0.5'>
                        ≈ {(pkg.inputTokens / 1_000_000).toFixed(1)}M input + {(pkg.outputTokens / 1_000_000).toFixed(1)}M output tokens
                      </p>
                    </div>
                    <Link
                      to='/register'
                      className={`inline-flex items-center justify-center h-7 px-2.5 text-sm font-medium rounded-lg transition-colors ${
                        pkg.isPopular
                          ? 'bg-primary text-white hover:bg-primary/80'
                          : 'border border-border bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      {t('立即充值')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p className='text-xs text-muted-foreground mt-4'>
              * {t('Token 数量基于 Claude Sonnet 定价估算，实际数量因模型而异。')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── MarketingFooter (matches web2) ──────────────────────────────────────────
function MarketingFooter({ t, docsLink }) {
  const systemName = getSystemName();
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelectorAll('.semi-layout').forEach((el) => {
      if (el.scrollTop > 0) el.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  return (
    <footer className='border-t border-border bg-background'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-20 py-4'>
        <div className='grid grid-cols-4 gap-8 md:grid-cols-4'>
          <div className='space-y-4'>
            <div className='flex items-center gap-2'>
              <LogoMark size='sm' />
              <span className='text-sm font-bold text-foreground'>{systemName}</span>
              <span className='inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>Pro</span>
            </div>
            <ul className='space-y-3'>
              <li><Link to='/#pricing' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>{t('定价')}</Link></li>
              <li><Link to='/#models' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>{t('模型')}</Link></li>
              <li><Link to='/console' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>{t('控制台')}</Link></li>
            </ul>
          </div>
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold text-foreground'>{t('文档')}</h3>
            <ul className='space-y-3'>
              <li>
                {docsLink ? (
                  <a href={docsLink} target='_blank' rel='noopener noreferrer' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>{t('文档')}</a>
                ) : (
                  <span className='text-sm text-muted-foreground'>{t('文档')}</span>
                )}
              </li>
            </ul>
          </div>
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold text-foreground'>{t('法律')}</h3>
            <ul className='space-y-3'>
              <li><Link to='/about' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>{t('服务条款')}</Link></li>
              <li><Link to='/about' className='text-sm text-muted-foreground hover:text-foreground transition-colors'>{t('隐私政策')}</Link></li>
            </ul>
          </div>
          <div>
            <button
              onClick={scrollToTop}
              className='flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
            >
              <ArrowUp className='w-3.5 h-3.5' />
              {t('返回顶部')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Home component ─────────────────────────────────────────────────────
const Home = () => {
  const { t, i18n } = useTranslation();
  const [statusState] = useContext(StatusContext);
  const actualTheme = useActualTheme();
  const [homePageContentLoaded, setHomePageContentLoaded] = useState(false);
  const [homePageContent, setHomePageContent] = useState('');
  const [noticeVisible, setNoticeVisible] = useState(false);
  const isMobile = useIsMobile();
  const docsLink = statusState?.status?.docs_link || '';

  const displayHomePageContent = async () => {
    setHomePageContent(
      stripScriptTags(localStorage.getItem('home_page_content') || '')
    );
    const res = await API.get('/api/home_page_content');
    const { success, message, data } = res.data;
    if (success) {
      let content = data;
      if (!data.startsWith('https://')) {
        content = stripScriptTags(marked.parse(data));
      }
      setHomePageContent(content);
      localStorage.setItem('home_page_content', content);

      if (data.startsWith('https://')) {
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.onload = () => {
            iframe.contentWindow.postMessage({ themeMode: actualTheme }, '*');
            iframe.contentWindow.postMessage({ lang: i18n.language }, '*');
          };
        }
      }
    } else {
      showError(message);
      setHomePageContent('加载首页内容失败...');
    }
    setHomePageContentLoaded(true);
  };

  useEffect(() => {
    const checkNoticeAndShow = async () => {
      const lastCloseDate = localStorage.getItem('notice_close_date');
      const today = new Date().toDateString();
      if (lastCloseDate !== today) {
        try {
          const res = await API.get('/api/notice');
          const { success, data } = res.data;
          if (success && data && data.trim() !== '') {
            setNoticeVisible(true);
          }
        } catch (error) {
          console.error('获取公告失败:', error);
        }
      }
    };
    checkNoticeAndShow();
  }, []);

  useEffect(() => {
    displayHomePageContent().then();
  }, []);

  return (
    <div className='w-full overflow-x-hidden'>
      <NoticeModal
        visible={noticeVisible}
        onClose={() => setNoticeVisible(false)}
        isMobile={isMobile}
      />
      {homePageContentLoaded && homePageContent === '' ? (
        <div className='flex flex-col min-h-screen w-full overflow-x-hidden'>
          <main className='flex-1'>
            <HeroSection t={t} docsLink={docsLink} />
            <ModelsSection t={t} />
            <FeaturesSection t={t} />
          </main>
          <MarketingFooter t={t} docsLink={docsLink} />
        </div>
      ) : (
        <div className='overflow-x-hidden w-full'>
          {homePageContent.startsWith('https://') ? (
            <iframe
              src={homePageContent}
              className='w-full h-screen border-none'
            />
          ) : (
            <div
              className='mt-[60px]'
              dangerouslySetInnerHTML={{ __html: homePageContent }}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
