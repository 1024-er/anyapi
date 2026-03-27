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

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import {
  API,
  getLogo,
  showError,
  showInfo,
  showSuccess,
  updateAPI,
  getSystemName,
  getOAuthProviderIcon,
  setUserData,
  onGitHubOAuthClicked,
  onDiscordOAuthClicked,
  onOIDCClicked,
  onLinuxDOOAuthClicked,
  onCustomOAuthClicked,
  prepareCredentialRequestOptions,
  buildAssertionResult,
  isPasskeySupported,
} from '../../helpers';
import Turnstile from 'react-turnstile';
import {
  Button,
  Checkbox,
  Divider,
  Dropdown,
  Form,
  Icon,
  Modal,
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import TelegramLoginButton from 'react-telegram-login';

import {
  IconGithubLogo,
  IconMail,
  IconLock,
  IconKey,
} from '@douyinfe/semi-icons';
import OIDCIcon from '../common/logo/OIDCIcon';
import WeChatIcon from '../common/logo/WeChatIcon';
import LinuxDoIcon from '../common/logo/LinuxDoIcon';
import TwoFAVerification from './TwoFAVerification';
import { useTranslation } from 'react-i18next';
import { SiDiscord } from 'react-icons/si';
import { ArrowLeft, Languages } from 'lucide-react';

const langItems = [
  { key: 'zh-CN', label: '简体中文' },
  { key: 'zh-TW', label: '繁體中文' },
  { key: 'en', label: 'English' },
  { key: 'fr', label: 'Français' },
  { key: 'ja', label: '日本語' },
  { key: 'ru', label: 'Русский' },
  { key: 'vi', label: 'Tiếng Việt' },
];

const LoginForm = () => {
  let navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const githubButtonTextKeyByState = {
    idle: '使用 GitHub 继续',
    redirecting: '正在跳转 GitHub...',
    timeout: '请求超时，请刷新页面后重新发起 GitHub 登录',
  };
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    wechat_verification_code: '',
  });
  const { username, password } = inputs;
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitted, setSubmitted] = useState(false);
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showWeChatLoginModal, setShowWeChatLoginModal] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [oidcLoading, setOidcLoading] = useState(false);
  const [linuxdoLoading, setLinuxdoLoading] = useState(false);
  const [emailLoginLoading, setEmailLoginLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [otherLoginOptionsLoading, setOtherLoginOptionsLoading] = useState(false);
  const [wechatCodeSubmitLoading, setWechatCodeSubmitLoading] = useState(false);
  const [showTwoFA, setShowTwoFA] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasUserAgreement, setHasUserAgreement] = useState(false);
  const [hasPrivacyPolicy, setHasPrivacyPolicy] = useState(false);
  const [githubButtonState, setGithubButtonState] = useState('idle');
  const [githubButtonDisabled, setGithubButtonDisabled] = useState(false);
  const githubTimeoutRef = useRef(null);
  const githubButtonText = t(githubButtonTextKeyByState[githubButtonState]);
  const [customOAuthLoading, setCustomOAuthLoading] = useState({});

  const logo = getLogo();
  const systemName = getSystemName();

  let affCode = new URLSearchParams(window.location.search).get('aff');
  if (affCode) {
    localStorage.setItem('aff', affCode);
  }

  const status = useMemo(() => {
    if (statusState?.status) return statusState.status;
    const savedStatus = localStorage.getItem('status');
    if (!savedStatus) return {};
    try {
      return JSON.parse(savedStatus) || {};
    } catch (err) {
      return {};
    }
  }, [statusState?.status]);
  const hasCustomOAuthProviders =
    (status.custom_oauth_providers || []).length > 0;
  const hasOAuthLoginOptions = Boolean(
    status.github_oauth ||
      status.discord_oauth ||
      status.oidc_enabled ||
      status.wechat_login ||
      status.linuxdo_oauth ||
      status.telegram_oauth ||
      hasCustomOAuthProviders,
  );

  useEffect(() => {
    if (status?.turnstile_check) {
      setTurnstileEnabled(true);
      setTurnstileSiteKey(status.turnstile_site_key);
    }

    // 从 status 获取用户协议和隐私政策的启用状态
    setHasUserAgreement(status?.user_agreement_enabled || false);
    setHasPrivacyPolicy(status?.privacy_policy_enabled || false);
  }, [status]);

  useEffect(() => {
    isPasskeySupported()
      .then(setPasskeySupported)
      .catch(() => setPasskeySupported(false));

    return () => {
      if (githubTimeoutRef.current) {
        clearTimeout(githubTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('expired')) {
      showError(t('未登录或登录已过期，请重新登录'));
    }
  }, []);

  const onWeChatLoginClicked = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    setWechatLoading(true);
    setShowWeChatLoginModal(true);
    setWechatLoading(false);
  };

  const onSubmitWeChatVerificationCode = async () => {
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }
    setWechatCodeSubmitLoading(true);
    try {
      const res = await API.get(
        `/api/oauth/wechat?code=${inputs.wechat_verification_code}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        setUserData(data);
        updateAPI();
        navigate('/');
        showSuccess('登录成功！');
        setShowWeChatLoginModal(false);
      } else {
        showError(message);
      }
    } catch (error) {
      showError('登录失败，请重试');
    } finally {
      setWechatCodeSubmitLoading(false);
    }
  };

  function handleChange(name, value) {
    setInputs((inputs) => ({ ...inputs, [name]: value }));
  }

  async function handleSubmit(e) {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }
    setSubmitted(true);
    setLoginLoading(true);
    try {
      if (username && password) {
        const res = await API.post(
          `/api/user/login?turnstile=${turnstileToken}`,
          {
            username,
            password,
          },
        );
        const { success, message, data } = res.data;
        if (success) {
          // 检查是否需要2FA验证
          if (data && data.require_2fa) {
            setShowTwoFA(true);
            setLoginLoading(false);
            return;
          }

          userDispatch({ type: 'login', payload: data });
          setUserData(data);
          updateAPI();
          showSuccess('登录成功！');
          if (username === 'root' && password === '123456') {
            Modal.error({
              title: '您正在使用默认密码！',
              content: '请立刻修改默认密码！',
              centered: true,
            });
          }
          navigate('/console');
        } else {
          showError(message);
        }
      } else {
        showError('请输入用户名和密码！');
      }
    } catch (error) {
      showError('登录失败，请重试');
    } finally {
      setLoginLoading(false);
    }
  }

  // 添加Telegram登录处理函数
  const onTelegramLoginClicked = async (response) => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    const fields = [
      'id',
      'first_name',
      'last_name',
      'username',
      'photo_url',
      'auth_date',
      'hash',
      'lang',
    ];
    const params = {};
    fields.forEach((field) => {
      if (response[field]) {
        params[field] = response[field];
      }
    });
    try {
      const res = await API.get(`/api/oauth/telegram/login`, { params });
      const { success, message, data } = res.data;
      if (success) {
        userDispatch({ type: 'login', payload: data });
        localStorage.setItem('user', JSON.stringify(data));
        showSuccess('登录成功！');
        setUserData(data);
        updateAPI();
        navigate('/');
      } else {
        showError(message);
      }
    } catch (error) {
      showError('登录失败，请重试');
    }
  };

  // 包装的GitHub登录点击处理
  const handleGitHubClick = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    if (githubButtonDisabled) {
      return;
    }
    setGithubLoading(true);
    setGithubButtonDisabled(true);
    setGithubButtonState('redirecting');
    if (githubTimeoutRef.current) {
      clearTimeout(githubTimeoutRef.current);
    }
    githubTimeoutRef.current = setTimeout(() => {
      setGithubLoading(false);
      setGithubButtonState('timeout');
      setGithubButtonDisabled(true);
    }, 20000);
    try {
      onGitHubOAuthClicked(status.github_client_id, { shouldLogout: true });
    } finally {
      // 由于重定向，这里不会执行到，但为了完整性添加
      setTimeout(() => setGithubLoading(false), 3000);
    }
  };

  // 包装的Discord登录点击处理
  const handleDiscordClick = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    setDiscordLoading(true);
    try {
      onDiscordOAuthClicked(status.discord_client_id, { shouldLogout: true });
    } finally {
      // 由于重定向，这里不会执行到，但为了完整性添加
      setTimeout(() => setDiscordLoading(false), 3000);
    }
  };

  // 包装的OIDC登录点击处理
  const handleOIDCClick = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    setOidcLoading(true);
    try {
      onOIDCClicked(
        status.oidc_authorization_endpoint,
        status.oidc_client_id,
        false,
        { shouldLogout: true },
      );
    } finally {
      // 由于重定向，这里不会执行到，但为了完整性添加
      setTimeout(() => setOidcLoading(false), 3000);
    }
  };

  // 包装的LinuxDO登录点击处理
  const handleLinuxDOClick = () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    setLinuxdoLoading(true);
    try {
      onLinuxDOOAuthClicked(status.linuxdo_client_id, { shouldLogout: true });
    } finally {
      // 由于重定向，这里不会执行到，但为了完整性添加
      setTimeout(() => setLinuxdoLoading(false), 3000);
    }
  };

  // 包装的自定义OAuth登录点击处理
  const handleCustomOAuthClick = (provider) => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    setCustomOAuthLoading((prev) => ({ ...prev, [provider.slug]: true }));
    try {
      onCustomOAuthClicked(provider, { shouldLogout: true });
    } finally {
      // 由于重定向，这里不会执行到，但为了完整性添加
      setTimeout(() => {
        setCustomOAuthLoading((prev) => ({ ...prev, [provider.slug]: false }));
      }, 3000);
    }
  };

  // 包装的邮箱登录选项点击处理
  const handleEmailLoginClick = () => {
    setEmailLoginLoading(true);
    // setShowEmailLogin(true);
    setEmailLoginLoading(false);
  };

  const handlePasskeyLogin = async () => {
    if ((hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms) {
      showInfo(t('请先阅读并同意用户协议和隐私政策'));
      return;
    }
    if (!passkeySupported) {
      showInfo('当前环境无法使用 Passkey 登录');
      return;
    }
    if (!window.PublicKeyCredential) {
      showInfo('当前浏览器不支持 Passkey');
      return;
    }

    setPasskeyLoading(true);
    try {
      const beginRes = await API.post('/api/user/passkey/login/begin');
      const { success, message, data } = beginRes.data;
      if (!success) {
        showError(message || '无法发起 Passkey 登录');
        return;
      }

      const publicKeyOptions = prepareCredentialRequestOptions(
        data?.options || data?.publicKey || data,
      );
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyOptions,
      });
      const payload = buildAssertionResult(assertion);
      if (!payload) {
        showError('Passkey 验证失败，请重试');
        return;
      }

      const finishRes = await API.post(
        '/api/user/passkey/login/finish',
        payload,
      );
      const finish = finishRes.data;
      if (finish.success) {
        userDispatch({ type: 'login', payload: finish.data });
        setUserData(finish.data);
        updateAPI();
        showSuccess('登录成功！');
        navigate('/console');
      } else {
        showError(finish.message || 'Passkey 登录失败，请重试');
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        showInfo('已取消 Passkey 登录');
      } else {
        showError('Passkey 登录失败，请重试');
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  // 包装的重置密码点击处理
  const handleResetPasswordClick = () => {
    setResetPasswordLoading(true);
    navigate('/reset');
    setResetPasswordLoading(false);
  };

  // 包装的其他登录选项点击处理
  const handleOtherLoginOptionsClick = () => {
    setOtherLoginOptionsLoading(true);
    // setShowEmailLogin(false);
    setOtherLoginOptionsLoading(false);
  };

  // 2FA验证成功处理
  const handle2FASuccess = (data) => {
    userDispatch({ type: 'login', payload: data });
    setUserData(data);
    updateAPI();
    showSuccess('登录成功！');
    navigate('/console');
  };

  // 返回登录页面
  const handleBackToLogin = () => {
    setShowTwoFA(false);
    setInputs({ username: '', password: '', wechat_verification_code: '' });
  };

  const renderTermsCheckbox = () => {
    if (!hasUserAgreement && !hasPrivacyPolicy) return null;
    return (
      <div className='mt-5'>
        <Checkbox
          checked={agreedToTerms}
          onChange={(e) => setAgreedToTerms(e.target.checked)}
        >
          <Text size='small' style={{ color: 'var(--login-muted)' }}>
            {t('我已阅读并同意')}
            {hasUserAgreement && (
              <a href='/user-agreement' target='_blank' rel='noopener noreferrer' className='login-link mx-1'>
                {t('用户协议')}
              </a>
            )}
            {hasUserAgreement && hasPrivacyPolicy && t('和')}
            {hasPrivacyPolicy && (
              <a href='/privacy-policy' target='_blank' rel='noopener noreferrer' className='login-link mx-1'>
                {t('隐私政策')}
              </a>
            )}
          </Text>
        </Checkbox>
      </div>
    );
  };

  const renderRegisterLink = () => {
    if (status.self_use_mode_enabled) return null;
    return (
      <div className='mt-6 text-center text-sm'>
        <Text style={{ color: 'var(--login-muted)' }}>
          {t('还没有账号？')}{' '}
          <Link to='/register' className='login-link font-medium'>
            {t('立即注册')}
          </Link>
        </Text>
      </div>
    );
  };

  const [showEmailForm, setShowEmailForm] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);
  const handleGoogleClick = () => {
    setGoogleLoading(true);
    const googleProvider = status?.custom_oauth_providers?.find(p => p.slug === 'google');
    if (googleProvider) {
      handleCustomOAuthClick(googleProvider);
    } else if (status?.oidc_enabled) {
      handleOIDCClick();
    } else {
      showError(t('Google 登录未配置'));
      setGoogleLoading(false);
    }
  };

  const renderEmailLoginForm = () => {
    return (
      <>
        <Form className='space-y-3'>
          <Form.Input
            field='username'
            label={t('用户名或邮箱')}
            placeholder={t('请输入您的用户名或邮箱地址')}
            name='username'
            value={inputs.username}
            onChange={(value) => handleChange('username', value)}
            prefix={<IconMail />}
          />
          <div className='flex items-end w-full' style={{ gap: '4px' }}>
            <div className='flex-1 min-w-0'>
              <Form.Input
                field='password'
                label={t('密码')}
                placeholder={t('请输入您的密码')}
                name='password'
                mode='password'
                value={inputs.password}
                onChange={(value) => handleChange('password', value)}
                prefix={<IconLock />}
                className='w-full'
              />
            </div>
            <div className='shrink-0 ml-3 mb-3'>
              <Link to='/reset' className='login-link text-xs whitespace-nowrap'>
                {t('忘记密码？')}
              </Link>
            </div>
          </div>

          <div className='pt-3'>
            <Button
              theme='solid'
              type='primary'
              htmlType='submit'
              className='w-full h-11 !rounded-lg transition-colors'
              style={{ background: 'oklch(0.55 0.20 264)' }}
              onClick={handleSubmit}
              loading={loginLoading}
              disabled={(hasUserAgreement || hasPrivacyPolicy) && !agreedToTerms}
            >
              {t('登录')}
            </Button>
          </div>
        </Form>
      </>
    );
  };

  const renderOAuthButtons = () => {
    return (
      <div className='space-y-3'>
        <Button theme='outline' className='login-oauth-btn relative' type='tertiary'
          onClick={handleGoogleClick} loading={googleLoading}>
          <div className="absolute left-4 flex items-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
          <span className='font-medium text-[15px]'>{t('使用 Google 继续')}</span>
        </Button>

        <Button theme='outline' className='login-oauth-btn relative' type='tertiary'
          onClick={handleGitHubClick} loading={githubLoading} disabled={githubButtonDisabled}>
          <div className="absolute left-4 flex items-center">
            <IconGithubLogo size='large' />
          </div>
          <span className='font-medium text-[15px]'>{githubButtonText}</span>
        </Button>

        {status.wechat_login && (
          <Button theme='outline' className='login-oauth-btn relative' type='tertiary'
            onClick={onWeChatLoginClicked} loading={wechatLoading}>
            <div className="absolute left-4 flex items-center">
              <Icon svg={<WeChatIcon />} style={{ color: '#07C160' }} />
            </div>
            <span className='font-medium text-[15px]'>{t('使用 微信 继续')}</span>
          </Button>
        )}

        {status.discord_oauth && (
          <Button theme='outline' className='login-oauth-btn relative' type='tertiary'
            onClick={handleDiscordClick} loading={discordLoading}>
            <div className="absolute left-4 flex items-center">
              <SiDiscord style={{ color: '#5865F2', width: '18px', height: '18px' }} />
            </div>
            <span className='font-medium text-[15px]'>{t('使用 Discord 继续')}</span>
          </Button>
        )}

        {status.oidc_enabled && (
          <Button theme='outline' className='login-oauth-btn relative' type='tertiary'
            onClick={handleOIDCClick} loading={oidcLoading}>
            <div className="absolute left-4 flex items-center">
              <OIDCIcon style={{ color: '#1877F2' }} />
            </div>
            <span className='font-medium text-[15px]'>{t('使用 OIDC 继续')}</span>
          </Button>
        )}

        {status.linuxdo_oauth && (
          <Button theme='outline' className='login-oauth-btn relative' type='tertiary'
            onClick={handleLinuxDOClick} loading={linuxdoLoading}>
            <div className="absolute left-4 flex items-center">
              <LinuxDoIcon style={{ color: '#E95420', width: '18px', height: '18px' }} />
            </div>
            <span className='font-medium text-[15px]'>{t('使用 LinuxDO 继续')}</span>
          </Button>
        )}

        {status.custom_oauth_providers &&
          status.custom_oauth_providers.map((provider) => (
            provider.slug !== 'google' && (
              <Button key={provider.slug} theme='outline' className='login-oauth-btn relative' type='tertiary'
                onClick={() => handleCustomOAuthClick(provider)}
                loading={customOAuthLoading[provider.slug]}>
                <div className="absolute left-4 flex items-center">
                  {getOAuthProviderIcon(provider.icon || '', 18)}
                </div>
                <span className='font-medium text-[15px]'>{t('使用 {{name}} 继续', { name: provider.name })}</span>
              </Button>
            )
          ))}

        {status.telegram_oauth && (
          <div className='flex justify-center my-2'>
            <TelegramLoginButton dataOnauth={onTelegramLoginClicked} botName={status.telegram_bot_name} />
          </div>
        )}

        {status.passkey_login && passkeySupported && (
          <Button theme='outline' className='login-oauth-btn relative' type='tertiary'
            onClick={handlePasskeyLogin} loading={passkeyLoading}>
            <div className="absolute left-4 flex items-center">
              <IconKey size='large' />
            </div>
            <span className='font-medium text-[15px]'>{t('使用 Passkey 登录')}</span>
          </Button>
        )}
      </div>
    );
  };

  const renderInvitationCode = () => {
    return (
      <div className='space-y-2'>
        <div
          className='rounded-xl border px-4 py-3'
          style={{ borderColor: 'var(--login-border)' }}
        >
          <div className='text-sm font-medium' style={{ color: 'var(--login-fg)' }}>
            {t('邀请码')}
          </div>
          <input
            type='text'
            placeholder={t('输入邀请码（可选）')}
            className='w-full mt-1 text-sm bg-transparent outline-none'
            style={{ color: 'var(--login-fg)' }}
            value={localStorage.getItem('aff') || ''}
            onChange={(e) => {
              localStorage.setItem('aff', e.target.value);
            }}
          />
        </div>
      </div>
    );
  };


  // 微信登录模态框
  const renderWeChatLoginModal = () => {
    return (
      <Modal
        title={t('微信扫码登录')}
        visible={showWeChatLoginModal}
        maskClosable={true}
        onOk={onSubmitWeChatVerificationCode}
        onCancel={() => setShowWeChatLoginModal(false)}
        okText={t('登录')}
        centered={true}
        okButtonProps={{
          loading: wechatCodeSubmitLoading,
        }}
      >
        <div className='flex flex-col items-center'>
          <img src={status.wechat_qrcode} alt='微信二维码' className='mb-4' />
        </div>

        <div className='text-center mb-4'>
          <p>
            {t('微信扫码关注公众号，输入「验证码」获取验证码（三分钟内有效）')}
          </p>
        </div>

        <Form>
          <Form.Input
            field='wechat_verification_code'
            placeholder={t('验证码')}
            label={t('验证码')}
            value={inputs.wechat_verification_code}
            onChange={(value) =>
              handleChange('wechat_verification_code', value)
            }
          />
        </Form>
      </Modal>
    );
  };

  // 2FA验证弹窗
  const render2FAModal = () => {
    return (
      <Modal
        title={
          <div className='flex items-center'>
            <div className='w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3'>
              <svg
                className='w-4 h-4 text-green-600 dark:text-green-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M6 8a2 2 0 11-4 0 2 2 0 014 0zM8 7a1 1 0 100 2h8a1 1 0 100-2H8zM6 14a2 2 0 11-4 0 2 2 0 014 0zM8 13a1 1 0 100 2h8a1 1 0 100-2H8z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            两步验证
          </div>
        }
        visible={showTwoFA}
        onCancel={handleBackToLogin}
        footer={null}
        width={450}
        centered
      >
        <TwoFAVerification
          onSuccess={handle2FASuccess}
          onBack={handleBackToLogin}
          isModal={true}
        />
      </Modal>
    );
  };

  return (
    <div className='min-h-screen grid lg:grid-cols-2'>
      {/* 左侧品牌区 — 紫色渐变 */}
      <div className='hidden lg:flex flex-col relative overflow-hidden'>
        <div className='absolute inset-0' style={{ background: 'linear-gradient(to bottom right, oklch(0.65 0.22 264), oklch(0.45 0.22 280))' }} />
        <div className='absolute inset-0' style={{ backgroundImage: 'linear-gradient(to right, #ffffff08 1px, transparent 1px), linear-gradient(to bottom, #ffffff08 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-white/10 blur-3xl pointer-events-none' />

        <div className='relative flex flex-col h-full p-12'>
          <Link to='/' className='flex items-center gap-2.5 no-underline'>
            <span className='inline-flex items-center justify-center select-none shrink-0 w-8 h-8 rounded-lg bg-white/20 text-white'>
              <svg viewBox='0 0 24 24' fill='none' className='w-5 h-5'>
                <path d='M2 20L7.5 4L12 17L16.5 4L22 20' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
                <path d='M4.5 14H10.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                <path d='M13.5 14H19.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
              </svg>
            </span>
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

      {/* 右侧表单区 */}
      <div className='flex flex-col items-center justify-center p-6 lg:p-12 min-h-screen relative' style={{ background: 'var(--login-form-bg)' }}>
        <Link
          to='/'
          className='absolute top-6 left-6 lg:top-8 lg:left-8 inline-flex items-center gap-2 text-sm no-underline'
          style={{ color: 'var(--login-muted)' }}
        >
          <ArrowLeft size={16} />
          <span>{t('返回首页')}</span>
        </Link>

        {/* 语言切换 */}
        <div className='absolute top-6 right-6 lg:top-8 lg:right-8'>
          <Dropdown
            position='bottomRight'
            render={
              <Dropdown.Menu>
                {langItems.map((item) => (
                  <Dropdown.Item
                    key={item.key}
                    onClick={() => i18n.changeLanguage(item.key)}
                    className={i18n.language === item.key ? '!bg-semi-color-primary-light-default !font-semibold' : ''}
                  >
                    {item.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            }
          >
            <button
              type='button'
              className='login-lang-btn'
            >
              <Languages size={16} />
              <span>{langItems.find((l) => l.key === i18n.language)?.label || 'Language'}</span>
            </button>
          </Dropdown>
        </div>

        <div className='w-full max-w-md flex flex-col justify-center'>
          {/* 移动端 logo */}
          <div className='flex items-center gap-2.5 mb-8 lg:hidden'>
            <Link to='/' className='flex items-center gap-2.5 no-underline'>
              <span className='inline-flex items-center justify-center select-none shrink-0 w-8 h-8 rounded-lg text-white' style={{ background: 'oklch(0.55 0.20 264)' }}>
                <svg viewBox='0 0 24 24' fill='none' className='w-5 h-5'>
                  <path d='M2 20L7.5 4L12 17L16.5 4L22 20' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' />
                  <path d='M4.5 14H10.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                  <path d='M13.5 14H19.5' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
                </svg>
              </span>
              <span className='font-bold text-lg tracking-tight' style={{ color: 'var(--login-fg)' }}>{systemName}</span>
            </Link>
          </div>

          <div className='space-y-6'>
            <div>
              <Title heading={3} style={{ color: 'var(--login-fg)', letterSpacing: '-0.02em' }}>
                {t('欢迎回来')}
              </Title>
              <Text style={{ color: 'var(--login-muted)', marginTop: '8px', display: 'block' }}>
                {t('登录您的 {{name}} 账号', { name: systemName })}
              </Text>
            </div>

            {renderEmailLoginForm()}

            {renderTermsCheckbox()}

            <Divider margin='8px' align='center'>{t('或')}</Divider>

            {renderOAuthButtons()}

            {renderRegisterLink()}

            {turnstileEnabled && (
              <div className='flex justify-center mt-6'>
                <Turnstile sitekey={turnstileSiteKey} onVerify={(token) => setTurnstileToken(token)} />
              </div>
            )}
          </div>
        </div>
      </div>

      {renderWeChatLoginModal()}
      {render2FAModal()}
    </div>
  );
};

export default LoginForm;
