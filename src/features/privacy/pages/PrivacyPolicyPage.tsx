import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Database, Lock, UserCog } from "lucide-react";
import privacyHero from "@/assets/privacy/pravicy.png";

type PrivacySection = {
  id: string;
  number: string;
  title: string;
  summary: string;
  paragraphs: string[];
  bullets?: string[];
};

const PRIVACY_SECTIONS: PrivacySection[] = [
  {
    id: "introduction",
    number: "1",
    title: "Introduction",
    summary:
      "How this Privacy Policy applies to buyers and sellers on Ecommerce.",
    paragraphs: [
      "Welcome to the Ecommerce platform (“Ecommerce”, “we”, “us”, or “our”). We take our responsibilities under applicable privacy laws and regulations (“Privacy Laws”) seriously and are committed to respecting the privacy rights of everyone who uses our website and mobile application (the “Platform”) and the services described on them (together, the “Services”).",
      "“Users”, “you”, or “your” means anyone who registers for an account or uses the Services, including buyers and sellers. This Privacy Policy explains how we collect, use, disclose, and process personal data you provide or that we hold about you, and helps you make an informed decision before sharing personal data with us.",
      "“Personal data” means data about an individual who can be identified from that data alone, or from that data together with other information we have or are likely to have access to — for example a name, contact details, or an identification number.",
      "By using the Services, registering an account, visiting the Platform, or accessing the Services, you acknowledge this Policy and consent to the collection, use, disclosure, and processing of your personal data as described here. If you do not agree, please do not use our Services or access our Platform. We may update this Policy from time to time; material changes will be posted on the Platform. Continued use after updates constitutes acceptance of the revised Policy to the fullest extent permitted by law.",
      "This Policy applies together with other notices and contractual or consent clauses relating to personal data, and applies to both buyers and sellers unless we state otherwise.",
    ],
  },
  {
    id: "when-we-collect",
    number: "2",
    title: "When will Ecommerce collect personal data?",
    summary: "Situations and sources from which we may collect your data.",
    paragraphs: ["We will or may collect personal data about you when you:"],
    bullets: [
      "Register for or use our Services or Platform, or open an account with us",
      "Submit forms relating to our products or services (online or in hard copy)",
      "Enter into agreements or provide documents for interactions with us",
      "Contact us by phone, email, chat, social media, letters, or in person (calls may be recorded)",
      "Use our electronic services, apps, or website features, including via cookies",
      "Grant device permissions to share information with our app or Platform",
      "Link your Ecommerce account to a social or other external account",
      "Carry out transactions through our Services",
      "Provide feedback or complaints, register for a contest, or otherwise submit personal data to us",
    ],
  },
  {
    id: "what-we-collect",
    number: "3",
    title: "What personal data will Ecommerce collect?",
    summary: "Types of information we may collect from users.",
    paragraphs: [
      "Personal data we may collect includes, but is not limited to:",
    ],
    bullets: [
      "Name, email address, date of birth, gender, and telephone number",
      "Billing and/or delivery address",
      "Bank account and payment information (processed via payment partners where applicable)",
      "Device and network information used to access the Services or Platform",
      "Photographs, audio, or video where you provide them or use media features",
      "Government-issued ID or other details needed for verification, KYC, or fraud prevention",
      "Marketing and communications preferences and history with us or our partners",
      "Usage and transaction data (searches, orders, ads and content you interact with)",
      "Location data, where you allow it",
      "Other information you provide when signing up or using the Services, and aggregated engagement data",
    ],
  },
  {
    id: "other-data",
    number: "4",
    title: "Collection of other data",
    summary:
      "Technical, device, and location information logged by our systems.",
    paragraphs: [
      "Like most websites and apps, your device sends information that may be logged by our servers when you browse the Platform. This can include IP address, operating system and browser type, device type and identifiers, referring site, pages visited and visit times, and cookies (which you can often disable in browser settings). If you are logged in, this may be linked to your account and also used in anonymous statistics to understand how visitors use our site.",
      "Our mobile applications may collect precise location using technologies such as GPS or Wi‑Fi to provide location-based features or relevant content. You can usually withdraw location permission in your device settings.",
      "When you view pages, ads, or other software on the Platform, your device may send us technical details about that interaction (for example IP address and operating system) rather than only classic page-view logs.",
    ],
  },
  {
    id: "cookies",
    number: "5",
    title: "Cookies",
    summary: "How cookies and similar technologies support the Platform.",
    paragraphs: [
      "We or our authorised service providers and advertising partners may use cookies or similar features to collect or share information about your use of the Services. Cookies help us improve the Platform, offer new features, analyse usage, keep track of your shopping cart, personalise content, and (where applicable) support advertising and remarketing.",
      "You may refuse cookies via your browser or device settings. Doing so may limit some functionality of the Platform or Services.",
    ],
  },
  {
    id: "how-we-use",
    number: "6",
    title: "How do we use the information you provide us?",
    summary: "Purposes for which we process personal data.",
    paragraphs: [
      "We may collect, use, disclose, and/or process your personal data for purposes including:",
    ],
    bullets: [
      "Processing applications, orders, and transactions, and fulfilling product or service requests",
      "Managing your account, preferences, and relationship with us",
      "Customer service, notifications about service issues, and unusual account activity",
      "Enforcing our Terms of Service and protecting users’ safety, rights, and property",
      "Identity verification, due diligence, KYC, fraud prevention, and risk screening",
      "Research, analytics, product improvement, and personalised recommendations",
      "Marketing and promotions (you may unsubscribe or adjust preferences at any time)",
      "Loyalty, partner, and co-branded programmes where offered",
      "Complying with law, responding to legal process, and meeting regulatory requirements",
      "Audits, statistics, internal reporting, and securing backups or disaster recovery",
      "Investigating suspected breaches of our terms, fraud, or misconduct",
      "Business transfers (for example merger or sale of assets) where personal data is among transferred assets",
      "Other purposes we notify you of when obtaining your consent",
    ],
  },
  {
    id: "protect-retain",
    number: "7",
    title: "How does Ecommerce protect and retain information?",
    summary: "Security measures and how long we keep personal data.",
    paragraphs: [
      "We implement a variety of security measures and strive to protect personal data on our systems. Access is limited to personnel who need it for their roles. Absolute security cannot be guaranteed.",
      "We retain personal data in line with Privacy Laws and other applicable laws. We destroy or anonymise data when the purpose of collection is no longer served by retention, retention is no longer needed for legal or business purposes, and no other legitimate interest requires keeping it. If you stop using the Platform or your access ends, we may still store, use, or disclose data as allowed by this Policy and the law. Subject to applicable law, we may securely dispose of personal data without prior notice.",
    ],
  },
  {
    id: "disclosure",
    number: "8",
    title: "Does Ecommerce disclose information to outside parties?",
    summary: "When and with whom we may share personal data.",
    paragraphs: [
      "To operate our business we may use, process, disclose, or transfer personal data to third-party service providers, agents, affiliates, or other parties (in or outside your country) for the purposes described in this Policy. This may include when you link or integrate your account with third-party services. We endeavour to require that such parties keep data secure and retain it only as needed.",
      "Such parties may include affiliates; buyers or sellers you transact with; contractors such as logistics, payment, IT, cloud, marketing, and telecom providers; governmental or regulatory authorities where required or permitted; and successors in a merger or business asset transaction.",
      "Where Privacy Laws permit processing without consent, those permissions continue to apply. We may also share aggregated or demographic statistics with advertising partners. Third parties may unlawfully intercept data despite reasonable security arrangements; we deploy protections required by Privacy Laws but cannot guarantee absolute security.",
      "Sellers who receive buyer personal data through the Services must use it only as reasonably necessary to complete transactions and respond to enquiries, must not contact buyers outside the Platform without proper consent, must not disclose it to unauthorised parties, must protect and delete or return it when no longer needed, and must notify us promptly of any suspected data breach.",
    ],
  },
  {
    id: "children",
    number: "9",
    title: "Information on children",
    summary: "Our Services are not directed to young children.",
    paragraphs: [
      "The Services are not intended for children under the age of 13. We do not knowingly collect personal data from anyone under 13, and no part of our Platform is directed to them. Parents or guardians should not allow children under their care to submit personal data to us. If such data is disclosed, you consent to processing on the child’s behalf under this Policy. We will close accounts used exclusively by such children and remove data we believe was submitted without parental consent.",
    ],
  },
  {
    id: "third-party-collection",
    number: "10",
    title: "Information collected by third parties",
    summary: "Analytics and third-party apps available through the Platform.",
    paragraphs: [
      "Our Platform may use analytics tools (for example web analytics services) that use cookies to help us understand how Users use the Platform. Information generated about your use may be processed by those providers under their own policies.",
      "Third-party software or apps offered via the Platform may access or request information directly. Those products are not owned or controlled by Ecommerce. Please read their terms and privacy policies before use.",
    ],
  },
  {
    id: "third-party-sites",
    number: "11",
    title: "Disclaimer regarding security and third-party sites",
    summary: "Linked sites and co-branded services have separate practices.",
    paragraphs: [
      "We do not guarantee the security of personal data you provide on third-party sites. We maintain security measures for data in our possession, including limited access and encryption where appropriate for orders and sensitive information.",
      "We may link to or frame third-party websites, or participate in co-branded offerings. Those sites have independent privacy and security practices. Even if affiliated with us, we do not control them and may not receive data they collect. Access linked sites at your own risk; we welcome feedback if a link is broken or problematic.",
    ],
  },
  {
    id: "overseas-transfer",
    number: "12",
    title: "Will Ecommerce transfer your information overseas?",
    summary: "Cross-border storage and processing of personal data.",
    paragraphs: [
      "Your personal data may be transferred to, stored, or processed outside your country for one or more of the purposes in this Policy. We transfer information overseas only in accordance with applicable Privacy Laws.",
    ],
  },
  {
    id: "your-rights",
    number: "13",
    title: "Withdraw consent, access, or correct your information",
    summary: "How to manage consent and your personal data.",
    paragraphs: [
      "You may withdraw consent for collection, use, or disclosure of personal data, or request deletion where applicable, by contacting our Personal Data Protection Officer at privacy@ecommerce.example. We will process requests under this Policy and applicable law. Withdrawal may mean we can no longer provide the Services and may need to end your account relationship.",
      "If you have an account, you can often access or correct profile data in Account Settings. Otherwise, send a written request to privacy@ecommerce.example with enough information for us to verify your identity and understand your request. We may charge a reasonable fee for access requests where permitted by law and will provide an estimate if we do. We may refuse correction where Privacy Laws allow or require refusal.",
    ],
  },
  {
    id: "contact",
    number: "14",
    title: "Questions, concerns, or complaints? Contact us",
    summary: "How to reach our Personal Data Protection Officer.",
    paragraphs: [
      "If you have questions or concerns about our privacy practices, contact us at privacy@ecommerce.example. We welcome feedback and will respond in accordance with applicable Privacy Laws.",
      "Last updated: 8 September 2026.",
    ],
  },
];

