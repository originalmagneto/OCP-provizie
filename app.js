// Use API_BASE_URL in your fetch calls, for example:
// fetch(`${config.API_BASE_URL}/get-invoices`)

const config = {
  API_BASE_URL: "https://your-netlify-app-name.netlify.app",
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

// Function to set the current user display
function setCurrentUserDisplay() {
  const currentUserDisplay = document.getElementById("currentUserDisplay");
  if (currentUserDisplay && currentUser) {
    let backgroundColor;
    switch (currentUser) {
      case "AdvokatiCHZ":
        backgroundColor = "purple";
        break;
      case "MKMs":
        backgroundColor = "black";
        break;
      case "Contax":
        backgroundColor = "#D4AF37"; // Updated Contax color
        break;
      default:
        backgroundColor = "gray";
    }
    currentUserDisplay.style.backgroundColor = backgroundColor;
    currentUserDisplay.style.color =
      currentUser === "Contax" ? "black" : "white";
    currentUserDisplay.style.fontWeight = "bold";
    currentUserDisplay.textContent = currentUser;
  }
}

// Function to initialize the application
async function init() {
  console.log("Initializing application");
  setCurrentUserDisplay();
  const form = document.getElementById("invoice-form");
  const yearInput = document.getElementById("year");
  const monthInput = document.getElementById("month");

  if (form) {
    form.addEventListener("submit", handleFormSubmit);
    console.log("Form submit event listener added");
  } else {
    console.error("Invoice form not found");
  }

  // Set default year and month
  const currentDate = new Date();
  if (yearInput) yearInput.value = currentDate.getFullYear();
  if (monthInput) monthInput.value = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

  try {
    await Promise.all([
      fetchInvoices(),
      fetchClientNames(),
      fetchQuarterlyBonusPaidStatus(),
    ]);
    renderSummaryTables();
  } catch (error) {
    console.error("Error initializing application:", error);
    alert("Failed to initialize application. Please try refreshing the page.");
  }
}

// Add event listener for DOMContentLoaded
document.addEventListener("DOMContentLoaded", function () {
  if (!currentUser) {
    window.location.href = "login.html";
  } else {
    init();
  }
});

// Add logout functionality
document.getElementById("logoutBtn").addEventListener("click", function () {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

// Add change password functionality
document
  .getElementById("changePasswordBtn")
  .addEventListener("click", function () {
    localStorage.setItem("changePassword", "true");
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });

// Function to fetch invoices from the server
async function fetchInvoices() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/get-invoices`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorData.message}, code: ${errorData.code}`,
      );
    }
    const data = await response.json();
    invoices = data.map((invoice) => ({
      ...invoice,
      paid: Boolean(invoice.paid),
    }));
    renderInvoiceList();
    renderSummaryTables();
  } catch (error) {
    console.error("Error fetching invoices:", error);
    alert(`Failed to fetch invoices. ${error.message}`);
  }
}

