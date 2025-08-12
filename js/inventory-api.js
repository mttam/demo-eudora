// filepath: js/inventory-api.js
// API semplificata per la gestione inventario di Eudora
// Fornisce funzioni di alto livello per l'integrazione con l'interfaccia utente

const EudoraInventoryAPI = {
    // Versione dell'API
    version: '1.0.0',
    
    // ===== ORDINI =====
    
    /**
     * Crea un nuovo ordine con gestione automatica dell'inventario
     * @param {Object} orderData - Dati dell'ordine
     * @returns {Promise<Object>} Risultato dell'operazione in formato JSON
     */
    async createOrder(orderData) {
        try {
            // Assicurati che InventoryManager sia inizializzato
            if (typeof InventoryManager !== 'undefined') {
                InventoryManager.init();
                const result = InventoryManager.createOrderWithInventory(orderData);
                
                // Formato JSON di risposta standardizzato
                return {
                    orderId: result.orderId,
                    orderNumber: result.orderNumber || null,
                    status: result.success ? 'success' : 'error',
                    stockChanges: result.stockChanges || [],
                    errors: result.errors || [],
                    timestamp: new Date().toISOString(),
                    message: result.success ? 'Ordine creato con successo' : 'Errore durante la creazione dell\'ordine'
                };
            } else {
                // Fallback al metodo database diretto
                const result = Database.createOrder(orderData);
                
                if (result.success) {
                    return {
                        orderId: result.orderId,
                        orderNumber: result.orderNumber,
                        status: 'success',
                        stockChanges: result.stockChanges || [],
                        errors: [],
                        timestamp: new Date().toISOString(),
                        message: 'Ordine creato con successo'
                    };
                } else {
                    return {
                        orderId: null,
                        status: 'error',
                        stockChanges: [],
                        errors: result.errors || ['Errore sconosciuto'],
                        timestamp: new Date().toISOString(),
                        message: 'Errore durante la creazione dell\'ordine'
                    };
                }
            }
        } catch (error) {
            console.error('❌ API Error - createOrder:', error);
            return {
                orderId: null,
                status: 'error',
                stockChanges: [],
                errors: [`Errore del sistema: ${error.message}`],
                timestamp: new Date().toISOString(),
                message: 'Errore critico del sistema'
            };
        }
    },

    /**
     * Cancella un ordine con rilascio automatico dello stock
     * @param {string} orderId - ID dell'ordine da cancellare
     * @param {string} reason - Motivo della cancellazione
     * @returns {Promise<Object>} Risultato dell'operazione in formato JSON
     */
    async cancelOrder(orderId, reason = 'Cancellato dall\'utente') {
        try {
            let result;
            
            if (typeof InventoryManager !== 'undefined') {
                InventoryManager.init();
                result = InventoryManager.cancelOrderWithInventory(orderId, reason);
            } else {
                result = Database.cancelOrder(orderId, reason);
            }
            
            return {
                orderId: orderId,
                status: result.success ? 'success' : 'error',
                stockChanges: result.stockChanges || [],
                errors: result.errors || [],
                timestamp: new Date().toISOString(),
                message: result.success ? 'Ordine cancellato con successo' : 'Errore durante la cancellazione dell\'ordine'
            };
            
        } catch (error) {
            console.error('❌ API Error - cancelOrder:', error);
            return {
                orderId: orderId,
                status: 'error',
                stockChanges: [],
                errors: [`Errore del sistema: ${error.message}`],
                timestamp: new Date().toISOString(),
                message: 'Errore critico del sistema'
            };
        }
    },

    /**
     * Simula un ordine per verificare la disponibilità
     * @param {Array} orderItems - Items dell'ordine da simulare
     * @returns {Promise<Object>} Risultato della simulazione
     */
    async simulateOrder(orderItems) {
        try {
            if (typeof InventoryManager !== 'undefined') {
                InventoryManager.init();
                const result = InventoryManager.simulateOrder(orderItems);
                
                return {
                    canProceed: result.canProceed,
                    status: result.canProceed ? 'success' : 'warning',
                    stockChecks: result.stockChecks || [],
                    errors: result.errors || [],
                    totalItemsRequested: result.totalItemsRequested || 0,
                    timestamp: new Date().toISOString(),
                    message: result.canProceed ? 'Ordine fattibile' : 'Ordine non fattibile per mancanza di stock'
                };
            } else {
                return {
                    canProceed: false,
                    status: 'error',
                    stockChecks: [],
                    errors: ['Sistema di inventario non disponibile'],
                    timestamp: new Date().toISOString(),
                    message: 'Sistema di inventario non disponibile'
                };
            }
        } catch (error) {
            console.error('❌ API Error - simulateOrder:', error);
            return {
                canProceed: false,
                status: 'error',
                stockChecks: [],
                errors: [`Errore del sistema: ${error.message}`],
                timestamp: new Date().toISOString(),
                message: 'Errore critico del sistema'
            };
        }
    },

    // ===== GESTIONE STOCK =====

    /**
     * Controlla la disponibilità di stock per specifici prodotti
     * @param {Array} items - Array di oggetti {productId, quantity}
     * @returns {Promise<Object>} Risultato del controllo stock
     */
    async checkStock(items) {
        try {
            if (typeof InventoryManager !== 'undefined') {
                InventoryManager.init();
                const result = InventoryManager.checkStockAvailability(items);
                
                return {
                    status: result.isAvailable ? 'success' : 'warning',
                    isAvailable: result.isAvailable,
                    stockChecks: result.stockChecks || [],
                    errors: result.errors || [],
                    totalItemsRequested: result.totalItemsRequested || 0,
                    timestamp: new Date().toISOString(),
                    message: result.isAvailable ? 'Stock disponibile' : 'Stock insufficiente per alcuni prodotti'
                };
            } else {
                return {
                    status: 'error',
                    isAvailable: false,
                    stockChecks: [],
                    errors: ['Sistema di inventario non disponibile'],
                    timestamp: new Date().toISOString(),
                    message: 'Sistema di inventario non disponibile'
                };
            }
        } catch (error) {
            console.error('❌ API Error - checkStock:', error);
            return {
                status: 'error',
                isAvailable: false,
                stockChecks: [],
                errors: [`Errore del sistema: ${error.message}`],
                timestamp: new Date().toISOString(),
                message: 'Errore critico del sistema'
            };
        }
    },

    /**
     * Ottieni un report completo dello stock
     * @param {Object} filters - Filtri opzionali (pharmacyId, status, lowStockThreshold)
     * @returns {Promise<Object>} Report dello stock
     */
    async getStockReport(filters = {}) {
        try {
            if (typeof InventoryManager !== 'undefined') {
                InventoryManager.init();
                const report = InventoryManager.getStockReport(filters);
                
                return {
                    status: 'success',
                    report: report,
                    timestamp: new Date().toISOString(),
                    message: 'Report stock generato con successo'
                };
            } else {
                // Fallback semplificato
                const products = Database.getProducts() || [];
                const simpleReport = {
                    totalProducts: products.length,
                    products: products.map(p => ({
                        id: p.id,
                        name: p.name,
                        stock: Number(p.stock) || 0,
                        isActive: p.isActive
                    })),
                    generatedAt: new Date().toISOString()
                };
                
                return {
                    status: 'success',
                    report: simpleReport,
                    timestamp: new Date().toISOString(),
                    message: 'Report stock semplificato generato'
                };
            }
        } catch (error) {
            console.error('❌ API Error - getStockReport:', error);
            return {
                status: 'error',
                report: null,
                timestamp: new Date().toISOString(),
                message: `Errore durante la generazione del report: ${error.message}`
            };
        }
    },

    // ===== STATISTICHE =====

    /**
     * Ottieni statistiche degli ordini per periodo
     * @param {Object} options - Opzioni (startDate, endDate)
     * @returns {Promise<Object>} Statistiche ordini
     */
    async getOrderStatistics(options = {}) {
        try {
            if (typeof InventoryManager !== 'undefined') {
                InventoryManager.init();
                const stats = InventoryManager.getOrderStatistics(options);
                
                return {
                    status: 'success',
                    statistics: stats,
                    timestamp: new Date().toISOString(),
                    message: 'Statistiche ordini generate con successo'
                };
            } else {
                // Fallback semplificato
                const orders = Database.getAllOrders() || [];
                const simpleStats = {
                    totalOrders: orders.length,
                    byStatus: orders.reduce((acc, order) => {
                        acc[order.status] = (acc[order.status] || 0) + 1;
                        return acc;
                    }, {}),
                    period: options
                };
                
                return {
                    status: 'success',
                    statistics: simpleStats,
                    timestamp: new Date().toISOString(),
                    message: 'Statistiche semplificate generate'
                };
            }
        } catch (error) {
            console.error('❌ API Error - getOrderStatistics:', error);
            return {
                status: 'error',
                statistics: null,
                timestamp: new Date().toISOString(),
                message: `Errore durante la generazione delle statistiche: ${error.message}`
            };
        }
    },

    // ===== UTILITÀ =====

    /**
     * Testa il sistema di inventario
     * @returns {Promise<Object>} Risultati dei test
     */
    async runInventoryTests() {
        try {
            if (typeof InventoryManager !== 'undefined') {
                InventoryManager.init();
                const testResults = InventoryManager.runInventoryTests();
                
                return {
                    status: testResults.passed === testResults.tests.length ? 'success' : 'warning',
                    testResults: testResults,
                    timestamp: new Date().toISOString(),
                    message: `Test completati: ${testResults.summary}`
                };
            } else {
                return {
                    status: 'error',
                    testResults: null,
                    timestamp: new Date().toISOString(),
                    message: 'Sistema di inventario non disponibile per i test'
                };
            }
        } catch (error) {
            console.error('❌ API Error - runInventoryTests:', error);
            return {
                status: 'error',
                testResults: null,
                timestamp: new Date().toISOString(),
                message: `Errore durante l'esecuzione dei test: ${error.message}`
            };
        }
    },

    /**
     * Debug dello stato del sistema inventario
     * @returns {Promise<Object>} Stato debug
     */
    async debugInventory() {
        try {
            if (typeof InventoryManager !== 'undefined') {
                InventoryManager.init();
                const debugInfo = InventoryManager.debugInventoryState();
                
                return {
                    status: 'success',
                    debugInfo: debugInfo,
                    timestamp: new Date().toISOString(),
                    message: 'Debug info generato con successo'
                };
            } else {
                const basicInfo = {
                    products: (Database.getProducts() || []).length,
                    orders: (Database.getAllOrders() || []).length
                };
                
                return {
                    status: 'warning',
                    debugInfo: basicInfo,
                    timestamp: new Date().toISOString(),
                    message: 'Debug info semplificato (InventoryManager non disponibile)'
                };
            }
        } catch (error) {
            console.error('❌ API Error - debugInventory:', error);
            return {
                status: 'error',
                debugInfo: null,
                timestamp: new Date().toISOString(),
                message: `Errore durante il debug: ${error.message}`
            };
        }
    },

    // ===== ESEMPI DI UTILIZZO =====

    /**
     * Esempio di creazione ordine
     * @returns {Promise<Object>} Risultato dell'esempio
     */
    async example_createOrder() {
        const products = Database.getProducts() || [];
        if (products.length === 0) {
            return {
                status: 'error',
                message: 'Nessun prodotto disponibile per l\'esempio',
                timestamp: new Date().toISOString()
            };
        }

        const exampleOrder = {
            customerId: 'customer_example',
            customerName: 'Mario Rossi',
            customerPhone: '+39 123 456 7890',
            pharmacyId: products[0].pharmacyId || 'pharmacy_1',
            items: [
                {
                    productId: products[0].id,
                    name: products[0].name,
                    price: products[0].price,
                    quantity: 2
                }
            ],
            total: products[0].price * 2,
            deliveryAddress: {
                street: 'Via Roma 123',
                city: 'Milano',
                zipCode: '20100'
            }
        };

        return await this.createOrder(exampleOrder);
    },

    /**
     * Esempio di controllo stock
     * @returns {Promise<Object>} Risultato dell'esempio
     */
    async example_checkStock() {
        const products = Database.getProducts() || [];
        if (products.length === 0) {
            return {
                status: 'error',
                message: 'Nessun prodotto disponibile per l\'esempio',
                timestamp: new Date().toISOString()
            };
        }

        const itemsToCheck = [
            {
                productId: products[0].id,
                quantity: 1
            }
        ];

        return await this.checkStock(itemsToCheck);
    }
};

// Esponi l'API globalmente
window.EudoraInventoryAPI = EudoraInventoryAPI;

// Alias più corto per comodità
window.InventoryAPI = EudoraInventoryAPI;

console.log('📦 Eudora Inventory API loaded');
