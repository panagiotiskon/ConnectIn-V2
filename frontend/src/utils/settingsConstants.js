export const SETTINGS_CARDS = [
  {
    type: 'profile-picture',
    icon: '📸',
    title: 'Profile Picture',
    desc: 'Upload or remove your profile photo.',
    btnLabel: 'Update',
  },
  {
    type: 'email',
    icon: '📧',
    title: 'Email Address',
    desc: 'Update the email address associated with your account.',
    btnLabel: 'Update',
  },
  {
    type: 'password',
    icon: '🔒',
    title: 'Password',
    desc: 'Change your password to keep your account secure.',
    btnLabel: 'Update',
  },
  {
    type: 'recommendations-info',
    icon: '✨',
    title: 'Top Recommendations',
    desc: 'Learn how ConnectIn personalises your Top posts and jobs using your skills, connections, and activity.',
    btnLabel: 'Learn More',
  },
];

export const SETTINGS_CONFIGS = {
  email: {
    title: 'Change Email',
    old: {
      name: 'oldEmail',
      label: 'Current Email',
      placeholder: 'Enter current email',
      type: 'email',
    },
    new: {
      name: 'newEmail',
      label: 'New Email',
      placeholder: 'Enter new email',
      type: 'email',
    },
    confirm: {
      name: 'confirmNewEmail',
      label: 'Confirm New Email',
      placeholder: 'Confirm new email',
      type: 'email',
    },
    oldRules: { required: 'Current email is required' },
    newRules: { required: 'New email is required' },
    confirmLabel: 'Emails do not match',
  },
  password: {
    title: 'Change Password',
    old: {
      name: 'oldPassword',
      label: 'Current Password',
      placeholder: 'Enter current password',
      type: 'password',
    },
    new: {
      name: 'newPassword',
      label: 'New Password',
      placeholder: 'Enter new password',
      type: 'password',
    },
    confirm: {
      name: 'confirmNewPassword',
      label: 'Confirm New Password',
      placeholder: 'Confirm new password',
      type: 'password',
    },
    oldRules: {
      required: 'Current password is required',
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters',
      },
    },
    newRules: {
      required: 'New password is required',
      minLength: {
        value: 6,
        message: 'Password must be at least 6 characters',
      },
    },
    confirmLabel: 'Passwords do not match',
  },
};
