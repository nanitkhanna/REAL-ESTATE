document.addEventListener('DOMContentLoaded', () => {
    const recommendedPropertiesContainer = document.getElementById('recommended-properties');
    const userNameElement = document.getElementById('user-name');

    // Fetch user profile and recommendations
    async function fetchRecommendations() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch('/api/recommendations', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }

            const data = await response.json();
            
            // Update user name
            if (userNameElement && data.user) {
                userNameElement.textContent = data.user.name;
            }

            // Display recommended properties
            if (recommendedPropertiesContainer) {
                displayRecommendedProperties(data.recommendations);
            }
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            if (recommendedPropertiesContainer) {
                recommendedPropertiesContainer.innerHTML = '<p>Unable to load recommendations. Please try again later.</p>';
            }
        }
    }

    // Display recommended properties
    function displayRecommendedProperties(properties) {
        recommendedPropertiesContainer.innerHTML = ''; // Clear previous recommendations

        if (!properties || properties.length === 0) {
            recommendedPropertiesContainer.innerHTML = '<p>No recommendations found.</p>';
            return;
        }

        properties.forEach(property => {
            const propertyCard = document.createElement('div');
            propertyCard.classList.add('recommendation-card');
            propertyCard.innerHTML = `
                <img src="${property.imageUrl}" alt="${property.title}">
                <div class="recommendation-details">
                    <h3>${property.title}</h3>
                    <p>Location: ${property.location}</p>
                    <p>Price: $${property.price.toLocaleString()}</p>
                    <p>Match Score: ${(property.matchScore * 100).toFixed(2)}%</p>
                    <button class="view-details" data-id="${property.id}">View Details</button>
                </div>
            `;
            recommendedPropertiesContainer.appendChild(propertyCard);
        });

        // Add event listeners to view details buttons
        document.querySelectorAll('.view-details').forEach(button => {
            button.addEventListener('click', (e) => {
                const propertyId = e.target.dataset.id;
                window.location.href = `/property-details.html?id=${propertyId}`;
            });
        });
    }

    // Fetch recommendations
    fetchRecommendations();
});