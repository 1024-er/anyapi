import React from 'react';
import { Link } from 'react-router-dom';
import { getSystemName } from '../../helpers';
import { useTranslation } from 'react-i18next';

function LogoMark({ bg }) {
  return (
    <span
      className='inline-flex items-center justify-center select-none shrink-0 w-8 h-8 rounded-lg'
      style={{ background: bg || 'oklch(0.55 0.20 264)', color: '#fff' }}
    >
      <svg viewBox='0 0 24 24' fill='none' className='w-5 h-5'>
        <path d='M2 20L7.5 4L12 17L16.5 4L22 20' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
        <path d='M4.5 14H10.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
        <path d='M13.5 14H19.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
      </svg>
    </span>
  );
}

const AuthBrandPanel = () => {
  const { t } = useTranslation();
  const systemName = getSystemName();

  return (
    <div className='hidden lg:flex flex-col relative overflow-hidden min-h-screen'>
      <div className='absolute inset-0' style={{ background: 'linear-gradient(to bottom right, oklch(0.65 0.22 264), oklch(0.45 0.22 280))' }} />
      <div className='absolute inset-0' style={{ backgroundImage: 'linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/10 blur-3xl pointer-events-none' />

      <div className='relative flex flex-col h-full p-12'>
        <Link to='/' className='flex items-center gap-2.5 no-underline'>
          <LogoMark bg='rgba(255,255,255,0.2)' />
          <span className='font-bold text-lg text-white tracking-tight'>{systemName}</span>
        </Link>

        <div className='flex-1 flex flex-col justify-center'>
          <div className='space-y-4'>
            <h1 className='text-4xl font-extrabold text-white leading-tight'>
              {t('hero_title1')} <span className='text-white/80'>{t('hero_title2')}</span>
            </h1>
          </div>
        </div>
        <div className='flex items-center gap-4 mt-8'>
          <div className='flex -space-x-2'>
            {['A', 'B', 'C', 'D'].map((letter) => (
              <div key={letter} className='w-8 h-8 rounded-full bg-white/20 border-2 flex items-center justify-center text-white text-xs font-bold' style={{ borderColor: 'oklch(0.55 0.20 264)' }}>
                {letter}
              </div>
            ))}
          </div>
          <span className='text-sm text-white/70'>{t('受到开发者信赖')}</span>
        </div>
      </div>
    </div>
  );
};

export default AuthBrandPanel;
