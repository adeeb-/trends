const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Ensure axios is required

const app = express();
const PORT = process.env.PORT || 5001;

// Hacker News API base URL
const HN_API_BASE_URL = 'https://hacker-news.firebaseio.com/v0';

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON bodies

// --- Hacker News API Functions ---

async function getTopStoryIds() {
    try {
        const response = await axios.get(`${HN_API_BASE_URL}/topstories.json`);
        console.log('Fetched top story IDs:', response.data ? response.data.slice(0, 5) : 'No data'); // Log first 5 IDs
        return response.data;
    } catch (error) {
        console.error('Error fetching top story IDs:', error.isAxiosError ? error.message : error);
        // For now, rethrow. Error handling for routes will be added later.
        throw error;
    }
}

async function getItemDetails(id) {
    try {
        const response = await axios.get(`${HN_API_BASE_URL}/item/${id}.json`);
        const item = response.data;

        if (item) { // Check if item is not null
            // Log basic item info for debugging
            // console.log(`Fetched item ${id} type: ${item.type}, title: ${item.title ? item.title.substring(0,20) : 'N/A'}`);
            if (item.type === 'story') {
                return {
                    id: item.id,
                    title: item.title || '[no title]', // Default if title is missing
                    url: item.url || '', // Default if URL is missing
                    score: item.score || 0,
                    commentsCount: item.descendants || 0,
                    author: item.by || '[unknown author]',
                    time: item.time || 0
                };
            }
        }
        return null; // Return null if item is null, or not a story
    } catch (error) {
        console.error(`Error fetching details for item ${id}:`, error.isAxiosError ? error.message : error);
        // For now, rethrow.
        throw error;
    }
}

// --- Routes ---

// Simple root route
app.get('/', (req, res) => {
    res.json({ message: "Hacker News API Backend is running!" });
});

app.get('/api/hn/topstories', async (req, res) => {
    // Allow client to specify a limit, default to 15, max 50 for safety
    const limitQuery = parseInt(req.query.limit);
    const numberOfStories = (isNaN(limitQuery) || limitQuery <= 0) ? 15 : Math.min(limitQuery, 50);

    console.log(`Attempting to fetch top ${numberOfStories} Hacker News stories...`);

    try {
        const storyIds = await getTopStoryIds();

        if (!storyIds || storyIds.length === 0) {
            console.warn('No story IDs were returned from getTopStoryIds.');
            return res.status(500).json({ message: 'Could not fetch story IDs from Hacker News.' });
        }

        // Slice to get only the number of stories we need
        const topStoryIdsToFetch = storyIds.slice(0, numberOfStories);
        console.log(`Fetching details for ${topStoryIdsToFetch.length} story IDs.`);

        // Fetch story details for the selected IDs.
        // Promise.all will run these in parallel, which is efficient.
        const storyPromises = topStoryIdsToFetch.map(id => getItemDetails(id));
        const storiesDetails = await Promise.all(storyPromises);

        // Filter out any null results (e.g., if an item ID didn't resolve to a story)
        const validStories = storiesDetails.filter(story => story !== null);

        console.log(`Successfully fetched and processed ${validStories.length} stories.`);
        res.json(validStories);

    } catch (error) {
        // Log the error on the server for debugging
        console.error('Error in /api/hn/topstories endpoint:', error.message);
        // Send a generic error message to the client
        res.status(500).json({ message: 'An error occurred while fetching top stories.', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}. Open http://localhost:${PORT}/ to see the welcome message.`);
});
