import React from 'react';

function StoryItem({ story }) {
  if (!story) {
    return null;
  }

  // Helper to safely extract hostname
  const getHostname = (url) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  };

  const storyUrlHostname = story.url ? getHostname(story.url) : '';

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mb-4 hover:shadow-lg transition-shadow duration-200 ease-in-out">
      <h3 className="text-xl font-semibold mb-2">
        <a
          href={story.url || '#'} // Provide a fallback href
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          {story.title || '[No Title Available]'}
        </a>
        {storyUrlHostname && (
          <span className="text-xs text-gray-500 ml-2">({storyUrlHostname})</span>
        )}
      </h3>
      <div className="text-sm text-gray-600 space-x-4">
        <span>Score: <span className="font-medium text-orange-500">{story.score || 0}</span></span>
        <span>Comments: <span className="font-medium text-green-500">{story.commentsCount || 0}</span></span>
        {story.author && <span>By: <span className="font-medium text-gray-700">{story.author}</span></span>}
      </div>
    </div>
  );
}

export default StoryItem;
