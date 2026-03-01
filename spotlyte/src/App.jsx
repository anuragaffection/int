import React, { useState, useEffect } from 'react';
import './App.css';

const Toast = ({ message, type }) => (
  <div className={`toast ${type}`}>
    {type === 'success' ? '✅' : '❌'} {message}
  </div>
);

const App = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toasts, setToasts] = useState([]);
  const limit = 20;

  useEffect(() => {
    fetchEvents(1);
  }, []);

  const fetchEvents = async (pageNum) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/data?page=${pageNum}&limit=${limit}`);
      const data = await response.json();

      setEvents(data.events);
      setTotalPages(data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error("Error fetching events:", error);
      showToast("Failed to load events", "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000); // Remove after 3s
  };

  const joinEvent = async (id) => {
    // Optimistic UI update approach
    setEvents(prevEvents =>
      prevEvents.map(evt => {
        if (evt.id === id) {
          return { ...evt, isJoining: true };
        }
        return evt;
      })
    );

    try {
      const response = await fetch(`http://localhost:3000/api/join/${id}`);
      const result = await response.json();

      if (response.ok) {
        showToast("Successfully joined!", "success");
        // Update accurately based on server response
        setEvents(prevEvents =>
          prevEvents.map(evt => {
            if (evt.id === id) {
              return { ...evt, joinedCount: result.currentCount, isJoining: false };
            }
            return evt;
          })
        );
      } else {
        showToast(result.error, "error");
        // Revert joining state
        setEvents(prevEvents =>
          prevEvents.map(evt => evt.id === id ? { ...evt, isJoining: false } : evt)
        );
      }
    } catch (error) {
      console.error("Error joining event:", error);
      showToast("Failed to join event", "error");
      setEvents(prevEvents =>
        prevEvents.map(evt => evt.id === id ? { ...evt, isJoining: false } : evt)
      );
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Spotlyte.</h1>
        <p>Curated social experiences in your city.</p>
      </header>

      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : (
        <>
          <div className="grid">
            {events.map((event) => {
              const isFull = event.joinedCount >= event.capacity;
              return (
                <div key={event.id} className={`card ${isFull ? 'full' : ''}`}>
                  <h3>{event.title}</h3>
                  <div className="stats">
                    <span>{event.joinedCount} / {event.capacity} spots filled</span>
                    <div className="progress-bar">
                      <div
                        className="progress"
                        style={{ width: `${Math.min((event.joinedCount / event.capacity) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <button
                    disabled={isFull || event.isJoining}
                    onClick={() => joinEvent(event.id)}
                  >
                    {event.isJoining ? 'Joining...' : (isFull ? 'Sold Out' : 'Join Event')}
                  </button>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={page === 1}
                onClick={() => fetchEvents(page - 1)}
              >
                Previous
              </button>
              <span className="page-info">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => fetchEvents(page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Toasts */}
      <div className="toast-wrapper">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </div>
    </div>
  );
};

export default App;