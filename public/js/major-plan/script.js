document.addEventListener('DOMContentLoaded', function() {
    // Initialize the offcanvas
    const offcanvas = new bootstrap.Offcanvas(document.getElementById('dynamicOffcanvas'));
    
    // Course data - can be expanded with more details
    const courseData = {
        "Programming 1": {
            description: "Introduction to programming concepts using c++",
            content: "<p>Covers variables, loops, functions, and basic algorithms.</p>"
        },
        "Programming 2": {
            description: "Advanced programming techniques",
            content: "<p>Data structures, algorithms, and software design patterns.</p>"
        },
        // Add all other courses here...
        "General Physics for Computer Science Students": {
            description: "Physics concepts relevant to computer science",
            content: "<p>Fundamental physics principles with computer science applications.</p>"
        }
        // Add all other courses similarly
    };

    // Function to handle course clicks
    function handleCourseClick(e) {
        e.preventDefault();
        const courseName = this.querySelector('span').textContent.trim();
        const course = courseData[courseName] || {
            description: "Course information",
            content: `<p>Details about ${courseName} will appear here.</p>`
        };

        // Update offcanvas content
        document.getElementById('dynamicOffcanvasLabel').textContent = courseName;
        document.getElementById('offcanvasContent').innerHTML = `
            <p><strong>Description:</strong> ${course.description}</p>
            ${course.content}
            <div class="mt-3">
                <button class="btn btn-sm btn-primary">View Syllabus</button>
                <button class="btn btn-sm btn-outline-secondary ms-2">View Resources</button>
            </div>
        `;
        
        // Show offcanvas
        offcanvas.show();
    }

    // Function to handle right-click
    function handleRightClick(e) {
        e.preventDefault();
        const listItem = this.closest('li');
        listItem.classList.toggle('done');
    }

    // Apply to all course links in the tree structure
    document.querySelectorAll('.tree a').forEach(link => {
        link.addEventListener('click', handleCourseClick);
        link.addEventListener('contextmenu', handleRightClick);
    });

    // Apply to all course links in other-courses
    document.querySelectorAll('.other-courses-item a').forEach(link => {
        link.addEventListener('click', handleCourseClick);
        link.addEventListener('contextmenu', handleRightClick);
    });
});