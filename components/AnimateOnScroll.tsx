import React, { useEffect, useRef, ReactNode } from 'react';

interface AnimateOnScrollProps {
  children: ReactNode;
  className?: string;
  delay?: string;
}

const AnimateOnScroll: React.FC<AnimateOnScrollProps> = ({ children, className, delay }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          element.classList.add('is-visible');
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => { if (element) observer.unobserve(element) };
  }, []);

  const style: React.CSSProperties = delay ? { transitionDelay: delay } : {};

  return (
    <div ref={ref} className={`scroll-anim ${className || ''}`} style={style}>
      {children}
    </div>
  );
};

export default AnimateOnScroll;
