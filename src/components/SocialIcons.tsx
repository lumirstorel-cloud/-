import React from 'react';
import { SiteSettings } from '../types';

export interface SocialItem {
  id: 'instagram' | 'tiktok' | 'snapchat' | 'twitter' | 'youtube' | 'telegram' | 'whatsapp';
  label: string;
  url?: string;
  color: string;
  hoverBg: string;
}

export function getSocialItems(settings: SiteSettings): SocialItem[] {
  const items: SocialItem[] = [];

  if (settings.instagramUrl?.trim()) {
    items.push({
      id: 'instagram',
      label: 'إنستغرام',
      url: settings.instagramUrl.trim(),
      color: '#E4405F',
      hoverBg: 'hover:bg-[#E4405F]/15 hover:text-[#E4405F]'
    });
  }

  if (settings.tiktokUrl?.trim()) {
    items.push({
      id: 'tiktok',
      label: 'تيك توك',
      url: settings.tiktokUrl.trim(),
      color: '#000000',
      hoverBg: 'hover:bg-black/15 hover:text-black dark:hover:text-white'
    });
  }

  if (settings.snapchatUrl?.trim()) {
    items.push({
      id: 'snapchat',
      label: 'سناب شات',
      url: settings.snapchatUrl.trim(),
      color: '#FFFC00',
      hoverBg: 'hover:bg-[#FFFC00]/20 hover:text-[#2C1E18]'
    });
  }

  if (settings.twitterUrl?.trim()) {
    items.push({
      id: 'twitter',
      label: 'منصة X',
      url: settings.twitterUrl.trim(),
      color: '#1DA1F2',
      hoverBg: 'hover:bg-white/15 hover:text-white'
    });
  }

  if (settings.youtubeUrl?.trim()) {
    items.push({
      id: 'youtube',
      label: 'يوتيوب',
      url: settings.youtubeUrl.trim(),
      color: '#FF0000',
      hoverBg: 'hover:bg-[#FF0000]/15 hover:text-[#FF0000]'
    });
  }

  if (settings.telegramUrl?.trim()) {
    items.push({
      id: 'telegram',
      label: 'تليجرام',
      url: settings.telegramUrl.trim(),
      color: '#229ED9',
      hoverBg: 'hover:bg-[#229ED9]/15 hover:text-[#229ED9]'
    });
  }

  return items;
}

export const InstagramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export const TikTokIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
);

export const SnapchatIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.035 1.5c-4.48 0-6.9 3.098-6.9 5.807 0 1.348.614 2.71 1.12 3.396.166.223.238.441.134.723-.134.364-.47 1.258-.604 1.543-.178.379-.623.518-1.002.583-.497.086-1.503.209-1.928.847-.323.486-.067 1.065.59 1.378.848.403 2.052.428 2.793.633.364.1.482.433.484.777.008 1.44-1.07 1.96-2.023 2.18-.543.125-.94.492-.914 1.071.026.58.468.966 1.064 1.027 1.517.155 3.328-.517 4.708-.184.664.161 1.229 1.09 2.518 1.09.973 0 1.67-.655 2.213-.984.727-.442 1.458-.291 2.218-.006 1.472.552 2.72.158 3.535-.291.564-.312.878-.711.878-1.259 0-.583-.418-.946-.94-1.071-.954-.22-2.032-.74-2.024-2.18.002-.344.12-.677.484-.777.74-.205 1.945-.23 2.793-.633.657-.313.913-.892.59-1.378-.425-.638-1.43-.761-1.927-.847-.38-.065-.824-.204-1.003-.583-.134-.285-.47-1.179-.604-1.543-.104-.282-.032-.5.134-.723.506-.686 1.12-2.048 1.12-3.396 0-2.709-2.42-5.807-6.9-5.807z" />
  </svg>
);

export const XTwitterIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export const YouTubeIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export const TelegramIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

export function renderSocialIcon(id: string, className = 'w-4 h-4') {
  switch (id) {
    case 'instagram':
      return <InstagramIcon className={className} />;
    case 'tiktok':
      return <TikTokIcon className={className} />;
    case 'snapchat':
      return <SnapchatIcon className={className} />;
    case 'twitter':
      return <XTwitterIcon className={className} />;
    case 'youtube':
      return <YouTubeIcon className={className} />;
    case 'telegram':
      return <TelegramIcon className={className} />;
    default:
      return null;
  }
}

/** Render public social media bar */
export const SocialLinksBar: React.FC<{
  settings: SiteSettings;
  className?: string;
  iconClassName?: string;
  showLabels?: boolean;
}> = ({ settings, className = '', iconClassName = 'w-4 h-4', showLabels = false }) => {
  const items = getSocialItems(settings);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {items.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`متابعة لومير على ${item.label}`}
          className={`p-2 rounded-xl bg-[#2C1E18]/40 border border-[#3B2921] hover:border-[#C8A96E]/50 text-[#FAF6F0] transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer shadow-xs ${item.hoverBg}`}
        >
          {renderSocialIcon(item.id, iconClassName)}
          {showLabels && <span className="text-xs font-medium">{item.label}</span>}
        </a>
      ))}
    </div>
  );
};
