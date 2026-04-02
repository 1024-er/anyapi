import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  onDiscordOAuthClicked,
  onCustomOAuthClicked,
} from '../../helpers';
import Turnstile from 'react-turnstile';
import {
  Button,
  Card,
  Checkbox,
  Divider,
  Form,
  Icon,
  Modal,
} from '@douyinfe/semi-ui';
import Title from '@douyinfe/semi-ui/lib/es/typography/title';
import Text from '@douyinfe/semi-ui/lib/es/typography/text';
import {
  IconGithubLogo,
  IconMail,
  IconUser,
  IconLock,
  IconKey,
} from '@douyinfe/semi-icons';
import {
  onGitHubOAuthClicked,
  onLinuxDOOAuthClicked,
  onOIDCClicked,
} from '../../helpers';
import OIDCIcon from '../common/logo/OIDCIcon';
import LinuxDoIcon from '../common/logo/LinuxDoIcon';
import WeChatIcon from '../common/logo/WeChatIcon';
import TelegramLoginButton from 'react-telegram-login/src';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import { useTranslation } from 'react-i18next';
import { SiDiscord } from 'react-icons/si';
import { Loader2 } from 'lucide-react';
import AuthBrandPanel from './AuthBrandPanel';

const RegisterForm = () => {
  let navigate = useNavigate();
  const { t } = useTranslation();
  const githubButtonTextKeyByState = {
    idle: '使用 GitHub 继续',
    redirecting: '正在跳转 GitHub...',
    timeout: '请求超时，请刷新页面后重新发起 GitHub 登录',
  };
  const [inputs, setInputs] = useState({
    username: '',
    password: '',
    password2: '',
    email: '',
    verification_code: '',
    wechat_verification_code: '',
    invite_code: '',
  });
  const { username, password, password2 } = inputs;
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [showWeChatLoginModal, setShowWeChatLoginModal] = useState(false);
  const [showEmailRegister, setShowEmailRegister] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [oidcLoading, setOidcLoading] = useState(false);
  const [linuxdoLoading, setLinuxdoLoading] = useState(false);
  const [emailRegisterLoading, setEmailRegisterLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [verificationCodeLoading, setVerificationCodeLoading] = useState(false);
  const [otherRegisterOptionsLoading, setOtherRegisterOptionsLoading] =
    useState(false);
  const [wechatCodeSubmitLoading, setWechatCodeSubmitLoading] = useState(false);
  const [customOAuthLoading, setCustomOAuthLoading] = useState({});
  const [disableButton, setDisableButton] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [hasUserAgreement, setHasUserAgreement] = useState(false);
  const [hasPrivacyPolicy, setHasPrivacyPolicy] = useState(false);
  const [githubButtonState, setGithubButtonState] = useState('idle');
  const [githubButtonDisabled, setGithubButtonDisabled] = useState(false);
  const githubTimeoutRef = useRef(null);
  const githubButtonText = t(githubButtonTextKeyByState[githubButtonState]);

  const logo = getLogo();
  const systemName = getSystemName();

  const affCode = new URLSearchParams(window.location.search).get('aff') || '';

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
  const requireInviteCode = status?.register_require_invite_code || false;
  const registerEnabled = status?.register_enabled !== false;
  const emailOnlyRegister = status?.email_only_register || false;
  const passwordRegisterEnabled = status?.password_register_enabled !== false;
  const canUseEmailRegister =
    registerEnabled && (emailOnlyRegister || passwordRegisterEnabled);
  const hasCustomOAuthProviders =
    (status.custom_oauth_providers || []).length > 0;
  const hasOAuthRegisterOptions = Boolean(
    status.github_oauth ||
      status.discord_oauth ||
      status.oidc_enabled ||
      status.wechat_login ||
      status.linuxdo_oauth ||
      status.telegram_oauth ||
      hasCustomOAuthProviders,
  );
  const shouldShowEmailRegisterForm =
    canUseEmailRegister &&
    (emailOnlyRegister || showEmailRegister || !hasOAuthRegisterOptions);

  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationCodeSent, setVerificationCodeSent] = useState(false);

  useEffect(() => {
    setShowEmailVerification(!!status?.email_verification);
    if (status?.turnstile_check) {
      setTurnstileEnabled(true);
      setTurnstileSiteKey(status.turnstile_site_key);
    }

    // 从 status 获取用户协议和隐私政策的启用状态
    setHasUserAgreement(status?.user_agreement_enabled || false);
    setHasPrivacyPolicy(status?.privacy_policy_enabled || false);
  }, [status]);

  useEffect(() => {
    if (!affCode) {
      return;
    }
    localStorage.setItem('aff', affCode);
    setInputs((prev) => ({ ...prev, invite_code: affCode }));
  }, [affCode]);

  useEffect(() => {
    let countdownInterval = null;
    if (disableButton && countdown > 0) {
      countdownInterval = setInterval(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      setDisableButton(false);
      setCountdown(30);
    }
    return () => clearInterval(countdownInterval); // Clean up on unmount
  }, [disableButton, countdown]);

  useEffect(() => {
    return () => {
      if (githubTimeoutRef.current) {
        clearTimeout(githubTimeoutRef.current);
      }
    };
  }, []);

  const onWeChatLoginClicked = () => {
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
      const inviteCode = (localStorage.getItem('aff') || affCode || '').trim();
      const params = new URLSearchParams({
        code: inputs.wechat_verification_code,
      });
      if (inviteCode) {
        params.set('aff', inviteCode);
      }
      const res = await API.get(`/api/oauth/wechat?${params.toString()}`);
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

  async function handleSubmit() {
    const email = inputs.email.trim();
    const verificationCode = inputs.verification_code.trim();
    const inviteCode = (
      inputs.invite_code ||
      localStorage.getItem('aff') ||
      affCode ||
      ''
    ).trim();

    if (emailOnlyRegister) {
      if (!email) {
        showInfo(t('请输入邮箱地址'));
        return;
      }
      if (!verificationCodeSent) {
        showInfo(t('请先获取验证码'));
        return;
      }
      if (!verificationCode) {
        showInfo(t('请输入验证码'));
        return;
      }
    } else {
      if (password.length < 8) {
        showInfo('密码长度不得小于 8 位！');
        return;
      }
      if (password !== password2) {
        showInfo('两次输入的密码不一致');
        return;
      }
      if (!username || !password) {
        return;
      }
      if (showEmailVerification) {
        if (!email) {
          showInfo(t('请输入邮箱地址'));
          return;
        }
        if (!verificationCode) {
          showInfo(t('请输入验证码'));
          return;
        }
      }
    }
    if (requireInviteCode && !inviteCode) {
      showInfo(t('请输入邀请码'));
      return;
    }
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }

    const payload = {
      aff_code: inviteCode,
    };
    if (emailOnlyRegister) {
      payload.email = email;
      payload.verification_code = verificationCode;
    } else {
      payload.username = username;
      payload.password = password;
      if (showEmailVerification) {
        payload.email = email;
        payload.verification_code = verificationCode;
      }
    }

    setRegisterLoading(true);
    try {
      const res = await API.post(
        `/api/user/register?turnstile=${turnstileToken}`,
        payload,
      );
      const { success, message, data } = res.data;
      if (success) {
        if (data) {
          userDispatch({ type: 'login', payload: data });
          setUserData(data);
          updateAPI();
        }
        localStorage.removeItem('aff');
        if (emailOnlyRegister) {
          sessionStorage.setItem('force_set_login_password', '1');
        } else {
          sessionStorage.removeItem('force_set_login_password');
        }
        showSuccess(t('注册成功！'));
        navigate('/console');
      } else {
        showError(message);
      }
    } catch (error) {
      showError(t('注册失败，请重试'));
    } finally {
      setRegisterLoading(false);
    }
  }

  const sendVerificationCode = async () => {
    const email = inputs.email.trim();
    const inviteCode = (
      inputs.invite_code ||
      localStorage.getItem('aff') ||
      affCode ||
      ''
    ).trim();
    if (!email) {
      showInfo(t('请输入邮箱地址'));
      return;
    }
    if (requireInviteCode && !inviteCode) {
      showInfo(t('请输入邀请码'));
      return;
    }
    if (turnstileEnabled && turnstileToken === '') {
      showInfo('请稍后几秒重试，Turnstile 正在检查用户环境！');
      return;
    }
    setVerificationCodeLoading(true);
    try {
      const res = await API.get(
        `/api/verification?email=${encodeURIComponent(email)}&turnstile=${turnstileToken}`,
      );
      const { success, message } = res.data;
      if (success) {
        setVerificationCodeSent(true);
        showSuccess('验证码发送成功，请检查你的邮箱！');
        setDisableButton(true);
      } else {
        showError(message);
      }
    } catch (error) {
      showError('发送验证码失败，请重试');
    } finally {
      setVerificationCodeLoading(false);
    }
  };

  const handleGitHubClick = () => {
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
      setTimeout(() => setGithubLoading(false), 3000);
    }
  };

  const handleDiscordClick = () => {
    setDiscordLoading(true);
    try {
      onDiscordOAuthClicked(status.discord_client_id, { shouldLogout: true });
    } finally {
      setTimeout(() => setDiscordLoading(false), 3000);
    }
  };

  const handleOIDCClick = () => {
    setOidcLoading(true);
    try {
      onOIDCClicked(
        status.oidc_authorization_endpoint,
        status.oidc_client_id,
        false,
        { shouldLogout: true },
      );
    } finally {
      setTimeout(() => setOidcLoading(false), 3000);
    }
  };

  const handleLinuxDOClick = () => {
    setLinuxdoLoading(true);
    try {
      onLinuxDOOAuthClicked(status.linuxdo_client_id, { shouldLogout: true });
    } finally {
      setTimeout(() => setLinuxdoLoading(false), 3000);
    }
  };

  const handleCustomOAuthClick = (provider) => {
    setCustomOAuthLoading((prev) => ({ ...prev, [provider.slug]: true }));
    try {
      onCustomOAuthClicked(provider, { shouldLogout: true });
    } finally {
      setTimeout(() => {
        setCustomOAuthLoading((prev) => ({ ...prev, [provider.slug]: false }));
      }, 3000);
    }
  };

  const handleEmailRegisterClick = () => {
    setEmailRegisterLoading(true);
    setShowEmailRegister(true);
    setEmailRegisterLoading(false);
  };

  const handleOtherRegisterOptionsClick = () => {
    setOtherRegisterOptionsLoading(true);
    setShowEmailRegister(false);
    setOtherRegisterOptionsLoading(false);
  };

  const onTelegramLoginClicked = async (response) => {
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

  const renderOAuthOptions = () => {
    return (
      <div className='flex flex-col items-center'>
        <div className='w-full max-w-md'>
          <div className='flex items-center justify-center mb-6 gap-2'>
            <img src={logo} alt='Logo' className='h-10 rounded-full' />
            <Title heading={3} className='!text-gray-800'>
              {systemName}
            </Title>
          </div>

          <Card className='border-0 !rounded-2xl overflow-hidden'>
            <div className='flex justify-center pt-6 pb-2'>
              <Title heading={3} className='text-gray-800 dark:text-gray-200'>
                {t('注 册')}
              </Title>
            </div>
            <div className='px-2 py-8'>
              <div className='space-y-3'>
                {status.wechat_login && (
                  <Button
                    theme='outline'
                    className='w-full h-12 flex items-center justify-center !rounded-full border border-gray-200 hover:bg-gray-50 transition-colors'
                    type='tertiary'
                    icon={
                      <Icon svg={<WeChatIcon />} style={{ color: '#07C160' }} />
                    }
                    onClick={onWeChatLoginClicked}
                    loading={wechatLoading}
                  >
                    <span className='ml-3'>{t('使用 微信 继续')}</span>
                  </Button>
                )}

                {status.github_oauth && (
                  <Button
                    theme='outline'
                    className='w-full h-12 flex items-center justify-center !rounded-full border border-gray-200 hover:bg-gray-50 transition-colors'
                    type='tertiary'
                    icon={<IconGithubLogo size='large' />}
                    onClick={handleGitHubClick}
                    loading={githubLoading}
                    disabled={githubButtonDisabled}
                  >
                    <span className='ml-3'>{githubButtonText}</span>
                  </Button>
                )}

                {status.discord_oauth && (
                  <Button
                    theme='outline'
                    className='w-full h-12 flex items-center justify-center !rounded-full border border-gray-200 hover:bg-gray-50 transition-colors'
                    type='tertiary'
                    icon={
                      <SiDiscord
                        style={{
                          color: '#5865F2',
                          width: '20px',
                          height: '20px',
                        }}
                      />
                    }
                    onClick={handleDiscordClick}
                    loading={discordLoading}
                  >
                    <span className='ml-3'>{t('使用 Discord 继续')}</span>
                  </Button>
                )}

                {status.oidc_enabled && (
                  <Button
                    theme='outline'
                    className='w-full h-12 flex items-center justify-center !rounded-full border border-gray-200 hover:bg-gray-50 transition-colors'
                    type='tertiary'
                    icon={<OIDCIcon style={{ color: '#1877F2' }} />}
                    onClick={handleOIDCClick}
                    loading={oidcLoading}
                  >
                    <span className='ml-3'>{t('使用 OIDC 继续')}</span>
                  </Button>
                )}

                {status.linuxdo_oauth && (
                  <Button
                    theme='outline'
                    className='w-full h-12 flex items-center justify-center !rounded-full border border-gray-200 hover:bg-gray-50 transition-colors'
                    type='tertiary'
                    icon={
                      <LinuxDoIcon
                        style={{
                          color: '#E95420',
                          width: '20px',
                          height: '20px',
                        }}
                      />
                    }
                    onClick={handleLinuxDOClick}
                    loading={linuxdoLoading}
                  >
                    <span className='ml-3'>{t('使用 LinuxDO 继续')}</span>
                  </Button>
                )}

                {status.custom_oauth_providers &&
                  status.custom_oauth_providers.map((provider) => (
                    <Button
                      key={provider.slug}
                      theme='outline'
                      className='w-full h-12 flex items-center justify-center !rounded-full border border-gray-200 hover:bg-gray-50 transition-colors'
                      type='tertiary'
                      icon={getOAuthProviderIcon(provider.icon || '', 20)}
                      onClick={() => handleCustomOAuthClick(provider)}
                      loading={customOAuthLoading[provider.slug]}
                    >
                      <span className='ml-3'>
                        {t('使用 {{name}} 继续', { name: provider.name })}
                      </span>
                    </Button>
                  ))}

                {status.telegram_oauth && (
                  <div className='flex justify-center my-2'>
                    <TelegramLoginButton
                      dataOnauth={onTelegramLoginClicked}
                      botName={status.telegram_bot_name}
                    />
                  </div>
                )}

                {canUseEmailRegister && (
                  <>
                    <Divider margin='12px' align='center'>
                      {t('或')}
                    </Divider>

                    <Button
                      theme='solid'
                      type='primary'
                      className='w-full h-12 flex items-center justify-center bg-black text-white !rounded-full hover:bg-gray-800 transition-colors'
                      icon={<IconMail size='large' />}
                      onClick={handleEmailRegisterClick}
                      loading={emailRegisterLoading}
                    >
                      <span className='ml-3'>
                        {t(emailOnlyRegister ? '使用 邮箱 注册' : '使用 用户名 注册')}
                      </span>
                    </Button>
                  </>
                )}
              </div>

              <div className='mt-6 text-center text-sm'>
                <Text>
                  {t('已有账户？')}{' '}
                  <Link
                    to='/login'
                    className='text-blue-600 hover:text-blue-800 font-medium'
                  >
                    {t('登录')}
                  </Link>
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderEmailRegisterForm = () => {
    return (
      <div className='flex flex-col items-center'>
        <div className='w-full max-w-md'>
          <Card className='border-0 !rounded-2xl overflow-hidden'>
            <div className='flex justify-center pt-6 pb-2'>
              <Title heading={3} className='text-gray-800 dark:text-gray-200'>
                {t('注 册')}
              </Title>
            </div>
            <div className='px-2 py-8'>
              <Form className='space-y-3'>
                {passwordRegisterEnabled && !emailOnlyRegister && (
                  <>
                    <Form.Input
                      field='username'
                      label={t('用户名')}
                      placeholder={t('请输入用户名')}
                      name='username'
                      onChange={(value) => handleChange('username', value)}
                      prefix={<IconUser />}
                    />

                    <Form.Input
                      field='password'
                      label={t('密码')}
                      placeholder={t('输入密码，最短 8 位，最长 20 位')}
                      name='password'
                      mode='password'
                      onChange={(value) => handleChange('password', value)}
                      prefix={<IconLock />}
                    />

                    <Form.Input
                      field='password2'
                      label={t('确认密码')}
                      placeholder={t('确认密码')}
                      name='password2'
                      mode='password'
                      onChange={(value) => handleChange('password2', value)}
                      prefix={<IconLock />}
                    />
                  </>
                )}

                <Form.Input
                  field='email'
                  label={t('邮箱')}
                  placeholder={t('输入邮箱地址')}
                  name='email'
                  type='email'
                  onChange={(value) => {
                    handleChange('email', value);
                    if (emailOnlyRegister) {
                      setVerificationCodeSent(false);
                      handleChange('verification_code', '');
                    }
                  }}
                  prefix={<IconMail />}
                  suffix={
                    (emailOnlyRegister || showEmailVerification) ? (
                      <Button
                        onClick={sendVerificationCode}
                        icon={
                          verificationCodeLoading ? (
                            <Loader2 size={14} className='animate-spin' />
                          ) : null
                        }
                        disabled={disableButton || verificationCodeLoading}
                      >
                        {verificationCodeLoading
                          ? t('正在获取')
                          : disableButton
                            ? `${t('重新发送')} (${countdown})`
                            : t('获取验证码')}
                      </Button>
                    ) : undefined
                  }
                />

                {((emailOnlyRegister && verificationCodeSent) ||
                  (!emailOnlyRegister && showEmailVerification)) && (
                  <Form.Input
                    field='verification_code'
                    label={t('验证码')}
                    placeholder={t('输入验证码')}
                    name='verification_code'
                    onChange={(value) =>
                      handleChange('verification_code', value)
                    }
                    prefix={<IconKey />}
                  />
                )}

                {!emailOnlyRegister && (
                  <Form.Input
                    field='invite_code'
                    label={requireInviteCode ? t('邀请码') : t('邀请码（可选）')}
                    placeholder={t('输入邀请码')}
                    name='invite_code'
                    value={inputs.invite_code || ''}
                    onChange={(value) => handleChange('invite_code', value)}
                    rules={requireInviteCode ? [{ required: true, message: t('请输入邀请码') }] : []}
                  />
                )}

                {(!emailOnlyRegister || verificationCodeSent) &&
                  (hasUserAgreement || hasPrivacyPolicy) && (
                  <div className='pt-4'>
                    <Checkbox
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                    >
                      <Text size='small' className='text-gray-600'>
                        {t('我已阅读并同意')}
                        {hasUserAgreement && (
                          <>
                            <a
                              href='/user-agreement'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:text-blue-800 mx-1'
                            >
                              {t('用户协议')}
                            </a>
                          </>
                        )}
                        {hasUserAgreement && hasPrivacyPolicy && t('和')}
                        {hasPrivacyPolicy && (
                          <>
                            <a
                              href='/privacy-policy'
                              target='_blank'
                              rel='noopener noreferrer'
                              className='text-blue-600 hover:text-blue-800 mx-1'
                            >
                              {t('隐私政策')}
                            </a>
                          </>
                        )}
                      </Text>
                    </Checkbox>
                  </div>
                )}

                {(!emailOnlyRegister || verificationCodeSent) && (
                  <div className='space-y-2 pt-2'>
                    <Button
                      theme='solid'
                      className='w-full !rounded-full'
                      type='primary'
                      htmlType='submit'
                      onClick={handleSubmit}
                      loading={registerLoading}
                    >
                      {t('注册')}
                    </Button>
                  </div>
                )}
              </Form>

              {hasOAuthRegisterOptions && !emailOnlyRegister && (
                <>
                  <Divider margin='12px' align='center'>
                    {t('或')}
                  </Divider>

                  <div className='mt-4 text-center'>
                    <Button
                      theme='outline'
                      type='tertiary'
                      className='w-full !rounded-full'
                      onClick={handleOtherRegisterOptionsClick}
                      loading={otherRegisterOptionsLoading}
                    >
                      {t('其他注册选项')}
                    </Button>
                  </div>
                </>
              )}

              <div className='mt-6 text-center text-sm'>
                <Text>
                  {t('已有账户？')}{' '}
                  <Link
                    to='/login'
                    className='text-blue-600 hover:text-blue-800 font-medium'
                  >
                    {t('登录')}
                  </Link>
                </Text>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

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

  const renderRegisterUnavailable = (message) => {
    return (
      <div className='flex flex-col items-center'>
        <div className='w-full max-w-md'>
          <Card className='border-0 !rounded-2xl overflow-hidden'>
            <div className='flex justify-center pt-6 pb-2'>
              <Title heading={3} className='text-gray-800 dark:text-gray-200'>
                {t('注 册')}
              </Title>
            </div>
            <div className='px-6 py-10 text-center space-y-6'>
              <Text>{t(message)}</Text>
              <Link
                to='/login'
                className='inline-flex items-center justify-center w-full h-10 rounded-full bg-black text-white hover:bg-gray-800 transition-colors'
              >
                {t('返回登录')}
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className='min-h-screen grid lg:grid-cols-2'>
      <AuthBrandPanel />

      <div className='relative overflow-hidden bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div
          className='blur-ball blur-ball-indigo'
          style={{ top: '-80px', right: '-80px', transform: 'none' }}
        />
        <div
          className='blur-ball blur-ball-teal'
          style={{ top: '50%', left: '-120px' }}
        />
        <div className='w-full max-w-sm mt-[60px]'>
          {!registerEnabled
            ? renderRegisterUnavailable('当前未开放注册')
            : !canUseEmailRegister && !hasOAuthRegisterOptions
              ? renderRegisterUnavailable('当前未开启可用的注册方式，请联系管理员')
              : shouldShowEmailRegisterForm
                ? renderEmailRegisterForm()
                : renderOAuthOptions()}
          {renderWeChatLoginModal()}

          {turnstileEnabled && (
            <div className='flex justify-center mt-6'>
              <Turnstile
                sitekey={turnstileSiteKey}
                onVerify={(token) => {
                  setTurnstileToken(token);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
