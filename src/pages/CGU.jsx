import LegalPageLayout from '../components/LegalPageLayout';

const LAST_UPDATED = '29 septembre 2026';

export default function CGU() {
  return (
    <LegalPageLayout
      title="Conditions Générales d'Utilisation"
      lastUpdated={LAST_UPDATED}
    >
      <section className="legal-section">
        <h2>Objet</h2>
        <p>
          Les présentes CGU régissent l'utilisation du site CS AB AUTO, plateforme permettant de consulter des annonces de véhicules d'occasion, de créer un compte client, de prendre rendez-vous et d'échanger avec notre équipe.
        </p>
      </section>

      <section className="legal-section">
        <h2>Accès au site</h2>
        <p>
          L'accès aux annonces est libre. La création d'un compte est nécessaire pour prendre rendez-vous, gérer ses véhicules et échanger des messages avec notre équipe.
        </p>
      </section>

      <section className="legal-section">
        <h2>Compte utilisateur</h2>
        <p>
          Chaque utilisateur est responsable de la confidentialité de ses identifiants. Toute activité effectuée depuis son compte est présumée réalisée par lui. En cas d'usage frauduleux constaté, l'utilisateur doit nous en informer immédiatement à [contact@csabauto.fr].
        </p>
      </section>

      <section className="legal-section">
        <h2>Annonces de véhicules</h2>
        <p>
          Les informations et photos des véhicules publiées sur le site sont fournies à titre indicatif et ne constituent pas une offre contractuelle ferme. Les caractéristiques précises et l'état du véhicule doivent être vérifiés directement auprès de nous avant toute transaction.
        </p>
      </section>

      <section className="legal-section">
        <h2>Prise de rendez-vous</h2>
        <p>
          La prise de rendez-vous via le site est une demande soumise à confirmation. CS AB AUTO se réserve le droit d'annuler ou de reprogrammer un rendez-vous en cas d'indisponibilité, avec information préalable du client.
        </p>
      </section>

      <section className="legal-section">
        <h2>Comportement des utilisateurs</h2>
        <p>
          L'utilisateur s'engage à ne pas utiliser le site à des fins frauduleuses, à ne pas transmettre de contenu illicite, injurieux ou trompeur via la messagerie, et à respecter les présentes CGU.
        </p>
      </section>

      <section className="legal-section">
        <h2>Responsabilité</h2>
        <p>
          CS AB AUTO ne saurait être tenu responsable des interruptions temporaires du site liées à la maintenance ou à des causes techniques indépendantes de sa volonté.
        </p>
      </section>

      <section className="legal-section">
        <h2>Modification des CGU</h2>
        <p>
          Les présentes CGU peuvent être modifiées à tout moment. Les utilisateurs seront informés de toute modification substantielle.
        </p>
      </section>

      <section className="legal-section">
        <h2>Droit applicable</h2>
        <p>
          Les présentes CGU sont soumises au droit français. Tout litige relève, à défaut de résolution amiable, des tribunaux compétents.
        </p>
      </section>
    </LegalPageLayout>
  );
}
