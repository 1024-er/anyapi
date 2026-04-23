/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getLucideIcon } from '../../helpers/render';
import { PanelLeftClose, PanelLeftOpen, LogOut, Sun, Moon, Monitor, Languages } from 'lucide-react';
import { useSidebarCollapsed } from '../../hooks/common/useSidebarCollapsed';
import { useSidebar } from '../../hooks/common/useSidebar';
import { useMinimumLoadingTime } from '../../hooks/common/useMinimumLoadingTime';
import {
  isAdmin,
  isRoot,
  showError,
  getSystemName,
  API,
  showSuccess,
} from '../../helpers';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { useTheme, useSetTheme } from '../../context/Theme';
import { normalizeLanguage } from '../../i18n/language';
import SkeletonWrapper from './components/SkeletonWrapper';
import { stringToColor } from '../../helpers';

import { Nav, Divider, Button, Avatar, Typography, Dropdown } from '@douyinfe/semi-ui';

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

const routerMap = {
  home: '/',
  channel: '/console/channel',
  token: '/console/token',
  redemption: '/console/redemption',
  topup: '/console/topup',
  user: '/console/user',
  subscription: '/console/subscription',
  log: '/console/log',
  midjourney: '/console/midjourney',
  setting: '/console/setting',
  about: '/about',
  detail: '/console',
  pricing: '/pricing',
  task: '/console/task',
  models: '/console/models',
  deployment: '/console/deployment',
  playground: '/console/playground',
  // personal: '/console/personal',
  invite: '/console/invite',
};

const isExternalRoute = (to) => /^https?:\/\//i.test(to);