const PrivacyPolicyPage = () => {
  const [openId, setOpenId] = useState<string | null>(
    PRIVACY_SECTIONS[0]?.id ?? null,
  );
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRIVACY_SECTIONS;
    return PRIVACY_SECTIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.paragraphs.some((p) => p.toLowerCase().includes(q)) ||
        s.bullets?.some((b) => b.toLowerCase().includes(q)),
    );
  }, [query]);

  return (
    <div className="bg-[#dfeae3] pb-10">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[var(--dni-cart-border)] bg-gradient-to-br from-[#dfeae3] via-[#edf7f0] to-[#f7faf8]">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.12) 0, transparent 42%), radial-gradient(circle at 85% 10%, rgba(5, 150, 105, 0.08) 0, transparent 38%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium uppercase tracking-widest text-emerald-600">
                Help Centre · Privacy
              </p>
              <h1 className="mt-3 max-w-3xl text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-gray-900">
                Ecommerce Privacy Policy
              </h1>
              <p className="mt-4 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed">
                How we collect, use, disclose, and protect your personal data —
                structured like a clear marketplace help-centre privacy guide.
              </p>
              <div className="mt-8 max-w-xl">
                <label htmlFor="privacy-search" className="sr-only">
                  Search privacy policy
                </label>
                <input
                  id="privacy-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search privacy policy…"
                  className="w-full rounded-sm border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="relative hidden overflow-hidden rounded-sm border border-[var(--dni-cart-border)] bg-white shadow-sm lg:block">
              <img
                src={privacyHero}
                alt="Data protection, privacy, and secure handling of personal information"
                className="h-full w-full object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Overview cards */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <Database size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                What we collect
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Account, order, device, and support information.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <Lock size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                How we protect it
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Access controls, secure networks, and careful retention.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-sm border border-[var(--dni-cart-border)] bg-white p-4 sm:p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">
              <UserCog size={20} strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Your choices
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
                Access, correct, or withdraw consent for your data.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sections — Help Centre style */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="bg-white border border-[var(--dni-cart-border)] rounded-sm overflow-hidden">
          <div className="border-b border-[var(--dni-cart-border)] px-5 py-4 sm:px-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Privacy Policy
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} section{filtered.length === 1 ? "" : "s"}
            </p>
          </div>

          {filtered.length === 0 ? (
            <p className="px-5 py-8 sm:px-6 text-sm text-gray-500">
              No sections match your search. Try a different keyword.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((section) => {
                const isOpen = openId === section.id;
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : section.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-4 sm:px-6 text-left hover:bg-gray-50 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base font-medium text-gray-900">
                          <span className="text-emerald-600 mr-2">
                            {section.number}.
                          </span>
                          {section.title}
                        </p>
                        <p className="mt-0.5 text-xs sm:text-sm text-gray-500 line-clamp-1">
                          {section.summary}
                        </p>
                      </div>
                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180 text-emerald-600" : ""}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-50 bg-[#fafafa] px-5 py-5 sm:px-6 sm:py-6">
                        <div className="max-w-3xl space-y-3">
                          {section.paragraphs.map((p) => (
                            <p
                              key={p.slice(0, 48)}
                              className="text-sm text-gray-600 leading-relaxed"
                            >
                              {p}
                            </p>
                          ))}
                          {section.bullets && (
                            <ul className="space-y-2 pt-1">
                              {section.bullets.map((item) => (
                                <li
                                  key={item}
                                  className="flex gap-2 text-sm text-gray-600"
                                >
                                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />
                                  <span className="leading-relaxed">
                                    {item}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 mt-8">
        <div className="rounded-sm border border-[var(--dni-cart-border)] bg-gradient-to-br from-emerald-50 via-white to-gray-50 px-6 py-10 sm:px-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Need more help?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-xl mx-auto">
            Review marketplace policies or learn more about Ecommerce.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to="/policies"
              className="inline-flex items-center justify-center rounded bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Policies
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center rounded border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
            >
              About Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
