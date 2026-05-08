import { useState } from 'react';

const useProfileForm = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form data state
  const [formData, setFormData] = useState({
    universityName: '',
    fieldOfStudy: '',
    jobTitle: '',
    companyName: '',
    skillTitle: '',
    skillDescription: '',
    startDate: '',
    endDate: '',
    isPublic: true,
  });

  // Helper functions to update form data
  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const resetFormData = () => {
    setFormData({
      universityName: '',
      fieldOfStudy: '',
      jobTitle: '',
      companyName: '',
      skillTitle: '',
      skillDescription: '',
      startDate: '',
      endDate: '',
      isPublic: true,
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setErrorMessage('');
    resetFormData();
  };

  const handleAddClick = (card) => {
    setSelectedCard(card);
    setModalContent('');
    setShowModal(true);
    setErrorMessage('');
    resetFormData();
  };

  return {
    // Modal state
    showModal,
    setShowModal,
    selectedCard,
    modalContent,
    setModalContent,
    errorMessage,
    setErrorMessage,

    // Form data and helpers
    formData,
    updateFormField,
    resetFormData,

    // Handlers
    handleModalClose,
    handleAddClick,
  };
};

export default useProfileForm;
