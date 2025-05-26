const API_BASE_URL = 'http://127.0.0.1:5000/api';
let allTrendsData = []; // To store all trends for category population

document.addEventListener('DOMContentLoaded', () => {
    fetchTrends();
});

async function fetchTrends(category = null) {
    let url = `${API_BASE_URL}/trends`;
    if (category) {
        url = `${API_BASE_URL}/trends/category/${category}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        displayTrends(data);

        // Populate categories only once with all trends data
        if (!category && data.length > 0 && allTrendsData.length === 0) {
            allTrendsData = data; // Store all trends
            populateCategories(allTrendsData);
        } else if (allTrendsData.length === 0 && data.length > 0) {
            // If the first load was a category filter, fetch all trends for categories
            const allTrendsResponse = await fetch(`${API_BASE_URL}/trends`);
            if (!allTrendsResponse.ok) {
                throw new Error(`HTTP error! status: ${allTrendsResponse.status}`);
            }
            allTrendsData = await allTrendsResponse.json();
            populateCategories(allTrendsData);
        }


    } catch (error) {
        console.error("Error fetching trends:", error);
        const trendsContainer = document.getElementById('trends-container');
        trendsContainer.innerHTML = '<p>Error loading trends. Please try again later.</p>';
    }
}

function displayTrends(trends) {
    const trendsContainer = document.getElementById('trends-container');
    trendsContainer.innerHTML = ''; // Clear existing content

    if (trends.length === 0) {
        trendsContainer.innerHTML = '<p>No trends found.</p>';
        return;
    }

    trends.forEach(trend => {
        const card = document.createElement('div');
        card.className = 'trend-card';

        const link = document.createElement('a');
        link.href = `trend.html?id=${trend.id}`;

        const nameElement = document.createElement('h3');
        nameElement.textContent = trend.name;

        const categoryElement = document.createElement('p');
        categoryElement.textContent = `Category: ${trend.category}`;

        link.appendChild(nameElement);
        link.appendChild(categoryElement);
        card.appendChild(link);
        trendsContainer.appendChild(card);
    });
}

function populateCategories(trends) {
    const categoryFiltersContainer = document.getElementById('category-filters');
    categoryFiltersContainer.innerHTML = ''; // Clear existing buttons

    const categories = [...new Set(trends.map(trend => trend.category))];

    createCategoryButton('All', () => fetchTrends(), categoryFiltersContainer);

    categories.forEach(category => {
        createCategoryButton(category, () => fetchTrends(category), categoryFiltersContainer);
    });
}

function createCategoryButton(name, eventListener, container) {
    const button = document.createElement('button');
    button.textContent = name;
    button.addEventListener('click', eventListener);
    container.appendChild(button);
}
