import { Modal } from 'react-bootstrap';
import './RecommendationsInfoModal.scss';

const SIGNALS = [
  {
    icon: '🎯',
    label: 'Your Skills',
    detail:
      'The platform measures how closely your listed skills align with job titles and post topics using text-similarity scoring.',
  },
  {
    icon: '🤝',
    label: 'Your Connections',
    detail:
      'Content that people in your professional network engage with is weighted more heavily, surfacing what your peers find relevant.',
  },
  {
    icon: '👁️',
    label: 'Your Activity',
    detail:
      'Every post you view and every reaction you leave is a signal. The more you interact, the more accurate your recommendations become.',
  },
];

const RecommendationsInfoModal = ({ show, onHide }) => (
  <Modal
    show={show}
    onHide={onHide}
    centered
    size="lg"
    className="reco-modal-root"
    contentClassName="modal-shell"
    backdropClassName="reco-modal-backdrop"
  >
    <Modal.Header closeButton className="reco-modal__header">
      <Modal.Title className="reco-modal__title">
        How Top Recommendations Work
      </Modal.Title>
    </Modal.Header>

    <Modal.Body className="reco-modal__body">
      <p className="reco-modal__intro">
        The <strong>Top</strong> section on your feed is not random — it is a
        personalised ranking computed specifically for you. Here is how it works
        in plain terms.
      </p>

      <h3 className="reco-modal__section-heading">The Idea Behind It</h3>
      <p className="reco-modal__text">
        ConnectIn uses a technique called
        <strong>Matrix Factorisation</strong>. Imagine a giant table where rows
        are users and columns are posts or jobs. Each cell represents how much a
        user would value that item. Most cells are blank — you have not seen
        everything. The algorithm fills in the blanks by discovering hidden
        patterns shared between users with similar profiles and behaviour.
      </p>

      <h3 className="reco-modal__section-heading">What It Looks At</h3>
      <ul className="reco-modal__signals">
        {SIGNALS.map(({ icon, label, detail }) => (
          <li key={label} className="reco-modal__signal-item">
            <span className="reco-modal__signal-icon" aria-hidden="true">
              {icon}
            </span>
            <div>
              <span className="reco-modal__signal-label">{label}</span>
              <span className="reco-modal__signal-detail">{detail}</span>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="reco-modal__section-heading">How Often It Updates</h3>
      <p className="reco-modal__text">
        The engine runs automatically in the background every{' '}
        <strong>3 hours</strong>. Each refresh re-trains on the latest
        interactions, so your Top section stays current as you and your network
        stay active.
      </p>

      <p className="reco-modal__note">
        Only your public profile data and interactions (views, reactions) are
        used. Private messages are never factored in.
      </p>
    </Modal.Body>

    <Modal.Footer className="reco-modal__footer">
      <button className="settings-card-btn" onClick={onHide}>
        Got it
      </button>
    </Modal.Footer>
  </Modal>
);

export default RecommendationsInfoModal;
