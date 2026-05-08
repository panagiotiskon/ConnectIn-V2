import React, { useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { MDBSpinner } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import ConnectInLogo from '../../assets/ConnectIn.png';
import PhotoUpload from './PhotoUpload';
import Footer from '../common/Footer';
import './Register.scss';

const Required = () => <span className="required-mark">*</span>;

const Register = () => {
  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [photoError, setPhotoError] = useState('');
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const { register } = useAuth();

  const onSubmit = async (data) => {
    setMessage('');
    setPhotoError('');
    setLoading(true);

    if (data.password !== data.repeatPassword) {
      setMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

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
      <img
        src={ConnectInLogo}
        alt="ConnectIn Logo"
        className="connectInLogo"
        fetchpriority="high"
        loading="eager"
        decoding="async"
      />
      <div className="form-container">
        <h2 className="form-subheading">
          Make the most of your professional life
        </h2>

        <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
          <Form.Group className="mb-3" controlId="registerEmail">
            <Form.Label>
              Email <Required />
            </Form.Label>
            <Form.Control
              type="email"
              placeholder="Email"
              {...formRegister('email', { required: 'Email is required' })}
              isInvalid={!!errors.email}
            />
            <Form.Control.Feedback type="invalid">
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Row>
            <Col xs={12} sm={6}>
              <Form.Group className="mb-3" controlId="registerName">
                <Form.Label>
                  First Name <Required />
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="First Name"
                  {...formRegister('name', {
                    required: 'First name is required',
                    minLength: {
                      value: 3,
                      message: 'First name must be at least 3 characters long',
                    },
                    maxLength: {
                      value: 20,
                      message:
                        'First name must be less than 20 characters long',
                    },
                  })}
                  isInvalid={!!errors.name}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col xs={12} sm={6}>
              <Form.Group controlId="registerSurname">
                <Form.Label>
                  Last Name <Required />
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Last Name"
                  {...formRegister('surname', {
                    required: 'Last name is required',
                    minLength: {
                      value: 3,
                      message: 'Last name must be at least 3 characters long',
                    },
                    maxLength: {
                      value: 20,
                      message: 'Last name must be less than 20 characters long',
                    },
                  })}
                  isInvalid={!!errors.surname}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.surname?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="registerPassword">
            <Form.Label>
              Password <Required />
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Password"
              {...formRegister('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters long',
                },
                maxLength: {
                  value: 20,
                  message: 'Password must be less than 20 characters long',
                },
              })}
              isInvalid={!!errors.password}
            />
            <Form.Control.Feedback type="invalid">
              {errors.password?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="registerRepeatPassword">
            <Form.Label>
              Repeat Password <Required />
            </Form.Label>
            <Form.Control
              type="password"
              placeholder="Repeat Password"
              {...formRegister('repeatPassword', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === watch('password') || 'Passwords do not match',
              })}
              isInvalid={!!errors.repeatPassword}
            />
            <Form.Control.Feedback type="invalid">
              {errors.repeatPassword?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3" controlId="registerPhone">
            <Form.Label>
              Phone Number <span className="optional-mark">(optional)</span>
            </Form.Label>
            <Form.Control
              type="tel"
              placeholder="Phone Number"
              {...formRegister('phoneNumber', {
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Phone number must contain 10 digits',
                },
              })}
              isInvalid={!!errors.phoneNumber}
            />
            <Form.Control.Feedback type="invalid">
              {errors.phoneNumber?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>
              Profile Photo <span className="optional-mark">(optional)</span>
            </Form.Label>
            <div>
              <PhotoUpload onFileUpload={handleFileUpload} />
            </div>
            {photoError && (
              <div className="invalid-feedback d-block">{photoError}</div>
            )}
          </Form.Group>

          <div className="text-center">
            <button type="submit" className="btn-gradient" disabled={loading}>
              {loading && (
                <MDBSpinner size="sm" color="light">
                  <span className="visually-hidden" />
                </MDBSpinner>
              )}
              Register
            </button>
          </div>

          {message && (
            <div className="alert alert-danger mt-3" role="alert">
              {message}
            </div>
          )}
        </form>

        <div
          className="text-center"
          onClick={() => {
            navigate('/login');
            window.location.reload();
          }}
        >
          <p className="inner-footer-text">
            Already have an account?{' '}
            <a href="#!" className="link">
              Sign in
            </a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Register;
