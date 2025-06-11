document.addEventListener('DOMContentLoaded', function() {
    let isSearching = false;
    
    // Tab functionality
    function setActiveTab(tabId) {
        const tab = document.querySelector(`#yearTabs a[href="#${tabId}"]`);
        if (tab) {
            document.querySelectorAll('#yearTabs .nav-link').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
            const activePane = document.querySelector(`#${tabId}`);
            if (activePane) {
                activePane.classList.add('show', 'active');
            }
        }
    }

    function showNoResultsMessage(container) {
        container.innerHTML = `
            <div class="col-12 text-center py-4 no-results-message">
                <img src="/images/Publications-page/error.png" alt="No results" style="max-width: 200px;">
                <h5>No materials found matching your search</h5>
                <p>Try different keywords or check back later</p>
            </div>
        `;
    }

    function filterMaterials(searchTerm = '') {
        let hasVisibleResults = false;
        const activeTab = document.querySelector('.tab-pane.active');
        if (!activeTab) return;

        const materials = activeTab.querySelectorAll('.col-md-3.col-sm-6.mb-2');
        
        materials.forEach(material => {
            const materialTitle = material.querySelector('.card-title')?.textContent.toLowerCase() || '';
            const matchesSearch = materialTitle.includes(searchTerm.toLowerCase());

            if (matchesSearch) {
                material.style.display = 'block';
                hasVisibleResults = true;
            } else {
                material.style.display = 'none';
            }
        });

        // Only show no results message if we're actively searching
        if (!hasVisibleResults && isSearching) {
            const noResultsContainer = document.createElement('div');
            noResultsContainer.className = 'col-12 no-results-message';
            showNoResultsMessage(noResultsContainer);
            
            // Check if there's already a no-results message
            const existingMessage = activeTab.querySelector('.no-results-message');
            if (existingMessage) {
                existingMessage.replaceWith(noResultsContainer);
            } else {
                activeTab.appendChild(noResultsContainer);
            }
        } else {
            // Remove any existing no-results message
            const existingMessage = activeTab.querySelector('.no-results-message');
            if (existingMessage) {
                existingMessage.remove();
            }
        }
    }

    // Initialize with saved preferences
    const savedTab = localStorage.getItem('selectedTab') || 'year1';
    setActiveTab(savedTab);
    // Initial filter without showing no-results message
    filterMaterials();

    // Tab event listeners
    document.querySelectorAll('#yearTabs a').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const tabId = event.target.getAttribute('href').substring(1);
            localStorage.setItem('selectedTab', tabId);
            const searchTerm = document.querySelector('.box input[name="search"]')?.value.trim() || '';
            filterMaterials(searchTerm);
        });
    });

    // Search box event listener
    const searchBox = document.querySelector('.box input[name="search"]');
    if (searchBox) {
        searchBox.addEventListener('input', function(event) {
            isSearching = event.target.value.trim().length > 0;
            const searchTerm = event.target.value.trim();
            filterMaterials(searchTerm);
        });
        
        // Also check when search box loses focus
        searchBox.addEventListener('blur', function(event) {
            isSearching = event.target.value.trim().length > 0;
        });
    }
});

// Your existing project-related functions remain the same
async function fetchProjectsFromDatabase(semester) {
    try {
        const response = await fetch(`/api/projects?semester=${semester}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching projects:', error);
        return []; 
    }
}

function createProjectCard(project) {
    return `
        <div class="col-md-3 col-sm-6 mb-2" data-major="computer-science software-engineering management-information-systems data-science-and-artificial-intelligence">
            <div class="card p-2 text-start" style="min-height: 150px;">
                <h6 class="card-title mt-2">${project.title}</h6>
                <a href="${project.path}" class="btn btn-sm mt-2" style="background-color: #7495ED; color: white;">Discover</a>
            </div>
        </div>
    `;
}

async function populateSemesterProjects(semesterId) {
    const containerId = semesterId === 'year1' ? 'DocPreparedResearches' : 
                      semesterId === 'year2' ? 'DocOngoingResearchWork' : 
                      'NoProjectsWork';
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div class="col-12 text-center py-4">Loading projects...</div>';
    
    try {
        const projects = await fetchProjectsFromDatabase(semesterId);
        
        container.innerHTML = '';
        
        if (projects.length === 0) {
            container.innerHTML = '<div class="col-12 text-center py-4">No research has been uploaded yet.</div>';
            return;
        }
        
        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            container.innerHTML += createProjectCard(project);
        }
        
    } catch (error) {
        console.error('Error loading projects:', error);
        container.innerHTML = '<div class="col-12 text-center py-4 text-danger">Error loading projects</div>';
    }
}