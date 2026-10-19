import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

const SERVICES = [
  {
    id: "marketplace",
    title: "Joscity Marketplace",
    text: "Businesses list products and services. Customers browse those listings and place orders through the platform. The business is the seller of its own goods. Joscity provides the marketplace, the order record, and the payment steps shown at checkout.",
  },
  {
    id: "memberships",
    title: "Business and Personal Memberships",
    text: "Personal and business members can subscribe to the membership plans published on Joscity. An active plan gives the member the benefits shown for that plan. Plans and prices are the ones displayed on the Membership page at the time of subscription.",
  },
  {
    id: "agents",
    title: "Joscity Agents",
    text: "Independent agents can assist customers with purchasing products and arranging deliveries when that agent service is offered. Agents are not Joscity employees, and they are not assigned to every marketplace order. A listing or checkout states when an agent is part of the order.",
  },
  {
    id: "wallet",
    title: "Digital Wallet",
    text: "Members can fund a Joscity wallet, keep a balance, and use that balance for eligible payments on the platform, including marketplace orders that offer wallet payment. Members can also request a withdrawal to the bank account they provide. Withdrawal requests are reviewed before they are paid.",
  },
  {
    id: "community",
    title: "Community Platform",
    text: "Members can connect with other people, share posts and experiences, and take part in community groups, forums, and local updates. The community areas are part of the same Joscity account used for the marketplace, memberships, and wallet.",
  },
];

const About: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const description =
      "Joscity is a Nigerian marketplace and community platform. Businesses sell through the marketplace, members subscribe to plans, independent agents assist with purchases and deliveries, and members use a digital wallet.";
    document.title = pathname === "/our-services" ? "Our Services | Joscity" : "About Joscity | Joscity";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
    if (pathname === "/our-services") {
      document.getElementById("our-services")?.scrollIntoView();
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return (
    <>
      <NavBar />
      <article className="policy-doc">
        <header className="policy-doc__header">
          <p className="policy-doc__kicker">About Joscity</p>
          <h1>About Joscity</h1>
          <p className="policy-doc__intro">
            Joscity is a digital community and marketplace operated by JosCity Smart Services in Jos, Plateau State, Nigeria. People, businesses, and independent agents use it to trade, subscribe, pay, and take part in the community.
          </p>
        </header>

        <div className="policy-doc__layout policy-doc__layout--single">
          <div className="policy-doc__body">
            <section id="role" aria-labelledby="role-title">
              <h2 id="role-title">Joscity’s role</h2>
              <p>
                Joscity operates the platform. It provides accounts, listings, checkout, the wallet, membership subscriptions, and customer support. Joscity is not the seller of a business’s products, and it does not own that business’s stock or run a warehouse for marketplace sellers.
              </p>
              <p>
                Independent businesses sell their own goods and services. Independent agents, where a customer uses an agent service, assist with purchasing and delivery. Joscity records the order and applies the payment arrangement below.
              </p>
            </section>

            <section id="our-services" aria-labelledby="services-title">
              <h2 id="services-title">Our services</h2>
              <p>Customers and businesses use these services with a Joscity account.</p>
              {SERVICES.map((service) => (
                <section key={service.id} id={service.id} aria-labelledby={`${service.id}-title`}>
                  <h3 id={`${service.id}-title`}>{service.title}</h3>
                  <p>{service.text}</p>
                </section>
              ))}
            </section>

            <section id="payments" aria-labelledby="payments-title">
              <h2 id="payments-title">Marketplace payment arrangement</h2>
              <p>
                The customer sees the amount and the payment method before confirming an order. Joscity does not add a card charge that the checkout screen does not show.
              </p>
              <ul>
                <li>
                  Bank transfer: the checkout shows an invoice total and the account details for that invoice. The customer transfers that amount and uses the invoice number as the narration. A Joscity administrator confirms the transfer. The order is treated as paid after that confirmation.
                </li>
                <li>
                  Wallet or CBC: where checkout offers it, the customer pays from a Joscity wallet balance or CBC balance. When the payment succeeds, the seller’s wallet is credited.
                </li>
              </ul>
              <p>
                Refunds that are due are settled within 2 working days, and no later than 3 days, after support review where a review is needed. Delivery, cancellation, and acceptable use are set out in the{" "}
                <Link to="/shipping-policy">Shipping and Delivery Policy</Link>, the{" "}
                <Link to="/refund-policy">Returns, Refunds and Cancellation Policy</Link>, and the{" "}
                <Link to="/acceptable-use">Acceptable Use Policy</Link>.
              </p>
            </section>

            <section id="access" aria-labelledby="access-title">
              <h2 id="access-title">How customers access the services</h2>
              <ol>
                <li>Open joscity.com, or the Joscity mobile app.</li>
                <li>Create a personal, business, or agent account, or sign in to an existing account.</li>
                <li>Open Marketplace to buy or list, Membership to subscribe to a plan, Agents where an agent service is offered, Wallet to fund a balance or request a withdrawal, and the community areas to post, join groups, and connect with other members.</li>
              </ol>
              <p>
                A business account must provide its CAC. A business account without CAC is suspended 7 days after the signup day. Support is available at{" "}
                <a href="mailto:support@joscity.com">support@joscity.com</a> and{" "}
                <a href="tel:+2347067621916">+234 7067621916</a>.
              </p>
            </section>
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
};

export default About;
