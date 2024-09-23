// Initialize global variables
let invoices = [];
let clientNames = [];
let quarterlyBonusPaidStatus = {};
const currentUser = localStorage.getItem("currentUser");

// Function to fetch invoices from the server
async function fetchInvoices() {
  try {
    const response = await fetch("http://localhost:3000/get-invoices");
    const data = await response.json();
    invoices = data.map((invoice) => ({
      ...invoice,
      paid: Boolean(invoice.paid),
    }));
    renderInvoiceList();
    renderSummaryTables();
  } catch (error) {
    console.error("Error fetching invoices:", error);
  }
}

// Function to fetch client names from the server
async function fetchClientNames() {
  try {
    const response = await fetch("http://localhost:3000/get-client-names");
    clientNames = await response.json();
    updateClientNameSuggestions();
  } catch (error) {
    console.error("Error fetching client names:", error);
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
    const response = await fetch("http://localhost:3000/save-invoice", {
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

    if (newInvoice.clientName && !clientNames.includes(newInvoice.clientName)) {
      const clientResponse = await fetch(
        "http://localhost:3000/save-client-name",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clientName: newInvoice.clientName }),
        },
      );

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
  table.className = "table table-sm summary-table";

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
          ? "brown"
          : "inherit";

  let tableHTML = `
    <thead>
      <tr>
        <th colspan="5"><h3 style="color: ${referrerColor};">${referrer}</h3></th>
      </tr>
      <tr>
        <th>Year</th>
        <th>Q1</th>
        <th>Q2</th>
        <th>Q3</th>
        <th>Q4</th>
      </tr>
    </thead>
    <tbody>
  `;

  years.forEach((year) => {
    tableHTML += `
      <tr>
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
                <span style="${
                  isPaid ? "text-decoration: line-through;" : "color: red;"
                }">€${quarterlyBonus.toFixed(2)}</span>
                <input type="checkbox" ${
                  isPaid ? "checked" : ""
                } onchange="updateQuarterlyBonusPaidStatus('${referrer}', ${year}, ${quarter}, this.checked)">
                ${
                  isPaid
                    ? '<span class="paid-indicator" style="font-weight: bold; color: green;">PAID</span>'
                    : ""
                }
              </td>
            `;
          })
          .join("")}
      </tr>
    `;
  });

  tableHTML += "</tbody>";
  table.innerHTML = tableHTML;
  return table;
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

// Function to edit invoice
async function editInvoice(id) {
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) return;

  document.getElementById("year").value = invoice.year;
  document.getElementById("month").value = invoice.month;
  document.getElementById("client-name").value = invoice.clientName;
  document.getElementById("invoice-amount").value = invoice.amount;
  document.getElementById("referral-bonus").value = invoice.bonusPercentage;
  document.getElementById("paid-status").checked = invoice.paid;

  const form = document.getElementById("invoice-form");
  form.onsubmit = (e) => updateInvoice(e, id);
}

// Function to update invoice
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
    const response = await fetch(`http://localhost:3000/update-invoice/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedInvoice),
    });

    if (!response.ok) {
      throw new Error("Failed to update invoice");
    }

    await fetchInvoices();
    const form = document.getElementById("invoice-form");
    form.onsubmit = handleFormSubmit;
    form.reset();
  } catch (error) {
    console.error("Error updating invoice:", error);
    alert("Failed to update invoice. Please try again.");
  }
}

// Function to delete invoice
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
      throw new Error("Failed to delete invoice");
    }

    await fetchInvoices();
  } catch (error) {
    console.error("Error deleting invoice:", error);
    alert("Failed to delete invoice. Please try again.");
  }
}

// Function to get quarterly bonus paid status
function getQuarterlyBonusPaidStatus(referrer, year, quarter) {
  const key = `${referrer}-${year}-${quarter}`;
  return quarterlyBonusPaidStatus[key] || false;
}

// Function to update quarterly bonus paid status
function updateQuarterlyBonusPaidStatus(referrer, year, quarter, isPaid) {
  const key = `${referrer}-${year}-${quarter}`;
  quarterlyBonusPaidStatus[key] = isPaid;
  renderSummaryTables();
}

// Function to update paid status of an invoice
async function updatePaidStatus(id, paid) {
  console.log(`Updating paid status for invoice ${id} to ${paid}`);
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) {
    console.error(`Invoice with id ${id} not found`);
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/update-invoice/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...invoice, paid }),
    });

    if (!response.ok) {
      throw new Error("Failed to update invoice");
    }

    invoice.paid = paid;
    renderInvoiceList();
    renderSummaryTables();
  } catch (error) {
    console.error("Error updating invoice:", error);
    alert("Failed to update invoice paid status. Please try again.");
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

// Function to initialize the application
async function init() {
  console.log("Initializing application");
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

  await fetchInvoices();
  await fetchClientNames();
}

// Password change functionality
const changePasswordBtn = document.getElementById("changePasswordBtn");
if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", function () {
    $("#changePasswordModal").modal("show");
  });
}

const changePasswordForm = document.getElementById("changePasswordForm");
if (changePasswordForm) {
  changePasswordForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmNewPassword =
      document.getElementById("confirmNewPassword").value;

    if (newPassword !== confirmNewPassword) {
      alert("New passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: currentUser,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert("Password changed successfully. You will be logged out.");
        localStorage.removeItem("currentUser");
        window.location.href = "login.html";
      } else {
        alert(data.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Password change error:", error);
      alert("An error occurred while changing the password");
    }
  });
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
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", function () {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });
}
