import { Outlet, useNavigate } from 'react-router-dom';
import AnnouncementBar from '../components/layout/AnnouncementBar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import ChatWidget from '../components/chat/ChatWidget';
import ScrollToTop from '../components/ui/ScrollToTop';
import ToastContainer from '../components/ui/ToastContainer';

/**
 * MainLayout complying with Design.md 3.4
 */
export default function MainLayout({ onSearch, searchQuery }) {
  const navigate = useNavigate();

  const handleSelectProduct = (product) => {
    if (product?.id) {
      navigate(`/products/${product.id}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink antialiased selection:bg-sand selection:text-ink">
      <ToastContainer />
      <AnnouncementBar />
      <Navbar onSearch={onSearch} initialSearchQuery={searchQuery} />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <Outlet context={{ onSelectProduct: handleSelectProduct }} />
      </main>

      <Footer />
      <ChatWidget onSelectProduct={handleSelectProduct} />
      <ScrollToTop />
    </div>
  );
}
