 /*----------------------------------  upload the photo  ------------------------------------------*/


 document.getElementById('file').addEventListener('change', function(event) {
    const fileName = event.target.files[0].name; 
    document.getElementById('file-name-label').textContent = fileName; 
});


/*----------------------------------------------    dont care about   --------------------------------------------*/


 $(document).ready(function() {
            $('#hero-slider').owlCarousel({
                loop: true,
                margin: 0,
                nav: true,
                items: 1,
                dots: false,
                smartSpeed: 1000,
                navText: ['PREV', 'NEXT'],
            });

            document.addEventListener("DOMContentLoaded", function() {
                const navLinks = document.querySelectorAll(".nav-link");
                const navCollapse = document.querySelector(".navbar-collapse");

                navLinks.forEach(function(link) {
                    link.addEventListener("click", function() {
                        if (navCollapse.classList.contains("show")) {
                            new bootstrap.Collapse(navCollapse, { toggle: true });
                        }
                    });
                });
            });
        });







/*-------------------------------------- College minu bar -----------------------------------------*/


    document.getElementById('id_college').addEventListener('change', function(event) {
    const majorDropdown = document.getElementById('id_major');
    const allOptions = Array.from(majorDropdown.options); // Get all options

    allOptions.forEach(option => option.style.display = 'none');

    if (event.target.value === 'IT') {
        for (let i = 1; i <= 12; i++) {
            majorDropdown.querySelector(`option[value="${i}"]`).style.display = 'block';
        }
    } 
    else if (event.target.value === 'Engineering') {
        for (let i = 13; i <= 27; i++) {
            majorDropdown.querySelector(`option[value="${i}"]`).style.display = 'block';
        }
    } 
    else {
        allOptions.forEach(option => option.style.display = 'block');
    }

    majorDropdown.value = '';
});
