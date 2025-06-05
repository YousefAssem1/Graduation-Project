document.addEventListener('DOMContentLoaded', function() {
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
            },
            slideChange: function() {
                updateActiveLink(this.activeIndex);
            }
        }
    });

    window.addEventListener('hashchange', function(e) {
        e.preventDefault();
        window.location.hash = '';
    }, false);

    if(window.location.hash) {
        window.location.hash = '';
    }

    initFileUploadForAllSlides();
    setupProfileDropdown();
    initializeSubjectMaterials(); // Add this line
    initializeGraduationProjectsGrid();
    initializeProfessorsGrid();
    initializeInstitutionsGrids();
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


// Initialize file upload 

function initFileUploadForAllSlides() {
    setupImageUpload('imageFiles', 'imageList');
    setupImageUpload('imageFiles2', 'imageList2');
    setupImageUpload('facultyImageInput', 'facultyImagePreview')
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

function updateFileList(files, fileListElement, isImageUpload = false) {
    if (!fileListElement) return;
    
    fileListElement.innerHTML = '';
    
    if (files.length > 0) {
        Array.from(files).forEach(file => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            if (isImageUpload && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    fileItem.innerHTML = `
                        <img src="${e.target.result}" class="file-thumbnail" alt="${file.name}">
                        <span class="file-name">${file.name}</span>
                        <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    `;
                };
                reader.readAsDataURL(file);
            } else {
                fileItem.innerHTML = `
                    <i class="fas ${getFileIcon(file.name)} file-icon"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                `;
            }
            
            fileListElement.appendChild(fileItem);
        });
    }
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch(ext) {
        case 'pdf': return 'fa-file-pdf';
        case 'doc':
        case 'docx': return 'fa-file-word';
        case 'xls':
        case 'xlsx': return 'fa-file-excel';
        case 'ppt':
        case 'pptx': return 'fa-file-powerpoint';
        case 'zip':
        case 'rar': return 'fa-file-archive';
        default: return 'fa-file-alt';
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

async function initializeInstitutionsGrids() {
    const universitiesGrid = document.getElementById('universities-grid');
    const collegesGrid = document.getElementById('colleges-grid');

    try {
        // Fetch universities
        const universitiesResponse = await fetch('/api/universities');
        if (!universitiesResponse.ok) throw new Error('Failed to fetch universities');
        const universities = await universitiesResponse.json();

        // Fetch colleges
        const collegesResponse = await fetch('/api/colleges');
        if (!collegesResponse.ok) throw new Error('Failed to fetch colleges');
        const colleges = await collegesResponse.json();

        // Render universities
        if (universities.length === 0) {
            showEmptyMessage(universitiesGrid, "No universities available");
        } else {
            renderItems(universitiesGrid, universities, "university");
        }

        // Render colleges
        if (colleges.length === 0) {
            showEmptyMessage(collegesGrid, "No colleges available");
        } else {
            renderItems(collegesGrid, colleges, "college");
        }
    } catch (error) {
        console.error('Error initializing institutions:', error);
        showEmptyMessage(universitiesGrid, "Error loading universities");
        showEmptyMessage(collegesGrid, "Error loading colleges");
    }
}

//--------------------------------------  generate for slaid 2 Delete Faculty  ----------------------------------------//


async function initializeProfessorsGrid() {
    const grid = document.getElementById('professors-grid');
    
    try {
        const response = await fetch('/api/professors');
        if (!response.ok) throw new Error('Failed to fetch professors');
        const professors = await response.json();

        if (professors.length === 0) {
            showEmptyMessage(grid, "No professors available");
        } else {
            renderProfessorItems(grid, professors);
        }
    } catch (error) {
        console.error('Error loading professors:', error);
        showEmptyMessage(grid, "Error loading professors");
    }
}

function renderProfessorItems(grid, professors) {
    grid.innerHTML = '';
    
    professors.forEach(professor => {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.dataset.universityCode = professor.university_code;
        card.dataset.collegeName = professor.college_name;
        card.dataset.professorEmail = professor.professor_email;

        card.innerHTML = `
            <h3 class="article-title">${professor.professor_name}</h3>
            <p class="article-description">${professor.professor_major} - at ${professor.university_code} , ${professor.college_name} College</p>
            <img class="article-image" src="${professor.professor_image}">
            <div class="button-container">
                <button class="delete-btn">Delete Professor</button>
            </div>
        `;

        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const card = e.target.closest('.article-card');
            const universityCode = card.dataset.universityCode;
            const collegeName = card.dataset.collegeName;
            const professorEmail = card.dataset.professorEmail;

            showConfirmationModal(
                `Delete professor ${professor.professor_name} (${professorEmail})?`, 
                async () => {
                    try {
                        const response = await fetch(
                            `/api/universities/${encodeURIComponent(universityCode)}/colleges/${
                            encodeURIComponent(collegeName)}/professors/${
                            encodeURIComponent(professorEmail)}`, 
                            { method: 'DELETE' }
                        );

                        if (!response.ok) throw new Error('Failed to delete professor');
                        
                        card.classList.add('fade-out');
                        setTimeout(() => card.remove(), 300);
                        showNotification('Professor deleted successfully', 'success');
                    } catch (error) {
                        console.error('Delete error:', error);
                        showNotification(error.message, 'error');
                    }
                }
            );
        });

        grid.appendChild(card);
    });
}



