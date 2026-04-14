document.addEventListener("DOMContentLoaded", () => {
  const activityList = document.getElementById("activity-list");
  const summaryTotalActivities = document.getElementById("total-activities");
  const summaryTotalParticipants = document.getElementById("total-participants");
  const summaryOpenSpots = document.getElementById("total-open-spots");
  const adminActivitySelect = document.getElementById("admin-activity");
  const adminSignupForm = document.getElementById("admin-signup-form");
  const adminMessage = document.getElementById("admin-message");

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      renderDashboard(activities);
      populateAdminSelect(activities);
    } catch (error) {
      activityList.innerHTML =
        "<p>Failed to load admin data. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function renderDashboard(activities) {
    const activityEntries = Object.entries(activities);
    const totalActivities = activityEntries.length;
    let totalParticipants = 0;
    let totalOpenSpots = 0;

    const activityCards = activityEntries.map(([name, details]) => {
      const spotsLeft = details.max_participants - details.participants.length;
      totalParticipants += details.participants.length;
      totalOpenSpots += Math.max(spotsLeft, 0);

      const participantRows = details.participants.length
        ? details.participants
            .map(
              (email) =>
                `<li><span class="participant-email">${email}</span><button class="admin-delete-btn" data-activity="${encodeURIComponent(
                  name
                )}" data-email="${encodeURIComponent(email)}">Remove</button></li>`
            )
            .join("")
        : `<li><em>No participants yet</em></li>`;

      return `
        <div class="activity-card admin-card">
          <div class="admin-card-header">
            <h4>${name}</h4>
            <span class="badge">${spotsLeft} spots left</span>
          </div>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Capacity:</strong> ${details.max_participants}</p>
          <p><strong>Participants:</strong> ${details.participants.length}</p>
          <ul class="participants-list admin-participants-list">
            ${participantRows}
          </ul>
        </div>
      `;
    });

    summaryTotalActivities.textContent = totalActivities;
    summaryTotalParticipants.textContent = totalParticipants;
    summaryOpenSpots.textContent = totalOpenSpots;
    activityList.innerHTML = activityCards.join("");

    document.querySelectorAll(".admin-delete-btn").forEach((button) => {
      button.addEventListener("click", handleAdminRemove);
    });
  }

  function populateAdminSelect(activities) {
    adminActivitySelect.innerHTML =
      '<option value="">-- Select an activity --</option>';
    Object.keys(activities).forEach((activityName) => {
      const option = document.createElement("option");
      option.value = activityName;
      option.textContent = activityName;
      adminActivitySelect.appendChild(option);
    });
  }

  async function handleAdminRemove(event) {
    const button = event.target;
    const activity = decodeURIComponent(button.getAttribute("data-activity"));
    const email = decodeURIComponent(button.getAttribute("data-email"));

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();
      showAdminMessage(result.message || result.detail, response.ok);
      if (response.ok) {
        fetchActivities();
      }
    } catch (error) {
      showAdminMessage("Failed to remove participant. Please try again.", false);
      console.error("Error removing participant:", error);
    }
  }

  adminSignupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("admin-email").value;
    const activity = adminActivitySelect.value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(
          email
        )}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();
      showAdminMessage(result.message || result.detail, response.ok);
      if (response.ok) {
        adminSignupForm.reset();
        fetchActivities();
      }
    } catch (error) {
      showAdminMessage("Failed to add participant. Please try again.", false);
      console.error("Error adding participant:", error);
    }
  });

  function showAdminMessage(text, success) {
    adminMessage.textContent = text;
    adminMessage.className = success ? "success" : "error";
    adminMessage.classList.remove("hidden");
    setTimeout(() => {
      adminMessage.classList.add("hidden");
    }, 5000);
  }

  fetchActivities();
});
