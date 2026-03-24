import { Sun, Cloud, CloudRain, Sunset, CloudFog, Wind } from 'lucide-react';
import { motion } from 'motion/react';

const THEMES = [
  { key: 'clear_sunny', icon: Sun, label: 'Sunny' },
  { key: 'overcast', icon: Cloud, label: 'Overcast' },
  { key: 'rainy', icon: CloudRain, label: 'Rainy' },
  { key: 'sunset', icon: Sunset, label: 'Sunset' },
  { key: 'misty', icon: CloudFog, label: 'Misty' },
  { key: 'windy', icon: Wind, label: 'Windy' },
];

interface ThemeSelectorProps {
  currentBg: string;
  onSelect: (bgKey: string) => void;
}

export default function ThemeSelector({ currentBg, onSelect }: ThemeSelectorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 1.0, ease: 'easeOut' }}
      className="fixed bottom-6 right-6 z-[20] flex flex-col items-center liquid-glass"
      style={{
        borderRadius: '999px',
        padding: '6px',
        background: 'rgba(255, 255, 255, 0.15)',
        border: '0.5px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {THEMES.map((theme) => {
        const Icon = theme.icon;
        const isActive = currentBg === theme.key;
        
        return (
          <button
            key={theme.key}
            title={theme.label}
            onClick={() => onSelect(theme.key)}
            className={`relative p-2.5 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-white/30 scale-110 shadow-sm' : 'hover:bg-white/15 hover:scale-105 opacity-70 hover:opacity-100'}`}
          >
            <Icon strokeWidth={2.5} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/80'}`} />
          </button>
        );
      })}
    </motion.div>
  );
}
