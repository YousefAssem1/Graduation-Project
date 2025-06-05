// Configuration - Update these with your server details
const API_ENDPOINT = '/api/courses';

// DOM Elements
const dropdownButton = document.getElementById('majorDropdownButton');
const dropdownItems = document.querySelectorAll('.dropdown-item');
const searchBox = document.querySelector('.box input[name="search"]');
const yearTabs = document.querySelectorAll('#yearTabs a');

// Main function to initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Load courses from server
    loadCourses();

    // Set up dropdown functionality
    setupDropdown();

    // Set up search functionality
    setupSearch();

    // Set up tab functionality
    setupTabs();

    // Restore previous selections
    restoreSelections();
});

// Function to load courses from server
// Update the loadCourses function to include type parameter
async function loadCourses() {
    try {
        showLoadingState();
        
        // Get active year from tabs
        const activeYear = document.querySelector('.nav-link.active').getAttribute('href').replace('#year', '');
        const containerId = `year${activeYear}-courses`;
        const container = document.getElementById(containerId);
        
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const resourceType = urlParams.get('type');
        
        // Clear only the active container
        container.innerHTML = '<div class="col-12">Loading...</div>';
        
        // Get filter parameters
        const majorValue = dropdownButton.getAttribute('data-value') || 'all';
        const searchTerm = searchBox.value.trim();
        
        // Build query string
        const queryParams = new URLSearchParams({
            year: activeYear,
            major: majorValue,
            search: searchTerm
        });
        
        // Add type if present in URL
        if (resourceType) queryParams.set('type', resourceType);

        // Fetch courses for active year
        const response = await fetch(`${API_ENDPOINT}?${queryParams}`);
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const courses = await response.json();
        generateCourseCards(courses, activeYear);
        
    } catch (error) {
        console.error('Failed to load courses:', error);
        showErrorState();
    }
}


// Function to generate course cards from data
function generateCourseCards(courses, activeYear) {
    const container = document.getElementById(`year${activeYear}-courses`);
    container.innerHTML = ''; // Clear existing content

    if (courses.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4 text-muted">
                No courses available for Year ${activeYear}
            </div>
        `;
        return;
    }

    courses.forEach(course => {
        const card = createCourseCard(course);
        container.appendChild(card);
    });
}

// Function to create a single course card
function createCourseCard(course) {
    const majorsString = course.majors ? course.majors.join(' ') : '';
    // Use the correct path from the database (already includes 'uploads/')
    const imagePath = course.image_path ? `/${course.image_path}` : '/default-image.jpg';
    
    const col = document.createElement('div');
    col.className = 'col-md-3 col-sm-6 mb-2';
    col.setAttribute('data-major', majorsString);
    
    col.innerHTML = `
      <div class="card p-2 text-start" style="min-height: 150px;">
        <h6 class="card-title mt-2">${course.subject || 'Unnamed Course'}</h6>
        <img src="${imagePath}" alt="${course.subject || 'Course image'}" 
             style = "max-width: 325px; height: 171px;">
        <a href="/educational-reference?subject=${encodeURIComponent(course.subject)}&type=${encodeURIComponent(course.resource_type)}" 
           class="btn btn-sm mt-2" 
           style="background-color: #523DB9; color: white; text-decoration: none;">
            ${course.resource_type === 'primary_reference' ? 'View' : 'Read'}
        </a>
      </div>
    `;
    return col;
  }

// Function to set up dropdown functionality
function setupDropdown() {
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const selectedMajor = item.textContent.trim();
            const selectedValue = item.getAttribute('data-value');
            
            // Update dropdown button text
            if (dropdownButton) {
                dropdownButton.textContent = selectedMajor;
                dropdownButton.setAttribute('data-value', selectedValue);
            }
            
            // Save selection and reload courses from server
            localStorage.setItem('selectedMajor', selectedMajor);
            localStorage.setItem('selectedMajorValue', selectedValue);
            loadCourses(); // Server handles filtering
        });
    });
}

// Function to set up search functionality
function setupSearch() {
    if (searchBox) {
        // Trigger server reload when search term changes
        searchBox.addEventListener('input', function() {
            loadCourses();
        });
    }
}

// Function to set up tab functionality
function setupTabs() {
    yearTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const tabId = event.target.getAttribute('href').substring(1);
            localStorage.setItem('selectedTab', tabId);
            loadCourses(); // Add this line to reload data
        });
    });
}

// Function to restore previous selections
function restoreSelections() {
    // Restore major selection
    const savedMajor = localStorage.getItem('selectedMajor');
    const savedMajorValue = localStorage.getItem('selectedMajorValue');
    
    if (savedMajor && dropdownButton) {
        dropdownButton.textContent = savedMajor;
        dropdownButton.setAttribute('data-value', savedMajorValue);
    } else {
        // Default to 'All'
        dropdownButton.textContent = 'All';
        dropdownButton.setAttribute('data-value', 'all');
        localStorage.setItem('selectedMajor', 'All');
        localStorage.setItem('selectedMajorValue', 'all');
    }
    // Restore tab selection
    const savedTab = localStorage.getItem('selectedTab');
    if (savedTab) {
        const tab = document.querySelector(`#yearTabs a[href="#${savedTab}"]`);
        if (tab) {
            new bootstrap.Tab(tab).show();
        }
    }
}

// Function to show loading state
function showLoadingState() {
    const containers = [
        'year1-courses',
        'year2-courses',
        'year3-courses',
        'year4-courses'
    ];
    
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="mt-2">Loading courses...</p>
                </div>
            `;
        }
    });
}

// Function to show error state
function showErrorState() {
    const containers = [
        'year1-courses',
        'year2-courses',
        'year3-courses',
        'year4-courses'
    ];
    
    containers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-5 text-danger">
                    <i class="fas fa-exclamation-triangle fa-2x"></i>
                    <p class="mt-2">Failed to load courses. Please try again later.</p>
                    <button class="btn btn-sm btn-primary" onclick="loadCourses()">
                        Retry
                    </button>
                </div>
            `;
        }
    });
}