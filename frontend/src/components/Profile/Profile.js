import { useEffect, useState, useCallback } from 'react';
import { MDBContainer, MDBRow, MDBCol } from 'mdb-react-ui-kit';
import { Toast } from 'react-bootstrap';
import NavbarComponent from '../common/NavBar';
import ProfileCard from '../common/ProfileCard';
import { useAuth } from '../../context/AuthContext';
import PersonalInfoService from '../../api/UserAPI';
import './Profile.scss';
import AddEditModal from './AddEditModal';
import useProfileForm from '../../hooks/useProfileForm';
import ConfirmActionModal from '../common/ConfirmActionModal';
import WorkExperienceSection from './WorkExperienceSection';
import EducationSection from './EducationSection';
import SkillsSection from './SkillsSection';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const {
    showModal,
    selectedCard,
    modalContent,
    setModalContent,
    errorMessage,
    setErrorMessage,
    formData,
    updateFormField,
    resetFormData,
    handleModalClose,
    handleAddClick,
  } = useProfileForm();

  const [cardsContent, setCardsContent] = useState({
    'Work Experience': [],
    Education: [],
    Skills: [],
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null); // { id, category }
  const [isDeleting, setIsDeleting] = useState(false);

  const userId = currentUser?.id;

  const fetchProfileData = useCallback(async () => {
    if (!userId) return;
    try {
      const [educationData, workExperienceData, skillData] = await Promise.all([
        PersonalInfoService.getEducation(userId),
        PersonalInfoService.getExperience(userId),
        PersonalInfoService.getSkills(userId),
      ]);

      setCardsContent({
        Education:
          educationData?.map(({ educationId, universityName, fieldOfStudy, startDate, endDate, isPublic }) => ({
            educationId, universityName, fieldOfStudy, startDate, endDate, isPublic,
          })) ?? [],
        'Work Experience':
          workExperienceData?.map(({ experienceId, jobTitle, companyName, startDate, endDate, isPublic }) => ({
            experienceId, jobTitle, companyName, startDate, endDate, isPublic,
          })) ?? [],
        Skills:
          skillData?.map(({ skillId, skillTitle, skillDescription, isPublic }) => ({
            skillId, skillTitle, skillDescription, isPublic,
          })) ?? [],
      });
    } catch (error) {
      console.error('Error fetching profile data', error);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const validateDates = () => {
    const now = new Date();
    const start = new Date(formData?.startDate);
    const end = formData?.endDate ? new Date(formData.endDate) : null;

    if (start > now) {
      setErrorMessage('Start date cannot be after the current date.');
      return false;
    }
    if (end && end > now) {
      setErrorMessage('End date cannot be after the current date.');
      return false;
    }
    if (end && start > end) {
      setErrorMessage('Start date cannot be after the end date.');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (selectedCard === 'Education') {
      if (!formData.universityName || !formData.fieldOfStudy || !formData.startDate) {
        setErrorMessage('Please fill out all required fields.');
        return;
      }
      if (!validateDates()) return;
      try {
        const response = await PersonalInfoService.addEducation(userId, {
          universityName: formData.universityName,
          fieldOfStudy: formData.fieldOfStudy,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isPublic: formData.isPublic,
        });
        if (response?.status === 200) {
          const updated = await PersonalInfoService.getEducation(userId);
          setCardsContent((prev) => ({
            ...prev,
            Education:
              updated?.map(({ educationId, universityName, fieldOfStudy, startDate, endDate, isPublic }) => ({
                educationId, universityName, fieldOfStudy, startDate, endDate, isPublic,
              })) ?? [],
          }));
          setToastMessage('Successfully added Education!');
          setShowToast(true);
          resetFormData();
          handleModalClose();
        } else {
          setErrorMessage('Failed to save education.');
        }
      } catch {
        setErrorMessage('Failed to save education.');
      }
    } else if (selectedCard === 'Work Experience') {
      if (!formData.jobTitle || !formData.companyName || !formData.startDate) {
        setErrorMessage('Please fill out all required fields.');
        return;
      }
      if (!validateDates()) return;
      try {
        const response = await PersonalInfoService.addExperience(userId, {
          jobTitle: formData.jobTitle,
          companyName: formData.companyName,
          startDate: formData.startDate,
          endDate: formData.endDate,
          isPublic: formData.isPublic,
        });
        if (response?.status === 200) {
          const updated = await PersonalInfoService.getExperience(userId);
          setCardsContent((prev) => ({
            ...prev,
            'Work Experience':
              updated?.map(({ experienceId, jobTitle, companyName, startDate, endDate, isPublic }) => ({
                experienceId, jobTitle, companyName, startDate, endDate, isPublic,
              })) ?? [],
          }));
          setToastMessage('Successfully added Work Experience!');
          setShowToast(true);
          resetFormData();
          handleModalClose();
        } else {
          setErrorMessage('Failed to save work experience.');
        }
      } catch {
        setErrorMessage('Failed to save work experience.');
      }
    } else if (selectedCard === 'Skills') {
      if (!formData.skillTitle || !formData.skillDescription) {
        setErrorMessage('Please fill out all required fields.');
        return;
      }
      try {
        const response = await PersonalInfoService.addSkill(userId, {
          skillTitle: formData.skillTitle,
          skillDescription: formData.skillDescription,
          isPublic: formData.isPublic,
        });
        if (response?.status === 200) {
          const updated = await PersonalInfoService.getSkills(userId);
          setCardsContent((prev) => ({
            ...prev,
            Skills:
              updated?.map(({ skillId, skillTitle, skillDescription, isPublic }) => ({
                skillId, skillTitle, skillDescription, isPublic,
              })) ?? [],
          }));
          setToastMessage('Successfully added Skill!');
          setShowToast(true);
          resetFormData();
          handleModalClose();
        } else {
          setErrorMessage('Failed to save skill.');
        }
      } catch {
        setErrorMessage('Failed to save skill.');
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    const { id, category } = pendingDelete;
    setIsDeleting(true);
    try {
      if (category === 'Education') {
        await PersonalInfoService.deleteEducation(userId, id);
      } else if (category === 'Work Experience') {
        await PersonalInfoService.deleteExperience(userId, id);
      } else if (category === 'Skills') {
        await PersonalInfoService.deleteSkill(userId, id);
      }

      setCardsContent((prev) => {
        let updatedContent = [];
        if (category === 'Education') {
          updatedContent = prev['Education'].filter((item) => item.educationId !== id);
        } else if (category === 'Work Experience') {
          updatedContent = prev['Work Experience'].filter((item) => item.experienceId !== id);
        } else if (category === 'Skills') {
          updatedContent = prev['Skills'].filter((item) => item.skillId !== id);
        }
        return { ...prev, [category]: updatedContent };
      });

      setToastMessage(`Successfully deleted ${category.slice(0, -1)}!`);
      setShowToast(true);
    } catch {
      setErrorMessage(`Failed to delete ${category.slice(0, -1)}.`);
    } finally {
      setIsDeleting(false);
      setPendingDelete(null);
    }
  };

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div>
      <NavbarComponent />

      <MDBContainer fluid className="profile-page">
        <MDBRow>
          <MDBCol md="4" className="mb-4 mb-md-0">
            <ProfileCard currentUser={currentUser} />
          </MDBCol>

          <MDBCol md="8">
            <div className="profile-sections">
              <WorkExperienceSection
                items={cardsContent['Work Experience']}
                onAdd={() => handleAddClick('Work Experience')}
                onDelete={(id) => setPendingDelete({ id, category: 'Work Experience' })}
              />
              <EducationSection
                items={cardsContent.Education}
                onAdd={() => handleAddClick('Education')}
                onDelete={(id) => setPendingDelete({ id, category: 'Education' })}
              />
              <SkillsSection
                items={cardsContent.Skills}
                onAdd={() => handleAddClick('Skills')}
                onDelete={(id) => setPendingDelete({ id, category: 'Skills' })}
              />
            </div>
          </MDBCol>
        </MDBRow>
      </MDBContainer>

      <ConfirmActionModal
        isOpen={pendingDelete !== null}
        title={`Delete ${
          pendingDelete?.category === 'Skills'
            ? 'Skill'
            : pendingDelete?.category ?? ''
        }`}
        message="Are you sure you want to delete this entry?"
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
        isLoading={isDeleting}
      />
      <AddEditModal
        showModal={showModal}
        handleModalClose={handleModalClose}
        selectedCard={selectedCard}
        errorMessage={errorMessage}
        formData={formData}
        updateFormField={updateFormField}
        modalContent={modalContent}
        setModalContent={setModalContent}
        handleSave={handleSave}
      />
      <Toast
        onClose={() => setShowToast(false)}
        show={showToast}
        delay={3000}
        autohide
        className="profile-toast"
      >
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </div>
  );
};

export default Profile;
