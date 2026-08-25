import {
  MapPin,
  CalendarPlus,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles,
  UserPlus,
  ClipboardCheck,
  Shuffle,
  Trophy,
  LineChart,
  Rocket,
  Medal,
  FileText,
  Bot,
  ShieldCheck,
  Bell,
  Lock,
  Navigation,
  Heart,
  Star,
  Clock,
  Flame,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  MapPin,
  CalendarPlus,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles,
  UserPlus,
  ClipboardCheck,
  Shuffle,
  Trophy,
  LineChart,
  Rocket,
  Medal,
  FileText,
  Bot,
  ShieldCheck,
  Bell,
  Lock,
  Navigation,
  Heart,
  Star,
  Clock,
  Flame,
  MessageCircle,
};

export function Icon({
  name,
  className,
  size = 22,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Cmp = map[name] ?? Sparkles;
  return <Cmp className={className} size={size} />;
}
