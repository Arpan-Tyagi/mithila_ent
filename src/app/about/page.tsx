import type { Metadata } from 'next';
import AboutClient from './AboutClient';
import { getSiteContentMap } from '@/lib/content';
import { getSiteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  title: 'Our Heritage, Craftsmanship & Handloom Legacy',
  description:
    'Discover the legacy of Mithila Enterprises — uniting centuries of Indian weaving traditions, Madhubani cultural motifs, and modern zero-defect textile engineering for domestic and global designers.',
  alternates: {
    canonical: `${getSiteUrl()}/about`,
  },
  openGraph: {
    title: 'Our Heritage, Craftsmanship & Handloom Legacy | Mithila Enterprises',
    description:
      'Discover the legacy of Mithila Enterprises — uniting centuries of Indian weaving traditions, Madhubani cultural motifs, and modern zero-defect textile engineering.',
    url: `${getSiteUrl()}/about`,
  },
};

export default async function AboutPage() {
  const content = await getSiteContentMap();
  const intro = content['about_intro'] || { title: '', body: '' };
  const mission = content['about_mission'] || { title: '', body: '' };
  const heritage = content['about_heritage'] || { title: '', body: '' };
  return (
    <AboutClient
      intro={{ title: intro.title, body: intro.body }}
      mission={{ title: mission.title, body: mission.body }}
      heritage={{ title: heritage.title, body: heritage.body }}
    />
  );
}