//--------------------------------------  generate for slaid 3 Delete Subject  ----------------------------------------//
// In your initialization function
async function initializeSubjectMaterials() {
    const subjectSelect = document.getElementById('subjectSelect');
    const summariesGrid = document.getElementById('summaries-grid');
    const videosGrid = document.getElementById('videos-grid');
    const materialsGrid = document.getElementById('materials-grid');

    let currentSubject = null;
    let activeTab = 'summaries';

    // Fetch subjects from API
    try {
        const response = await fetch('/api/subjects');
        if (!response.ok) throw new Error('Failed to fetch subjects');
        const subjects = await response.json();
        
        subjectSelect.innerHTML = '';
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading subjects:', error);
        showNotification('Failed to load subjects', 'error');
    }

    // Tab change handler
    const tabElms = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElms.forEach(tabEl => {
        tabEl.addEventListener('shown.bs.tab', function(event) {
            activeTab = event.target.getAttribute('data-bs-target').replace('#', '');
            if (currentSubject) loadMaterialsForCurrentSubject();
        });
    });

    // Subject change handler
    subjectSelect.addEventListener('change', async function() {
        currentSubject = this.value;
        if (currentSubject) {
            try {
                await loadMaterialsForCurrentSubject();
            } catch (error) {
                console.error('Error loading materials:', error);
                showNotification('Failed to load materials', 'error');
            }
        }
    });

    async function loadMaterialsForCurrentSubject() {
    try {
        const response = await fetch(`/resources/${encodeURIComponent(currentSubject)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const resources = await response.json();
        
        // Map database types to tabs
        const grouped = {
    summaries: resources.filter(r => r.resourceType === 'summary'),
    videos: resources.filter(r => r.resourceType === 'video'),
    materials: resources.filter(r => r.resourceType === 'primary_reference')
};
         if (!resources || resources.length === 0) {
            showEmptyMessage(summariesGrid, "No materials found");
            showEmptyMessage(videosGrid, "No materials found");
            showEmptyMessage(materialsGrid, "No materials found");
            return;
        }
        // Clear previous content
        [summariesGrid, videosGrid, materialsGrid].forEach(grid => {
            grid.innerHTML = ''; 
            grid.style.display = 'block';
        });

        renderMaterials(summariesGrid, grouped.summaries, 'summaries');
        renderMaterials(videosGrid, grouped.videos, 'videos');
        renderMaterials(materialsGrid, grouped.materials, 'materials');
        
    } catch (error) {
        console.error('Error loading materials:', error);
        showNotification('Failed to load materials', 'error');
    }
}

    function renderMaterials(grid, items, type) {
        if (!grid) return;
        grid.innerHTML = '';

        if (!items || items.length === 0) {
            showEmptyMessage(grid, `No ${type} available`);
            return;
        }

        const gridContainer = document.createElement('div');
        gridContainer.className = 'gri';

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'article-card';
            card.dataset.resourceId = item.id;

            const imageSrc = item.imagePath || getDefaultImage(type);
            const fileType = getFileType(item.filePath);

           card.innerHTML = `
    <div class="resource-header">
        ${imageSrc ? `<img src="${imageSrc}" class="resource-thumbnail" style="max-height: 300px; max-width: 250px;">` : ''}
        <div class="resource-info">
            <h3 class="article-title">${item.subject}</h3>
            <p class="article-description">${item.subjectBrief}</p>
            <div class="file-meta">
                <i class="fas ${fileType.icon}"></i>
                <span>${fileType.name}</span>
            </div>
        </div>
    </div>
    <div class="button-container">
        <button class="delete-btn">Delete</button>
    </div>
`;

            card.querySelector('.delete-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                showConfirmationModal(
                    `Delete this ${type} resource?`,
                    async () => {
                        try {
                            const response = await fetch(`/resources/${item.id}`, {
                                method: 'DELETE'
                            });
                            
                            if (!response.ok) throw new Error('Failed to delete resource');
                            
                            card.remove();
                            showNotification('Resource deleted successfully', 'success');
                        } catch (error) {
                            console.error('Delete error:', error);
                            showNotification(error.message, 'error');
                        }
                    }
                );
            });

            gridContainer.appendChild(card);
        });

        grid.appendChild(gridContainer);
    }

    function getDefaultImage(type) {
        const images = {
            summaries: '/images/default-summary.png',
            videos: '/images/default-video.png',
            materials: '/images/default-material.png'
        };
        return images[type];
    }

    function getFileType(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        const types = {
            pdf: { icon: 'fa-file-pdf', name: 'PDF' },
            doc: { icon: 'fa-file-word', name: 'Word' },
            docx: { icon: 'fa-file-word', name: 'Word' },
            mp4: { icon: 'fa-file-video', name: 'Video' },
            mov: { icon: 'fa-file-video', name: 'Video' },
            txt: { icon: 'fa-file-alt', name: 'Text' }
        };
        return types[ext] || { icon: 'fa-file', name: 'File' };
    }

    function showEmptyMessage(element, message) {
        if (!element) return;
        element.innerHTML = `<div class="empty-message">${message}</div>`;
    }
}


//-------------------------------  generate for slaid 4 Delete Graduation Projects  -----------------------------------//



async function initializeGraduationProjectsGrid() {
    const grid = document.getElementById('projects-grid');
    
    try {
        const response = await fetch('/api/graduation-projects');
        if (!response.ok) throw new Error('Failed to fetch projects');
        const projects = await response.json();

        if (projects.length === 0) {
            showEmptyMessage(grid, "No graduation projects available");
        } else {
            renderGraduationProjects(grid, projects);
        }
    } catch (error) {
        console.error('Error loading projects:', error);
        showEmptyMessage(grid, "Error loading projects");
    }
}
function renderGraduationProjects(grid, projects) {
    grid.innerHTML = '';
    
    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'article-card';
        card.dataset.projectId = project.id;
        
        card.innerHTML = `
            <h3 class="article-title">${project.title}</h3>
            <p class="article-description">${project.brief}</p>
            <img class="article-image" src="${project.image}">
            <div class="button-container">
                <button class="delete-btn">Delete Project</button>
            </div>
        `;
        
        const deleteBtn = card.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            const projectId = card.dataset.projectId;
            
            showConfirmationModal(
                `Delete project "${project.title}"?`, 
                async () => {
                    try {
                        const response = await fetch(`/api/graduation-projects/${projectId}`, {
                            method: 'DELETE'
                        });
                        
                        if (!response.ok) throw new Error('Failed to delete project');
                        
                        card.classList.add('fade-out');
                        setTimeout(() => card.remove(), 300);
                        showNotification('Project deleted successfully', 'success');
                    } catch (error) {
                        console.error('Delete error:', error);
                        showNotification(error.message, 'error');
                    }
                }
            );
        });
        
        grid.appendChild(card);
    });
}
function renderItems(grid, items, type) {
    grid.innerHTML = '';
    
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'article-card';
        
        // Add proper data attributes
        card.dataset.itemType = type;
        card.dataset.itemId = encodeURIComponent(item.id);
        
        // For colleges, add university code
        if (type === 'college') {
            card.dataset.universityCode = encodeURIComponent(item.universityCode);
        }
        
        card.innerHTML = `
            <h3 class="article-title">${item.title}</h3>
            <p class="article-description">${item.description}</p>
            <img class="article-image" src="${item.image}">
            <div class="button-container">
                <button class="delete-btn">Delete ${type.charAt(0).toUpperCase() + type.slice(1)}</button>
            </div>
        `;
        
        const deleteBtn = card.querySelector('.delete-btn');
       deleteBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const itemType = type.charAt(0).toUpperCase() + type.slice(1);
    const message = `You are about to delete this ${type} (${item.title}) permanently.`;

    showConfirmationModal(message, async () => {
        try {
            let endpoint;
            if (type === 'university') {
                endpoint = `/api/universities/${encodeURIComponent(item.id)}`;
            } else if (type === 'college') {
                endpoint = `/api/universities/${encodeURIComponent(item.university_code)}/colleges/${encodeURIComponent(item.id)}`;
            }
            
            const response = await fetch(endpoint, { method: 'DELETE' });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete item');
            }
            
            card.classList.add('fade-out');
            setTimeout(() => card.remove(), 300);
            showNotification(`${itemType} deleted successfully`, 'success');
            
        } catch (error) {
            console.error('Delete error:', error);
            showNotification(`Failed to delete ${type}: ${error.message}`, 'error');
        }
    });
});       
        grid.appendChild(card);
    });
}

function showEmptyMessage(grid, message) {
    grid.innerHTML = `
        <div class="empty-state">
            ${message}
        </div>
    `;
}
document.getElementById('projectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const submitBtn = document.querySelector('#add-faculty-btn'); // Fixed selector

    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }

    try {
        submitBtn.disabled = true;
        const textElement = submitBtn.querySelector('.text');
        if (textElement) {
            textElement.textContent = 'Adding...';
        }

        const response = await fetch('/add-faculty', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to add faculty member');
        }

        showNotification('Faculty member added successfully!', 'success');
        form.reset();
        document.getElementById('imageList').innerHTML = '';

    } catch (error) {
        console.error(error);
        showNotification(error.message || 'An error occurred while adding faculty member', 'error');
    } finally {
        submitBtn.disabled = false;
        const textElement = submitBtn.querySelector('.text');
        if (textElement) {
            textElement.textContent = 'Add Faculty';
        }
    }
});



function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => {
        notification.classList.add('show');
        // Auto-remove after 3 seconds
        setTimeout(() => notification.remove(), 3000);
    }, 100);
}

// Add this at the top of your script
const confirmationModal = document.getElementById('confirmationModal');
const modalMessage = document.querySelector('.modal-message');
let currentDeleteCallback = null;

// Modal event listeners
document.querySelector('.close-modal').addEventListener('click', closeModal);
document.querySelector('.cancel-btn').addEventListener('click', closeModal);
document.querySelector('.delete-btn').addEventListener('click', () => {
    if (currentDeleteCallback) {
        currentDeleteCallback();
        closeModal();
    }
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === confirmationModal) {
        closeModal();
    }
});

function showConfirmationModal(message, callback) {
    modalMessage.textContent = message;
    currentDeleteCallback = callback;
    confirmationModal.style.display = 'block';
}

function closeModal() {
    confirmationModal.style.display = 'none';
    currentDeleteCallback = null;
}