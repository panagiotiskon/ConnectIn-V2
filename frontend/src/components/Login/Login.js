import React, { useState } from 'react';
import { Form } from 'react-bootstrap';
import { MDBSpinner, MDBIcon } from 'mdb-react-ui-kit';
import { useNavigate } from 'react-router-dom';
import './Login.scss';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import Footer from '../common/Footer';


const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onSubmit' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data) => {
    setMessage('');
    setLoading(true);

    try {
      const response = await login(data.email, data.password);
      if (response.role === 'ROLE_ADMIN') {
        navigate('/admin');
      } else if (response.role === 'ROLE_USER') {
        navigate('/home');
      } else {
        setMessage('Unexpected user role');
      }
    } catch (error) {
      const resMessage =
        error.response?.status === 401
          ? 'Invalid email or password. Please try again.'
          : error.response?.data?.message || error.message || error.toString();
      setMessage(resMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-content">
        <img
          src="/connectin-logo.png"
          alt="ConnectIn Logo"
          className="connectInLogo"
          fetchpriority="high"
          loading="eager"
          decoding="async"
        />
        <div className="form-container">
          <h2 className="form-subheading login-subheading">
            Welcome to ConnectIn
            <span className="login-subheading__tagline">
              No noise. Just opportunities.
            </span>
          </h2>
          <form className="auth-form" onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3" controlId="loginEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Email"
                {...register('email', { required: 'Email is required' })}
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3" controlId="loginPassword">
              <Form.Label>Password</Form.Label>
              <div className="password-input-wrapper">
                <Form.Control
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Password must be at least 6 characters' },
                  })}
                  isInvalid={!!errors.password}
                  onCopy={(e) => e.preventDefault()}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onMouseDown={() => setShowPassword(true)}
                  onMouseUp={() => setShowPassword(false)}
                  onMouseLeave={() => setShowPassword(false)}
                  onTouchStart={() => setShowPassword(true)}
                  onTouchEnd={() => setShowPassword(false)}
                  aria-label="Hold to show password"
                >
                  <MDBIcon fas icon={showPassword ? 'eye-slash' : 'eye'} />
                </button>
              </div>
              {errors.password && (
                <div className="invalid-feedback d-block">{errors.password.message}</div>
              )}
            </Form.Group>

            <div className="text-center">
              <button type="submit" className="btn-gradient" disabled={loading}>
                {loading && (
                  <MDBSpinner size="sm" color="light">
                    <span className="visually-hidden" />
                  </MDBSpinner>
                )}
                Sign in
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
            onClick={(e) => {
              e.preventDefault();
              navigate('/register');
            }}
          >
            <p className="inner-footer-text">
              New to ConnectIn?
              <a href="#!" className="link">
                Join now
              </a>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
