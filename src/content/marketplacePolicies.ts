// TODO(business review): Confirm whether a verification badge means a government
// registry check of NIN or CAC records. The published text requires CAC on a
// business account and does not claim a registry match.
// TODO(business review): Confirm any owned delivery fleet or warehouse. The
// published text treats fulfilment as vendor-managed.

export const POLICY_EFFECTIVE_DATE = "19 October 2026";
export const POLICY_UPDATED_DATE = "19 October 2026";

export const POLICY_SUPPORT = {
  email: "support@joscity.com",
  phone: "+234 7067621916",
  phoneHref: "tel:+2347067621916",
  place: "Jos, Plateau State, Nigeria",
};

export type PolicyBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] };

export type PolicySection = {
  id: string;
  title: string;
  blocks: PolicyBlock[];
};

export type MarketplacePolicy = {
  path: string;
  title: string;
  seoTitle: string;
  description: string;
  intro: string;
  sections: PolicySection[];
};

const contactBlocks: PolicyBlock[] = [
  {
    type: "p",
    text: "We may update these marketplace policies when our services, payment methods, or legal duties change. The effective date and last-updated date at the top of the page show the version in force. Continued use of the marketplace after an update is subject to the revised policy, except where Nigerian law requires a different notice.",
  },
  {
    type: "p",
    text: "Questions, complaints, and appeals about marketplace conduct, delivery, or refunds can be sent to support@joscity.com or +234 7067621916. JosCity Smart Services, Jos, Plateau State, Nigeria. Please include your account name, order reference, and a short description of the issue.",
  },
  {
    type: "p",
    text: "These pages sit alongside our [Terms of Service](/terms-of-service) and [Privacy Policy](/privacy-policy). If a statement here conflicts with a right that cannot be waived under Nigerian law, the law prevails.",
  },
];

