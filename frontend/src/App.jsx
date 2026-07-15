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

function App() {
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
        return <Marketplace showOnlyAvailable />;
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
      <div className="min-h-screen flex flex-col">
        <Navbar activeTab={activeTab} onNavigate={handleNavigation} />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div key={activeTab} className="animate-fadeUp">
            {renderContent()}
          </div>
        </main>

        <Footer onNavigate={handleNavigation} />
        <ToastContainer />
      </div>
    </Web3Provider>
  );
}

export default App;
