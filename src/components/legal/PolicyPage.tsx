import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import NavBar from "../../pages/NavBar";
import Footer from "../../pages/Footer";
import {
  POLICY_EFFECTIVE_DATE,
  POLICY_SUPPORT,
  POLICY_UPDATED_DATE,
  type MarketplacePolicy,
  type PolicyBlock,
} from "../../content/marketplacePolicies";

function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, index) => {
        const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (!match) return <React.Fragment key={index}>{part}</React.Fragment>;
        const label = match[1];
        const href = match[2];
        if (href.startsWith("/")) {
          return (
            <Link key={index} to={href}>
              {label}
            </Link>
          );
        }
        return (
          <a key={index} href={href}>
            {label}
          </a>
        );
      })}
    </>
  );
}

function Blocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <>
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index}>
            {block.items.map((item) => (
              <li key={item}>
                <RichText text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={index}>
            <RichText text={block.text} />
          </p>
        )
      )}
    </>
  );
}

function Contents({ policy, id }: { policy: MarketplacePolicy; id: string }) {
  return (
    <nav id={id} aria-label="Contents">
      <ol>
        {policy.sections.map((section) => (
          <li key={section.id}>
            <a href={`#${section.id}`}>{section.title.replace(/^\d+\.\s/, "")}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

const PolicyPage: React.FC<{ policy: MarketplacePolicy }> = ({ policy }) => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = policy.seoTitle;
    const description = policy.description;
    let meta = document.querySelector('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    const previousDescription = meta.getAttribute("content");
    meta.setAttribute("content", description);
    window.scrollTo(0, 0);
    return () => {
      document.title = previousTitle;
      if (created) meta?.remove();
      else if (previousDescription) meta?.setAttribute("content", previousDescription);
    };
  }, [policy]);

  return (
    <>
      <NavBar />
      <article className="policy-doc">
        <header className="policy-doc__header">
          <p className="policy-doc__kicker">Marketplace policies</p>
          <h1>{policy.title}</h1>
          <p className="policy-doc__intro">{policy.intro}</p>
          <p className="policy-doc__dates">
            <span>Effective {POLICY_EFFECTIVE_DATE}</span>
            <span>Last updated {POLICY_UPDATED_DATE}</span>
          </p>
        </header>

        <div className="policy-doc__layout">
          <details className="policy-doc__toc policy-doc__toc--mobile">
            <summary>On this page</summary>
            <Contents policy={policy} id="policy-contents-mobile" />
          </details>

          <div className="policy-doc__toc policy-doc__toc--desktop">
            <p>On this page</p>
            <Contents policy={policy} id="policy-contents" />
          </div>

          <div className="policy-doc__body">
            {policy.sections.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} tabIndex={-1}>
                <h2 id={`${section.id}-title`}>{section.title}</h2>
                <Blocks blocks={section.blocks} />
              </section>
            ))}

            <aside className="policy-doc__contact">
              <h2>Support</h2>
              <p>Marketplace complaints and policy questions:</p>
              <ul>
                <li>
                  <a href={`mailto:${POLICY_SUPPORT.email}`}>{POLICY_SUPPORT.email}</a>
                </li>
                <li>
                  <a href={POLICY_SUPPORT.phoneHref}>{POLICY_SUPPORT.phone}</a>
                </li>
                <li>{POLICY_SUPPORT.place}</li>
              </ul>
            </aside>
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
};

export default PolicyPage;
