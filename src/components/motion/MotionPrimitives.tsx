import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react';
import { cn } from '../../utils/cn';

/**
 * ScrollProgressLine (Magic UI / Motion scroll progress bar)
 */
export function ScrollProgressLine({ className }: { className?: string }) {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <motion.div
      style={{ scaleX }}
      className={cn(
        'fixed top-0 left-0 right-0 h-[2px] bg-[#1E4D5C] origin-left z-50 pointer-events-none',
        className
      )}
    />
  );
}

/**
 * BlurTextReveal (ReactBits / Magic UI inspired staggered blur-to-sharp reveal)
 * Animates only opacity, transform, and filter (GPU-composited).
 */
export function BlurTextReveal({
  text,
  className,
  delay = 0,
  as = 'h1'
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p';
}) {
  const words = text.split(' ');
  const Component = motion[as];

  return (
    <Component
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={cn('text-balance', className)}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          variants={{
            hidden: { opacity: 0, y: 12, filter: 'blur(6px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: {
                duration: 0.45,
                delay: delay + index * 0.035,
                ease: [0.16, 1, 0.3, 1]
              }
            }
          }}
          className="inline-block mr-[0.26em]"
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
}

/**
 * ScrollParallaxFrame (Aceternity / Motion scroll-linked architectural parallax)
 */
export function ScrollParallaxFrame({
  children,
  className,
  offset = 36
}: {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], [-offset, offset]);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden', className)}>
      <motion.div style={{ y }} className="w-full h-full will-change-transform">
        {children}
      </motion.div>
    </div>
  );
}

/**
 * SpotlightCard (21st.dev / Aceternity light-theme interactive spotlight card)
 */
export function SpotlightCard({
  children,
  className,
  onClick
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'relative overflow-hidden bg-white border border-[#E6E2DA] rounded-2xl transition-shadow duration-200 hover:shadow-[0_14px_34px_-12px_rgba(24,24,27,0.08)]',
        className
      )}
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
        style={{
          opacity: hovered ? 1 : 0,
          background: useTransform(
            [mouseX, mouseY],
            ([x, y]) =>
              `radial-gradient(360px circle at ${x}px ${y}px, rgba(30, 77, 92, 0.06), transparent 65%)`
          )
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </motion.div>
  );
}

/**
 * NumberTicker (Magic UI inspired smooth count-up using tabular-nums)
 */
export function NumberTicker({
  value,
  suffix = '',
  prefix = '',
  className
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 850;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isInView, value]);

  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
}

/**
 * MagneticAction (ReactBits / 21st.dev tactile subtle pointer attraction)
 */
export function MagneticAction({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const x = useSpring(0, { stiffness: 280, damping: 22 });
  const y = useSpring(0, { stiffness: 280, damping: 22 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.clientX - (rect.left + rect.width / 2)) * 0.12;
    const offsetY = (e.clientY - (rect.top + rect.height / 2)) * 0.12;
    x.set(offsetX);
    y.set(offsetY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('inline-block', className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * ArchitecturalGridPattern (Magic UI subtle light blueprint background grid)
 */
export function ArchitecturalGridPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 opacity-45 [mask-image:radial-gradient(ellipse_at_center,white,transparent_75%)]',
        className
      )}
      style={{
        backgroundImage:
          'linear-gradient(to right, rgba(30, 77, 92, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(30, 77, 92, 0.06) 1px, transparent 1px)',
        backgroundSize: '44px 44px'
      }}
    />
  );
}

/**
 * FadeUpReveal (Gentle section entrance respecting reduced motion)
 */
export function FadeUpReveal({
  children,
  className,
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
