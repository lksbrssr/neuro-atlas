import Link from "next/link";
import { LandingVisual } from "@/components/landing-visual";

const PLATES = [
  { href: "/milestones", title: "Milestones", view: "milestones", blurb: "Follow the scientific, clinical, and commercial breakthroughs." },
  { href: "/ecosystem", title: "Ecosystem", view: "ecosystem", blurb: "Meet the companies building neurotechnology around the world." },
  { href: "/funding", title: "BCI Funding Index", view: "funding", blurb: "Explore funding rounds and investors in brain-computer interfaces." },
  { href: "/field-velocity", title: "Field velocity", view: "velocity", blurb: "See how capabilities are advancing — and what could come next." },
] as const;

export default function Home() {
  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <p className="landing-eyebrow">Neuro Atlas</p>
        <h1 id="landing-title" className="landing-title">Neurotechnology, mapped.</h1>
        <p className="landing-intro">
          Explore the breakthroughs, companies, and capital shaping the field.
        </p>
        <div className="landing-actions">
          <a href="#explore" className="landing-explore">Explore the atlas <span aria-hidden="true">↓</span></a>
          <a href="https://github.com/lksbrssr/neuro-atlas/compare" target="_blank" rel="noreferrer" className="landing-contribute">
            Contribute via PR <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="landing-feedback">Feedback, corrections, or new data? Help improve the atlas.</p>
      </section>

      <section id="explore" tabIndex={-1} className="landing-directory" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="landing-section-title">Explore the atlas</h2>
        <div className="landing-grid">
          {PLATES.map((plate) => (
            <Link key={plate.href} href={plate.href} className="landing-tile" aria-labelledby={`tile-${plate.view}`}>
              <div className="landing-tile-header">
                <div className="landing-tile-heading">
                  <h3 id={`tile-${plate.view}`}>{plate.title}</h3>
                  <span className="landing-tile-arrow" aria-hidden="true">↗</span>
                </div>
                <LandingVisual view={plate.view} />
              </div>
              <p className="landing-tile-description">{plate.blurb}</p>
            </Link>
          ))}
        </div>
        <Link href="/methodology" className="landing-methodology">Sources and methodology <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  );
}
