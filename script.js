// Variáveis globais
let products = [];
let budget = 0;
let editingIndex = -1;

// Elementos do DOM
const budgetInput = document.getElementById('budget');
const budgetDisplay = document.getElementById('budget-display');
const totalSpent = document.getElementById('total-spent');
const remainingBudget = document.getElementById('remaining-budget');
const productForm = document.getElementById('product-form');
const productNameInput = document.getElementById('product-name');
const productQuantityInput = document.getElementById('product-quantity');
const productPriceInput = document.getElementById('product-price');
const productsList = document.getElementById('products-list');
const emptyState = document.getElementById('empty-state');
const totalItems = document.getElementById('total-items');
const grandTotal = document.getElementById('grand-total');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadFromLocalStorage();
    updateDisplay();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Permitir vírgula como separador decimal no campo orçamento
    budgetInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/[^\d.,]/g, '');
        e.target.value = value;
    });

    // Atualizar cálculos em tempo real
    productQuantityInput.addEventListener('input', updateCalculations);
    productPriceInput.addEventListener('input', updateCalculations);
}

// Função para definir orçamento
function setBudget() {
    const value = parsePrice(budgetInput.value);
    
    if (isNaN(value) || value < 0) {
        showAlert('Por favor, insira um valor válido para o orçamento.', 'warning');
        return;
    }

    budget = value;
    budgetDisplay.textContent = formatCurrency(budget);
    budgetInput.value = '';
    
    updateDisplay();
    saveToLocalStorage();
    showAlert('Orçamento definido com sucesso!', 'success');
}

// Função para adicionar produto
function addProduct(event) {
    event.preventDefault();
    
    const name = productNameInput.value.trim();
    const quantity = parseInt(productQuantityInput.value);
    const priceText = productPriceInput.value.trim();
    
    // Validações
    if (!name) {
        showAlert('Por favor, insira o nome do produto.', 'warning');
        return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
        showAlert('Por favor, insira uma quantidade válida.', 'warning');
        return;
    }
    
    // Converter preço de texto para número
    const price = parsePrice(priceText);
    
    if (isNaN(price) || price < 0) {
        showAlert('Por favor, insira um preço válido (ex: R$ 5,50 ou 5.50).', 'warning');
        return;
    }
    
    const product = {
        name: name,
        quantity: quantity,
        price: price,
        total: quantity * price
    };
    
    if (editingIndex >= 0) {
        // Editando produto existente
        products[editingIndex] = product;
        editingIndex = -1;
        document.querySelector('form button[type="submit"]').textContent = 'Adicionar';
    } else {
        // Adicionando novo produto
        products.push(product);
    }
    
    // Limpar formulário
    productForm.reset();
    productQuantityInput.value = '1';
    
    updateDisplay();
    saveToLocalStorage();
    
    const message = editingIndex >= 0 ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!';
    showAlert(message, 'success');
}

// Função para editar produto
function editProduct(index) {
    const product = products[index];
    
    productNameInput.value = product.name;
    productQuantityInput.value = product.quantity;
    productPriceInput.value = formatCurrency(product.price);
    
    editingIndex = index;
    document.querySelector('form button[type="submit"]').textContent = 'Atualizar';
    
    // Focar no primeiro campo
    productNameInput.focus();
}

// Função para deletar produto
function deleteProduct(index) {
    if (confirm('Tem certeza que deseja remover este produto da lista?')) {
        products.splice(index, 1);
        updateDisplay();
        saveToLocalStorage();
        showAlert('Produto removido com sucesso!', 'success');
    }
}

// Função para limpar lista
function clearList() {
    if (products.length === 0) {
        showAlert('A lista já está vazia.', 'warning');
        return;
    }
    
    if (confirm('Tem certeza que deseja limpar toda a lista de compras?')) {
        products = [];
        editingIndex = -1;
        document.querySelector('form button[type="submit"]').textContent = 'Adicionar';
        productForm.reset();
        productQuantityInput.value = '1';
        
        updateDisplay();
        saveToLocalStorage();
        showAlert('Lista limpa com sucesso!', 'success');
    }
}

// Função para exportar lista
function exportList() {
    if (products.length === 0) {
        showAlert('Não há produtos para exportar.', 'warning');
        return;
    }
    
    let exportText = '🛒 LISTA DE COMPRAS\n';
    exportText += '='.repeat(30) + '\n\n';
    
    let total = 0;
    products.forEach((product, index) => {
        exportText += `${index + 1}. ${product.name}\n`;
        exportText += `   Quantidade: ${product.quantity}\n`;
        exportText += `   Preço unitário: ${formatCurrency(product.price)}\n`;
        exportText += `   Total: ${formatCurrency(product.total)}\n\n`;
        total += product.total;
    });
    
    exportText += '='.repeat(30) + '\n';
    exportText += `TOTAL: ${formatCurrency(total)}\n`;
    
    if (budget > 0) {
        exportText += `ORÇAMENTO: ${formatCurrency(budget)}\n`;
        exportText += `SALDO: ${formatCurrency(budget - total)}\n`;
    }
    
    exportText += `\nData: ${new Date().toLocaleDateString('pt-BR')}\n`;
    exportText += `Hora: ${new Date().toLocaleTimeString('pt-BR')}`;
    
    // Criar e baixar arquivo
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista-compras-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showAlert('Lista exportada com sucesso!', 'success');
}

// Função para atualizar cálculos em tempo real
function updateCalculations() {
    const quantity = parseInt(productQuantityInput.value) || 0;
    const priceText = productPriceInput.value.trim();
    const price = parsePrice(priceText) || 0;
    const total = quantity * price;
    
    // Mostrar preview do total (opcional)
    // Você pode adicionar um elemento para mostrar o total em tempo real
}

