document.addEventListener('DOMContentLoaded', function() {
   populateDropdowns();
    const professorFieldsContainer = document.getElementById('professor-fields-container');
    
    let allColleges = [];
    let allUniversities = [];
    // ========== Verification Modal Code ==========
    const body = document.querySelector("body");
    const overlay = document.querySelector(".overlay");
    const showModalBtn = document.querySelector("#showModalBtn");
    const verifyBtn = document.querySelector("#verifyBtn");
    const passwordInputs = document.querySelectorAll('.password input');
    const passwordContainer = document.querySelector('.password');
    const errorMessage = document.querySelector('.error-message');
    const verificationContent = document.querySelector("#verificationContent");
    const successContent = document.querySelector("#successContent");
    const statusIcon = document.querySelector("#statusIcon");
   

async function populateDropdowns() {
    try {
        const universitySelect = document.getElementById('university-select');
        const collegeSelect = document.getElementById('college-select');
        const collegeContainer = collegeSelect.parentElement;

        // إخفاء قائمة الكليات بالبداية
        collegeContainer.style.display = 'none';

        // جلب الجامعات
        const universitiesResponse = await fetch('/api/universities');
        const allUniversities = await universitiesResponse.json();

        universitySelect.innerHTML = '<option value="" disabled selected>Select your university...</option>';
        if (allUniversities.length > 0) {
            allUniversities.forEach(university => {
                const option = document.createElement('option');
                option.value = university.id;
                option.textContent = university.title;
                universitySelect.appendChild(option);
            });
        } else {
            universitySelect.innerHTML = '<option value="" disabled>No universities found</option>';
        }

        // جلب الكليات كلها
        const collegesResponse = await fetch('/api/colleges');
        allColleges = await collegesResponse.json();

        collegeSelect.innerHTML = '<option value="" disabled selected>Select your college...</option>';

        universitySelect.addEventListener('change', function () {
            const selectedUniversityId = this.value;

            if (selectedUniversityId) {
                // إظهار حقل الكليات
                collegeContainer.style.display = 'block';
                updateCollegeDropdown(selectedUniversityId);
            } else {
                // إخفاء حقل الكليات إذا ما تم اختيار جامعة
                collegeContainer.style.display = 'none';
                collegeSelect.innerHTML = '<option value="" disabled selected>Select your college...</option>';
            }
        });

    } catch (error) {
        console.error('Error populating dropdowns:', error);
        document.getElementById('university-select').innerHTML = '<option value="" disabled>Error loading universities</option>';
        document.getElementById('college-select').innerHTML = '<option value="" disabled>Error loading colleges</option>';
    }
}

function updateCollegeDropdown(universityId) {
    const collegeSelect = document.getElementById('college-select');

    // فلترة الكليات حسب university_id
    const filteredColleges = allColleges.filter(college => String(college.university_id) === String(universityId));

    // إعادة تعبئة القائمة
    collegeSelect.innerHTML = '<option value="" disabled selected>Select your college...</option>';

    if (filteredColleges.length > 0) {
        filteredColleges.forEach(college => {
            const option = document.createElement('option');
            option.value = college.id;
            option.textContent = college.title;
            collegeSelect.appendChild(option);
        });
    } else {
        collegeSelect.innerHTML = '<option value="" disabled>No colleges available</option>';
    }
}


// Add this function to update colleges based on selected university
function updateCollegeDropdown(universityCode) {
    const collegeSelect = document.getElementById('college-select');
    const filteredColleges = allColleges.filter(college => college.university_code === universityCode);
    
    // Clear existing options
    collegeSelect.innerHTML = '<option value="" disabled selected>Select your college...</option>';
    
    // Populate filtered colleges
    filteredColleges.forEach(college => {
        const option = document.createElement('option');
        option.value = college.id;
        option.textContent = college.title;
        collegeSelect.appendChild(option);
    });
}

// Add university change listener
document.getElementById('university-select').addEventListener('change', function() {
    updateCollegeDropdown(this.value);
});

    // Show modal when button is clicked
    showModalBtn.addEventListener("click", async function(e) {
        e.preventDefault();
        if (validateForm()) {
            try {
                const formData = {
    first_name: document.getElementById('firstName').value,
    last_name: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    password: document.getElementById('password').value,
    role: document.getElementById('role-select').value,
    major: document.getElementById('another-select').value
};
if (formData.role === 'professor') {
    formData.degree = document.getElementById('degree-select').value;
    formData.university = document.getElementById('university-select').value;
    formData.college = document.getElementById('college-select').value;
}

                const response = await fetch('/registration', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    openModal();
                } else {
                    if (data.redirect) {
                        window.location.href = data.redirect;
                    } else {
                        alert(data.error || 'Failed to send verification email');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        }
    });
    
    // Close modal when overlay is clicked
    overlay.addEventListener("click", closeModal);
    
    // Verify button click handler
    verifyBtn.addEventListener("click", verifyCode);
    
    // Input field event listeners
    passwordInputs.forEach(input => {
        input.addEventListener('input', handleInput);
        input.addEventListener('keydown', handleKeyDown);
        input.addEventListener('keypress', handleKeyPress);
    });

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
    }

    async function verifyCode() {
        const enteredCode = getEnteredCode();
        
        if (!isValidCodeLength(enteredCode)) {
            showErrorState("Please enter a complete 6-digit code");
            return;
        }

        try {
            const email = document.getElementById('email').value;
            const response = await fetch('/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    code: enteredCode
                })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccessUI();
                setTimeout(() => {
                    window.location.href = data.redirect || '/';
                }, 2000);
            } else {
                showErrorState(data.error || 'Verification failed. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showErrorState('An error occurred. Please try again.');
        }
    }

    function getEnteredCode() {
        return Array.from(passwordInputs).map(input => input.value).join('');
    }

    function isValidCodeLength(code) {
        return code.length === 6;
    }

    function showErrorState(message) {
        if (message) {
            errorMessage.textContent = message;
        }
        statusIcon.className = 'fa-solid fa-times-circle error-icon';
        statusIcon.style.color = '#ff4d4f';
        
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

    function checkAllInputsFilled() {
        const allFilled = Array.from(passwordInputs).every(input => input.value.length === 1);
        verifyBtn.disabled = !allFilled;
    }

    // ========== Login Form Code ==========
    const roleSelect = document.getElementById('role-select');
    const majorSelectContainer = document.getElementById('another-select-container');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const emailInput = document.getElementById('email');
    const emailError = document.getElementById('emailError');

  // Modify the toggleSelects function
function toggleSelects() {
    if (roleSelect.value === 'student') {
        majorSelectContainer.style.display = 'block';
        professorFieldsContainer.style.display = 'none';
    } else if (roleSelect.value === 'professor') {
        majorSelectContainer.style.display = 'none';
        professorFieldsContainer.style.display = 'block';
    } else {
        majorSelectContainer.style.display = 'none';
        professorFieldsContainer.style.display = 'none';
    }
}


    // Initialize the select visibility
    toggleSelects();
    roleSelect.addEventListener('change', toggleSelects);

    // Password toggle visibility
    document.querySelectorAll('.password-field').forEach(field => {
        const input = field.querySelector('input');
        const button = field.querySelector('.password-toggle');
        const svg = button.querySelector('svg');

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            if (input.type === 'password') {
                input.type = 'text';
                svg.innerHTML = `
                    <circle class="eye" cx="10.5" cy="10.5" r="2.25" />
                    <path class="top" d="M2 10.5C2 10.5 6.43686 15.5 10.5 15.5C14.5631 15.5 19 10.5 19 10.5" />
                    <path class="bottom" d="M2 10.5C2 10.5 6.43686 5.5 10.5 5.5C14.5631 5.5 19 10.5 19 10.5" />
                `;
            } else {
                input.type = 'password';
                svg.innerHTML = `
                    <circle class="eye" cx="10.5" cy="10.5" r="2.25" />
                    <path class="top" d="M2 10.5C2 10.5 6.43686 5.5 10.5 5.5C14.5631 5.5 19 10.5 19 10.5" />
                    <path class="bottom" d="M2 10.5C2 10.5 6.43686 15.5 10.5 15.5C14.5631 15.5 19 10.5 19 10.5" />
                    <g class="lashes">
                        <path d="M10.5 15.5V18" />
                        <path d="M14.5 14.5L15.25 17" />
                        <path d="M6.5 14.5L5.75 17" />
                        <path d="M3.5 12.5L2 15" />
                        <path d="M17.5 12.5L19 15" />
                    </g>
                `;
            }
        });
    });

    // Email validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function handleEmailValidation() {
        const email = emailInput.value.trim();
        const emailGroup = emailInput.closest('.wave-group');
        
        if (email === '') {
            emailError.style.display = 'none';
            emailGroup.classList.remove('error');
            return false;
        }
        
        if (!validateEmail(email)) {
            emailError.style.display = 'block';
            emailGroup.classList.add('error');
            return false;
        } else {
            emailError.style.display = 'none';
            emailGroup.classList.remove('error');
            return true;
        }
    }

    emailInput.addEventListener('blur', handleEmailValidation);
    emailInput.addEventListener('input', function() {
        if (emailError.style.display === 'block') {
            handleEmailValidation();
        }
    });

    // Password validation
    function checkPasswords() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const passwordGroup = confirmPasswordInput.closest('.wave-group');
        
        if (password === '' || confirmPassword === '') {
            passwordError.style.display = 'none';
            passwordGroup.classList.remove('error');
            return false;
        }
        
        if (password !== confirmPassword) {
            passwordError.style.display = 'block';
            passwordGroup.classList.add('error');
            return false;
        } else {
            passwordError.style.display = 'none';
            passwordGroup.classList.remove('error');
            return true;
        }
    }

    confirmPasswordInput.addEventListener('input', checkPasswords);

    // Form validation
    function validateForm() {
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const role = document.getElementById('role-select').value;
        
        // Basic required field validation
        if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
            alert('Please fill in all required fields');
            return false;
        }
        
        // Email validation
        if (!handleEmailValidation()) {
            return false;
        }
        
        // Password matching validation
        if (!checkPasswords()) {
            return false;
        }
        
        // Additional validation for students
         if (role === 'student') {
        const major = document.getElementById('another-select').value;
        if (!major) {
            alert('Please select your major');
            return false;
        }
    } else if (role === 'professor') {
        const degree = document.getElementById('degree-select').value;
        const college = document.getElementById('college-select').value;
        const university = document.getElementById('university-select').value;
        
        if (!degree || !college || !university) {
            alert('Please fill in all professor fields');
            return false;
        }
    }
    
    return true;
}
});