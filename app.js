const config = {
  API_BASE_URL: "https://ocp-provizie-final.onrender.com", // Or your local development URL
};

let invoices = [];
let clientNames = [];
let quarterlyBonusPaidStatus = {};
const currentUser = localStorage.getItem("currentUser");

// Helper function to get element or throw error if not found
function getElement(id, errorMessage) {
  const element = document.getElementById(id);
  if (!element) throw new Error(errorMessage);
  return element;
}

// ===== Initialization =====
async function init() {
  setCurrentUserDisplay();
  const form = getElement("invoice-form", "Invoice form not found");
  form.addEventListener("submit", handleFormSubmit);

  // Set default year and month
  const currentDate = new Date();
  form.year.value = currentDate.getFullYear();
  form.month.value = currentDate.getMonth() + 1;

  try {
    await Promise.all([
      fetchInvoices(),
      fetchClientNames(),
      fetchQuarterlyBonusPaidStatus(),
    ]);
    renderSummaryTables();
  } catch (error) {
    console.error("Initialization error:", error);
    alert("Failed to initialize. Please refresh.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!currentUser) {
    window.location.href = "login.html";
  } else {
    init();
  }
});

// ===== Event Listeners =====
getElement("logoutBtn", "Logout button not found").addEventListener(
  "click",
  () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  },
);

