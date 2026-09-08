"use client";

import React, { useState, useCallback, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { cn } from "../../lib/utils";
import {
  Code,
  Palette,
  Users,
  Zap,
  Globe,
  Heart,
  Star,
  Database,
  Shield,   
} from "lucide-react";

const THEMES = {
  primary: "from-slate-700 via-slate-800 to-slate-900",
  secondary: "from-blue-600 via-blue-700 to-blue-800",
  accent: "from-purple-600 via-purple-700 to-purple-800",
  success: "from-emerald-600 via-emerald-700 to-emerald-800",
  warning: "from-amber-600 via-amber-700 to-amber-800",
  danger: "from-red-600 via-red-700 to-red-800",
  info: "from-cyan-600 via-cyan-700 to-cyan-800",
  neutral: "from-gray-600 via-gray-700 to-gray-800",
} as const;

type ThemeType = keyof typeof THEMES;

export interface Card3DProps {
  title: string;
  description: string;
  image?: string;
  icon?: React.ReactNode;
  theme?: ThemeType;
  gradient?: string;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "auto";
  variant?: "default" | "minimal" | "premium";
  disabled?: boolean;
  loading?: boolean;
  children?: React.ReactNode;
}

export interface CardData {
  id: string;
  title: string;
  description: string;
  image?: string;
  icon?: React.ReactNode;
  theme?: ThemeType;
  gradient?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export interface Card3DListProps {
  cards: CardData[];
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: "sm" | "md" | "lg" | "xl";
  size?: "sm" | "md" | "lg" | "xl" | "auto";
  variant?: "default" | "minimal" | "premium";
  animated?: boolean;
  staggerDelay?: number;
}

const SIZES = {
  sm: "h-64",
  md: "h-80",
  lg: "h-96",
  xl: "min-h-[520px] h-full",
  auto: "h-auto min-h-[480px]",
} as const;

const VARIANTS = {
  default: "shadow-lg hover:shadow-2xl",
  minimal: "shadow-md hover:shadow-lg border border-white/10",
  premium: "shadow-xl hover:shadow-2xl ring-1 ring-white/20",
} as const;

const GRIDS = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

const GAPS = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-10",
} as const;

export const containerVariants: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
      duration: 0.5,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: -15, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 12, mass: 0.7 },
  },
};

