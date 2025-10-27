// Initialize Quill editor
var quill = new Quill('#editor-container', {
    theme: 'snow',
    modules: {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['clean']
        ]
    },
    placeholder: 'Enter a detailed description of the work to be completed...'
});

// Customer Database Functions
function getCustomers() {
    const customers = localStorage.getItem('customers');
    return customers ? JSON.parse(customers) : [];
}

function saveCustomer(name, email, address) {
    const customers = getCustomers();
    const existingIndex = customers.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
    
    const customer = { name, email, address };
    
    if (existingIndex >= 0) {
        customers[existingIndex] = customer;
    } else {
        customers.push(customer);
    }
    
    customers.sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem('customers', JSON.stringify(customers));
    loadCustomerDropdown();
}

function deleteCustomer(name) {
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
        let customers = getCustomers();
        customers = customers.filter(c => c.name.toLowerCase() !== name.toLowerCase());
        localStorage.setItem('customers', JSON.stringify(customers));
        loadCustomerDropdown();
        clearCustomerFields();
    }
}

function loadCustomerDropdown() {
    const customers = getCustomers();
    const dropdown = document.getElementById('savedCustomers');
    
    dropdown.innerHTML = '<option value="">-- Start typing new customer or select saved --</option>';
    
    customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.name;
        option.textContent = customer.name;
        dropdown.appendChild(option);
    });
}

function loadCustomer(name) {
    const customers = getCustomers();
    const customer = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
    
    if (customer) {
        document.getElementById('clientName').value = customer.name;
        document.getElementById('clientEmail').value = customer.email || '';
        document.getElementById('clientAddress').value = customer.address || '';
        document.getElementById('deleteCustomer').style.display = 'inline-block';
    }
}

function clearCustomerFields() {
    document.getElementById('savedCustomers').value = '';
    document.getElementById('clientName').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('deleteCustomer').style.display = 'none';
}

// Customer dropdown change handler
document.getElementById('savedCustomers').addEventListener('change', function() {
    if (this.value) {
        loadCustomer(this.value);
    } else {
        document.getElementById('deleteCustomer').style.display = 'none';
    }
});

// Delete customer button handler
document.getElementById('deleteCustomer').addEventListener('click', function() {
    const customerName = document.getElementById('savedCustomers').value;
    if (customerName) {
        deleteCustomer(customerName);
    }
});

// Load customers on page load
loadCustomerDropdown();

