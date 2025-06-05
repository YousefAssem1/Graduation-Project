/*---------------------------------------  for the selected boxs for the mejor -------------------------------*/

document.addEventListener("DOMContentLoaded", function () {
    const dropdownItems = document.querySelectorAll(".dropdown-item");
    const courseCards = document.querySelectorAll("[data-major]");

    dropdownItems.forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            const selectedMajor = item.textContent.trim().toLowerCase().replace(/\s+/g, "-");

            courseCards.forEach(card => {
                const cardMajors = card.getAttribute("data-major").split(" ");
                if (cardMajors.includes(selectedMajor) || selectedMajor === "all") {
                    card.style.display = "block";
                } else {
                    card.style.display = "none"; 
                }
            });
        });
    });
});
/*--------------------------------------    name for the Dropdown Menu   --------------------------------------*/

    document.addEventListener("DOMContentLoaded", function () {
        const dropdownButton = document.getElementById("majorDropdownButton");
        const dropdownItems = document.querySelectorAll(".dropdown-item");

        dropdownItems.forEach(item => {
            item.addEventListener("click", function (e) {
                e.preventDefault();
                const selectedMajor = item.textContent.trim(); 
                dropdownButton.textContent = selectedMajor; 
            });
        });
    });





/*-------------------------------------  last place the user stop  ----------------------------------------*/

document.addEventListener('DOMContentLoaded', function() {
    function setActiveTab(tabId) {
        const tab = document.querySelector(`#yearTabs a[href="#${tabId}"]`);
        if (tab) {
            new bootstrap.Tab(tab).show();
        }
    }

    function setSelectedMajor(major) {
        const dropdownButton = document.getElementById('majorDropdownButton');
        if (dropdownButton) {
            dropdownButton.textContent = major;
        }
    }

    function filterMaterials(selectedMajor) {
        const materials = document.querySelectorAll('.col-md-3.col-sm-6.mb-2');
        materials.forEach(material => {
            const majors = material.getAttribute('data-major').split(' ');
            if (selectedMajor === 'All' || majors.includes(selectedMajor.toLowerCase().replace(/ /g, '-'))) {
                material.style.display = 'block';
            } else {
                material.style.display = 'none'; 
            }
        });
    }

    const savedTab = localStorage.getItem('selectedTab');
    const savedMajor = localStorage.getItem('selectedMajor') || 'All'; 

    if (savedTab) {
        setActiveTab(savedTab);
    }
    if (savedMajor) {
        setSelectedMajor(savedMajor);
        filterMaterials(savedMajor); 
    }

    document.querySelectorAll('#yearTabs a').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(event) {
            const tabId = event.target.getAttribute('href').substring(1);
            localStorage.setItem('selectedTab', tabId);
        });
    });

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(event) {
            const major = event.target.textContent;
            localStorage.setItem('selectedMajor', major);
            setSelectedMajor(major);
            filterMaterials(major);
        });
    });
});

/*-----------------------------------------------------------------------------------------------------*/



/*----------------------------------------------  search bar code --------------------------------------------*/

document.addEventListener('DOMContentLoaded', function() {
    function filterMaterials(selectedMajor, searchTerm = '') {
        const materials = document.querySelectorAll('.col-md-3.col-sm-6.mb-2');
        materials.forEach(material => {
            const majors = material.getAttribute('data-major').split(' ');
            const materialTitle = material.querySelector('.card-title').textContent.toLowerCase();
            const matchesMajor = selectedMajor === 'All' || majors.includes(selectedMajor.toLowerCase().replace(/ /g, '-'));
            const matchesSearch = materialTitle.includes(searchTerm.toLowerCase());

            if (matchesMajor && matchesSearch) {
                material.style.display = 'block'; 
            } else {
                material.style.display = 'none'; 
            }
        });
    }
    function setSelectedMajor(major) {
        const dropdownButton = document.getElementById('majorDropdownButton');
        if (dropdownButton) {
            dropdownButton.textContent = major;
        }
    }
    const savedMajor = localStorage.getItem('selectedMajor') || 'All'; 
    setSelectedMajor(savedMajor);
    filterMaterials(savedMajor);
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(event) {
            const major = event.target.textContent;
            localStorage.setItem('selectedMajor', major);
            setSelectedMajor(major);
            filterMaterials(major); 
        });
    });
    const searchBox = document.querySelector('.box input[name="search"]');
    if (searchBox) {
        searchBox.addEventListener('input', function(event) {
            const searchTerm = event.target.value.trim();
            const selectedMajor = localStorage.getItem('selectedMajor') || 'All';
            filterMaterials(selectedMajor, searchTerm); 
        });
    }
});







// we need this in the end of the cors


