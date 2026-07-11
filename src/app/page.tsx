import HomeClient from './HomeClient';
import { getSiteContentMap, getLatestVariants } from '@/lib/content';

export default async function HomePage() {
  const content = await getSiteContentMap();
  const hero = content['home_hero'] || {};
  const features = content['home_features'] || {};
  const cta = content['home_cta'] || {};
  const latest = await getLatestVariants();
  
  return <HomeClient 
    hero={hero} 
    features={features} 
    cta={cta} 
    latest={latest} 
  />;
}
