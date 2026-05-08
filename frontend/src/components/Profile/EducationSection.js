import { MDBIcon } from 'mdb-react-ui-kit';

const EducationSection = ({ items, onAdd, onDelete }) => (
  <div className="section-card profile-section-card">
    <div className="profile-section-header">
      <h2 className="profile-section-title">Education</h2>
      <button className="profile-add-btn" onClick={onAdd}>
        + Add
      </button>
    </div>
    <div className="profile-section-body">
      {items.length === 0 ? (
        <p className="profile-empty-state">No education added yet.</p>
      ) : (
        items.map((edu) => (
          <div className="profile-entry" key={edu?.educationId}>
            <div className="profile-entry-content">
              <div className="profile-entry-title">{edu?.universityName}</div>
              <div className="profile-entry-subtitle">{edu?.fieldOfStudy}</div>
              <div className="profile-entry-meta">
                {edu?.startDate}
                {edu?.endDate ? ` – ${edu.endDate}` : ' – Present'}
              </div>
              <span
                className={
                  edu?.isPublic
                    ? 'profile-entry-visibility'
                    : 'profile-entry-visibility--private'
                }
              >
                {edu?.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <button
              className="profile-entry-delete"
              onClick={() => onDelete(edu?.educationId)}
              aria-label="Delete"
            >
              <MDBIcon fas icon="times" />
            </button>
          </div>
        ))
      )}
    </div>
  </div>
);

export default EducationSection;
