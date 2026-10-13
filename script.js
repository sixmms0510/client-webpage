document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");
  const clientsList = document.getElementById("clientsList");
  const downloadButton = document.getElementById("downloadClientData");
  let currentEditingIndex = null;

  emailjs.init({
    publicKey: "SXhXAGAvxg1LP9I1Q",
  });

  function loadClients() {
    const stored = localStorage.getItem("clients");
    return stored ? JSON.parse(stored) : [];
  }

  function saveClients(clients) {
    localStorage.setItem("clients", JSON.stringify(clients));
  }

  function renderClients() {
    const clients = loadClients();

    if (!clientsList) return;

    if (clients.length === 0) {
      clientsList.innerHTML =
        '<p class="empty-state">No clients yet. Add your first client above.</p>';
      return;
    }

    clientsList.innerHTML = clients
      .map(
        (client, index) => `
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
            <p><strong>Notes:</strong> ${client.description || "N/A"}</p>
          </div>
        `
      )
      .join("");
  }

  async function sendEmailNotification(client, adminEmail) {
    try {
      const templateParams = {
        to_email: adminEmail,
        client_name: client.name,
        client_email: client.email,
        client_phone: client.phone,
        client_description: client.description || "N/A",
        added_at: new Date(client.addedAt).toLocaleString(),
      };

      const result = await emailjs.send(
        "service_jpn24gg",
        "template_poeivum",
        templateParams
      );

      console.log("Email sent successfully:", result);
      return true;
    } catch (error) {
      console.error("EmailJS error:", error);
      return false;
    }
  }

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const clientName = document.getElementById("clientName").value.trim();
      const clientEmail = document.getElementById("clientEmail").value.trim();
      const clientPhone = document.getElementById("clientPhone").value.trim();
      const clientDescription = document.getElementById("clientDescription").value.trim();
      const adminEmail = document.getElementById("adminEmail").value.trim();

      if (!clientName || !clientEmail || !clientPhone || !adminEmail) {
        alert("Please complete all required fields.");
        return;
      }

      const newClient = {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        description: clientDescription,
        addedAt: new Date().toISOString(),
      };

      const clients = loadClients();
      clients.push(newClient);
      saveClients(clients);

      const button = form.querySelector("button");
      const originalText = button.textContent;

      button.textContent = "Adding...";
      button.disabled = true;

      try {
        await sendEmailNotification(newClient, adminEmail);
        button.textContent = "Client added!";
      } catch (error) {
        button.textContent = "Email failed";
      }

      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
        form.reset();
        renderClients();
      }, 1800);
    });
  }

  window.editClient = (index) => {
    const clients = loadClients();
    const client = clients[index];

    if (!client) return;

    currentEditingIndex = index;

    document.getElementById("editName").value = client.name;
    document.getElementById("editEmail").value = client.email;
    document.getElementById("editPhone").value = client.phone;
    document.getElementById("editDescription").value = client.description || "";
    document.getElementById("editModal").style.display = "block";
  };

  const editForm = document.getElementById("editForm");
  if (editForm) {
    editForm.addEventListener("submit", (event) => {
      event.preventDefault();

      if (currentEditingIndex === null) return;

      const clients = loadClients();
      clients[currentEditingIndex] = {
        ...clients[currentEditingIndex],
        name: document.getElementById("editName").value.trim(),
        email: document.getElementById("editEmail").value.trim(),
        phone: document.getElementById("editPhone").value.trim(),
        description: document.getElementById("editDescription").value.trim(),
      };

      saveClients(clients);

      document.getElementById("editModal").style.display = "none";
      renderClients();
    });
  }

  window.deleteClient = (index) => {
    if (!confirm("Are you sure you want to delete this client?")) return;

    const clients = loadClients();
    clients.splice(index, 1);
    saveClients(clients);
    renderClients();
  };

  const closeBtn = document.querySelector(".close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("editModal").style.display = "none";
    });
  }

  window.addEventListener("click", (event) => {
    const modal = document.getElementById("editModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });

  function exportClientsToFile() {
    const clients = loadClients();
    const json = JSON.stringify(clients, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (downloadButton) {
    downloadButton.addEventListener("click", exportClientsToFile);
  }

  renderClients();
});
