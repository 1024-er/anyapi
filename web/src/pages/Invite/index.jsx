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

import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  API,
  copy,
  getQuotaPerUnit,
  renderQuota,
  setUserData,
  showError,
  showSuccess,
  timestamp2string,
} from '../../helpers';
import { quotaToDisplayAmount, displayAmountToQuota } from '../../helpers/quota';
import { UserContext } from '../../context/User';
import { StatusContext } from '../../context/Status';
import InvitationCard from '../../components/topup/InvitationCard';
import TransferModal from '../../components/topup/modals/TransferModal';
import { Banner, Button, Card, Empty, Space, Table, Typography } from '@douyinfe/semi-ui';
import { ArrowRight, BarChart3, Link as LinkIcon, Wallet } from 'lucide-react';

const { Text } = Typography;

const Invite = () => {
  const { t } = useTranslation();
  const [userState, userDispatch] = useContext(UserContext);
  const [statusState] = useContext(StatusContext);

  const registerEnabled = statusState?.status?.register_enabled !== false;
  const transferDisplayPrecision =
    localStorage.getItem('quota_display_type') === 'TOKENS' ? 0 : 2;

  const [affLink, setAffLink] = useState('');
  const [openTransfer, setOpenTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState(0);
  const [inviteRecords, setInviteRecords] = useState([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invitePage, setInvitePage] = useState(1);
  const [invitePageSize, setInvitePageSize] = useState(10);
  const [inviteTotal, setInviteTotal] = useState(0);

  const minTransferAmount = useMemo(
    () => quotaToDisplayAmount(getQuotaPerUnit()),
    [],
  );
  const maxTransferAmount = useMemo(
    () => quotaToDisplayAmount(userState?.user?.aff_quota || 0),
    [userState?.user?.aff_quota],
  );

  const guideCards = [
    {
      key: 'link',
      icon: LinkIcon,
      title: t('邀请链接'),
      description: t('复制专属邀请链接并分享给好友，好友注册后会自动绑定邀请关系。'),
    },
    {
      key: 'track',
      icon: BarChart3,
      title: t('奖励追踪'),
      description: t('实时查看邀请人数、累计奖励与待使用收益，方便持续追踪转化效果。'),
    },
    {
      key: 'wallet',
      icon: Wallet,
      title: t('转入钱包'),
      description: t('获得的邀请奖励支持随时划转到账户余额，直接用于后续消费。'),
    },
  ];

  const rewardTips = [
    t('邀请好友注册，好友充值后您可获得相应奖励'),
    t('通过划转功能将奖励额度转入到您的账户余额中'),
    t('邀请的好友越多，获得的奖励越多'),
  ];

  const maskEmail = (email) => {
    if (!email || !email.includes('@')) return '-';
    const [name, domain] = email.split('@');
    if (!name) return `***@${domain}`;
    if (name.length <= 2) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 2)}***@${domain}`;
  };

  const inviteColumns = useMemo(
    () => [
      {
        title: t('用户'),
        dataIndex: 'username',
        key: 'username',
        render: (_, record) => (
          <div className='min-w-0'>
            <div className='text-sm font-medium text-semi-color-text-0'>
              {record.display_name || record.username || '-'}
            </div>
            <div className='text-xs text-semi-color-text-2'>@{record.username || '-'}</div>
          </div>
        ),
      },
      {
        title: t('邮箱'),
        dataIndex: 'email',
        key: 'email',
        render: (email) => (
          <span className='text-sm text-semi-color-text-1'>{maskEmail(email)}</span>
        ),
      },
      {
        title: t('注册时间'),
        dataIndex: 'register_time',
        key: 'register_time',
        render: (registerTime) =>
          registerTime ? timestamp2string(registerTime) : '-',
      },
    ],
    [t],
  );

  const getUserData = async () => {
    const res = await API.get('/api/user/self');
    const { success, message, data } = res.data;
    if (success) {
      userDispatch({ type: 'login', payload: data });
      setUserData(data);
    } else {
      showError(message);
    }
  };

  const getAffLink = async () => {
    if (!registerEnabled) {
      setAffLink('');
      return;
    }
    const res = await API.get('/api/user/aff');
    const { success, message, data } = res.data;
    if (success) {
      setAffLink(`${window.location.origin}/register?aff=${encodeURIComponent(data)}`);
    } else {
      showError(message);
    }
  };

  const loadInviteRecords = async (page = invitePage, pageSize = invitePageSize) => {
    setInviteLoading(true);
    try {
      const res = await API.get(`/api/user/self/invites?p=${page}&page_size=${pageSize}`);
      const { success, message, data } = res.data;
      if (success) {
        setInviteRecords(data.items || []);
        setInviteTotal(data.total || 0);
      } else {
        showError(message || t('加载邀请记录失败'));
      }
    } catch (error) {
      showError(t('加载邀请记录失败'));
    } finally {
      setInviteLoading(false);
    }
  };

  const handleAffLinkClick = async () => {
    if (!affLink) return;
    await copy(affLink);
    showSuccess(t('邀请链接已复制到剪切板'));
  };

  const transfer = async () => {
    const transferQuota = displayAmountToQuota(transferAmount);
    if (transferQuota < getQuotaPerUnit()) {
      showError(t('划转金额最低为') + ' ' + renderQuota(getQuotaPerUnit()));
      return;
    }
    const res = await API.post('/api/user/aff_transfer', {
      quota: transferQuota,
    });
    const { success, message } = res.data;
    if (success) {
      showSuccess(message);
      setOpenTransfer(false);
      await getUserData();
    } else {
      showError(message);
    }
  };

  useEffect(() => {
    getUserData().then();
    setTransferAmount(minTransferAmount);
  }, [minTransferAmount]);

  useEffect(() => {
    getAffLink().then();
  }, [registerEnabled]);

  useEffect(() => {
    loadInviteRecords(invitePage, invitePageSize).then();
  }, [invitePage, invitePageSize]);

  return (
    <div className='mt-[60px] px-2'>
      <div className='grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_360px] gap-4 items-start'>
        <div className='space-y-4'>
          <InvitationCard
            t={t}
            userState={userState}
            renderQuota={renderQuota}
            setOpenTransfer={setOpenTransfer}
            affLink={affLink}
            handleAffLinkClick={handleAffLinkClick}
          />
          <p></p>
          <Card className='!rounded-2xl border-0 shadow-sm'>
            <Table
              columns={inviteColumns}
              dataSource={inviteRecords}
              rowKey='id'
              loading={inviteLoading}
              pagination={{
                currentPage: invitePage,
                pageSize: invitePageSize,
                total: inviteTotal,
                showSizeChanger: true,
                pageSizeOptions: [10, 20, 50],
                onPageChange: (page) => setInvitePage(page),
                onPageSizeChange: (pageSize) => {
                  setInvitePageSize(pageSize);
                  setInvitePage(1);
                },
              }}
              empty={
                <Empty description={t('暂无邀请记录')} style={{ padding: 24 }} />
              }
            />
          </Card>
        </div>

        <div className='space-y-4'>
          {!registerEnabled && (
            <Banner
              type='warning'
              closeIcon={null}
              title={t('当前系统已关闭注册')}
              description={t('注册关闭后暂时无法生成新的邀请链接，但仍可查看已有邀请奖励数据。')}
            />
          )}

          <Card className='!rounded-2xl border-0 shadow-sm'>
            <Space vertical spacing='medium' style={{ width: '100%' }}>
              {guideCards.map(({ key, title, description }) => (
                <div
                  key={key}
                  className='rounded-xl border border-semi-color-border bg-semi-color-fill-0 p-4'
                >
                  <div className='flex items-start gap-3'>
                    <div className='min-w-0'>
                      <div className='text-sm font-semibold text-semi-color-text-0 mb-1'>
                        {title}
                      </div>
                      <Text type='tertiary' className='!text-sm'>
                        {description}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                theme='solid'
                type='primary'
                icon={<ArrowRight size={14} />}
                onClick={handleAffLinkClick}
                disabled={!affLink}
                className='!rounded-lg'
              >
                {affLink ? t('复制邀请链接') : t('邀请链接暂不可用')}
              </Button>
            </Space>
          </Card>
          <Card className='!rounded-2xl border-0 shadow-sm' title={t('奖励说明')}>
            <div className='space-y-3'>
              {rewardTips.map((item) => (
                <div key={item} className='flex items-start gap-2'>
                  <div className='mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0' />
                  <Text type='tertiary' className='!text-sm'>
                    {item}
                  </Text>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <TransferModal
        t={t}
        openTransfer={openTransfer}
        transfer={transfer}
        handleTransferCancel={() => setOpenTransfer(false)}
        userState={userState}
        renderQuota={renderQuota}
        getQuotaPerUnit={getQuotaPerUnit}
        transferAmount={transferAmount}
        setTransferAmount={setTransferAmount}
        minTransferAmount={minTransferAmount}
        maxTransferAmount={maxTransferAmount}
        transferDisplayPrecision={transferDisplayPrecision}
      />
    </div>
  );
};

export default Invite;
