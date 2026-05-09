const PASSWORD_MIN = 6;
const PASSWORD_MAX = 20;
const NAME_MIN = 3;
const NAME_MAX = 20;
const PHONE_REGEX = /^[0-9]{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Mirrors backend `spring.servlet.multipart.max-file-size` (application.yaml).
const PHOTO_MAX_MB = 10;
const PHOTO_MAX_BYTES = PHOTO_MAX_MB * 1024 * 1024;

const inRange = (s, min, max) =>
  typeof s === 'string' && s.length >= min && s.length <= max;

export const FIELD_RULES = {
  email: {
    required: 'Email is required',
    pattern: {
      value: EMAIL_REGEX,
      message: 'Please enter a valid email address',
    },
  },
  password: {
    required: 'Password is required',
    minLength: {
      value: PASSWORD_MIN,
      message: `Password must be at least ${PASSWORD_MIN} characters`,
    },
    maxLength: {
      value: PASSWORD_MAX,
      message: `Password must be less than ${PASSWORD_MAX} characters`,
    },
  },

  repeatPassword: { required: 'Please confirm your password' },
  name: {
    required: 'First name is required',
    minLength: {
      value: NAME_MIN,
      message: `First name must be at least ${NAME_MIN} characters`,
    },
    maxLength: {
      value: NAME_MAX,
      message: `First name must be less than ${NAME_MAX} characters`,
    },
  },
  surname: {
    required: 'Last name is required',
    minLength: {
      value: NAME_MIN,
      message: `Last name must be at least ${NAME_MIN} characters`,
    },
    maxLength: {
      value: NAME_MAX,
      message: `Last name must be less than ${NAME_MAX} characters`,
    },
  },
  phoneNumber: {
    pattern: {
      value: PHONE_REGEX,
      message: 'Phone number must contain 10 digits',
    },
  },
};

export const STEPS = [
  { id: 1, caption: 'Sign-in details' },
  { id: 2, caption: 'Your name' },
  { id: 3, caption: 'A few finishing touches' },
];

export const TOTAL_STEPS = STEPS.length;

export const validatePhoto = (file) => {
  if (file && file.size > PHOTO_MAX_BYTES) {
    return `Photo must be less than ${PHOTO_MAX_MB}MB`;
  }
  return null;
};

export const canAdvance = (step, values) => {
  if (step === 1) {
    return (
      EMAIL_REGEX.test(values.email || '') &&
      inRange(values.password, PASSWORD_MIN, PASSWORD_MAX) &&
      !!values.repeatPassword &&
      values.password === values.repeatPassword
    );
  }
  if (step === 2) {
    return (
      inRange(values.name, NAME_MIN, NAME_MAX) &&
      inRange(values.surname, NAME_MIN, NAME_MAX)
    );
  }
  if (step === 3) {
    const p = values.phoneNumber;
    return !p || PHONE_REGEX.test(p);
  }
  return false;
};

export const cn = (...classes) => classes.filter(Boolean).join(' ');
