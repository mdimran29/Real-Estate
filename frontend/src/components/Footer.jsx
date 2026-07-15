const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    url: 'https://github.com/mdimran29',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    name: 'Twitter',
    url: 'https://x.com/itz_Imran29',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/mdimran29/',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    name: 'Email',
    url: 'mailto:dev.mdimran@gmail.com',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
];

const QUICK_LINKS = [
  { name: 'Marketplace', tab: 'marketplace' },
  { name: 'Tokenize Property', tab: 'tokenize' },
  { name: 'Portfolio', tab: 'portfolio' },
  { name: 'About', tab: 'about' },
];

const RESOURCES = [
  { name: 'Smart Contract', href: 'https://sepolia.etherscan.io/address/0xcE5938311925624E9FE619cc493AF5eA16bc46E2', external: true },
  { name: 'GitHub Repository', href: 'https://github.com/mdimran29/Real-Estate', external: true },
  { name: 'Documentation', tab: 'about' },
];

const Footer = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-ink-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow">
                <svg className="w-4.5 h-4.5 text-white" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className="text-lg font-bold font-display text-white">PropToken</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Fractional real estate investment on Ethereum. Tokenize, trade, and earn — transparently, on-chain.
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Quick Links</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.name}>
                  <button
                    onClick={() => onNavigate && onNavigate(link.tab)}
                    className="text-sm text-slate-400 hover:text-brand-300 transition-colors"
                  >
                    {link.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Resources</h4>
            <ul className="space-y-2.5">
              {RESOURCES.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-slate-400 hover:text-brand-300 transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <button
                      onClick={() => onNavigate && onNavigate(link.tab)}
                      className="text-sm text-slate-400 hover:text-brand-300 transition-colors"
                    >
                      {link.name}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Network */}
          <div>
            <h4 className="text-white font-bold text-sm mb-4">Network</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-400 animate-glowPulse" />
                <span className="text-slate-400">Sepolia Testnet</span>
              </div>
              <a
                href="https://sepolia.etherscan.io/address/0xcE5938311925624E9FE619cc493AF5eA16bc46E2"
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                0xcE59…46E2 ↗
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-500">© {currentYear} PropToken. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Built by</span>
            <a
              href="https://github.com/mdimran29"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
            >
              Md Imran
            </a>
          </p>
          <p className="text-xs text-slate-500">
            Powered by <span className="text-slate-300 font-medium">Ethereum</span>
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl">
          <p className="text-xs text-slate-400 text-center leading-relaxed">
            <strong className="text-amber-400">Disclaimer:</strong> This platform runs on the Sepolia testnet
            for demonstration purposes. Real estate tokenization involves risk — do your own research before
            investing. Nothing here is financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