export const acceptableUsePolicy: MarketplacePolicy = {
  path: "/acceptable-use",
  title: "Acceptable Use Policy",
  seoTitle: "Acceptable Use Policy | Joscity",
  description:
    "Rules for personal, business, and agent accounts on the Joscity marketplace, including prohibited goods, listings, payments, and enforcement.",
  intro:
    "This policy explains how people, businesses, and independent agents may use the Joscity marketplace and community. It applies to accounts, listings, messages, payments, and other activity on joscity.com and the Joscity apps.",
  sections: [
    {
      id: "introduction",
      title: "1. Introduction and scope",
      blocks: [
        {
          type: "p",
          text: "Joscity is a digital community and marketplace. It connects members, independent business vendors, and independent service agents. Joscity provides the platform. It does not become the seller of a vendor’s goods or the employer of an independent agent merely because a listing or order appears on the platform.",
        },
        {
          type: "p",
          text: "This Acceptable Use Policy applies to everyone who visits, registers, lists, buys, sells, messages, or pays through Joscity. It also applies to content you upload. Our [Terms of Service](/terms-of-service), [Privacy Policy](/privacy-policy), [Shipping and Delivery Policy](/shipping-policy), and [Returns, Refunds and Cancellation Policy](/refund-policy) apply together with this page.",
        },
      ],
    },
    {
      id: "eligibility",
      title: "2. User eligibility and account responsibilities",
      blocks: [
        {
          type: "p",
          text: "You may open an account only if you can lawfully use the service and enter a contract under Nigerian law. You must give a name and contact details that are accurate and that you are entitled to use. You are responsible for activity under your login, including orders and listings placed while you are signed in.",
        },
        {
          type: "list",
          items: [
            "Keep your password private and tell us if you believe the account is being used without your permission.",
            "Do not sell, rent, or share your account for someone else to trade under your name.",
            "Do not create another account to avoid a restriction, suspension, or unpaid dispute.",
            "Use the contact details on your account for genuine marketplace communication.",
          ],
        },
      ],
    },
    {
      id: "account-types",
      title: "3. Personal, Business, and Agent accounts",
      blocks: [
        {
          type: "p",
          text: "Joscity offers more than one account type. Use the type that matches how you take part.",
        },
        {
          type: "list",
          items: [
            "Personal accounts are for members who browse, buy, and use community features.",
            "Business accounts are for vendors who list goods or services. The person registering must be authorised to bind that business.",
            "Agent accounts are for independent service agents who offer services the platform makes available, such as procurement or delivery assistance where that service is actually listed. An agent is not a Joscity employee and does not fulfil every marketplace order.",
          ],
        },
        {
          type: "p",
          text: "You must not present a personal account as a registered business, or an agent account as the seller of another vendor’s goods, unless that relationship is stated on the listing and is lawful.",
        },
      ],
    },
    {
      id: "onboarding",
      title: "4. Vendor onboarding and verification",
      blocks: [
        {
          type: "p",
          text: "Verification on Joscity has three different meanings. They are not the same thing.",
        },
        {
          type: "list",
          items: [
            "Required to trade: a working account with accurate identity and contact details, and acceptance of the terms shown when a business account is created. A business account must also provide its CAC.",
            "Optional information: a National Identification Number, if you choose to provide it. Providing it is not, by itself, a statement that Joscity has matched it to a government registry.",
            "Verification indicators: a badge or similar mark means Joscity has reviewed the information submitted for that indicator. It does not mean that every NIN or CAC record on the platform has been confirmed with a government registry, unless the indicator itself says that a specific check was completed.",
          ],
        },
        {
          type: "p",
          text: "A business account that has not provided its CAC is suspended 7 days after the signup day. The 7 days run from the day the business account is created. Suspension stays in place until CAC is provided. Vendors must not display a badge they have not been given, or claim a licence, award, or official status they do not hold. Joscity may ask for further information before a listing stays public, and may refuse or remove a vendor that will not provide it.",
        },
      ],
    },
    {
      id: "listings",
      title: "5. Accurate product and service listings",
      blocks: [
        {
          type: "p",
          text: "Listings must describe what a buyer will actually receive. Title, price, photos, quantity, condition, location, and any delivery or collection option must be truthful and kept up to date. If a listing is for a service, state what the service includes and what it does not include.",
        },
        {
          type: "p",
          text: "Do not copy another seller’s photos or description and present them as your own offer. Do not hide material limits, such as a used item, a partial quantity, or a service that depends on the buyer’s location.",
        },
      ],
    },
    {
      id: "prohibited",
      title: "6. Prohibited and restricted goods and services",
      blocks: [
        {
          type: "p",
          text: "You may not list, buy, sell, or arrange any of the following on Joscity:",
        },
        {
          type: "list",
          items: [
            "Anything illegal under Nigerian law, including stolen property.",
            "Weapons, ammunition, explosives, and instructions intended for violent harm.",
            "Controlled or counterfeit drugs, and medicines offered without the licence the law requires.",
            "Counterfeit or pirated goods.",
            "Child sexual abuse material, or any sexual content or service involving anyone under 18.",
            "Wildlife, cultural property, or other goods traded in breach of Nigerian law.",
            "Fraudulent financial schemes, including pyramid schemes and fake investment offers.",
            "Goods or services that infringe another person’s intellectual property or privacy.",
          ],
        },
        {
          type: "p",
          text: "Some goods and services are restricted rather than always forbidden. Alcohol, tobacco, medicines, and regulated professional or financial services may be listed only by a vendor who holds the lawful authority to offer them, and only with the restrictions the law requires. Joscity does not promise that every restricted listing has been licensed-checked before it appears.",
        },
      ],
    },
    {
      id: "fraud",
      title: "7. Fraud, impersonation, and misleading advertising",
      blocks: [
        {
          type: "p",
          text: "You may not impersonate Joscity, a payment provider, another member, or a public authority. You may not invent reviews, orders, or stock. Prices, discounts, and “limited” claims must be genuine. Phishing, malware, and requests for another person’s password or one-time code are prohibited.",
        },
      ],
    },
    {
      id: "pricing",
      title: "8. Pricing transparency and fair conduct",
      blocks: [
        {
          type: "p",
          text: "The price and any delivery or service fee that applies must be shown before the buyer confirms the order. Do not add a charge after confirmation that was not disclosed. Do not manipulate reviews, harass a buyer or vendor, or interfere with another person’s listing.",
        },
      ],
    },
    {
      id: "ip",
      title: "9. Intellectual property and counterfeit products",
      blocks: [
        {
          type: "p",
          text: "List and upload only content you own or have permission to use. Counterfeit goods, unauthorised copies, and misleading use of another brand are prohibited. Joscity may remove a listing or content after a credible complaint, and may suspend repeat infringement.",
        },
      ],
    },
    {
      id: "content",
      title: "10. User-generated content and community conduct",
      blocks: [
        {
          type: "p",
          text: "Messages, comments, photos, and listings must comply with this policy and our [Community Guidelines](/community-guidelines). Do not harass, threaten, or publish another person’s private information. Child safety rules on our [Child Safety](/child-safety) page apply across the marketplace.",
        },
      ],
    },
    {
      id: "payments",
      title: "11. Payment-related misuse",
      blocks: [
        {
          type: "p",
          text: "Pay only through the methods presented at checkout for that order. Marketplace payments are processed by the payment provider shown there. Where Paystack is used, the vendor’s share is settled to the vendor and Joscity receives its commission. Do not ask a buyer to pay off-platform in order to evade a dispute, a fee, or a record of the order.",
        },
        {
          type: "p",
          text: "You may not use a payment method you are not authorised to use, submit false payment details, or reverse a payment after receiving the goods or service without a genuine dispute. Joscity does not hold customer or vendor funds from a marketplace sale for later distribution. Wallet funding, withdrawals, transfers, and stored value are not provided through Paystack. Unauthorised transactions should be reported to support@joscity.com as soon as you notice them.",
        },
      ],
    },
    {
      id: "privacy",
      title: "12. Protection of personal information",
      blocks: [
        {
          type: "p",
          text: "How Joscity handles personal information is described in the [Privacy Policy](/privacy-policy). Vendors and agents may use a buyer’s name, phone, email, and delivery details only to fulfil that order, handle a complaint about it, or meet a legal duty. They may not sell those details or use them for unrelated marketing.",
        },
      ],
    },
    {
      id: "reporting",
      title: "13. Reporting prohibited activity",
      blocks: [
        {
          type: "p",
          text: "Report a prohibited listing, scam, or abusive account to support@joscity.com. Include links or screenshots and the account or order reference if you have it. Where the product shows a report tool, you may use that as well. We review reports and may ask for more detail. Submitting a report does not by itself decide a refund.",
        },
      ],
    },
    {
      id: "enforcement",
      title: "14. Account restrictions, suspension, and termination",
      blocks: [
        {
          type: "p",
          text: "If an account, listing, or payment breaks this policy or the law, Joscity may remove content, refuse a listing, hold an order review, limit features, or suspend or close the account. Serious fraud, child-safety violations, and repeated abuse can lead to closure without prior notice. We may also keep the records our [Privacy Policy](/privacy-policy) describes for fraud prevention and legal duties.",
        },
      ],
    },
    {
      id: "appeals",
      title: "15. Complaints and appeals",
      blocks: [
        {
          type: "p",
          text: "If your listing or account is restricted and you believe that was a mistake, write to support@joscity.com with the account name and an explanation. We will review the appeal. An appeal is not a guarantee that the restriction will be lifted. Buyer and vendor disputes about a particular order are also covered by the [Returns, Refunds and Cancellation Policy](/refund-policy).",
        },
      ],
    },
    {
      id: "updates",
      title: "16. Policy updates and contact",
      blocks: contactBlocks,
    },
  ],
};

