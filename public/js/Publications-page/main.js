document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const filterButtons = document.querySelectorAll('.filter-button');
    const professorsGrid = document.querySelector('.professors-grid');
    const searchBox = document.querySelector('.box input[name="search"]');
    const searchIcon = document.querySelector('.box a');
    const professorCards = document.querySelectorAll('.professor-card');
    
    // Create no results element
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results text-center w-100 py-5';
    noResultsDiv.innerHTML = `
        <img src="/images/Publications-page/error.png" alt="No results" style="max-width: 200px;">
        <h4 class="mt-3 text-muted">No professors found matching your search</h4>
    `;
    noResultsDiv.style.display = 'none';
    professorsGrid.parentNode.insertBefore(noResultsDiv, professorsGrid.nextSibling);

    // Map filter button values to database values
    const filterMap = {
        'all': 'all',
        'computer-science': ['Computer Science', 'Computer Information Systems'],
        'AI': 'Data Science and Artificial Intelligence',
        'Softwer': 'Software Engineering'
    };

    // Set initial active filter
    document.querySelector('[data-filter="all"]').classList.add('active');

    // Enhanced filter function with no results handling
    function filterProfessors() {
        const activeFilter = document.querySelector('.filter-button.active').dataset.filter;
        const searchTerm = searchBox.value.toLowerCase().trim();
        let visibleCount = 0;

        // First hide all cards
        professorCards.forEach(card => {
            card.style.display = 'none';
        });

        // Then show matching cards
        professorCards.forEach(card => {
            const cardCategory = card.dataset.category;
            const cardText = card.textContent.toLowerCase();
            
            // Determine if category matches
            let categoryMatch = false;
            if (activeFilter === 'all') {
                categoryMatch = true;
            } else {
                const filterValues = filterMap[activeFilter];
                if (Array.isArray(filterValues)) {
                    categoryMatch = filterValues.some(value => cardCategory.includes(value));
                } else {
                    categoryMatch = cardCategory.includes(filterValues);
                }
            }
            
            // Check search term
            const searchMatch = searchTerm === '' || cardText.includes(searchTerm);
            
            if (categoryMatch && searchMatch) {
                card.style.display = 'block';
                visibleCount++;
            }
        });

        // Handle no results with smooth transitions
        if (visibleCount === 0) {
            professorsGrid.style.opacity = '0';
            setTimeout(() => {
                professorsGrid.style.display = 'none';
                noResultsDiv.style.display = 'block';
                setTimeout(() => {
                    noResultsDiv.style.opacity = '1';
                }, 50);
            }, 300);
        } else {
            noResultsDiv.style.opacity = '0';
            setTimeout(() => {
                noResultsDiv.style.display = 'none';
                professorsGrid.style.display = 'grid';
                setTimeout(() => {
                    professorsGrid.style.opacity = '1';
                }, 50);
            }, 300);
        }
    }

    // Filter button event listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            filterProfessors();
        });
    });

    // Search event listeners
    const handleSearch = () => {
        // Reset to 'all' filter when searching
        if (searchBox.value.trim() !== '') {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelector('[data-filter="all"]').classList.add('active');
        }
        filterProfessors();
    };

    searchBox.addEventListener('input', handleSearch);
    searchIcon.addEventListener('click', (e) => {
        e.preventDefault();
        handleSearch();
    });
    searchBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Initialize filtering
    filterProfessors();
});