// Function to fetch client names from the server
async function fetchClientNames() {
  try {
    const response = await fetch(`${config.API_BASE_URL}/get-client-names`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorData.message}, code: ${errorData.code}`,
      );
    }
    clientNames = await response.json();
    updateClientNameSuggestions();
  } catch (error) {
    console.error("Error fetching client names:", error);
    alert(`Failed to fetch client names. ${error.message}`);
  }
}

// Function to fetch quarterly bonus paid status
async function fetchQuarterlyBonusPaidStatus() {
  try {
    const response = await fetch(
      `${config.API_BASE_URL}/quarterly-bonus-status`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    quarterlyBonusPaidStatus = await response.json();
  } catch (error) {
    console.error("Error fetching quarterly bonus paid status:", error);
    alert(
      "Failed to fetch quarterly bonus paid status. Please try again later.",
    );
  }
}

// Function to handle form submission
async function handleFormSubmit(event) {
  event.preventDefault();
  const form = event.target;

  // Check if we're in edit mode
  const isEditMode = form.getAttribute("data-edit-mode") === "true";
  const invoiceId = form.getAttribute("data-edit-invoice-id");

  console.log(
    isEditMode ? "Updating existing invoice" : "Creating new invoice",
  );

  const invoiceData = {
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

  console.log("Invoice data:", invoiceData);

  if (
    isNaN(invoiceData.year) ||
    isNaN(invoiceData.month) ||
    isNaN(invoiceData.amount) ||
    isNaN(invoiceData.bonusPercentage)
  ) {
    console.error("Invalid input values");
    alert("Please fill in all fields with valid values.");
    return;
  }

  try {
    let response;
    if (isEditMode) {
      response = await fetch(
        `${config.API_BASE_URL}/update-invoice/${invoiceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ...invoiceData, currentUser }),
        },
      );
    } else {
      response = await fetch(`${config.API_BASE_URL}/save-invoice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Server error: ${errorData.error}. Details: ${errorData.details}`,
      );
    }

    const data = await response.json();

    if (
      invoiceData.clientName &&
      !clientNames.includes(invoiceData.clientName)
    ) {
      await fetch(`${config.API_BASE_URL}/save-client-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientName: invoiceData.clientName }),
      });
    }

    await fetchInvoices();
    await fetchClientNames();

    // Reset form and button
    resetForm(form);

    console.log(
      isEditMode
        ? "Invoice updated successfully"
        : "New invoice added successfully",
    );
    alert(
      isEditMode
        ? "Invoice updated successfully"
        : "New invoice added successfully",
    );
  } catch (error) {
    console.error("Error saving/updating data:", error);
    alert(
      `An error occurred while ${isEditMode ? "updating" : "saving"} the invoice: ${error.message}`,
    );
  }
}

function resetForm(form) {
  form.reset();
  form.removeAttribute("data-edit-mode");
  form.removeAttribute("data-edit-invoice-id");

  // Reset the submit button to "Add Invoice"
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.textContent = "Add Invoice";
  submitButton.classList.remove("btn-warning");
  submitButton.classList.add("btn-primary");

  // Set default year and month
  const currentDate = new Date();
  document.getElementById("year").value = currentDate.getFullYear();
  document.getElementById("month").value = currentDate.getMonth() + 1;
}

// Function to render the invoice list
function renderInvoiceList() {
  console.log("Rendering invoice list");
  const tbody = document.querySelector("#invoice-list tbody");
  if (!tbody) {
    console.error("Invoice list tbody not found");
    return;
  }

  // Sort invoices in descending order (newest first)
  invoices.sort((a, b) => b.id - a.id);

  tbody.innerHTML = "";
  invoices.forEach((invoice) => {
    const tr = document.createElement("tr");
    tr.setAttribute("data-id", invoice.id);
    tr.style.textDecoration = invoice.paid ? "line-through" : "none";
    tr.style.color = invoice.paid ? "green" : "";
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
          <button class="edit-invoice btn btn-sm btn-primary" data-id="${invoice.id}">Edit</button>
          <button class="delete-invoice btn btn-sm btn-danger" data-id="${invoice.id}">Delete</button>
        `
            : ""
        }
      </td>
    `;
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

// Function to render summary tables
function renderSummaryTables() {
  console.log("Rendering summary tables");
  const summaryTablesContainer = document.getElementById("summary-tables");
  if (!summaryTablesContainer) {
    console.error("Summary tables container not found");
    return;
  }

  summaryTablesContainer.innerHTML = "";

  const referrers = [...new Set(invoices.map((invoice) => invoice.referrer))];

  referrers.forEach((referrer) => {
    const table = createReferrerTable(referrer);
    summaryTablesContainer.appendChild(table);
  });
  console.log("Summary tables rendered successfully");
}

// Function to create a referrer table
function createReferrerTable(referrer) {
  const table = document.createElement("table");
  table.className = `table table-sm summary-table ${referrer.toLowerCase().replace(/\s+/g, "-")}`;

  const referrerInvoices = invoices.filter(
    (invoice) => invoice.referrer === referrer,
  );
  const years = [
    ...new Set(referrerInvoices.map((invoice) => invoice.year)),
  ].sort((a, b) => b - a);

  const referrerColor =
    referrer === "AdvokatiCHZ"
      ? "purple"
      : referrer === "MKMs"
        ? "black"
        : referrer === "Contax"
          ? "#D4AF37"
          : "inherit";

  const isAuthorized = referrer === currentUser;

  let tableHTML = `
    <thead>
      <tr>
        <th colspan="5" class="referrer-header" style="background-color: ${referrerColor}; color: white;">${referrer}</th>
      </tr>
      <tr>
        <th>Year</th>
        ${[1, 2, 3, 4]
          .map(
            (quarter) => `
          <th class="quarter-header">
            Q${quarter}
            <input type="checkbox" class="paid-checkbox" data-quarter="${quarter}" data-referrer="${referrer}" ${isAuthorized ? "" : "disabled"}>
          </th>
        `,
          )
          .join("")}
      </tr>
    </thead>
    <tbody>
  `;

  years.forEach((year) => {
    tableHTML += `
      <tr data-year="${year}">
        <td>${year}</td>
        ${[1, 2, 3, 4]
          .map((quarter) => {
            const quarterlyBonus = calculateQuarterlyBonus(
              referrerInvoices,
              year,
              quarter,
            );
            const isPaid = getQuarterlyBonusPaidStatus(referrer, year, quarter);
            return `
            <td>
              <span class="quarter-amount ${isPaid ? "paid" : "unpaid"}" data-year="${year}" data-quarter="${quarter}">
                €${quarterlyBonus.toFixed(2)}
              </span>
            </td>
          `;
          })
          .join("")}
      </tr>
    `;
  });

  tableHTML += "</tbody>";
  table.innerHTML = tableHTML;

  // Set initial checkbox states and add event listeners
  [1, 2, 3, 4].forEach((quarter) => {
    const checkbox = table.querySelector(
      `th:nth-child(${quarter + 1}) .paid-checkbox`,
    );
    const isPaid = years.every((year) =>
      getQuarterlyBonusPaidStatus(referrer, year, quarter),
    );
    if (checkbox) {
      checkbox.checked = isPaid;
      checkbox.addEventListener("change", function () {
        updateQuarterStatus(this, this.dataset.referrer);
      });
    }
  });

  return table;
}

function updateQuarterStatus(checkbox, referrer) {
  if (referrer !== currentUser) {
    console.error("Not authorized to update this status");
    alert("You are not authorized to change this status.");
    checkbox.checked = !checkbox.checked; // Revert the checkbox state
    return;
  }

  const quarter = parseInt(checkbox.dataset.quarter);
  const isPaid = checkbox.checked;
  const table = checkbox.closest("table");
  const amountSpans = table.querySelectorAll(
    `tbody td:nth-child(${quarter + 1}) .quarter-amount`,
  );

  Promise.all(
    Array.from(amountSpans).map(async (amountSpan) => {
      const year = parseInt(amountSpan.dataset.year);
      try {
        await updateQuarterlyBonusPaidStatus(referrer, year, quarter, isPaid);
        updateSpanAppearance(amountSpan, isPaid);
      } catch (error) {
        console.error("Failed to update status:", error);
        throw error; // Propagate the error to be caught in the outer catch block
      }
    }),
  )
    .then(() => {
      console.log("All updates completed successfully");
    })
    .catch((error) => {
      console.error("Failed to update some or all statuses:", error);
      checkbox.checked = !checkbox.checked; // Revert the checkbox state
      amountSpans.forEach((amountSpan) => {
        updateSpanAppearance(amountSpan, !isPaid);
      });
      alert(
        "Failed to update some or all quarterly bonus statuses. Please try again.",
      );
    });
}

function updateSpanAppearance(span, isPaid) {
  span.classList.toggle("paid", isPaid);
  span.classList.toggle("unpaid", !isPaid);
  span.style.textDecoration = isPaid ? "line-through" : "none";
  span.style.color = isPaid ? "green" : "red";
}

// Function to calculate quarterly bonus
function calculateQuarterlyBonus(invoices, year, quarter) {
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = quarter * 3;
  return invoices
    .filter(
      (invoice) =>
        invoice.year === year &&
        invoice.month >= startMonth &&
        invoice.month <= endMonth &&
        invoice.paid,
    )
    .reduce(
      (total, invoice) => total + invoice.amount * invoice.bonusPercentage,
      0,
    );
}

async function editInvoice(id) {
  const invoice = invoices.find((inv) => inv.id === parseInt(id));
  if (!invoice) return;

  // Populate form with invoice data for editing
  document.getElementById("year").value = invoice.year;
  document.getElementById("month").value = invoice.month;
  document.getElementById("client-name").value = invoice.clientName;
  document.getElementById("invoice-amount").value = invoice.amount;
  document.getElementById("referral-bonus").value = invoice.bonusPercentage;
  document.getElementById("paid-status").checked = invoice.paid;

  // Add data attributes to the form to indicate we're in edit mode
  const form = document.getElementById("invoice-form");
  form.setAttribute("data-edit-mode", "true");
  form.setAttribute("data-edit-invoice-id", id);

  // Change the submit button to an "Update Invoice" button
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.textContent = "Update Invoice";
  submitButton.classList.remove("btn-primary");
  submitButton.classList.add("btn-warning");

  // Scroll to the form
  form.scrollIntoView({ behavior: "smooth" });
}

async function deleteInvoice(id) {
  if (!confirm("Are you sure you want to delete this invoice?")) return;

  try {
    const response = await fetch(
      `${config.API_BASE_URL}/delete-invoice/${id}?createdBy=${currentUser}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete invoice");
    }

    await fetchInvoices();
  } catch (error) {
    console.error("Error deleting invoice:", error);
    alert(`Failed to delete invoice: ${error.message}`);
  }
}

