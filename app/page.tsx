import { Bridge } from '@/components/landing/Bridge';
import { Final, Footer, Guarantee } from '@/components/landing/Closing';
import { Faq } from '@/components/landing/Faq';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Inside } from '@/components/landing/Inside';
import { Nav } from '@/components/landing/Nav';
import { Packs } from '@/components/landing/Packs';
import { Reveal } from '@/components/landing/Reveal';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Reveal />
        <Bridge />
        <HowItWorks />
        <Inside />
        <Packs />
        <Guarantee />
        <Faq />
        <Final />
      </main>
      <Footer />
    </>
  );
}
