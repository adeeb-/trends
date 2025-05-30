import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Assuming axios is available (though not installed yet)
import StoryItem from './components/StoryItem.jsx';

const API_BASE_URL = 'http://localhost:5001/api'; // Backend API URL

function App() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetching only 10 stories for the initial load
        const response = await axios.get(`${API_BASE_URL}/hn/topstories?limit=10`);
        setStories(response.data && Array.isArray(response.data) ? response.data : []); // Ensure stories is always an array
      } catch (err) {
        console.error("Error fetching stories:", err);
        let errorMessage = 'Failed to fetch stories. Is the backend server running?';
        if (err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          errorMessage = `Error ${err.response.status}: ${err.response.data.message || err.message}`;
        } else if (err.request) {
          // The request was made but no response was received
          errorMessage = 'No response from server. Check backend and network.';
        } else {
          // Something happened in setting up the request that triggered an Error
          errorMessage = err.message;
        }
        setError(errorMessage);
        setStories([]); // Clear stories on error
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="container mx-auto p-4 max-w-3xl"> {/* Added max-w-3xl for better readability */}
      <header className="text-center my-8">
        <h1 className="text-4xl font-bold text-orange-600">Hacker News Trends</h1>
        <p className="text-xl text-gray-600">Discover what's buzzing in the tech world!</p>
      </header>

      <main>
        {loading && (
          <div className="text-center py-10">
            <p className="text-2xl text-gray-500">Loading stories...</p>
            {/* You could add a spinner component here if you had one */}
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Oops! An error occurred: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!loading && !error && stories.length === 0 && (
          <div className="text-center py-10">
            <p className="text-2xl text-gray-500">No stories found.</p>
            <p className="text-gray-400">This could be because there are no stories, or the backend isn't responding as expected.</p>
          </div>
        )}

        {!loading && !error && stories.length > 0 && (
          <div className="space-y-4">
            {stories.map(story => (
              story && story.id ? <StoryItem key={story.id} story={story} /> : null // Added check for story and story.id
            ))}
          </div>
        )}
      </main>

      <footer className="text-center mt-12 py-6 border-t">
        <p className="text-gray-600">Powered by the Hacker News API</p>
      </footer>
    </div>
  );
}

export default App;
