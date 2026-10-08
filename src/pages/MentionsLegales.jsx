import LegalPageLayout from '../components/LegalPageLayout';

const LAST_UPDATED = '29 septembre 2026';

export default function MentionsLegales() {
    return (
        <LegalPageLayout
            title="Mentions légales"
            lastUpdated={LAST_UPDATED}
        >
            <section className="legal-section">
                <h2>Éditeur du site</h2>
                <p>
                    Le site CS AB AUTO est édité par [Bouzaroura Abdesslam], auto-entrepreneur (micro-entreprise), numéro SIREN [851442152], adresse [3 bis Rue albert thomas 62410 meurchin], téléphone [0663407694], e-mail [contact@csabauto.fr], directeur de la publication [Bouzaroura].
                </p>
            </section>

            <section className="legal-section">
                <h2>Hébergement</h2>
                <p>
                    Le site est hébergé par [OVH], [2 rue Kellermann, 59100 Roubaix, France], [https://www.ovhcloud.com/fr/terms-and-conditions/].
                </p>
            </section>

            <section className="legal-section">
                <h2>Activité</h2>
                <p>
                    Achat Revente Reprise de véhicules d'occasion.
                </p>
            </section>

            <section className="legal-section">
                <h2>Propriété intellectuelle</h2>
                <p>
                    L'ensemble des contenus présents sur ce site (textes, images, logos, structure) est protégé par le droit d'auteur. Toute reproduction, même partielle, est interdite sans autorisation préalable, sauf mention contraire.
                </p>
            </section>

            <section className="legal-section">
                <h2>Limitation de responsabilité</h2>
                <p>
                    CS AB AUTO s'efforce de fournir des informations aussi précises que possible sur les véhicules proposés à la vente. Les caractéristiques, photos et prix sont donnés à titre indicatif et peuvent être modifiés sans préavis. L'utilisateur est invité à vérifier les informations directement auprès de nous avant tout engagement.
                </p>
            </section>

            <section className="legal-section">
                <h2>Médiation de la consommation</h2>
                <p>
                    Conformément à l'article L616-1 du Code de la consommation, CS AB AUTO garantit à ses
                    clients l'accès à un dispositif de médiation de la consommation. Les coordonnées du
                    médiateur seront communiquées prochainement sur cette page.                </p>
            </section>
        </LegalPageLayout>
    );
}
