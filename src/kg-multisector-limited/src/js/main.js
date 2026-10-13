// This file contains the main JavaScript logic for the application. 
// It handles user interactions, such as navigation and dynamic content loading.

document.addEventListener('DOMContentLoaded', function() {
    const serviceLinks = document.querySelectorAll('.service-link');
    
    serviceLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const serviceId = this.getAttribute('data-service-id');
            loadServiceDetails(serviceId);
        });
    });

    function loadServiceDetails(serviceId) {
        // Logic to load service details dynamically
        // This could involve fetching data from an API or displaying a modal with service info
        console.log(`Loading details for service ID: ${serviceId}`);
    }
});