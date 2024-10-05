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

// ===== Event Listeners =====
document.addEventListener("DOMContentLoaded", () => {
  if (!currentUser) {
    window.location.href = "login.html";
  } else {
    init();
  }
});

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
    row.querySelectorAll("td:not(:last-child)").forEach((td) => {
      td.classList.toggle("paid-text", paid);
      td.style.color = paid ? "green" : "";
      td.style.textDecoration = paid ? "line-through" : "none";
    });
  }
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
  console.log("Form submission started");

  try {
    const form = event.target;
    const invoiceData = {
      year: form.year.value,
      month: form.month.value,
      clientName: form["client-name"].value,
      amount: parseFloat(form["invoice-amount"].value),
      referrer: currentUser,
      bonusPercentage: parseFloat(form["referral-bonus"].value),
      paid: form["paid-status"].checked,
      createdBy: currentUser,
    };

    console.log("Invoice data:", invoiceData);

    const response = await fetch(`${config.API_BASE_URL}/save-invoice`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoiceData),
    });

    console.log("Response received:", response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Invoice saved successfully:", result);

    await fetchInvoices();
    renderInvoiceList();
    renderSummaryTables();
    form.reset();
  } catch (error) {
    console.error("Error in form submission:", error);
    alert("Failed to save invoice. Please check the console for details.");
  }
}

// ===== Invoice Rendering =====
function renderInvoiceList() {
  const invoiceList = getElement(
    "invoice-list",
    "Invoice list table not found",
  );

  // Sort invoices by id in descending order (assuming higher id means more recently added)
  const sortedInvoices = [...invoices].sort((a, b) => b.id - a.id);

  invoiceList.innerHTML = sortedInvoices
    .map(
      (invoice) => `
        <tr data-id="${invoice.id}" class="${invoice.paid ? "paid-invoice" : "unpaid-invoice"}">
          <td class="${invoice.paid ? "paid-text" : ""}">${invoice.year}</td>
          <td class="${invoice.paid ? "paid-text" : ""}">${invoice.month}</td>
          <td class="${invoice.paid ? "paid-text" : ""}">${invoice.clientName}</td>
          <td class="${invoice.paid ? "paid-text" : ""}">${invoice.amount.toFixed(2)}</td>
          <td class="${invoice.paid ? "paid-text" : ""}">${invoice.referrer}</td>
          <td class="${invoice.paid ? "paid-text" : ""}">${(invoice.bonusPercentage * 100).toFixed(0)}%</td>
          <td>
            <input type="checkbox" ${invoice.paid ? "checked" : ""} onchange="updatePaidStatus(${invoice.id}, this.checked)" ${invoice.createdBy !== currentUser ? "disabled" : ""}>
          </td>
          <td>
            ${
              invoice.createdBy === currentUser
                ? `<button onclick="editInvoice(${invoice.id})">Edit</button>
               <button onclick="deleteInvoice(${invoice.id})">Delete</button>`
                : ""
            }
          </td>
        </tr>
      `,
    )
    .join("");
}

// ===== Invoice Editing and Deletion =====
function editInvoice(id) {
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice || invoice.createdBy !== currentUser) {
    alert("You are not authorized to edit this invoice");
    return;
  }

  const form = getElement("invoice-form", "Invoice form not found");
  form.year.value = invoice.year;
  form.month.value = invoice.month;
  form["client-name"].value = invoice.clientName;
  form["invoice-amount"].value = invoice.amount;
  form["referral-bonus"].value = invoice.bonusPercentage;
  form["paid-status"].checked = invoice.paid;

  // Change the form submission handler to update instead of create
  form.onsubmit = (event) => handleEditSubmit(event, id);

  // Change the submit button text
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.textContent = "Update Invoice";

  // Scroll to the form
  form.scrollIntoView({ behavior: "smooth" });
}