// Função para atualizar display
function updateDisplay() {
    // Atualizar lista de produtos
    renderProductsList();
    
    // Atualizar resumo
    updateSummary();
    
    // Atualizar informações de orçamento
    updateBudgetInfo();
    
    // Mostrar/ocultar estado vazio
    toggleEmptyState();
}

// Função para renderizar lista de produtos
function renderProductsList() {
    productsList.innerHTML = '';
    
    products.forEach((product, index) => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        productElement.setAttribute('data-label', `Produto ${index + 1}`);
        
        productElement.innerHTML = `
            <div class="product-name">${product.name}</div>
            <div class="product-quantity">${product.quantity}</div>
            <div class="product-price">${formatCurrency(product.price)}</div>
            <div class="product-total">${formatCurrency(product.total)}</div>
            <div class="product-actions">
                <button class="btn-edit" onclick="editProduct(${index})" title="Editar">
                    <img src="img/editar.svg" alt="Editar" style="height: 20px; width: 20px; vertical-align: middle; filter: brightness(0) saturate(100%) invert(87%) sepia(97%) saturate(748%) hue-rotate(1deg) brightness(104%) contrast(104%);">
                </button>
                <button class="btn-delete" onclick="deleteProduct(${index})" title="Remover">
                    <img src="img/excluir.svg" alt="Excluir" style="height: 20px; width: 20px; vertical-align: middle; filter: brightness(0) saturate(100%) invert(18%) sepia(99%) saturate(7492%) hue-rotate(1deg) brightness(97%) contrast(119%);">
                </button>
            </div>
        `;
        
        productsList.appendChild(productElement);
    });
}

// Função para atualizar resumo
function updateSummary() {
    const total = products.reduce((sum, product) => sum + product.total, 0);
    const itemCount = products.length;
    
    totalItems.textContent = itemCount;
    grandTotal.textContent = formatCurrency(total);
}

// Função para atualizar informações de orçamento
function updateBudgetInfo() {
    const total = products.reduce((sum, product) => sum + product.total, 0);
    const remaining = budget - total;
    
    totalSpent.textContent = formatCurrency(total);
    remainingBudget.textContent = formatCurrency(remaining);
    
    // Mudar cor do saldo restante baseado no valor
    const remainingElement = document.getElementById('remaining-budget');
    if (remaining < 0) {
        remainingElement.style.color = '#e53e3e'; // Vermelho
    } else if (remaining < budget * 0.1) {
        remainingElement.style.color = '#d69e2e'; // Amarelo
    } else {
        remainingElement.style.color = '#2d3748'; // Normal
    }
}

// Função para mostrar/ocultar estado vazio
function toggleEmptyState() {
    if (products.length === 0) {
        emptyState.style.display = 'block';
        productsList.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        productsList.style.display = 'block';
    }
}

// Função para converter preço de texto para número
function parsePrice(priceText) {
    if (!priceText) return NaN;
    
    // Remove R$, espaços e outros caracteres não numéricos, exceto vírgula e ponto
    let cleanPrice = priceText.replace(/[^\d,.]/g, '');
    
    // Se tem vírgula e ponto, assume que vírgula é separador decimal
    if (cleanPrice.includes(',') && cleanPrice.includes('.')) {
        cleanPrice = cleanPrice.replace('.', '').replace(',', '.');
    }
    // Se só tem vírgula, converte para ponto
    else if (cleanPrice.includes(',')) {
        cleanPrice = cleanPrice.replace(',', '.');
    }
    
    return parseFloat(cleanPrice);
}

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para mostrar alertas
function showAlert(message, type) {
    // Remover alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Criar novo alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    // Inserir no início do container
    const container = document.querySelector('.container');
    container.insertBefore(alert, container.firstChild);
    
    // Remover após 5 segundos
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// Função para salvar no localStorage
function saveToLocalStorage() {
    const data = {
        products: products,
        budget: budget
    };
    localStorage.setItem('shoppingList', JSON.stringify(data));
}

// Função para carregar do localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('shoppingList');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            products = data.products || [];
            budget = data.budget || 0;
        } catch (error) {
            console.error('Erro ao carregar dados salvos:', error);
            products = [];
            budget = 0;
        }
    }
}

// Função para cancelar edição
function cancelEdit() {
    editingIndex = -1;
    document.querySelector('form button[type="submit"]').textContent = 'Adicionar';
    productForm.reset();
    productQuantityInput.value = '1';
}

// Adicionar tecla ESC para cancelar edição
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && editingIndex >= 0) {
        cancelEdit();
    }
});

// Adicionar tecla Enter para submeter formulário
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && (e.target === productNameInput || e.target === productQuantityInput || e.target === productPriceInput)) {
        e.preventDefault();
        addProduct(e);
    }
});

// Função para verificar se o orçamento foi excedido
function checkBudgetWarning() {
    const total = products.reduce((sum, product) => sum + product.total, 0);
    const remaining = budget - total;
    
    if (budget > 0 && remaining < 0) {
        showAlert('⚠️ Atenção: O orçamento foi excedido!', 'warning');
    } else if (budget > 0 && remaining < budget * 0.1) {
        showAlert('⚠️ Atenção: Resta menos de 10% do orçamento!', 'warning');
    }
}

// Verificar orçamento sempre que um produto for adicionado
const originalAddProduct = addProduct;
addProduct = function(event) {
    originalAddProduct(event);
    checkBudgetWarning();
}; 

function clearBudget() {
    budget = 0;
    budgetDisplay.textContent = formatCurrency(0);
    budgetInput.value = '';
    updateDisplay();
    saveToLocalStorage();
    showAlert('Orçamento limpo com sucesso!', 'success');
} 