getElement(
  "changePasswordBtn",
  "Change password button not found",
).addEventListener("click", () => {
  localStorage.setItem("changePassword", "true");
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

// ===== User Interface Updates =====
function setCurrentUserDisplay() {
  const display = getElement(
    "currentUserDisplay",
    "Current user display not found",
  );
  if (currentUser) {
    const colorMap = {
      AdvokatiCHZ: "purple",
      MKMs: "black",
      Contax: "yellow",
      default: "gray",
    };
    const backgroundColor = colorMap[currentUser] || colorMap.default;
    display.style.backgroundColor = backgroundColor;
    display.style.color = currentUser === "Contax" ? "black" : "white";
    display.style.fontWeight = "bold";
    display.textContent = currentUser;
  }
}

function updateClientNameSuggestions() {
  const datalist = getElement("client-list", "Client name datalist not found");
  datalist.innerHTML = clientNames
    .map((name) => `<option value="${name}">`)
    .join("");
}

function updateInvoiceRowAppearance(id, paid) {
  const row = document.querySelector(`tr[data-id="${id}"]`);
  if (row) {
    row.classList.toggle("paid-invoice", paid);
    row.classList.toggle("unpaid-invoice", !paid);
  }
}

function updateSpanAppearance(span, isPaid) {
  span.classList.toggle("paid", isPaid);
  span.classList.toggle("unpaid", !isPaid);
  span.style.textDecoration = isPaid ? "line-through" : "none";
  span.style.color = isPaid ? "green" : "red";
}

// ===== Data Fetching =====
async function fetchData(endpoint, errorMessage) {
  const response = await fetch(`${config.API_BASE_URL}/${endpoint}`);
  if (!response.ok) {
    const errorData = await response.json();
    const serverMessage =
      errorData && errorData.message
        ? errorData.message
        : "Unknown server error";
    throw new Error(`${errorMessage}: ${serverMessage}`);
  }
  return await response.json();
}

async function fetchInvoices() {
  try {
    invoices = await fetchData("get-invoices", "Failed to fetch invoices");
    invoices.forEach((invoice) => (invoice.paid = Boolean(invoice.paid)));
    renderInvoiceList();
    renderSummaryTables();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function fetchClientNames() {
  try {
    clientNames = await fetchData(
      "get-client-names",
      "Failed to fetch client names",
    );
    updateClientNameSuggestions();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function fetchQuarterlyBonusPaidStatus() {
  try {
    quarterlyBonusPaidStatus = await fetchData(
      "quarterly-bonus-status",
      "Failed to fetch quarterly bonus status",
    );
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// ===== Form Handling =====
async function handleFormSubmit(event) {
  event.preventDefault();

  const newInvoice = {
    year: parseInt(form.year.value), // Direct form access
    month: parseInt(form.month.value),
    clientName: form["client-name"].value.trim(),
    amount: parseFloat(form["invoice-amount"].value),
    referrer: currentUser,
    bonusPercentage: parseFloat(form["referral-bonus"].value),
    paid: form["paid-status"].checked,
    createdBy: currentUser,
  };

  if (
    isNaN(newInvoice.year) ||
    isNaN(newInvoice.month) ||
    isNaN(newInvoice.amount) ||
    isNaN(newInvoice.bonusPercentage)
  ) {
    alert("Please fill in all fields with valid values.");
    return;
  }

  try {
    const response = await fetch(`${config.API_BASE_URL}/save-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInvoice),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Server error: ${errorData.error}. Details: ${errorData.details}`,
      );
    }

    if (newInvoice.clientName && !clientNames.includes(newInvoice.clientName)) {
      await fetch(`${config.API_BASE_URL}/save-client-name`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName: newInvoice.clientName }),
      });
      await fetchClientNames(); // Update client names after saving
    }

    await fetchInvoices(); // Update invoices after saving

    // Reset form except year and month
    const yearValue = form.year.value;
    const monthValue = form.month.value;
    form.reset();
    form.year.value = yearValue;
    form.month.value = monthValue;
  } catch (error) {
    console.error("Error saving invoice:", error);
    alert(`Failed to save invoice: ${error.message}`);
  }
}

// ===== Invoice Rendering =====
function renderInvoiceList() {
  const tbody = getElement("invoice-list").querySelector(
    "tbody",
    "Invoice list tbody not found",
  );
  tbody.innerHTML = "";

  invoices
    .sort((a, b) => b.id - a.id)
    .forEach((invoice) => {
      const tr = document.createElement("tr");
      tr.dataset.id = invoice.id;
      const isEditable = invoice.createdBy === currentUser;

      tr.innerHTML = `
            <td>${invoice.year}</td>
            <td>${invoice.month}</td>
            <td>${invoice.clientName}</td>
            <td>€${invoice.amount.toFixed(2)}</td>
            <td>${invoice.referrer}</td>
            <td>${(invoice.bonusPercentage * 100).toFixed(0)}%</td>
            <td><input type="checkbox" class="paid-status-checkbox" ${invoice.paid ? "checked" : ""} data-id="${invoice.id}" ${isEditable ? "" : "disabled"}></td>
            <td>${isEditable ? `<button class="edit-invoice" data-id="${invoice.id}">Edit</button> <button class="delete-invoice" data-id="${invoice.id}">Delete</button>` : ""}</td>
        `;
      tbody.appendChild(tr);
      updateInvoiceRowAppearance(invoice.id, invoice.paid);

      if (isEditable) {
        tr.querySelector(".edit-invoice").addEventListener("click", () =>
          editInvoice(invoice.id),
        );
        tr.querySelector(".delete-invoice").addEventListener("click", () =>
          deleteInvoice(invoice.id),
        );
      }
      tr.querySelector(".paid-status-checkbox").addEventListener(
        "change",
        (event) => updatePaidStatus(invoice.id, event.target.checked),
      );
    });
}

// ===== Invoice Editing and Deletion =====
function editInvoice(id) {
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice) return;

  // Populate form with invoice data
  form.year.value = invoice.year;
  form.month.value = invoice.month;
  form["client-name"].value = invoice.clientName;
  form["invoice-amount"].value = invoice.amount;
  form["referral-bonus"].value = invoice.bonusPercentage;
  form["paid-status"].checked = invoice.paid;

  // Temporarily change form submission handler
  form.removeEventListener("submit", handleFormSubmit);
  form.addEventListener("submit", (event) => updateInvoice(event, id));

  form.scrollIntoView({ behavior: "smooth" });
}

async function updateInvoice(event, id) {
  event.preventDefault();
  const updatedInvoice = {
    year: parseInt(form.year.value),
    month: parseInt(form.month.value),
    clientName: form["client-name"].value.trim(),
    amount: parseFloat(form["invoice-amount"].value),
    referrer: currentUser,
    bonusPercentage: parseFloat(form["referral-bonus"].value),
    paid: form["paid-status"].checked,
    createdBy: currentUser,
  };

  try {
    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...updatedInvoice, currentUser }), // Include currentUser for authorization
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update invoice");
    }

    // Restore original form submission handler and reset form
    form.removeEventListener("submit", updateInvoice);
    form.addEventListener("submit", handleFormSubmit);
    form.reset();

    await fetchInvoices(); // Refresh invoice list
  } catch (error) {
    console.error("Error updating invoice:", error);
    alert(`Failed to update invoice: ${error.message}`);
  }
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

    await fetchInvoices(); // Refresh invoice list
  } catch (error) {
    console.error("Error deleting invoice:", error);
    alert(`Failed to delete invoice: ${error.message}`);
  }
}

// ===== Quarterly Bonus Handling =====
function getQuarterlyBonusPaidStatus(referrer, year, quarter) {
  return (
    (quarterlyBonusPaidStatus[referrer] &&
      quarterlyBonusPaidStatus[referrer][`${year}-${quarter}`]) ||
    false
  );
}

