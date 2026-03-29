

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHeaderBar } from '../../../hooks/common/useHeaderBar';
import { useNotifications } from '../../../hooks/common/useNotifications';
import { useNavigation } from '../../../hooks/common/useNavigation';
import NoticeModal from '../NoticeModal';
import NotificationButton from './NotificationButton';
import NewYearButton from './NewYearButton';
import { Dropdown, Button, Tag } from '@douyinfe/semi-ui';
import { Menu, X, Sun, Moon, Monitor, Languages } from 'lucide-react';

function LogoMark({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center justify-center select-none shrink-0 w-8 h-8 rounded-lg ${className}`}
      style={{ background: 'oklch(0.55 0.20 264)', color: '#fff' }}
    >
      <svg viewBox='0 0 24 24' fill='none' className='w-5 h-5'>
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

const HeaderBar = ({ onMobileMenuToggle, drawerOpen }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const {
    userState,
    statusState,
    isMobile,
    collapsed,
    currentLang,
    isLoading,
    systemName,
    isNewYear,
    isSelfUseMode,
    docsLink,
    isDemoSiteMode,
    isConsoleRoute,
    theme,
    headerNavModules,
    pricingRequireAuth,
    logout,
    handleLanguageChange,
    handleThemeToggle,
    handleMobileMenuToggle,
    navigate,
    t,
  } = useHeaderBar({ onMobileMenuToggle, drawerOpen });

  const {
    noticeVisible,
    unreadCount,
    handleNoticeOpen,
    handleNoticeClose,
    getUnreadKeys,
  } = useNotifications(statusState);

  const { mainNavLinks } = useNavigation(t, docsLink, headerNavModules);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  if (isConsoleRoute && isMobile) {
    return (
      <header className='text-semi-color-text-0 sticky top-0 z-50 bg-white/75 dark:bg-zinc-900/75 backdrop-blur-lg'>
        <NoticeModal
          visible={noticeVisible}
          onClose={handleNoticeClose}
          isMobile={isMobile}
          defaultTab={unreadCount > 0 ? 'system' : 'inApp'}
          unreadKeys={getUnreadKeys()}
        />
        <div className='w-full px-2'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center'>
              <Button
                icon={drawerOpen ? <X size={20} /> : <Menu size={20} />}
                aria-label={drawerOpen ? t('关闭侧边栏') : t('打开侧边栏')}
                onClick={handleMobileMenuToggle}
                theme='borderless'
                type='tertiary'
                className='!p-2 !text-current'
              />
              <Link to='/' className='flex items-center gap-2 ml-1'>
                <LogoMark />
                <span className='font-bold text-lg tracking-tight'>{systemName}</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const themeIcon =
    theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />;

  const langItems = [
    { key: 'zh-CN', label: '简体中文' },
    { key: 'zh-TW', label: '繁體中文' },
    { key: 'en', label: 'English' },
    { key: 'fr', label: 'Français' },
    { key: 'ja', label: '日本語' },
    { key: 'ru', label: 'Русский' },
    { key: 'vi', label: 'Tiếng Việt' },
  ];

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-background/90 backdrop-blur border-b border-border shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <NoticeModal
        visible={noticeVisible}
        onClose={handleNoticeClose}
        isMobile={isMobile}
        defaultTab={unreadCount > 0 ? 'system' : 'inApp'}
        unreadKeys={getUnreadKeys()}
      />

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-20'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <Link to='/' className='flex items-center gap-2.5 shrink-0'>
            <LogoMark />
            <span className='font-bold text-lg tracking-tight'>{systemName}</span>
            {/* {(isSelfUseMode || isDemoSiteMode) && ( */}
              <Tag
                color={isSelfUseMode ? 'purple' : 'blue'}
                className='text-xs hidden sm:flex'
                size='small'
                shape='circle'
              >Pro</Tag>
            {/* )} */}
          </Link>

          {/* Desktop nav */}
          <nav className='hidden md:flex items-center gap-1'>
            {mainNavLinks.map((link) => {
              if (link.isExternal) {
                return (
                  <a
                    key={link.itemKey}
                    href={link.externalLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='px-3 py-1.5 text-sm text-muted-foreground hover:text-blue-800 transition-colors rounded-md hover:bg-accent'
                  >
                    {link.text}
                  </a>
                );
              }

              let targetPath = link.to;
              if (link.itemKey === 'console' && !userState.user) {
                targetPath = '/login';
              }
              if (link.itemKey === 'pricing' && pricingRequireAuth && !userState.user) {
                targetPath = '/login';
              }

              return (
                <Link
                  key={link.itemKey}
                  to={targetPath}
                  className='px-3 py-1.5 text-sm text-muted-foreground hover:text-blue-800 transition-colors rounded-md hover:bg-accent'
                >
                  {link.text}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className='flex items-center gap-2'>
            {/* New Year button */}
            <NewYearButton isNewYear={isNewYear} />

            {/* Notification button */}
            <NotificationButton
              unreadCount={unreadCount}
              onNoticeOpen={handleNoticeOpen}
              t={t}
            />
            {/* Theme toggle */}
            <Dropdown
              position='bottomRight'
              render={
                <Dropdown.Menu>
                  <Dropdown.Item
                    icon={<Sun size={16} />}
                    onClick={() => handleThemeToggle('light')}
                    className={theme === 'light' ? '!bg-semi-color-primary-light-default !font-semibold' : ''}
                  >
                    {t('浅色模式')}
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={<Moon size={16} />}
                    onClick={() => handleThemeToggle('dark')}
                    className={theme === 'dark' ? '!bg-semi-color-primary-light-default !font-semibold' : ''}
                  >
                    {t('深色模式')}
                  </Dropdown.Item>
                  <Dropdown.Item
                    icon={<Monitor size={16} />}
                    onClick={() => handleThemeToggle('auto')}
                    className={theme === 'auto' ? '!bg-semi-color-primary-light-default !font-semibold' : ''}
                  >
                    {t('自动模式')}
                  </Dropdown.Item>
                </Dropdown.Menu>
              }
            >
              <button
                className='hidden md:inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors'
                aria-label={t('切换主题')}
              >
                {themeIcon}
              </button>
            </Dropdown>

            {/* Language switcher */}
            <Dropdown
              position='bottomRight'
              render={
                <Dropdown.Menu>
                  {langItems.map((item) => (
                    <Dropdown.Item
                      key={item.key}
                      onClick={() => handleLanguageChange(item.key)}
                      className={currentLang === item.key ? '!bg-semi-color-primary-light-default !font-semibold' : ''}
                    >
                      {item.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              }
            >
              <button
                className='hidden md:inline-flex items-center justify-center h-8 w-8 rounded-lg hover:bg-muted transition-colors'
                aria-label={t('切换语言')}
              >
                <Languages size={16} />
              </button>
            </Dropdown>


            {/* Auth buttons */}
            {userState.user ? (
              <div className='hidden md:flex items-center gap-2'>
                <Link
                  to='/console'
                  className='inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors'
                >
                  {t('控制台')}
                </Link>
                <button
                  onClick={logout}
                  className='inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md hover:bg-muted transition-colors'
                >
                  {t('logout')}
                </button>
              </div>
            ) : (
              <div className='hidden md:flex items-center gap-2'>
                <Link
                  to='/login'
                  className='inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors'
                  style={{ background: 'oklch(0.55 0.20 264)' }}
                >
                  {t('控制台')}
                </Link>
                {/* {!isSelfUseMode && (
                  <Link
                    to='/register'
                    className='inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-white rounded-md transition-colors'
                    style={{ background: 'oklch(0.55 0.20 264)' }}
                  >
                    {t('开始使用')}
                  </Link>
                )} */}
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              className='md:hidden inline-flex items-center justify-center h-9 w-9 rounded-lg hover:bg-muted transition-colors'
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? t('关闭菜单') : t('打开菜单')}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className='md:hidden bg-background border-b border-border px-4 pb-4 space-y-1'>
          {mainNavLinks.map((link) => {
            if (link.isExternal) {
              return (
                <a
                  key={link.itemKey}
                  href={link.externalLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='block px-3 py-2 text-sm text-muted-foreground hover:text-blue-800 hover:bg-accent rounded-md'
                  onClick={() => setMobileOpen(false)}
                >
                  {link.text}
                </a>
              );
            }

            let targetPath = link.to;
            if (link.itemKey === 'console' && !userState.user) targetPath = '/login';
            if (link.itemKey === 'pricing' && pricingRequireAuth && !userState.user) targetPath = '/login';

            return (
              <Link
                key={link.itemKey}
                to={targetPath}
                className='block px-3 py-2 text-sm text-muted-foreground hover:text-blue-800 hover:bg-accent rounded-md'
                onClick={() => setMobileOpen(false)}
              >
                {link.text}
              </Link>
            );
          })}

          {/* Mobile auth buttons */}
          <div className='flex gap-2 pt-2'>
            {userState.user ? (
              <>
                <Link
                  to='/console'
                  className='flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors'
                  onClick={() => setMobileOpen(false)}
                >
                  {t('控制台')}
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className='flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors'
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to='/login'
                  className='flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors'
                  onClick={() => setMobileOpen(false)}
                >
                  {t('登录')}
                </Link>
                {!isSelfUseMode && (
                  <Link
                    to='/register'
                    className='flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-white rounded-md transition-colors'
                    style={{ background: 'oklch(0.55 0.20 264)' }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {t('开始使用')}
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile language buttons */}
          <div className='flex gap-2 pt-1 flex-wrap'>
            {langItems.map((item) => (
              <button
                key={item.key}
                onClick={() => { handleLanguageChange(item.key); setMobileOpen(false); }}
                className={`flex-1 px-3 py-2 text-sm rounded-md border text-center min-w-[60px] ${
                  currentLang === item.key
                    ? 'border-primary font-semibold'
                    : 'border-border text-muted-foreground'
                }`}
                style={currentLang === item.key ? { color: 'oklch(0.55 0.20 264)', borderColor: 'oklch(0.55 0.20 264)' } : {}}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

export default HeaderBar;
