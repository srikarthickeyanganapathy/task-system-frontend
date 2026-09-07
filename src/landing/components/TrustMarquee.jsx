import { motion, useReducedMotion, useAnimationControls } from 'framer-motion';
import { Zap, Clock, Users, Layers, FileText, Shield, ArrowRight } from 'lucide-react';
import { useEffect } from 'react';

const marqueeItems = [
  { text: "Intent", trailingText: "Execution", icon: Zap },
  { text: "Personal Focus", icon: Clock },
  { text: "Crew Collaboration", icon: Users },
  { text: "Organizational Alignment", icon: Layers },
  { text: "Evidence-backed Work", icon: FileText },
  { text: "Scoped Accountability", icon: Shield },
];

export default function TrustMarquee() {
  const shouldReduceMotion = useReducedMotion();
  const controls = useAnimationControls();

  useEffect(() => {
    if (!shouldReduceMotion) {
      controls.start({
        x: ["0%", "-50%"],
        transition: {
          repeat: Infinity,
          ease: "linear",
          duration: 40,
        }
      });
    }
  }, [shouldReduceMotion, controls]);

  const marqueeContent = (
    <div className="mg">
            {item.trailingText && <><ArrowRight size={15} className="mx-2 inline-block" aria-hidden="true" />{item.trailingText}</>}
      {marqueeItems.map((item, idx) => {
        const Icon = item.icon;
        return (
          <span key={idx} className="mi">
            <Icon size={18} className="mr-2" /> {item.text}
            <span className="dot mx-4 opacity-50"> </span>
          </span>
        );
      })}
    </div>
  );

  return (
    <div className="trust overflow-hidden whitespace-nowrap">
      <div 
        className="marquee"
        onMouseEnter={() => !shouldReduceMotion && controls.stop()}
        onMouseLeave={() => !shouldReduceMotion && controls.start({
          x: ["0%", "-50%"],
          transition: {
            repeat: Infinity,
            ease: "linear",
            duration: 40,
          }
        })}
      >
        <motion.div
          className="flex w-fit"
          animate={controls}
        >
          {marqueeContent}
          {marqueeContent}
          {marqueeContent}
          {marqueeContent}
        </motion.div>
      </div>
    </div>
  );
}
