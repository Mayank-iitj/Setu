import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function DotGrid({
  dotSize = 10,
  gap = 15,
  baseColor = '#5227FF',
  activeColor = '#ffffff',
  proximity = 120,
  shockRadius = 250,
  shockStrength = 5,
  resistance = 750,
  returnDuration = 1.5,
}) {
  const containerRef = useRef(null);
  const dotsRef = useRef([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    dotsRef.current = [];
    container.innerHTML = '';
    
    const { clientWidth, clientHeight } = container;
    const cols = Math.floor(clientWidth / (dotSize + gap)) + 1;
    const rows = Math.floor(clientHeight / (dotSize + gap)) + 1;
    
    // Create dots
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const dot = document.createElement('div');
        dot.style.width = `${dotSize}px`;
        dot.style.height = `${dotSize}px`;
        dot.style.backgroundColor = baseColor;
        dot.style.borderRadius = '50%';
        dot.style.position = 'absolute';
        dot.style.left = `${j * (dotSize + gap)}px`;
        dot.style.top = `${i * (dotSize + gap)}px`;
        dot.style.transform = 'translate(-50%, -50%)';
        
        container.appendChild(dot);
        dotsRef.current.push({ el: dot, x: j * (dotSize + gap), y: i * (dotSize + gap) });
      }
    }

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      dotsRef.current.forEach((dot) => {
        const dx = mouseX - dot.x;
        const dy = mouseY - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < proximity) {
          const scale = 1 + ((proximity - dist) / proximity) * (shockStrength - 1);
          gsap.to(dot.el, {
            scale: scale,
            backgroundColor: activeColor,
            duration: 0.1,
            ease: "power2.out"
          });
        } else {
          gsap.to(dot.el, {
            scale: 1,
            backgroundColor: baseColor,
            duration: returnDuration,
            ease: "power2.out"
          });
        }
      });
    };
    
    const handleMouseLeave = () => {
      dotsRef.current.forEach((dot) => {
        gsap.to(dot.el, {
          scale: 1,
          backgroundColor: baseColor,
          duration: returnDuration,
          ease: "power2.out"
        });
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [dotSize, gap, baseColor, activeColor, proximity, shockStrength, returnDuration]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }} />
  );
}
