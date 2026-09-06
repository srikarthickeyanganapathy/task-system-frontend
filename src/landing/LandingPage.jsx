import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/identity';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useSEO } from '@/shared/seo';

import './landing.css';
import { LandingNav } from './components/LandingNav';
import { StarfieldCanvas } from './components/StarfieldCanvas';
import HeroSection from './components/HeroSection';
import TrustMarquee from './components/TrustMarquee';
import HowItWorksSection from './components/HowItWorksSection';
import WorkspaceSection from './components/WorkspaceSection';
import GovernanceSection from './components/GovernanceSection';
import WorkloadSection from './components/WorkloadSection';
import CapabilitiesSection from './components/CapabilitiesSection';
import IntegrationsSection from './components/IntegrationsSection';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';

export function LandingPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { theme } = useTheme();

  useSEO({
    title: 'Ryokai — The system for turning intent into execution',
    description: 'Ryokai helps engineering teams manage tasks more effectively with real-time collaboration, tracking, and dependencies.',
    ogTitle: 'Ryokai — The system for turning intent into execution',
    canonical: 'https://ryokai-dev.vercel.app/landing',
    noindex: false,
  });

  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  // If user is logged in, redirect them to the app
  if (!isInitializing && isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="landing-page h-full w-full relative">
      <StarfieldCanvas isDark={isDark} />
      <LandingNav />
      <main id="main-content" tabIndex={-1}>
        <HeroSection />
        <TrustMarquee />
        <HowItWorksSection />
        <WorkspaceSection />
        <CapabilitiesSection />
        <GovernanceSection />
        <WorkloadSection />
        <IntegrationsSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