export const shippingPolicy: MarketplacePolicy = {
  path: "/shipping-policy",
  title: "Shipping and Delivery Policy",
  seoTitle: "Shipping and Delivery Policy | Joscity",
  description:
    "How delivery, pickup, and agent-assisted fulfilment work on the Joscity marketplace. Vendors fulfil their own orders unless a listing says otherwise.",
  intro:
    "This policy explains how goods and services ordered on the Joscity marketplace are handed over. Independent vendors fulfil their own orders unless a listing clearly states a different arrangement.",
  sections: [
    {
      id: "introduction",
      title: "1. Introduction and scope",
      blocks: [
        {
          type: "p",
          text: "This policy covers physical goods and services ordered through Joscity listings. It applies to buyers, vendors, and independent agents who take part in a delivery or pickup that the platform records. It does not cover community posts that are not orders.",
        },
      ],
    },
    {
      id: "facilitator",
      title: "2. Joscity’s role",
      blocks: [
        {
          type: "p",
          text: "Joscity provides the marketplace, checkout, and support channel. Joscity does not own the vendor’s stock, does not run a warehouse for marketplace sellers, and does not carry out every delivery. A delivery estimate on a listing is the vendor’s estimate unless the listing says Joscity itself has committed to that time.",
        },
      ],
    },
    {
      id: "vendors",
      title: "3. Vendor responsibilities",
      blocks: [
        {
          type: "list",
          items: [
            "Pack and dispatch goods that match the listing, or provide the service described.",
            "State the fulfilment method the buyer can actually use, such as vendor delivery, pickup, or an agent-assisted option where that option is offered.",
            "Show shipping or service fees before the buyer confirms.",
            "Give the buyer a realistic time range, and update the buyer if the order will be late.",
            "Keep proof of dispatch or handover where that is reasonable for the type of order.",
          ],
        },
      ],
    },
    {
      id: "customers",
      title: "4. Customer responsibilities",
      blocks: [
        {
          type: "list",
          items: [
            "Give a complete delivery location, phone number, and any access instruction the vendor needs.",
            "Be available at the time and place you agreed, or name a person who can receive the order.",
            "Check the goods on receipt when it is practical, and tell the vendor promptly if something is missing, damaged, or not what you ordered.",
            "Do not refuse a delivery that matches the confirmed order solely to force a refund that the [Returns, Refunds and Cancellation Policy](/refund-policy) does not support.",
          ],
        },
      ],
    },
    {
      id: "methods",
      title: "5. Fulfilment methods",
      blocks: [
        {
          type: "p",
          text: "An order is fulfilled by the method the listing and checkout describe. That may be delivery arranged by the vendor, collection by the buyer, or help from an independent agent where that service is offered on the order. If a listing is silent, assume the vendor is responsible for agreeing handover with you. Joscity does not add a fulfilment method that neither the listing nor the vendor has offered.",
        },
      ],
    },
    {
      id: "vendor-delivery",
      title: "6. Vendor-managed delivery",
      blocks: [
        {
          type: "p",
          text: "Where the vendor delivers, the vendor chooses the means of transport and any courier. The vendor remains responsible to the buyer for sending the correct item. Joscity is not the carrier.",
        },
      ],
    },
    {
      id: "pickup",
      title: "7. Customer pickup",
      blocks: [
        {
          type: "p",
          text: "Pickup is available only when the vendor offers it and states where and when collection can happen. The buyer should collect within the period the vendor gives. Goods left uncollected may be treated under the vendor’s stated holding practice and the [Returns, Refunds and Cancellation Policy](/refund-policy). Joscity does not store uncollected orders at a Joscity warehouse.",
        },
      ],
    },
    {
      id: "agents",
      title: "8. Independent agent assistance",
      blocks: [
        {
          type: "p",
          text: "Some orders may involve an independent agent, for example where a listed agent service covers procurement or delivery. That happens only when the service is offered and selected. The agent is an independent provider, not Joscity staff, and is not assigned to every marketplace order. The listing or checkout should make clear what the agent will do.",
        },
      ],
    },
    {
      id: "acceptance",
      title: "9. Order acceptance and processing",
      blocks: [
        {
          type: "p",
          text: "Placing an order is an offer to buy on the terms shown at checkout. A vendor may be unable to accept an order that is out of stock, outside their service area, or priced in error. If an order cannot be fulfilled, the vendor should say so, and any payment already taken for that unfulfilled order is handled under the [Returns, Refunds and Cancellation Policy](/refund-policy). Checkout uses the payment provider shown on that order. Marketplace proceeds are not taken into Joscity’s account for later payout to the vendor.",
        },
      ],
    },
    {
      id: "locations",
      title: "10. Delivery locations and availability",
      blocks: [
        {
          type: "p",
          text: "Vendors decide where they deliver or attend. An address outside that area can be declined. Availability can change with stock, working hours, and public conditions such as road closures. Joscity does not guarantee nationwide delivery.",
        },
      ],
    },
    {
      id: "fees",
      title: "11. Shipping costs and fee disclosure",
      blocks: [
        {
          type: "p",
          text: "Any delivery or service fee must appear before you confirm. The checkout total shown for your order is the amount you are asked to pay for that order. A vendor must not demand an extra delivery fee after confirmation unless you agree a change, such as a new address.",
        },
      ],
    },
    {
      id: "timelines",
      title: "12. Estimated delivery timelines",
      blocks: [
        {
          type: "p",
          text: "Dates and time ranges on a listing are estimates from the vendor unless the listing states a firmer commitment. Estimates can move because of stock, traffic, weather, or a courier. A missed estimate is a reason to contact the vendor and, if needed, Joscity support. It is not an automatic refund.",
        },
      ],
    },
    {
      id: "tracking",
      title: "13. Delivery tracking",
      blocks: [
        {
          type: "p",
          text: "Tracking is available only when the vendor or their courier provides it. Joscity does not operate a tracking network for every order. If a tracking reference is shared with you, use it with the carrier named on that reference.",
        },
      ],
    },
    {
      id: "failed",
      title: "14. Failed deliveries and incorrect addresses",
      blocks: [
        {
          type: "p",
          text: "If a delivery fails because the address or phone number was incomplete or wrong, or because no one was available to receive the order, the vendor may contact you to rearrange handover. A further delivery attempt can carry an extra fee if that fee is explained before you accept the new attempt. If the failure is the vendor’s or courier’s fault, you should not be charged again for the same delivery.",
        },
      ],
    },
    {
      id: "problems",
      title: "15. Lost, damaged, missing, or incorrect products",
      blocks: [
        {
          type: "p",
          text: "Tell the vendor and support@joscity.com if an order is lost, arrives damaged, is incomplete, or is not what you bought. Include the order reference and photos where you can. The vendor should investigate. Remedies, including replacement or refund, follow the [Returns, Refunds and Cancellation Policy](/refund-policy) and do not happen automatically.",
        },
      ],
    },
    {
      id: "confirmation",
      title: "16. Delivery confirmation and complaints",
      blocks: [
        {
          type: "p",
          text: "Where the product asks you to confirm receipt, that confirmation means you received the order, not that you waive a later complaint about a defect you could not reasonably have seen. Complaints about non-delivery should be sent to the vendor and to support@joscity.com with the order reference.",
        },
      ],
    },
    {
      id: "logistics",
      title: "17. Third-party logistics providers",
      blocks: [
        {
          type: "p",
          text: "Couriers and other logistics companies used by a vendor or agent are independent providers. Their own conditions may apply to the carriage they perform. Joscity is not that carrier and does not insure every shipment. A vendor who chooses a courier remains responsible to the buyer for sending the goods described in the order.",
        },
      ],
    },
    {
      id: "updates",
      title: "18. Policy updates and support",
      blocks: contactBlocks,
    },
  ],
};

