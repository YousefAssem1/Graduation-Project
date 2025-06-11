document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initTypingAnimations();
  initFileUploadForAllSlides();
  setupProfileDropdown();
  setupFormSubmissions();
  setupReportSection();
  
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
        handleSlideChange(this.activeIndex);
      },
      slideChange: function() {
        updateActiveLink(this.activeIndex);
        handleSlideChange(this.activeIndex);
      }
    }
  });

  // Add click handler for Jana button
  const janaButton = document.querySelector('.buttonGroup a[href="#rr"]');
  if (janaButton) {
    janaButton.addEventListener('click', function(e) {
      e.preventDefault();
      Navigate(1); // Navigate to Slide 2 (index 1)
    });
  }
});

// Update active link in sidebar
function updateActiveLink(index) {
  const links = document.querySelectorAll(".Links li");
  links.forEach(link => {
    link.classList.remove("activeLink");
  });
  
  if (links[index]) {
    links[index].classList.add("activeLink");
  }
}

// Navigate to specific slide
function Navigate(index) {
  const swiper = document.querySelector('.mySwiper').swiper;
  if(index >= 0 && index < swiper.slides.length) {
    updateActiveLink(index);
    swiper.slideTo(index, 1000, true);
  }
}

// Handle slide-specific initialization
function handleSlideChange(activeIndex) {
  if (activeIndex === 1) { // Reports section
    loadReportedPosts();
  }
  if (activeIndex === 2) { // Graduation Projects
    // No special initialization needed
  }
  if (activeIndex === 3) { // Add Content
    populateSubjectDropdown();
  }
  if (activeIndex === 4) { // Add Subjects
    // No special initialization needed
  }
}

// Typing animation effects
function initTypingAnimations() {
  const stylizedName = document.querySelector(".stylized-name");
  const professions = document.querySelector(".proffesions");
  const heroLine = document.querySelector(".heroline");
  const readyText = document.querySelector(".ready-text");
  const readyImage = document.querySelector(".ready-image");

  if (stylizedName && professions && heroLine && readyText)  {
    typeText(stylizedName, "Admin Dashboard", 100);
    setTimeout(() => {
      typeText(professions, "Manage Your University", 100);
    }, 1500);
    setTimeout(() => {
      typeText(heroLine, "Welcome to the admin panel where you can manage students, projects, and more.", 30);
    }, 4000);

    setTimeout(() => {
      typeText(readyText, "Are you ready to work?", 30);
    }, 6500);
  }
}

// Type text animation
function typeText(element, text, speed, onComplete) {
  let i = 0;
  element.textContent = "";
  const typing = setInterval(() => {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
    } else {
      clearInterval(typing);
      if (onComplete) onComplete();
    }
  }, speed);
}

// Initialize file upload functionality for all slides
function initFileUploadForAllSlides() {
  // Initialize for Slide 3 (Graduation Projects)
  setupFileUpload('projectFiles', 'fileList');
  setupImageUpload('imageFiles', 'imageList');
  
  // Initialize for Slide 4 (Add Content)
  setupFileUpload('projectFiles2', 'fileList2');
  
  // Initialize for Slide 5 (Add Subjects)
  setupFileUpload('subjectFiles', 'subjectFileList');
  setupImageUpload('imageFiles3', 'imageList3');
}

function setupFileUpload(inputId, listId) {
  const fileInput = document.getElementById(inputId);
  const fileListElement = document.getElementById(listId);
  
  if (fileInput && fileListElement) {
    fileInput.addEventListener('change', function() {
      updateFileList(this.files, fileListElement, false);
    });
    
    setupDragAndDrop(fileInput, fileListElement, false);
  }
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

// Notification system
function showNotification(message, type = 'info') {
    // Remove any existing notifications first
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }, 100);
}

