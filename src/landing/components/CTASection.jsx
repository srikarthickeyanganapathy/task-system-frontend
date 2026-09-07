import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from '@/shared/ui/Icons';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function CTASection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="get-started" className="cta" ref={ref}>
      <div className="wrap">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          <motion.div className="sec-label" style={{ textAlign: 'center' }} variants={itemVariants}>
            Get started
          </motion.div>
          <motion.h2 className="sec-h" variants={itemVariants}>
            Turn intent into execution.<br />Start free today.
          </motion.h2>
          <motion.p className="sec-sub" variants={itemVariants}>
            Free personal and crew workspaces. Bring your organization when you're ready.
          </motion.p>
          
          <motion.div className="cta-actions" variants={itemVariants}>
            <Link className="btn btn-primary" to="/register">
              Start free <ArrowRight className="arr" size={16} aria-hidden="true" />
            </Link>
            <a className="btn btn-ghost" href="mailto:sales@ryokai.dev">
              Talk to sales for enterprise plans
            </a>
          </motion.div>
          
          <motion.div className="cta-note" variants={itemVariants}>
            Evidence-backed workflows. Your data stays yours.
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
