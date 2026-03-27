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

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography, Tag } from '@douyinfe/semi-ui';

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

const HeaderLogo = ({
  isMobile,
  isConsoleRoute,
  systemName,
  isSelfUseMode,
  isDemoSiteMode,
  t,
}) => {
  if (isMobile && isConsoleRoute) {
    return null;
  }

  return (
    <Link to='/' className='group flex items-center gap-2.5 shrink-0'>
      <LogoMark />
      <div className='hidden md:flex items-center gap-2'>
        <Typography.Title
          heading={4}
          className='!text-lg !font-bold !mb-0 tracking-tight'
        >
          {systemName}
        </Typography.Title>
        {(isSelfUseMode || isDemoSiteMode) && (
          <Tag
            color={isSelfUseMode ? 'purple' : 'blue'}
            className='text-xs px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm'
            size='small'
            shape='circle'
          >
            {isSelfUseMode ? t('自用模式') : t('演示站点')}
          </Tag>
        )}
      </div>
    </Link>
  );
};

export default HeaderLogo;