// Setup all form submissions
function setupFormSubmissions() {
  // Graduation Projects Form (Slide 3)
// Graduation Projects Form (Slide 3) - Updated with strict validation
document.getElementById('projectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Get all form values
    const title = formData.get('projectTitle');
    const year = formData.get('projectYear');
    const semester = formData.get('projectSemester');
    const description = formData.get('projectDescription');
    const files = formData.getAll('projectFiles');
    const images = formData.getAll('projectImages');

    // Validate all required fields
    if (!title || !title.trim()) {
        showNotification('Project title is required', 'error');
        return;
    }

    if (!year || year === "null") {
        showNotification('Project year is required', 'error');
        return;
    }

    if (!semester || semester === "null") {
        showNotification('Project semester is required', 'error');
        return;
    }

    if (!description || !description.trim()) {
        showNotification('Project description is required', 'error');
        return;
    }

    if (files.length === 0) {
        showNotification('Please upload at least one project file', 'error');
        return;
    }

    if (images.length === 0) {
        showNotification('Please upload at least one project image', 'error');
        return;
    }

    // Validate file types
    const validFileTypes = ['.pdf', '.doc', '.docx', '.zip'];
    const invalidFiles = Array.from(files).some(file => {
        const extension = file.name.split('.').pop().toLowerCase();
        return !validFileTypes.includes('.' + extension);
    });

    if (invalidFiles) {
        showNotification('Only PDF, DOC, DOCX, and ZIP files are allowed', 'error');
        return;
    }

    // Validate image types
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const invalidImages = Array.from(images).some(image => {
        return !validImageTypes.includes(image.type);
    });

    if (invalidImages) {
        showNotification('Only JPG, PNG, and GIF images are allowed', 'error');
        return;
    }

    try {
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        const response = await fetch('/upload-project', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (result.success) {
            // Show success message
            showNotification('Project uploaded successfully!', 'success');
            
            // Reset form
            form.reset();
            document.getElementById('fileList').innerHTML = '';
            document.getElementById('imageList').innerHTML = '';
            
            // Collapse all accordion sections
            const collapses = document.querySelectorAll('.accordion-collapse.show');
            collapses.forEach(c => c.classList.remove('show'));
        } else {
            showNotification(result.error || 'Upload failed', 'error');
        }
    } catch (error) {
        showNotification('Network error - please try again', 'error');
        console.error('Upload error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
    }
});

  // Add Content Form (Slide 4)
  document.getElementById('contentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Validate required fields
    const subject = formData.get('subject');
    const contentType = formData.get('contentType');
    const file = formData.get('contentFile');

    if (!subject || !contentType) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (!file) {
      showNotification('Please upload a file', 'error');
      return;
    }

    try {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      
      const response = await fetch('/api/add-content', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('Content added successfully!', 'success');
        form.reset();
        document.getElementById('fileList2').innerHTML = '';
      } else {
        showNotification(result.error || 'Failed to add content', 'error');
      }
    } catch (error) {
      showNotification('Network error - please try again', 'error');
    } finally {
      submitBtn.innerHTML = originalBtnText;
    }
  });

  // Add Subjects Form (Slide 5)
  document.getElementById('subjectForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const form = this;
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;

    // Validate required fields
    const title = formData.get('subjectTitle');
    const year = formData.get('subjectYear');
    const files = formData.getAll('subjectFile');
    const images = formData.getAll('subjectImage');
    const majors = Array.from(document.querySelectorAll('.majors-checkbox-group input[type="checkbox"]:checked'));

    if (!title || !year) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    if (files.length === 0) {
      showNotification('Please upload at least one subject file', 'error');
      return;
    }

    if (images.length === 0) {
      showNotification('Please upload at least one subject image', 'error');
      return;
    }

    if (majors.length === 0) {
      showNotification('Please select at least one major', 'error');
      return;
    }

    try {
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
      
      const response = await fetch('/add-subject', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('Subject added successfully!', 'success');
        form.reset();
        document.getElementById('subjectFileList').innerHTML = '';
        document.getElementById('imageList3').innerHTML = '';
      } else {
        showNotification(result.error || 'Failed to add subject', 'error');
      }
    } catch (error) {
      showNotification('Network error - please try again', 'error');
    } finally {
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// Populate subject dropdown
async function populateSubjectDropdown() {
  const subjectSelect = document.getElementById('projectSubject');
  
  try {
    const response = await fetch('/api/subjects');
    if (!response.ok) throw new Error('Failed to fetch subjects');
    
    const subjects = await response.json();
    
    subjectSelect.innerHTML = '<option value="" disabled selected>&nbsp;</option>';
    
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading subjects:', error);
    showNotification('Failed to load subjects. Using default options.', 'error');
    
    // Fallback options
    const fallback = ['Mathematics', 'Computer Science', 'Physics'];
    fallback.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      subjectSelect.appendChild(option);
    });
  }
}

// Reports section functionality
function setupReportSection() {
  const postsGrid = document.getElementById('posts-grid');
  const backdrop = document.querySelector('.backdrop');
  let clone = null;

  // Show message if no reports
  function showNoPostsMessage() {
    const noPostsElement = document.createElement('div');
    noPostsElement.className = 'no-posts';
    noPostsElement.textContent = 'No posts available';
    postsGrid.appendChild(noPostsElement);
  }

  // Create report element
  function createPostElement(postData, isComment) {
    const postElement = document.createElement('div');
    postElement.className = 'post-container';
    postElement.dataset.postId = isComment ? postData.comment_id : postData.blog_id;
    postElement.dataset.postType = isComment ? 'comment' : 'blog';
  
    const content = `
      <div class="user-profile">
        <img src="${postData.user_image}" />
        <div>
          <h5>${postData.user_fname} ${postData.user_lname}</h5>
          <p>${new Date(postData.timestamp_).toLocaleDateString()}</p>
          ${isComment ? `<p>Comment on: ${postData.blog_title}</p>` : ''}
        </div>
      </div>
      <div class="post-title">${isComment ? 'Comment Report' : postData.blog_title}</div>
      <div class="transparent-box">
        <p class="post-text">${postData.blog_content || postData.comment_text}</p>
      </div>
      ${!isComment && postData.blog_image ? 
        `<img class="post-image" src="${postData.blog_image}">` : ''}
      <div class="buttons-container">
        <button class="dismiss-btn bbb">DISMISS REPORT</button>
        <button class="delete-btn bbb">DELETE CONTENT</button>
      </div>
    `;
  
    postElement.innerHTML = content;
    return postElement;
  }

  // Load reported posts
  async function loadReportedPosts() {
    try {
      const [blogsResponse, commentsResponse] = await Promise.all([
        fetch('/api/reported-blogs'),
        fetch('/api/reported-comments')
      ]);
      
      const blogs = await blogsResponse.json();
      const comments = await commentsResponse.json();
      const allPosts = [...blogs, ...comments];
      
      postsGrid.innerHTML = '';
      
      if (allPosts.length === 0) {
        showNoPostsMessage();
        return;
      }
      
      allPosts.forEach(post => {
        const isComment = !!post.comment_id;
        const postElement = createPostElement(post, isComment);
        postsGrid.appendChild(postElement);
      });
      
      initializePostEvents();
    } catch (error) {
      console.error('Error loading posts:', error);
      postsGrid.innerHTML = '';
      showNoPostsMessage();
    }
  }

  function initializePostEvents() {
    const postContainers = document.querySelectorAll('.post-container');

    async function handleButtonClick(e, container, action) {
      const postId = container.dataset.postId;
      const postType = container.dataset.postType;
  
      try {
        const response = await fetch(`/api/resolve-report/${postType}/${postId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action })
        });

        if (!response.ok) throw new Error('Action failed');
        
        // Remove original container
        container.remove();
        
        // Remove zoomed clone if exists
        if (clone) {
          clone.remove();
          clone = null;
          backdrop.classList.remove('active');
          document.querySelectorAll('.post-container').forEach(c => c.classList.remove('dimmed'));
        }

        // Check if any posts remain
        if (document.querySelectorAll('.post-container').length === 0) {
          showNoPostsMessage();
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification('Action failed. Please try again.', 'error');
      }
    }
          
    postContainers.forEach(container => {
      const buttons = container.querySelectorAll('.dismiss-btn, .delete-btn');
      buttons.forEach(button => {
        button.addEventListener('click', (e) => {
          const action = button.classList.contains('dismiss-btn') ? 'accept' : 'reject';
          handleButtonClick(e, container, action);
        });
      });
    });

    function zoomToCenter(original) {
      if (clone) clone.remove();

      const rect = original.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      clone = original.cloneNode(true);
      clone.classList.add('zoomed-clone');
      clone.style.top = `${rect.top + scrollTop}px`;
      clone.style.left = `${rect.left + scrollLeft}px`;
      clone.style.width = `${rect.width}px`;
      clone.style.height = `${rect.height}px`;
      
      const zoomedText = clone.querySelector('.post-text');
      if (zoomedText) {
        zoomedText.style.webkitLineClamp = 'unset';
        zoomedText.style.maxHeight = 'none';
        zoomedText.style.overflow = 'visible';
      }
      
      const zoomedButtons = clone.querySelector('.buttons-container');
      if (zoomedButtons) {
        zoomedButtons.style.opacity = '1';
        zoomedButtons.style.pointerEvents = 'auto';
      }
      
      document.body.appendChild(clone);

      const clonedButtons = clone.querySelectorAll('.dismiss-btn, .delete-btn');
      clonedButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          const action = button.classList.contains('dismiss-btn') ? 'accept' : 'reject';
          handleButtonClick(e, original, action);
        });
      });

      postContainers.forEach(container => {
        if (container !== original) {
          container.classList.add('dimmed');
        }
      });
      backdrop.classList.add('active');

      requestAnimationFrame(() => {
        const scale = Math.min(1.5, window.innerWidth * 0.8 / rect.width, window.innerHeight * 0.8 / rect.height);
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const elemCenterX = rect.left + rect.width / 2;
        const elemCenterY = rect.top + rect.height / 2;

        const translateX = centerX - elemCenterX;
        const translateY = centerY - elemCenterY;

        clone.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
      });
    }

    postContainers.forEach(container => {
      container.addEventListener('click', function(e) {
        if (e.target.classList.contains('dismiss-btn') || 
            e.target.classList.contains('delete-btn') ||
            e.target.closest('.buttons-container')) {
          return;
        }
        const textElement = container.querySelector('.post-text');
        if (textElement) {
          if (textElement.style.webkitLineClamp === 'unset') {
            textElement.style.webkitLineClamp = '3';
          } else {
            textElement.style.webkitLineClamp = 'unset';
          }
        }
        zoomToCenter(container);
      });
    });

    backdrop.addEventListener('click', function() {
      if (clone) {
        clone.remove();
        clone = null;
        postContainers.forEach(container => container.classList.remove('dimmed'));
        backdrop.classList.remove('active');
      }
    });
  }

  // Initial load
  loadReportedPosts();
}