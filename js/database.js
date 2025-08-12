// filepath: js/database.js
// Sistema di database locale per gestire tutti i dati dell'applicazione

const Database = {
    // Versione del database per migrazioni future
    version: '1.0.0',
    
    // Chiavi per localStorage
    keys: {
        users: 'eudora_users',
        products: 'eudora_products',
        orders: 'eudora_orders',
        cart: 'eudora_cart',
        notifications: 'eudora_notifications',
        settings: 'eudora_settings',
        inventory: 'eudora_inventory'
    },

    init() {
        console.log('💾 Initializing Database System...');
        this.initializeDatabase();
        this.setupIndexes();
        console.log('✅ Database System initialized');
    },

    // Inizializza la struttura del database
    initializeDatabase() {
        // Inizializza le tabelle se non esistono
        if (!this.get(this.keys.users)) {
            this.set(this.keys.users, []);
        }
        if (!this.get(this.keys.products)) {
            this.set(this.keys.products, []);
        }
        if (!this.get(this.keys.orders)) {
            this.set(this.keys.orders, []);
        }
        if (!this.get(this.keys.cart)) {
            this.set(this.keys.cart, {});
        }
        if (!this.get(this.keys.notifications)) {
            this.set(this.keys.notifications, []);
        }
        if (!this.get(this.keys.inventory)) {
            this.set(this.keys.inventory, {});
        }
        if (!this.get(this.keys.settings)) {
            this.set(this.keys.settings, {
                version: this.version,
                initialized: new Date().toISOString()
            });
        }
    },

    // Setup degli indici per ricerche veloci
    setupIndexes() {
        this.indexes = {
            usersByEmail: new Map(),
            usersByRole: new Map(),
            ordersByStatus: new Map(),
            ordersByUser: new Map(),
            ordersByPharmacy: new Map(),
            productsByCategory: new Map()
        };
        this.rebuildIndexes();
    },

    // Ricostruisce gli indici
    rebuildIndexes() {
        console.log('🔄 Rebuilding database indexes...');
        
        // Clear existing indexes
        Object.values(this.indexes).forEach(index => index.clear());
        
        // Rebuild user indexes
        const users = this.get(this.keys.users) || [];
        users.forEach(user => {
            this.indexes.usersByEmail.set(user.email, user);
            
            // Use role, fallback to userType or type
            const userRole = user.role || user.userType || user.type;
            if (userRole) {
                if (!this.indexes.usersByRole.has(userRole)) {
                    this.indexes.usersByRole.set(userRole, []);
                }
                this.indexes.usersByRole.get(userRole).push(user);
            }
        });

        // Rebuild order indexes
        const orders = this.get(this.keys.orders) || [];
        orders.forEach(order => {
            // By status
            if (!this.indexes.ordersByStatus.has(order.status)) {
                this.indexes.ordersByStatus.set(order.status, []);
            }
            this.indexes.ordersByStatus.get(order.status).push(order);
            
            // By user
            if (!this.indexes.ordersByUser.has(order.customerId)) {
                this.indexes.ordersByUser.set(order.customerId, []);
            }
            this.indexes.ordersByUser.get(order.customerId).push(order);
            
            // By pharmacy
            if (order.pharmacyId) {
                if (!this.indexes.ordersByPharmacy.has(order.pharmacyId)) {
                    this.indexes.ordersByPharmacy.set(order.pharmacyId, []);
                }
                this.indexes.ordersByPharmacy.get(order.pharmacyId).push(order);
            }
        });

        // Rebuild product indexes
        const products = this.get(this.keys.products) || [];
        products.forEach(product => {
            if (!this.indexes.productsByCategory.has(product.category)) {
                this.indexes.productsByCategory.set(product.category, []);
            }
            this.indexes.productsByCategory.get(product.category).push(product);
        });
    },

    // ===== OPERAZIONI BASE =====
    
    // Salva dati in localStorage
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('❌ Error saving to localStorage:', error);
            return false;
        }
    },

    // Recupera dati da localStorage
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ Error reading from localStorage:', error);
            return null;
        }
    },

    // Genera ID univoco
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // ===== GESTIONE UTENTI =====

    // Crea nuovo utente
    createUser(userData) {
        const users = this.get(this.keys.users) || [];
        
        // Verifica se l'email esiste già
        if (this.getUserByEmail(userData.email)) {
            throw new Error('Email già registrata');
        }

        const user = {
            id: this.generateId(),
            ...userData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

        users.push(user);
        this.set(this.keys.users, users);
        this.rebuildIndexes();
        
        console.log('👤 User created:', user.email, user.role);
        return user;
    },

    // Recupera utente per email
    getUserByEmail(email) {
        // Assicurati che gli indici siano inizializzati
        if (!this.indexes || !this.indexes.usersByEmail) {
            console.log('Database indexes not found, initializing...');
            this.init();
        }
        return this.indexes.usersByEmail.get(email) || null;
    },

    // Recupera utente per ID
    getUserById(id) {
        const users = this.get(this.keys.users) || [];
        return users.find(user => user.id === id) || null;
    },

    // Recupera utenti per ruolo
    getUsersByRole(role) {
        // Returns users with addresses included
        const users = this.indexes.usersByRole.get(role) || [];
        return users.map(user => {
            return {
                ...user,
                addresses: user.addresses || (user.address ? [{ id: this.generateId(), address: user.address, isDefault: true }] : [])
            };
        });
    },

    // Alias per compatibilità
    getAllUsers() {
        return this.get(this.keys.users) || [];
    },

    // Aggiorna utente
    updateUser(userId, updates) {
        const users = this.get(this.keys.users) || [];
        const userIndex = users.findIndex(user => user.id === userId);
        
        if (userIndex === -1) {
            throw new Error('Utente non trovato');
        }

        users[userIndex] = {
            ...users[userIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.set(this.keys.users, users);
        this.rebuildIndexes();
        
        console.log('👤 User updated:', userId);
        return users[userIndex];
    },

    // Elimina utente (soft delete)
    deleteUser(userId) {
        return this.updateUser(userId, { isActive: false });
    },

    // ===== GESTIONE PRODOTTI =====

    // Crea nuovo prodotto
    createProduct(productData) {
        const products = this.get(this.keys.products) || [];
        
        const product = {
            id: this.generateId(),
            ...productData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true
        };

        products.push(product);
        this.set(this.keys.products, products);
        this.rebuildIndexes();
        
        console.log('💊 Product created:', product.name);
        return product;
    },

    // Recupera tutti i prodotti
    getProducts(filters = {}) {
        let products = this.get(this.keys.products) || [];
        
        // Filtra prodotti attivi
        products = products.filter(product => product.isActive);
        
        // Applica filtri
        if (filters.category) {
            products = products.filter(product => product.category === filters.category);
        }
        if (filters.pharmacyId) {
            products = products.filter(product => product.pharmacyId === filters.pharmacyId);
        }
        if (filters.inStock) {
            products = products.filter(product => product.stock > 0);
        }
        
        return products;
    },

    // Alias per compatibilità
    getAllProducts(filters = {}) {
        return this.getProducts(filters);
    },

    // Recupera TUTTI i prodotti (inclusi quelli inattivi) - per gestione admin
    getAllProductsIncludingInactive(filters = {}) {
        let products = this.get(this.keys.products) || [];
        
        // Applica filtri senza filtrare per isActive
        if (filters.category) {
            products = products.filter(product => product.category === filters.category);
        }
        if (filters.pharmacyId) {
            products = products.filter(product => product.pharmacyId === filters.pharmacyId);
        }
        if (filters.inStock) {
            products = products.filter(product => product.stock > 0);
        }
        
        return products;
    },

    // Recupera prodotto per ID (inclusi quelli inattivi) - per gestione admin
    getProductByIdIncludingInactive(id) {
        const products = this.get(this.keys.products) || [];
        return products.find(product => product.id === id) || null;
    },

    // Recupera prodotto per ID
    getProductById(id) {
        const products = this.get(this.keys.products) || [];
        return products.find(product => product.id === id && product.isActive) || null;
    },

    // Aggiorna prodotto
    updateProduct(productId, updates) {
        const products = this.get(this.keys.products) || [];
        const productIndex = products.findIndex(product => product.id === productId);
        
        if (productIndex === -1) {
            throw new Error('Prodotto non trovato');
        }

        products[productIndex] = {
            ...products[productIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.set(this.keys.products, products);
        this.rebuildIndexes();
        
        console.log('💊 Product updated:', productId);
        return products[productIndex];
    },

    // Aggiorna stock prodotto
    updateProductStock(productId, quantity) {
        const product = this.getProductById(productId);
        if (!product) {
            throw new Error('Prodotto non trovato');
        }

        return this.updateProduct(productId, { 
            stock: Math.max(0, product.stock + quantity) 
        });
    },

    // Elimina prodotto (soft delete)
    deleteProduct(productId) {
        return this.updateProduct(productId, { isActive: false });
    },

    // ===== GESTIONE INVENTARIO =====

    // Controlla se c'è stock sufficiente per tutti gli item dell'ordine
    checkStockAvailability(orderItems) {
        const stockErrors = [];
        const stockChecks = [];

        for (const item of orderItems) {
            const product = this.getProductByIdIncludingInactive(item.productId);
            
            if (!product) {
                stockErrors.push(`Prodotto ${item.productId} non trovato`);
                continue;
            }

            if (!product.isActive) {
                stockErrors.push(`Prodotto ${product.name} non è più disponibile`);
                continue;
            }

            const currentStock = Number(product.stock) || 0;
            const requestedQuantity = Number(item.quantity) || 0;

            stockChecks.push({
                productId: product.id,
                productName: product.name,
                currentStock: currentStock,
                requestedQuantity: requestedQuantity,
                hasStock: currentStock >= requestedQuantity
            });

            if (currentStock < requestedQuantity) {
                stockErrors.push(`Stock insufficiente per ${product.name}: richiesti ${requestedQuantity}, disponibili ${currentStock}`);
            }
        }

        return {
            isAvailable: stockErrors.length === 0,
            errors: stockErrors,
            stockChecks: stockChecks
        };
    },

    // Riserva stock per gli item dell'ordine (transazionale)
    reserveStock(orderItems) {
        const stockChanges = [];
        const errors = [];
        
        try {
            // Prima fase: verifica che tutto lo stock sia disponibile
            const availability = this.checkStockAvailability(orderItems);
            if (!availability.isAvailable) {
                return {
                    success: false,
                    errors: availability.errors,
                    stockChanges: []
                };
            }

            // Seconda fase: applica le modifiche allo stock
            const products = this.get(this.keys.products) || [];
            
            for (const item of orderItems) {
                const productIndex = products.findIndex(p => p.id === item.productId);
                if (productIndex === -1) continue;

                const product = products[productIndex];
                const oldStock = Number(product.stock) || 0;
                const newStock = oldStock - Number(item.quantity);

                // Aggiorna lo stock del prodotto
                products[productIndex].stock = newStock;
                products[productIndex].updatedAt = new Date().toISOString();

                stockChanges.push({
                    productId: product.id,
                    productName: product.name,
                    oldStock: oldStock,
                    newStock: newStock,
                    quantityReserved: Number(item.quantity)
                });

                console.log(`📦 Stock riservato per ${product.name}: ${oldStock} → ${newStock} (-${item.quantity})`);
            }

            // Salva le modifiche
            this.set(this.keys.products, products);
            this.rebuildIndexes();

            return {
                success: true,
                errors: [],
                stockChanges: stockChanges
            };

        } catch (error) {
            console.error('❌ Errore durante la riserva dello stock:', error);
            return {
                success: false,
                errors: [`Errore del sistema: ${error.message}`],
                stockChanges: []
            };
        }
    },

    // Rilascia stock per gli item dell'ordine (in caso di cancellazione)
    releaseStock(orderItems) {
        const stockChanges = [];
        const errors = [];
        
        try {
            const products = this.get(this.keys.products) || [];
            
            for (const item of orderItems) {
                const productIndex = products.findIndex(p => p.id === item.productId);
                if (productIndex === -1) {
                    errors.push(`Prodotto ${item.productId} non trovato per il rilascio dello stock`);
                    continue;
                }

                const product = products[productIndex];
                const oldStock = Number(product.stock) || 0;
                const newStock = oldStock + Number(item.quantity);

                // Ripristina lo stock del prodotto
                products[productIndex].stock = newStock;
                products[productIndex].updatedAt = new Date().toISOString();

                stockChanges.push({
                    productId: product.id,
                    productName: product.name,
                    oldStock: oldStock,
                    newStock: newStock,
                    quantityReleased: Number(item.quantity)
                });

                console.log(`🔄 Stock rilasciato per ${product.name}: ${oldStock} → ${newStock} (+${item.quantity})`);
            }

            // Salva le modifiche
            this.set(this.keys.products, products);
            this.rebuildIndexes();

            return {
                success: true,
                errors: errors,
                stockChanges: stockChanges
            };

        } catch (error) {
            console.error('❌ Errore durante il rilascio dello stock:', error);
            return {
                success: false,
                errors: [`Errore del sistema: ${error.message}`],
                stockChanges: []
            };
        }
    },

    // ===== GESTIONE ORDINI =====

    // Crea nuovo ordine con gestione inventario
    createOrder(orderData) {
        console.log('📦 Tentativo di creazione ordine con gestione inventario...');
        
        // Verifica che ci siano items nell'ordine
        if (!orderData.items || orderData.items.length === 0) {
            return {
                success: false,
                error: 'Ordine vuoto: nessun prodotto specificato',
                orderId: null,
                stockChanges: []
            };
        }

        // Riserva lo stock per tutti gli item
        const stockReservation = this.reserveStock(orderData.items);
        
        if (!stockReservation.success) {
            return {
                success: false,
                errors: stockReservation.errors,
                orderId: null,
                stockChanges: []
            };
        }

        try {
            // Crea l'ordine solo se la riserva dello stock è andata a buon fine
            const orders = this.get(this.keys.orders) || [];
            
            const order = {
                id: this.generateId(),
                orderNumber: this.generateOrderNumber(),
                status: 'pending',
                ...orderData,
                stockReserved: true,
                stockReservationTimestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            orders.push(order);
            this.set(this.keys.orders, orders);
            this.rebuildIndexes();
            
            console.log('✅ Ordine creato con successo:', order.orderNumber);
            console.log('📊 Modifiche allo stock:', stockReservation.stockChanges);

            return {
                success: true,
                orderId: order.id,
                orderNumber: order.orderNumber,
                status: 'success',
                stockChanges: stockReservation.stockChanges,
                errors: []
            };

        } catch (error) {
            // Se la creazione dell'ordine fallisce, rilascia lo stock riservato
            console.error('❌ Errore durante la creazione dell\'ordine:', error);
            this.releaseStock(orderData.items);
            
            return {
                success: false,
                errors: [`Errore durante la creazione dell'ordine: ${error.message}`],
                orderId: null,
                stockChanges: []
            };
        }
    },

    // Versione legacy del createOrder per compatibilità
    createOrderLegacy(orderData) {
        const orders = this.get(this.keys.orders) || [];
        
        const order = {
            id: this.generateId(),
            orderNumber: this.generateOrderNumber(),
            status: 'pending',
            ...orderData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        orders.push(order);
        this.set(this.keys.orders, orders);
        this.rebuildIndexes();
        
        console.log('📦 Order created (legacy mode):', order.orderNumber);
        return order;
    },

    // Genera numero ordine
    generateOrderNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().substr(2);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `ORD${year}${month}${day}${random}`;
    },

    // Recupera ordini per utente
    getOrdersByUser(userId) {
        return this.indexes.ordersByUser.get(userId) || [];
    },

    // Recupera ordini per farmacia
    getOrdersByPharmacy(pharmacyId) {
        return this.indexes.ordersByPharmacy.get(pharmacyId) || [];
    },

    // Recupera ordini per status
    getOrdersByStatus(status) {
        return this.indexes.ordersByStatus.get(status) || [];
    },

    // Alias per compatibilità
    getAllOrders() {
        return this.get(this.keys.orders) || [];
    },

    // Recupera ordine per ID
    getOrderById(id) {
        const orders = this.get(this.keys.orders) || [];
        return orders.find(order => order.id === id) || null;
    },

    // Aggiorna status ordine con gestione inventario
    updateOrderStatus(orderId, status, riderId = null) {
        const order = this.getOrderById(orderId);
        if (!order) {
            return {
                success: false,
                error: 'Ordine non trovato',
                orderId: orderId,
                stockChanges: []
            };
        }

        const updates = { 
            status,
            updatedAt: new Date().toISOString()
        };

        let stockChanges = [];

        // Aggiungi timestamp per stati specifici
        switch (status) {
            case 'accepted':
                updates.acceptedAt = new Date().toISOString();
                break;
            case 'preparing':
                updates.preparingAt = new Date().toISOString();
                break;
            case 'ready':
                updates.readyAt = new Date().toISOString();
                break;
            case 'picked_up':
                updates.pickedUpAt = new Date().toISOString();
                if (riderId) updates.riderId = riderId;
                break;
            case 'delivered':
                updates.deliveredAt = new Date().toISOString();
                break;
            case 'cancelled':
                updates.cancelledAt = new Date().toISOString();
                
                // Rilascia lo stock se l'ordine viene cancellato
                if (order.items && order.items.length > 0 && order.status !== 'cancelled') {
                    console.log('🔄 Rilascio stock per ordine cancellato:', orderId);
                    const stockRelease = this.releaseStock(order.items);
                    
                    if (stockRelease.success) {
                        stockChanges = stockRelease.stockChanges;
                        updates.stockReleased = true;
                        updates.stockReleaseTimestamp = new Date().toISOString();
                        console.log('✅ Stock rilasciato con successo per ordine cancellato');
                    } else {
                        console.warn('⚠️ Errore nel rilascio dello stock:', stockRelease.errors);
                        updates.stockReleaseErrors = stockRelease.errors;
                    }
                }
                break;
        }

        try {
            const updatedOrder = this.updateOrder(orderId, updates);
            
            return {
                success: true,
                orderId: orderId,
                status: 'success',
                newStatus: status,
                stockChanges: stockChanges,
                errors: []
            };
            
        } catch (error) {
            console.error('❌ Errore durante l\'aggiornamento dell\'ordine:', error);
            return {
                success: false,
                error: `Errore durante l'aggiornamento dell'ordine: ${error.message}`,
                orderId: orderId,
                stockChanges: []
            };
        }
    },

    // Versione legacy di updateOrderStatus per compatibilità
    updateOrderStatusLegacy(orderId, status, riderId = null) {
        const order = this.getOrderById(orderId);
        if (!order) {
            throw new Error('Ordine non trovato');
        }

        const updates = { 
            status,
            updatedAt: new Date().toISOString()
        };

        // Aggiungi timestamp per stati specifici
        switch (status) {
            case 'accepted':
                updates.acceptedAt = new Date().toISOString();
                break;
            case 'preparing':
                updates.preparingAt = new Date().toISOString();
                break;
            case 'ready':
                updates.readyAt = new Date().toISOString();
                break;
            case 'picked_up':
                updates.pickedUpAt = new Date().toISOString();
                if (riderId) updates.riderId = riderId;
                break;
            case 'delivered':
                updates.deliveredAt = new Date().toISOString();
                break;
            case 'cancelled':
                updates.cancelledAt = new Date().toISOString();
                break;
        }

        return this.updateOrder(orderId, updates);
    },

    // Cancella ordine con rilascio automatico dello stock
    cancelOrder(orderId, reason = 'Cancelled by user') {
        console.log(`❌ Tentativo di cancellazione ordine: ${orderId}`);
        
        const order = this.getOrderById(orderId);
        if (!order) {
            return {
                success: false,
                error: 'Ordine non trovato',
                orderId: orderId,
                stockChanges: []
            };
        }

        // Non permettere la cancellazione di ordini già consegnati
        if (order.status === 'delivered') {
            return {
                success: false,
                error: 'Non è possibile cancellare un ordine già consegnato',
                orderId: orderId,
                stockChanges: []
            };
        }

        // Non cancellare due volte lo stesso ordine
        if (order.status === 'cancelled') {
            return {
                success: false,
                error: 'Ordine già cancellato',
                orderId: orderId,
                stockChanges: []
            };
        }

        return this.updateOrderStatus(orderId, 'cancelled');
    },

    // Aggiorna ordine
    updateOrder(orderId, updates) {
        const orders = this.get(this.keys.orders) || [];
        const orderIndex = orders.findIndex(order => order.id === orderId);
        
        if (orderIndex === -1) {
            throw new Error('Ordine non trovato');
        }

        orders[orderIndex] = {
            ...orders[orderIndex],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        this.set(this.keys.orders, orders);
        this.rebuildIndexes();
        
        console.log('📦 Order updated:', orderId);
        return orders[orderIndex];
    },

    // ===== GESTIONE CARRELLO =====

    // Recupera carrello per utente
    getCart(userId) {
        const carts = this.get(this.keys.cart) || {};
        return carts[userId] || { items: [], total: 0 };
    },

    // Aggiorna carrello
    updateCart(userId, cart) {
        const carts = this.get(this.keys.cart) || {};
        carts[userId] = {
            ...cart,
            updatedAt: new Date().toISOString()
        };
        this.set(this.keys.cart, carts);
        
        console.log('🛒 Cart updated for user:', userId);
        return carts[userId];
    },

    // Aggiungi item al carrello
    addToCart(userId, productId, quantity = 1) {
        const cart = this.getCart(userId);
        const product = this.getProductById(productId);
        
        if (!product) {
            throw new Error('Prodotto non trovato');
        }

        const existingItem = cart.items.find(item => item.productId === productId);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                name: product.name,
                price: product.price,
                quantity,
                addedAt: new Date().toISOString()
            });
        }

        // Ricalcola totale
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return this.updateCart(userId, cart);
    },

    // Rimuovi item dal carrello
    removeFromCart(userId, productId) {
        const cart = this.getCart(userId);
        cart.items = cart.items.filter(item => item.productId !== productId);
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return this.updateCart(userId, cart);
    },

    // Svuota carrello
    clearCart(userId) {
        return this.updateCart(userId, { items: [], total: 0 });
    },

    // ===== GESTIONE NOTIFICHE =====

    // Crea notifica
    createNotification(notificationData) {
        const notifications = this.get(this.keys.notifications) || [];
        
        const notification = {
            id: this.generateId(),
            ...notificationData,
            isRead: false,
            createdAt: new Date().toISOString()
        };

        notifications.push(notification);
        this.set(this.keys.notifications, notifications);
        
        console.log('🔔 Notification created:', notification.type);
        return notification;
    },

    // Recupera notifiche per utente
    getNotifications(userId, unreadOnly = false) {
        const notifications = this.get(this.keys.notifications) || [];
        let userNotifications = notifications.filter(notif => 
            notif.userId === userId || notif.role === this.getUserById(userId)?.role
        );

        if (unreadOnly) {
            userNotifications = userNotifications.filter(notif => !notif.isRead);
        }

        return userNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    // Segna notifica come letta
    markNotificationAsRead(notificationId) {
        const notifications = this.get(this.keys.notifications) || [];
        const notification = notifications.find(notif => notif.id === notificationId);
        
        if (notification) {
            notification.isRead = true;
            notification.readAt = new Date().toISOString();
            this.set(this.keys.notifications, notifications);
        }
        
        return notification;
    },

    // ===== UTILITY E ADMIN =====

    // Recupera statistiche database
    getStats() {
        return {
            users: {
                total: (this.get(this.keys.users) || []).length,
                byRole: {
                    customer: this.getUsersByRole('customer').length,
                    pharmacy: this.getUsersByRole('pharmacy').length,
                    rider: this.getUsersByRole('rider').length,
                    admin: this.getUsersByRole('admin').length
                }
            },
            products: {
                total: (this.get(this.keys.products) || []).length,
                active: this.getProducts().length
            },
            orders: {
                total: (this.get(this.keys.orders) || []).length,
                byStatus: {
                    pending: this.getOrdersByStatus('pending').length,
                    accepted: this.getOrdersByStatus('accepted').length,
                    preparing: this.getOrdersByStatus('preparing').length,
                    ready: this.getOrdersByStatus('ready').length,
                    picked_up: this.getOrdersByStatus('picked_up').length,
                    delivered: this.getOrdersByStatus('delivered').length,
                    cancelled: this.getOrdersByStatus('cancelled').length
                }
            },
            notifications: {
                total: (this.get(this.keys.notifications) || []).length
            }
        };
    },

    // Reset completo database (solo per sviluppo)
    reset() {
        console.warn('⚠️ Resetting entire database...');
        Object.values(this.keys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeDatabase();
        this.rebuildIndexes();
        console.log('✅ Database reset complete');
    },

    // Export dati (per backup)
    export() {
        const data = {};
        Object.entries(this.keys).forEach(([name, key]) => {
            data[name] = this.get(key);
        });
        return data;
    },

    // Import dati (per restore)
    import(data) {
        console.log('📥 Importing database...');
        Object.entries(data).forEach(([name, value]) => {
            if (this.keys[name]) {
                this.set(this.keys[name], value);
            }
        });
        this.rebuildIndexes();
        console.log('✅ Database import complete');
    },

    // === USER ADDRESS METHODS ===
    
    // Ottieni tutti gli indirizzi di un utente
    getUserAddresses(userId) {
        const user = this.getUserById(userId);
        return user ? (user.addresses || []) : [];
    },

    // Aggiungi un indirizzo a un utente
    addUserAddress(userId, address) {
        const users = this.get(this.keys.users) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            console.error(`User ${userId} not found`);
            return false;
        }

        // Assicurati che l'utente abbia un array di indirizzi
        if (!users[userIndex].addresses) {
            users[userIndex].addresses = [];
        }

        // Aggiungi ID se non presente
        if (!address.id) {
            address.id = this.generateId();
        }

        // Se è il primo indirizzo, impostalo come default
        if (users[userIndex].addresses.length === 0) {
            address.isDefault = true;
        }

        // Se questo è impostato come default, rimuovi default dagli altri
        if (address.isDefault) {
            users[userIndex].addresses.forEach(addr => addr.isDefault = false);
        }

        users[userIndex].addresses.push(address);
        this.set(this.keys.users, users);
        this.rebuildIndexes();
        
        console.log(`✅ Address added for user ${userId}:`, address);
        return address;
    },

    // Rimuovi un indirizzo di un utente
    removeUserAddress(userId, addressId) {
        const users = this.get(this.keys.users) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;

        if (!users[userIndex].addresses) return false;

        const addressIndex = users[userIndex].addresses.findIndex(a => a.id === addressId);
        if (addressIndex === -1) return false;

        const removedAddress = users[userIndex].addresses[addressIndex];
        users[userIndex].addresses.splice(addressIndex, 1);

        // Se l'indirizzo rimosso era il default e ci sono altri indirizzi, 
        // imposta il primo come default
        if (removedAddress.isDefault && users[userIndex].addresses.length > 0) {
            users[userIndex].addresses[0].isDefault = true;
        }

        this.set(this.keys.users, users);
        this.rebuildIndexes();
        
        console.log(`✅ Address removed for user ${userId}:`, removedAddress);
        return true;
    },

    // === USER PAYMENT METHODS ===
    
    // Ottieni tutti i metodi di pagamento di un utente
    getUserPaymentMethods(userId) {
        const user = this.getUserById(userId);
        return user ? (user.paymentMethods || []) : [];
    },

    // Aggiungi un metodo di pagamento a un utente
    addUserPaymentMethod(userId, paymentMethod) {
        const users = this.get(this.keys.users) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) {
            console.error(`User ${userId} not found`);
            return false;
        }

        // Assicurati che l'utente abbia un array di metodi di pagamento
        if (!users[userIndex].paymentMethods) {
            users[userIndex].paymentMethods = [];
        }

        // Aggiungi ID se non presente
        if (!paymentMethod.id) {
            paymentMethod.id = this.generateId();
        }

        // Se è il primo metodo di pagamento, impostalo come default
        if (users[userIndex].paymentMethods.length === 0) {
            paymentMethod.isDefault = true;
        }

        // Se questo è impostato come default, rimuovi default dagli altri
        if (paymentMethod.isDefault) {
            users[userIndex].paymentMethods.forEach(pm => pm.isDefault = false);
        }

        users[userIndex].paymentMethods.push(paymentMethod);
        this.set(this.keys.users, users);
        this.rebuildIndexes();
        
        console.log(`✅ Payment method added for user ${userId}:`, paymentMethod);
        return paymentMethod;
    },

    // Rimuovi un metodo di pagamento di un utente
    removeUserPaymentMethod(userId, paymentMethodId) {
        const users = this.get(this.keys.users) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;

        if (!users[userIndex].paymentMethods) return false;

        const paymentIndex = users[userIndex].paymentMethods.findIndex(pm => pm.id === paymentMethodId);
        if (paymentIndex === -1) return false;

        const removedPayment = users[userIndex].paymentMethods[paymentIndex];
        users[userIndex].paymentMethods.splice(paymentIndex, 1);

        // Se il metodo rimosso era il default e ci sono altri metodi, 
        // imposta il primo come default
        if (removedPayment.isDefault && users[userIndex].paymentMethods.length > 0) {
            users[userIndex].paymentMethods[0].isDefault = true;
        }

        this.set(this.keys.users, users);
        this.rebuildIndexes();
        
        console.log(`✅ Payment method removed for user ${userId}:`, removedPayment);
        return true;
    },

    // Aggiorna un indirizzo utente
    updateUserAddress(userId, addressId, updatedAddress) {
        const users = this.get(this.keys.users) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;
        if (!users[userIndex].addresses) return false;

        const addressIndex = users[userIndex].addresses.findIndex(a => a.id === addressId);
        if (addressIndex === -1) return false;

        // Se questo viene impostato come default, rimuovi default dagli altri
        if (updatedAddress.isDefault) {
            users[userIndex].addresses.forEach(addr => addr.isDefault = false);
        }

        // Aggiorna l'indirizzo mantenendo l'ID
        users[userIndex].addresses[addressIndex] = { 
            ...users[userIndex].addresses[addressIndex], 
            ...updatedAddress,
            id: addressId 
        };

        this.set(this.keys.users, users);
        this.rebuildIndexes();
        
        console.log(`✅ Address updated for user ${userId}:`, users[userIndex].addresses[addressIndex]);
        return users[userIndex].addresses[addressIndex];
    },

    // Aggiorna un metodo di pagamento utente
    updateUserPaymentMethod(userId, paymentMethodId, updatedPaymentMethod) {
        const users = this.get(this.keys.users) || [];
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return false;
        if (!users[userIndex].paymentMethods) return false;

        const paymentIndex = users[userIndex].paymentMethods.findIndex(pm => pm.id === paymentMethodId);
        if (paymentIndex === -1) return false;

        // Se questo viene impostato come default, rimuovi default dagli altri
        if (updatedPaymentMethod.isDefault) {
            users[userIndex].paymentMethods.forEach(pm => pm.isDefault = false);
        }

        // Aggiorna il metodo di pagamento mantenendo l'ID
        users[userIndex].paymentMethods[paymentIndex] = { 
            ...users[userIndex].paymentMethods[paymentIndex], 
            ...updatedPaymentMethod,
            id: paymentMethodId 
        };

        this.set(this.keys.users, users);
        this.rebuildIndexes();
        
        console.log(`✅ Payment method updated for user ${userId}:`, users[userIndex].paymentMethods[paymentIndex]);
        return users[userIndex].paymentMethods[paymentIndex];
    },

    // === DEBUG METHODS ===
    
    // Debug: mostra i dati di un utente
    debugUser(userId) {
        const user = this.getUserById(userId);
        if (!user) {
            console.log(`❌ User ${userId} not found`);
            return;
        }
        
        console.log('👤 User Debug Info:');
        console.log('Basic Info:', {
            id: user.id,
            email: user.email,
            role: user.role,
            name: `${user.firstName} ${user.lastName}`
        });
        console.log('Addresses:', user.addresses || []);
        console.log('Payment Methods:', user.paymentMethods || []);
        console.log('Cart:', this.getCartItems(userId));
        console.log('Orders:', this.getUserOrders(userId));
    }
};

// Esponi Database globalmente
window.Database = Database;

console.log('💾 Database module loaded');
