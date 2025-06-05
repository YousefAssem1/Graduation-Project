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






