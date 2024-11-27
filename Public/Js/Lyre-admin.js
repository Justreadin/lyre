document.addEventListener("DOMContentLoaded", () => {
    const feedbackTableBody = document.querySelector(".feedback-table tbody");
    const logoutButton = document.querySelector(".logout-btn");
  
    // Fetch feedback data
    async function fetchFeedback() {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        alert("Unauthorized. Please log in again.");
        window.location.href = "signup.html";
        return;
      }
  
      try {
        const response = await fetch("/api/feedback", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.ok) {
          const feedbacks = await response.json();
          feedbackTableBody.innerHTML = "";
  
          feedbacks.forEach((feedback) => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${feedback.id}</td>
              <td>${feedback.user_email}</td>
              <td>${feedback.content}</td>
              <td>${new Date(feedback.timestamp).toLocaleString()}</td>
            `;
            feedbackTableBody.appendChild(row);
          });
        } else {
          alert("Failed to fetch feedback.");
        }
      } catch (error) {
        console.error("Error fetching feedback:", error);
      }
    }
  
    // Handle logout
    logoutButton.addEventListener("click", () => {
      sessionStorage.clear();
      window.location.href = "signup.html";
    });
  
    fetchFeedback();
  });
  