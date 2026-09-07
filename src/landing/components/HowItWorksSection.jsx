import { motion } from 'framer-motion';
import {
  Sparkles,
  Compass,
  Plus,
  Zap,
  Upload,
  Eye,
  CheckCircle2,
  Trophy,
  ImageIcon,
  CheckCheck,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const STEPS = [
  {
    icon: Sparkles,
    num: '01',
    title: 'Intent',
    desc: 'Define what needs to be accomplished and establish clear target outcomes.',
    state: '01   Captured',
    iconCls: 'bg-amber-500/10 text-amber-500',
    stateCls: 'bg-amber-500/10 text-amber-500',
  },
  {
    icon: Compass,
    num: '02',
    title: 'Plan',
    desc: 'Turn goals into structured projects, sequenced milestones, and deliverables.',
    state: '02   Structured',
    iconCls: 'bg-blue-500/10 text-blue-500',
    stateCls: 'bg-blue-500/10 text-blue-500',
  },
  {
    icon: Plus,
    num: '03',
    title: 'Create',
    desc: 'Create tasks with clear ownership across creator, assignee, and reviewer roles.',
    state: '03   Assigned',
    iconCls: 'bg-indigo-500/10 text-indigo-500',
    stateCls: 'bg-indigo-500/10 text-indigo-500',
  },
  {
    icon: Zap,
    num: '04',
    title: 'Work',
    desc: 'Execute with focused work sessions while tracking tangible task progress.',
    state: '04   In progress',
    iconCls: 'bg-yellow-500/10 text-yellow-500',
    stateCls: 'bg-yellow-500/10 text-yellow-500',
  },
  {
    icon: Upload,
    num: '05',
    title: 'Submit',
    desc: 'Attach tangible evidence -- links, git commits, screenshots, or notes -- before submitting.',
    state: '05   Evidence gate',
    iconCls: 'bg-purple-500/10 text-purple-500',
    stateCls: 'bg-purple-500/10 text-purple-500',
  },
  {
    icon: Eye,
    num: '06',
    title: 'Review',
    desc: 'Reviewers inspect the submitted evidence directly, not just a comment thread.',
    state: '06   In review',
    iconCls: 'bg-sky-500/10 text-sky-500',
    stateCls: 'bg-sky-500/10 text-sky-500',
  },
  {
    icon: CheckCircle2,
    num: '07',
    title: 'Decide',
    desc: 'Approve completed work or route it back for rework with clear, recorded feedback.',
    state: '07   Decided',
    iconCls: 'bg-emerald-500/10 text-emerald-500',
    stateCls: 'bg-emerald-500/10 text-emerald-500',
  },
  {
    icon: Trophy,
    num: '08',
    title: 'Outcome',
    desc: 'Track completed outcomes, update team progress, and free capacity for the next priority.',
    state: '08   Completed',
    iconCls: 'bg-teal-500/10 text-teal-500',
    stateCls: 'bg-teal-500/10 text-teal-500',
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      <div className="wrap max-w-[1200px] mx-auto px-6">
        <motion.div variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="sec-label reveal text-[var(--accent)] text-sm font-semibold tracking-wider uppercase mb-4">
          The Execution Lifecycle
        </motion.div>
        <motion.h2 variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="sec-h reveal text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-tight mb-6">
          One path from intent to outcome.
        </motion.h2>
        <motion.p variants={itemVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="sec-sub reveal text-lg text-[var(--text-secondary)] max-w-2xl mb-16">
          Every goal moves through a clear, evidence-backed lifecycle. Nothing gets lost, progress requires tangible proof, and every step has an accountable owner.
        </motion.p>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <motion.div key={s.title} variants={itemVariants} className="p-6 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] hover:border-[var(--border-hover)] hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.iconCls}`}>
                    <s.icon size={20} strokeWidth={1.8} />
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--text-tertiary)]">{s.num}</span>
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{s.title}</h3>
                <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed mb-4">{s.desc}</p>
              </div>
              <div>
                <span className={`inline-block text-[10px] font-mono font-medium tracking-wide uppercase px-2.5 py-1 rounded-md ${s.stateCls}`}>{s.state}</span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }} className="grid md:grid-cols-2 gap-4 mt-12">
          <motion.div variants={itemVariants} className="flex gap-4 p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50">
            <span className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0"><ImageIcon size={18} strokeWidth={1.7} /></span>
            <div>
              <h4 className="text-[15px] font-semibold mb-1">Evidence-backed execution</h4>
              <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">Six typed evidence kinds ? LINK, GITHUB, SCREENSHOT, RECORDING, SNIPPET, NOTE ? ensure decisions are backed by real work, not empty comments.</p>
            </div>
          </motion.div>
          <motion.div variants={itemVariants} className="flex gap-4 p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50">
            <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"><CheckCheck size={18} strokeWidth={1.7} /></span>
            <div>
              <h4 className="text-[15px] font-semibold mb-1">Accountable approvals</h4>
              <p className="text-[13px] text-[var(--text-tertiary)] leading-relaxed">Reviewers must have the authority to decide, rejections require a clear reason, and review transitions are formally recorded.</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