const SiderBar = ({
  onNavigate = () => {},
  showHeader = false,
  showFooterUser = false,
}) => {
  const { t, i18n } = useTranslation();
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const {
    isModuleVisible,
    hasSectionVisibleModules,
    loading: sidebarLoading,
  } = useSidebar();

  const showSkeleton = useMinimumLoadingTime(sidebarLoading, 200);

  const [selectedKeys, setSelectedKeys] = useState(['home']);
  const [chatItems, setChatItems] = useState([]);
  const [openedKeys, setOpenedKeys] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [routerMapState, setRouterMapState] = useState(routerMap);

  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);
  const theme = useTheme();
  const tutorialLink =
    statusState?.status?.docs_link || localStorage.getItem('docs_link') || '';
  const setTheme = useSetTheme();
  const systemName = getSystemName();

  const getRoleText = useCallback(() => {
    if (isRoot()) return t('超级管理员');
    if (isAdmin()) return t('管理员');
    return t('普通用户');
  }, [t]);

  const handleThemeToggle = useCallback(() => {
    const order = ['light', 'dark', 'auto'];
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  }, [theme, setTheme]);

  const handleLanguageChange = useCallback(
    async (lang) => {
      const previousLang = normalizeLanguage(i18n.language);
      i18n.changeLanguage(lang);
      localStorage.setItem('i18nextLng', lang);

      if (userState?.user?.id) {
        try {
          const res = await API.put('/api/user/self', { language: lang });
          if (res.data.success) {
            let settings = {};
            if (userState?.user?.setting) {
              try {
                settings = JSON.parse(userState.user.setting) || {};
              } catch (e) {
                settings = {};
              }
            }
            settings.language = lang;
            const nextUser = { ...userState.user, setting: JSON.stringify(settings) };
            userDispatch({ type: 'login', payload: nextUser });
            localStorage.setItem('user', JSON.stringify(nextUser));
          }
        } catch (error) {
          if (previousLang) {
            i18n.changeLanguage(previousLang);
            localStorage.setItem('i18nextLng', previousLang);
          }
        }
      }
    },
    [i18n, userState, userDispatch],
  );

  const logout = useCallback(async () => {
    await API.get('/api/user/logout');
    showSuccess(t('注销成功!'));
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate, t, userDispatch]);

  const themeIcon = useMemo(() => {
    if (theme === 'dark') return <Moon size={16} />;
    if (theme === 'light') return <Sun size={16} />;
    return <Monitor size={16} />;
  }, [theme]);

  const workspaceItems = useMemo(() => {
    const items = [
      {
        text: t('数据看板'),
        itemKey: 'detail',
        to: '/detail',
        className:
          localStorage.getItem('enable_data_export') === 'true'
            ? ''
            : 'tableHiddle',
      },
      {
        text: t('API Keys'),
        itemKey: 'token',
        to: '/token',
      },
      {
        text: t('使用日志'),
        itemKey: 'log',
        to: '/log',
      },
      // {
      //   text: t('绘图日志'),
      //   itemKey: 'midjourney',
      //   to: '/midjourney',
      //   className:
      //     localStorage.getItem('enable_drawing') === 'true'
      //       ? ''
      //       : 'tableHiddle',
      // },
      {
        text: t('任务日志'),
        itemKey: 'task',
        to: '/task',
        className:
          localStorage.getItem('enable_task') === 'true' ? '' : 'tableHiddle',
      },
      {
        text: t('我的钱包'),
        itemKey: 'topup',
        to: '/topup',
      },
      {
        text: t('邀请奖励'),
        itemKey: 'invite',
        to: '/invite',
      },
      ...(tutorialLink
        ? [
            {
              text: t('使用教程'),
              itemKey: 'tutorial',
              to: tutorialLink,
            },
          ]
        : []),
    ];

    const filteredItems = items.filter((item) => {
      const configVisible = isModuleVisible('console', item.itemKey);
      return configVisible;
    });

    return filteredItems;
  }, [
    localStorage.getItem('enable_data_export'),
    localStorage.getItem('enable_drawing'),
    localStorage.getItem('enable_task'),
    tutorialLink,
    t,
    isModuleVisible,
  ]);

  const financeItems = useMemo(() => {
    const items = [
      {
        text: t('钱包管理'),
        itemKey: 'topup',
        to: '/topup',
      },
      {
        text: t('个人设置'),
        itemKey: 'personal',
        to: '/personal',
      },
    ];

    const filteredItems = items.filter((item) => {
      const configVisible = isModuleVisible('personal', item.itemKey);
      return configVisible;
    });

    return filteredItems;
  }, [t, isModuleVisible]);

  const adminItems = useMemo(() => {
    const items = [
      {
        text: t('渠道管理'),
        itemKey: 'channel',
        to: '/channel',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('订阅管理'),
        itemKey: 'subscription',
        to: '/subscription',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('模型管理'),
        itemKey: 'models',
        to: '/console/models',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('模型部署'),
        itemKey: 'deployment',
        to: '/deployment',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('兑换码管理'),
        itemKey: 'redemption',
        to: '/redemption',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('用户管理'),
        itemKey: 'user',
        to: '/user',
        className: isAdmin() ? '' : 'tableHiddle',
      },
      {
        text: t('系统设置'),
        itemKey: 'setting',
        to: '/setting',
        className: isRoot() ? '' : 'tableHiddle',
      },
    ];

    const filteredItems = items.filter((item) => {
      const configVisible = isModuleVisible('admin', item.itemKey);
      return configVisible;
    });

    return filteredItems;
  }, [isAdmin(), isRoot(), t, isModuleVisible]);

  const chatMenuItems = useMemo(() => {
    const items = [
      {
        text: t('操练场'),
        itemKey: 'playground',
        to: '/playground',
      },
      {
        text: t('聊天'),
        itemKey: 'chat',
        items: chatItems,
      },
    ];

    const filteredItems = items.filter((item) => {
      const configVisible = isModuleVisible('chat', item.itemKey);
      return configVisible;
    });

    return filteredItems;
  }, [chatItems, t, isModuleVisible]);

  const updateRouterMapWithChats = (chats) => {
    const newRouterMap = { ...routerMap };

    if (Array.isArray(chats) && chats.length > 0) {
      for (let i = 0; i < chats.length; i++) {
        newRouterMap['chat' + i] = '/console/chat/' + i;
      }
    }

    setRouterMapState(newRouterMap);
    return newRouterMap;
  };

  const getItemRoute = useCallback(
    (itemKey) => {
      if (itemKey === 'tutorial') {
        return tutorialLink;
      }
      return routerMapState[itemKey] || routerMap[itemKey];
    },
    [routerMapState, tutorialLink],
  );

  useEffect(() => {
    let chats = localStorage.getItem('chats');
    if (chats) {
      try {
        chats = JSON.parse(chats);
        if (Array.isArray(chats)) {
          let chatItems = [];
          for (let i = 0; i < chats.length; i++) {
            let shouldSkip = false;
            let chat = {};
            for (let key in chats[i]) {
              let link = chats[i][key];
              if (typeof link !== 'string') continue;
              if (link.startsWith('fluent') || link.startsWith('ccswitch')) {
                shouldSkip = true;
                break;
              }
              chat.text = key;
              chat.itemKey = 'chat' + i;
              chat.to = '/console/chat/' + i;
            }
            if (shouldSkip || !chat.text) continue;
            chatItems.push(chat);
          }
          setChatItems(chatItems);
          updateRouterMapWithChats(chats);
        }
      } catch (e) {
        showError('聊天数据解析失败');
      }
    }
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;
    let matchingKey = Object.keys(routerMapState).find(
      (key) => routerMapState[key] === currentPath,
    );

    if (!matchingKey && currentPath.startsWith('/console/chat/')) {
      const chatIndex = currentPath.split('/').pop();
      if (!isNaN(chatIndex)) {
        matchingKey = 'chat' + chatIndex;
      } else {
        matchingKey = 'chat';
      }
    }

    if (matchingKey) {
      setSelectedKeys([matchingKey]);
    }
  }, [location.pathname, routerMapState]);

  useEffect(() => {
    if (collapsed) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
  }, [collapsed]);

  const SELECTED_COLOR = 'var(--semi-color-primary)';

  const renderNavItem = (item) => {
    if (item.className === 'tableHiddle') return null;

    const isSelected = selectedKeys.includes(item.itemKey);
    const textColor = isSelected ? SELECTED_COLOR : 'inherit';

    return (
      <Nav.Item
        key={item.itemKey}
        itemKey={item.itemKey}
        text={
          <span
            className='truncate font-medium text-xs'
            style={{ color: textColor }}
          >
            {item.text}
          </span>
        }
        icon={
          <div className='sidebar-icon-container flex-shrink-0'>
            {getLucideIcon(item.itemKey, isSelected)}
          </div>
        }
        className={item.className}
      />
    );
  };

  const renderSubItem = (item) => {
    if (item.items && item.items.length > 0) {
      const isSelected = selectedKeys.includes(item.itemKey);
      const textColor = isSelected ? SELECTED_COLOR : 'inherit';

      return (
        <Nav.Sub
          key={item.itemKey}
          itemKey={item.itemKey}
          text={
            <span
              className='truncate font-medium text-xs'
              style={{ color: textColor }}
            >
              {item.text}
            </span>
          }
          icon={
            <div className='sidebar-icon-container flex-shrink-0'>
              {getLucideIcon(item.itemKey, isSelected)}
            </div>
          }
        >
          {item.items.map((subItem) => {
            const isSubSelected = selectedKeys.includes(subItem.itemKey);
            const subTextColor = isSubSelected ? SELECTED_COLOR : 'inherit';

            return (
              <Nav.Item
                key={subItem.itemKey}
                itemKey={subItem.itemKey}
                text={
                  <span
                    className='truncate font-medium text-sm'
                    style={{ color: subTextColor }}
                  >
                    {subItem.text}
                  </span>
                }
              />
            );
          })}
        </Nav.Sub>
      );
    } else {
      return renderNavItem(item);
    }
  };

  const currentLang = normalizeLanguage(i18n.language);

  const langMenuItems = [
    { key: 'zh-CN', label: '🇨🇳 简体' },
    { key: 'zh-TW', label: '🇹🇼 繁體' },
    { key: 'en', label: '🇺🇸 English' },
    { key: 'fr', label: '🇫🇷 Français' },
    { key: 'ja', label: '🇯🇵 日本語' },
    { key: 'ru', label: '🇷🇺 Русский' },
    { key: 'vi', label: '🇻🇳 Tiếng Việt' },
  ];
  const currentLangItem = langMenuItems.find(item => item.key === currentLang) || langMenuItems[0];

  return (
    <div
      className='sidebar-container'
      style={{
        width: 'var(--sidebar-current-width)',
      }}
    >
      {/* Sidebar header: logo + system name */}
      {showHeader && (
        <div className='sidebar-header'>
          <Link to='/' className='flex items-center gap-2.5 no-underline' onClick={onNavigate}>
            <LogoMark />
            {!collapsed && (
              <Typography.Title
                heading={5}
                className='!text-base !font-bold !mb-0 tracking-tight truncate'
              >
                {systemName}
              </Typography.Title>
            )}
          </Link>
        </div>
      )}

      <SkeletonWrapper
        loading={showSkeleton}
        type='sidebar'
        className=''
        collapsed={collapsed}
        showAdmin={isAdmin()}
      >
        <Nav
          className='sidebar-nav'
          defaultIsCollapsed={collapsed}
          isCollapsed={collapsed}
          onCollapseChange={toggleCollapsed}
          selectedKeys={selectedKeys}
          itemStyle='sidebar-nav-item'
          hoverStyle='sidebar-nav-item:hover'
          selectedStyle='sidebar-nav-item-selected'
          renderWrapper={({ itemElement, props }) => {
            const to = getItemRoute(props.itemKey);

            if (!to) return itemElement;

            if (isExternalRoute(to)) {
              return (
                <a
                  style={{ textDecoration: 'none' }}
                  href={to}
                  target='_blank'
                  rel='noopener noreferrer'
                  onClick={onNavigate}
                >
                  {itemElement}
                </a>
              );
            }

            return (
              <Link
                style={{ textDecoration: 'none' }}
                to={to}
                onClick={onNavigate}
              >
                {itemElement}
              </Link>
            );
          }}
          onSelect={(key) => {
            const to = getItemRoute(key.itemKey);

            if (isExternalRoute(to)) {
              return;
            }

            if (openedKeys.includes(key.itemKey)) {
              setOpenedKeys(openedKeys.filter((k) => k !== key.itemKey));
            }

            setSelectedKeys([key.itemKey]);
          }}
          openKeys={openedKeys}
          onOpenChange={(data) => {
            setOpenedKeys(data.openKeys);
          }}
        >
          {hasSectionVisibleModules('chat') && (
            <div className='sidebar-section'>
              {!collapsed && (
                <div className='sidebar-group-label'>{t('聊天')}</div>
              )}
              {chatMenuItems.map((item) => renderSubItem(item))}
            </div>
          )}

          {hasSectionVisibleModules('console') && (
            <>
              <Divider className='sidebar-divider' />
              <div>
                {!collapsed && (
                  <div className='sidebar-group-label'>{t('控制台')}</div>
                )}
                {workspaceItems.map((item) => renderNavItem(item))}
              </div>
            </>
          )}

          {hasSectionVisibleModules('personal') && (
            <>
              <Divider className='sidebar-divider' />
              <div>
                {!collapsed && (
                  <div className='sidebar-group-label'>{t('个人中心')}</div>
                )}
                {financeItems.map((item) => renderNavItem(item))}
              </div>
            </>
          )}

          {isAdmin() && hasSectionVisibleModules('admin') && (
            <>
              <Divider className='sidebar-divider' />
              <div>
                {!collapsed && (
                  <div className='sidebar-group-label'>{t('管理员')}</div>
                )}
                {adminItems.map((item) => renderNavItem(item))}
              </div>
            </>
          )}
        </Nav>
      </SkeletonWrapper>

      {/* Bottom section */}
      <div className='sidebar-footer'>
        {/* User area */}
        {showFooterUser && userState?.user ? (
          <div className='sidebar-user-area'>
            {/* Action buttons + collapse toggle */}
            <div className={`sidebar-user-actions ${collapsed ? 'flex-col' : ''}`}>
              <Button
                icon={<LogOut size={16} />}
                theme='borderless'
                type='tertiary'
                size='default'
                onClick={logout}
                className='sidebar-action-btn'
                aria-label={t('logout')}
              />
              <Button
                icon={themeIcon}
                theme='borderless'
                type='tertiary'
                size='small'
                onClick={handleThemeToggle}
                className='sidebar-action-btn'
                aria-label={t('切换主题')}
              />
              <Dropdown
                position={collapsed ? 'rightBottom' : 'topLeft'}
                render={
                  <Dropdown.Menu className='!bg-semi-color-bg-overlay !border-semi-color-border !shadow-lg !rounded-lg'>
                    {langMenuItems.map((item) => (
                      <Dropdown.Item
                        key={item.key}
                        onClick={() => handleLanguageChange(item.key)}
                        className={`!px-3 !py-1.5 !text-sm ${currentLang === item.key ? '!bg-semi-color-primary-light-default !font-semibold' : 'hover:!bg-semi-color-fill-1'}`}
                      >
                        {item.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                }
              >
                <Button
                  icon={<span className="text-lg">{currentLangItem.label.split(' ')[0]}</span>}
                  theme='borderless'
                  type='tertiary'
                  size='small'
                  className='sidebar-action-btn'
                  aria-label={`${t('切换语言')} (${currentLangItem.label})`}
                />
              </Dropdown>
              <Button
                icon={collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                theme='borderless'
                type='tertiary'
                size='small'
                onClick={toggleCollapsed}
                className='sidebar-action-btn'
                aria-label={t('收起侧边栏')}
              />
            </div>
          </div>
        ) : (
          <div className='sidebar-collapse-button'>
            <Button
              icon={collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              theme='borderless'
              type='tertiary'
              size='small'
              onClick={toggleCollapsed}
              className='sidebar-action-btn'
              aria-label={t('收起侧边栏')}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SiderBar;
