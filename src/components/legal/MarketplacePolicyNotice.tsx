import React from "react";
import { Link } from "react-router-dom";

const LINKS = [
  { to: "/acceptable-use", label: "Acceptable Use Policy" },
  { to: "/shipping-policy", label: "Shipping and Delivery Policy" },
  { to: "/refund-policy", label: "Returns, Refunds and Cancellation Policy" },
] as const;

const COPY = {
  listing:
    "Listings must be accurate and lawful. Read the marketplace policies before you publish.",
  checkout:
    "By placing this order you can review how delivery, cancellation, and refunds work.",
  order:
    "For a delivery problem, cancellation, or refund request, use these policies and write to support@joscity.com with your order reference.",
  vendor:
    "Business accounts that list on the marketplace are also covered by these policies.",
} as const;

const MarketplacePolicyNotice: React.FC<{
  context: keyof typeof COPY;
}> = ({ context }) => (
  <p className="marketplace-policy-notice">
    {COPY[context]}{" "}
    {LINKS.map((link, index) => (
      <span key={link.to}>
        {index > 0 ? (index === LINKS.length - 1 ? ", and " : ", ") : null}
        <Link to={link.to}>{link.label}</Link>
      </span>
    ))}
    .
  </p>
);

export default MarketplacePolicyNotice;
