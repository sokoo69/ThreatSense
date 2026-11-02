import type { Metadata } from 'next';
import { ThreatMonitor } from '../components/monitor/ThreatMonitor';

export const metadata: Metadata = {
  title: 'ThreatSense | Behavioral Threat Monitor',
  description:
    'Surveillance decision support combining facial emotion recognition with silent Bengali lip reading.',
};

export default function HomePage() {
  return <ThreatMonitor />;
}
