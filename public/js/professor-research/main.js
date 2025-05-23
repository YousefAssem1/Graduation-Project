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




/*-------------------------------------  last place the user stop  ----------------------------------------*/

document.addEventListener('DOMContentLoaded', function() {
    function setActiveTab(tabId) {
        const tab = document.querySelector(`#yearTabs a[href="#${tabId}"]`);
        if (tab) {
            document.querySelectorAll('#yearTabs .nav-link').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('show', 'active'));
            document.querySelector(`#${tabId}`).classList.add('show', 'active');
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

    const savedTab = localStorage.getItem('selectedTab') || 'year1'; // Default to 'year1' if no tab is saved
    const savedMajor = localStorage.getItem('selectedMajor') || 'All';

    setActiveTab(savedTab);
    setSelectedMajor(savedMajor);
    filterMaterials(savedMajor);

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



/*------------------------------------------------  reactev cards  ---------------------------------------------------*/

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

    document.addEventListener('DOMContentLoaded', function() {
        populateSemesterProjects('year1'); 
        populateSemesterProjects('year2'); 
    });