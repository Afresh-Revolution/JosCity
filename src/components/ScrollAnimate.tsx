import React, { ReactNode } from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

interface ScrollAnimateProps {
  children: ReactNode;
  className?: string;
  animationType?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'rotate';
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
  as?: keyof JSX.IntrinsicElements;
}

const ScrollAnimate: React.FC<ScrollAnimateProps> = ({
  children,
  className = '',
  animationType = 'fade-up',
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = false,
  delay = 0,
  as: Component = 'div',
}) => {
  const animation = useScrollAnimation({
    threshold,
    rootMargin,
    triggerOnce,
    animationClass: 'animate-in',
    scrollOutClass: 'animate-out',
  });

  const delayClass = delay > 0 ? `scroll-animate-delay-${Math.min(Math.ceil(delay / 0.1), 5)}` : '';

  return React.createElement(
    Component,
    {
      ref: animation.ref,
      className: `scroll-animate scroll-animate--${animationType} ${animation.className} ${delayClass} ${className}`.trim(),
    },
    children
  );
};

export default ScrollAnimate;

