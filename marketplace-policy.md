# CURSOR TASK: Implement Joscity Marketplace Legal & Compliance Policy Pages

## Project Context

You are working on the existing Joscity website (https://joscity.com), a Nigerian digital community and marketplace ecosystem connecting individuals, business vendors, and independent service agents.

We are preparing the platform for Paystack merchant compliance approval and need three dedicated, publicly accessible marketplace policy pages.

**Important:** Do not rebuild or redesign the website. First inspect the existing project architecture, routing system, styling conventions, shared components, and design tokens. Implement the new pages consistently with the existing website.

## 1. Required Pages and Exact Routes

Create three dedicated pages using the following exact URL paths:

| Policy Name | URL |
|---|---|
| Acceptable Use Policy | `/acceptable-use` |
| Shipping and Delivery Policy | `/shipping-policy` |
| Returns, Refunds and Cancellation Policy | `/refund-policy` |

These routes must be accessible at:

- https://joscity.com/acceptable-use
- https://joscity.com/shipping-policy
- https://joscity.com/refund-policy

Do not rename these routes or use alternatives.

## 2. UI/UX Design Requirements

Design the pages with a premium, clean, minimal, professional legal-document interface.

### Visual Requirements

- Maintain Joscity's existing color palette, typography, and overall visual identity.
- Use a white or soft neutral reading surface with existing brand colors as subtle accents.
- Provide generous whitespace and excellent readability.
- Use appropriate headings, paragraphs, numbered sections, and lists.
- Avoid unnecessary animations, excessive icons, gradients, illustrations, or decorative elements.
- Ensure excellent responsiveness on mobile, tablet, and desktop.
- Support both light and dark themes if already implemented.

### Page Layout

Each policy page should contain:

1. The existing global navigation.
2. A clear page title.
3. A brief introduction explaining the policy.
4. An effective date and last-updated date.
5. A table of contents with anchor navigation for longer policies.
6. Clearly organized policy sections.
7. Contact and dispute-support information using the platform's existing verified contact channels.
8. The existing website footer.

For desktop, consider a sticky table of contents beside the policy content where it fits the current design.

For mobile, use a compact, collapsible table of contents.

Keep the content width comfortable for reading.

## 3. Acceptable Use Policy

**Route:** `/acceptable-use`

Create a comprehensive policy covering:

1. Introduction and scope.
2. User eligibility and account responsibilities.
3. Personal, Business, and Agent account responsibilities.
4. Vendor onboarding and verification requirements.
5. Accurate product and service listings.
6. Prohibited and restricted goods and services.
7. Fraud, impersonation, and misleading advertising.
8. Pricing transparency and fair marketplace conduct.
9. Intellectual property and counterfeit products.
10. User-generated content and community conduct.
11. Payment-related misuse and unauthorized transactions.
12. Protection of personal information.
13. Reporting prohibited activities.
14. Account restrictions, suspension, and termination.
15. Complaints and appeals.
16. Policy updates and contact information.

Clearly distinguish between required verification, optional verification, and verification indicators.

Do not falsely claim that Joscity verifies every NIN or CAC record unless the repository contains evidence of an implemented verification process.

## 4. Shipping and Delivery Policy

**Route:** `/shipping-policy`

Create a comprehensive policy covering:

1. Introduction and scope.
2. Role of Joscity as a marketplace facilitator.
3. Responsibilities of independent vendors.
4. Responsibilities of customers.
5. Available fulfilment methods.
6. Vendor-managed deliveries.
7. Customer pickup options.
8. Independent agent-assisted procurement and delivery, where operational.
9. Order acceptance and processing.
10. Delivery locations and availability.
11. Shipping costs and fee disclosure.
12. Estimated delivery timelines.
13. Delivery tracking, where supported.
14. Failed deliveries and incorrect addresses.
15. Lost, damaged, missing, or incorrect products.
16. Delivery confirmation and complaints.
17. Third-party logistics providers.
18. Policy updates and support information.

Do not imply that Joscity owns warehouses, manages all inventory, or directly performs every delivery.

Clearly explain that independent vendors handle order fulfilment unless a different arrangement is explicitly supported.

## 5. Returns, Refunds and Cancellation Policy

**Route:** `/refund-policy`

Create a comprehensive policy covering:

1. Introduction and scope.
2. Order cancellation before fulfilment.
3. Cancellation after dispatch.
4. Eligibility for product returns.
5. Incorrect, defective, damaged, or misrepresented goods.
6. Change-of-mind returns, where permitted.
7. Product categories subject to lawful return restrictions.
8. Return request procedures.
9. Supporting evidence and order verification.
10. Vendor response responsibilities.
11. Return shipping responsibilities.
12. Full and partial refunds.
13. Refund processing methods.
14. Refund timelines and payment provider processing.
15. Failed deliveries and non-delivery complaints.
16. Buyer-vendor dispute resolution.
17. Payment disputes and chargebacks.
18. Fraudulent claims and policy abuse.
19. Consumer rights under applicable Nigerian laws.
20. Policy updates and support information.

Ensure that the policy does not promise automatic refunds or fixed refund timelines unless the underlying business process supports them.

Do not create terms that unlawfully restrict statutory consumer rights.

## 6. Website Integration

Add links to all three policies in the website's existing footer under a suitable section such as **Legal** or **Marketplace Policies**.

Use these exact navigation labels:

- Acceptable Use Policy
- Shipping and Delivery Policy
- Returns, Refunds and Cancellation Policy

Also add contextual links to relevant vendor registration, product listing, checkout, and order-support interfaces where appropriate.

Do not introduce unnecessary consent checkboxes or alter existing transaction flows without a justified requirement.

The policy links must be publicly accessible without authentication.

## 7. Technical Requirements

1. Inspect the existing repository to identify the framework and routing conventions.
2. Reuse existing layout components and styling utilities.
3. If the project uses Next.js App Router, implement appropriate route page files and metadata.
4. If it uses another routing structure, follow that structure.
5. Use TypeScript and the project's existing styling system.
6. Create reusable policy layout and table-of-contents components where useful.
7. Add page-specific SEO titles and descriptions.
8. Ensure keyboard accessibility, semantic headings, adequate contrast, and functional anchor links.
9. Verify that all routes work when accessed directly and after refreshing.
10. Ensure policy pages are indexable unless the project's existing SEO requirements dictate otherwise.
11. Add the pages to the sitemap if the project manages one.
12. Avoid new dependencies unless absolutely necessary.

## 8. Content Accuracy and Compliance Safeguards

This implementation is intended for a real marketplace undergoing Paystack compliance review.

Therefore:

- Write complete, professional, understandable policy content, not placeholder paragraphs.
- Align the policies with applicable Nigerian consumer protection and data protection principles.
- Do not invent business registration details, customer support addresses, verification integrations, refund periods, settlement arrangements, or logistics guarantees.
- Where operational facts are unknown, place clearly identified TODO notes in the source for business-owner review before production.
- Do not expose unresolved compliance placeholders on the published website.
- Do not misrepresent proposed features as currently operational.
- Maintain consistency across the three policies and the website's existing Terms of Service and Privacy Policy.
- Keep legal content maintainable and separate from complicated UI logic.

## 9. Testing and Acceptance Criteria

Before completing the task, confirm:

- All three exact URL routes exist and render successfully.
- Pages use the existing Joscity branding.
- No authentication is required.
- All footer links work.
- Table-of-contents links navigate correctly.
- Pages render correctly on mobile.
- No existing website features were broken.
- No build, TypeScript, or lint errors were introduced.
- No unsupported operational claims were added.
- Policy content is complete and ready for business-owner/legal review.
- Metadata and sitemap entries are correct.

## 10. Final Deliverables

Implement the changes directly in the existing codebase.

After implementation, provide a concise report containing:

1. All files created or modified.
2. The three public routes.
3. New reusable components.
4. Footer and navigation changes.
5. Testing results.
6. Any operational details requiring confirmation before publication.

**Final instruction:** This is a production-focused enhancement to the existing Joscity website. Prioritize accurate legal content, readability, maintainable implementation, and compliance transparency. Do not redesign unrelated parts of the website or modify existing business logic unnecessarily.