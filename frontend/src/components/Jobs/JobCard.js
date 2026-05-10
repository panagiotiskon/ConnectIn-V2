import ProfileLink from '../common/ProfileLink';

export const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '—');

export const groupApplicationsByJob = (applications) => {
  const appMap = {};
  (applications || []).forEach(({ jobPostId, userId, fullName }) => {
    if (!appMap[jobPostId]) appMap[jobPostId] = new Map();
    appMap[jobPostId].set(userId, { userId, fullName });
  });
  return Object.fromEntries(
    Object.entries(appMap).map(([id, map]) => [id, Array.from(map.values())])
  );
};

const JobCard = ({ job, showCreatedBy = false, badge, actions, children, ...props }) => (
  <div className="jobs-entry" {...props}>
    <div className="jobs-entry-content">
      {badge ? (
        <div className="jobs-entry-title-row">
          <span className="jobs-entry-title">{job.jobTitle}</span>
          {badge}
        </div>
      ) : (
        <div className="jobs-entry-title">{job.jobTitle}</div>
      )}
      <div className="jobs-entry-subtitle">{job.companyName}</div>
      <div className="jobs-entry-meta">
        {formatDate(job.createdAt)}
        {showCreatedBy && (
          <>
            {' · '}By <ProfileLink userId={job.userId}>{job.createdBy}</ProfileLink>
          </>
        )}
      </div>
      <div className="jobs-entry-description">{job.jobDescription}</div>
      {children}
    </div>
    <div className="jobs-entry-actions">{actions}</div>
  </div>
);

export default JobCard;
