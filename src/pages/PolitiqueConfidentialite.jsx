import LegalPageLayout from '../components/LegalPageLayout';

const LAST_UPDATED = '29 septembre 2026';

export default function PolitiqueConfidentialite() {
  return (
    <LegalPageLayout
      title="Politique de confidentialité"
      lastUpdated={LAST_UPDATED}
    >
      <section className="legal-section">
        <h2>Responsable du traitement</h2>
        <p>
          [Bouzaroura Abdesslam], auto-entrepreneur, [3 bis Rue Albert Thomas 62410 Meurchin ], [contact@csabauto.fr], est responsable du traitement des données personnelles collectées sur ce site.
        </p>
      </section>

      <section className="legal-section">
        <h2>Données collectées</h2>
        <p>
          Dans le cadre de l'utilisation du site, nous collectons : données de compte (nom, prénom, e-mail, mot de passe haché, téléphone) ; données liées à vos véhicules (marque, modèle, immatriculation, kilométrage) ; données de prise de rendez-vous (date, motif, véhicule concerné) ; messages échangés avec notre équipe via l'espace client ; données techniques de connexion nécessaires au fonctionnement du site (cookies essentiels de session). Nous n'utilisons actuellement aucun cookie de mesure d'audience ni de publicité. Si cela évolue, cette politique sera mise à jour et un bandeau de consentement vous sera présenté avant tout dépôt de cookie non essentiel.
        </p>
      </section>

      <section className="legal-section">
        <h2>Finalités</h2>
        <p>
          Ces données sont utilisées pour créer et gérer votre compte client ; gérer vos demandes de rendez-vous et vos véhicules ; vous permettre d'échanger avec notre équipe ; vous envoyer les e-mails nécessaires au fonctionnement du service (confirmation de compte, réinitialisation de mot de passe, confirmation de rendez-vous).
        </p>
      </section>

      <section className="legal-section">
        <h2>Base légale</h2>
        <p>
          Le traitement repose sur l'exécution du contrat qui vous lie à nous et sur notre intérêt légitime à assurer le bon fonctionnement du service.
        </p>
      </section>

      <section className="legal-section">
        <h2>Destinataires des données</h2>
        <p>
          Vos données ne sont accessibles qu'à [CSAB AUTO] et à ses éventuels sous-traitants techniques (hébergeur, service d'envoi d'e-mails). Elles ne sont jamais vendues à des tiers.
        </p>
      </section>

      <section className="legal-section">
        <h2>Durée de conservation</h2>
        <p>
          Vos données sont conservées pendant la durée de votre relation avec nous, puis archivées ou supprimées conformément aux obligations légales.
        </p>
      </section>

      <section className="legal-section">
        <h2>Vos droits</h2>
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de vos données. Vous pouvez exercer ces droits en nous écrivant à [contact@csabauto.fr]. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).
        </p>
      </section>

      <section className="legal-section">
        <h2>Sécurité</h2>
        <p>
          Vos mots de passe sont chiffrés (hachés) et ne sont jamais stockés ni consultables en clair. Nous mettons en œuvre des mesures raisonnables pour protéger vos données contre tout accès non autorisé.
        </p>
      </section>
    </LegalPageLayout>
  );
}
