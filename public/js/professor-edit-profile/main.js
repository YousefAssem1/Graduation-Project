document.addEventListener('DOMContentLoaded', () => {
    // Get form and file input with null checks
    const form = document.querySelector('form');
    const fileInput = document.getElementById('file');
    
    if (!form || !fileInput) {
        console.warn('Form elements not found - file validation disabled');
        return;
    }

    // Get optional elements
    const imagePreview = document.getElementById('image-preview');
    const uploadContent = document.getElementById('upload-content');
    const fileNameDisplay = document.getElementById('file-name-display');
    let fileError = document.getElementById('file-error');
    
    // Create error element if it doesn't exist
    if (!fileError) {
        fileError = document.createElement('div');
        fileError.id = 'file-error';
        fileError.className = 'text-danger';
        fileError.style.display = 'none';
        fileInput.parentNode.appendChild(fileError);
    }

    // File validation constants
    const allowedExtensions = /\.(jpe?g|png|gif)$/i;
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    // Form submission handler
    form.addEventListener('submit', (e) => {
        if (fileInput.files.length > 0 && !validateFile(fileInput.files[0])) {
            e.preventDefault();
        }
    });

    // File input change handler
    fileInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            if (validateFile(file)) {
                displayImagePreview(file);
            }
        } else {
            resetPreview();
        }
    });

    // Helper functions
    function validateFile(file) {
        // Check by file type AND by extension
        const isValidType = file.type.match(/^image\/(jpeg|jpg|png|gif)$/i);
        const isValidExtension = allowedExtensions.test(file.name);
        
        if (!isValidType && !isValidExtension) {
            showError('Unsupported file type. Please upload a JPEG, JPG, PNG, or GIF file.');
            resetFileInput();
            return false;
        }
        
        if (file.size > maxFileSize) {
            showError('File size exceeds the limit of 5MB.');
            resetFileInput();
            return false;
        }
        
        hideError();
        return true;
    }

    function showError(message) {
        fileError.textContent = message;
        fileError.style.display = 'block';
    }

    function hideError() {
        fileError.style.display = 'none';
    }

    function resetFileInput() {
        fileInput.value = '';
    }

    function resetPreview() {
        if (imagePreview) {
            imagePreview.style.display = 'none';
            imagePreview.src = '';
        }
        if (uploadContent) uploadContent.style.display = 'flex';
        if (fileNameDisplay) fileNameDisplay.textContent = '';
        hideError();
    }

    function displayImagePreview(file) {
        if (!imagePreview || !uploadContent || !fileNameDisplay) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Set image src and display it
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            
            // Hide upload content
            uploadContent.style.display = 'none';
            
            // Show filename beneath the image
            fileNameDisplay.textContent = formatFileName(file.name);
        };
        reader.readAsDataURL(file);
    }

    function formatFileName(fileName) {
        const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
        const extension = fileName.split('.').pop();
        const maxLength = 15;
        const truncatedName = nameWithoutExtension.length > maxLength 
            ? nameWithoutExtension.substring(0, maxLength) + '...' 
            : nameWithoutExtension;
        return truncatedName + '.' + extension;
    }
    
    // Initialize - ensure the container is ready for file uploads
    resetPreview();
});

document.addEventListener('DOMContentLoaded', () => {
    const universitySelect = document.getElementById('university-select');
    const collegeSelect = document.getElementById('college-select');
    const universityNameHidden = document.getElementById('university-name-hidden');
    let allColleges = [];
    let allUniversities = [];

    if (universitySelect && collegeSelect) {
        Promise.all([
            fetch('/api/universities'),
            fetch('/api/colleges')
        ])
        .then(async ([uniRes, colRes]) => {
            const universities = await uniRes.json();
            const colleges = await colRes.json();
            allColleges = colleges;
            allUniversities = universities;

            universitySelect.innerHTML = '<option value="" disabled selected>Select a University...</option>';
            universities.forEach(uni => {
                const option = new Option(uni.title, uni.id); // id = code, title = name
                universitySelect.add(option);
            });

            const initialUniName = document.getElementById('initial-university')?.value;
            const initialColName = document.getElementById('initial-college')?.value;

            if (initialUniName) {
                const initialUniversity = universities.find(uni => uni.title === initialUniName);
                if (initialUniversity) {
                    universitySelect.value = initialUniversity.id;
                    universityNameHidden.value = initialUniversity.title;
                    populateColleges(initialUniversity.id);

                    setTimeout(() => {
                        if (initialColName) collegeSelect.value = initialColName;
                    }, 50);
                }
            }
        });

        universitySelect.addEventListener('change', function () {
            const selectedCode = this.value;
            const selectedUniversity = allUniversities.find(uni => uni.id === selectedCode);
            if (selectedUniversity && universityNameHidden) {
                universityNameHidden.value = selectedUniversity.title;
            }
            populateColleges(selectedCode);
        });

        function populateColleges(universityCode) {
            collegeSelect.innerHTML = '<option value="" disabled selected>Select a College...</option>';
            const filtered = allColleges.filter(col => col.university_code === universityCode);

            filtered.forEach(col => {
                const option = new Option(col.title, col.title);
                collegeSelect.add(option);
            });

            collegeSelect.disabled = filtered.length === 0;
        }
    }
});
