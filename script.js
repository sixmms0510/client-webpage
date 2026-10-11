document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");
  const clientsList = document.getElementById("clientsList");
  let currentEditingIndex = null;

  // Load clients from localStorage
  function loadClients() {
    const stored = localStorage.getItem("clients");
    return stored ? JSON.parse(stored) : [];
  }

  // Save clients to localStorage
  function saveClients(clients) {
    localStorage.setItem("clients", JSON.stringify(clients));
  }

  // Display clients in grid
  function renderClients() {
    const clients = loadClients();
    
    if (clients.length === 0) {
      clientsList.innerHTML = '<p class="empty-state">No clients yet. Add your first client above.</p>';
      return;
    }

    clientsList.innerHTML = clients.map((client, index) => `
      <div class="client-card">
        <div class="card-header">
          <h3>${client.name}</h3>
          <div class="card-actions">
            <button class="btn-edit" onclick="editClient(${index})" title="Edit">✎</button>
            <button class="btn-delete" onclick="deleteClient(${index})" title="Delete">✕</button>
          </div>
        </div>
        <p><strong>Email:</strong> ${client.email}</p>
        <p><strong>Phone:</strong> ${client.phone}</p>
        <p><strong>Notes:</strong> ${client.description || 'N/A'}</p>
      </div>
    `).join("");
  }

  // Add new client
  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      
      const clientName = document.getElementById("clientName").value;
      const clientEmail = document.getElementById("clientEmail").value;
      const clientPhone = document.getElementById("clientPhone").value;
      const clientDescription = document.getElementById("clientDescription").value;
      const adminEmail = document.getElementById("adminEmail").value;

      const newClient = {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        description: clientDescription,
        addedAt: new Date().toISOString()
      };

      const clients = loadClients();
      clients.push(newClient);
      saveClients(clients);

      // Send email notification
      await sendEmailNotification(newClient, adminEmail);

      // Visual feedback
      const button = form.querySelector("button");
      const originalText = button.textContent;
      button.textContent = "Client added!";
      button.disabled = true;

      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        form.reset();
        renderClients();
      }, 1800);
    });
  }

  // Send email notification
  async function sendEmailNotification(client, adminEmail) {
    try {
      const emailData = {
        to: adminEmail,
        subject: `New Client Added: ${client.name}`,
        body: `A new client has been added to the system:\n\nName: ${client.name}\nEmail: ${client.email}\nPhone: ${client.phone}\nNotes: ${client.description || 'N/A'}\n\nAdded at: ${new Date(client.addedAt).toLocaleString()}`
      };

      // Using FormSubmit.co for free email service (no backend required)
      const formData = new FormData();
      formData.append("email", adminEmail);
      formData.append("subject", emailData.subject);
      formData.append("message", emailData.body);
      formData.append("_captcha", "false");

      // You'll need to configure FormSubmit.co first - replace with your email endpoint
      // Alternatively, integrate with a service like EmailJS or SendGrid

      console.log("Email notification prepared:", emailData);
      // Uncomment below when email service is configured:
      // await fetch("https://formsubmit.co/your-email@example.com", {
      //   method: "POST",
      //   body: formData
      // });
    } catch (error) {
      console.error("Error sending email:", error);
    }
  }

  // Edit client
  window.editClient = (index) => {
    const clients = loadClients();
    const client = clients[index];
    currentEditingIndex = index;

    document.getElementById("editName").value = client.name;
    document.getElementById("editEmail").value = client.email;
    document.getElementById("editPhone").value = client.phone;
    document.getElementById("editDescription").value = client.description;

    const modal = document.getElementById("editModal");
    modal.style.display = "block";
  };

  // Save edited client
  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const clients = loadClients();
      clients[currentEditingIndex] = {
        ...clients[currentEditingIndex],
        name: document.getElementById("editName").value,
        email: document.getElementById("editEmail").value,
        phone: document.getElementById("editPhone").value,
        description: document.getElementById("editDescription").value
      };

      saveClients(clients);
      
      const modal = document.getElementById("editModal");
      modal.style.display = "none";
      renderClients();
    });
  }

  // Delete client
  window.deleteClient = (index) => {
    if (confirm("Are you sure you want to delete this client?")) {
      const clients = loadClients();
      clients.splice(index, 1);
      saveClients(clients);
      renderClients();
    }
  };

  // Modal close button
  const closeBtn = document.querySelector(".close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("editModal").style.display = "none";
    });
  }

  // Close modal when clicking outside
  window.addEventListener("click", (event) => {
    const modal = document.getElementById("editModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  // Export clients to JSON file
  window.exportClientsToFile = () => {
    const clients = loadClients();
    const dataStr = JSON.stringify(clients, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Initial render
  renderClients();
});