async function handleEditSubmit(event, id) {
  event.preventDefault();
  console.log("Edit form submission started");

  try {
    const form = event.target;
    const invoiceData = {
      year: form.year.value,
      month: form.month.value,
      clientName: form["client-name"].value,
      amount: parseFloat(form["invoice-amount"].value),
      referrer: currentUser,
      bonusPercentage: parseFloat(form["referral-bonus"].value),
      paid: form["paid-status"].checked,
      createdBy: currentUser,
    };

    console.log("Updated invoice data:", invoiceData);

    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    };

    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(invoiceData),
      },
    );

    console.log("Response received:", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || "Unknown error"}`);
    }

    const result = await response.json();
    console.log("Invoice updated successfully:", result);

    await fetchInvoices();
    renderInvoiceList();
    renderSummaryTables();

    // Reset form to its original state
    form.reset();
    form.onsubmit = handleFormSubmit;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Add Invoice";
  } catch (error) {
    console.error("Error in form submission:", error);
    alert(`Failed to update invoice: ${error.message}`);
  }
}
  event.preventDefault();
  console.log("Edit form submission started");

  try {
    const form = event.target;
    const invoiceData = {
      year: form.year.value,
      month: form.month.value,
      clientName: form["client-name"].value,
      amount: parseFloat(form["invoice-amount"].value),
      referrer: currentUser,
      bonusPercentage: parseFloat(form["referral-bonus"].value),
      paid: form["paid-status"].checked,
      createdBy: currentUser,
    };

    console.log("Updated invoice data:", invoiceData);

    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    };

    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(invoiceData),
      },
    );

    console.log("Response received:", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || "Unknown error"}`);
    }

    const result = await response.json();
    console.log("Invoice updated successfully:", result);

    await fetchInvoices();
    renderInvoiceList();
    renderSummaryTables();

    // Reset form to its original state
    form.reset();
    form.onsubmit = handleFormSubmit;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Add Invoice";
  } catch (error) {
    console.error("Error in form submission:", error);
    alert(`Failed to update invoice: ${error.message}`);
  }
}
  event.preventDefault();
  console.log("Edit form submission started");

  try {
    const form = event.target;
    const invoiceData = {
      year: form.year.value,
      month: form.month.value,
      clientName: form["client-name"].value,
      amount: parseFloat(form["invoice-amount"].value),
      referrer: currentUser,
      bonusPercentage: parseFloat(form["referral-bonus"].value),
      paid: form["paid-status"].checked,
      createdBy: currentUser,
    };

    console.log("Updated invoice data:", invoiceData);

    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    };

    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(invoiceData),
      },
    );

    console.log("Response received:", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || "Unknown error"}`);
    }

    const result = await response.json();
    console.log("Invoice updated successfully:", result);

    await fetchInvoices();
    renderInvoiceList();
    renderSummaryTables();

    // Reset form to its original state
    form.reset();
    form.onsubmit = handleFormSubmit;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Add Invoice";
  } catch (error) {
    console.error("Error in form submission:", error);
    alert(`Failed to update invoice: ${error.message}`);
  }
}

async function deleteInvoice(id) {
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice || invoice.createdBy !== currentUser) {
    alert("You are not authorized to delete this invoice");
    return;
  }

  if (!confirm("Are you sure you want to delete this invoice?")) {
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch(
      `${config.API_BASE_URL}/delete-invoice/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ currentUser: currentUser }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      await fetchInvoices();
      renderInvoiceList();
      renderSummaryTables();
      alert("Invoice deleted successfully");
    } else {
      throw new Error(result.message || "Failed to delete invoice");
    }
  } catch (error) {
    console.error("Error deleting invoice:", error);
    alert(`Failed to delete invoice: ${error.message}`);
  }
}

  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice || invoice.createdBy !== currentUser) {
    alert("You are not authorized to delete this invoice");
    return;
  }

  if (!confirm("Are you sure you want to delete this invoice?")) {
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch(
      `${config.API_BASE_URL}/delete-invoice/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ currentUser: currentUser }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      await fetchInvoices();
      renderInvoiceList();
      renderSummaryTables();
      alert("Invoice deleted successfully");
    } else {
      throw new Error(result.message || "Failed to delete invoice");
    }
  } catch (error) {
    console.error("Error deleting invoice:", error);
    alert(`Failed to delete invoice: ${error.message}`);
  }
}
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice || invoice.createdBy !== currentUser) {
      alert("You are not authorized to delete this invoice");
      return;
    }

    if (!confirm("Are you sure you want to delete this invoice?")) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `${config.API_BASE_URL}/delete-invoice/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify({ currentUser: currentUser }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        await fetchInvoices();
        renderInvoiceList();
        renderSummaryTables();
        alert("Invoice deleted successfully");
      } else {
        throw new Error(result.message || "Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert(`Failed to delete invoice: ${error.message}`);
    }
  }


  event.preventDefault();
  console.log("Edit form submission started");

  try {
    const form = event.target;
    const invoiceData = {
      year: form.year.value,
      month: form.month.value,
      clientName: form["client-name"].value,
      amount: parseFloat(form["invoice-amount"].value),
      referrer: currentUser,
      bonusPercentage: parseFloat(form["referral-bonus"].value),
      paid: form["paid-status"].checked,
      createdBy: currentUser,
    };

    console.log("Updated invoice data:", invoiceData);

    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      },
    );

    console.log("Response received:", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || "Unknown error"}`);
    }

    const result = await response.json();
    console.log("Invoice updated successfully:", result);

    await fetchInvoices();
    renderInvoiceList();
    renderSummaryTables();

    // Reset form to its original state
    form.reset();
    form.onsubmit = handleFormSubmit;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Add Invoice";
  } catch (error) {
    console.error("Error in form submission:", error);
    alert(`Failed to update invoice: ${error.message}`);
  }
}
  event.preventDefault();
  console.log("Edit form submission started");

  try {
    const form = event.target;
    const invoiceData = {
      year: form.year.value,
      month: form.month.value,
      clientName: form["client-name"].value,
      amount: parseFloat(form["invoice-amount"].value),
      referrer: currentUser,
      bonusPercentage: parseFloat(form["referral-bonus"].value),
      paid: form["paid-status"].checked,
      createdBy: currentUser,
    };

    console.log("Updated invoice data:", invoiceData);

    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(invoiceData),
      },
    );

    console.log("Response received:", response);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message || "Unknown error"}`);
    }

    const result = await response.json();
    console.log("Invoice updated successfully:", result);

    await fetchInvoices();
    renderInvoiceList();
    renderSummaryTables();

    // Reset form to its original state
    form.reset();
    form.onsubmit = handleFormSubmit;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Add Invoice";
  } catch (error) {
    console.error("Error in form submission:", error);
    alert(`Failed to update invoice: ${error.message}`);
  }
}
  event.preventDefault();
  console.log("Edit form submission started");

  try {
    const form = event.target;
    const invoiceData = {
      year: form.year.value,
      month: form.month.value,
      clientName: form["client-name"].value,
      amount: parseFloat(form["invoice-amount"].value),
      referrer: currentUser,
      bonusPercentage: parseFloat(form["referral-bonus"].value),
      paid: form["paid-status"].checked,
      createdBy: currentUser,
    };

    console.log("Updated invoice data:", invoiceData);

    const token = localStorage.getItem("authToken"); // Assume you store the auth token in localStorage
    const headers = {
      "Content-Type": "application/json",
      "Authorization": token ? `Bearer ${token}` : "",
    };

    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: headers,
        body: JSON.stringify(invoiceData),
      },
    );

    console.log("Response received:", response);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Invoice updated successfully:", result);

    await fetchInvoices();
    renderInvoiceList();
    renderSummaryTables();

    // Reset form to its original state
    form.reset();
    form.onsubmit = handleFormSubmit;
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Add Invoice";
  } catch (error) {
    console.error("Error in form submission:", error);
    alert("Failed to update invoice. Please check the console for details.");
  }
}


