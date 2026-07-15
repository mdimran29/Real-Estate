import { useState } from 'react';

const TABS = ['mission', 'features', 'roadmap', 'stack'];

const FEATURES = [
  { icon: '🏠', title: 'Fractional Ownership', description: 'Own a piece of premium real estate with as little as 0.001 ETH — no need for massive capital.' },
  { icon: '⚡', title: 'Instant Liquidity', description: 'Buy and sell property fractions any time on the primary market or the peer-to-peer secondary market.' },
  { icon: '🔒', title: 'Blockchain Security', description: 'Ownership is enforced by audited OpenZeppelin smart contracts — transparent and immutable.' },
  { icon: '💵', title: 'Rental Income', description: 'Property owners deposit rental income on-chain; fraction holders claim their pro-rata share any time.' },
  { icon: '💰', title: 'Low Entry Barrier', description: 'Start investing with minimal capital — perfect for first-time real estate investors.' },
  { icon: '📊', title: 'Live USD Pricing', description: 'A Chainlink price feed converts fraction prices to USD in real time alongside ETH.' },
];

const ROADMAP = [
  { phase: 'Phase 1', title: 'Foundation', status: 'Completed', items: ['PropertyDeed (ERC-721) + PropertyFractions (ERC-20)', 'TokenizationManager orchestration contract', 'IPFS metadata storage', 'Multi-wallet support (MetaMask, Coinbase, Trust, WalletConnect)'] },
  { phase: 'Phase 2', title: 'Tier 1 Features', status: 'Completed', items: ['Rental income distribution (pull-payment)', 'Peer-to-peer secondary fraction marketplace', 'Chainlink ETH/USD price oracle', 'Sepolia testnet deployment'] },
  { phase: 'Phase 3', title: 'Expansion', status: 'Planned', items: ['Balance-snapshot rental accounting (ERC20Snapshot)', 'Property verification workflow', 'Mainnet deployment', 'Mobile-optimized PWA'] },
  { phase: 'Phase 4', title: 'Ecosystem', status: 'Future', items: ['DAO governance for property decisions', 'Multi-chain deployment', 'DeFi lending against fractions', 'Property management tooling'] },
];

const STACK = [
  { icon: '⛓️', title: 'Solidity + Hardhat', description: 'OpenZeppelin-based contracts with 100+ tests covering tokenization, marketplace, and rental income flows.' },
  { icon: '🗄️', title: 'IPFS via Pinata', description: 'Property metadata and images are pinned to IPFS and resolved through multiple gateway fallbacks.' },
  { icon: '⚛️', title: 'React + ethers.js', description: 'A Vite-powered React app talking directly to contracts through ethers.js — no backend required.' },
];

const statusStyle = {
  Completed: 'bg-accent-500/15 text-accent-300 ring-accent-500/30',
  'In Progress': 'bg-brand-500/15 text-brand-300 ring-brand-500/30',
  Planned: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  Future: 'bg-white/[0.06] text-slate-400 ring-white/10',
};

const AboutUs = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('mission');

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      {/* Hero */}
      <div className="text-center animate-fadeUp">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          About <span className="gradient-text">PropToken</span>
        </h1>
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
          Real estate investment reimagined on-chain — fractional, liquid, and transparent.
          Built as a full-stack Web3 demo on Ethereum's Sepolia testnet.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 animate-fadeUp animate-delay-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? 'tab-pill-active !bg-gradient-to-r !from-brand-500 !to-accent-500 !text-white' : 'tab-pill-inactive bg-white/[0.03] border border-white/[0.06]'}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Mission */}
      {activeTab === 'mission' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="panel p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🎯</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Our Mission</h2>
            </div>
            <p className="text-slate-400 leading-relaxed">
              To democratize real estate investment by leveraging blockchain technology, making property
              ownership accessible regardless of location or capital. Real estate investing should be as
              simple as a token swap.
            </p>
          </div>

          <div className="panel p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🔮</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Our Vision</h2>
            </div>
            <p className="text-slate-400 leading-relaxed">
              A global, decentralized real estate ecosystem where properties are tokenized, traded, and
              managed seamlessly — as liquid as stocks, as accessible as crypto, and as transparent as
              the blockchain itself.
            </p>
          </div>

          <div className="panel p-6 sm:p-8 bg-gradient-to-br from-brand-500/[0.08] to-accent-500/[0.04]">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">💡</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Why Blockchain?</h2>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              Traditional real estate is plagued by high entry barriers, illiquidity, geographic limits,
              and opaque transactions. Blockchain fixes each of these directly:
            </p>
            <ul className="space-y-2.5">
              {[
                'Fractional ownership through tokenization',
                'Trading and instant settlement, any time',
                'Complete transparency via immutable records',
                'Global access without intermediaries',
                'Smart-contract automation for secure transactions',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-slate-300 text-sm">
                  <svg className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Features */}
      {activeTab === 'features' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fadeIn">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.title}
              className="panel panel-hover p-6 animate-fadeUp"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-4 animate-fadeIn">
          {ROADMAP.map((phase, i) => (
            <div key={phase.phase} className="panel p-6 animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <div>
                  <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">{phase.phase}</span>
                  <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                </div>
                <span className={`badge ring-1 ring-inset ${statusStyle[phase.status]}`}>{phase.status}</span>
              </div>
              <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="text-brand-400">▸</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Stack */}
      {activeTab === 'stack' && (
        <div className="grid sm:grid-cols-3 gap-5 animate-fadeIn">
          {STACK.map((tech, i) => (
            <div key={tech.title} className="panel p-6 text-center animate-fadeUp" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="text-4xl mb-3">{tech.icon}</div>
              <h3 className="font-bold text-white mb-2">{tech.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{tech.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="panel p-8 sm:p-12 text-center bg-gradient-to-br from-brand-600 to-accent-600 border-0 animate-fadeUp">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Ready to get started?</h2>
        <p className="text-white/80 mb-7 max-w-xl mx-auto">
          Connect a wallet, browse tokenized properties, and start building a fractional real estate portfolio.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => onNavigate && onNavigate('marketplace')}
            className="bg-white text-brand-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-all active:scale-[0.97]"
          >
            Explore Properties
          </button>
          <button
            onClick={() => onNavigate && onNavigate('tokenize')}
            className="bg-white/10 border border-white/30 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-all active:scale-[0.97]"
          >
            List Your Property
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
