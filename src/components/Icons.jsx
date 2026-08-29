'use client';

import {
  AlertTriangle,
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  ClipboardList,
  CloudCheck,
  Crown,
  Database,
  Download,
  Eye,
  EyeOff,
  Flame,
  Gem,
  GraduationCap,
  Globe,
  Home,
  Inbox,
  Info,
  LayoutDashboard,
  ListOrdered,
  Lock,
  LogIn,
  LogOut,
  Medal,
  Menu,
  Minus,
  Moon,
  Palette,
  PartyPopper,
  Pencil,
  Plus,
  Printer,
  RotateCcw,
  Rocket,
  School,
  Search,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Star,
  Swords,
  Target,
  Sun,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  Upload,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';

/**
 * Thin wrapper over lucide-react so every icon in the app shares one stroke
 * weight and is hidden from screen readers by default. `filled` paints the
 * shape (used for stars and flames that read better solid).
 */
function icon(Component, defaults = {}) {
  const Wrapped = ({ size = 20, filled = false, strokeWidth, ...rest }) => (
    <Component
      size={size}
      strokeWidth={strokeWidth ?? defaults.strokeWidth ?? 1.9}
      fill={filled ? 'currentColor' : 'none'}
      aria-hidden="true"
      focusable="false"
      {...rest}
    />
  );
  Wrapped.displayName = `Icon(${Component.displayName || Component.name})`;
  return Wrapped;
}

export const HomeIcon = icon(Home);
export const DashboardIcon = icon(LayoutDashboard);
export const UsersIcon = icon(Users);
export const UserIcon = icon(User);
export const TrophyIcon = icon(Trophy);
export const StarIcon = icon(Star);
export const FlameIcon = icon(Flame);
export const SettingsIcon = icon(Settings);
export const PlusIcon = icon(Plus, { strokeWidth: 2.2 });
export const MinusIcon = icon(Minus, { strokeWidth: 2.2 });
export const ChevronRightIcon = icon(ChevronRight, { strokeWidth: 2.1 });
export const ChevronLeftIcon = icon(ChevronLeft, { strokeWidth: 2.1 });
export const ChevronDownIcon = icon(ChevronDown, { strokeWidth: 2.1 });
export const ArrowLeftIcon = icon(ArrowLeft);
export const SunIcon = icon(Sun);
export const MoonIcon = icon(Moon);
export const GlobeIcon = icon(Globe);
export const ShareIcon = icon(Share2);
export const TrashIcon = icon(Trash2);
export const EditIcon = icon(Pencil);
export const CheckIcon = icon(Check, { strokeWidth: 2.4 });
export const XIcon = icon(X, { strokeWidth: 2.2 });
export const SearchIcon = icon(Search);
export const DownloadIcon = icon(Download);
export const UploadIcon = icon(Upload);
export const PrinterIcon = icon(Printer);
export const CopyIcon = icon(Copy);
export const SparklesIcon = icon(Sparkles);
export const CalendarIcon = icon(Calendar);
export const MenuIcon = icon(Menu);
export const ChartIcon = icon(BarChart3);
export const MedalIcon = icon(Medal);
export const RotateIcon = icon(RotateCcw);
export const LockIcon = icon(Lock);
export const LoginIcon = icon(LogIn);
export const LogoutIcon = icon(LogOut);
export const ShieldIcon = icon(ShieldCheck);
export const EyeIcon = icon(Eye);
export const EyeOffIcon = icon(EyeOff);
export const CrownIcon = icon(Crown);
export const AwardIcon = icon(Award);
export const GradIcon = icon(GraduationCap);
export const ZapIcon = icon(Zap);
export const SproutIcon = icon(Sprout);
export const GemIcon = icon(Gem);
export const TrendUpIcon = icon(TrendingUp, { strokeWidth: 2.2 });
export const TrendDownIcon = icon(TrendingDown, { strokeWidth: 2.2 });
export const TargetIcon = icon(Target);
export const RocketIcon = icon(Rocket);
export const InboxIcon = icon(Inbox);
export const SchoolIcon = icon(School);
export const ClipboardIcon = icon(ClipboardList);
export const PartyIcon = icon(PartyPopper);
export const SwordsIcon = icon(Swords);
export const ListIcon = icon(ListOrdered);
export const PaletteIcon = icon(Palette);
export const DatabaseIcon = icon(Database);
export const AlertIcon = icon(AlertTriangle);
export const InfoIcon = icon(Info);
export const CloudIcon = icon(CloudCheck);
