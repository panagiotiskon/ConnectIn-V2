import { Modal, Form, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { SETTINGS_CONFIGS } from '../../utils/settingsConstants';

const SettingsModal = ({ show, onHide, onSubmit, loading, error, type }) => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const cfg = SETTINGS_CONFIGS[type] ?? SETTINGS_CONFIGS.email;
  const watchedOld = watch(cfg.old.name);
  const watchedNew = watch(cfg.new.name);

  const handleClose = () => {
    reset();
    onHide();
  };

  const newRules = {
    ...cfg.newRules,
    ...(type === 'password' && {
      validate: (v) =>
        v !== watchedOld ||
        'New password cannot be the same as current password',
    }),
  };

  const confirmRules = {
    required: `Please confirm your new ${type === 'email' ? 'email' : 'password'}`,
    validate: (v) => v === watchedNew || cfg.confirmLabel,
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{cfg.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <form id="settings-form" onSubmit={handleSubmit(onSubmit)}>
          {[
            { field: cfg.old, rules: cfg.oldRules, err: errors[cfg.old.name] },
            { field: cfg.new, rules: newRules, err: errors[cfg.new.name] },
            {
              field: cfg.confirm,
              rules: confirmRules,
              err: errors[cfg.confirm.name],
            },
          ].map(({ field, rules, err }) => (
            <Form.Group key={field.name} className="mb-3">
              <Form.Label>{field.label}</Form.Label>
              <Form.Control
                type={field.type}
                placeholder={field.placeholder}
                {...register(field.name, rules)}
                isInvalid={!!err}
              />
              {err && (
                <Form.Control.Feedback type="invalid">
                  {err.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          ))}
        </form>
      </Modal.Body>
      <Modal.Footer>
        <button className="modal-btn-cancel" onClick={handleClose}>
          Cancel
        </button>
        <button
          type="submit"
          form="settings-form"
          className="modal-btn-save"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettingsModal;