// document.addEventListener('DOMContentLoaded', function() {
//     // Function to calculate Levenshtein distance
//     function levenshteinDistance(a, b) {
//         if (a.length === 0) return b.length;
//         if (b.length === 0) return a.length;

//         const matrix = [];

//         // Increment along the first column of each row
//         for (let i = 0; i <= b.length; i++) {
//             matrix[i] = [i];
//         }

//         // Increment each column in the first row
//         for (let j = 0; j <= a.length; j++) {
//             matrix[0][j] = j;
//         }

//         // Fill in the rest of the matrix
//         for (let i = 1; i <= b.length; i++) {
//             for (let j = 1; j <= a.length; j++) {
//                 if (b.charAt(i - 1) === a.charAt(j - 1)) {
//                     matrix[i][j] = matrix[i - 1][j - 1];
//                 } else {
//                     matrix[i][j] = Math.min(
//                         matrix[i - 1][j - 1] + 1, // substitution
//                         matrix[i][j - 1] + 1, // insertion
//                         matrix[i - 1][j] + 1 // deletion
//                     );
//                 }
//             }
//         }

//         return matrix[b.length][a.length];
//     }

//     // Function to find the closest matches
//     function findClosestMatches(searchTerm, materials, threshold = 2) {
//         const matches = [];

//         materials.forEach(material => {
//             const materialTitle = material.querySelector('.card-title').textContent.toLowerCase();
//             const distance = levenshteinDistance(searchTerm, materialTitle);

//             if (distance <= threshold) {
//                 matches.push({ material, distance });
//             }
//         });

//         // Sort matches by distance (closest first)
//         matches.sort((a, b) => a.distance - b.distance);

//         return matches.map(match => match.material);
//     }

//     // Function to filter materials by major and search term
//     function filterMaterials(selectedMajor, searchTerm = '') {
//         const materials = document.querySelectorAll('.col-md-3.col-sm-6.mb-2');
//         let filteredMaterials = [];

//         // First, filter by major
//         materials.forEach(material => {
//             const majors = material.getAttribute('data-major').split(' ');
//             const matchesMajor = selectedMajor === 'All' || majors.includes(selectedMajor.toLowerCase().replace(/ /g, '-'));

//             if (matchesMajor) {
//                 filteredMaterials.push(material); // Add to filtered list
//             }
//         });

//         // If there's a search term, find the closest matches
//         if (searchTerm) {
//             let closestMatches = [];

//             if (searchTerm.length < 15 ) {
//                 // For short search terms, show partial matches
//                 filteredMaterials.forEach(material => {
//                     const materialTitle = material.querySelector('.card-title').textContent.toLowerCase();
//                     if (materialTitle.includes(searchTerm.toLowerCase())) {
//                         closestMatches.push(material);
//                     }
//                 });
//             } else {
//                 // For longer search terms, use Levenshtein distance
//                 closestMatches = findClosestMatches(searchTerm.toLowerCase(), filteredMaterials);
//             }

//             materials.forEach(material => {
//                 if (closestMatches.includes(material)) {
//                     material.style.display = 'block'; // Show closest matches
//                 } else {
//                     material.style.display = 'none'; // Hide others
//                 }
//             });
//         } else {
//             // If no search term, show all materials matching the major
//             materials.forEach(material => {
//                 const majors = material.getAttribute('data-major').split(' ');
//                 const matchesMajor = selectedMajor === 'All' || majors.includes(selectedMajor.toLowerCase().replace(/ /g, '-'));

//                 if (matchesMajor) {
//                     material.style.display = 'block'; // Show matching major
//                 } else {
//                     material.style.display = 'none'; // Hide others
//                 }
//             });
//         }
//     }

//     // Function to set the selected major in the dropdown
//     function setSelectedMajor(major) {
//         const dropdownButton = document.getElementById('majorDropdownButton');
//         if (dropdownButton) {
//             dropdownButton.textContent = major;
//         }
//     }

//     // Load saved major from localStorage or default to 'All'
//     const savedMajor = localStorage.getItem('selectedMajor') || 'All';
//     setSelectedMajor(savedMajor);
//     filterMaterials(savedMajor);

//     // Add event listeners to dropdown items
//     document.querySelectorAll('.dropdown-item').forEach(item => {
//         item.addEventListener('click', function(event) {
//             const major = event.target.textContent;
//             localStorage.setItem('selectedMajor', major);
//             setSelectedMajor(major);
//             filterMaterials(major);
//         });
//     });

//     // Add event listener to the search box for real-time suggestions
//     const searchBox = document.querySelector('.box input[name="search"]');
//     if (searchBox) {
//         searchBox.addEventListener('input', function(event) {
//             const searchTerm = event.target.value.trim();
//             const selectedMajor = localStorage.getItem('selectedMajor') || 'All';
//             filterMaterials(selectedMajor, searchTerm);
//         });
//     }
// });