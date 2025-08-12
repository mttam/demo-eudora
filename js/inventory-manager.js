// filepath: js/inventory-manager.js
// Sistema di gestione inventario per la piattaforma Eudora
// Gestisce stock dei prodotti, ordini e transazioni inventory

const InventoryManager = {
    // Versione del sistema di inventario
    version: '1.0.0',
    
    // Inizializza il sistema di inventario
    init() {
        console.log('📦 Initializing Inventory Management System...');
        this.validateDatabase();
        console.log('✅ Inventory Management System initialized');
    },

    // Valida che il database sia disponibile
    validateDatabase() {
        if (typeof Database === 'undefined') {
            throw new Error('Database module not available. Load database.js first.');
        }
        
        if (!Database.keys || !Database.keys.products || !Database.keys.orders) {
            throw new Error('Database keys not properly configured.');
        }
    },

    // ===== VALIDAZIONE ORDINI =====

    /**
     * Valida un ordine prima della creazione
     * @param {Object} orderData - Dati dell'ordine da validare
     * @returns {Object} Risultato della validazione
     */
    validateOrder(orderData) {
        const errors = [];
        
        // Controlla che ci siano items
        if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
            errors.push('Ordine vuoto: nessun prodotto specificato');
            return { isValid: false, errors };
        }

        // Valida ogni item
        for (let i = 0; i < orderData.items.length; i++) {
            const item = orderData.items[i];
            
            if (!item.productId) {
                errors.push(`Item ${i + 1}: Product ID mancante`);
            }
            
            if (!item.quantity || item.quantity <= 0) {
                errors.push(`Item ${i + 1}: Quantità non valida (${item.quantity})`);
            }
            
            if (typeof item.quantity !== 'number' && isNaN(Number(item.quantity))) {
                errors.push(`Item ${i + 1}: Quantità deve essere un numero`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // ===== GESTIONE STOCK =====

    /**
     * Controlla la disponibilità di stock per un ordine
     * @param {Array} orderItems - Array degli item dell'ordine
     * @returns {Object} Risultato del controllo stock
     */
    checkStockAvailability(orderItems) {
        const stockErrors = [];
        const stockChecks = [];

        for (const item of orderItems) {
            const product = Database.getProductByIdIncludingInactive(item.productId);
            
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
                hasStock: currentStock >= requestedQuantity,
                shortfall: Math.max(0, requestedQuantity - currentStock)
            });

            if (currentStock < requestedQuantity) {
                stockErrors.push(`Stock insufficiente per ${product.name}: richiesti ${requestedQuantity}, disponibili ${currentStock}`);
            }
        }

        return {
            isAvailable: stockErrors.length === 0,
            errors: stockErrors,
            stockChecks: stockChecks,
            totalItemsRequested: orderItems.reduce((sum, item) => sum + Number(item.quantity), 0)
        };
    },

    /**
     * Crea un ordine con gestione automatica dell'inventario
     * @param {Object} orderData - Dati dell'ordine
     * @returns {Object} Risultato della creazione ordine
     */
    createOrderWithInventory(orderData) {
        console.log('📦 Creazione ordine con gestione inventario avanzata...');
        
        try {
            // Fase 1: Validazione ordine
            const validation = this.validateOrder(orderData);
            if (!validation.isValid) {
                return {
                    success: false,
                    orderId: null,
                    status: 'error',
                    errors: validation.errors,
                    stockChanges: []
                };
            }

            // Fase 2: Controllo disponibilità stock
            const availability = this.checkStockAvailability(orderData.items);
            if (!availability.isAvailable) {
                return {
                    success: false,
                    orderId: null,
                    status: 'error',
                    errors: availability.errors,
                    stockChanges: [],
                    stockChecks: availability.stockChecks
                };
            }

            // Fase 3: Creazione ordine con riserva stock (usa il metodo del Database)
            const result = Database.createOrder(orderData);
            
            if (result.success) {
                console.log('✅ Ordine creato con successo:', result.orderNumber);
                return {
                    ...result,
                    stockChecks: availability.stockChecks
                };
            } else {
                return result;
            }

        } catch (error) {
            console.error('❌ Errore durante la creazione dell\'ordine:', error);
            return {
                success: false,
                orderId: null,
                status: 'error',
                errors: [`Errore del sistema: ${error.message}`],
                stockChanges: []
            };
        }
    },

    /**
     * Cancella un ordine con rilascio automatico dello stock
     * @param {string} orderId - ID dell'ordine da cancellare
     * @param {string} reason - Motivo della cancellazione
     * @returns {Object} Risultato della cancellazione
     */
    cancelOrderWithInventory(orderId, reason = 'Cancelled by user') {
        console.log(`❌ Cancellazione ordine con gestione inventario: ${orderId}`);
        
        try {
            const result = Database.cancelOrder(orderId, reason);
            
            if (result.success) {
                console.log('✅ Ordine cancellato con successo:', orderId);
            }
            
            return result;

        } catch (error) {
            console.error('❌ Errore durante la cancellazione dell\'ordine:', error);
            return {
                success: false,
                orderId: orderId,
                status: 'error',
                errors: [`Errore del sistema: ${error.message}`],
                stockChanges: []
            };
        }
    },

    // ===== UTILITÀ E REPORTING =====

    /**
     * Ottieni un report dello stock per tutti i prodotti
     * @param {Object} filters - Filtri opzionali
     * @returns {Object} Report dello stock
     */
    getStockReport(filters = {}) {
        const products = Database.getProducts() || [];
        const stockReport = {
            totalProducts: products.length,
            inStock: 0,
            lowStock: 0,
            outOfStock: 0,
            products: [],
            generatedAt: new Date().toISOString()
        };

        const lowStockThreshold = filters.lowStockThreshold || 5;

        for (const product of products) {
            const stock = Number(product.stock) || 0;
            const stockStatus = this.getStockStatus(stock, lowStockThreshold);
            
            const productReport = {
                id: product.id,
                name: product.name,
                stock: stock,
                status: stockStatus,
                category: product.category,
                pharmacyId: product.pharmacyId,
                pharmacyName: product.pharmacyName,
                price: product.price,
                isActive: product.isActive
            };

            stockReport.products.push(productReport);

            // Conteggi per categoria
            switch (stockStatus) {
                case 'in_stock':
                    stockReport.inStock++;
                    break;
                case 'low_stock':
                    stockReport.lowStock++;
                    break;
                case 'out_of_stock':
                    stockReport.outOfStock++;
                    break;
            }
        }

        // Filtri aggiuntivi
        if (filters.pharmacyId) {
            stockReport.products = stockReport.products.filter(p => p.pharmacyId === filters.pharmacyId);
        }

        if (filters.status) {
            stockReport.products = stockReport.products.filter(p => p.status === filters.status);
        }

        // Ordina per stock crescente (prima quelli con meno stock)
        stockReport.products.sort((a, b) => a.stock - b.stock);

        return stockReport;
    },

    /**
     * Determina lo status dello stock
     * @param {number} stock - Quantità in stock
     * @param {number} lowThreshold - Soglia per stock basso
     * @returns {string} Status dello stock
     */
    getStockStatus(stock, lowThreshold = 5) {
        if (stock <= 0) return 'out_of_stock';
        if (stock <= lowThreshold) return 'low_stock';
        return 'in_stock';
    },

    /**
     * Simula un ordine per verificare la disponibilità senza effettivamente crearlo
     * @param {Array} orderItems - Items dell'ordine da simulare
     * @returns {Object} Risultato della simulazione
     */
    simulateOrder(orderItems) {
        console.log('🎯 Simulazione ordine...');
        
        const validation = this.validateOrder({ items: orderItems });
        if (!validation.isValid) {
            return {
                canProceed: false,
                errors: validation.errors,
                stockChecks: []
            };
        }

        const availability = this.checkStockAvailability(orderItems);
        
        return {
            canProceed: availability.isAvailable,
            errors: availability.errors,
            stockChecks: availability.stockChecks,
            totalItemsRequested: availability.totalItemsRequested
        };
    },

    /**
     * Ottieni statistiche degli ordini per periodo
     * @param {Object} options - Opzioni per il periodo
     * @returns {Object} Statistiche ordini
     */
    getOrderStatistics(options = {}) {
        const orders = Database.getAllOrders() || [];
        const now = new Date();
        const startDate = options.startDate ? new Date(options.startDate) : new Date(now.setDate(now.getDate() - 30));
        const endDate = options.endDate ? new Date(options.endDate) : new Date();

        const periodOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startDate && orderDate <= endDate;
        });

        const stats = {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            },
            totalOrders: periodOrders.length,
            byStatus: {},
            totalRevenue: 0,
            averageOrderValue: 0,
            totalItemsSold: 0,
            stockImpact: []
        };

        // Conteggi per status
        const statusCounts = {};
        let totalRevenue = 0;
        let totalItems = 0;
        const productSales = {};

        for (const order of periodOrders) {
            // Status counts
            statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
            
            // Revenue (solo ordini consegnati)
            if (order.status === 'delivered') {
                totalRevenue += Number(order.total) || 0;
            }
            
            // Items venduti
            if (order.items) {
                for (const item of order.items) {
                    totalItems += Number(item.quantity) || 0;
                    
                    // Traccia vendite per prodotto
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = {
                            productId: item.productId,
                            productName: item.name,
                            quantitySold: 0,
                            revenue: 0
                        };
                    }
                    
                    if (order.status === 'delivered') {
                        productSales[item.productId].quantitySold += Number(item.quantity) || 0;
                        productSales[item.productId].revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
                    }
                }
            }
        }

        stats.byStatus = statusCounts;
        stats.totalRevenue = totalRevenue;
        stats.averageOrderValue = periodOrders.length > 0 ? totalRevenue / periodOrders.filter(o => o.status === 'delivered').length : 0;
        stats.totalItemsSold = totalItems;
        stats.stockImpact = Object.values(productSales).sort((a, b) => b.quantitySold - a.quantitySold);

        return stats;
    },

    // ===== METODI DI DEBUG E TESTING =====

    /**
     * Testa il sistema di inventario
     * @returns {Object} Risultati del test
     */
    runInventoryTests() {
        console.log('🧪 Eseguendo test del sistema inventario...');
        
        const testResults = {
            tests: [],
            passed: 0,
            failed: 0,
            summary: ''
        };

        // Test 1: Validazione ordine vuoto
        try {
            const result1 = this.validateOrder({ items: [] });
            testResults.tests.push({
                name: 'Validazione ordine vuoto',
                passed: !result1.isValid && result1.errors.length > 0,
                result: result1
            });
        } catch (error) {
            testResults.tests.push({
                name: 'Validazione ordine vuoto',
                passed: false,
                error: error.message
            });
        }

        // Test 2: Simulazione ordine con prodotti esistenti
        try {
            const products = Database.getProducts();
            if (products.length > 0) {
                const testItems = [{
                    productId: products[0].id,
                    quantity: 1
                }];
                
                const result2 = this.simulateOrder(testItems);
                testResults.tests.push({
                    name: 'Simulazione ordine valido',
                    passed: result2.canProceed !== undefined,
                    result: result2
                });
            }
        } catch (error) {
            testResults.tests.push({
                name: 'Simulazione ordine valido',
                passed: false,
                error: error.message
            });
        }

        // Test 3: Report stock
        try {
            const stockReport = this.getStockReport();
            testResults.tests.push({
                name: 'Generazione report stock',
                passed: stockReport.totalProducts !== undefined && Array.isArray(stockReport.products),
                result: stockReport
            });
        } catch (error) {
            testResults.tests.push({
                name: 'Generazione report stock',
                passed: false,
                error: error.message
            });
        }

        // Calcola risultati
        testResults.passed = testResults.tests.filter(t => t.passed).length;
        testResults.failed = testResults.tests.filter(t => !t.passed).length;
        testResults.summary = `${testResults.passed}/${testResults.tests.length} test passati`;

        console.log('🧪 Test completati:', testResults.summary);
        return testResults;
    },

    /**
     * Debug: mostra lo stato dell'inventario
     */
    debugInventoryState() {
        console.log('🔍 Debug dello stato inventario:');
        
        const products = Database.getProducts();
        const orders = Database.getAllOrders();
        
        console.log(`📦 Prodotti totali: ${products.length}`);
        console.log(`📋 Ordini totali: ${orders.length}`);
        
        const stockReport = this.getStockReport();
        console.log(`📊 Stock report:`, stockReport);
        
        const orderStats = this.getOrderStatistics();
        console.log(`📈 Statistiche ordini:`, orderStats);
        
        return {
            products: products.length,
            orders: orders.length,
            stockReport,
            orderStats
        };
    }
};

// Esponi InventoryManager globalmente
window.InventoryManager = InventoryManager;

console.log('📦 Inventory Manager module loaded');
