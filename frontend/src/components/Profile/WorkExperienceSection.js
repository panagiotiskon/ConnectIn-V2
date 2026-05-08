import { MDBIcon } from 'mdb-react-ui-kit';

const WorkExperienceSection = ({ items, onAdd, onDelete }) => (
  <div className="section-card profile-section-card">
    <div className="profile-section-header">
      <h2 className="profile-section-title">Work Experience</h2>
      <button className="profile-add-btn" onClick={onAdd}>
        + Add
      </button>
    </div>
    <div className="profile-section-body">
      {items.length === 0 ? (
        <p className="profile-empty-state">No work experience added yet.</p>
      ) : (
        items.map((exp) => (
          <div className="profile-entry" key={exp.experienceId}>
            <div className="profile-entry-content">
              <div className="profile-entry-title">{exp?.jobTitle}</div>
              <div className="profile-entry-subtitle">{exp?.companyName}</div>
              <div className="profile-entry-meta">
                {exp?.startDate}
                {exp?.endDate ? ` – ${exp.endDate}` : ' – Present'}
              </div>
              <span
                className={
                  exp?.isPublic
                    ? 'profile-entry-visibility'
                    : 'profile-entry-visibility--private'
                }
              >
                {exp?.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <button
              className="profile-entry-delete"
              onClick={() => onDelete(exp?.experienceId)}
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

export default WorkExperienceSection;
