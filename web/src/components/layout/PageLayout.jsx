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

import HeaderBar from './headerbar';
import { Layout, Avatar, Typography, Dropdown, Button } from '@douyinfe/semi-ui';
import { IconUserSetting, IconKey, IconCreditCard, IconExit } from '@douyinfe/semi-icons';
import { ChevronDown } from 'lucide-react';
import SiderBar from './SiderBar';
import App from '../../App';
import { stringToColor } from '../../helpers';
import FooterBar from './Footer';
import { ToastContainer } from 'react-toastify';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { useIsMobile } from '../../hooks/common/useIsMobile';
import { useSidebarCollapsed } from '../../hooks/common/useSidebarCollapsed';
import { useTranslation } from 'react-i18next';
import {
  API,
  getLogo,
  getSystemName,
  showError,
  showSuccess,
  setStatusData,
  setUserData,
  updateAPI,
} from '../../helpers';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { useLocation, useNavigate } from 'react-router-dom';
import { normalizeLanguage } from '../../i18n/language';
const { Sider, Content } = Layout;

const PageLayout = () => {
  const [userState, userDispatch] = useContext(UserContext);
  const [, statusDispatch] = useContext(StatusContext);
  const isMobile = useIsMobile();
  const [collapsed, , setCollapsed] = useSidebarCollapsed();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const userDropdownRef = useRef(null);

  const logout = async () => {
    await API.get('/api/user/logout');
    showSuccess(t('logout') + '!');
    userDispatch({ type: 'logout' });
    localStorage.removeItem('user');
    navigate('/login');
  };

  const cardProPages = [
    '/console/channel',
    '/console/log',
    '/console/redemption',
    '/console/user',
    '/console/token',
    '/console/midjourney',
    '/console/task',
    '/console/models',
    '/pricing',
  ];

  const shouldHideFooter = cardProPages.includes(location.pathname);

  const shouldInnerPadding =
    location.pathname.includes('/console') &&
    !location.pathname.startsWith('/console/chat') &&
    location.pathname !== '/console/playground';

  const isConsoleRoute = location.pathname.startsWith('/console');
  const isAuthRoute = ['/login', '/register', '/reset', '/user/reset'].includes(location.pathname);
  const showTopHeader = !isAuthRoute && (!isConsoleRoute || isMobile);
  const showSider = isConsoleRoute && (!isMobile || drawerOpen);

  useEffect(() => {
    if (isMobile && drawerOpen && collapsed) {
      setCollapsed(false);
    }
  }, [isMobile, drawerOpen, collapsed, setCollapsed]);

  const loadUser = () => {
    let user = localStorage.getItem('user');
    if (user) {
      let data = JSON.parse(user);
      userDispatch({ type: 'login', payload: data });
    }
  };

  const loadStatus = async () => {
    try {
      const res = await API.get('/api/status');
      const { success, data } = res.data;
      if (success) {
        statusDispatch({ type: 'set', payload: data });
        setStatusData(data);
      } else {
        showError('Unable to connect to server');
      }
    } catch (error) {
      showError('Failed to load status');
    }
  };

  useEffect(() => {
    loadUser();
    loadStatus().catch(console.error);
    let systemName = getSystemName();
    if (systemName) {
      document.title = systemName;
    }
    let logo = getLogo();
    if (logo) {
      let linkElement = document.querySelector("link[rel~='icon']");
      if (linkElement) {
        linkElement.href = logo;
      }
    }
  }, []);

  useEffect(() => {
    let preferredLang;

    if (userState?.user?.setting) {
      try {
        const settings = JSON.parse(userState.user.setting);
        preferredLang = normalizeLanguage(settings.language);
      } catch (e) {
        // Ignore parse errors
      }
    }

    if (!preferredLang) {
      const savedLang = localStorage.getItem('i18nextLng');
      if (savedLang) {
        preferredLang = normalizeLanguage(savedLang);
      }
    }

    if (preferredLang) {
      localStorage.setItem('i18nextLng', preferredLang);
      if (preferredLang !== i18n.language) {
        i18n.changeLanguage(preferredLang);
      }
    }
  }, [i18n, userState?.user?.setting]);

  return (
    <>
      {showTopHeader && (
        <HeaderBar
          onMobileMenuToggle={() => setDrawerOpen((prev) => !prev)}
          drawerOpen={drawerOpen}
        />
      )}
      <Layout
        className='app-layout'
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: isMobile ? 'visible' : 'hidden',
          minHeight: showTopHeader ? 'calc(100vh - 64px)' : '100vh',
          marginTop: showTopHeader ? '64px' : '0',
        }}
      >
        <Layout
          style={{
            overflow: isMobile ? 'visible' : 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
        {showSider && (
          <Sider
            className={isConsoleRoute && !isMobile ? 'app-sider-console' : 'app-sider'}
            style={{
              position: 'fixed',
              left: 0,
              top: isConsoleRoute && !isMobile ? 0 : '64px',
              zIndex: 99,
              border: 'none',
              paddingRight: '0',
              width: 'var(--sidebar-current-width)',
            }}
          >
            <SiderBar
              onNavigate={() => {
                if (isMobile) setDrawerOpen(false);
              }}
              showHeader={isConsoleRoute && !isMobile}
              showFooterUser={isConsoleRoute && !isMobile}
            />
          </Sider>
        )}

        <Layout
          style={{
            marginLeft: isMobile
              ? '0'
              : showSider
                ? 'var(--sidebar-current-width)'
                : '0',
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Content
            style={{
              flex: '1 0 auto',
              overflowY: isMobile ? 'visible' : 'hidden',
              WebkitOverflowScrolling: 'touch',
              padding: shouldInnerPadding ? (isMobile ? '5px' : '24px') : '0',
              position: 'relative',
            }}
          >
            {isConsoleRoute && !isMobile && userState?.user && (
              <div
                className='absolute top-4 right-6 z-50'
                ref={userDropdownRef}
              >
                <Dropdown
                  position='bottomRight'
                  getPopupContainer={() => userDropdownRef.current}
                  render={
                    <Dropdown.Menu className='!bg-semi-color-bg-overlay !border-semi-color-border !shadow-lg !rounded-lg'>
                      <Dropdown.Item
                        onClick={() => navigate('/console/token')}
                        className='!px-3 !py-1.5 !text-sm hover:!bg-semi-color-fill-1'
                      >
                        <div className='flex items-center gap-2'>
                          <IconKey size='small' className='text-gray-500' />
                          <span>{t('令牌管理')}</span>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={() => navigate('/console/topup')}
                        className='!px-3 !py-1.5 !text-sm hover:!bg-semi-color-fill-1'
                      >
                        <div className='flex items-center gap-2'>
                          <IconCreditCard size='small' className='text-gray-500' />
                          <span>{t('钱包管理')}</span>
                        </div>
                      </Dropdown.Item>
                      <Dropdown.Item
                        onClick={logout}
                        className='!px-3 !py-1.5 !text-sm hover:!bg-semi-color-fill-1'
                      >
                        <div className='flex items-center gap-2'>
                          <IconExit size='small' className='text-gray-500' />
                          <span>{t('logout')}</span>
                        </div>
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  }
                >
                  <Button
                    theme='borderless'
                    type='tertiary'
                    className='flex items-center gap-1.5 !p-1 !pr-2 !rounded-full hover:!bg-semi-color-fill-1 !bg-semi-color-fill-0'
                  >
                    <Avatar
                      size='extra-small'
                      color={stringToColor(userState.user.username)}
                    >
                      {userState.user.username[0].toUpperCase()}
                    </Avatar>
                    <Typography.Text className='!text-xs !font-medium !text-semi-color-text-1'>
                      {userState.user.display_name || userState.user.username}
                    </Typography.Text>
                    <ChevronDown size={14} className='text-semi-color-text-2' />
                  </Button>
                </Dropdown>
              </div>
            )}
            <App />
          </Content>
          {!shouldHideFooter && !isAuthRoute && (
            <Layout.Footer
              style={{
                flex: '0 0 auto',
                width: '100%',
              }}
            >
              <FooterBar />
            </Layout.Footer>
          )}
        </Layout>
      </Layout>
      </Layout>
      <ToastContainer />
    </>
  );
};

export default PageLayout;
