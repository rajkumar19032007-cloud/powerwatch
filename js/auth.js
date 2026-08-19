/**
 * CampusOS — Authentication Script (auth.js)
 * Phase 3 & Phase 10: Full Stack REST Authentication & JWT Issuance
 * Handles role selector, password visibility, form validation, and real MySQL login.
 */

document.addEventListener('DOMContentLoaded', () => {
  initRoleSelector();
  initPasswordToggle();
  initLoginForm();
});

/**
 * Handles role selection tabs (Student, Faculty, Admin)
 */
function initRoleSelector() {
  const roleButtons = qsa('.role-btn');
  const emailInput = qs('#email');
  const emailLabel = qs('#email-label');

  if (!roleButtons.length) return;

  const roleConfigs = {
    student: {
      placeholder: 'e.g. student@campusos.demo',
      label: 'Student Institutional Email',
      demoEmail: 'student@campusos.demo',
    },
    faculty: {
      placeholder: 'e.g. faculty@campusos.demo',
      label: 'Faculty Email',
      demoEmail: 'faculty@campusos.demo',
    },
    admin: {
      placeholder: 'e.g. admin@campusos.demo',
      label: 'Administrator Email',
      demoEmail: 'admin@campusos.demo',
    },
  };

  roleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Update active state on buttons
      roleButtons.forEach((btn) => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });

      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      // Update input context & pre-fill demo email
      const selectedRole = button.dataset.role || 'student';
      const config = roleConfigs[selectedRole] || roleConfigs.student;

      if (emailInput) {
        emailInput.placeholder = config.placeholder;
        emailInput.value = config.demoEmail;
      }
      if (emailLabel) {
        emailLabel.textContent = config.label;
      }

      // Pre-fill default password for convenience
      const passwordInput = qs('#password');
      if (passwordInput && !passwordInput.value) {
        passwordInput.value = 'campus123';
      }

      // Clear any previous error states
      clearErrors();
    });
  });
}

/**
 * Handles password show/hide visibility toggle
 */
function initPasswordToggle() {
  const toggleBtn = qs('#toggle-password-btn');
  const passwordInput = qs('#password');

  if (!toggleBtn || !passwordInput) return;

  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';

    toggleBtn.setAttribute('aria-pressed', isPassword ? 'true' : 'false');
    toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');

    // Toggle Eye icon
    const eyeIcon = toggleBtn.querySelector('.eye-icon');
    const eyeOffIcon = toggleBtn.querySelector('.eye-off-icon');

    if (eyeIcon && eyeOffIcon) {
      eyeIcon.style.display = isPassword ? 'none' : 'block';
      eyeOffIcon.style.display = isPassword ? 'block' : 'none';
    }
  });
}

/**
 * Handles form validation and real backend JWT login submission
 */
function initLoginForm() {
  const form = qs('#login-form');
  const emailInput = qs('#email');
  const passwordInput = qs('#password');
  const submitBtn = form?.querySelector('button[type="submit"]');
  const feedbackBanner = qs('#demo-feedback');

  if (!form || !emailInput || !passwordInput) return;

  // Real-time error clearing on input
  emailInput.addEventListener('input', () => clearFieldError('email'));
  passwordInput.addEventListener('input', () => clearFieldError('password'));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let isValid = true;

    // 1. Email Validation
    if (!email) {
      showFieldError('email', 'Email address is required.');
      isValid = false;
    } else if (!isValidEmail(email)) {
      showFieldError('email', 'Please enter a valid email address.');
      isValid = false;
    }

    // 2. Password Validation
    if (!password) {
      showFieldError('password', 'Password is required.');
      isValid = false;
    }

    if (!isValid) return;

    // 3. Submit credentials to REST API
    const originalBtnText = submitBtn ? submitBtn.textContent : 'Sign In';
    if (submitBtn) {
      submitBtn.textContent = 'Verifying credentials...';
      submitBtn.disabled = true;
    }

    try {
      const response = await CampusAPI.login(email, password);

      if (response.success && response.data && response.data.user) {
        const user = response.data.user;

        // Show success state
        if (feedbackBanner) {
          feedbackBanner.style.background = '#ecfdf5';
          feedbackBanner.style.borderColor = '#10b981';
          feedbackBanner.style.color = '#065f46';
          feedbackBanner.innerHTML = `
            <span class="demo-feedback-icon" aria-hidden="true">✅</span>
            <div style="flex: 1;">
              <strong>Authentication Successful!</strong>
              <div style="font-size: 0.8rem; margin-top: 0.25rem;">
                Welcome back, <strong>${user.name}</strong> (${user.role.toUpperCase()}). Redirecting to your dashboard...
              </div>
            </div>
          `;
          feedbackBanner.classList.add('show');
        }

        // Route strictly based on the server-verified role
        setTimeout(() => {
          if (user.role === 'student') {
            window.location.href = 'student-dashboard.html';
          } else if (user.role === 'faculty') {
            window.location.href = 'faculty-dashboard.html';
          } else if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
          } else {
            window.location.href = '../index.html';
          }
        }, 800);
      } else {
        // Handle failed authentication
        const errorMessage = response.message || 'Invalid email or password';
        showFieldError('password', errorMessage);

        if (feedbackBanner) {
          feedbackBanner.style.background = '#fef2f2';
          feedbackBanner.style.borderColor = '#ef4444';
          feedbackBanner.style.color = '#991b1b';
          feedbackBanner.innerHTML = `
            <span class="demo-feedback-icon" aria-hidden="true">⚠️</span>
            <div style="flex: 1;">
              <strong>Authentication Failed</strong>
              <div style="font-size: 0.8rem; margin-top: 0.25rem;">
                ${errorMessage}. Please check your credentials or use the demo accounts.
              </div>
            </div>
          `;
          feedbackBanner.classList.add('show');
        }
      }
    } catch (err) {
      showFieldError('password', 'Unable to connect to authentication service.');
    } finally {
      if (submitBtn) {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
      }
    }
  });
}

/**
 * Basic email format validator
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Displays an error for a specific form field
 * @param {string} fieldId
 * @param {string} message
 */
function showFieldError(fieldId, message) {
  const group = qs(`#group-${fieldId}`);
  const errorEl = qs(`#error-${fieldId}`);

  if (group) {
    group.classList.add('has-error');
  }
  if (errorEl) {
    errorEl.textContent = message;
  }

  const input = qs(`#${fieldId}`);
  if (input) {
    input.setAttribute('aria-invalid', 'true');
  }
}

/**
 * Clears an error for a specific form field
 * @param {string} fieldId
 */
function clearFieldError(fieldId) {
  const group = qs(`#group-${fieldId}`);
  const errorEl = qs(`#error-${fieldId}`);

  if (group) {
    group.classList.remove('has-error');
  }
  if (errorEl) {
    errorEl.textContent = '';
  }

  const input = qs(`#${fieldId}`);
  if (input) {
    input.removeAttribute('aria-invalid');
  }
}

/**
 * Clears all form errors and hides feedback banner
 */
function clearErrors() {
  clearFieldError('email');
  clearFieldError('password');

  const feedbackBanner = qs('#demo-feedback');
  if (feedbackBanner) {
    feedbackBanner.classList.remove('show');
  }
}
