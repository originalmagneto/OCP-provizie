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

// Function to set the current user display
function setCurrentUserDisplay() {
  // ... (keep the existing implementation)
}

// Function to initialize the application
async function init() {
  // ... (keep the existing implementation)
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
    const response = await fetch(`${API_BASE_URL}/get-client-names`);
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
    const response = await fetch(`${API_BASE_URL}/quarterly-bonus-status`);
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
  console.log("Form submitted");

  const newInvoice = {
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

  console.log("New invoice:", newInvoice);

  if (
    isNaN(newInvoice.year) ||
    isNaN(newInvoice.month) ||
    isNaN(newInvoice.amount) ||
    isNaN(newInvoice.bonusPercentage)
  ) {
    console.error("Invalid input values");
    alert("Please fill in all fields with valid values.");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/save-invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newInvoice),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Server error: ${errorData.error}. Details: ${errorData.details}`,
      );
    }

    const data = await response.json();

    if (newInvoice.clientName && !clientNames.includes(newInvoice.clientName)) {
      const clientResponse = await fetch(`${API_BASE_URL}/save-client-name`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientName: newInvoice.clientName }),
      });

      if (!clientResponse.ok) {
        throw new Error("Failed to save client name");
      }
    }

    await fetchInvoices();
    await fetchClientNames();

    const form = event.target;
    const yearValue = form.querySelector("#year").value;
    const monthValue = form.querySelector("#month").value;
    form.reset();
    form.querySelector("#year").value = yearValue;
    form.querySelector("#month").value = monthValue;

    console.log("Form reset (except year and month)");
  } catch (error) {
    console.error("Error saving data:", error);
    alert(`An error occurred while saving the invoice: ${error.message}`);
  }
}

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
    tr.style.textDecoration = invoice.paid ? "line-through" : "none";
    const isEditable = invoice.createdBy === currentUser;
    tr.innerHTML = `
            <td>${invoice.year}</td>
            <td>${invoice.month}</td>
            <td>${invoice.clientName}</td>
            <td>€${invoice.amount.toFixed(2)}</td>
            <td>${invoice.referrer}</td>
            <td>${(invoice.bonusPercentage * 100).toFixed(0)}%</td>
            <td>
                <input type="checkbox" ${invoice.paid ? "checked" : ""}
                       onchange="updatePaidStatus(${invoice.id}, this.checked)"
                       ${isEditable ? "" : "disabled"}>
            </td>
            <td>
                ${
                  isEditable
                    ? `
                    <button onclick="editInvoice(${invoice.id})">Edit</button>
                    <button onclick="deleteInvoice(${invoice.id})">Delete</button>
                `
                    : ""
                }
            </td>
        `;
    tbody.appendChild(tr);
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
                        <input type="checkbox" class="paid-checkbox" data-quarter="${quarter}" onchange="updateQuarterStatus(this, '${referrer}')" ${isAuthorized ? "" : "disabled"}>
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
                    const isPaid = getQuarterlyBonusPaidStatus(
                      referrer,
                      year,
                      quarter,
                    );
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

  // Set initial checkbox states
  [1, 2, 3, 4].forEach((quarter) => {
    const checkbox = table.querySelector(
      `th:nth-child(${quarter + 1}) .paid-checkbox`,
    );
    const isPaid = years.every((year) =>
      getQuarterlyBonusPaidStatus(referrer, year, quarter),
    );
    if (checkbox) {
      checkbox.checked = isPaid;
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
        amountSpan.classList.toggle("paid", isPaid);
        amountSpan.classList.toggle("unpaid", !isPaid);
        amountSpan.style.textDecoration = isPaid ? "line-through" : "none";
        amountSpan.style.color = isPaid ? "green" : "red";
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
        amountSpan.classList.toggle("paid", !isPaid);
        amountSpan.classList.toggle("unpaid", isPaid);
        amountSpan.style.textDecoration = !isPaid ? "line-through" : "none";
        amountSpan.style.color = !isPaid ? "green" : "red";
      });
      alert(
        "Failed to update some or all quarterly bonus statuses. Please try again.",
      );
    });
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
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) return;

  // Populate form with invoice data for editing
  document.getElementById("year").value = invoice.year;
  document.getElementById("month").value = invoice.month;
  document.getElementById("client-name").value = invoice.clientName;
  document.getElementById("invoice-amount").value = invoice.amount;
  document.getElementById("referral-bonus").value = invoice.bonusPercentage;
  document.getElementById("paid-status").checked = invoice.paid;

  // Change form submission to update instead of create
  const form = document.getElementById("invoice-form");
  form.onsubmit = (e) => updateInvoice(e, id);
}

async function updateInvoice(event, id) {
  event.preventDefault();
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

  try {
    const response = await fetch(`${API_BASE_URL}/update-invoice/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...updatedInvoice, currentUser }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update invoice");
    }

    await fetchInvoices();
    // Reset form to create mode
    const form = document.getElementById("invoice-form");
    form.onsubmit = handleFormSubmit;
    form.reset();
  } catch (error) {
    console.error("Error updating invoice:", error);
    alert(`Failed to update invoice: ${error.message}`);
  }
}

async function deleteInvoice(id) {
  if (!confirm("Are you sure you want to delete this invoice?")) return;

  try {
    const response = await fetch(
      `http://localhost:3000/delete-invoice/${id}?createdBy=${currentUser}`,
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
      `${API_BASE_URL}/update-quarterly-bonus-status`,
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

function updateQuarterStatus(checkbox, referrer) {
  const quarter = parseInt(checkbox.dataset.quarter);
  const isPaid = checkbox.checked;
  const table = checkbox.closest("table");
  const amountSpans = table.querySelectorAll(
    `tbody td:nth-child(${quarter + 1}) .quarter-amount`,
  );

  amountSpans.forEach((amountSpan) => {
    const year = parseInt(amountSpan.dataset.year);
    amountSpan.classList.toggle("paid", isPaid);
    amountSpan.classList.toggle("unpaid", !isPaid);
    amountSpan.style.textDecoration = isPaid ? "line-through" : "none";
    amountSpan.style.color = isPaid ? "green" : "red";
    updateQuarterlyBonusPaidStatus(referrer, year, quarter, isPaid);
  });
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
      const invoice = invoices.find((inv) => inv.id === id);
      if (invoice) {
        invoice.paid = paid;
        renderInvoiceList();
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
        backgroundColor = "yellow";
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
