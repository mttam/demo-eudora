// Admin module - gestisce prodotti, ordini e utenti per l'admin
const Admin = {
    products: [],
    orders: [],
    pharmacies: [],
    customers: [],
    riders: [],
    currentAdmin: null,
    currentPage: 1,
    itemsPerPage: 10,

    // Inizializza il modulo Admin
    init() {
        console.log('👑 Initializing Admin module...');
        
        // Wait for Database to be ready
        if (typeof Database === 'undefined') {
            console.warn('⚠️ Database not ready, waiting...');
            setTimeout(() => this.init(), 500);
            return;
        }
        
        this.loadData();
        this.setupEventListeners();
    },

    // Carica tutti i dati necessari
    loadData() {
        if (!EudoraApp.currentUser || EudoraApp.currentUser.role !== 'admin') {
            console.warn('❌ Admin access required');
            return;
        }

        this.currentAdmin = EudoraApp.currentUser;
        console.log('👑 Current admin loaded:', this.currentAdmin.firstName, this.currentAdmin.lastName);

        // Check if Database is available
        if (typeof Database === 'undefined') {
            console.error('❌ Database module not available');
            return;
        }

        // Carica tutti i dati
        this.loadProducts();
        this.loadOrders();
        this.loadUsers();
        this.updateAdminStats();
    },

    // ===== PRODUCT MANAGEMENT =====
    
    // Carica tutti i prodotti dal database
    loadProducts() {
        console.log('📦 Loading all products from eudora_products...');
        
        try {
            const products = Database.getAllProductsIncludingInactive() || [];
            this.products = products;
            console.log(`📦 Loaded ${this.products.length} products`);
            this.updateProductsDisplay();
        } catch (error) {
            console.error('❌ Error loading products:', error);
            this.products = [];
        }
    },

    // Aggiorna la visualizzazione dei prodotti
    updateProductsDisplay() {
        const productsContainer = document.getElementById('admin-products-list');
        if (!productsContainer) return;

        if (this.products.length === 0) {
            productsContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-box-open text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Nessun prodotto trovato</p>
                </div>
            `;
            return;
        }

        // Paginazione
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedProducts = this.products.slice(startIndex, endIndex);

        productsContainer.innerHTML = `
            <div class="space-y-4">
                ${paginatedProducts.map(product => this.generateProductCard(product)).join('')}
            </div>
            
            <!-- Pagination -->
            <div class="mt-6 flex justify-between items-center">
                <div class="text-sm text-gray-700">
                    Mostrando ${startIndex + 1}-${Math.min(endIndex, this.products.length)} di ${this.products.length} prodotti
                </div>
                <div class="flex space-x-2">
                    <button onclick="Admin.previousPage()" 
                            class="px-3 py-1 bg-gray-300 text-gray-700 rounded ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'}"
                            ${this.currentPage === 1 ? 'disabled' : ''}>
                        Precedente
                    </button>
                    <span class="px-3 py-1 bg-blue-500 text-white rounded">
                        ${this.currentPage}
                    </span>
                    <button onclick="Admin.nextPage()" 
                            class="px-3 py-1 bg-gray-300 text-gray-700 rounded ${endIndex >= this.products.length ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-400'}"
                            ${endIndex >= this.products.length ? 'disabled' : ''}>
                        Successiva
                    </button>
                </div>
            </div>
        `;
    },

    // Genera la card di un prodotto
    generateProductCard(product) {
        const pharmacy = this.pharmacies.find(p => p.id === product.pharmacyId);
        const pharmacyName = pharmacy ? pharmacy.name || `${pharmacy.firstName} ${pharmacy.lastName}` : 'Farmacia non trovata';
        
        return `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 ${this.getProductBorderColor(product)}">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="font-semibold text-lg">${product.name}</h3>
                            ${this.getProductStatusTag(product)}
                            ${product.requiresPrescription ? '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Ricetta</span>' : ''}
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <p><i class="fas fa-clinic-medical mr-2"></i><strong>Farmacia:</strong> ${pharmacyName}</p>
                                <p><i class="fas fa-tag mr-2"></i><strong>Categoria:</strong> ${this.getCategoryName(product.category)}</p>
                                <p><i class="fas fa-barcode mr-2"></i><strong>SKU:</strong> ${product.sku || 'N/A'}</p>
                            </div>
                            <div>
                                <p><i class="fas fa-boxes mr-2"></i><strong>Stock:</strong> ${product.stock} pz</p>
                                <p><i class="fas fa-euro-sign mr-2"></i><strong>Prezzo:</strong> €${product.price.toFixed(2)}</p>
                                <p><i class="fas fa-calendar mr-2"></i><strong>Aggiunto:</strong> ${new Date(product.createdAt).toLocaleDateString('it-IT')}</p>
                            </div>
                        </div>

                        ${product.description ? `
                            <div class="mt-3 p-3 bg-gray-50 rounded">
                                <p class="text-sm">${product.description}</p>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="ml-4 flex flex-col space-y-2">
                        <button onclick="Admin.editProduct('${product.id}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition">
                            <i class="fas fa-edit mr-1"></i> Modifica
                        </button>
                        <button onclick="Admin.toggleProductStatus('${product.id}')" 
                                class="px-3 py-1 ${product.isActive ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded text-sm transition">
                            <i class="fas fa-${product.isActive ? 'pause' : 'play'} mr-1"></i> 
                            ${product.isActive ? 'Disabilita' : 'Abilita'}
                        </button>
                        <button onclick="Admin.deleteProduct('${product.id}')" 
                                class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition">
                            <i class="fas fa-trash mr-1"></i> Elimina
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Helper functions per prodotti
    getProductBorderColor(product) {
        if (!product.isActive) return 'border-gray-400';
        if (product.stock <= (product.minStock || 5)) return 'border-red-400';
        if (product.stock <= (product.lowStockThreshold || 10)) return 'border-yellow-400';
        return 'border-green-400';
    },

    getProductStatusTag(product) {
        if (!product.isActive) {
            return '<span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Disabilitato</span>';
        }
        if (product.stock <= 0) {
            return '<span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Esaurito</span>';
        }
        if (product.stock <= (product.minStock || 5)) {
            return '<span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Stock basso</span>';
        }
        return '<span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Disponibile</span>';
    },

    getCategoryName(category) {
        const categories = {
            'prescription': 'Farmaci da prescrizione',
            'otc': 'Farmaci da banco',
            'supplements': 'Integratori',
            'medical_devices': 'Dispositivi medici',
            'cosmetics': 'Cosmetici',
            'baby_care': 'Cura del bambino',
            'other': 'Altro'
        };
        return categories[category] || category;
    },

    // Modifica prodotto
    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.showProductModal(product);
    },

    // Toggle stato prodotto
    toggleProductStatus(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const newStatus = !product.isActive;

        try {
            Database.updateProduct(productId, { isActive: newStatus });
            product.isActive = newStatus; // Update local copy
            this.updateProductsDisplay();
            
            if (typeof adminNotificationManager !== 'undefined') {
                adminNotificationManager.showNotification(
                    'success',
                    'Prodotto aggiornato',
                    `Il prodotto è stato ${newStatus ? 'abilitato' : 'disabilitato'}`
                );
            }
        } catch (error) {
            console.error('❌ Error updating product:', error);
        }
    },

    // Elimina prodotto
    deleteProduct(productId) {
        if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return;

        try {
            Database.deleteProduct(productId);
            this.products = this.products.filter(p => p.id !== productId);
            this.updateProductsDisplay();
            
            if (typeof adminNotificationManager !== 'undefined') {
                adminNotificationManager.showNotification(
                    'success',
                    'Prodotto eliminato',
                    'Il prodotto è stato eliminato con successo'
                );
            }
        } catch (error) {
            console.error('❌ Error deleting product:', error);
        }
    },

    // ===== ORDER MANAGEMENT =====
    
    // Carica tutti gli ordini
    loadOrders() {
        console.log('📋 Loading all orders from eudora_orders...');
        
        try {
            const orders = Database.getAllOrders() || [];
            this.orders = orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            console.log(`📋 Loaded ${this.orders.length} orders`);
            this.updateOrdersDisplay();
        } catch (error) {
            console.error('❌ Error loading orders:', error);
            this.orders = [];
        }
    },

    // Aggiorna la visualizzazione degli ordini
    updateOrdersDisplay() {
        const ordersContainer = document.getElementById('admin-orders-list');
        if (!ordersContainer) return;

        if (this.orders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-receipt text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-500">Nessun ordine trovato</p>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = this.orders.map(order => this.generateOrderCard(order)).join('');
    },

    // Genera la card di un ordine
    generateOrderCard(order) {
        const customer = this.customers.find(c => c.id === order.customerId);
        const pharmacy = this.pharmacies.find(p => p.id === order.pharmacyId);
        const rider = this.riders.find(r => r.id === order.riderId);

        return `
            <div class="bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 ${this.getOrderBorderColor(order.status)}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="font-semibold text-lg">Ordine #${order.orderNumber || order.id}</h3>
                            <span class="px-3 py-1 rounded-full text-sm ${this.getOrderStatusClasses(order.status)}">
                                ${this.getOrderStatusText(order.status)}
                            </span>
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div>
                                <p><i class="fas fa-user mr-2"></i><strong>Cliente:</strong> ${customer ? `${customer.firstName} ${customer.lastName}` : order.customerName || 'N/A'}</p>
                                <p><i class="fas fa-phone mr-2"></i><strong>Telefono:</strong> ${order.customerPhone || 'N/A'}</p>
                            </div>
                            <div>
                                <p><i class="fas fa-clinic-medical mr-2"></i><strong>Farmacia:</strong> ${pharmacy ? pharmacy.name || `${pharmacy.firstName} ${pharmacy.lastName}` : order.pharmacyName || 'N/A'}</p>
                                <p><i class="fas fa-motorcycle mr-2"></i><strong>Rider:</strong> ${rider ? `${rider.firstName} ${rider.lastName}` : 'Non assegnato'}</p>
                            </div>
                            <div>
                                <p><i class="fas fa-map-marker-alt mr-2"></i><strong>Indirizzo:</strong> ${typeof order.deliveryAddress === 'string' ? order.deliveryAddress : (order.deliveryAddress?.street || 'N/A')}</p>
                                <p><i class="fas fa-clock mr-2"></i><strong>Creato:</strong> ${new Date(order.createdAt).toLocaleDateString('it-IT')} ${new Date(order.createdAt).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="text-right ml-4">
                        <div class="text-xl font-bold text-green-600 mb-2">€${order.total.toFixed(2)}</div>
                        <div class="text-sm text-gray-500">
                            ${order.items ? order.items.length : 0} articoli
                        </div>
                    </div>
                </div>

                <!-- Order Items Summary -->
                ${order.items && order.items.length > 0 ? `
                    <div class="bg-gray-50 rounded-lg p-3 mb-4">
                        <h4 class="font-medium mb-2 text-sm">Prodotti:</h4>
                        <div class="space-y-1">
                            ${order.items.slice(0, 3).map(item => `
                                <div class="flex justify-between text-sm">
                                    <span>${item.name} x${item.quantity}</span>
                                    <span>€${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            `).join('')}
                            ${order.items.length > 3 ? `<div class="text-xs text-gray-500">...e altri ${order.items.length - 3} prodotti</div>` : ''}
                        </div>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-2">
                    <button onclick="Admin.viewOrderDetails('${order.id}')" 
                            class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition">
                        <i class="fas fa-eye mr-1"></i> Dettagli
                    </button>
                    <button onclick="Admin.editOrder('${order.id}')" 
                            class="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition">
                        <i class="fas fa-edit mr-1"></i> Modifica
                    </button>
                    ${order.status !== 'cancelled' ? `
                        <button onclick="Admin.cancelOrder('${order.id}')" 
                                class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition">
                            <i class="fas fa-times mr-1"></i> Cancella
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    // Helper functions per ordini
    getOrderBorderColor(status) {
        const colors = {
            'pending': 'border-yellow-400',
            'accepted': 'border-blue-400',
            'preparing': 'border-blue-400',
            'ready': 'border-green-400',
            'picked_up': 'border-purple-400',
            'out_for_delivery': 'border-indigo-400',
            'delivered': 'border-gray-400',
            'cancelled': 'border-red-400'
        };
        return colors[status] || 'border-gray-300';
    },

    getOrderStatusClasses(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'accepted': 'bg-blue-100 text-blue-800',
            'preparing': 'bg-blue-100 text-blue-800',
            'ready': 'bg-green-100 text-green-800',
            'picked_up': 'bg-purple-100 text-purple-800',
            'out_for_delivery': 'bg-indigo-100 text-indigo-800',
            'delivered': 'bg-gray-100 text-gray-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    },

    getOrderStatusText(status) {
        const texts = {
            'pending': 'In Attesa',
            'accepted': 'Accettato',
            'preparing': 'In Preparazione',
            'ready': 'Pronto',
            'picked_up': 'Ritirato',
            'out_for_delivery': 'In Consegna',
            'delivered': 'Consegnato',
            'cancelled': 'Cancellato'
        };
        return texts[status] || status;
    },

    // Visualizza dettagli ordine
    viewOrderDetails(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Implementa modal con dettagli completi dell'ordine
        console.log('Order details:', order);
    },

    // Modifica ordine
    editOrder(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        // Implementa modal di modifica ordine
        console.log('Edit order:', order);
    },

    // Cancella ordine
    cancelOrder(orderId) {
        if (!confirm('Sei sicuro di voler cancellare questo ordine?')) return;

        try {
            Database.updateOrderStatus(orderId, 'cancelled');
            
            // Update local copy
            const order = this.orders.find(o => o.id === orderId);
            if (order) {
                order.status = 'cancelled';
                order.cancelledAt = new Date().toISOString();
            }
            
            this.updateOrdersDisplay();
            
            if (typeof adminNotificationManager !== 'undefined') {
                adminNotificationManager.showNotification(
                    'success',
                    'Ordine cancellato',
                    'L\'ordine è stato cancellato con successo'
                );
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
        }
    },

    // ===== USER MANAGEMENT =====
    
    // Carica tutti gli utenti
    loadUsers() {
        console.log('👥 Loading all users...');
        
        try {
            const users = Database.getAllUsers() || [];
            
            // Separa per ruolo
            this.pharmacies = users.filter(u => u.role === 'pharmacy');
            this.customers = users.filter(u => u.role === 'customer');
            this.riders = users.filter(u => u.role === 'rider');
            
            console.log(`👥 Loaded users: ${this.pharmacies.length} pharmacies, ${this.customers.length} customers, ${this.riders.length} riders`);
            
            this.updateUsersDisplay();
        } catch (error) {
            console.error('❌ Error loading users:', error);
            this.pharmacies = [];
            this.customers = [];
            this.riders = [];
        }
    },

    // Aggiorna la visualizzazione degli utenti
    updateUsersDisplay() {
        this.updatePharmaciesDisplay();
        this.updateCustomersDisplay();
        this.updateRidersDisplay();
    },

    // Aggiorna visualizzazione farmacie
    updatePharmaciesDisplay() {
        const container = document.getElementById('admin-pharmacies-list');
        if (!container) return;

        if (this.pharmacies.length === 0) {
            container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Nessuna farmacia trovata</p></div>';
            return;
        }

        container.innerHTML = this.pharmacies.map(pharmacy => this.generateUserCard(pharmacy, 'pharmacy')).join('');
    },

    // Aggiorna visualizzazione clienti
    updateCustomersDisplay() {
        const container = document.getElementById('admin-customers-list');
        if (!container) return;

        if (this.customers.length === 0) {
            container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Nessun cliente trovato</p></div>';
            return;
        }

        container.innerHTML = this.customers.map(customer => this.generateUserCard(customer, 'customer')).join('');
    },

    // Aggiorna visualizzazione rider
    updateRidersDisplay() {
        const container = document.getElementById('admin-riders-list');
        if (!container) return;

        if (this.riders.length === 0) {
            container.innerHTML = '<div class="text-center py-8"><p class="text-gray-500">Nessun rider trovato</p></div>';
            return;
        }

        container.innerHTML = this.riders.map(rider => this.generateUserCard(rider, 'rider')).join('');
    },

    // Genera card utente
    generateUserCard(user, type) {
        const typeConfig = {
            pharmacy: { icon: 'clinic-medical', color: 'green' },
            customer: { icon: 'user', color: 'blue' },
            rider: { icon: 'motorcycle', color: 'purple' }
        };

        const config = typeConfig[type];
        const isActive = user.isActive !== false;

        return `
            <div class="bg-white rounded-lg shadow-md p-6 border-l-4 border-${config.color}-400">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <i class="fas fa-${config.icon} text-${config.color}-500"></i>
                            <h3 class="font-semibold text-lg">${user.firstName} ${user.lastName}</h3>
                            <span class="px-2 py-1 rounded-full text-xs ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${isActive ? 'Attivo' : 'Inattivo'}
                            </span>
                        </div>
                        
                        <div class="space-y-1 text-sm text-gray-600">
                            <p><i class="fas fa-envelope mr-2"></i><strong>Email:</strong> ${user.email}</p>
                            <p><i class="fas fa-phone mr-2"></i><strong>Telefono:</strong> ${user.phone || 'N/A'}</p>
                            <p><i class="fas fa-map-marker-alt mr-2"></i><strong>Indirizzo:</strong> ${user.address || 'N/A'}</p>
                            <p><i class="fas fa-calendar mr-2"></i><strong>Registrato:</strong> ${new Date(user.createdAt).toLocaleDateString('it-IT')}</p>
                            
                            ${type === 'pharmacy' ? `
                                <p><i class="fas fa-store mr-2"></i><strong>Nome farmacia:</strong> ${user.name || 'N/A'}</p>
                                <p><i class="fas fa-id-card mr-2"></i><strong>Licenza:</strong> ${user.licenseNumber || 'N/A'}</p>
                            ` : ''}
                            
                            ${type === 'rider' ? `
                                <p><i class="fas fa-car mr-2"></i><strong>Veicolo:</strong> ${user.vehicle || 'N/A'}</p>
                                <p><i class="fas fa-id-card mr-2"></i><strong>Licenza:</strong> ${user.licenseNumber || 'N/A'}</p>
                                <p><i class="fas fa-star mr-2"></i><strong>Rating:</strong> ${user.rating || 'N/A'}/5</p>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="ml-4 flex flex-col space-y-2">
                        <button onclick="Admin.viewUser('${user.id}')" 
                                class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition">
                            <i class="fas fa-eye mr-1"></i> Visualizza
                        </button>
                        <button onclick="Admin.editUser('${user.id}')" 
                                class="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 transition">
                            <i class="fas fa-edit mr-1"></i> Modifica
                        </button>
                        <button onclick="Admin.toggleUserStatus('${user.id}')" 
                                class="px-3 py-1 ${isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'} text-white rounded text-sm transition">
                            <i class="fas fa-${isActive ? 'ban' : 'check'} mr-1"></i> 
                            ${isActive ? 'Disabilita' : 'Abilita'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Visualizza utente
    viewUser(userId) {
        const user = [...this.pharmacies, ...this.customers, ...this.riders].find(u => u.id === userId);
        if (!user) return;

        // Implementa modal con dettagli completi dell'utente
        console.log('User details:', user);
    },

    // Modifica utente
    editUser(userId) {
        const user = [...this.pharmacies, ...this.customers, ...this.riders].find(u => u.id === userId);
        if (!user) return;

        // Implementa modal di modifica utente
        console.log('Edit user:', user);
    },

    // Toggle stato utente
    toggleUserStatus(userId) {
        const user = [...this.pharmacies, ...this.customers, ...this.riders].find(u => u.id === userId);
        if (!user) return;

        const newStatus = !user.isActive;

        try {
            Database.updateUser(userId, { isActive: newStatus });
            user.isActive = newStatus; // Update local copy
            this.loadUsers(); // Ricarica per aggiornare la visualizzazione
            
            if (typeof adminNotificationManager !== 'undefined') {
                adminNotificationManager.showNotification(
                    'success',
                    'Utente aggiornato',
                    `L'utente è stato ${newStatus ? 'abilitato' : 'disabilitato'}`
                );
            }
        } catch (error) {
            console.error('❌ Error updating user status:', error);
        }
    },

    // ===== STATISTICS AND DASHBOARD =====
    
    // Aggiorna le statistiche dell'admin dashboard
    updateAdminStats() {
        // Aggiorna contatori principali
        this.updateStatElement('total-products', this.products.length);
        this.updateStatElement('total-orders', this.orders.length);
        this.updateStatElement('total-pharmacies', this.pharmacies.length);
        this.updateStatElement('total-riders', this.riders.length);

        // Statistiche avanzate
        const activeProducts = this.products.filter(p => p.isActive).length;
        const todayOrders = this.orders.filter(o => {
            const today = new Date().toDateString();
            return new Date(o.createdAt).toDateString() === today;
        }).length;
        const activeRiders = this.riders.filter(r => r.isActive).length;
        const totalRevenue = this.orders
            .filter(o => o.status === 'delivered')
            .reduce((sum, o) => sum + o.total, 0);

        this.updateStatElement('active-products', activeProducts);
        this.updateStatElement('today-orders', todayOrders);
        this.updateStatElement('active-riders', activeRiders);
        this.updateStatElement('total-revenue', `€${totalRevenue.toFixed(2)}`);
    },

    // Helper per aggiornare elementi statistici
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    },

    // ===== PAGINATION =====
    
    nextPage() {
        const maxPages = Math.ceil(this.products.length / this.itemsPerPage);
        if (this.currentPage < maxPages) {
            this.currentPage++;
            this.updateProductsDisplay();
        }
    },

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.updateProductsDisplay();
        }
    },

    // ===== EVENT LISTENERS =====
    
    setupEventListeners() {
        // Setup listeners per filtri, ricerche, etc.
        console.log('📡 Setting up admin event listeners...');
    },

    // ===== MODAL FUNCTIONS =====
    
    showProductModal(product = null) {
        // Implementa modal per aggiungere/modificare prodotto
        console.log('Product modal:', product);
    }
};

// Esponi le funzioni Admin globalmente
window.Admin = Admin;

// Notification manager per admin (se non esiste)
if (typeof adminNotificationManager === 'undefined') {
    window.adminNotificationManager = {
        showNotification: function(type, title, message) {
            console.log(`${type.toUpperCase()}: ${title} - ${message}`);
            // Fallback notification
            if (window.notificationManager) {
                window.notificationManager.show(type, title, message);
            } else if (window.dashboardNotificationManager) {
                window.dashboardNotificationManager.show(type, title, message);
            }
        }
    };
}

console.log('👑 Admin module loaded');
