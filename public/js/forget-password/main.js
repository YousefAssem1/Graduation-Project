document.addEventListener('DOMContentLoaded', function() {
    const body = document.querySelector("body");
    const overlay = document.querySelector(".overlay");
    const resetBtn = document.querySelector("#resetBtn");
    const verifyBtn = document.querySelector("#verifyBtn");
    const passwordInputs = document.querySelectorAll('.password input');
    const passwordContainer = document.querySelector('.password');
    const errorMessage = document.querySelector('.error-message');
    const emailInput = document.querySelector("#emailInput");
    const emailError = document.querySelector("#emailError");
    const verificationContent = document.querySelector("#verificationContent");
    const successContent = document.querySelector("#successContent");
    const statusIcon = document.querySelector("#statusIcon");

    // Event listeners
    // Note: The form submission event is now handled in the HTML file
    overlay.addEventListener("click", closeModal);
    verifyBtn.addEventListener("click", verifyCode);
    
    // Prevent spaces in email input
    emailInput.addEventListener('input', function() {
        this.value = this.value.trim();
    });

    passwordInputs.forEach(input => {
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeyDown);
        input.addEventListener('keypress', handleKeyPress);
    });

    function checkAllInputsFilled() {
        const allFilled = Array.from(passwordInputs).every(input => input.value.length === 1);
        verifyBtn.disabled = !allFilled;
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function openModal() {
        clearInputs();
        showVerificationUI();
        body.classList.add("active");
        passwordInputs[0].focus();
        resetErrorState();
    }

    function closeModal() {
        clearInputs();
        body.classList.remove("active");
        resetErrorState();
    }

    function clearInputs() {
        passwordInputs.forEach(input => {
            input.value = '';
        });
        verifyBtn.disabled = true;
    }

    function showVerificationUI() {
        verificationContent.style.display = 'block';
        successContent.style.display = 'none';
        verifyBtn.style.display = 'block';
        statusIcon.className = 'fa-regular fa-circle-check';
        statusIcon.style.color = '#4e51fd';
    }

    function showSuccessUI() {
        verificationContent.style.display = 'none';
        successContent.style.display = 'block';
        
        setTimeout(() => {
            window.location.href = redirectPage;
        }, redirectDelay);
    }

    function verifyCode() {
        const enteredCode = getEnteredCode();
        
        if (!isValidCodeLength(enteredCode)) {
            showErrorState();
            return;
        }

        if (isCorrectCode(enteredCode)) {
            showSuccessUI();
        } else {
            showErrorState();
        }
    }

    function getEnteredCode() {
        return Array.from(passwordInputs).map(input => input.value).join('');
    }

    function isValidCodeLength(code) {
        return code.length === 6;
    }

    function isCorrectCode(code) {
        return code === correctCode; // You'll need to define correctCode or get it from your server
    }

    function showErrorState() {
        statusIcon.className = 'fa-solid fa-times-circle error-icon';
        
        passwordContainer.classList.add('error');
        errorMessage.style.display = 'block';
        animateShake();
        
        passwordInputs[0].addEventListener('input', function resetIcon() {
            statusIcon.className = 'fa-regular fa-circle-check';
            statusIcon.style.color = '#4e51fd';
            passwordInputs[0].removeEventListener('input', resetIcon);
        });
    }

    function animateShake() {
        passwordContainer.style.animation = 'shake 0.5s';
        setTimeout(() => {
            passwordContainer.style.animation = '';
        }, 500);
    }

    function resetErrorState() {
        passwordContainer.classList.remove('error');
        errorMessage.style.display = 'none';
    }

    function handleInput(e) {
        const input = e.target;
        const index = parseInt(input.getAttribute('data-index'));
        
        resetErrorState();
        
        if (input.value.length === 1 && index < passwordInputs.length - 1) {
            passwordInputs[index + 1].focus();
        }
        
        checkAllInputsFilled();
    }

    function handleKeyDown(e) {
        const input = e.target;
        const index = parseInt(input.getAttribute('data-index'));
        
        if (e.key === 'Backspace') {
            if (input.value.length === 0 && index > 0) {
                passwordInputs[index - 1].focus();
            }
            input.value = '';
            checkAllInputsFilled();
        }
    }

    function handleKeyPress(e) {
        if (!isNumberKey(e.key) && e.key !== 'Enter') {
            e.preventDefault();
        }
        
        if (e.key === 'Enter') {
            verifyCode();
        }
    }

    function isNumberKey(key) {
        return key >= '0' && key <= '9';
    }
    
    // Expose function to show modal (to be used by the form submit handler)
    window.showPasswordResetModal = function() {
        openModal();
    };
});