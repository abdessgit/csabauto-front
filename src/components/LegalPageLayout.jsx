import { useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import '../assets/css/LegalPage.css';

export default function LegalPageLayout({ title, lastUpdated, children }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="legal-page">
      <Navbar />

      <main className="legal-main">
        <article className="legal-container">
          <header className="legal-header">
            <h1>{title}</h1>
            {lastUpdated && (
              <p className="legal-updated">Dernière mise à jour : {lastUpdated}</p>
            )}
          </header>

          <div className="legal-content">
            {children}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
