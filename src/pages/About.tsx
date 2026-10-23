import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import NavBar from "./NavBar";
import Footer from "./Footer";

const SERVICES = [
  {
    id: "marketplace",
    title: "Joscity Marketplace",
    text: "Businesses list products and services. Customers browse those listings and place orders through the platform. The business is the seller of its own goods. Joscity provides the marketplace, the order record, and checkout. Marketplace payments are collected through an approved payment provider. The vendor’s share is settled to the vendor, and Joscity receives only its marketplace commission. Joscity does not collect those proceeds into its own account and then pay vendors later.",
  },
  {
    id: "memberships",
    title: "Business and Personal Memberships",
    text: "Personal and business members can subscribe to the membership plans published on Joscity. An active plan gives the member the benefits shown for that plan. Membership is a payment for services Joscity itself provides. It is processed separately from marketplace checkout, not as money held for a vendor.",
  },
  {
    id: "agents",
    title: "Joscity Agents",
    text: "Independent agents can assist customers with purchasing products and arranging deliveries when that agent service is offered. Agents are not Joscity employees, and they are not assigned to every marketplace order. A listing or checkout states when an agent is part of the order.",
  },
  {
    id: "wallet",
    title: "Digital Wallet",
    text: "A wallet is intended to let members hold a balance for platform use and withdraw an eligible amount when that product is offered through a licensed payment institution. Wallet funding, withdrawals, transfers, and stored value are not provided through Paystack. Joscity does not use Paystack to hold customer or vendor money in a wallet. Any wallet that is offered will sit on a separate, regulated arrangement, not on marketplace checkout through Paystack.",
  },
  {
    id: "community",
    title: "Community Platform",
    text: "Members can connect with other people, share posts and experiences, and take part in community groups, forums, and local updates. The community areas use the same Joscity account as the marketplace and memberships.",
  },
];

const About: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const description =
      "Joscity is a Nigerian marketplace and community. Marketplace payments settle to vendors through an approved payment provider. Joscity receives its commission and does not hold customer or vendor funds for later payout.";
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
            Joscity is a digital community and marketplace operated by JosCity Smart Services in Jos, Plateau State, Nigeria. People, businesses, and independent agents use it to trade, subscribe, and take part in the community. Joscity runs the platform. It does not hold customer or vendor money for later distribution.
          </p>
        </header>

        <div className="policy-doc__layout policy-doc__layout--single">
          <div className="policy-doc__body">
            <section id="role" aria-labelledby="role-title">
              <h2 id="role-title">Joscity’s role</h2>
              <p>
                Joscity operates the website and apps. It provides accounts, listings, checkout, membership plans, and customer support. Joscity is not the seller of a business’s products, and it does not own that business’s stock or run a warehouse for marketplace sellers.
              </p>
              <p>
                Independent businesses sell their own goods and services. Independent agents, where a customer uses an agent service, assist with purchasing and delivery. Joscity records the order. Money for a marketplace sale is handled by the payment provider shown at checkout, not kept in Joscity’s business account for later payout to the vendor.
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
              <h2 id="payments-title">How payments work</h2>
              <p>
                The customer sees the amount and the payment method before confirming. Joscity does not add a charge that the checkout screen does not show.
              </p>
              <h3>Marketplace orders</h3>
              <p>
                Marketplace checkout uses an approved payment provider. Where Paystack is used, the sale is split at settlement: the vendor receives the vendor share, and Joscity receives its marketplace commission. Joscity does not take the full payment into its own account and then send the vendor their earnings later.
              </p>
              <h3>Membership</h3>
              <p>
                Membership subscriptions are payments for Joscity’s own plans and benefits. They are charged separately from a marketplace order and are not vendor settlement.
              </p>
              <h3>Wallet</h3>
              <p>
                Wallet funding, withdrawals, transfers, and stored value are not processed through Paystack. Those features, if offered, will use a separate regulated payment arrangement. Until that arrangement is in place and approved, marketplace and membership payments through Paystack do not create or fund a stored-value wallet.
              </p>
              <h3>Refunds</h3>
              <p>
                A refund for a payment made through Paystack follows the Paystack refund process. Where that process supports it, the money goes back to the original payment method. Joscity reviews customer complaints and marketplace disputes under the{" "}
                <Link to="/refund-policy">Returns, Refunds and Cancellation Policy</Link>. After a refund is agreed, Joscity’s review is completed within 2 working days, and no later than 3 days. The payment provider may then take its own time to show the money on the original method.
              </p>
              <p>
                Delivery and acceptable use are set out in the{" "}
                <Link to="/shipping-policy">Shipping and Delivery Policy</Link> and the{" "}
                <Link to="/acceptable-use">Acceptable Use Policy</Link>.
              </p>
            </section>

            <section id="access" aria-labelledby="access-title">
              <h2 id="access-title">How customers access the services</h2>
              <ol>
                <li>Open joscity.com, or the Joscity mobile app.</li>
                <li>Create a personal, business, or agent account, or sign in to an existing account.</li>
                <li>Open Marketplace to buy or list, Membership to subscribe to a Joscity plan, Agents where an agent service is offered, and the community areas to post, join groups, and connect with other members.</li>
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
