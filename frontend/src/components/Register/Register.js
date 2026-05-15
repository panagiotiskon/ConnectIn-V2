import React, { useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { MDBSpinner, MDBIcon } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import PhotoUpload from './PhotoUpload';
import Footer from '../common/Footer';
import {
  FIELD_RULES,
  STEPS,
  TOTAL_STEPS,
  canAdvance,
  cn,
} from './utils/registerForm';
import './Register.scss';

const Required = () => <span className="required-mark">*</span>;

const Register = () => {
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    getValues,
    control,
  } = useForm({ mode: 'onTouched' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [photoError, setPhotoError] = useState('');
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [step, setStep] = useState(1);
  const { register } = useAuth();

  const currentStep = STEPS[step - 1];
  const isLastStep = step === TOTAL_STEPS;

  const values = useWatch({ control }) || {};
  const stepValid = canAdvance(step, values);
  const passwordMismatch =
    !!values.password &&
    !!values.repeatPassword &&
    values.password !== values.repeatPassword;

  const goNext = () => {
    setMessage('');
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setMessage('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (data) => {
    if (!isLastStep) return;
    setMessage('');
    setPhotoError('');
    setLoading(true);

    try {
      await register(
        data.email,
        data.name,
        data.surname,
        data.password,
        data.phoneNumber || null,
        photo
      );
      navigate('/home');
    } catch (error) {
      let resMessage;

      if (error.response?.status === 401) {
        resMessage =
          'A user with this email already exists, try logging instead.';
      } else {
        resMessage =
          error.response?.data?.message ||
          error.message ||
          error.toString();
      }

      setLoading(false);
      setMessage(resMessage);
    }
  };

  const handleFileUpload = (file) => {
    setPhoto(file);
  };

  return (
    <div className="register-wrapper">
      <div className="register-content">
        <img
          src="/connectin-logo.png"
          alt="ConnectIn Logo"
          className="connectInLogo"
          fetchpriority="high"
          loading="eager"
          decoding="async"
        />
        <div className="form-container">
        <h2 className="form-subheading">
          Create your account
        </h2>

        <div className="step-indicator" aria-hidden="true">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={cn(
                'step-segment',
                s.id < step && 'is-completed',
                s.id === step && 'is-active'
              )}
            />
          ))}
        </div>
        <div className="step-caption">
          <span>
            Step {String(step).padStart(1, '0')} of{' '}
            {String(TOTAL_STEPS).padStart(1, '0')}
          </span>
          <span>{currentStep.caption}</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div key={step} className="step-content">
            {step === 1 && (
              <>
                <Form.Group className="mb-3" controlId="registerEmail">
                  <Form.Label>
                    Email <Required />
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    {...formRegister('email', FIELD_RULES.email)}
                    isInvalid={!!errors.email}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3" controlId="registerPassword">
                  <Form.Label>
                    Password <Required />
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    autoComplete="new-password"
                    {...formRegister('password', FIELD_RULES.password)}
                    isInvalid={!!errors.password}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-4" controlId="registerRepeatPassword">
                  <Form.Label>
                    Repeat Password <Required />
                  </Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Repeat Password"
                    autoComplete="new-password"
                    {...formRegister('repeatPassword', {
                      ...FIELD_RULES.repeatPassword,
                      validate: (value) =>
                        value === getValues('password') ||
                        'Passwords do not match',
                    })}
                    isInvalid={!!errors.repeatPassword || passwordMismatch}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.repeatPassword?.message ||
                      (passwordMismatch ? 'Passwords do not match' : '')}
                  </Form.Control.Feedback>
                </Form.Group>
              </>
            )}

            {step === 2 && (
              <Row>
                <Col xs={12} sm={6}>
                  <Form.Group className="mb-3" controlId="registerName">
                    <Form.Label>
                      First Name <Required />
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="First Name"
                      autoComplete="given-name"
                      {...formRegister('name', FIELD_RULES.name)}
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col xs={12} sm={6}>
                  <Form.Group className="mb-3" controlId="registerSurname">
                    <Form.Label>
                      Last Name <Required />
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Last Name"
                      autoComplete="family-name"
                      {...formRegister('surname', FIELD_RULES.surname)}
                      isInvalid={!!errors.surname}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.surname?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            )}

            {step === 3 && (
              <>
                <Form.Group className="mb-3" controlId="registerPhone">
                  <Form.Label>
                    Phone Number{' '}
                    <span className="optional-mark">(optional)</span>
                  </Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Phone Number"
                    autoComplete="tel"
                    {...formRegister('phoneNumber', FIELD_RULES.phoneNumber)}
                    isInvalid={!!errors.phoneNumber}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.phoneNumber?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    Profile Photo{' '}
                    <span className="optional-mark">(optional)</span>
                  </Form.Label>
                  <div>
                    <PhotoUpload
                      onFileUpload={handleFileUpload}
                      onError={setPhotoError}
                    />
                  </div>
                  {photoError && (
                    <div className="photo-error">{photoError}</div>
                  )}
                </Form.Group>
              </>
            )}
          </div>

          <div className="step-nav">
            {step > 1 && (
              <button
                type="button"
                className="btn-back"
                onClick={goBack}
                disabled={loading}
              >
                <MDBIcon fas icon="arrow-left" />
                Back
              </button>
            )}

            {!isLastStep && (
              <button
                type="button"
                className="btn-gradient"
                onClick={goNext}
                disabled={!stepValid}
              >
                Continue
                <MDBIcon fas icon="arrow-right" className="ms-2" />
              </button>
            )}

            {isLastStep && (
              <button
                type="submit"
                className="btn-gradient"
                disabled={loading || !stepValid}
              >
                {loading && (
                  <MDBSpinner size="sm" color="light">
                    <span className="visually-hidden" />
                  </MDBSpinner>
                )}
                Register
              </button>
            )}
          </div>

          {message && (
            <div className="alert alert-danger mt-3" role="alert">
              {message}
            </div>
          )}
        </form>

        <div className="text-center">
          <p className="inner-footer-text">
            Already have an account?{' '}
            <a
              href="/login"
              className="link"
              onClick={(e) => {
                e.preventDefault();
                navigate('/login');
              }}
            >
              Sign in
            </a>
          </p>
        </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
