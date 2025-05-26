const API_BASE_URL = 'http://127.0.0.1:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    const trendId = new URLSearchParams(window.location.search).get('id');
    if (trendId) {
        fetchTrendDetails(trendId);
    } else {
        // Handle case where ID is missing, e.g., redirect or show error
        document.body.innerHTML = '<p>Trend ID is missing. <a href="index.html">Go back</a></p>';
    }
});

async function fetchTrendDetails(trendId) {
    try {
        const response = await fetch(`${API_BASE_URL}/trends/${trendId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        document.getElementById('trend-name').textContent = data.name;
        document.getElementById('trend-description').textContent = data.description || 'No description available.';
        document.getElementById('trend-category').textContent = data.category;
        document.getElementById('trend-date').textContent = new Date(data.date_discovered).toLocaleDateString();

        const interestData = data.interest_over_time; // Already an array of objects
        if (interestData && interestData.length > 0) {
            const labels = interestData.map(item => new Date(item.date).toLocaleDateString()); // Format date for better readability
            const values = interestData.map(item => item.value);
            renderTrendChart(labels, values);
        } else {
            const chartContainer = document.querySelector('.chart-container');
            if (chartContainer) {
                chartContainer.innerHTML = '<p>No interest data available for this trend.</p>';
            }
        }

    } catch (error) {
        console.error("Error fetching trend details:", error);
        // Display error message to the user
        const bodyElement = document.body;
        bodyElement.innerHTML = `<p>Error loading trend details. Please try again later. <a href="index.html">Go back</a></p><p><small>${error.message}</small></p>`;
    }
}

function renderTrendChart(labels, values) {
    const ctx = document.getElementById('trend-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Interest Over Time',
                data: values,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allows chart to better fit container
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