// Function to get quarterly bonus paid status
function getQuarterlyBonusPaidStatus(referrer, year, quarter) {
  return (
    (quarterlyBonusPaidStatus[referrer] &&
      quarterlyBonusPaidStatus[referrer][`${year}-${quarter}`]) ||
    false
  );
}

// Function to update quarterly bonus paid status
async function updateQuarterlyBonusPaidStatus(referrer, year, quarter, isPaid) {
  if (referrer !== currentUser) {
    console.error("Not authorized to update this status");
    throw new Error("Not authorized to update this status");
  }

  try {
    const response = await fetch(
      `${config.API_BASE_URL}/update-quarterly-bonus-status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referrer, year, quarter, isPaid }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      if (!quarterlyBonusPaidStatus[referrer]) {
        quarterlyBonusPaidStatus[referrer] = {};
      }
      quarterlyBonusPaidStatus[referrer][`${year}-${quarter}`] = isPaid;
    } else {
      throw new Error("Failed to update quarterly bonus status");
    }
  } catch (error) {
    console.error("Error updating quarterly bonus paid status:", error);
    throw error;
  }
}

// Function to update paid status of an invoice
async function updatePaidStatus(id, paid) {
  console.log(`Updating paid status for invoice ${id} to ${paid}`);
  try {
    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paid, currentUser }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update invoice");
    }

    const data = await response.json();

    if (data.success) {
      const invoice = invoices.find((inv) => inv.id === parseInt(id));
      if (invoice) {
        invoice.paid = paid;
        updateInvoiceRowAppearance(id, paid);
        renderSummaryTables();
      }
    } else {
      throw new Error(data.message || "Failed to update invoice");
    }
  } catch (error) {
    console.error("Error updating invoice paid status:", error);
    alert(`Failed to update invoice paid status: ${error.message}`);
  }
}

function updateInvoiceRowAppearance(id, paid) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) {
    row.style.textDecoration = paid ? "line-through" : "none";
    row.style.color = paid ? "green" : "";
  }
}

// Function to update client name suggestions
function updateClientNameSuggestions() {
  console.log("Updating client name suggestions");
  const datalist = document.getElementById("client-list");
  if (!datalist) {
    console.error("Client name datalist not found");
    return;
  }
  datalist.innerHTML = "";
  clientNames.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    datalist.appendChild(option);
  });
  console.log("Client suggestions updated:", clientNames);
}
