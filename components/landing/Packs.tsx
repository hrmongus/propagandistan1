import Link from 'next/link';
import { PACKS } from '@/lib/data';
import { BundleFans, Fan } from '../Fan';

const singles = PACKS.filter((p) => !p.bundle);
const bundle = PACKS.find((p) => p.bundle)!;

export function Packs() {
  return (
    <section id="packs" className="section">
      <div className="packs">
        <div className="packs-head">
          <h2 className="h2">Pick the pack that matches your sound.</h2>
          <p>
            <span className="lead">Every pack is capped and retired.</span> Once its run sells out, it comes off the site
            permanently. Your footage doesn&apos;t end up on a thousand identical accounts, and the platforms don&apos;t start
            treating it as recycled.
          </p>
        </div>
        <div className="packs-grid">
          {singles.map((p, i) => (
            <div className="pack" key={p.slug}>
              <div className="fan-box"><Fan gi={i} size="big" /></div>
              <div className="pack-body">
                <div className="pack-meta">
                  <span>{p.n}</span>
                  <span style={{ color: p.stockColor }}>{p.stock}</span>
                </div>
                <span className="pack-name">{p.name}</span>
                <span className="pack-genres">{p.genres}</span>
                <p className="pack-desc">{p.desc}</p>
                <div className="pack-price"><span className="now">${p.priceN}</span></div>
                <Link className="btn btn-outline" href={`/checkout?pack=${p.slug}`}>{p.cta}</Link>
              </div>
            </div>
          ))}
          <div className="pack bundle">
            <div className="fan-box">
              <span className="wide"><BundleFans size="mid" /></span>
              <span className="narrow"><BundleFans size="tiny" /></span>
            </div>
            <div className="pack-body">
              <span className="bundle-kicker">Best value · {bundle.n}</span>
              <span className="pack-name">{bundle.name}</span>
              <span className="pack-genres">{bundle.genres}</span>
              <p className="pack-desc">{bundle.desc}</p>
              <div className="pack-price">
                <span className="now">${bundle.priceN}</span>
                <span className="was">{bundle.was}</span>
                <span className="save">{bundle.stock}</span>
              </div>
              <Link className="btn btn-green" href={`/checkout?pack=${bundle.slug}`}>{bundle.cta}</Link>
            </div>
          </div>
        </div>
        <p className="licence">
          <span className="k">Licence:</span> you own everything you make with it — commercial use, unlimited posts, no
          royalties, no credit, no expiry. The only thing you can&apos;t do is resell the pack itself.
        </p>
      </div>
    </section>
  );
}
