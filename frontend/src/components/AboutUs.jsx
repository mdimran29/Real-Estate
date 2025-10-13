import { useState } from 'react';

const AboutUs = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('mission');

  const features = [
    {
      icon: '🏠',
      title: 'Fractional Ownership',
      description: 'Own a piece of premium real estate with as little as 0.001 ETH. No need for massive capital.'
    },
    {
      icon: '⚡',
      title: 'Instant Liquidity',
      description: 'Buy and sell property fractions 24/7 on our marketplace. No waiting for traditional closings.'
    },
    {
      icon: '🔒',
      title: 'Blockchain Security',
      description: 'All transactions are secured by Ethereum smart contracts. Transparent and immutable ownership.'
    },
    {
      icon: '🌍',
      title: 'Global Access',
      description: 'Invest in real estate worldwide from anywhere. Break geographical barriers.'
    },
    {
      icon: '💰',
      title: 'Low Entry Barrier',
      description: 'Start investing with minimal capital. Perfect for first-time real estate investors.'
    },
    {
      icon: '📊',
      title: 'Real-time Trading',
      description: 'Track your portfolio in real-time. Transparent pricing and instant settlements.'
    }
  ];

  const teamStats = [
    { number: '10K+', label: 'Properties Tokenized', icon: '🏢' },
    { number: '$500M+', label: 'Total Value Locked', icon: '💎' },
    { number: '50K+', label: 'Active Investors', icon: '👥' },
    { number: '150+', label: 'Countries Served', icon: '🌐' }
  ];

  const roadmap = [
    {
      phase: 'Phase 1',
      title: 'Foundation',
      status: 'Completed',
      items: ['Smart Contract Development', 'Frontend dApp Launch', 'IPFS Integration', 'Multi-Wallet Support']
    },
    {
      phase: 'Phase 2',
      title: 'Growth',
      status: 'In Progress',
      items: ['Mainnet Deployment', 'Property Verification System', 'Rental Income Distribution', 'Mobile App']
    },
    {
      phase: 'Phase 3',
      title: 'Expansion',
      status: 'Upcoming',
      items: ['Multi-chain Support', 'DAO Governance', 'NFT Marketplace', 'Property Management Tools']
    },
    {
      phase: 'Phase 4',
      title: 'Innovation',
      status: 'Future',
      items: ['AI Property Valuation', 'Metaverse Integration', 'DeFi Lending Protocol', 'Global Property Index']
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-16 animate-fade-in">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          About RealEstate3.0
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          Revolutionizing real estate investment through blockchain technology. 
          Making property ownership accessible, liquid, and transparent for everyone.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap justify-center gap-4 mb-12">
        {['mission', 'features', 'roadmap', 'stats'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 ${
              activeTab === tab
                ? 'bg-gradient-to-r from-primary-600 to-purple-600 text-white shadow-lg'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Mission & Vision */}
      {activeTab === 'mission' && (
        <div className="space-y-8 animate-fade-in">
          <div className="card p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">🎯</div>
              <h2 className="text-3xl font-bold">Our Mission</h2>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              To democratize real estate investment by leveraging blockchain technology, 
              making property ownership accessible to everyone regardless of their location or capital. 
              We believe that real estate investment should be as easy as buying a cup of coffee.
            </p>
          </div>

          <div className="card p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">🔮</div>
              <h2 className="text-3xl font-bold">Our Vision</h2>
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              To create a global, decentralized real estate ecosystem where properties can be tokenized, 
              traded, and managed seamlessly. We envision a future where real estate is as liquid as stocks, 
              accessible as crypto, and transparent as blockchain technology.
            </p>
          </div>

          <div className="card p-8 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl">💡</div>
              <h2 className="text-3xl font-bold">Why Blockchain?</h2>
            </div>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="text-lg leading-relaxed">
                Traditional real estate investment is plagued with problems: high entry barriers, 
                lack of liquidity, geographical limitations, and opacity in transactions.
              </p>
              <p className="text-lg leading-relaxed">
                Blockchain solves all of this by providing:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Fractional ownership through tokenization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>24/7 trading and instant settlements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Complete transparency and immutable records</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Global accessibility without intermediaries</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 text-xl">✓</span>
                  <span>Smart contract automation for secure transactions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Features Grid */}
      {activeTab === 'features' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card p-6 hover:shadow-2xl transition-all transform hover:-translate-y-2 cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Roadmap */}
      {activeTab === 'roadmap' && (
        <div className="space-y-6 animate-fade-in">
          {roadmap.map((phase, index) => (
            <div
              key={index}
              className="card p-6 hover:shadow-xl transition-all"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                    {phase.phase}
                  </span>
                  <h3 className="text-2xl font-bold">{phase.title}</h3>
                </div>
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    phase.status === 'Completed'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : phase.status === 'In Progress'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : phase.status === 'Upcoming'
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {phase.status}
                </span>
              </div>
              <ul className="space-y-2">
                {phase.items.map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <span className="text-primary-600 dark:text-primary-400">▸</span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {activeTab === 'stats' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          {teamStats.map((stat, index) => (
            <div
              key={index}
              className="card p-8 text-center hover:shadow-2xl transition-all transform hover:scale-105"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl mb-4">{stat.icon}</div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 dark:text-gray-400 font-semibold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Technology Stack */}
      <div className="mt-16 card p-8">
        <h2 className="text-3xl font-bold text-center mb-8">Built With Cutting-Edge Technology</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl mb-3">⛓️</div>
            <h3 className="font-bold text-xl mb-2">Ethereum Blockchain</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Secure, decentralized smart contracts for property tokenization
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">🗄️</div>
            <h3 className="font-bold text-xl mb-2">IPFS Storage</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Decentralized metadata storage for property information
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">⚛️</div>
            <h3 className="font-bold text-xl mb-2">React & Web3</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Modern, responsive UI with seamless wallet integration
            </p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center card p-12 bg-gradient-to-r from-primary-600 to-purple-600 text-white">
        <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
        <p className="text-xl mb-8 opacity-90">
          Join thousands of investors who are already building their real estate portfolio on the blockchain
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => onNavigate && onNavigate('marketplace')}
            className="bg-white text-primary-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
          >
            Explore Properties
          </button>
          <button
            onClick={() => onNavigate && onNavigate('tokenize')}
            className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-primary-600 transition-all transform hover:scale-105"
          >
            List Your Property
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
