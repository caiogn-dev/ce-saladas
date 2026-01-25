/**
 * PageTransition - Smooth page transition animations
 * Uses CSS animations for performance
 */
import React, { useEffect, useState } from 'react';
import styles from './PageTransition.module.css';

const PageTransition = ({ 
  children, 
  className = '',
  animation = 'fadeUp', // fadeUp, fadeIn, slideLeft, slideRight, scale
  delay = 0
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div 
      className={`
        ${styles.container} 
        ${styles[animation]} 
        ${isVisible ? styles.visible : ''} 
        ${className}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export const StaggeredList = ({ 
  children, 
  staggerDelay = 50,
  animation = 'fadeUp'
}) => {
  return (
    <>
      {React.Children.map(children, (child, index) => (
        <PageTransition 
          animation={animation} 
          delay={index * staggerDelay}
        >
          {child}
        </PageTransition>
      ))}
    </>
  );
};

export const AnimatedCard = ({ 
  children, 
  className = '',
  onClick,
  hover = true
}) => {
  return (
    <div 
      className={`${styles.animatedCard} ${hover ? styles.hoverEffect : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default PageTransition;
