import Link from 'next/link';
import {
  ArrowUpRight,
  Compass,
  ShieldCheck,
  ScanLine,
  SlidersHorizontal,
  BookOpen,
} from 'lucide-react';
export default function Home() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link className="brand" href="/">
          <Compass />
          Consult<span>AI</span>
        </Link>
        <nav>
          <a href="#how">How it works</a>
          <a href="#trust">Our approach</a>
          <Link href="/pitch">The vision</Link>
        </nav>
        <Link className="button dark" href="/demo">
          Try the demo <ArrowUpRight size={17} />
        </Link>
      </header>
      <main>
        <section className="hero">
          <div>
            <p className="eyebrow">
              <span className="dot" /> YOUR NEXT CHAPTER, CLEARER.
            </p>
            <h1>
              Big ambitions.
              <br />A world of options.
              <br />
              <em>One clear plan.</em>
            </h1>
            <p className="hero-copy">
              Stop guessing where to study. Find a path that fits your
              academics, your budget, and the future you have in mind.
            </p>
            <div className="actions">
              <Link className="button primary" href="/profile">
                Analyze my profile <ArrowUpRight size={18} />
              </Link>
              <Link className="button light" href="/demo">
                Explore demo
              </Link>
            </div>
            <p className="trust-line">
              <ShieldCheck size={17} /> Official sources. Explainable matches.
              Your decision.
            </p>
          </div>
          <div className="strategy-preview">
            <div className="preview-top">
              <Compass />
              <span>YOUR GLOBAL STUDY STRATEGY</span>
            </div>
            <div className="route-line">
              PAKISTAN <span>────────↗</span> YOUR NEXT CHAPTER
            </div>
            <h2>
              A better way
              <br />
              to find your fit.
            </h2>
            {[
              ['🇰🇷', 'South Korea', 'Explore scholarship-led pathways'],
              ['🇩🇪', 'Germany', 'Understand your entrance pathway'],
              ['🇬🇧', 'United Kingdom', 'Plan the full financial picture'],
            ].map(([f, c, t]) => (
              <div className="preview-country" key={c}>
                <span>{f}</span>
                <div>
                  <strong>{c}</strong>
                  <small>{t}</small>
                </div>
                <ArrowUpRight />
              </div>
            ))}
            <div className="preview-note">
              <ShieldCheck size={19} />
              <span>
                Every recommendation has a reason.
                <br />
                Every verified fact has a source.
              </span>
            </div>
          </div>
        </section>
        <section className="principles" id="how">
          {[
            {
              Icon: ScanLine,
              title: '01 / Understand you',
              body: 'Start with your goals, language scores and available funds.',
            },
            {
              Icon: SlidersHorizontal,
              title: '02 / Explore your options',
              body: 'See how each match is calculated. Change your budget or IELTS score to explore what could change.',
            },
            {
              Icon: BookOpen,
              title: '03 / Build your next chapter',
              body: 'Turn your shortlist into a strategy, document checklist and application plan.',
            },
          ].map(({ Icon, title, body }) => (
            <article key={title}>
              <Icon />
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </section>
        <section id="trust" className="trust-section">
          <p className="eyebrow">CONFIDENCE STARTS WITH EVIDENCE</p>
          <h2>A consultant that shows its work.</h2>
          <p>
            Inspect official sources, see which details need review, and keep
            estimates separate from admission requirements. Scores help you
            compare options; they never promise admission or a visa.
          </p>
          <Link className="button primary" href="/demo">
            Meet your study command center <ArrowUpRight size={18} />
          </Link>
        </section>
      </main>
      <footer>
        <Link className="brand" href="/">
          <Compass />
          Consult<span>AI</span>
        </Link>
        <span>Your verified AI consultant for studying abroad.</span>
        <Link href="/pitch">Product & architecture</Link>
      </footer>
    </div>
  );
}
