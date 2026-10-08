
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Services from '../components/Services';
import About from '../components/About';
import VehiclesPreview from '../components/VehiclesPreview';
import Contact from '../components/Contact';
import Footer from '../components/Footer';

import '../assets/css/Home.css';

export default function Home() {
    return (
        <div className="home">

            <Navbar />

            <main>
                <Hero />
                <Stats />
                <Services />
                <About />
                <VehiclesPreview />
                <Contact />
            </main>

            <Footer />

        </div>
    );
}
