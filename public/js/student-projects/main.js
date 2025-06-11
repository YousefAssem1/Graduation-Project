document.addEventListener('DOMContentLoaded', function() {
    // 1. Tab Persistence and Filtering
    function setActiveTab(tabId) {
        const tab = document.querySelector(`#yearTabs a[href="#${tabId}"]`);
        if (tab) {
            document.querySelectorAll('#yearTabs .nav-link').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
            document.querySelector(`#${tabId}`).classList.add('show', 'active');
        }
    }

    // 2. Search Functionality
    function initializeSearch() {
        const searchBox = document.querySelector('.box input[name="search"]');
        const searchIcon = document.querySelector('.box a');
        
        // Create no results container if it doesn't exist
        if (!document.querySelector('.no-results')) {
            const noResultsContainer = document.createElement('div');
            noResultsContainer.className = 'no-results text-center py-5 d-none';
            noResultsContainer.innerHTML = `
                <img src="/images/Publications-page/error.png" alt="No results" style="max-width: 200px;">
                <h5>No projects found matching your search</h5>
            `;
            document.querySelector('.tab-content').appendChild(noResultsContainer);
        }

        function performSearch() {
            const searchTerm = searchBox.value.trim().toLowerCase();
            let hasResults = false;
            const activeTab = document.querySelector('.tab-pane.active');
            
            if (activeTab) {
                const projects = activeTab.querySelectorAll('.col-md-3.col-sm-6.mb-2');
                
                projects.forEach(project => {
                    const title = project.querySelector('.card-title')?.textContent.toLowerCase() || '';
                    const brief = project.querySelector('.card-text')?.textContent.toLowerCase() || '';
                    
                    const matches = title.includes(searchTerm) || brief.includes(searchTerm);
                    project.style.display = matches ? 'block' : 'none';
                    if (matches) hasResults = true;
                });
                
                // Show/hide no results message
                const noResults = document.querySelector('.no-results');
                if (noResults) {
                    if (searchTerm && !hasResults) {
                        noResults.classList.remove('d-none');
                    } else {
                        noResults.classList.add('d-none');
                    }
                }
            }
        }

        // Event listeners
        searchBox.addEventListener('input', performSearch);
        searchIcon.addEventListener('click', performSearch);
        
        // Also trigger search when tabs change
        document.querySelectorAll('#yearTabs a').forEach(tab => {
            tab.addEventListener('shown.bs.tab', function() {
                setTimeout(performSearch, 100);
            });
        });

        // Initial search
        performSearch();
    }

    // 3. Initialize everything
    function initializePage() {
        // Set active tab from localStorage or default
        const savedTab = localStorage.getItem('selectedTab') || 'year1';
        setActiveTab(savedTab);
        
        // Tab change event listeners
        document.querySelectorAll('#yearTabs a').forEach(tab => {
            tab.addEventListener('shown.bs.tab', function(event) {
                const tabId = event.target.getAttribute('href').substring(1);
                localStorage.setItem('selectedTab', tabId);
            });
        });
        
        // Initialize search
        initializeSearch();
    }

    // Start the application
    initializePage();
});
