////////////////////////////////////////////////////////////    Report section    ////////////////////////////////////////////////////////////////////
document.addEventListener('DOMContentLoaded', function() {
      const postsGrid = document.getElementById('posts-grid');
      const backdrop = document.querySelector('.backdrop');
      let clone = null;

      //  message if no reports
      function showNoPostsMessage() {
        const noPostsElement = document.createElement('div');
        noPostsElement.className = 'no-posts';
        noPostsElement.textContent = 'No posts available';
        postsGrid.appendChild(noPostsElement);
      }

      // create report
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

      // Function to load posts from the database
      async function loadPosts() {
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
    alert('Action failed. Please try again.');
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

          // In the zoomToCenter function, update the cloned buttons selector:
const clonedButtons = clone.querySelectorAll('.dismiss-btn, .delete-btn'); // Changed from .accept-btn/.reject-btn

clonedButtons.forEach(button => {
  button.addEventListener('click', function(e) {
    const action = button.classList.contains('dismiss-btn') ? 'accept' : 'reject';
    handleButtonClick(e, original, action); // Pass the action parameter
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
            // Update class check to match new button classes
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

      loadPosts();
    });

////////////////////////////////////////////////////////    Rest of the page    ///////////////////////////////////////////////////////////////////////

document.addEventListener('DOMContentLoaded', function() {
  function handleSlideChange(activeIndex) {
    if (activeIndex === 3) { // Index 3 corresponds to "Add Content" slide
      populateSubjectDropdown();
      setupContentFormSubmission();
    }
    if (activeIndex === 4) { // Index 4 corresponds to "Add Subjects" slide
      setupSubjectForm();
    }
  }  
  
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

    // Prevent hash changes from affecting navigation
    window.addEventListener('hashchange', function(e) {
        e.preventDefault();
        window.location.hash = '';
    }, false);

    if(window.location.hash) {
        window.location.hash = '';
    }

    // Initialize all components
    initTypingAnimations();
    initFileUploadForAllSlides();
    setupProfileDropdown();    
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

function setupSubjectForm() {
    const submitBtn = document.getElementById('submitSubjectBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            const title = document.getElementById('subjectTitle').value;
            const year = document.getElementById('subjectYear').value;
            const semester = document.getElementById('subjectSemester').value;
            const description = document.getElementById('subjectDescription').value;
            const files = document.getElementById('subjectFiles').files;
            const images = document.getElementById('imageFiles3').files;
            const majors = [];
            document.querySelectorAll('.majors-checkbox-group input[type="checkbox"]:checked').forEach(checkbox => {
                majors.push(checkbox.value);
            });            
            if (!title || !year || !semester) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Create FormData object for submission
            const formData = new FormData();
            formData.append('title', title);
            formData.append('year', year);
            formData.append('semester', semester);
            formData.append('description', description);
            console.log("Selected majors:", majors);
             

            
            // Add files
            for (let i = 0; i < files.length; i++) {
                formData.append('files[]', files[i]);
            }
            
            // Add images
            for (let i = 0; i < images.length; i++) {
                formData.append('images[]', images[i]);
            }
            
            // Here you would typically send to server using fetch or AJAX
            console.log('Subject form data prepared:', {
                title, year, semester, description,
                fileCount: files.length,
                imageCount: images.length,
            });
            
            // Simulate form submission
            setTimeout(() => {
                alert('Subject added successfully!');
                // Reset form
                document.getElementById('subjectTitle').value = '';
                document.getElementById('subjectYear').value = '';
                document.getElementById('subjectSemester').value = '';
                document.getElementById('subjectDescription').value = '';
                document.getElementById('subjectFileList').innerHTML = '';
                document.getElementById('imageList3').innerHTML = '';
            }, 1000);
        });}}

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

//////////////////////////////////////////////////////////    Option generation    ////////////////////////////////////////////////////////////
document.getElementById('projectForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const formData = new FormData(this);
  const submitBtn = this.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;

  try {
      // Show loading state
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
          this.reset();
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
  } finally {
      submitBtn.innerHTML = originalBtnText;
  }
});
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
          notification.remove();
      }, 3000);
  }, 100);
}
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
// Call this when Slide 4 (Add Content) is activated
function handleAddContentSlide() {
  populateSubjectDropdown();
  
  // Update your form submission handler
  document.getElementById('contentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('subject', document.getElementById('projectSubject').value);
    formData.append('contentType', document.getElementById('contentType').value);
    formData.append('description', document.getElementById('projectDescription2').value);
    formData.append('contentFile', document.getElementById('projectFiles2').files[0]);

    try {
      const response = await fetch('/api/add-content', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        showNotification('Content added successfully!', 'success');
        // Reset form
        e.target.reset();
        document.getElementById('fileList2').innerHTML = '';
      } else {
        showNotification(result.error || 'Failed to add content', 'error');
      }
    } catch (error) {
      showNotification('Network error - please try again', 'error');
    }
  });
}
function setupContentFormSubmission() {
  const form = document.getElementById('contentForm');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');
    
    try {
      submitBtn.disabled = true;
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
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Upload Content';
    }
  });
}

// Update majors mapping to handle actual checkbox values
const majorSlugs = {
  'Computer Science': 'computer-science',
  'Software Engineering': 'software-engineering',
  'Computer Information Systems': 'computer-information-systems',
  'Artificial Intelligence': 'artificial-intelligence'
};

// In your route handler:
dbEntry.majors = JSON.parse(majors).map(m => majorSlugs[m]);
function setupSubjectForm() {
  const form = document.getElementById('subjectForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const contentType = document.getElementById('subjectContentType').value
    const formData = new FormData();
    formData.append('contentType', contentType);
    const filesInput = document.getElementById('subjectFiles');
    const imageInput = document.getElementById('imageFiles3');

    // Validate files
    if (filesInput.files.length === 0 || imageInput.files.length === 0) {
      showNotification('Please upload both document and image files', 'error');
      return;
    }

    // Append files with EXACT field names
    Array.from(filesInput.files).forEach(file => {
      formData.append('subjectFile', file); // Note singular name
    });
    
    Array.from(imageInput.files).forEach(image => {
      formData.append('subjectImage', image); // Singular name
    });

    // Append other form data
    formData.append('subjectTitle', document.getElementById('subjectTitle').value);
    formData.append('subjectYear', document.getElementById('subjectYear').value);
    formData.append('subjectDescription', document.getElementById('subjectDescription').value);
    
    // Handle checkboxes
    const majors = Array.from(
      document.querySelectorAll('.majors-checkbox-group input[type="checkbox"]:checked')
    ).map(cb => cb.value);
    formData.append('majors', JSON.stringify(majors));

    try {
      const response = await fetch('/add-subject', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      if (result.subjectId) {
        showNotification('Subject created successfully!', 'success');
        form.reset();
        // Clear file previews
        document.getElementById('subjectFileList').innerHTML = '';
        document.getElementById('imageList3').innerHTML = '';
      } else {
        showNotification(result.error || 'Error creating subject', 'error');
      }
    } catch (error) {
      showNotification('Network error', 'error');
    }
  });
}