export const Card3D = React.forwardRef<HTMLDivElement, Card3DProps>(
  (
    {
      title,
      description,
      image,
      icon,
      theme = "primary",
      gradient,
      onClick,
      className,
      size = "md",
      variant = "default",
      disabled = false,
      loading = false,
      children,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = React.useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const rectRef = React.useRef<DOMRect | null>(null);
    const rafRef = React.useRef<number | null>(null);

    // Connect forwarded ref
    React.useImperativeHandle(forwardedRef, () => internalRef.current as HTMLDivElement);

    const finalGradient = useMemo(
      () => gradient || THEMES[theme],
      [gradient, theme]
    );
    const patternId = useMemo(
      () => `pattern-${theme}-${title.replace(/\s+/g, "-").toLowerCase()}`,
      [theme, title]
    );

    const handleEnter = useCallback(() => {
      if (disabled) return;
      if (internalRef.current) {
        rectRef.current = internalRef.current.getBoundingClientRect();
      }
      setHovered(true);
    }, [disabled]);

    const handleMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (disabled || !internalRef.current) return;
        if (!rectRef.current) {
          rectRef.current = internalRef.current.getBoundingClientRect();
        }

        const rect = rectRef.current;
        if (!rect || rect.width === 0 || rect.height === 0) return;
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
          if (internalRef.current) {
            const rotX = -y * 7;
            const rotY = x * 7;
            internalRef.current.style.transform = `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translateY(-4px)`;
          }
          rafRef.current = null;
        });
      },
      [disabled]
    );

    const handleLeave = useCallback(() => {
      if (disabled) return;
      setHovered(false);
      rectRef.current = null;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (internalRef.current) {
        internalRef.current.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)`;
      }
    }, [disabled]);

    const handleClick = useCallback(() => {
      if (disabled || loading || !onClick) return;
      onClick();
    }, [disabled, loading, onClick]);

    return (
      <div
        ref={internalRef}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl transform-gpu will-change-transform",
          "transition-all duration-300 ease-out",
          SIZES[size],
          VARIANTS[variant],
          onClick && !disabled && !loading && "cursor-pointer active:scale-[0.98]",
          disabled && "opacity-50 cursor-not-allowed",
          loading && "pointer-events-none",
          className
        )}
        onMouseMove={handleMove}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onClick={handleClick}
        role={onClick ? "button" : "article"}
        tabIndex={onClick && !disabled ? 0 : -1}
        style={{
          transition: hovered
            ? "transform 0.08s ease-out, box-shadow 0.3s ease"
            : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
        }}
        {...props}
      >
        {/* Card Background */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl transition-transform duration-500 ease-out",
            hovered ? "scale-[1.02]" : "scale-100",
            image ? "" : `bg-gradient-to-br ${finalGradient}`
          )}
        >
          {image && (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )}
        </div>

        {/* Decorative Grid SVG Pattern */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl opacity-20 pointer-events-none">
          <svg
            className="absolute -top-4 -right-4 w-32 h-32 text-white/30"
            viewBox="0 0 100 100"
          >
            <defs>
              <pattern
                id={patternId}
                x="0"
                y="0"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="10"
                  cy="10"
                  r="1"
                  fill="currentColor"
                  opacity="0.3"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill={`url(#${patternId})`} />
          </svg>

          <div
            className="absolute -bottom-4 -left-4 w-24 h-24 opacity-30 transition-transform duration-700 ease-out"
            style={{
              transform: hovered ? "rotate(90deg)" : "rotate(0deg)",
            }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-white/40">
              <rect
                x="20"
                y="20"
                width="60"
                height="60"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                rx="8"
              />
              <rect
                x="35"
                y="35"
                width="30"
                height="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                rx="4"
              />
            </svg>
          </div>
        </div>

        {/* Shading overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none",
            hovered ? "opacity-50" : "opacity-70"
          )}
          style={{
            background: `linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.15) 100%)`,
          }}
        />

        {/* Subtle Shine/Gloss on Hover */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl overflow-hidden pointer-events-none transition-opacity duration-300",
            hovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            className="absolute -inset-full"
            style={{
              background: `linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)`,
            }}
          />
        </div>

        {/* Content Container */}
        <div className="relative z-20 flex h-full flex-col justify-between p-6 text-white">
          <div className="flex justify-between items-start">
            {icon && (
              <div className="relative transition-transform duration-300 ease-out group-hover:scale-105 group-hover:-translate-y-0.5">
                <div className="text-3xl opacity-90 drop-shadow-md">
                  {icon}
                </div>
              </div>
            )}

            <div className="relative flex items-center justify-center">
              <div className="h-2.5 w-2.5 rounded-full bg-white/40" />
              {!disabled && (
                <div
                  className={cn(
                    "absolute inset-0 h-2.5 w-2.5 rounded-full bg-white/70 transition-opacity duration-300",
                    hovered ? "animate-ping opacity-75" : "opacity-0"
                  )}
                />
              )}
            </div>
          </div>

          <div className="space-y-3 transition-transform duration-300 group-hover:-translate-y-1">
            <h3 className="text-xl font-semibold tracking-tight drop-shadow-md">
              {title}
            </h3>

            <p className="text-sm text-white/85 leading-relaxed drop-shadow-sm line-clamp-3">
              {description}
            </p>

            {children}

            {onClick && !disabled && (
              <div
                className={cn(
                  "flex items-center space-x-2 transition-all duration-300",
                  hovered
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-2 opacity-0"
                )}
              >
                <div className="h-0.5 w-4 bg-white/70 rounded-full" />
                <div className="text-xs font-medium opacity-90">
                  {loading ? "Loading..." : "Explore"}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top-edge ambient specular highlight */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300",
            hovered ? "opacity-100" : "opacity-60"
          )}
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.08) 100%)`,
          }}
        />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center z-30">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }
);

Card3D.displayName = "Card3D";

export const Card3DList: React.FC<Card3DListProps> = ({
  cards,
  className,
  columns = 3,
  gap = "md",
  size = "md",
  variant = "default",
  animated = true,
  staggerDelay = 0.08,
}) => {
  const gridClass = useMemo(() => GRIDS[columns], [columns]);
  const gapClass = useMemo(() => GAPS[gap], [gap]);

  const customVariants = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0, scale: 0.98 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0.2,
          duration: 0.5,
        },
      },
    }),
    [staggerDelay]
  );

  const elements = useMemo(
    () =>
      cards.map((card, index) => (
        <motion.div
          key={card.id}
          variants={animated ? itemVariants : undefined}
          custom={index}
          whileInView={animated ? "visible" : undefined}
          initial={animated ? "hidden" : undefined}
          viewport={
            animated ? { once: true, margin: "-50px", amount: 0.2 } : undefined
          }
          style={{ transformStyle: "preserve-3d" }}
        >
          <Card3D
            title={card.title}
            description={card.description}
            image={card.image}
            icon={card.icon}
            theme={card.theme}
            gradient={card.gradient}
            onClick={card.onClick}
            size={size}
            variant={variant}
            disabled={card.disabled}
            loading={card.loading}
          />
        </motion.div>
      )),
    [cards, size, variant, animated]
  );

  return (
    <div className="relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.015]">
          <svg
            width="100%"
            height="100%"
            className="text-slate-900 dark:text-white"
          >
            <defs>
              <pattern
                id="grid"
                width="32"
                height="32"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 32 0 L 0 0 0 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <motion.div
          className="absolute top-10 right-10 w-64 h-64 opacity-[0.03]"
          animate={{ rotate: [0, 360], scale: [1, 1.05, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full text-slate-600 dark:text-slate-400"
          >
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            />
            <circle
              cx="100"
              cy="100"
              r="60"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
            <circle
              cx="100"
              cy="100"
              r="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
            />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-10 left-10 w-48 h-48 opacity-[0.02]"
          animate={{ rotate: [360, 0], y: [-10, 10, -10] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            viewBox="0 0 150 150"
            className="w-full h-full text-slate-600 dark:text-slate-400"
          >
            <rect
              x="25"
              y="25"
              width="100"
              height="100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              rx="8"
            />
            <rect
              x="40"
              y="40"
              width="70"
              height="70"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              rx="4"
            />
            <rect
              x="55"
              y="55"
              width="40"
              height="40"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              rx="2"
            />
          </svg>
        </motion.div>
      </div>

      <motion.div
        className={cn("relative grid w-full", gridClass, gapClass, className)}
        variants={animated ? customVariants : undefined}
        initial={animated ? "hidden" : undefined}
        animate={animated ? "visible" : undefined}
        style={{ perspective: "1500px", transformStyle: "preserve-3d" }}
      >
        {elements}
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/20 to-transparent dark:from-black/20 pointer-events-none" />
    </div>
  );
};

export const Component = () => {
   const cards: CardData[] = [
    {
      id: "web-dev",
      title: "Web Development",
      description:
        "Master modern web technologies with React, Next.js, and TypeScript. Build scalable applications with cutting-edge tools and best practices.",
      icon: <Code />,
      theme: "primary",
    },
    {
      id: "ui-ux",
      title: "UI/UX Design",
      description:
        "Create beautiful and intuitive user experiences that delight users and drive engagement through thoughtful design principles.",
      icon: <Palette />,
      theme: "secondary",
    },
    {
      id: "data",
      title: "Data Science",
      description:
        "Analyze complex data sets and build powerful machine learning models to extract meaningful insights from big data.",
      icon: <Database />,
      theme: "info",
    },
    {
      id: "security",
      title: "Cybersecurity",
      description:
        "Protect digital assets and infrastructure with advanced security protocols and threat detection methodologies.",
      icon: <Shield />,
      theme: "danger",
    },
    {
      id: "leadership",
      title: "Team Leadership",
      description:
        "Build and manage high-performing teams that collaborate effectively and achieve exceptional results through strategic guidance.",
      icon: <Users />,
      theme: "success",
    },
    {
      id: "innovation",
      title: "Innovation",
      description:
        "Drive innovation in your organization by fostering creativity and implementing breakthrough solutions for complex challenges.",
      icon: <Zap />,
      theme: "accent",
    },
    {
      id: "impact",
      title: "Global Impact",
      description:
        "Create solutions that make a meaningful difference worldwide and contribute to positive social change at scale.",
      icon: <Globe />,
      theme: "neutral",
    },
    {
      id: "community",
      title: "Community",
      description:
        "Connect with like-minded professionals, share knowledge, and build lasting relationships in your industry network.",
      icon: <Heart />,
      theme: "warning",
    },
    {
      id: "excellence",
      title: "Excellence",
      description:
        "Strive for excellence in everything you do and continuously improve your skills, capabilities, and professional expertise.",
      icon: <Star />,
      theme: "secondary",
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <motion.div
          className="absolute top-20 left-20 w-96 h-96 opacity-[0.03]"
          animate={{ rotate: [0, 360], scale: [1, 1.1, 1] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full text-slate-600 dark:text-slate-400"
          >
            <defs>
              <radialGradient id="grad1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="200" r="150" fill="url(#grad1)" />
            <circle
              cx="200"
              cy="200"
              r="100"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.1"
            />
            <circle
              cx="200"
              cy="200"
              r="50"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.15"
            />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-20 right-20 w-80 h-80 opacity-[0.02]"
          animate={{ rotate: [360, 0], y: [-20, 20, -20] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg
            viewBox="0 0 320 320"
            className="w-full h-full text-slate-600 dark:text-slate-400"
          >
            <rect
              x="60"
              y="60"
              width="200"
              height="200"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeOpacity="0.1"
              rx="20"
            />
            <rect
              x="90"
              y="90"
              width="140"
              height="140"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.1"
              rx="10"
            />
            <rect
              x="120"
              y="120"
              width="80"
              height="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.5"
              strokeOpacity="0.15"
              rx="5"
            />
          </svg>
        </motion.div>

        <div className="absolute inset-0 opacity-[0.01]">
          <svg
            width="100%"
            height="100%"
            className="text-slate-900 dark:text-slate-100"
          >
            <defs>
              <pattern
                id="mainGrid"
                width="50"
                height="50"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 50 0 L 0 0 0 50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mainGrid)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.8,
              duration: 1,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          >
            <Card3DList
              cards={cards}
              columns={3}
              gap="lg"
              size="md"
              variant="premium"
              className="mb-20"
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
