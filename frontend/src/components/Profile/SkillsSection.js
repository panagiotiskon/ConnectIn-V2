import { MDBIcon } from 'mdb-react-ui-kit';

const SkillsSection = ({ items, onAdd, onDelete }) => (
  <div className="section-card profile-section-card">
    <div className="profile-section-header">
      <h2 className="profile-section-title">Skills</h2>
      <button className="profile-add-btn" onClick={onAdd}>
        + Add
      </button>
    </div>
    <div className="profile-section-body">
      {items.length === 0 ? (
        <p className="profile-empty-state">No skills added yet.</p>
      ) : (
        items.map((skill) => (
          <div className="profile-entry" key={skill?.skillId}>
            <div className="profile-entry-content">
              <div className="profile-entry-title">{skill?.skillTitle}</div>
              <div className="profile-entry-subtitle">{skill?.skillDescription}</div>
              <span
                className={
                  skill?.isPublic
                    ? 'profile-entry-visibility'
                    : 'profile-entry-visibility--private'
                }
              >
                {skill?.isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <button
              className="profile-entry-delete"
              onClick={() => onDelete(skill?.skillId)}
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

export default SkillsSection;
