import { useState } from 'react';
import { Modal, Form, Alert } from 'react-bootstrap';

const EMPTY_FIELDS = { jobTitle: '', companyName: '', jobDescription: '' };
const EMPTY_ERRORS = { title: '', company: '', description: '' };

const CreateJobModal = ({ isOpen, onClose, onSubmit }) => {
  const [fields, setFields] = useState(EMPTY_FIELDS);
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [submitError, setSubmitError] = useState('');

  const set = (key) => (e) => setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const next = { ...EMPTY_ERRORS };
    let valid = true;
    if (!fields.jobTitle.trim()) { next.title = 'Job title is required'; valid = false; }
    if (!fields.companyName.trim()) { next.company = 'Company name is required'; valid = false; }
    if (!fields.jobDescription.trim()) { next.description = 'Job description is required'; valid = false; }
    setErrors(next);
    return valid;
  };

  const handleClose = () => {
    setFields(EMPTY_FIELDS);
    setErrors(EMPTY_ERRORS);
    setSubmitError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      await onSubmit(fields.jobTitle, fields.companyName, fields.jobDescription);
      handleClose();
    } catch {
      setSubmitError('Failed to create job. Please try again.');
    }
  };

  return (
    <Modal show={isOpen} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create Job</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {submitError && <Alert variant="danger">{submitError}</Alert>}
        <Form.Group controlId="formJobTitle">
          <Form.Label>Job Title</Form.Label>
          <Form.Control
            type="text"
            value={fields.jobTitle}
            onChange={set('jobTitle')}
            placeholder="Enter job title"
            isInvalid={!!errors.title}
          />
          <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="formCompanyName" className="mt-3">
          <Form.Label>Company Name</Form.Label>
          <Form.Control
            type="text"
            value={fields.companyName}
            onChange={set('companyName')}
            placeholder="Enter company name"
            isInvalid={!!errors.company}
          />
          <Form.Control.Feedback type="invalid">{errors.company}</Form.Control.Feedback>
        </Form.Group>
        <Form.Group controlId="formJobDescription" className="mt-3">
          <Form.Label>Job Description</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={fields.jobDescription}
            onChange={set('jobDescription')}
            placeholder="Enter job description"
            isInvalid={!!errors.description}
          />
          <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <button className="modal-btn-cancel" onClick={handleClose}>
          Cancel
        </button>
        <button className="modal-btn-save" onClick={handleSubmit}>
          Create
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreateJobModal;
