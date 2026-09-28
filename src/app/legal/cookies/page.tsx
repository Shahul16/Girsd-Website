import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How GIRSD (Q TECH PRIVATE LTD) uses cookies and similar storage technologies on globalrsd.co.uk.",
  alternates: { canonical: "/legal/cookies" },
};

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Cookie Policy" updated="23 July 2026">
      <h2>1. What are cookies</h2>
      <p>
        Cookies are small text files placed on your device when you visit a
        website. They let a site remember information about your visit, such
        as your preferences or whether you are signed in. This policy covers
        cookies and equivalent browser storage (such as localStorage) used on
        globalrsd.co.uk.
      </p>

      <h2>2. The choice you make</h2>
      <p>
        On your first visit, a banner asks you to choose <strong>&ldquo;Accept
        all&rdquo;</strong> or <strong>&ldquo;Necessary only&rdquo;</strong>. Strictly necessary
        storage is used either way, since the site cannot function without it
        (see section 3). Choosing &ldquo;Necessary only&rdquo; simply means we do not
        set the optional analytics cookies described in section 4. Your choice
        is remembered in your browser so the banner does not reappear on
        return visits; you can change your mind at any time by clearing your
        browser&apos;s site data for globalrsd.co.uk, which will show the banner
        again.
      </p>

      <h2>3. Strictly necessary storage (always on)</h2>
      <ul>
        <li><strong>Authentication session</strong> — keeps you signed in to your member account (provided by Supabase).</li>
        <li><strong>Checkout session</strong> — lets Stripe process your payment securely and return you to the correct confirmation page.</li>
        <li><strong>Cookie preference</strong> — remembers the choice you made in the cookie banner itself.</li>
      </ul>
      <p>
        These cannot be disabled through our cookie banner because the
        relevant features (logging in, paying for tickets, courses or
        membership) would not work without them. You can block them at the
        browser level, but parts of the site will then not function correctly.
      </p>

      <h2>4. Analytics cookies (optional)</h2>
      <p>
        With your consent, we may use privacy-respecting analytics to
        understand which pages are visited and how the site can be improved.
        These cookies do not identify you personally and are never used for
        advertising. They are only set if you choose &ldquo;Accept all&rdquo;. If no
        analytics tool is active on the site at a given time, choosing
        &ldquo;Accept all&rdquo; has no additional effect beyond recording your
        preference.
      </p>

      <h2>5. No advertising cookies</h2>
      <p>
        We do not use third-party advertising or cross-site tracking cookies,
        and we do not sell personal data. If this ever changes, we will update
        this policy and the consent banner accordingly.
      </p>

      <h2>6. Third-party services</h2>
      <p>
        Some pages embed or link to third-party services (for example,
        Stripe&apos;s secure checkout, or WhatsApp for support chat). These
        providers may set their own cookies under their own privacy policies,
        which we do not control. We recommend reviewing their policies
        directly if you have concerns.
      </p>

      <h2>7. Managing cookies in your browser</h2>
      <p>
        Most browsers let you view, delete, and block cookies through their
        settings menu. Blocking all cookies will affect the functionality of
        this and most other websites. Instructions vary by browser; search
        your browser&apos;s help pages for &ldquo;manage cookies&rdquo;.
      </p>

      <h2>8. Changes and contact</h2>
      <p>
        We may update this Cookie Policy from time to time; the &ldquo;last
        updated&rdquo; date above will reflect the most recent revision. For
        questions about this policy, see our{" "}
        <a href="/legal/privacy">Privacy Policy</a> or contact us using the
        details below.
      </p>
    </LegalPage>
  );
}
