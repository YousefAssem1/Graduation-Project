document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const professorsGrid = document.querySelector('.professors-grid');
    const searchBox = document.querySelector('.box input[name="search"]');
    const searchIcon = document.querySelector('.box a');
    const professorCards = professorsGrid ? Array.from(professorsGrid.querySelectorAll('.professor-card')) : [];
    const noFacultyDiv = document.querySelector('.no-faculty-members');
    
    // Function to create the no-results element
    function createNoResultsElement() {
        const noResultsDiv = document.createElement('div');
        noResultsDiv.className = 'no-results text-center w-100 py-5';
        noResultsDiv.style.display = 'none';
        noResultsDiv.style.transition = 'opacity 0.3s ease';
        noResultsDiv.style.opacity = '0';
        noResultsDiv.innerHTML = `
            <img src="/images/Publications-page/error.png" alt="No results" style="max-width: 200px;">
            <h4 class="mt-3 text-muted">No faculty members found</h4>
            <p class="text-muted">Try different keywords or check your spelling</p>
        `;
        professorsGrid.parentNode.insertBefore(noResultsDiv, professorsGrid.nextSibling);
        return noResultsDiv;
    }

    // Function to perform search with smooth transitions
    function performSearch(noResultsDiv) {
        const searchTerm = searchBox.value.toLowerCase().trim();
        let visibleCount = 0;

        professorCards.forEach(card => {
            const cardText = card.textContent.toLowerCase();
            const matchesSearch = searchTerm === '' || cardText.includes(searchTerm);
            
            if (matchesSearch) {
                card.style.display = 'block';
                visibleCount++;
            } else {
                card.style.display = 'none';
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

    // Initialize based on whether there are professors or not
    if (professorCards.length > 0) {
        // There are professors - set up search functionality
        const noResultsDiv = createNoResultsElement();

        // Event listeners with debouncing for better performance
        let searchTimeout;
        searchBox.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => performSearch(noResultsDiv), 100);
        });
        
        searchIcon.addEventListener('click', function(e) {
            e.preventDefault();
            performSearch(noResultsDiv);
        });
        
        searchBox.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch(noResultsDiv);
            }
        });

        // Initialize search
        performSearch(noResultsDiv);
    } else if (noFacultyDiv) {
        // No professors initially - show the "No faculty members" message
        noFacultyDiv.style.display = 'block';
        
        // Disable search functionality since there's nothing to search
        searchBox.disabled = true;
        searchBox.placeholder = 'No faculty members to search';
        searchIcon.style.pointerEvents = 'none';
        searchIcon.style.opacity = '0.5';
    }

    // Additional styling for no results/faculty states
});