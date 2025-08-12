    // Cambia lo stato attivo del rider e aggiorna il database
 
// filepath: js/rider.js
// Rider module - gestisce ordini e consegne per i rider

const Rider = {
    orders: [],
    filteredOrders: [],
    currentRider: null,
    currentMap: null,
    currentRoute: null,
    riderLocation: null,
    isActive: true,

    // Inizializza il modulo Rider
    init() {
        console.log('🚴 Initializing Rider module...');
        this.loadRiderData();
        this.loadOrders();
        this.updateStats();
        this.setupEventListeners();
        this.startLocationTracking();
    },

       toggleActiveStatus(isActive) {
        if (!this.currentRider || !this.currentRider.id) return;
        this.currentRider.isActive = isActive;
        if (typeof Database !== 'undefined' && typeof Database.updateUser === 'function') {
            Database.updateUser(this.currentRider.id, { isActive });
        }
        // Aggiorna anche lo user in localStorage e EudoraApp
        EudoraApp.currentUser.isActive = isActive;
        localStorage.setItem('currentUser', JSON.stringify(EudoraApp.currentUser));
        this.updateStats();
    },

    // Carica i dati del rider corrente
    loadRiderData() {
        // Check if user is logged in
        if (!EudoraApp.currentUser) {
            // Try to get saved user from localStorage
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    EudoraApp.currentUser = JSON.parse(savedUser);
                    console.log('👤 Restored user from localStorage:', EudoraApp.currentUser.email);
                } catch (error) {
                    console.error('❌ Error parsing saved user:', error);
                }
            }
            
            // If still no user, try to get first rider from database
            if (!EudoraApp.currentUser) {
                console.log('🚴 No user logged in, trying to load rider from database...');
                
                // Ensure database is initialized
                if (typeof Database !== 'undefined') {
                    const riders = Database.getUsersByRole('rider');
                    if (riders && riders.length > 0) {
                        this.currentRider = riders[0]; // Use first rider from database
                        EudoraApp.currentUser = this.currentRider;
                        localStorage.setItem('currentUser', JSON.stringify(this.currentRider));
                        console.log('✅ Database rider set as current user:', this.currentRider.email);
                    } else {
                        console.log('🚴 No riders found in database, creating test rider data');
                        this.currentRider = this.createTestRider();
                        EudoraApp.currentUser = this.currentRider;
                        localStorage.setItem('currentUser', JSON.stringify(this.currentRider));
                        console.log('✅ Test rider set as current user');
                    }
                } else {
                    console.log('🚴 Database not available, creating test rider data');
                    this.currentRider = this.createTestRider();
                    EudoraApp.currentUser = this.currentRider;
                    localStorage.setItem('currentUser', JSON.stringify(this.currentRider));
                    console.log('✅ Test rider set as current user');
                }
                return;
            }
        }
        
        if (EudoraApp.currentUser.role !== 'rider') {
            console.log('👤 User is not a rider (role: ' + EudoraApp.currentUser.role + '), trying to load rider from database for demo');
            
            // Try to get rider from database for demo
            if (typeof Database !== 'undefined') {
                const riders = Database.getUsersByRole('rider');
                if (riders && riders.length > 0) {
                    this.currentRider = riders[0]; // Use first rider from database
                    console.log('✅ Using database rider for demo:', this.currentRider.email);
                } else {
                    this.currentRider = this.createTestRider();
                    console.log('✅ Using test rider for demo');
                }
            } else {
                this.currentRider = this.createTestRider();
                console.log('✅ Using test rider for demo (no database)');
            }
            return;
        }
        
        this.currentRider = EudoraApp.currentUser;
        console.log('🚴 Current rider loaded:', this.currentRider.firstName, this.currentRider.lastName);
        
        // Update rider name in header
        const riderNameElement = document.getElementById('rider-name');
        if (riderNameElement) {
            riderNameElement.textContent = `${this.currentRider.firstName} ${this.currentRider.lastName}`;
        }
    },

    // Creates a test rider for demo purposes (fallback only)
    createTestRider() {
        return {
            id: 'rider_demo_001',
            firstName: 'Marco',
            lastName: 'Delivery',
            email: 'marco.rider@eudora.it',
            role: 'rider',
            phone: '+39 333 123 4567',
            address: 'Via Milano 123, 20100 Milano (MI)',
            vehicle: 'Scooter Yamaha',
            vehicleType: 'scooter',
            vehiclePlate: 'AB123CD',
            zone: 'Centro Milano',
            workingZones: ['20100', '20121', '20122'],
            licenseNumber: 'ABC123',
            isActive: true,
            isAvailable: true,
            rating: 4.8,
            profilePicture: null,
            workingHours: {
                start: '09:00',
                end: '18:00'
            },
            emergencyContact: {
                name: 'Anna Rossi',
                phone: '+39 333 987 6543'
            },
            createdAt: new Date().toISOString()
        };
    },

  

    // Carica gli ordini disponibili per il rider
    loadOrders() {
        console.log('📦 Loading orders for rider from eudora_orders...');
        
        try {
            // Check if rider is properly loaded
            if (!this.currentRider || !this.currentRider.id) {
                console.warn('⚠️ No rider data available, cannot load orders');
                this.orders = [];
                this.filteredOrders = [];
                this.updateOrdersDisplay();
                this.updateStats();
                return;
            }
            
            // Load all orders from eudora_orders database
            const allOrders = Database.get(Database.keys.orders) || [];
            console.log(`📦 Found ${allOrders.length} total orders in eudora_orders`);
            
            // Filter orders that are ready for pickup or assigned to this rider
            this.orders = allOrders.filter(order => {
                return order.status === 'ready' || 
                       order.status === 'picked_up' || 
                       order.status === 'out_for_delivery' ||
                       (order.riderId === this.currentRider.id);
            });
            
            console.log(`📦 Loaded ${this.orders.length} orders for rider from eudora_orders`);
            console.log('📦 Orders by status:', this.orders.reduce((acc, order) => {
                acc[order.status] = (acc[order.status] || 0) + 1;
                return acc;
            }, {}));
            
            this.filteredOrders = [...this.orders];
            this.updateOrdersDisplay();
            this.updateStats();
            
        } catch (error) {
            console.error('❌ Error loading orders from eudora_orders:', error);
            if (typeof Auth !== 'undefined' && Auth.showNotification) {
                Auth.showNotification('Errore', 'Impossibile caricare gli ordini', 'error');
            }
        }
    },

    // Metodo dedicato per ottenere gli ordini da eudora_orders
    getOrdersFromEudoraOrders() {
        console.log('📦 Getting orders from eudora_orders database...');
        
        try {
            // Accesso diretto al database eudora_orders
            const eudoraOrders = localStorage.getItem('eudora_orders');
            
            if (!eudoraOrders) {
                console.warn('⚠️ No eudora_orders found in localStorage');
                return [];
            }
            
            const orders = JSON.parse(eudoraOrders);
            console.log(`📦 Successfully retrieved ${orders.length} orders from eudora_orders`);
            
            return orders;
            
        } catch (error) {
            console.error('❌ Error parsing orders from eudora_orders:', error);
            return [];
        }
    },

    // Metodo per ricaricare gli ordini con refresh esplicito
    refreshOrders() {
        console.log('🔄 Refreshing orders from eudora_orders...');
        
        // Force reload from database
        if (typeof Database !== 'undefined' && Database.rebuildIndexes) {
            Database.rebuildIndexes();
        }
        
        this.loadOrders();
        
        // Show success notification
        if (typeof Auth !== 'undefined' && Auth.showNotification) {
            Auth.showNotification('Successo', 'Ordini aggiornati', 'success');
        }
    },

    // Aggiorna la visualizzazione degli ordini
    updateOrdersDisplay() {
        const ordersContainer = document.getElementById('orders-container');
        if (!ordersContainer) return;

        if (this.filteredOrders.length === 0) {
            ordersContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-truck text-gray-300 text-6xl mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">Nessun ordine disponibile</h3>
                    <p class="text-gray-500">Non ci sono ordini pronti per la consegna al momento.</p>
                </div>
            `;
            return;
        }

        ordersContainer.innerHTML = this.filteredOrders.map(order => `
            <div class="order-card bg-white rounded-lg shadow-md p-6 mb-4 border-l-4 ${this.getOrderBorderColor(order.status)} fade-in">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3 mb-2">
                            <h3 class="font-semibold text-lg">Ordine #${order.orderNumber || order.id}</h3>
                            <span class="px-3 py-1 rounded-full text-sm ${this.getStatusClasses(order.status)}">
                                ${this.getStatusText(order.status)}
                            </span>
                            ${this.getUrgencyBadge(order)}
                        </div>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                                <p><i class="fas fa-user mr-2"></i><strong>Cliente:</strong> ${order.customerName || 'N/A'}</p>
                                <p><i class="fas fa-phone mr-2"></i><strong>Telefono:</strong> ${order.customerPhone || 'N/A'}</p>
                                <p><i class="fas fa-clinic-medical mr-2"></i><strong>Farmacia:</strong> ${order.pharmacyName || 'N/A'}</p>
                            </div>
                            <div>
                                <p><i class="fas fa-map-marker-alt mr-2"></i><strong>Indirizzo:</strong> ${typeof order.deliveryAddress === 'string' ? order.deliveryAddress : (order.deliveryAddress?.street || order.deliveryAddress?.address || 'N/A')}</p>
                                <p><i class="fas fa-clock mr-2"></i><strong>Ordinato:</strong> ${new Date(order.createdAt).toLocaleDateString('it-IT')} alle ${new Date(order.createdAt).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}</p>
                                ${order.estimatedDeliveryTime ? `<p><i class="fas fa-shipping-fast mr-2"></i><strong>Consegna stimata:</strong> ${new Date(order.estimatedDeliveryTime).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}</p>` : ''}
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

                <!-- Notes Section -->
                ${order.notes ? `
                    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4">
                        <div class="flex">
                            <i class="fas fa-sticky-note text-yellow-400 mr-2 mt-1"></i>
                            <div>
                                <p class="text-sm font-medium text-yellow-800">Note per la consegna:</p>
                                <p class="text-sm text-yellow-700">${order.notes}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}

                <!-- Action Buttons -->
                <div class="flex flex-col md:flex-row gap-3">
                    <button 
                        onclick="Rider.showOrderModal('${order.id}')" 
                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center">
                        <i class="fas fa-map mr-2"></i>
                        Visualizza Mappa
                    </button>
                    
                    ${this.getOrderActionButtons(order)}
                </div>
            </div>
        `).join('');
    },

    // Restituisce i pulsanti di azione per un ordine in base al suo stato
    getOrderActionButtons(order) {
        switch (order.status) {
            case 'ready':
                return `
                    <button 
                        onclick="Rider.pickupOrder('${order.id}')" 
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center">
                        <i class="fas fa-hand-paper mr-2"></i>
                        Ritira Ordine
                    </button>
                `;
            
            case 'picked_up':
            case 'out_for_delivery':
                return `
                    <button 
                        onclick="Rider.deliverOrder('${order.id}')" 
                        class="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center">
                        <i class="fas fa-check-circle mr-2"></i>
                        Segna come Consegnato
                    </button>
                `;
            
            case 'delivered':
                return `
                    <button 
                        disabled
                        class="flex-1 bg-gray-300 text-gray-600 px-4 py-2 rounded-lg cursor-not-allowed flex items-center justify-center">
                        <i class="fas fa-check-double mr-2"></i>
                        Consegnato
                    </button>
                `;
            
            default:
                return '';
        }
    },

    // Mostra il modal con mappa e dettagli ordine
    showOrderModal(orderId) {
        console.log('🗺️ Showing order modal for:', orderId);
        
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            Auth.showNotification('Errore', 'Ordine non trovato', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'order-modal';
        modal.innerHTML = `
            <div class="order-modal-content">
                <div class="p-6">
                    <!-- Modal Header -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h2 class="text-2xl font-bold text-gray-800">Ordine #${order.orderNumber || order.id}</h2>
                            <p class="text-gray-600">Cliente: ${order.customerName || 'N/A'}</p>
                        </div>
                        <button onclick="this.closest('.order-modal').remove()" 
                                class="text-gray-400 hover:text-gray-600 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Map Container -->
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3">
                            <i class="fas fa-route mr-2"></i>
                            Percorso di Consegna
                        </h3>
                        <div id="order-map-${order.id}" class="map-container-modal">
                            <div class="map-loading">
                                <div class="map-spinner"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Order Details Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <!-- Customer Info -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-semibold mb-3 text-gray-800">
                                <i class="fas fa-user mr-2"></i>
                                Informazioni Cliente
                            </h4>
                            <div class="space-y-2 text-sm">
                                <p><strong>Nome:</strong> ${order.customerName || 'N/A'}</p>
                                <p><strong>Telefono:</strong> 
                                    <a href="tel:${order.customerPhone}" class="text-blue-600 hover:underline">
                                        ${order.customerPhone || 'N/A'}
                                    </a>
                                </p>
                                <p><strong>Indirizzo:</strong> ${typeof order.deliveryAddress === 'string' ? order.deliveryAddress : (order.deliveryAddress?.street || order.deliveryAddress?.address || 'N/A')}</p>
                                ${order.deliveryInstructions ? `<p><strong>Istruzioni:</strong> ${order.deliveryInstructions}</p>` : ''}
                            </div>
                        </div>

                        <!-- Order Info -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="font-semibold mb-3 text-gray-800">
                                <i class="fas fa-box mr-2"></i>
                                Dettagli Ordine
                            </h4>
                            <div class="space-y-2 text-sm">
                                <p><strong>Totale:</strong> <span class="text-green-600 font-semibold">€${order.total.toFixed(2)}</span></p>
                                <p><strong>Stato:</strong> <span class="px-2 py-1 rounded ${this.getStatusClasses(order.status)}">${this.getStatusText(order.status)}</span></p>
                                <p><strong>Farmacia:</strong> ${order.pharmacyName || 'N/A'}</p>
                                <p><strong>Ordinato:</strong> ${new Date(order.createdAt).toLocaleDateString('it-IT')} ${new Date(order.createdAt).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Order Items -->
                    ${order.items && order.items.length > 0 ? `
                        <div class="mb-6">
                            <h4 class="font-semibold mb-3 text-gray-800">
                                <i class="fas fa-pills mr-2"></i>
                                Prodotti Ordinati
                            </h4>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="space-y-2">
                                    ${order.items.map(item => `
                                        <div class="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                            <div>
                                                <span class="font-medium">${item.name}</span>
                                                <span class="text-gray-600 text-sm ml-2">x${item.quantity}</span>
                                            </div>
                                            <span class="font-semibold">€${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Notes -->
                    ${order.notes ? `
                        <div class="mb-6">
                            <h4 class="font-semibold mb-3 text-gray-800">
                                <i class="fas fa-sticky-note mr-2"></i>
                                Note per la Consegna
                            </h4>
                            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                <p class="text-yellow-800">${order.notes}</p>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Action Buttons -->
                    <div class="flex flex-col md:flex-row gap-3">
                        <button 
                            onclick="this.closest('.order-modal').remove()" 
                            class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg transition">
                            <i class="fas fa-times mr-2"></i>
                            Chiudi
                        </button>
                        
                        ${this.getModalActionButtons(order)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize map after modal is added to DOM
        setTimeout(() => {
            this.initializeOrderMap(order);
        }, 100);
    },

    // Restituisce i pulsanti di azione per il modal
    getModalActionButtons(order) {
        switch (order.status) {
            case 'ready':
                return `
                    <button 
                        onclick="Rider.pickupOrder('${order.id}'); this.closest('.order-modal').remove();" 
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition">
                        <i class="fas fa-hand-paper mr-2"></i>
                        Ritira Ordine
                    </button>
                `;
            
            case 'picked_up':
            case 'out_for_delivery':
                return `
                    <button 
                        onclick="Rider.deliverOrder('${order.id}'); this.closest('.order-modal').remove();" 
                        class="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg transition">
                        <i class="fas fa-check-circle mr-2"></i>
                        Segna come Consegnato
                    </button>
                `;
            
            case 'delivered':
                return `
                    <button 
                        disabled
                        class="flex-1 bg-gray-300 text-gray-600 px-6 py-3 rounded-lg cursor-not-allowed">
                        <i class="fas fa-check-double mr-2"></i>
                        Già Consegnato
                    </button>
                `;
            
            default:
                return '';
        }
    },

    // Inizializza la mappa per un ordine
    initializeOrderMap(order) {
        const mapContainerId = `order-map-${order.id}`;
        const mapContainer = document.getElementById(mapContainerId);
        
        if (!mapContainer) {
            console.error('Map container not found:', mapContainerId);
            return;
        }

        try {
            // Default locations for demo
            const pharmacyLocation = this.getPharmacyLocation(order.pharmacyName);
            const customerLocation = this.getCustomerLocation(order.deliveryAddress);
            const riderLocation = this.riderLocation || [45.4642, 9.1900]; // Default to Milan

            // Initialize map
            const map = L.map(mapContainerId).setView(riderLocation, 13);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Create custom icons
            const riderIcon = L.divIcon({
                html: '<i class="fas fa-motorcycle text-blue-600"></i>',
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const pharmacyIcon = L.divIcon({
                html: '<i class="fas fa-clinic-medical text-green-600"></i>',
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            const customerIcon = L.divIcon({
                html: '<i class="fas fa-home text-red-600"></i>',
                className: 'custom-div-icon',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            // Add markers
            const riderMarker = L.marker(riderLocation, { icon: riderIcon })
                .addTo(map)
                .bindPopup('La tua posizione');

            const pharmacyMarker = L.marker(pharmacyLocation, { icon: pharmacyIcon })
                .addTo(map)
                .bindPopup(`Farmacia: ${order.pharmacyName || 'N/A'}`);

            const customerMarker = L.marker(customerLocation, { icon: customerIcon })
                .addTo(map)
                .bindPopup(`Cliente: ${order.customerName}<br>${typeof order.deliveryAddress === 'string' ? order.deliveryAddress : (order.deliveryAddress?.street || order.deliveryAddress?.address || 'Indirizzo non disponibile')}`);

            // Create route based on order status
            let routePoints = [];
            if (order.status === 'ready') {
                // Route from rider to pharmacy to customer
                routePoints = [riderLocation, pharmacyLocation, customerLocation];
            } else {
                // Route from rider to customer (already picked up)
                routePoints = [riderLocation, customerLocation];
            }

            // Draw route
            const route = L.polyline(routePoints, { 
                color: '#3b82f6', 
                weight: 4, 
                opacity: 0.7 
            }).addTo(map);

            // Fit map to show all markers
            const group = new L.featureGroup([riderMarker, pharmacyMarker, customerMarker, route]);
            map.fitBounds(group.getBounds().pad(0.1));

            // Store map reference
            this.currentMap = map;

            console.log('🗺️ Map initialized for order:', order.id);

        } catch (error) {
            console.error('❌ Error initializing map:', error);
            mapContainer.innerHTML = `
                <div class="flex items-center justify-center h-full bg-red-50">
                    <div class="text-center text-red-600">
                        <i class="fas fa-exclamation-triangle text-4xl mb-2"></i>
                        <p>Errore nel caricamento della mappa</p>
                    </div>
                </div>
            `;
        }
    },

    // Ottiene la posizione della farmacia (demo)
    getPharmacyLocation(pharmacyName) {
        const pharmacyLocations = {
            'Farmacia Centrale': [45.4654, 9.1859],
            'Farmacia San Marco': [45.4641, 9.1936],
            'Farmacia Duomo': [45.4640, 9.1916],
            'Farmacia Navigli': [45.4484, 9.1768]
        };
        return pharmacyLocations[pharmacyName] || [45.4642, 9.1900];
    },

    // Ottiene la posizione del cliente basata sull'indirizzo (demo)
    getCustomerLocation(address) {
        // In una implementazione reale, si userebbe un servizio di geocoding
        // Per ora usiamo posizioni casuali nell'area di Milano
        const locations = [
            [45.4773, 9.1815], // Porta Garibaldi
            [45.4585, 9.1943], // Porta Romana
            [45.4561, 9.1706], // Navigli
            [45.4719, 9.2028], // Isola
            [45.4408, 9.2297]  // Corvetto
        ];
        return locations[Math.floor(Math.random() * locations.length)];
    },

    // Ritira un ordine
    pickupOrder(orderId) {
        console.log('📦 Picking up order:', orderId);
        
        // Check if rider is properly loaded
        if (!this.currentRider || !this.currentRider.id) {
            Auth.showNotification('Errore', 'Dati rider non disponibili', 'error');
            return;
        }
        
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            Auth.showNotification('Errore', 'Ordine non trovato', 'error');
            return;
        }

        if (order.status !== 'ready') {
            Auth.showNotification('Attenzione', 'Questo ordine non è pronto per il ritiro', 'warning');
            return;
        }

        try {
            // Update order status
            const success = Database.updateOrderStatus(orderId, 'picked_up', this.currentRider.id);
            
            if (success) {
                // Update local data
                order.status = 'picked_up';
                order.riderId = this.currentRider.id;
                order.pickedUpAt = new Date().toISOString();
                
                // Refresh display
                this.updateOrdersDisplay();
                this.updateStats();
                
                // Send notification to customer
                if (order.customerId) {
                    Database.createNotification({
                        userId: order.customerId,
                        type: 'order_update',
                        title: 'Ordine Ritirato',
                        message: `Il tuo ordine #${order.orderNumber || order.id} è stato ritirato dal rider ed è in viaggio verso di te.`
                    });
                }
                
                Auth.showNotification('Ordine Ritirato', `Ordine #${order.orderNumber || order.id} ritirato con successo`);
                
            } else {
                Auth.showNotification('Errore', 'Impossibile aggiornare lo stato dell\'ordine', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error picking up order:', error);
            Auth.showNotification('Errore', 'Errore durante il ritiro dell\'ordine', 'error');
        }
    },

    // Consegna un ordine
    deliverOrder(orderId) {
        console.log('✅ Delivering order:', orderId);
        
        // Check if rider is properly loaded
        if (!this.currentRider || !this.currentRider.id) {
            Auth.showNotification('Errore', 'Dati rider non disponibili', 'error');
            return;
        }
        
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            Auth.showNotification('Errore', 'Ordine non trovato', 'error');
            return;
        }

        if (order.status !== 'picked_up' && order.status !== 'out_for_delivery') {
            Auth.showNotification('Attenzione', 'Questo ordine non può essere consegnato', 'warning');
            return;
        }

        try {
            // Update order status
            const success = Database.updateOrderStatus(orderId, 'delivered', this.currentRider.id);
            
            if (success) {
                // Update local data
                order.status = 'delivered';
                order.deliveredAt = new Date().toISOString();
                
                // Refresh display
                this.updateOrdersDisplay();
                this.updateStats();
                
                // Send notification to customer
                if (order.customerId) {
                    Database.createNotification({
                        userId: order.customerId,
                        type: 'order_delivered',
                        title: 'Ordine Consegnato',
                        message: `Il tuo ordine #${order.orderNumber || order.id} è stato consegnato con successo!`
                    });
                }
                
                // Send notification to pharmacy
                if (order.pharmacyId) {
                    Database.createNotification({
                        userId: order.pharmacyId,
                        type: 'order_delivered',
                        title: 'Ordine Consegnato',
                        message: `L'ordine #${order.orderNumber || order.id} è stato consegnato al cliente.`
                    });
                }
                
                Auth.showNotification('Ordine Consegnato', `Ordine #${order.orderNumber || order.id} consegnato con successo!`);
                
            } else {
                Auth.showNotification('Errore', 'Impossibile aggiornare lo stato dell\'ordine', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error delivering order:', error);
            Auth.showNotification('Errore', 'Errore durante la consegna dell\'ordine', 'error');
        }
    },

    // Filtra ordini per stato
    filterOrders(status) {
        console.log('🔍 Filtering orders by status:', status);
        
        if (status === 'all') {
            this.filteredOrders = [...this.orders];
        } else {
            this.filteredOrders = this.orders.filter(order => order.status === status);
        }
        
        this.updateOrdersDisplay();
    },

    // Cerca ordini per nome cliente o indirizzo
    searchOrders(searchTerm) {
        console.log('🔍 Searching orders for:', searchTerm);
        
        if (!searchTerm.trim()) {
            this.filteredOrders = [...this.orders];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredOrders = this.orders.filter(order => {
                // Helper function to get address string
                const getAddressString = (address) => {
                    if (typeof address === 'string') return address;
                    if (typeof address === 'object' && address) {
                        return address.street || address.address || address.full || '';
                    }
                    return '';
                };
                
                const addressString = getAddressString(order.deliveryAddress);
                
                return (order.customerName && typeof order.customerName === 'string' && order.customerName.toLowerCase().includes(term)) ||
                       (addressString && addressString.toLowerCase().includes(term)) ||
                       (order.orderNumber && typeof order.orderNumber === 'string' && order.orderNumber.toLowerCase().includes(term)) ||
                       (order.id && typeof order.id === 'string' && order.id.toLowerCase().includes(term));
            });
        }
        
        this.updateOrdersDisplay();
    },

    // Filtra ordini per data
    filterByDate(dateString) {
        console.log('📅 Filtering orders by date:', dateString);
        
        if (!dateString) {
            this.filteredOrders = [...this.orders];
        } else {
            const filterDate = new Date(dateString);
            this.filteredOrders = this.orders.filter(order => {
                const orderDate = new Date(order.createdAt);
                return orderDate.toDateString() === filterDate.toDateString();
            });
        }
        
        this.updateOrdersDisplay();
    },

    // Aggiorna le statistiche del rider
    updateStats() {
        // Check if rider is properly loaded
        if (!this.currentRider || !this.currentRider.id) {
            console.warn('⚠️ No rider data available for stats calculation');
            this.updateStatElement('today-deliveries', '0');
            this.updateStatElement('pending-orders', '0');
            this.updateStatElement('today-earnings', '€0.00');
            this.updateStatElement('rider-rating', '5.0');
            return;
        }
        
        const today = new Date();
        const todayString = today.toDateString();
        
        // Count today's deliveries
        const todayDeliveries = this.orders.filter(order => {
            const orderDate = new Date(order.deliveredAt || order.createdAt);
            return order.status === 'delivered' && 
                   order.riderId === this.currentRider.id &&
                   orderDate.toDateString() === todayString;
        }).length;

        // Count pending orders
        const pendingOrders = this.orders.filter(order => 
            order.status === 'ready' || order.status === 'picked_up' || order.status === 'out_for_delivery'
        ).length;

        // Calculate today's earnings (demo calculation)
        const todayEarnings = todayDeliveries * 3.50; // €3.50 per delivery

        // Generate random rating between 4.5 and 5.0
        const rating = (4.5 + Math.random() * 0.5).toFixed(1);

        // Update DOM elements
        this.updateStatElement('today-deliveries', todayDeliveries);
        this.updateStatElement('pending-orders', pendingOrders);
        this.updateStatElement('today-earnings', `€${todayEarnings.toFixed(2)}`);
        this.updateStatElement('rider-rating', rating);
    },

    // Helper per aggiornare elementi statistici
    updateStatElement(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    },

    // Setup event listeners
    setupEventListeners() {
        // Auto-refresh removed - orders will be loaded manually via refresh button
        console.log('🎯 Event listeners setup complete - manual refresh only');
    },

    // Simula il tracking della posizione del rider
    startLocationTracking() {
        // In una implementazione reale, si userebbe navigator.geolocation
        this.riderLocation = [45.4642, 9.1900]; // Default Milano
        
        console.log('📍 Location tracking started for rider');
        
        // Simula aggiornamenti di posizione ogni 10 secondi
        setInterval(() => {
            if (this.isActive) {
                this.updateRiderLocation();
            }
        }, 10000);
    },

    // Aggiorna la posizione del rider (simulata)
    updateRiderLocation() {
        if (this.riderLocation) {
            // Simula piccoli movimenti
            const lat = this.riderLocation[0] + (Math.random() - 0.5) * 0.001;
            const lng = this.riderLocation[1] + (Math.random() - 0.5) * 0.001;
            this.riderLocation = [lat, lng];
        }
    },

    // Helper functions per la visualizzazione
    getOrderBorderColor(status) {
        const colors = {
            'ready': 'border-blue-400',
            'picked_up': 'border-yellow-400',
            'out_for_delivery': 'border-purple-400',
            'delivered': 'border-green-400',
            'cancelled': 'border-red-400'
        };
        return colors[status] || 'border-gray-300';
    },

    getStatusClasses(status) {
        const classes = {
            'ready': 'bg-blue-100 text-blue-800',
            'picked_up': 'bg-yellow-100 text-yellow-800',
            'out_for_delivery': 'bg-purple-100 text-purple-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    },

    getStatusText(status) {
        const texts = {
            'ready': 'Pronto per Ritiro',
            'picked_up': 'Ritirato',
            'out_for_delivery': 'In Consegna',
            'delivered': 'Consegnato',
            'cancelled': 'Cancellato'
        };
        return texts[status] || status;
    },

    getUrgencyBadge(order) {
        // Check if order is urgent (created more than 2 hours ago and still not delivered)
        const createdAt = new Date(order.createdAt);
        const now = new Date();
        const hoursSinceCreated = (now - createdAt) / (1000 * 60 * 60);
        
        if (hoursSinceCreated > 2 && order.status !== 'delivered') {
            return '<span class="priority-urgent bg-red-500 text-white px-2 py-1 rounded-full text-xs"><i class="fas fa-exclamation-triangle mr-1"></i>Urgente</span>';
        }
        
        return '';
    },

    // ===== RIDER INFO MANAGEMENT =====
    
    // Show rider info modal
    showRiderInfo() {
        console.log('👤 Showing rider info modal');
        
        if (!this.currentRider) {
            Auth.showNotification('Errore', 'Dati rider non disponibili', 'error');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <!-- Header -->
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-gray-800">
                            <i class="fas fa-user-circle mr-2"></i>
                            Informazioni Rider
                        </h2>
                        <button onclick="this.closest('.fixed').remove()" 
                                class="text-gray-400 hover:text-gray-600 text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Rider Info Form -->
                    <form id="rider-info-form" class="space-y-6">
                        <!-- Personal Info Section -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold mb-4 text-gray-800">
                                <i class="fas fa-id-card mr-2"></i>
                                Informazioni Personali
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                    <input type="text" id="rider-firstName" 
                                           value="${this.currentRider.firstName || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                                    <input type="text" id="rider-lastName" 
                                           value="${this.currentRider.lastName || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="rider-email" 
                                           value="${this.currentRider.email || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                                    <input type="tel" id="rider-phone" 
                                           value="${this.currentRider.phone || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div class="md:col-span-2">
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Indirizzo</label>
                                    <input type="text" id="rider-address" 
                                           value="${this.currentRider.address || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                            </div>
                        </div>

                        <!-- Work Info Section -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h3 class="text-lg font-semibold mb-4 text-gray-800">
                                <i class="fas fa-briefcase mr-2"></i>
                                Informazioni Lavorative
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Veicolo</label>
                                    <select id="rider-vehicle" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="Bicicletta" ${(this.currentRider.vehicle === 'Bicicletta' || this.currentRider.vehicle === 'Bicicletta Elettrica' || this.currentRider.vehicleType === 'bike') ? 'selected' : ''}>Bicicletta</option>
                                        <option value="Scooter" ${(this.currentRider.vehicle === 'Scooter' || this.currentRider.vehicle === 'Scooter Yamaha' || this.currentRider.vehicleType === 'scooter') ? 'selected' : ''}>Scooter</option>
                                        <option value="Moto" ${(this.currentRider.vehicle === 'Moto' || this.currentRider.vehicleType === 'motorcycle') ? 'selected' : ''}>Moto</option>
                                        <option value="Auto" ${(this.currentRider.vehicle === 'Auto' || this.currentRider.vehicle === 'Auto Volkswagen' || this.currentRider.vehicleType === 'car') ? 'selected' : ''}>Auto</option>
                                        <option value="A piedi" ${(this.currentRider.vehicle === 'A piedi' || this.currentRider.vehicleType === 'walking') ? 'selected' : ''}>A piedi</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Zona di Lavoro</label>
                                    <input type="text" id="rider-zone" 
                                           value="${this.currentRider.workingZones.join(', ') || ''}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select id="rider-status" 
                                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="true" ${this.currentRider.isActive ? 'selected' : ''}>Attivo</option>
                                        <option value="false" ${!this.currentRider.isActive ? 'selected' : ''}>Inattivo</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col md:flex-row gap-3 pt-4">
                            <button type="button" 
                                    onclick="this.closest('.fixed').remove()" 
                                    class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-3 rounded-lg transition">
                                <i class="fas fa-times mr-2"></i>
                                Annulla
                            </button>
                            <button type="submit" 
                                    class="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition">
                                <i class="fas fa-save mr-2"></i>
                                Salva Modifiche
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Add form submit handler
        const form = document.getElementById('rider-info-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveRiderInfo(modal);
        });
    },

    // Save rider info to database
    saveRiderInfo(modal) {
        console.log('💾 Saving rider info...');
        
        try {
            // Collect form data
            const updatedData = {
                firstName: document.getElementById('rider-firstName').value.trim(),
                lastName: document.getElementById('rider-lastName').value.trim(),
                email: document.getElementById('rider-email').value.trim(),
                phone: document.getElementById('rider-phone').value.trim(),
                address: document.getElementById('rider-address').value.trim(),
                vehicle: document.getElementById('rider-vehicle').value,
                zone: document.getElementById('rider-zone').value.trim(),
                licenseNumber: document.getElementById('rider-licenseNumber').value.trim(),
                isActive: document.getElementById('rider-status').value === 'true',
                workingHours: {
                    start: document.getElementById('rider-workStart').value,
                    end: document.getElementById('rider-workEnd').value
                },
                emergencyContact: {
                    name: document.getElementById('rider-emergencyName').value.trim(),
                    phone: document.getElementById('rider-emergencyPhone').value.trim()
                }
            };

            // Validate required fields
            if (!updatedData.firstName || !updatedData.lastName || !updatedData.email) {
                Auth.showNotification('Errore', 'Nome, cognome ed email sono obbligatori', 'error');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updatedData.email)) {
                Auth.showNotification('Errore', 'Formato email non valido', 'error');
                return;
            }

            // Update rider in database
            const updatedRider = Database.updateUser(this.currentRider.id, updatedData);
            
            if (updatedRider) {
                // Update current rider object
                this.currentRider = updatedRider;
                
                // Update EudoraApp current user if it exists
                if (typeof EudoraApp !== 'undefined' && EudoraApp.currentUser) {
                    EudoraApp.currentUser = updatedRider;
                    localStorage.setItem('currentUser', JSON.stringify(updatedRider));
                }
                
                // Update UI elements
                const riderNameElement = document.getElementById('rider-name');
                if (riderNameElement) {
                    riderNameElement.textContent = `${updatedRider.firstName} ${updatedRider.lastName}`;
                }
                
                Auth.showNotification('Successo', 'Informazioni rider salvate con successo');
                
                // Close modal
                modal.remove();
                
                console.log('✅ Rider info saved successfully');
            } else {
                Auth.showNotification('Errore', 'Impossibile salvare le informazioni', 'error');
            }
            
        } catch (error) {
            console.error('❌ Error saving rider info:', error);
            Auth.showNotification('Errore', 'Errore durante il salvataggio', 'error');
        }
    },

    // Display rider info summary in dashboard
    displayRiderInfoSummary() {
        if (!this.currentRider) return '';
        
        return `
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800 mb-2">
                            <i class="fas fa-user-circle mr-2"></i>
                            ${this.currentRider.firstName} ${this.currentRider.lastName}
                        </h3>
                        <p class="text-gray-600">${this.currentRider.email}</p>
                    </div>
                    <button onclick="Rider.showRiderInfo()" 
                            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition">
                        <i class="fas fa-edit mr-2"></i>
                        Modifica Info
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <p class="text-gray-500">Veicolo</p>
                        <p class="font-medium">${this.currentRider.vehicle || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Zona</p>
                        <p class="font-medium">${this.currentRider.zone || 'N/A'}</p>
                    </div>
                    <div>
                        <p class="text-gray-500">Status</p>
                        <p class="font-medium">
                            <span class="px-2 py-1 rounded-full text-xs ${this.currentRider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${this.currentRider.isActive ? 'Attivo' : 'Inattivo'}
                            </span>
                        </p>
                    </div>
                </div>
                
                ${this.currentRider.workingHours ? `
                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <p class="text-sm text-gray-500 mb-1">Orari di lavoro</p>
                        <p class="text-sm font-medium">${this.currentRider.workingHours.start} - ${this.currentRider.workingHours.end}</p>
                    </div>
                ` : ''}
            </div>
        `;
    },

    // Metodo per ottenere tutti gli ordini da eudora_orders (senza filtri)
    getAllOrdersFromEudoraOrders() {
        console.log('📦 Getting ALL orders from eudora_orders database...');
        
        try {
            // Metodo 1: Usa il sistema Database se disponibile
            if (typeof Database !== 'undefined' && Database.get) {
                const allOrders = Database.get(Database.keys.orders) || [];
                console.log(`📦 Retrieved ${allOrders.length} orders via Database system`);
                return allOrders;
            }
            
            // Metodo 2: Accesso diretto a localStorage se Database non è disponibile
            const eudoraOrdersString = localStorage.getItem('eudora_orders');
            
            if (!eudoraOrdersString) {
                console.warn('⚠️ No eudora_orders found in localStorage');
                return [];
            }
            
            const allOrders = JSON.parse(eudoraOrdersString);
            console.log(`📦 Retrieved ${allOrders.length} orders via direct localStorage access`);
            
            return allOrders;
            
        } catch (error) {
            console.error('❌ Error getting orders from eudora_orders:', error);
            return [];
        }
    },

    // Metodo per ottenere ordini filtrati per stato
    getOrdersByStatus(status) {
        console.log(`📦 Getting orders with status: ${status}`);
        
        const allOrders = this.getAllOrdersFromEudoraOrders();
        const filteredOrders = allOrders.filter(order => order.status === status);
        
        console.log(`📦 Found ${filteredOrders.length} orders with status '${status}'`);
        return filteredOrders;
    },

    // Metodo per ottenere statistiche sugli ordini
    getOrdersStatistics() {
        console.log('📊 Getting orders statistics from eudora_orders...');
        
        const allOrders = this.getAllOrdersFromEudoraOrders();
        
        const stats = {
            total: allOrders.length,
            byStatus: {},
            byPharmacy: {},
            totalValue: 0,
            averageValue: 0
        };
        
        allOrders.forEach(order => {
            // Count by status
            stats.byStatus[order.status] = (stats.byStatus[order.status] || 0) + 1;
            
            // Count by pharmacy
            if (order.pharmacyName) {
                stats.byPharmacy[order.pharmacyName] = (stats.byPharmacy[order.pharmacyName] || 0) + 1;
            }
            
            // Calculate total value
            if (order.total && typeof order.total === 'number') {
                stats.totalValue += order.total;
            }
        });
        
        // Calculate average value
        if (stats.total > 0) {
            stats.averageValue = stats.totalValue / stats.total;
        }
        
        console.log('📊 Orders statistics:', stats);
        return stats;
    }
};

// Esponi le funzioni Rider globalmente
window.Rider = Rider;

console.log('🚴 Rider module loaded');
