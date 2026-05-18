import { useEffect, useState } from 'react';
import { MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { useParams, useNavigate } from 'react-router-dom';
import NavBarAdmin from '../Admin/NavBarAdmin';
import ProfileCard from '../common/ProfileCard';
import PersonalInfoService from '../../api/UserAPI';
import { useAuth } from '../../context/AuthContext';
import NavbarComponent from '../common/NavBar';
import '../../routes/ProtectedRoute.scss';
import './ViewProfile.scss';

const ViewProfile = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [cardsContent, setCardsContent] = useState({
    'Work Experience': [],
    Education: [],
    Skills: [],
  });
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await PersonalInfoService.getUser(userId);

        if (!isAdmin && userData?.role === 'ROLE_ADMIN') {
          navigate('/unauthorized');
          return;
        }

        setUser(userData);

        const [educationData, workExperienceData, skillData] =
          await Promise.all([
            PersonalInfoService.getEducation(userId),
            PersonalInfoService.getExperience(userId),
            PersonalInfoService.getSkills(userId),
          ]);

        const formattedEducationData = educationData
          .filter(({ isPublic }) => isAdmin || isPublic)
          .map(({ universityName, fieldOfStudy, startDate, endDate, isPublic }) => ({
            universityName, fieldOfStudy, startDate, endDate, isPublic,
          }));

        const formattedExperienceData = workExperienceData
          .filter(({ isPublic }) => isAdmin || isPublic)
          .map(({ jobTitle, companyName, startDate, endDate, isPublic }) => ({
            jobTitle, companyName, startDate, endDate, isPublic,
          }));

        const formattedSkillData = skillData
          .filter(({ isPublic }) => isAdmin || isPublic)
          .map(({ skillTitle, skillDescription, isPublic }) => ({
            skillTitle, skillDescription, isPublic,
          }));

        setCardsContent({
          'Work Experience': formattedExperienceData,
          Education: formattedEducationData,
          Skills: formattedSkillData,
        });
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };

    fetchData();
  }, [userId, navigate, isAdmin]);

  if (!user) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center protected-route-loader">
        <img
          src="/connectin-logo.png"
          alt="ConnectIn Logo"
          className="pulsing-logo"
        />
      </div>
    );
  }
  return (
    <div>
      {isAdmin ? <NavBarAdmin /> : <NavbarComponent />}

      <MDBContainer fluid className="profile-page">
        <MDBRow>
          <MDBCol md="4" className="mb-4 mb-md-0">
            <ProfileCard currentUser={user} isViewOnly={true} />
          </MDBCol>

          <MDBCol md="8">
            <div className="profile-sections">
              {/* Work Experience */}
              <div className="section-card profile-section-card">
                <div className="section-header">
                  <h2 className="section-title">Work Experience</h2>
                </div>
                <div className="section-body">
                  {cardsContent['Work Experience'].length === 0 ? (
                    <p className="empty-state">
                      No work experience added yet.
                    </p>
                  ) : (
                    cardsContent['Work Experience'].map(({ jobTitle, companyName, startDate, endDate, isPublic }) => (
                      <div
                        className="profile-entry"
                        key={jobTitle + startDate}
                      >
                        <div className="profile-entry-content">
                          <div className="profile-entry-title">
                            {jobTitle}
                          </div>
                          <div className="profile-entry-subtitle">
                            {companyName}
                          </div>
                          <div className="profile-entry-meta">
                            {startDate}
                            {endDate ? ` – ${endDate}` : ' – Present'}
                          </div>
                          <span
                            className={
                              isPublic
                                ? 'profile-entry-visibility'
                                : 'profile-entry-visibility--private'
                            }
                          >
                            {isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Education */}
              <div className="section-card profile-section-card">
                <div className="section-header">
                  <h2 className="section-title">Education</h2>
                </div>
                <div className="section-body">
                  {cardsContent.Education.length === 0 ? (
                    <p className="empty-state">
                      No education added yet.
                    </p>
                  ) : (
                    cardsContent.Education.map(({ universityName, fieldOfStudy, startDate, endDate, isPublic }) => (
                      <div
                        className="profile-entry"
                        key={universityName + startDate}
                      >
                        <div className="profile-entry-content">
                          <div className="profile-entry-title">
                            {universityName}
                          </div>
                          <div className="profile-entry-subtitle">
                            {fieldOfStudy}
                          </div>
                          <div className="profile-entry-meta">
                            {startDate}
                            {endDate ? ` – ${endDate}` : ' – Present'}
                          </div>
                          <span
                            className={
                              isPublic
                                ? 'profile-entry-visibility'
                                : 'profile-entry-visibility--private'
                            }
                          >
                            {isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Skills */}
              <div className="section-card profile-section-card">
                <div className="section-header">
                  <h2 className="section-title">Skills</h2>
                </div>
                <div className="section-body">
                  {cardsContent.Skills.length === 0 ? (
                    <p className="empty-state">No skills added yet.</p>
                  ) : (
                    cardsContent.Skills.map(({ skillTitle, skillDescription, isPublic }) => (
                      <div className="profile-entry" key={skillTitle}>
                        <div className="profile-entry-content">
                          <div className="profile-entry-title">
                            {skillTitle}
                          </div>
                          <div className="profile-entry-subtitle">
                            {skillDescription}
                          </div>
                          <span
                            className={
                              isPublic
                                ? 'profile-entry-visibility'
                                : 'profile-entry-visibility--private'
                            }
                          >
                            {isPublic ? 'Public' : 'Private'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
};

export default ViewProfile;
