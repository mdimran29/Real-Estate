import { useState } from 'react';
import { Web3Provider } from './contexts/Web3Context';
import Navbar from './components/Navbar';
import TokenizeProperty from './components/TokenizeProperty';
import Marketplace from './components/Marketplace';
import Portfolio from './components/Portfolio';
import AboutUs from './components/AboutUs';
import Footer from './components/Footer';
import ToastContainer from './components/Toast';
import './App.css';

console.log('App.jsx is loading...');

function App() {
  console.log('App component rendering...');
  const [activeTab, setActiveTab] = useState('marketplace');

  const handleNavigation = (tab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'tokenize':
        return <TokenizeProperty onSuccess={() => setActiveTab('marketplace')} />;
      case 'marketplace':
        return <Marketplace />;
      case 'buy':
        return <Marketplace showOnlyAvailable={true} />;
      case 'portfolio':
        return <Portfolio />;
      case 'about':
        return <AboutUs onNavigate={handleNavigation} />;
      default:
        return <Marketplace />;
    }
  };

  return (
    <Web3Provider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('marketplace')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'marketplace'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Marketplace</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('tokenize')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'tokenize'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Tokenize Property</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('buy')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'buy'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    <span>Buy Fractions</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'portfolio'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>My Portfolio</span>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('about')}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === 'about'
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>About Us</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="animate-fadeIn">
            {renderContent()}
          </div>
        </main>

        {/* Professional Footer */}
        <Footer onNavigate={handleNavigation} />
        
        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </Web3Provider>
  );
}

export default App;

