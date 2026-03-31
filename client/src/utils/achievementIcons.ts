import {
    Award,
    BookOpen,
    CheckCircle2,
    ClipboardCheck,
    Code2,
    Flame,
    GraduationCap,
    Sparkles,
    Swords,
    Trophy,
    type LucideIcon,
} from 'lucide-react';

const achievementIconMap: Record<string, LucideIcon> = {
    'book-open': BookOpen,
    'check-circle-2': CheckCircle2,
    'code-2': Code2,
    flame: Flame,
    'clipboard-check': ClipboardCheck,
    sparkles: Sparkles,
    'graduation-cap': GraduationCap,
    swords: Swords,
    trophy: Trophy,
};

export const resolveAchievementIcon = (icon: string | null | undefined): LucideIcon => {
    if (!icon) {
        return Award;
    }
    return achievementIconMap[icon] || Award;
};
