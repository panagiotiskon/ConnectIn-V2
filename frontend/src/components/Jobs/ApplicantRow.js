import { MDBIcon } from 'mdb-react-ui-kit';
import OptimizedImage from '../common/OptimizedImage';
import useProfileImage from '../../hooks/useProfileImage';

const ApplicantRow = ({ applicant, onClick }) => {
  const { profileImage } = useProfileImage(applicant.userId);
  return (
    <div
      className={`jobs-applicant-row${!applicant.userId ? ' jobs-applicant-row--disabled' : ''}`}
      onClick={onClick}
    >
      <OptimizedImage
        src={profileImage}
        alt={applicant.fullName}
        className="jobs-applicant-avatar"
        fallbackSrc="/profile-pic.png"
      />
      <span className="jobs-applicant-name">{applicant.fullName}</span>
      {applicant.userId && (
        <MDBIcon fas icon="arrow-right" className="jobs-applicant-arrow" />
      )}
    </div>
  );
};

export default ApplicantRow;