async function updateQuarterlyBonusPaidStatus(referrer, year, quarter, isPaid) {
  if (referrer !== currentUser) {
    throw new Error("Not authorized to update this status");
  }

  try {
    const response = await fetch(
      `${config.API_BASE_URL}/update-quarterly-bonus-status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrer, year, quarter, isPaid }),
      },
    );
    if (!response.ok)
      throw new Error("Failed to update quarterly bonus status");

    // Update local status after successful API call
    quarterlyBonusPaidStatus[referrer] =
      quarterlyBonusPaidStatus[referrer] || {};
    quarterlyBonusPaidStatus[referrer][`${year}-${quarter}`] = isPaid;
  } catch (error) {
    console.error("Error updating quarterly bonus paid status:", error);
    throw error; // Re-throw for outer error handling
  }
}

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

// ===== Summary Table Rendering =====
function renderSummaryTables() {
  const summaryTablesContainer = getElement(
    "summary-tables",
    "Summary tables container not found",
  );
  summaryTablesContainer.innerHTML = "";

  const referrers = [...new Set(invoices.map((invoice) => invoice.referrer))];
  referrers.forEach((referrer) =>
    summaryTablesContainer.appendChild(createReferrerTable(referrer)),
  );
}

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
    {
      AdvokatiCHZ: "purple",
      MKMs: "black",
      Contax: "#D4AF37",
    }[referrer] || "inherit";

  const isAuthorized = referrer === currentUser;

  const thead = table.createTHead();
  const headerRow1 = thead.insertRow();
  const headerCell1 = headerRow1.insertCell();
  headerCell1.colSpan = 5;
  headerCell1.className = "referrer-header";
  headerCell1.style.backgroundColor = referrerColor;
  headerCell1.style.color = "white";
  headerCell1.textContent = referrer;

  const headerRow2 = thead.insertRow();
  headerRow2.insertCell().textContent = "Year";
  for (let quarter = 1; quarter <= 4; quarter++) {
    const th = headerRow2.insertCell();
    th.className = "quarter-header";
    th.innerHTML = `Q${quarter} <input type="checkbox" class="paid-checkbox" data-quarter="${quarter}" data-referrer="${referrer}" ${isAuthorized ? "" : "disabled"}>`;
    th.querySelector(".paid-checkbox").addEventListener("change", (event) =>
      updateQuarterStatus(event.target, referrer),
    );
  }

  const tbody = table.createTBody();
  years.forEach((year) => {
    const row = tbody.insertRow();
    row.dataset.year = year;
    row.insertCell().textContent = year;

    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterlyBonus = calculateQuarterlyBonus(
        referrerInvoices,
        year,
        quarter,
      );
      const isPaid = getQuarterlyBonusPaidStatus(referrer, year, quarter);
      const td = row.insertCell();
      td.innerHTML = `<span class="quarter-amount ${isPaid ? "paid" : "unpaid"}" data-year="${year}" data-quarter="${quarter}">€${quarterlyBonus.toFixed(2)}</span>`;
      updateSpanAppearance(td.querySelector(".quarter-amount"), isPaid); // Update appearance immediately
    }
  });

  // Set initial checkbox states
  for (let quarter = 1; quarter <= 4; quarter++) {
    const checkbox = headerRow2.querySelector(
      `th:nth-child(${quarter + 1}) .paid-checkbox`,
    );
    const allYearsPaid = years.every((year) =>
      getQuarterlyBonusPaidStatus(referrer, year, quarter),
    );
    checkbox.checked = allYearsPaid;
  }

  return table;
}

async function updatePaidStatus(id, paid) {
  try {
    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paid, currentUser }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update invoice");
    }

    // Update local data and re-render
    const invoice = invoices.find((inv) => inv.id === id);
    if (invoice) invoice.paid = paid;

    updateInvoiceRowAppearance(id, paid);
    renderSummaryTables();
  } catch (error) {
    console.error("Error updating paid status:", error);
    alert(`Failed to update paid status: ${error.message}`);
  }
}

async function updateQuarterStatus(checkbox, referrer) {
  if (referrer !== currentUser) {
    alert("You are not authorized to change this status.");
    checkbox.checked = !checkbox.checked; // Revert checkbox
    return;
  }

  const quarter = parseInt(checkbox.dataset.quarter);
  const isPaid = checkbox.checked;
  const table = checkbox.closest("table");
  const amountSpans = table.querySelectorAll(
    `tbody td:nth-child(${quarter + 1}) .quarter-amount`,
  );

  try {
    await Promise.all(
      Array.from(amountSpans).map(async (span) => {
        const year = parseInt(span.dataset.year);
        await updateQuarterlyBonusPaidStatus(referrer, year, quarter, isPaid);
        updateSpanAppearance(span, isPaid);
      }),
    );
  } catch (error) {
    console.error("Error updating quarter status:", error);
    alert("Failed to update some or all statuses. Please try again.");
    checkbox.checked = !checkbox.checked; // Revert checkbox
    amountSpans.forEach((span) => updateSpanAppearance(span, !isPaid)); // Revert span appearance
  }
}
