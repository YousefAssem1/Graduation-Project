document.addEventListener('DOMContentLoaded', () => {
    // College and Major Dropdown Logic
    const collegeDropdown = document.getElementById('id_college');
    if (collegeDropdown) {
        collegeDropdown.addEventListener('change', function(event) {
            const majorDropdown = document.getElementById('id_major');
            if (!majorDropdown) return;
            
            const allOptions = Array.from(majorDropdown.options); // Get all options

            // Hide all options initially
            allOptions.forEach(option => option.style.display = 'none');

            // Show options based on selected college
            if (event.target.value === 'IT') {
                const itMajors = [
                    "Computer Science",
                    "Computer Information Systems",
                    "Software Engineering",
                    "Data Science and Artificial Intelligence"
                ];
                itMajors.forEach(major => {
                    const option = majorDropdown.querySelector(`option[value="${major}"]`);
                    if (option) {
                        option.style.display = 'block';
                    }
                });
            } 
            else {
                // Show all options if no specific college is selected
                allOptions.forEach(option => option.style.display = 'block');
            }

            // Reset the selected value
            majorDropdown.value = '';
        });
    }

    // File Upload Validation - Enhanced version
    const form = document.querySelector('form');
    const fileInput = document.getElementById('file');
    
    if (form && fileInput) {
        // Get optional elements
        const imagePreview = document.getElementById('image-preview');
        const uploadContent = document.getElementById('upload-content') || document.getElementById('upload-text');
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
        const maxFileSize = 3 * 1024 * 1024; // 3MB (keeping original size from second file)

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
                showError('File size exceeds the limit of 3MB.');
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
            if (uploadContent) uploadContent.style.display = uploadContent.id === 'upload-text' ? 'block' : 'flex';
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
                fileNameDisplay.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }

        function formatFileName(fileName) {
            // Keep the original format from the second file
            const nameWithoutExtension = fileName.split('.').slice(0, -1).join('.');
            const maxLength = 20; // Original max length from second file
            if (nameWithoutExtension.length > maxLength) {
                return nameWithoutExtension.substring(0, maxLength) + '...';
            }
            return nameWithoutExtension;
        }
        
        // Initialize - ensure the container is ready for file uploads
        resetPreview();
    }
});