async function deleteInvoice(id) {
  const invoice = invoices.find((inv) => inv.id === id);
  if (!invoice || invoice.createdBy !== currentUser) {
    alert("You are not authorized to delete this invoice");
    return;
  }

  if (!confirm("Are you sure you want to delete this invoice?")) {
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    const response = await fetch(
      `${config.API_BASE_URL}/delete-invoice/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ currentUser: currentUser }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      await fetchInvoices();
      renderInvoiceList();
      renderSummaryTables();
      alert("Invoice deleted successfully");
    } else {
      throw new Error(result.message || "Failed to delete invoice");
    }
  } catch (error) {
    console.error("Error deleting invoice:", error);


// ===== Quarterly Bonus Handling =====
function getQuarterlyBonusPaidStatus(referrer, year, quarter) {
  return (
    (quarterlyBonusPaidStatus[referrer] &&
      quarterlyBonusPaidStatus[referrer][`${year}-${quarter}`]) ||
    false
  );
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
        invoice.paid // Only consider paid invoices
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
  referrers.forEach((referrer) => {
    const referrerInvoices = invoices.filter((invoice) => invoice.referrer === referrer);
    const table = createReferrerTable(referrer, referrerInvoices);
    summaryTablesContainer.appendChild(table);
  });
}

function createReferrerTable(referrer, referrerInvoices) {
  const table = document.createElement("table");
  table.className = `table table-sm summary-table ${referrer.toLowerCase().replace(/\s+/g, "-")}`;

  const years = [
    ...new Set(referrerInvoices.map((invoice) => invoice.year)),
  ].sort((a, b) => b - a);

  const referrerColor =
    {
      AdvokatiCHZ: "purple",
      MKMs: "black",
      Contax: "#D4AF37",
    }[referrer] || "inherit";

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
    th.innerHTML = `Q${quarter} <input type="checkbox" class="paid-checkbox" data-quarter="${quarter}" data-referrer="${referrer}" ${
      referrer === currentUser ? "" : "disabled"
    }>`;

    const checkbox = th.querySelector(".paid-checkbox");
    checkbox.addEventListener("change", (event) =>
      updateQuarterStatus(event.target, referrer),
    );
  }

  const tbody = table.createTBody();
  years.forEach((year) => {
    const row = tbody.insertRow();
    const yearCell = row.insertCell();
    yearCell.textContent = year;

    for (let quarter = 1; quarter <= 4; quarter++) {
      const cell = row.insertCell();
      const quarterlyBonus = calculateQuarterlyBonus(
        referrerInvoices,
        year,
        quarter,
      );
      const isPaid = getQuarterlyBonusPaidStatus(referrer, year, quarter);
      cell.innerHTML = `<span class="quarter-amount ${
        isPaid ? "paid" : "unpaid"
      }">${quarterlyBonus.toFixed(2)}</span>`;
    }
  });

  return table;
}


