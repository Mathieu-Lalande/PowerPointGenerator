import {
  BarChart3,
  TrendingUp,
  Target,
  Briefcase,
  Handshake,
  Building2,
  Lightbulb,
  Compass,
  Calendar,
  Clock,
  CheckCircle2,
  KeyRound,
  Trophy,
  DollarSign,
  Wallet,
  Landmark,
  ArrowDownToLine,
  ArrowUpFromLine,
  Coins,
  Receipt,
  LineChart,
  UserRound,
  Users,
  MessageSquare,
  Contact,
  BrainCircuit,
  Laptop,
  Monitor,
  Smartphone,
  Settings,
  Wrench,
  Plug,
  Globe,
  Cloud,
  Bot,
  Lock,
  Rocket,
  XCircle,
  AlertTriangle,
  Star,
  CircleHelp,
  Sparkles,
  Flame,
  Sprout,
  Award,
  RefreshCw,
  Recycle,
  ArrowRight,
  ArrowLeftRight,
  RotateCcw,
  ChevronRight,
  Image as ImageIcon,
  type LucideIcon,
} from "lucide-react";

export interface IconDef {
  id: string;
  label: string;
  Icon: LucideIcon;
}

export interface IconCategory {
  id: string;
  name: string;
  icons: IconDef[];
}

export const ICON_LIBRARY: IconCategory[] = [
  {
    id: "business",
    name: "Business",
    icons: [
      { id: "BarChart3", label: "Statistiques", Icon: BarChart3 },
      { id: "TrendingUp", label: "Croissance", Icon: TrendingUp },
      { id: "Target", label: "Objectif", Icon: Target },
      { id: "Briefcase", label: "Entreprise", Icon: Briefcase },
      { id: "Handshake", label: "Partenariat", Icon: Handshake },
      { id: "Building2", label: "Société", Icon: Building2 },
      { id: "Lightbulb", label: "Idée", Icon: Lightbulb },
      { id: "Compass", label: "Stratégie", Icon: Compass },
      { id: "Calendar", label: "Planning", Icon: Calendar },
      { id: "Clock", label: "Temps", Icon: Clock },
      { id: "CheckCircle2", label: "Validé", Icon: CheckCircle2 },
      { id: "KeyRound", label: "Clé", Icon: KeyRound },
      { id: "Trophy", label: "Réussite", Icon: Trophy },
    ],
  },
  {
    id: "finance",
    name: "Finance",
    icons: [
      { id: "DollarSign", label: "Montant", Icon: DollarSign },
      { id: "Wallet", label: "Budget", Icon: Wallet },
      { id: "Landmark", label: "Banque", Icon: Landmark },
      { id: "ArrowDownToLine", label: "Entrée", Icon: ArrowDownToLine },
      { id: "ArrowUpFromLine", label: "Sortie", Icon: ArrowUpFromLine },
      { id: "Coins", label: "Capital", Icon: Coins },
      { id: "Receipt", label: "Facturation", Icon: Receipt },
      { id: "LineChart", label: "Tendance", Icon: LineChart },
    ],
  },
  {
    id: "team",
    name: "Équipe",
    icons: [
      { id: "UserRound", label: "Personne", Icon: UserRound },
      { id: "Users", label: "Équipe", Icon: Users },
      { id: "MessageSquare", label: "Échange", Icon: MessageSquare },
      { id: "Contact", label: "Contact", Icon: Contact },
      { id: "BrainCircuit", label: "Expertise", Icon: BrainCircuit },
    ],
  },
  {
    id: "tech",
    name: "Tech",
    icons: [
      { id: "Laptop", label: "Ordinateur", Icon: Laptop },
      { id: "Monitor", label: "Écran", Icon: Monitor },
      { id: "Smartphone", label: "Mobile", Icon: Smartphone },
      { id: "Settings", label: "Paramètres", Icon: Settings },
      { id: "Wrench", label: "Outils", Icon: Wrench },
      { id: "Plug", label: "Intégration", Icon: Plug },
      { id: "Globe", label: "International", Icon: Globe },
      { id: "Cloud", label: "Cloud", Icon: Cloud },
      { id: "Bot", label: "IA", Icon: Bot },
      { id: "Lock", label: "Sécurité", Icon: Lock },
      { id: "Rocket", label: "Lancement", Icon: Rocket },
    ],
  },
  {
    id: "status",
    name: "Statuts",
    icons: [
      { id: "CheckCircle2Alt", label: "Terminé", Icon: CheckCircle2 },
      { id: "XCircle", label: "Bloqué", Icon: XCircle },
      { id: "AlertTriangle", label: "Attention", Icon: AlertTriangle },
      { id: "Star", label: "Important", Icon: Star },
      { id: "CircleHelp", label: "Question", Icon: CircleHelp },
      { id: "Sparkles", label: "Nouveauté", Icon: Sparkles },
      { id: "Flame", label: "Priorité", Icon: Flame },
    ],
  },
  {
    id: "growth",
    name: "Croissance",
    icons: [
      { id: "Sprout", label: "Démarrage", Icon: Sprout },
      { id: "Award", label: "Distinction", Icon: Award },
      { id: "RefreshCw", label: "Itération", Icon: RefreshCw },
      { id: "Recycle", label: "Amélioration continue", Icon: Recycle },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    icons: [
      { id: "ArrowRight", label: "Suivant", Icon: ArrowRight },
      { id: "ArrowLeftRight", label: "Échange", Icon: ArrowLeftRight },
      { id: "RotateCcw", label: "Retour", Icon: RotateCcw },
      { id: "ChevronRight", label: "Étape", Icon: ChevronRight },
    ],
  },
  {
    id: "general",
    name: "Général",
    icons: [{ id: "Image", label: "Illustration", Icon: ImageIcon }],
  },
];

export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_LIBRARY.flatMap((cat) => cat.icons.map((i) => [i.id, i.Icon]))
);

export const ALL_ICON_IDS = Object.keys(ICON_MAP);

export const DEFAULT_ILLUSTRATION_ICON = "Image";

export function getIconComponent(id?: string): LucideIcon | undefined {
  if (!id) return undefined;
  return ICON_MAP[id];
}
