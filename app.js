// Use API_BASE_URL in your fetch calls, for example:
// fetch(`${config.API_BASE_URL}/get-invoices`)

const config = {
  API_BASE_URL: "https://ocp-provizie-final.onrender.com",
};

// Initialize global variables
let invoices = [];
let clientNames = [];
let quarterlyBonusPaidStatus = {};
const currentUser = localStorage.getItem("currentUser");

// Make functions globally accessible
window.updateQuarterStatus = updateQuarterStatus;
window.deleteInvoice = deleteInvoice;
window.editInvoice = editInvoice;
window.updatePaidStatus = updatePaidStatus;

function editInvoice(id) {
  console.log("Editing invoice:", id);
  const invoice = invoices.find((inv) => inv.id === parseInt(id));
  if (!invoice) {
    console.error("Invoice not found:", id);
    return;
  }

  // Populate form with invoice data
  document.getElementById("year").value = invoice.year;
  document.getElementById("month").value = invoice.month;
  document.getElementById("client-name").value = invoice.clientName;
  document.getElementById("invoice-amount").value = invoice.amount;
  document.getElementById("referral-bonus").value = invoice.bonusPercentage;
  document.getElementById("paid-status").checked = invoice.paid;

  // Change form submission to update instead of create
  const form = document.getElementById("invoice-form");
  form.onsubmit = (e) => updateInvoice(e, id);

  // Change button text
  const submitButton = form.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = "Update Invoice";
  }

  // Scroll to the form
  form.scrollIntoView({ behavior: "smooth" });

  console.log("Form populated for editing");
}

async function updateInvoice(event, id) {
  event.preventDefault();
  console.log("Updating invoice:", id);
  const updatedInvoice = {
    year: parseInt(document.getElementById("year").value),
    month: parseInt(document.getElementById("month").value),
    clientName: document.getElementById("client-name").value.trim(),
    amount: parseFloat(document.getElementById("invoice-amount").value),
    referrer: currentUser,
    bonusPercentage: parseFloat(
      document.getElementById("referral-bonus").value,
    ),
    paid: document.getElementById("paid-status").checked,
    createdBy: currentUser,
  };

  console.log("Updated invoice data:", updatedInvoice);

  try {
    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...updatedInvoice, currentUser }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update invoice");
    }

    console.log("Invoice updated successfully");
    await fetchInvoices();
    renderInvoiceList();
    renderSummaryTables();

    // Reset form to create mode
    const form = document.getElementById("invoice-form");
    form.onsubmit = handleFormSubmit;
    form.reset();

    // Change button text back
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = "Add Invoice";
    }

    alert("Invoice updated successfully");
  } catch (error) {
    console.error("Error updating invoice:", error);
    alert(`Failed to update invoice: ${error.message}`);
  }
}

// ... [Rest of your existing code] ...

// Function to render the invoice list
function renderInvoiceList() {
  console.log("Rendering invoice list");
  const tbody = document.querySelector("#invoice-list tbody");
  if (!tbody) {
    console.error("Invoice list tbody not found");
    return;
  }

  tbody.innerHTML = "";
  invoices.forEach((invoice) => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", invoice.id);
    const isEditable = invoice.createdBy === currentUser;
    tr.innerHTML = `
            <td>${invoice.year}</td>
            <td>${invoice.month}</td>
            <td>${invoice.clientName}</td>
            <td>€${invoice.amount.toFixed(2)}</td>
            <td>${invoice.referrer}</td>
            <td>${(invoice.bonusPercentage * 100).toFixed(0)}%</td>
            <td>
                <input type="checkbox" class="paid-status-checkbox" ${invoice.paid ? "checked" : ""}
                       data-id="${invoice.id}"
                       ${isEditable ? "" : "disabled"}>
            </td>
            <td>
                ${
                  isEditable
                    ? `
                    <button class="edit-invoice" data-id="${invoice.id}">Edit</button>
                    <button class="delete-invoice" data-id="${invoice.id}">Delete</button>
                `
                    : ""
                }
            </td>
        `;
    updateInvoiceAppearance(tr, invoice.paid);
    tbody.appendChild(tr);
  });

  // Add event listeners
  tbody.querySelectorAll(".paid-status-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      updatePaidStatus(this.dataset.id, this.checked);
    });
  });

  tbody.querySelectorAll(".edit-invoice").forEach((button) => {
    button.addEventListener("click", function () {
      editInvoice(this.dataset.id);
    });
  });

  tbody.querySelectorAll(".delete-invoice").forEach((button) => {
    button.addEventListener("click", function () {
      deleteInvoice(this.dataset.id);
    });
  });

  console.log("Invoice list rendered successfully");
}

// ... [Rest of your existing code] ...

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
  if (!currentUser) {
    window.location.href = "login.html";
  } else {
    init();
  }
});

document.getElementById("logoutBtn").addEventListener("click", function () {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

document
  .getElementById("changePasswordBtn")
  .addEventListener("click", function () {
    localStorage.setItem("changePassword", "true");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });
