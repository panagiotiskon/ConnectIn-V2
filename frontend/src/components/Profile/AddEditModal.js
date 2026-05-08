import { Modal, Form, Alert } from 'react-bootstrap';

const AddEditModal = ({
  showModal,
  handleModalClose,
  selectedCard,
  errorMessage,
  formData,
  updateFormField,
  modalContent,
  setModalContent,
  handleSave,
}) => {
  return (
    <Modal show={showModal} onHide={handleModalClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{selectedCard}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        {selectedCard === 'Education' ? (
          <>
            <Form.Group controlId="formUniversityName">
              <Form.Label>University Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.universityName}
                onChange={(e) =>
                  updateFormField('universityName', e.target.value)
                }
                placeholder="Enter university name"
                isInvalid={!formData.universityName && errorMessage}
              />
            </Form.Group>
            <Form.Group controlId="formFieldOfStudy" className="mt-3">
              <Form.Label>Field of Study</Form.Label>
              <Form.Control
                type="text"
                value={formData.fieldOfStudy}
                onChange={(e) =>
                  updateFormField('fieldOfStudy', e.target.value)
                }
                placeholder="Enter field of study"
                isInvalid={!formData.fieldOfStudy && errorMessage}
              />
            </Form.Group>
            <Form.Group controlId="formStartDate" className="mt-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormField('startDate', e.target.value)}
                isInvalid={!formData.startDate && errorMessage}
              />
            </Form.Group>
            <Form.Group controlId="formEndDate" className="mt-3">
              <Form.Label>End Date (optional)</Form.Label>
              <Form.Control
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormField('endDate', e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formIsPublic" className="mt-3">
              <Form.Check
                type="checkbox"
                label="Public"
                checked={formData.isPublic}
                onChange={(e) => updateFormField('isPublic', e.target.checked)}
              />
            </Form.Group>
          </>
        ) : selectedCard === 'Work Experience' ? (
          <>
            <Form.Group controlId="formJobTitle">
              <Form.Label>Job Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.jobTitle}
                onChange={(e) => updateFormField('jobTitle', e.target.value)}
                placeholder="Enter job title"
                isInvalid={!formData.jobTitle && errorMessage}
              />
            </Form.Group>
            <Form.Group controlId="formCompanyName" className="mt-3">
              <Form.Label>Company Name</Form.Label>
              <Form.Control
                type="text"
                value={formData.companyName}
                onChange={(e) => updateFormField('companyName', e.target.value)}
                placeholder="Enter company name"
                isInvalid={!formData.companyName && errorMessage}
              />
            </Form.Group>
            <Form.Group controlId="formStartDate" className="mt-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                value={formData.startDate}
                onChange={(e) => updateFormField('startDate', e.target.value)}
                isInvalid={!formData.startDate && errorMessage}
              />
            </Form.Group>
            <Form.Group controlId="formEndDate" className="mt-3">
              <Form.Label>End Date (optional)</Form.Label>
              <Form.Control
                type="date"
                value={formData.endDate}
                onChange={(e) => updateFormField('endDate', e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formIsPublic" className="mt-3">
              <Form.Check
                type="checkbox"
                label="Public"
                checked={formData.isPublic}
                onChange={(e) => updateFormField('isPublic', e.target.checked)}
              />
            </Form.Group>
          </>
        ) : selectedCard === 'Skills' ? (
          <>
            <Form.Group controlId="formSkillTitle">
              <Form.Label>Skill Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.skillTitle}
                onChange={(e) => updateFormField('skillTitle', e.target.value)}
                placeholder="Enter skill title"
                isInvalid={!formData.skillTitle && errorMessage}
              />
            </Form.Group>
            <Form.Group controlId="formSkillDescription" className="mt-3">
              <Form.Label>Skill Description</Form.Label>
              <Form.Control
                type="text"
                value={formData.skillDescription}
                onChange={(e) =>
                  updateFormField('skillDescription', e.target.value)
                }
                placeholder="Enter skill description"
                isInvalid={!formData.skillDescription && errorMessage}
              />
            </Form.Group>
            <Form.Group controlId="formIsPublic" className="mt-3">
              <Form.Check
                type="checkbox"
                label="Public"
                checked={formData.isPublic}
                onChange={(e) => updateFormField('isPublic', e.target.checked)}
              />
            </Form.Group>
          </>
        ) : (
          <Form.Group controlId="formModalContent">
            <Form.Label>{selectedCard} Details</Form.Label>
            <Form.Control
              type="text"
              value={modalContent}
              onChange={(e) => setModalContent(e.target.value)}
              placeholder="Enter details"
              isInvalid={!modalContent && errorMessage}
            />
          </Form.Group>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="profile-modal-btn-cancel" onClick={handleModalClose}>
          Cancel
        </button>
        <button className="profile-modal-btn-save" onClick={handleSave}>
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddEditModal;
