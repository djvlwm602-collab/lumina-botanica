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
      className="fixed bottom-8 right-6 z-[20] flex flex-col items-center gap-3"
    >
      {THEMES.map((theme) => {
        const Icon = theme.icon;
        const isActive = currentBg === theme.key;
        
        return (
          <button
            key={theme.key}
            title={theme.label}
            onClick={() => onSelect(theme.key)}
            className={`relative p-3 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-md border border-white/30 ${isActive ? 'bg-white/30 scale-110 shadow-lg' : 'bg-white/10 hover:bg-white/20 hover:scale-105 opacity-70 hover:opacity-100'}`}
          >
            <Icon strokeWidth={2.5} className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/80'}`} />
          </button>
        );
      })}
    </motion.div>
  );
}
