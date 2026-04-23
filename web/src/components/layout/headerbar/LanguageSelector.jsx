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
import { Button, Dropdown } from '@douyinfe/semi-ui';
import { Languages } from 'lucide-react';

const LanguageSelector = ({ currentLang, onLanguageChange, t }) => {
  const langItems = [
    { key: 'zh-CN', label: '🇨🇳 简体中文' },
    { key: 'zh-TW', label: '🇹🇼 繁體中文' },
    { key: 'en', label: '🇺🇸 English' },
    { key: 'fr', label: '🇫🇷 Français' },
    { key: 'ja', label: '🇯🇵 日本語' },
    { key: 'ru', label: '🇷🇺 Русский' },
    { key: 'vi', label: '🇻🇳 Tiếng Việt' },
  ];
  const currentLangItem = langItems.find(item => item.key === currentLang) || langItems[0];

  return (
    <Dropdown
      position='bottomRight'
      render={
        <Dropdown.Menu className='!bg-semi-color-bg-overlay !border-semi-color-border !shadow-lg !rounded-lg dark:!bg-gray-700 dark:!border-gray-600'>
          {/* Language sorting: Order by English name (Chinese, English, French, Japanese, Russian) */}
          {langItems.map((item) => (
            <Dropdown.Item
              key={item.key}
              onClick={() => onLanguageChange(item.key)}
              className={`!px-3 !py-1.5 !text-sm !text-semi-color-text-0 dark:!text-gray-200 ${currentLang === item.key ? '!bg-semi-color-primary-light-default dark:!bg-blue-600 !font-semibold' : 'hover:!bg-semi-color-fill-1 dark:hover:!bg-gray-600'}`}
            >
              {item.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      }
    >
      <Button
        icon={<span className="text-lg">{currentLangItem.label.split(' ')[0]}</span>}
        aria-label={`${t('common.changeLanguage')} (${currentLangItem.label})`}
        theme='borderless'
        type='tertiary'
        className='!p-1.5 !text-current focus:!bg-semi-color-fill-1 dark:focus:!bg-gray-700 !rounded-full !bg-semi-color-fill-0 dark:!bg-semi-color-fill-1 hover:!bg-semi-color-fill-1 dark:hover:!bg-semi-color-fill-2'
      />
    </Dropdown>
  );
};

export default LanguageSelector;