export const refundPolicy: MarketplacePolicy = {
  path: "/refund-policy",
  title: "Returns, Refunds and Cancellation Policy",
  seoTitle: "Returns, Refunds and Cancellation Policy | Joscity",
  description:
    "How to cancel, return, or dispute a Joscity marketplace order. Paystack refunds return to the original payment method where that process supports it. Joscity reviews complaints and marketplace disputes.",
  intro:
    "This policy explains cancellation, returns, and refunds for orders placed on the Joscity marketplace. Joscity reviews complaints and marketplace disputes. A payment made through Paystack is refunded through the Paystack refund process, to the original payment method where that process supports it. After a refund is agreed, Joscity finishes its review within 2 working days, and no later than 3 days. Rights you have under Nigerian law still apply.",
  sections: [
    {
      id: "introduction",
      title: "1. Introduction and scope",
      blocks: [
        {
          type: "p",
          text: "This policy applies to goods and services bought from independent vendors through Joscity. Joscity provides the marketplace and a support channel. The vendor is responsible for the goods or service they sold, unless a listing clearly names a different provider. Read it with the [Shipping and Delivery Policy](/shipping-policy) and the [Acceptable Use Policy](/acceptable-use).",
        },
      ],
    },
    {
      id: "before",
      title: "2. Cancellation before fulfilment",
      blocks: [
        {
          type: "p",
          text: "You may ask to cancel while the vendor has not dispatched the goods or started the service. Contact the vendor and support@joscity.com with the order reference. If the vendor confirms that fulfilment has not started, amounts you paid for that unfulfilled order can be refunded. A cancellation is not finished until the vendor or Joscity support confirms it.",
        },
      ],
    },
    {
      id: "after-dispatch",
      title: "3. Cancellation after dispatch",
      blocks: [
        {
          type: "p",
          text: "After goods have been dispatched, or after a service has started, a request is treated as a return or a dispute, not as an automatic cancellation. You may still ask the vendor to stop a service that has not been completed. Charges for work already done can remain payable.",
        },
      ],
    },
    {
      id: "eligibility",
      title: "4. Eligibility for product returns",
      blocks: [
        {
          type: "p",
          text: "You can request a return or other remedy when the goods are incorrect, defective, damaged in transit, incomplete, or materially different from the listing. A return request should be made within a reasonable time after delivery. What is reasonable depends on the product. Perishable goods need a faster report than durable goods.",
        },
      ],
    },
    {
      id: "defects",
      title: "5. Incorrect, defective, damaged, or misrepresented goods",
      blocks: [
        {
          type: "p",
          text: "If the vendor sent the wrong item, or the item is faulty, damaged, or not as described, tell the vendor and support@joscity.com. Provide the order reference and photos or other evidence. The vendor should offer a practical remedy, which may be a replacement, a repair, a partial refund, or a full refund. Joscity may help the parties reach that outcome. The remedy is not issued automatically.",
        },
      ],
    },
    {
      id: "change-of-mind",
      title: "6. Change-of-mind returns",
      blocks: [
        {
          type: "p",
          text: "Joscity does not require every vendor to accept a return simply because a buyer changed their mind. A change-of-mind return is available only when that vendor’s listing says so, or when the vendor agrees. If it is allowed, the listing or the vendor will state the condition of the goods and who pays return shipping.",
        },
      ],
    },
    {
      id: "restrictions",
      title: "7. Categories with lawful return limits",
      blocks: [
        {
          type: "p",
          text: "Some items are poorly suited to a change-of-mind return. Vendors may refuse that kind of return for perishable goods, personalised goods, intimate or hygiene products unsealed after delivery, digital items already supplied, and services already performed. This limit does not remove a remedy where the goods are defective, unsafe, or not as described, or where Nigerian law requires one.",
        },
      ],
    },
    {
      id: "procedure",
      title: "8. How to request a return",
      blocks: [
        {
          type: "list",
          items: [
            "Write to the vendor and to support@joscity.com.",
            "Include the order reference, what you bought, and what went wrong.",
            "Do not use or damage the goods further, except as needed to inspect the problem.",
            "Wait for instructions before sending an item back, so it is not lost in transit without a record.",
          ],
        },
      ],
    },
    {
      id: "evidence",
      title: "9. Evidence and order checks",
      blocks: [
        {
          type: "p",
          text: "We or the vendor may ask for photos, a short description, and confirmation of the account that placed the order. We may also check the payment record. Asking for evidence is how false and genuine claims are told apart. It is not a refusal of a valid complaint.",
        },
      ],
    },
    {
      id: "vendor-response",
      title: "10. Vendor response",
      blocks: [
        {
          type: "p",
          text: "Vendors are expected to answer return and non-delivery complaints promptly and in good faith. If a vendor does not respond, contact support@joscity.com and we will review the order record. Joscity may ask the vendor to fulfil, replace, or refund where the record supports that outcome. That review is case by case.",
        },
      ],
    },
    {
      id: "return-shipping",
      title: "11. Return shipping",
      blocks: [
        {
          type: "p",
          text: "If the goods were wrong, defective, damaged, or not as described, the vendor bears the reasonable cost of return or collection. If the vendor agrees a change-of-mind return, the listing or the vendor’s reply states who pays. Joscity does not run a returns warehouse.",
        },
      ],
    },
    {
      id: "partial",
      title: "12. Full and partial refunds",
      blocks: [
        {
          type: "p",
          text: "A full refund covers the amount paid for the goods or service that were not provided as agreed, including a delivery fee for a delivery that did not happen because of the vendor. A partial refund may apply when only some items are affected, when a service was partly performed, or when you keep a discounted item by agreement. Not every complaint is a refund. Once a refund is due, it must be settled on the timeline in section 14.",
        },
      ],
    },
    {
      id: "method",
      title: "13. How refunds are sent",
      blocks: [
        {
          type: "p",
          text: "A refund for a payment made through Paystack follows the Paystack refund process. Where that process supports it, the money is returned to the original payment method. Joscity does not keep marketplace proceeds in its business account and then pay a refund from that pot. If a payment was not made through Paystack, the refund uses the method shown for that order.",
        },
      ],
    },
    {
      id: "timelines",
      title: "14. Timelines and payment providers",
      blocks: [
        {
          type: "p",
          text: "Joscity reviews a refund request and, where a review is needed, completes that review within 2 working days, and no later than 3 days after the review starts. Once a Paystack refund is started, the money is returned to the original payment method where Paystack supports that. Paystack and the buyer’s bank control how long the credit then takes to appear. We will tell you when the refund has been started.",
        },
      ],
    },
    {
      id: "non-delivery",
      title: "15. Failed delivery and non-delivery",
      blocks: [
        {
          type: "p",
          text: "If an order is not delivered, or a pickup never becomes available, contact the vendor and support@joscity.com. Give the address you provided and the date you expected. If the vendor cannot show that the order was handed over as agreed, you may seek a refund of the unfulfilled amount or a fresh delivery. A failed attempt caused by an incorrect address is handled under the [Shipping and Delivery Policy](/shipping-policy).",
        },
      ],
    },
    {
      id: "disputes",
      title: "16. Buyer and vendor disputes",
      blocks: [
        {
          type: "p",
          text: "Try to resolve the issue with the vendor first, using the order reference. If you cannot, write to support@joscity.com. We will look at the listing, messages, payment record, and evidence both sides provide. We may propose a replacement, a partial refund, a full refund, or no refund. Our help does not replace a right to go to a court or a regulator.",
        },
      ],
    },
    {
      id: "chargebacks",
      title: "17. Payment disputes and chargebacks",
      blocks: [
        {
          type: "p",
          text: "Contact support@joscity.com before opening a dispute with a bank or payment provider, so the order can be checked. You may still use a scheme your payment provider offers. A chargeback or bank recall is not a second refund. If a payment is reversed after you have already received a refund or the goods, Joscity or the vendor may recover the duplicated amount. Filing a dispute does not by itself decide the marketplace case.",
        },
      ],
    },
    {
      id: "abuse",
      title: "18. Fraudulent claims and policy abuse",
      blocks: [
        {
          type: "p",
          text: "Claims that are false, that use stolen photos, or that try to keep the goods and the money, breach the [Acceptable Use Policy](/acceptable-use). Joscity may refuse the claim and restrict the account. A genuine complaint made in good faith is not abuse, even if the outcome is that a refund is not due.",
        },
      ],
    },
    {
      id: "law",
      title: "19. Nigerian consumer rights",
      blocks: [
        {
          type: "p",
          text: "Nothing in this policy limits a right that cannot be waived under Nigerian law, including rights under the Federal Competition and Consumer Protection Act. If a good is unsafe, defective, or not as described, you may have remedies beyond a voluntary change-of-mind return. You may also complain to the Federal Competition and Consumer Protection Commission or seek a court remedy.",
        },
      ],
    },
    {
      id: "updates",
      title: "20. Policy updates and support",
      blocks: contactBlocks,
    },
  ],
};

export const marketplacePolicies = [
  acceptableUsePolicy,
  shippingPolicy,
  refundPolicy,
];