// Export customers to JSON file
function exportCustomers() {
    const customers = getCustomers();
    const invoiceNumber = localStorage.getItem('lastInvoiceNumber') || '0';
    
    const backup = {
        customers: customers,
        lastInvoiceNumber: invoiceNumber,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0];
    link.download = `lifestyle_partnership_backup_${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert('Customer data exported successfully!\n\nKeep this file safe - you can use it to restore your data if needed.');
}

// Import customers from JSON file
function importCustomers(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            
            // Validate backup structure
            if (!backup.customers || !Array.isArray(backup.customers)) {
                throw new Error('Invalid backup file format');
            }
            
            // Confirm before importing
            const confirmMsg = `Import ${backup.customers.length} customers?\n\nThis will merge with existing customers.\nExport date: ${new Date(backup.exportDate).toLocaleDateString()}`;
            
            if (confirm(confirmMsg)) {
                // Import customers (merge with existing)
                const existingCustomers = getCustomers();
                const customerMap = new Map();
                
                // Add existing customers
                existingCustomers.forEach(c => {
                    customerMap.set(c.name.toLowerCase(), c);
                });
                
                // Add/update with imported customers
                backup.customers.forEach(c => {
                    customerMap.set(c.name.toLowerCase(), c);
                });
                
                const mergedCustomers = Array.from(customerMap.values());
                mergedCustomers.sort((a, b) => a.name.localeCompare(b.name));
                
                localStorage.setItem('customers', JSON.stringify(mergedCustomers));
                
                // Optionally restore invoice number (ask first)
                if (backup.lastInvoiceNumber && confirm('Also restore invoice counter from backup?')) {
                    localStorage.setItem('lastInvoiceNumber', backup.lastInvoiceNumber);
                    updateDocNumber();
                }
                
                loadCustomerDropdown();
                alert(`Successfully imported ${backup.customers.length} customers!\nTotal customers now: ${mergedCustomers.length}`);
            }
        } catch (error) {
            alert('Error importing file: ' + error.message + '\n\nPlease make sure you selected a valid backup file.');
        }
    };
    reader.readAsText(file);
    
    // Reset file input so same file can be selected again
    event.target.value = '';
}

// Document numbering system (only for invoices)
function getNextDocNumber() {
    const key = 'lastInvoiceNumber';
    let lastNumber = parseInt(localStorage.getItem(key) || '0');
    lastNumber++;
    return String(lastNumber).padStart(4, '0');
}

function saveDocNumber(number) {
    const key = 'lastInvoiceNumber';
    const numericPart = parseInt(number);
    localStorage.setItem(key, numericPart);
}

function resetCounter() {
    if (confirm('Reset Invoice counter to 0001?')) {
        localStorage.removeItem('lastInvoiceNumber');
        updateDocNumber();
        alert('Counter reset successfully!');
    }
}

function updateDocNumber() {
    const docType = document.getElementById('docType').value;
    if (docType === 'Invoice') {
        const currentValue = document.getElementById('docNumber').value;
        // Only set if field is empty (on page load or document type change)
        if (!currentValue || currentValue === '') {
            const lastNumber = parseInt(localStorage.getItem('lastInvoiceNumber') || '0');
            document.getElementById('docNumber').value = String(lastNumber).padStart(4, '0');
        }
    }
}

// Allow manual editing of invoice number
document.getElementById('docNumber').addEventListener('blur', function() {
    const value = this.value.replace(/[^0-9]/g, '');
    if (value) {
        this.value = value.padStart(4, '0');
    }
});

// Toggle form fields based on document type
function toggleFormFields() {
    const docType = document.getElementById('docType').value;
    const quoteFields = document.getElementById('quoteFields');
    const invoiceFields = document.getElementById('invoiceFields');
    const docNumberField = document.getElementById('docNumberField');
    const submitButton = document.querySelector('button[type="submit"]');
    
    if (docType === 'Quote') {
        quoteFields.style.display = 'block';
        invoiceFields.style.display = 'none';
        docNumberField.style.display = 'none';
        submitButton.textContent = 'Create Quote';
        
        document.getElementById('quoteTotal').required = true;
        document.getElementById('docNumber').required = false;
        
        document.querySelectorAll('#invoiceFields input').forEach(input => {
            input.required = false;
        });
    } else {
        quoteFields.style.display = 'none';
        invoiceFields.style.display = 'block';
        docNumberField.style.display = 'block';
        submitButton.textContent = 'Create Invoice';
        
        document.getElementById('docNumber').required = true;
        document.querySelectorAll('#invoiceFields input[name="description[]"]').forEach(input => {
            input.required = true;
        });
        document.querySelectorAll('#invoiceFields input[name="quantity[]"]').forEach(input => {
            input.required = true;
        });
        document.querySelectorAll('#invoiceFields input[name="price[]"]').forEach(input => {
            input.required = true;
        });
        
        document.getElementById('quoteTotal').required = false;
        
        updateDocNumber();
    }
}

document.getElementById('docType').addEventListener('change', function() {
    toggleFormFields();
});

toggleFormFields();

// Save as PDF with custom filename
function savePDF() {
    const docType = document.getElementById('displayDocType').textContent;
    const clientName = document.getElementById('clientName').value;
    const docDate = document.getElementById('docDate').value;
    
    let filename;
    if (docType === 'Quote') {
        const formattedDate = new Date(docDate).toLocaleDateString('en-GB').replace(/\//g, '-');
        filename = `Quote_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${formattedDate}`;
    } else {
        const docNumber = document.getElementById('docNumber').value;
        const year = new Date().getFullYear();
        filename = `INV-${year}-${docNumber}_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    
    document.title = filename;
    
    // Create a style element to hide headers/footers
    const style = document.createElement('style');
    style.innerHTML = `
        @media print {
            @page { 
                margin: 0mm;
                size: A4;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Trigger print dialog
    window.print();
    
    // Clean up
    setTimeout(() => {
        document.title = 'Invoices & Quotes - Lifestyle Partnership';
        document.head.removeChild(style);
    }, 1000);
}

// Add new line item (for invoices)
document.getElementById('addItem').addEventListener('click', function() {
    const lineItems = document.getElementById('lineItems');
    const newItem = document.createElement('div');
    newItem.className = 'row mb-2 line-item';
    newItem.innerHTML = `
        <div class="col-md-5">
            <input type="text" class="form-control" placeholder="Description" name="description[]" required>
        </div>
        <div class="col-md-2">
            <input type="number" class="form-control quantity" placeholder="Qty" name="quantity[]" min="1" value="1" required>
        </div>
        <div class="col-md-3">
            <input type="number" class="form-control price" placeholder="Price" name="price[]" step="0.01" min="0" required>
        </div>
        <div class="col-md-2">
            <button type="button" class="btn btn-danger btn-sm remove-item">Remove</button>
        </div>
    `;
    lineItems.appendChild(newItem);
});

// Remove line item
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-item')) {
        const lineItems = document.querySelectorAll('.line-item');
        if (lineItems.length > 1) {
            e.target.closest('.line-item').remove();
        } else {
            alert('You must have at least one line item.');
        }
    }
});

// Generate invoice/quote
document.getElementById('invoiceForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const docType = document.getElementById('docType').value;
    const clientName = document.getElementById('clientName').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const docDate = document.getElementById('docDate').value;
    const notes = document.getElementById('notes').value;
    
    // Save customer to database
    saveCustomer(clientName, clientEmail, clientAddress);
    
    document.getElementById('displayDocType').textContent = docType;
    document.getElementById('displayDate').textContent = new Date(docDate).toLocaleDateString('en-GB');
    
    if (docType === 'Invoice') {
        const docNumber = document.getElementById('docNumber').value;
        document.getElementById('displayDocNumber').textContent = docNumber;
        document.getElementById('displayDocNumberSection').style.display = 'block';
        
        // Save this number and prepare next one
        const nextNumber = parseInt(docNumber) + 1;
        localStorage.setItem('lastInvoiceNumber', nextNumber);
    } else {
        document.getElementById('displayDocNumberSection').style.display = 'none';
    }
    
    let clientInfo = `<strong>${clientName}</strong><br>`;
    if (clientAddress) clientInfo += `${clientAddress.replace(/\n/g, '<br>')}<br>`;
    if (clientEmail) clientInfo += `Email: ${clientEmail}`;
    document.getElementById('displayClient').innerHTML = clientInfo;
    
    if (docType === 'Quote') {
        document.getElementById('quoteDisplay').style.display = 'block';
        document.getElementById('invoiceDisplayContent').style.display = 'none';
        
        // Get HTML content from Quill editor
        const workDescriptionHTML = quill.root.innerHTML;
        const quoteTotal = parseFloat(document.getElementById('quoteTotal').value || 0);
        
        document.getElementById('displayWorkDescription').innerHTML = workDescriptionHTML;
        document.getElementById('displayQuoteTotal').textContent = quoteTotal.toFixed(2);
        
    } else {
        document.getElementById('quoteDisplay').style.display = 'none';
        document.getElementById('invoiceDisplayContent').style.display = 'block';
        
        const descriptions = document.getElementsByName('description[]');
        const quantities = document.getElementsByName('quantity[]');
        const prices = document.getElementsByName('price[]');
        
        let itemsHTML = '';
        let total = 0;
        
        for (let i = 0; i < descriptions.length; i++) {
            const qty = parseFloat(quantities[i].value);
            const price = parseFloat(prices[i].value);
            const lineTotal = qty * price;
            total += lineTotal;
            
            itemsHTML += `
                <tr>
                    <td>${descriptions[i].value}</td>
                    <td>${qty}</td>
                    <td>£${price.toFixed(2)}</td>
                    <td>£${lineTotal.toFixed(2)}</td>
                </tr>
            `;
        }
        
        document.getElementById('displayItems').innerHTML = itemsHTML;
        document.getElementById('displayTotal').textContent = total.toFixed(2);
        document.getElementById('paymentReference').textContent = document.getElementById('docNumber').value;
    }
    
    if (notes) {
        document.getElementById('displayNotes').textContent = notes;
        document.getElementById('displayNotesSection').style.display = 'block';
    } else {
        document.getElementById('displayNotesSection').style.display = 'none';
    }
    
    document.getElementById('invoiceDisplay').style.display = 'block';
    document.getElementById('invoiceDisplay').scrollIntoView({ behavior: 'smooth' });
});

function resetForm() {
    location.reload();
}

// Set today's date as default
document.getElementById('docDate').valueAsDate = new Date();