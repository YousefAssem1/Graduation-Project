document.addEventListener('DOMContentLoaded', function() {
    // Initialize Swiper
    var swiper = new Swiper(".mySwiper", {
        effect: "cube",
        allowTouchMove: false,
        grabCursor: false,
        cubeEffect: {
            shadow: true,
            slideShadows: true,
            shadowOffset: 20,
            shadowScale: 0.94,
        },
        mousewheel: false,
        keyboard: {
            enabled: false
        },
        on: {
            init: function() {
                updateActiveLink(this.activeIndex);
                // Initialize dropdown if starting on Slide 2
                if (this.activeIndex === 1) {
                    initializeUserDropdown();
                }
            },
            slideChange: function() {
                updateActiveLink(this.activeIndex);
                // Initialize dropdown when Slide 2 becomes active
                if (this.activeIndex === 1) {
                    initializeUserDropdown();
                }
            }
        }
    });

    // Handle hash changes
    window.addEventListener('hashchange', function(e) {
        e.preventDefault();
        window.location.hash = '';
    }, false);

    if(window.location.hash) {
        window.location.hash = '';
    }

    // Initialize all components
    initFileUploadForAllSlides();
    setupProfileDropdown();
    initializeSubjectsGrid();
    initializeGraduationProjectsGrid();
    initializeProfessorsGrid();
});

function updateActiveLink(index) {
    const links = document.querySelectorAll(".Links li");
    links.forEach(link => {
        link.classList.remove("activeLink");
    });
    
    if (links[index]) {
        links[index].classList.add("activeLink");
    }
}

function Navigate(index) {
    const swiper = document.querySelector('.mySwiper').swiper;
    if(index >= 0 && index < swiper.slides.length) {
        updateActiveLink(index);
        swiper.slideTo(index, 1000, true);
    }
}

// File upload functionality
function initFileUploadForAllSlides() {
    setupImageUpload('imageFiles', 'imageList');
}

function setupImageUpload(inputId, listId) {
    const imageInput = document.getElementById(inputId);
    const imageListElement = document.getElementById(listId);
    
    if (imageInput && imageListElement) {
        imageInput.addEventListener('change', function() {
            updateFileList(this.files, imageListElement, true);
        });
        
        setupDragAndDrop(imageInput, imageListElement, true);
    }
}

function setupDragAndDrop(fileInput, listElement, isImageUpload) {
    const uploadLabel = fileInput.nextElementSibling;
    
    if (uploadLabel) {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, preventDefaults, false);
        });
        
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, highlight, false);
        });
        
        ['dragleave', 'drop'].forEach(eventName => {
            uploadLabel.addEventListener(eventName, unhighlight, false);
        });
        
        uploadLabel.addEventListener('drop', function(e) {
            const dt = e.dataTransfer;
            const files = Array.from(dt.files).filter(file => {
                if (isImageUpload) {
                    return file.type.startsWith('image/');
                }
                return true;
            });
            
            if (files.length > 0) {
                const dataTransfer = new DataTransfer();
                files.forEach(file => dataTransfer.items.add(file));
                fileInput.files = dataTransfer.files;
                
                const event = new Event('change');
                fileInput.dispatchEvent(event);
            }
        }, false);
    }
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(e) {
    e.currentTarget.classList.add('highlight');
}

function unhighlight(e) {
    e.currentTarget.classList.remove('highlight');
}

// Profile dropdown functionality
function setupProfileDropdown() {
    const profileLink = document.querySelector(".profile-link");
    if (profileLink) {
        profileLink.addEventListener('click', function(e) {
            e.preventDefault();
            const dropdown = this.nextElementSibling;
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
    }

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.profile-link') && !e.target.closest('.dropdown-menu')) {
            const dropdowns = document.querySelectorAll('.dropdown-menu');
            dropdowns.forEach(dropdown => {
                dropdown.style.display = 'none';
            });
        }
    });
}
// Update the event listener to properly prevent default
document.getElementById('banForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // This should be at the very top
  
  const data = {
    email: document.getElementById('userEmailDropdown').value,
    ban_reason: document.getElementById('banReason').value
  };

  try {
    const response = await fetch('/ban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await response.json(); // Always parse JSON first
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to ban user');
    }
    
    showNotification('User banned successfully');
    document.getElementById('banForm').reset();
    document.getElementById('selectedUserName').textContent = '';
  } catch (error) {
    showNotification(error.message || 'Error banning user', 'error');
  }
});
// Dynamic dropdown for Slide 2 with database integration
async function initializeUserDropdown() {
    const dropdown = document.getElementById('userEmailDropdown');
    const nameDisplay = document.getElementById('selectedUserName');
    
    try {
        // Show loading state
        dropdown.innerHTML = '<option value="" disabled selected>Loading users...</option>';
        
        // Fetch users from API
        const response = await fetch('/api/users');
        const users = await response.json();
        
        // Clear and populate dropdown
        dropdown.innerHTML = '<option value="" disabled selected>&nbsp;</option>';
        
        if (!users.length) {
            dropdown.innerHTML = '<option value="" disabled selected>No users found</option>';
            return;
        }
        
        users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.email;
            option.textContent = user.email;
            // Use correct snake_case properties
            option.dataset.fullName = `${user.first_name} ${user.last_name}`;
            dropdown.appendChild(option);
        });
        
        dropdown.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            nameDisplay.textContent = selectedOption.dataset.fullName || '';
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        dropdown.innerHTML = '<option value="" disabled selected>Error loading users</option>';
        nameDisplay.textContent = 'Failed to load user data';
    }
}
function getAuthToken() {
    return ''; // Return empty string if not using auth
}




function showEmptyMessage(grid, message) {
    grid.innerHTML = `
        <div class="empty-state">
            ${message}
        </div>
    `;
}