async function updatePaidStatus(id, paid) {
  try {
    const invoice = invoices.find((inv) => inv.id === id);
    if (!invoice || invoice.createdBy !== currentUser) {
      throw new Error("You are not authorized to update this invoice");
    }

    const response = await fetch(
      `${config.API_BASE_URL}/update-invoice/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paid: paid,
          currentUser: currentUser,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      invoice.paid = paid;
      updateInvoiceRowAppearance(id, paid);
      await fetchInvoices(); // Fetch updated invoices
      renderInvoiceList(); // Re-render the invoice list
      renderSummaryTables(); // Update summary tables
    } else {
      throw new Error("Failed to update invoice paid status");
    }
  } catch (error) {
    console.error("Error updating paid status:", error);
    alert(error.message);
    const checkbox = document.querySelector(
      `tr[data-id="${id}"] input[type="checkbox"]`,
    );
    if (checkbox) {
      checkbox.checked = !paid;
    }
  }
}

async function updateQuarterStatus(checkbox, referrer) {
  const quarter = checkbox.dataset.quarter;
  const year = new Date().getFullYear(); // You might want to make this dynamic based on the current view
  const isPaid = checkbox.checked;

  try {
    const response = await fetch(
      `${config.API_BASE_URL}/update-quarterly-bonus-status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrer, year, quarter, isPaid }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    if (result.success) {
      // Update the local state
      if (!quarterlyBonusPaidStatus[referrer]) {
        quarterlyBonusPaidStatus[referrer] = {};
      }
      quarterlyBonusPaidStatus[referrer][`${year}-${quarter}`] = isPaid;

      // Update the UI
      const table = checkbox.closest("table");
      const amountSpan = table.querySelector(
        `tbody tr:nth-child(${year - new Date().getFullYear() + 1}) td:nth-child(${parseInt(quarter) + 1}) .quarter-amount`,
      );
      if (amountSpan) {
        amountSpan.classList.toggle("paid", isPaid);
        amountSpan.classList.toggle("unpaid", !isPaid);
      }
    } else {
      throw new Error("Failed to update quarterly bonus status");
    }
  } catch (error) {
    console.error("Error updating quarter status:", error);
    alert("Failed to update quarterly bonus status. Please try again.");
    checkbox.checked = !isPaid; // Revert the checkbox state
  }
}

// Initialize the application
if (currentUser) {
  init();
} else {
  window.location.href = "login.html";
}

// Make functions accessible globally
window.updatePaidStatus = updatePaidStatus;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
if (currentUser) {
  init();
} else {
  window.location.href = "login.html";
}

// Make functions accessible globally
window.updatePaidStatus = updatePaidStatus;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
if (currentUser) {
  init();
} else {
  window.location.href = "login.html";
}

// Make functions accessible globally
window.updatePaidStatus = updatePaidStatus;
window.editInvoice = editInvoice;
window.deleteInvoice = deleteInvoice;
