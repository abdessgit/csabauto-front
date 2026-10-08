
import '../assets/css/Services.css';

const services = [
    {
        number: '01',
        title: 'ENTRETIEN',
        text: 'Entretien courant et révision de votre véhicule.'
    },
    {
        number: '02',
        title: 'MÉCANIQUE',
        text: 'Interventions mécaniques et réparations automobiles.'
    },
    {
        number: '03',
        title: 'DISTRIBUTION',
        text: 'Remplacement de courroie et kit de distribution.'
    },
    {
        number: '04',
        title: 'EMBRAYAGE',
        text: 'Remplacement d’embrayage et volant moteur.'
    },
    {
        number: '05',
        title: 'MOTEUR',
        text: 'Remplacement et interventions sur moteur.'
    },
    {
        number: '06',
        title: 'DIAGNOSTIC',
        text: 'Diagnostic électronique et recherche de panne.'
    },
];

export default function Services() {
    return (
        <section className="services" id="services">

            <div className="section-header">

                <div>
                    <p className="section-label">
                        CE QUE NOUS FAISONS
                    </p>

                    <h2>
                        NOS <span>SERVICES</span>
                    </h2>
                </div>

                <p>
                    Une prise en charge professionnelle de votre
                    véhicule, de l'entretien à la réparation.
                </p>

            </div>

            <div className="services-grid">

                {services.map((service) => (
                    <article className="service-card" key={service.number}>

                        <span className="service-number">
                            {service.number}
                        </span>

                        <h3>{service.title}</h3>

                        <p>{service.text}</p>

                        <span className="service-arrow">
                            →
                        </span>

                    </article>
                ))}

            </div>

        </section>
    );
}