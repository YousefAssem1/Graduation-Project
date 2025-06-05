// ==== Password show/hide functionality ====
function passwordRegister(inputId, eyeId) {
  const input = document.getElementById(inputId);
  const iconEye = document.getElementById(eyeId);

  iconEye.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
    iconEye.classList.toggle('ri-eye-fill');
    iconEye.classList.toggle('ri-eye-off-fill');
  });
}

// ==== Verification modal and form submission logic ====
document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const body = document.body;
  const verificationContent = document.getElementById('verificationContent');
  const successContent = document.getElementById('successContent');
  const statusIcon = document.getElementById('statusIcon');
  const errorMessage = document.getElementById('errorMessage');
  const verifyBtn = document.getElementById('verifyBtn');
  const codeInputs = document.querySelectorAll('.password input');
  const form = document.querySelector('.login__form');
  const emailInput = document.getElementById('emailCreate');
  const nameInput = document.getElementById('names');
  const passwordInput = document.getElementById('passwordCreate');
  const hiddenCodeInput = document.getElementById('verificationCode');
  const submitButton = document.querySelector('.login__button'); // Get the submit button

  // Get all controllable form inputs (excluding email since it's prefilled/readonly)
  const controllableInputs = document.querySelectorAll('#names, #passwordCreate');

  // DEBUG: Log all form elements to ensure they exist
  console.log('Form elements check:', {
    form: form ? 'Found' : 'Missing',
    emailInput: emailInput ? 'Found' : 'Missing',
    nameInput: nameInput ? 'Found' : 'Missing',
    passwordInput: passwordInput ? 'Found' : 'Missing',
    hiddenCodeInput: hiddenCodeInput ? 'Found' : 'Missing',
    submitButton: submitButton ? 'Found' : 'Missing'
  });

  // Initialize password toggle
  passwordRegister('passwordCreate', 'loginPasswordCreate');

  // Prefill email from URL parameter and make it read-only
  const params = new URLSearchParams(window.location.search);
  if (params.has('email')) {
    emailInput.value = params.get('email');
    emailInput.setAttribute('readonly', 'readonly');
    console.log('Email prefilled:', emailInput.value);
  } else {
    console.warn('No email parameter found in URL');
    // If no email, maybe show an error or redirect, as verification won't work
    alert('Missing email in URL. Please use the invite link.');
    // Optionally redirect or disable everything if email is missing
    return;
  }

  // --- Initial state: Disable main form inputs and button ---
  controllableInputs.forEach(el => el.disabled = true);
  submitButton.disabled = true;

  // Show verification modal immediately on page load
  openModal();

  // Event listeners for verification code inputs
  codeInputs.forEach(input => {
    input.addEventListener('input', handleCodeInput);
    input.addEventListener('keydown', handleCodeKeyDown);
    input.addEventListener('keypress', handleCodeKeyPress);
  });

  // Verify button click handler
  verifyBtn.addEventListener('click', verifyCode);

  // Form submission handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    console.log('Form submission attempt');
    console.log('Form values:', {
      name: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      verificationCode: hiddenCodeInput.value
    });

    // Client-side check before submission
    if (!nameInput.value || !passwordInput.value) { // Only check name and password here
      console.error('Missing required fields');
      alert('Please fill in all required fields (Name and Password)');
      return;
    }

    // The hiddenCodeInput should already be set from successful verification
    // if the button is enabled, but good to have a final check for robustness.
    if (!hiddenCodeInput.value) {
        console.error('Verification code missing, possibly bypassed or not set.');
        alert('Verification was not completed. Please verify your email.');
        openModal(); // Re-open modal if code somehow got lost
        return;
    }

    // Proceed with form submission
    submitForm();
  });

  // Helper Functions
  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function openModal() {
    clearCodeInputs();
    showVerificationUI();
    body.classList.add('active');
    codeInputs[0].focus();
  }

  function closeModal() {
    body.classList.remove('active');
  }

  function clearCodeInputs() {
    codeInputs.forEach(i => i.value = '');
    verifyBtn.disabled = true;
  }

  function showVerificationUI() {
    verificationContent.style.display = 'block';
    successContent.style.display = 'none';
    verifyBtn.style.display = 'inline-block';
    resetErrorState();
    statusIcon.className = 'fa-regular fa-circle-check';
    statusIcon.style.color = '#4e51fd';
  }

  function showSuccessUI() {
    verificationContent.style.display = 'none';
    successContent.style.display = 'block';

    // Close modal after showing success message
    setTimeout(() => {
      closeModal();
      // Enable form fields after successful verification
      controllableInputs.forEach(el => el.disabled = false);
      submitButton.disabled = false;
    }, 1500);
  }

  function resetErrorState() {
    errorMessage.style.display = 'none';
    document.querySelector('.password').classList.remove('error');
  }

  function showErrorState() {
    statusIcon.className = 'fa-solid fa-times-circle';
    statusIcon.style.color = '#ff3b30';
    document.querySelector('.password').classList.add('error');
    errorMessage.style.display = 'block';
    shakeContainer();

    codeInputs[0].addEventListener('input', function resetIcon() {
      statusIcon.className = 'fa-regular fa-circle-check';
      statusIcon.style.color = '#4e51fd';
      codeInputs[0].removeEventListener('input', resetIcon);
    });
  }

  function shakeContainer() {
    const container = document.querySelector('.password');
    container.style.animation = 'shake 0.5s';
    setTimeout(() => container.style.animation = '', 500);
  }

  function getEnteredCode() {
    return Array.from(codeInputs).map(i => i.value).join('');
  }

  // Code input handlers
  function handleCodeInput(e) {
    const input = e.target;
    const index = parseInt(input.getAttribute('data-index'));

    resetErrorState();

    if (input.value.length === 1 && index < codeInputs.length - 1) {
      codeInputs[index + 1].focus();
    }

    verifyBtn.disabled = !Array.from(codeInputs).every(i => i.value.length === 1);
  }

  function handleCodeKeyDown(e) {
    const input = e.target;
    const index = parseInt(input.getAttribute('data-index'));

    if (e.key === 'Backspace') {
      if (input.value.length === 0 && index > 0) {
        codeInputs[index - 1].focus();
      }
    }
  }

  function handleCodeKeyPress(e) {
    if (!/[0-9]/.test(e.key) && e.key !== 'Enter') {
      e.preventDefault();
    }

    if (e.key === 'Enter' && !verifyBtn.disabled) {
      verifyCode();
    }
  }

  // For testing/debugging only - allow bypassing verification
  window.bypassVerification = function(code = '123456') {
    hiddenCodeInput.value = code;
    closeModal();
    // Enable form fields after bypass
    controllableInputs.forEach(el => el.disabled = false);
    submitButton.disabled = false;
    console.log('Verification bypassed with code:', code);
  };

  // Send verification code to server
  function verifyCode() {
    const code = getEnteredCode();
    const email = emailInput.value;

    console.log(`Verifying code: ${code} for email: ${email}`);

    // DEBUG MODE - Auto-approve any code for testing
    // Comment this section out when connecting to real backend
    /*
    console.log('[DEBUG MODE] Auto-approving verification code');
    hiddenCodeInput.value = code;
    showSuccessUI();
    return;
    */

    fetch('/verify-admin-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email, code })
    })
    .then(response => {
      console.log('Verification response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('Verification response data:', data);
      if (data.success) {
        hiddenCodeInput.value = code; // Crucially, set the hidden input here
        showSuccessUI();
      } else {
        showErrorState();
        console.error('Verification failed:', data.message);
      }
    })
    .catch(error => {
      console.error('Error during code verification:', error);
      showErrorState();
    });
  }

  // Submit the form after successful verification
  function submitForm() {
      const data = {
    name: nameInput.value,
    email: emailInput.value,
    password: passwordInput.value,
    verificationCode: hiddenCodeInput.value
  };

  const params = new URLSearchParams(data);

  fetch(form.action, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
    .then(response => {
      console.log('Form submission response status:', response.status);
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);

      if (contentType && contentType.includes('application/json')) {
        return response.json().then(data => {
          console.log('Response data:', data);
          return data;
        });
      } else {
        // For non-JSON responses, get the text
        return response.text().then(text => {
          console.log('Response text:', text);
          throw new Error('Server returned non-JSON response');
        });
      }
    })
    .then(data => {
      if (data.success) {
        console.log('Form submission successful, redirecting to:', data.redirectUrl);
        window.location.href = data.redirectUrl || '/admin-login';
      } else {
        console.error('Form submission failed:', data.message);
        alert(data.message || 'Account creation failed');
      }
    })
    .catch(error => {
      console.error('Error during form submission:', error);
      alert('An error occurred while creating your account. Please try again.');
    });
  }
});