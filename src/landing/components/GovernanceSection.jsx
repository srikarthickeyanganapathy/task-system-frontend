import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Link as LinkIcon, ShieldCheck, KeyRound, CheckCircle } from 'lucide-react';

const roleData = {
  admin: {
    id: 'admin',
    rank: '01',
    code: 'AD',
    codeClass: 'bg-indigo-500/10 text-indigo-500',
    name: 'Administrator',
    desc: 'Full platform control',
    grants: '16 grants   priority 0',
    tag: '  System',
    tagClass: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    passport: {
      pp: 'Full platform control',
      pr: 'Priority 0   16 of 16 enabled',
      chips: { on: '16/16', onCount: 16, read: 4, write: 8, flow: 4, risk: 4 },
      risk: { label: 'High', value: 80, color: 'var(--danger)' },
      outranks: ['Org Manager', 'Crew Lead', 'Member']
    }
  },
  orgManager: {
    id: 'orgManager',
    rank: '02',
    code: 'OM',
    codeClass: 'bg-blue-500/10 text-blue-500',
    name: 'Org Manager',
    desc: 'Owns team goals, workload, and leave',
    grants: '12 grants   priority 10',
    tag: '[x] Safe',
    tagClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    passport: {
      pp: 'Owns team goals, workload, and leave',
      pr: 'Priority 10   12 of 16 enabled',
      chips: { on: '12/16', onCount: 12, read: 4, write: 5, flow: 3, risk: 0 },
      risk: { label: 'Low', value: 8, color: 'var(--success)' },
      outranks: ['Crew Lead', 'Member']
    }
  },
  crewLead: {
    id: 'crewLead',
    rank: '03',
    code: 'CL',
    codeClass: 'bg-emerald-500/10 text-emerald-500',
    name: 'Crew Lead',
    desc: 'Runs a crew and its shared tasks',
    grants: '6 grants   priority 20',
    tag: '[x] Safe',
    tagClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    passport: {
      pp: 'Runs a crew and its shared tasks',
      pr: 'Priority 20   6 of 16 enabled',
      chips: { on: '6/16', onCount: 6, read: 3, write: 2, flow: 1, risk: 0 },
      risk: { label: 'Low', value: 5, color: 'var(--success)' },
      outranks: ['Member']
    }
  },
  member: {
    id: 'member',
    rank: '04',
    code: 'ME',
    codeClass: 'bg-purple-500/10 text-purple-500',
    name: 'Member',
    desc: 'Default read-only baseline',
    grants: '3 grants   priority 30',
    tag: '[x] Safe',
    tagClass: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    passport: {
      pp: 'Default read-only baseline',
      pr: 'Priority 30   3 of 16 enabled',
      chips: { on: '3/16', onCount: 3, read: 3, write: 0, flow: 0, risk: 0 },
      risk: { label: 'Minimal', value: 2, color: 'var(--success)' },
      outranks: []
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function GovernanceSection() {
  const [selectedRole, setSelectedRole] = useState('orgManager');
  const activeRole = roleData[selectedRole];

  return (
    <section id="governance" className="py-24 relative overflow-hidden bg-[var(--bg-base)]">
      <div className="wrap max-w-[1200px] mx-auto px-6">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={itemVariants}
          className="sec-label reveal text-[var(--accent)] text-sm font-semibold tracking-wider uppercase mb-4"
        >
          Trust &amp; Governance
        </motion.div>
        
        <motion.h2 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={itemVariants}
          className="sec-h reveal text-4xl md:text-5xl font-bold text-[var(--text-primary)] tracking-tight leading-tight mb-6"
        >
          Execution with accountability.
        </motion.h2>
        
        <motion.p 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={itemVariants}
          className="sec-sub reveal text-lg text-[var(--text-secondary)] max-w-2xl mb-16"
        >
          Every action has context, every permission has scope, and every important transition has a clear owner -- so teams move fast without losing control.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="app-stage mt-11 relative"
        >
          <div className="stage-glow absolute inset-0 bg-blue-500/5 blur-[100px] -z-10 rounded-full"></div>
          <div className="appwin max-w-[960px] mx-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-2xl overflow-hidden flex flex-col h-[600px]">
            
            {/* Topbar */}
            <div className="topbar h-12 border-b border-[var(--border-subtle)] flex items-center justify-between px-4 bg-[var(--bg-subtle)]" aria-hidden="true">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
              </div>
              <div className="tb-search flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] w-64 justify-center shadow-inner">
                <Search size={14} /> Search or jump to... <span className="kb px-1 py-0.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] ml-2">Cmd+K</span>
              </div>
              <div className="tb-actions flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)] text-white flex items-center justify-center text-xs font-bold ring-2 ring-[var(--bg-base)]">U</div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Main Content */}
              <div className="flex-1 p-8 overflow-y-auto bg-[var(--bg-base)]">
                <div className="mb-8">
                  <div className="text-xs text-[var(--accent)] font-medium uppercase tracking-wider mb-2">Authority &amp; Scope</div>
                  <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-1">Command Chain</h2>
                  <div className="text-sm text-[var(--text-secondary)]">Roles ranked by authority ? select a role to inspect its permissions and scope boundaries.</div>
                </div>

                {/* Posture Bar */}
                <div className="flex gap-4 mb-8">
                  <div className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center"><LinkIcon size={16} /></div>
                    <div><div className="text-lg font-semibold text-[var(--text-primary)] leading-tight">4</div><div className="text-xs text-[var(--text-secondary)]">Authority tiers</div></div>
                  </div>
                  <div className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><ShieldCheck size={16} /></div>
                    <div><div className="text-lg font-semibold text-indigo-500 leading-tight">1</div><div className="text-xs text-[var(--text-secondary)]">System roles</div></div>
                  </div>
                  <div className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-purple-500/10 text-purple-500 flex items-center justify-center"><KeyRound size={16} /></div>
                    <div><div className="text-lg font-semibold text-[var(--text-primary)] leading-tight">12</div><div className="text-xs text-[var(--text-secondary)]">Grants / role</div></div>
                  </div>
                  <div className="flex-1 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-lg p-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle size={16} /></div>
                    <div><div className="text-lg font-semibold text-emerald-500 leading-tight">0</div><div className="text-xs text-[var(--text-secondary)]">Elevated grants</div></div>
                  </div>
                </div>

                {/* Chain */}
                <div className="relative pl-6 space-y-4 before:absolute before:left-8 before:top-4 before:bottom-4 before:w-px before:bg-[var(--border-subtle)]">
                  {Object.values(roleData).map((role) => (
                    <div 
                      key={role.id} 
                      role="button"
                      tabIndex={0}
                      aria-pressed={selectedRole === role.id}
                      onClick={() => setSelectedRole(role.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedRole(role.id);
                        }
                      }}
                      className="relative flex items-center gap-4 cursor-pointer group"
                    >
                      <div className="absolute -left-6 text-xs text-[var(--text-tertiary)] font-mono">{role.rank}</div>
                      <div className={`w-4 h-4 rounded-full border-2 bg-[var(--bg-base)] z-10 transition-colors ${selectedRole === role.id ? 'border-[var(--accent)] ring-4 ring-[var(--accent)]/20' : 'border-[var(--border-subtle)] group-hover:border-[var(--text-secondary)]'}`}></div>
                      <div className={`flex-1 p-4 rounded-xl border transition-all flex items-center gap-4 ${selectedRole === role.id ? 'bg-[var(--bg-subtle)] border-[var(--accent)] shadow-sm' : 'bg-[var(--bg-base)] border-[var(--border-subtle)] hover:border-[var(--border-hover)]'}`}>
                        {role.id === 'admin' && <span className="text-yellow-500 text-lg"> </span>}
                        <div className={`px-2 py-1 rounded font-mono text-xs font-bold ${role.codeClass}`}>{role.code}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[var(--text-primary)]">{role.name}</div>
                          <div className="text-xs text-[var(--text-secondary)] truncate">{role.desc}</div>
                          <div className="text-xs text-[var(--text-tertiary)] mt-1">{role.grants}</div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-[10px] font-semibold border uppercase tracking-wider ${role.tagClass}`}>
                          {role.tag}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Passport Panel */}
              <div className="w-[280px] flex-none border-l border-[var(--border-subtle)] bg-[var(--bg-sidebar)] p-6 relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedRole}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-col h-full"
                  >
                    <div className="flex justify-center mb-6 relative">
                      <svg viewBox="0 0 96 96" className="w-24 h-24 -rotate-90">
                        <circle cx="48" cy="48" r="40" fill="none" stroke="var(--bg-subtle)" strokeWidth="5"/>
                        <motion.circle 
                          cx="48" cy="48" r="40" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" 
                          initial={{ strokeDasharray: "0 251" }}
                          animate={{ strokeDasharray: `${(activeRole.passport.chips.onCount / 16) * 251} 251` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </svg>
                      <div className={`absolute inset-0 flex items-center justify-center font-mono text-lg font-bold ${activeRole.codeClass} rounded-full w-14 h-14 m-auto`}>
                        {activeRole.code}
                      </div>
                    </div>
                    
                    <div className="text-center mb-6">
                      <div className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider mb-1">{activeRole.name}</div>
                      <div className="text-xs text-[var(--text-secondary)] mb-2">{activeRole.passport.pp}</div>
                      <div className="text-xs text-[var(--text-tertiary)] font-mono">{activeRole.passport.pr}</div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8 justify-center">
                      <span className="px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">ON <b className="text-[var(--text-primary)] ml-1">{activeRole.passport.chips.on}</b></span>
                      <span className="px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">READ <b className="text-emerald-500 ml-1">{activeRole.passport.chips.read}</b></span>
                      <span className="px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">WRITE <b className="text-yellow-500 ml-1">{activeRole.passport.chips.write}</b></span>
                      <span className="px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">FLOW <b className="text-blue-500 ml-1">{activeRole.passport.chips.flow}</b></span>
                      <span className="px-2 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-secondary)]">RISK <b className="text-red-500 ml-1">{activeRole.passport.chips.risk}</b></span>
                    </div>

                    <div className="mb-8">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-[var(--text-secondary)] font-medium">Risk exposure</span>
                        <span style={{ color: activeRole.passport.risk.color }} className="font-semibold">{activeRole.passport.risk.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden mb-2">
                        <motion.div 
                          className="h-full rounded-full" 
                          style={{ backgroundColor: activeRole.passport.risk.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${activeRole.passport.risk.value}%` }}
                          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider">
                        <span>Safe</span><span>Caution</span><span>Critical</span>
                      </div>
                    </div>

                    {activeRole.passport.outranks.length > 0 && (
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-2">Outranks</div>
                        <div className="flex gap-2 flex-wrap">
                          {activeRole.passport.outranks.map(role => (
                            <span key={role} className="text-[10px] bg-[var(--bg-subtle)] px-2 py-1 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)]">{role}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
