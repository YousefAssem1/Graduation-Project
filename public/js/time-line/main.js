document.addEventListener("DOMContentLoaded", function() {
    const containers = document.querySelectorAll('.con');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
            updateTimelineLine();
        });
    }, {
        threshold: 0.5
    });

    containers.forEach(container => {
        observer.observe(container);
    });

    function updateTimelineLine() {
        const firstContainer = containers[0];
        const lastContainer = containers[containers.length - 1];
        const scrollPosition = window.scrollY + window.innerHeight;
        const timelineStart = firstContainer.offsetTop;
        const timelineEnd = lastContainer.offsetTop + lastContainer.offsetHeight;
        const progress = (scrollPosition - timelineStart) / (timelineEnd - timelineStart);
        const timelineLineHeight = Math.min(progress * 100, 100);
        document.documentElement.style.setProperty('--timeline-height', `${timelineLineHeight}%`);
    }

    window.addEventListener('scroll', updateTimelineLine);
});