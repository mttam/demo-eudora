// Pharmacy module - gestisce ordini e prodotti per le farmacie
const Pharmacy = {
    orders: [],
    products: [],
    currentPharmacy: null,

    // Inizializza il modulo Pharmacy
    init() {
        console.log('🏥 Initializing Pharmacy module...');
        this.loadData();
    },

    // Carica i dati della farmacia dal database
    loadData() {
        if (!EudoraApp.currentUser || EudoraApp.currentUser.role !== 'pharmacy') {
            console.log('❌ User is not a pharmacy for Pharmacy.loadData()');
            return;
        }
        
        const pharmacyId = EudoraApp.currentUser.pharmacyId || EudoraApp.currentUser.id;
        this.currentPharmacy = EudoraApp.currentUser;
        
        console.log(`🔄 Loading pharmacy data for pharmacy ${pharmacyId}...`);
        
        // Carica gli ordini della farmacia direttamente da eudora_orders
        try {
            // Load all orders from eudora_orders and filter by pharmacy
            const allOrders = Database.get(Database.keys.orders) || [];
            this.orders = allOrders.filter(order => 
                order.pharmacyId === pharmacyId || 
                order.assignedPharmacyId === pharmacyId
            );
            console.log(`📦 Loaded ${this.orders.length} pharmacy orders from eudora_orders`);
        } catch (error) {
            console.warn('⚠️ Error loading pharmacy orders from eudora_orders:', error.message);
            this.orders = [];
        }
        
        // Carica i prodotti della farmacia filtrando per pharmacyId
        try {
            // Get all products directly from eudora_products and filter by current pharmacy ID
            const allProducts = Database.get(Database.keys.products) || [];
            this.products = allProducts.filter(product => 
                product.isActive !== false && (
                    product.pharmacyId === pharmacyId || 
                    product.pharmacyId === this.currentPharmacy.id
                )
            );
            
            console.log(`🔍 DEBUG: Total products in eudora_products: ${allProducts.length}`);
            console.log(`🔍 DEBUG: Current pharmacy ID: ${pharmacyId}`);
            console.log(`🔍 DEBUG: Products for this pharmacy: ${this.products.length}`);
            
            // Debug each product's stock values
            this.products.forEach(product => {
                console.log(`🔍 PRODUCT STOCK DEBUG: ${product.name} - stock: ${product.stock} (${typeof product.stock}), inStock: ${product.inStock}, isActive: ${product.isActive}, available: ${this.getProductAvailability(product)}`);
            });
            
            console.log(`💊 Loaded ${this.products.length} products for pharmacy ${pharmacyId} from eudora_products`);
            
            // If no products found, show sample products for debugging
            if (this.products.length === 0) {
                const sampleProducts = allProducts.slice(0, 3);
                console.log('🔍 DEBUG: Sample products pharmacyIds:', sampleProducts.map(p => ({ 
                    name: p.name, 
                    pharmacyId: p.pharmacyId, 
                    pharmacyName: p.pharmacyName 
                })));
            }
        } catch (error) {
            console.warn('⚠️ Error loading pharmacy products:', error.message);
            this.products = [];
        }
        
        // Aggiorna la visualizzazione
        this.updateOrdersDisplay();
    },

    // Aggiorna la visualizzazione degli ordini
    updateOrdersDisplay() {
        const ordersContainer = document.getElementById('pharmacy-orders-list');
        if (!ordersContainer) return;

        if (this.orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-inbox text-4xl mb-3"></i>
                    <p>Nessun ordine in arrivo</p>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = this.orders.map(order => `
            <div class="bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 ${this.getOrderBorderColor(order.status)}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-semibold text-lg">Ordine #${order.id}</h3>
                        <p class="text-gray-600">
                            <i class="fas fa-user mr-1"></i> ${order.customerName || 'Cliente'} 
                            <span class="mx-2">|</span>
                            <i class="fas fa-phone mr-1"></i> ${order.customerPhone || 'N/A'}
                        </p>
                        <p class="text-gray-600">
                            <i class="fas fa-clock mr-1"></i> ${new Date(order.createdAt).toLocaleDateString('it-IT')} alle ${new Date(order.createdAt).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="px-3 py-1 rounded-full text-sm ${this.getStatusClasses(order.status)}">
                            ${this.getStatusText(order.status)}
                        </span>
                        <div class="text-lg font-bold mt-1">€${order.total.toFixed(2)}</div>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-3 mb-4">
                    <h4 class="font-medium mb-2">Prodotti ordinati:</h4>
                    ${order.items.map(item => `
                        <div class="flex justify-between py-1">
                            <span>${item.name} x${item.quantity}</span>
                            <span>€${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>

                <div class="mb-4">
                    <h4 class="font-medium mb-1">Indirizzo di consegna:</h4>
                    <p class="text-gray-600">
                        ${order.deliveryAddress || 'Indirizzo non specificato'}
                        ${order.notes ? `<br>Note: ${order.notes}` : ''}
                    </p>
                </div>

                <div class="flex space-x-2">
                    ${this.getOrderActionButtons(order)}
                </div>
            </div>
        `).join('');
    },

    // Restituisce i pulsanti di azione per un ordine
    getOrderActionButtons(order) {
        switch (order.status) {
            case 'pending':
                return `
                    <button onclick="Pharmacy.acceptOrder(${order.id})" 
                            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
                        <i class="fas fa-check mr-1"></i> Accetta
                    </button>
                    <button onclick="Pharmacy.showRejectModal(${order.id})" 
                            class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition">
                        <i class="fas fa-times mr-1"></i> Rifiuta
                    </button>
                `;
            case 'accepted':
                return `
                    <button onclick="Pharmacy.markOrderReady(${order.id})" 
                            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                        <i class="fas fa-box mr-1"></i> Segna come Pronto
                    </button>
                `;
            case 'ready':
                return `
                    <button onclick="Pharmacy.completeOrder(${order.id})" 
                            class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">
                        <i class="fas fa-shipping-fast mr-1"></i> Consegnato
                    </button>
                `;
            default:
                return '';
        }
    },

    // Restituisce il colore del bordo per lo stato dell'ordine
    getOrderBorderColor(status) {
        const colors = {
            'pending': 'border-yellow-400',
            'accepted': 'border-blue-400',
            'preparing': 'border-blue-400',
            'ready': 'border-green-400',
            'delivered': 'border-gray-400',
            'cancelled': 'border-red-400'
        };
        return colors[status] || 'border-gray-300';
    },

    // Restituisce le classi CSS per lo stato dell'ordine
    getStatusClasses(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'accepted': 'bg-blue-100 text-blue-800',
            'preparing': 'bg-blue-100 text-blue-800',
            'ready': 'bg-green-100 text-green-800',
            'delivered': 'bg-gray-100 text-gray-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    },

    // Restituisce il testo per lo stato dell'ordine
    getStatusText(status) {
        const texts = {
            'pending': 'In Attesa',
            'accepted': 'Accettato',
            'preparing': 'In Preparazione',
            'ready': 'Pronto',
            'delivered': 'Consegnato',
            'cancelled': 'Cancellato'
        };
        return texts[status] || status;
    },

    // Accetta un ordine
    acceptOrder(orderId) {
        console.log(`✅ Accepting order #${orderId}`);
        
        // Ensure orderId is string for matching
        const orderIdStr = String(orderId);
        const order = this.orders.find(o => String(o.id) === orderIdStr);
        if (!order) {
            console.error(`❌ Order #${orderId} not found`);
            return;
        }

        // Check stock availability before accepting
        if (order.items && order.items.length > 0) {
            const stockCheck = Database.checkStockAvailability(order.items);
            if (!stockCheck.isAvailable) {
                console.error(`❌ Insufficient stock for order #${orderId}:`, stockCheck.errors);
                if (typeof pharmacyNotificationManager !== 'undefined') {
                    pharmacyNotificationManager.error('Stock Insufficiente', 
                        `Impossibile accettare l'ordine #${orderId}. Prodotti non disponibili: ${stockCheck.errors.map(e => e.productName).join(', ')}`);
                }
                return;
            }
        }

        order.status = 'accepted';
        order.acceptedAt = new Date().toISOString();
        
        // Aggiorna nel database con gestione errori e riservazione stock
        try {
            // Reserve stock for order items
            if (order.items && order.items.length > 0) {
                const stockReservation = Database.reserveStock(order.items);
                if (!stockReservation.success) {
                    console.error(`❌ Failed to reserve stock for order #${orderId}:`, stockReservation.errors);
                    if (typeof pharmacyNotificationManager !== 'undefined') {
                        pharmacyNotificationManager.error('Errore Stock', `Impossibile riservare i prodotti per l'ordine #${orderId}`);
                    }
                    return;
                }
                console.log(`📦 Stock reserved for order #${orderId}:`, stockReservation.stockChanges);
            }
            
            Database.updateOrder(orderId, { status: 'accepted', acceptedAt: order.acceptedAt });
            console.log(`✅ Order #${orderId} accepted in database with stock reserved`);
        } catch (error) {
            console.error(`❌ Error updating order #${orderId}:`, error);
            // Mostra notifica di errore
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.error('Errore Database', `Impossibile aggiornare l'ordine #${orderId}`);
            }
            return;
        }
        
        this.updateOrdersDisplay();
        
        // Reload products to reflect stock changes
        this.loadProducts();

        // Invia notifica al cliente
        if (order.customerId) {
            const title = '✅ Ordine Accettato';
            const message = `La farmacia ha accettato il tuo ordine #${orderId} ed è ora in preparazione.`;
            
            console.log(`📤 Sending acceptance notification to customer ${order.customerId}`);
            try {
                Database.createNotification({
                    id: Date.now(),
                    userId: order.customerId,
                    type: 'order_accepted',
                    title: title,
                    message: message,
                    relatedId: orderId,
                    createdAt: new Date().toISOString(),
                    read: false
                });
            } catch (error) {
                console.warn('⚠️ Error creating notification:', error);
            }
        }

        // Mostra notifica di successo
        if (typeof pharmacyNotificationManager !== 'undefined') {
            pharmacyNotificationManager.success('Ordine Accettato', `Ordine #${orderId} accettato con successo`);
        } else if (typeof Auth !== 'undefined' && typeof Auth.showNotification === 'function') {
            Auth.showNotification(`Ordine #${orderId} accettato`);
        }
    },

    // Segna ordine come pronto
    markOrderReady(orderId) {
        console.log(`📦 Marking order #${orderId} as ready`);
        
        const orderIdStr = String(orderId);
        const order = this.orders.find(o => String(o.id) === orderIdStr);
        if (!order) {
            console.error(`❌ Order #${orderId} not found`);
            return;
        }

        order.status = 'ready';
        order.readyAt = new Date().toISOString();
        
        // Aggiorna nel database con gestione errori
        try {
            Database.updateOrder(orderId, { status: 'ready', readyAt: order.readyAt });
            console.log(`✅ Order #${orderId} marked as ready in database`);
        } catch (error) {
            console.error(`❌ Error updating order #${orderId}:`, error);
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.error('Errore Database', `Impossibile aggiornare l'ordine #${orderId}`);
            }
            return;
        }
        
        this.updateOrdersDisplay();

        // Invia notifica al cliente
        if (order.customerId) {
            const title = '📦 Ordine Pronto';
            const message = `Il tuo ordine #${orderId} è pronto per il ritiro o la consegna.`;
            
            console.log(`📤 Sending ready notification to customer ${order.customerId}`);
            try {
                Database.createNotification({
                    id: Date.now(),
                    userId: order.customerId,
                    type: 'order_ready',
                    title: title,
                    message: message,
                    relatedId: orderId,
                    createdAt: new Date().toISOString(),
                    read: false
                });
            } catch (error) {
                console.warn('⚠️ Error creating notification:', error);
            }
        }

        // Mostra notifica di successo
        if (typeof pharmacyNotificationManager !== 'undefined') {
            pharmacyNotificationManager.success('Ordine Pronto', `Ordine #${orderId} è pronto per la consegna`);
        } else if (typeof Auth !== 'undefined' && typeof Auth.showNotification === 'function') {
            Auth.showNotification(`Ordine #${orderId} pronto`);
        }
    },

    // Completa un ordine
    completeOrder(orderId) {
        console.log(`✅ Completing order #${orderId}`);
        
        const orderIdStr = String(orderId);
        const order = this.orders.find(o => String(o.id) === orderIdStr);
        if (!order) {
            console.error(`❌ Order #${orderId} not found`);
            return;
        }

        order.status = 'delivered';
        order.completedAt = new Date().toISOString();
        
        // Aggiorna nel database con gestione errori
        try {
            Database.updateOrder(orderId, { status: 'delivered', completedAt: order.completedAt });
            console.log(`✅ Order #${orderId} marked as delivered in database`);
        } catch (error) {
            console.error(`❌ Error updating order #${orderId}:`, error);
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.error('Errore Database', `Impossibile aggiornare l'ordine #${orderId}`);
            }
            return;
        }
        
        this.updateOrdersDisplay();

        // Invia notifica al cliente
        if (order.customerId) {
            const title = '🚚 Ordine Consegnato';
            const message = `Il tuo ordine #${orderId} è stato consegnato con successo.`;
            
            console.log(`📤 Sending delivery notification to customer ${order.customerId}`);
            try {
                Database.createNotification({
                    id: Date.now(),
                    userId: order.customerId,
                    type: 'order_delivered',
                    title: title,
                    message: message,
                    relatedId: orderId,
                    createdAt: new Date().toISOString(),
                    read: false
                });
            } catch (error) {
                console.warn('⚠️ Error creating notification:', error);
            }
        }

        // Mostra notifica di successo
        if (typeof pharmacyNotificationManager !== 'undefined') {
            pharmacyNotificationManager.success('Ordine Consegnato', `Ordine #${orderId} consegnato con successo`);
        } else if (typeof Auth !== 'undefined' && typeof Auth.showNotification === 'function') {
            Auth.showNotification(`Ordine #${orderId} consegnato`);
        }
    },

    // Mostra modal per rifiutare un ordine
    showRejectModal(orderId) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4">Rifiuta Ordine #${orderId}</h3>
                <form id="reject-order-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Motivo del rifiuto</label>
                        <select id="reject-reason" required
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                            <option value="">Seleziona motivo</option>
                            <option value="unavailable">Prodotti non disponibili</option>
                            <option value="delivery_area">Fuori zona di consegna</option>
                            <option value="technical">Problemi tecnici</option>
                            <option value="other">Altro</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Note aggiuntive</label>
                        <textarea id="reject-notes" rows="3" placeholder="Dettagli aggiuntivi (opzionale)"
                                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">
                            Annulla
                        </button>
                        <button type="submit" class="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition">
                            Rifiuta Ordine
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('reject-order-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.rejectOrder(orderId);
            modal.remove();
        });
    },

    // Rifiuta un ordine
    rejectOrder(orderId) {
        const reason = document.getElementById('reject-reason')?.value || 'unknown';
        const notes = document.getElementById('reject-notes')?.value || '';
        
        console.log(`❌ Rejecting order #${orderId} - Reason: ${reason}`);
        
        const orderIdStr = String(orderId);
        const order = this.orders.find(o => String(o.id) === orderIdStr);
        if (!order) {
            console.error(`❌ Order #${orderId} not found`);
            return;
        }

        // Release stock if order was previously accepted
        if (order.status === 'accepted' || order.status === 'preparing' || order.status === 'ready') {
            if (order.items && order.items.length > 0) {
                try {
                    const stockRelease = Database.releaseStock(order.items);
                    if (stockRelease.success) {
                        console.log(`📦 Stock released for cancelled order #${orderId}:`, stockRelease.stockChanges);
                    } else {
                        console.warn(`⚠️ Some issues releasing stock for order #${orderId}:`, stockRelease.errors);
                    }
                } catch (error) {
                    console.error(`❌ Error releasing stock for order #${orderId}:`, error);
                }
            }
        }

        order.status = 'cancelled';
        order.rejectedAt = new Date().toISOString();
        order.rejectionReason = reason;
        order.rejectionNotes = notes;
        
        // Aggiorna nel database con gestione errori
        try {
            Database.updateOrder(orderId, { 
                status: 'cancelled', 
                rejectedAt: order.rejectedAt,
                rejectionReason: reason,
                rejectionNotes: notes
            });
            console.log(`✅ Order #${orderId} rejected in database`);
        } catch (error) {
            console.error(`❌ Error updating order #${orderId}:`, error);
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.error('Errore Database', `Impossibile rifiutare l'ordine #${orderId}`);
            }
            return;
        }
        
        this.updateOrdersDisplay();
        
        // Reload products to reflect stock changes
        this.loadProducts();

        // Invia notifica al cliente
        if (order.customerId) {
            const title = '❌ Ordine Rifiutato';
            const message = `Il tuo ordine #${orderId} è stato rifiutato. Motivo: ${this.getRejectReasonText(reason)}${notes ? `. Note: ${notes}` : ''}`;
            
            console.log(`📤 Sending rejection notification to customer ${order.customerId}`);
            try {
                Database.createNotification({
                    id: Date.now(),
                    userId: order.customerId,
                    type: 'order_cancelled',
                    title: title,
                    message: message,
                    relatedId: orderId,
                    createdAt: new Date().toISOString(),
                    read: false
                });
            } catch (error) {
                console.warn('⚠️ Error creating notification:', error);
            }
        }

        // Mostra notifica di successo
        if (typeof pharmacyNotificationManager !== 'undefined') {
            pharmacyNotificationManager.warning('Ordine Rifiutato', `Ordine #${orderId} rifiutato`);
        } else if (typeof Auth !== 'undefined' && typeof Auth.showNotification === 'function') {
            Auth.showNotification(`Ordine #${orderId} rifiutato`);
        }
    },

    // Testo del motivo di rifiuto
    getRejectReasonText(reason) {
        const texts = {
            'unavailable': 'Prodotti non disponibili',
            'delivery_area': 'Fuori zona di consegna',
            'technical': 'Problemi tecnici',
            'other': 'Altro'
        };
        return texts[reason] || reason;
    },

    // Carica e visualizza i prodotti della farmacia corrente
    loadProducts() {
        console.log('💊 Loading pharmacy products...');
        
        const productsContainer = document.getElementById('pharmacy-products-list');
        if (!productsContainer) {
            console.warn('⚠️ Products list container not found');
            return;
        }

        // Reload products with current pharmacy ID filter
        if (!this.currentPharmacy) {
            console.warn('⚠️ No current pharmacy set');
            return;
        }

        const pharmacyId = this.currentPharmacy.pharmacyId || this.currentPharmacy.id;
        
        try {
            // Get all products directly from eudora_products and filter by current pharmacy ID
            const allProducts = Database.get(Database.keys.products) || [];
            
            // Ensure all products have isActive field with default value
            allProducts.forEach(product => {
                if (product.isActive === undefined) {
                    product.isActive = true; // Default to active for existing products
                }
            });
            
            // Save back to database with updated isActive fields
            Database.set(Database.keys.products, allProducts);
            
            this.products = allProducts.filter(product => 
                product.isActive !== false && (
                    product.pharmacyId === pharmacyId || 
                    product.pharmacyId === this.currentPharmacy.id
                )
            );
            
            console.log(`💊 Loaded ${this.products.length} products for pharmacy ${pharmacyId} from eudora_products`);
        } catch (error) {
            console.warn('⚠️ Error loading pharmacy products:', error.message);
            this.products = [];
        }
        
        if (this.products.length === 0) {
            productsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-pills text-4xl mb-3"></i>
                    <p>Nessun prodotto nel catalogo</p>
                    <p class="text-sm mt-2">Pharmacy ID: ${pharmacyId}</p>
                </div>
            `;
            return;
        }
        
        productsContainer.innerHTML = this.products.map(product => `
            <div class="bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 ${this.getProductBorderColor(product)}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="font-semibold text-lg">${product.name}</h3>
                        <p class="text-gray-600">${product.categoryName || product.category || 'Categoria non specificata'}</p>
                        <p class="text-gray-600 text-sm">${product.description || 'Nessuna descrizione'}</p>
                        ${product.pharmacyName ? `<p class="text-blue-600 text-sm mt-1"><i class="fas fa-clinic-medical mr-1"></i>${product.pharmacyName}</p>` : ''}
                    </div>
                    <div class="text-right">
                        <div class="text-lg font-bold">€${product.price.toFixed(2)}</div>
                        <div class="text-sm ${this.getProductStatusColor(product)}">
                            ${this.getProductStatusText(product)}
                        </div>
                    </div>
                </div>
                
                <!-- Product Details Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                        <span class="text-gray-500 block">SKU:</span>
                        <span class="font-medium">${product.sku || product.id}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 block">Stock:</span>
                        <span class="font-medium">${product.stock || 0} pz</span>
                    </div>
                    <div>
                        <span class="text-gray-500 block">Produttore:</span>
                        <span class="font-medium">${product.manufacturer || 'N/A'}</span>
                    </div>
                    <div>
                        <span class="text-gray-500 block">Scadenza:</span>
                        <span class="font-medium">${product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('it-IT') : 'N/A'}</span>
                    </div>
                </div>
                
                <!-- Product Tags -->
                <div class="flex flex-wrap gap-2 mb-4">
                    ${product.requiresPrescription ? '<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Ricetta richiesta</span>' : ''}
                    ${this.getProductStatusTag(product)}
                    ${product.category ? `<span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">${product.category}</span>` : ''}
                </div>
                
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500">
                        <span>ID: ${product.id}</span>
                        ${product.batchNumber ? ` • Lotto: ${product.batchNumber}` : ''}
                        ${product.pharmacyId ? ` • Pharmacy ID: ${product.pharmacyId}` : ''}
                    </div>
                    <div class="space-x-2">
                        <button onclick="Pharmacy.toggleProductStock('${product.id}')" 
                                class="bg-${this.getProductAvailability(product) ? 'red' : 'green'}-500 text-white px-3 py-1 rounded text-sm hover:bg-${this.getProductAvailability(product) ? 'red' : 'green'}-600 transition">
                            <i class="fas fa-${this.getProductAvailability(product) ? 'times' : 'check'} mr-1"></i> ${this.getProductAvailability(product) ? 'Disabilita' : 'Abilita'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Helper functions for product display
    getProductBorderColor(product) {
        if (product.isActive === false) {
            return 'border-gray-400';
        } else if (!this.getProductAvailability(product)) {
            return 'border-red-400';
        } else {
            return 'border-green-400';
        }
    },

    getProductStatusColor(product) {
        if (product.isActive === false) {
            return 'text-gray-600';
        } else if (!this.getProductAvailability(product)) {
            return 'text-red-600';
        } else {
            return 'text-green-600';
        }
    },

    getProductStatusText(product) {
        if (product.isActive === false) {
            return 'Inattivo';
        } else if (!this.getProductAvailability(product)) {
            return 'Esaurito';
        } else {
            return `Disponibile${product.stock ? ` (${product.stock})` : ''}`;
        }
    },

    getProductStatusTag(product) {
        if (product.isActive === false) {
            return '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Inattivo</span>';
        } else if (!this.getProductAvailability(product)) {
            return '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Esaurito</span>';
        } else {
            return '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Attivo</span>';
        }
    },

    getProductAvailability(product) {
        // Product is available if it's active AND has stock > 0
        // Convert to number to handle string values like "20"
        const stock = Number(product.stock) || 0;
        const isActive = product.isActive !== false; // Default to true if not specified
        const isAvailable = isActive && stock > 0;
        
        // Debug logging to understand availability logic
        console.log(`🔍 AVAILABILITY CHECK: ${product.name} - isActive: ${isActive}, original stock: ${product.stock} (${typeof product.stock}), converted stock: ${stock}, isAvailable: ${isAvailable}`);
        
        return isAvailable;
    },

    // Modifica il stock di un prodotto
    toggleProductStock(productId) {
        console.log(`🔄 Toggling stock for product: ${productId}`);
        
        const product = this.products.find(p => p.id === productId);
        if (!product) {
            console.error(`❌ Product #${productId} not found`);
            return;
        }
        
        // Toggle product availability
        const wasAvailable = this.getProductAvailability(product);
        
        if (wasAvailable) {
            // Disable product by setting stock to 0 and isActive to false
            product.stock = 0;
            product.isActive = false;
        } else {
            // Enable product by setting stock to a default value and isActive to true
            product.stock = 10; // Default stock
            product.isActive = true;
        }
        
        console.log(`📦 Product ${product.name} - was available: ${wasAvailable}, now available: ${this.getProductAvailability(product)}, isActive: ${product.isActive}`);
        
        // Aggiorna nel database con gestione errori
        try {
            Database.updateProduct(productId, { 
                stock: product.stock,
                isActive: product.isActive,
                updatedAt: new Date().toISOString()
            });
            console.log(`✅ Product #${productId} stock and isActive updated in database`);
        } catch (error) {
            console.error(`❌ Error updating product #${productId}:`, error);
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.error('Errore Database', `Impossibile aggiornare il prodotto #${productId}`);
            }
            return;
        }
        
        // Reload products to refresh display
        this.loadProducts();
        
        // Mostra notifica di successo
        if (typeof pharmacyNotificationManager !== 'undefined') {
            pharmacyNotificationManager.success(
                'Prodotto Aggiornato', 
                `Prodotto ${product.name} ${this.getProductAvailability(product) ? 'abilitato' : 'disabilitato'} con successo`
            );
        } else if (typeof Auth !== 'undefined' && typeof Auth.showNotification === 'function') {
            Auth.showNotification(`Prodotto ${this.getProductAvailability(product) ? 'abilitato' : 'disabilitato'}`);
        }
    },

    // Crea un nuovo prodotto per la farmacia
    createProduct(productData) {
        console.log(`💊 Creating new product for pharmacy`);
        
        // Verifica che l'utente sia una farmacia
        if (!this.currentPharmacy) {
            console.error('❌ No current pharmacy set');
            throw new Error('Nessuna farmacia attiva');
        }
        
        try {
            // Prepara i dati del prodotto
            const newProductData = {
                ...productData,
                // Aggiungi informazioni della farmacia
                pharmacyId: this.currentPharmacy.pharmacyId || this.currentPharmacy.id,
                pharmacyName: this.currentPharmacy.businessName || 
                             (this.currentPharmacy.firstName + ' ' + this.currentPharmacy.lastName),
                // Imposta il nome della categoria
                categoryName: this.getCategoryName(productData.category),
                // Imposta valori di default
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            // Converti i tipi se necessario
            if (newProductData.price) newProductData.price = parseFloat(newProductData.price);
            if (newProductData.stock) newProductData.stock = parseInt(newProductData.stock);
            if (newProductData.requiresPrescription !== undefined) {
                newProductData.requiresPrescription = Boolean(newProductData.requiresPrescription);
            }
            
            // Genera SKU se non fornito
            if (!newProductData.sku) {
                newProductData.sku = this.generateProductSku(newProductData.category, newProductData.name);
            }
            
            // Crea il prodotto nel database
            const newProduct = Database.createProduct(newProductData);
            
            console.log(`✅ Product created successfully: ${newProduct.name}`);
            
            // Ricarica i prodotti locali
            this.loadProducts();
            
            // Mostra notifica di successo
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.success(
                    'Prodotto Creato', 
                    `Il prodotto "${newProduct.name}" è stato creato con successo`
                );
            } else {
                console.log(`✅ Product "${newProduct.name}" created successfully`);
            }
            
            return newProduct;
            
        } catch (error) {
            console.error('❌ Error creating product:', error);
            
            // Mostra notifica di errore
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.error(
                    'Errore Creazione', 
                    'Errore durante la creazione del prodotto: ' + error.message
                );
            }
            
            throw error;
        }
    },

    // Genera SKU per un prodotto
    generateProductSku(category, productName) {
        const categoryCode = (category || 'GEN').substr(0, 3).toUpperCase();
        const nameCode = productName.replace(/[^a-zA-Z0-9]/g, '').substr(0, 5).toUpperCase();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${categoryCode}${nameCode}${random}`;
    },

    // Ottiene il nome della categoria dal codice
    getCategoryName(category) {
        const categories = {
            'analgesici': 'Analgesici e Antinfiammatori',
            'antibiotici': 'Antibiotici',
            'vitamine': 'Vitamine e Integratori',
            'cosmetica': 'Cosmetica e Igiene',
            'medicazioni': 'Medicazioni e Dispositivi',
            'cardiologia': 'Cardiologia',
            'dermatologia': 'Dermatologia',
            'gastroenterologia': 'Gastroenterologia',
            'neurologia': 'Neurologia',
            'pediatria': 'Pediatria',
            'respiratorio': 'Apparato Respiratorio',
            'urologia': 'Urologia',
            'altro': 'Altri Prodotti'
        };
        return categories[category] || category;
    },

    // Aggiorna un prodotto della farmacia
    updateProduct(productId, productData) {
        console.log(`💊 Updating product: ${productId}`, productData);
        
        // Verifica che l'utente sia una farmacia
        if (!this.currentPharmacy) {
            console.error('❌ No current pharmacy set');
            throw new Error('Nessuna farmacia attiva');
        }
        
        // Recupera il prodotto esistente
        const existingProduct = Database.getProductById(productId);
        if (!existingProduct) {
            console.error('❌ Product not found:', productId);
            throw new Error('Prodotto non trovato');
        }
        
        console.log('🔍 Existing product found:', existingProduct);
        
        // Verifica che il prodotto appartenga alla farmacia corrente
        const pharmacyId = this.currentPharmacy.pharmacyId || this.currentPharmacy.id;
        if (existingProduct.pharmacyId !== pharmacyId) {
            console.error('❌ Product does not belong to current pharmacy', {
                productPharmacyId: existingProduct.pharmacyId,
                currentPharmacyId: pharmacyId
            });
            throw new Error('Non hai i permessi per modificare questo prodotto');
        }
        
        try {
            // Prepara i dati di aggiornamento
            const updateData = {
                ...productData,
                // Mantieni le informazioni della farmacia
                pharmacyId: existingProduct.pharmacyId,
                pharmacyName: existingProduct.pharmacyName,
                // Aggiorna il nome della categoria se è stato cambiato
                categoryName: productData.category ? this.getCategoryName(productData.category) : existingProduct.categoryName,
                // Mantieni l'ID originale
                id: existingProduct.id,
                // Mantieni la data di creazione
                createdAt: existingProduct.createdAt,
                // Aggiorna il timestamp
                updatedAt: new Date().toISOString()
            };
            
            console.log('🔄 Update data prepared:', updateData);
            
            // Converti i tipi se necessario
            if (updateData.price) updateData.price = parseFloat(updateData.price);
            if (updateData.stock) updateData.stock = parseInt(updateData.stock);
            if (updateData.requiresPrescription !== undefined) {
                updateData.requiresPrescription = Boolean(updateData.requiresPrescription);
            }
            
            // Aggiorna il prodotto nel database
            console.log(`🔄 Calling Database.updateProduct with ID: ${productId}`);
            const updatedProduct = Database.updateProduct(productId, updateData);
            
            console.log(`✅ Product updated successfully:`, updatedProduct);
            
            // Ricarica i prodotti locali
            this.loadProducts();
            
            // Mostra notifica di successo
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.success(
                    'Prodotto Aggiornato', 
                    `Il prodotto "${updatedProduct.name}" è stato aggiornato con successo`
                );
            } else {
                console.log(`✅ Product "${updatedProduct.name}" updated successfully`);
            }
            
            return updatedProduct;
            
        } catch (error) {
            console.error('❌ Error updating product:', error);
            
            // Mostra notifica di errore
            if (typeof pharmacyNotificationManager !== 'undefined') {
                pharmacyNotificationManager.error(
                    'Errore Aggiornamento', 
                    'Errore durante l\'aggiornamento del prodotto: ' + error.message
                );
            }
            
            throw error;
        }
    },

    // Carica statistiche farmacia
    loadStats() {
        if (!this.currentPharmacy) return;
        
        const today = new Date();
        const todayOrders = this.orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate.toDateString() === today.toDateString();
        });
        
        const pendingOrders = this.orders.filter(order => order.status === 'pending');
        const totalRevenue = this.orders
            .filter(order => order.status === 'delivered')
            .reduce((sum, order) => sum + order.total, 0);
        
        const statsContainer = document.getElementById('pharmacy-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
                                <i class="fas fa-shopping-bag text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Ordini Oggi</p>
                                <p class="text-2xl font-semibold text-gray-900">${todayOrders.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
                                <i class="fas fa-clock text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">In Attesa</p>
                                <p class="text-2xl font-semibold text-gray-900">${pendingOrders.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-green-100 text-green-600">
                                <i class="fas fa-euro-sign text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Ricavi Totali</p>
                                <p class="text-2xl font-semibold text-gray-900">€${totalRevenue.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <div class="flex items-center">
                            <div class="p-3 rounded-full bg-purple-100 text-purple-600">
                                <i class="fas fa-pills text-xl"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Prodotti</p>
                                <p class="text-2xl font-semibold text-gray-900">${this.products.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }
};

// Esponi le funzioni Pharmacy globalmente
window.Pharmacy = Pharmacy;

console.log('🏥 Pharmacy module loaded');