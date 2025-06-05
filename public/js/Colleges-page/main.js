document.addEventListener('DOMContentLoaded', function() {
    const universitiesContainer = document.querySelector('.row.text-center.g-4.row-cols-md-3');
    const originalDisplay = universitiesContainer.style.display;
    
    const noResultsDiv = document.createElement('div');
    noResultsDiv.className = 'no-results text-center w-100';
    noResultsDiv.style.display = 'none';
    noResultsDiv.style.margin = '50px 0';
    
    const noResultsImg = document.createElement('img');
    noResultsImg.src = '/images/Colleges-page/error.png'; 
    noResultsImg.alt = 'No results found';
    noResultsImg.style.maxWidth = '200px';
    
    const noResultsText = document.createElement('h4');
    noResultsText.className = 'mt-3 text-muted';
    noResultsText.textContent = 'No Colleges found matching your search';
    
    
    noResultsDiv.appendChild(noResultsImg);
    noResultsDiv.appendChild(noResultsText);
    
    universitiesContainer.parentNode.insertBefore(noResultsDiv, universitiesContainer.nextSibling);

    function filterUniversities(selectedLocation, searchTerm = '') {
        const universities = document.querySelectorAll('.col-md');
        let visibleCount = 0;
        
        universities.forEach(university => {
            const location = university.getAttribute('data-major') || 'all';
            const universityTitle = university.querySelector('.card-title').textContent.toLowerCase();
            const matchesLocation = selectedLocation === 'All' || selectedLocation.toLowerCase() === 'all' || 
                                  location.toLowerCase() === selectedLocation.toLowerCase();
            const matchesSearch = universityTitle.includes(searchTerm.toLowerCase());

            if (matchesLocation && matchesSearch) {
                university.style.display = 'block';
                visibleCount++;
            } else {
                university.style.display = 'none';
            }
        });

        if (visibleCount === 0) {
            universitiesContainer.style.display = 'none';
            noResultsDiv.style.display = 'block';
        } else {
            universitiesContainer.style.display = originalDisplay;
            noResultsDiv.style.display = 'none';
        }
    }

    function setSelectedLocation(location) {
        const dropdownButton = document.getElementById('majorDropdownButton');
        if (dropdownButton) {
            const selectedItem = document.querySelector(`.dropdown-item[data-value="${location}"]`);
            dropdownButton.textContent = selectedItem ? selectedItem.textContent : 'All';
        }
    }

    const savedLocation = localStorage.getItem('selectedLocation') || 'all';
    setSelectedLocation(savedLocation);
    filterUniversities(savedLocation);

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault();
            const location = event.target.getAttribute('data-value') || 'all';
            localStorage.setItem('selectedLocation', location);
            setSelectedLocation(location);
            filterUniversities(location);
        });
    });

    const searchBox = document.querySelector('.box input[name="search"]');
    if (searchBox) {
        searchBox.addEventListener('input', function(event) {
            const searchTerm = event.target.value.trim();
            const selectedLocation = localStorage.getItem('selectedLocation') || 'all';
            filterUniversities(selectedLocation, searchTerm);
        });
    }
});