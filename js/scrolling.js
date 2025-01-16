document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -45% 0px', // Adjust the root margin to target the center 10% of the page
        threshold: 0.5 // Adjust the threshold to 0.5 to ensure the section is at least 50% visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            navLinks.forEach(link => {
                if (link.getAttribute('href').substring(1) === entry.target.id) {
                    if (entry.isIntersecting) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                }
            });
        });
    }, observerOptions);

    sections.forEach(section => {
        observer.observe(section);
    });

    // Add click event listener to nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault(); // Prevent default anchor click behavior
            navLinks.forEach(nav => nav.classList.remove('active')); // Remove active class from all nav links
            this.classList.add('active'); // Add active class to the clicked nav link

            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);

            // Scroll the target element into the center of the viewport
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        });
    });
});