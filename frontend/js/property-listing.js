document.addEventListener('DOMContentLoaded', () => {
    const propertiesContainer = document.getElementById('properties-container');
    const propertyFilter = document.getElementById('property-filter');

    // Fetch properties
    async function fetchProperties(location = '', priceRange = '') {
        try {
            const response = await fetch(`/api/properties?location=${location}&priceRange=${priceRange}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch properties');
            }

            const properties = await response.json();
            displayProperties(properties);
        } catch (error) {
            console.error('Error fetching properties:', error);
            propertiesContainer.innerHTML = '<p>Unable to load properties. Please try again later.</p>';
        }
    }

    // Display properties in the container
    function displayProperties(properties) {
        propertiesContainer.innerHTML = ''; // Clear previous results

        if (properties.length === 0) {
            propertiesContainer.innerHTML = '<p>No properties found.</p>';
            return;
        }

        properties.forEach(property => {
            const propertyCard = document.createElement('div');
            propertyCard.classList.add('property-card');
            propertyCard.innerHTML = `
                <img src="${property.imageUrl}" alt="${property.title}">
                <h3>${property.title}</h3>
                <p>Location: ${property.location}</p>
                <p>Price: $${property.price.toLocaleString()}</p>
                <p>Bedrooms: ${property.bedrooms}</p>
                <button class="view-details" data-id="${property.id}">View Details</button>
            `;
            propertiesContainer.appendChild(propertyCard);
        });

        // Add event listeners to view details buttons
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (e) => {
                const propertyId = e.target.dataset.id;
                window.location.href = `/property-details.html?id=${propertyId}`;
            });
        });
    }

    // Filter properties
    if (propertyFilter) {
        propertyFilter.addEventListener('submit', (e) => {
            e.preventDefault();
            const location = document.getElementById('location').value;
            const priceRange = document.getElementById('price-range').value;
            fetchProperties(location, priceRange);
        });
    }

    // Initial load of properties
    fetchProperties();
});