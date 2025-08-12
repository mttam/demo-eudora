// Customer module - gestisce funzionalità cliente
const Customer = {
    cart: [],
    addresses: [],
    paymentMethods: [],
    orders: [],
    
    // Inizializza il modulo Customer
    init() {
        console.log('🛍️ Initializing Customer module...');
        this.loadData();
    },
    
    // Carica i dati del cliente dal database
    loadData() {
        if (!EudoraApp.currentUser) {
            console.log('❌ No current user for Customer.loadData()');
            return;
        }
        
        const userId = EudoraApp.currentUser.id;
        console.log(`🔄 Loading customer data for user ${userId}...`);
        
        try {
            // Carica il carrello
            const cart = Database.getCart(userId);
            this.cart = cart.items || [];
            console.log(`📦 Loaded ${this.cart.length} cart items`);
            
            // Carica gli indirizzi
            const addresses = Database.getUserAddresses(userId);
            this.addresses = addresses || [];
            console.log(`📍 Loaded ${this.addresses.length} addresses`);
            
            // Se l'utente non ha indirizzi, crea alcuni di default per il demo user
            if (this.addresses.length === 0 && EudoraApp.currentUser.email === 'mario.rossi@email.com') {
                console.log('📍 No addresses found for demo user, creating default ones...');
                this.createDefaultAddresses(userId);
            }
            
            // Carica i metodi di pagamento
            const paymentMethods = Database.getUserPaymentMethods(userId);
            this.paymentMethods = paymentMethods || [];
            console.log(`💳 Loaded ${this.paymentMethods.length} payment methods`);
            
            // Se l'utente non ha metodi di pagamento, crea alcuni di default
            if (this.paymentMethods.length === 0) {
                console.log('💳 No payment methods found, creating default ones...');
                this.createDefaultPaymentMethods(userId);
            }
            
            // Carica gli ordini
            console.log('🔍 Attempting to load orders for userId:', userId);
            
            if (typeof Database.getOrdersByUser !== 'function') {
                console.error('❌ Database.getOrdersByUser is not a function!');
                // Fallback: cerca di ottenere tutti gli ordini e filtrarli manualmente
                if (typeof Database.getAllOrders === 'function') {
                    console.log('🔄 Fallback: using getAllOrders and filtering manually');
                    const allOrders = Database.getAllOrders();
                    console.log('📊 Total orders in database:', allOrders.length);
                    this.orders = allOrders.filter(order => 
                        order.customerId == userId || order.userId == userId
                    );
                    console.log('📋 Orders found for user:', this.orders.length);
                } else {
                    console.error('❌ Database.getAllOrders is also not available');
                    this.orders = [];
                }
            } else {
                const orders = Database.getOrdersByUser(userId);
                this.orders = orders || [];
                console.log(`📋 Loaded ${this.orders.length} orders via getOrdersByUser`);
            }
            
            // Aggiorna la visualizzazione
            this.updateCartDisplay();
            
            console.log('✅ Customer data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading customer data:', error);
            Auth.showNotification('Errore nel caricamento dei dati utente', 'error');
        }
    },

    // Crea metodi di pagamento di default per l'utente
    createDefaultPaymentMethods(userId) {
        const defaultPaymentMethods = [
            {
                type: 'card',
                label: 'Carta di Credito Principale',
                cardType: 'visa',
                cardNumber: '**** **** **** 1234',
                cardLastDigits: '1234',
                expiryDate: '12/25',
                cardHolder: EudoraApp.currentUser.firstName + ' ' + EudoraApp.currentUser.lastName,
                description: 'Visa **** 1234',
                isDefault: true
            },
            {
                type: 'paypal',
                label: 'PayPal',
                email: EudoraApp.currentUser.email,
                description: EudoraApp.currentUser.email,
                isDefault: false
            },
            {
                type: 'cash',
                label: 'Contrassegno',
                description: 'Pagamento alla consegna in contanti',
                isDefault: false
            }
        ];

        defaultPaymentMethods.forEach(method => {
            const savedPayment = Database.addUserPaymentMethod(userId, method);
            if (savedPayment) {
                this.paymentMethods.push(savedPayment);
                console.log(`✅ Created default payment method: ${method.label}`);
            }
        });
    },
    
    // Crea indirizzi di default per l'utente (solo per demo user)
    createDefaultAddresses(userId) {
        const defaultAddresses = [
            {
                label: 'Casa',
                street: 'Via Roma, 123',
                city: 'Milano',
                zipCode: '20100',
                cap: '20100',
                postalCode: '20100',
                province: 'MI',
                region: 'Lombardia',
                floor: '2° piano',
                notes: 'Citofono: Rossi - Suonare anche al vicino se non rispondo',
                isDefault: true,
                deliveryInstructions: 'Lasciare il pacco al portiere se assente'
            },
            {
                label: 'Ufficio',
                street: 'Via Milano, 45',
                city: 'Milano',
                zipCode: '20121',
                cap: '20121',
                postalCode: '20121',
                province: 'MI',
                region: 'Lombardia',
                floor: '3° piano',
                notes: 'Edificio B, scala 2 - Ufficio 305',
                isDefault: false,
                deliveryInstructions: 'Consegna solo negli orari 9:00-18:00'
            }
        ];

        defaultAddresses.forEach(address => {
            const savedAddress = Database.addUserAddress(userId, address);
            if (savedAddress) {
                this.addresses.push(savedAddress);
                console.log(`✅ Created default address: ${address.label}`);
            }
        });
    },
    
    // Aggiunge un prodotto al carrello
    addToCart(productId, name, price, quantity = 1) {
        if (!EudoraApp.currentUser) {
            Auth.showNotification('Devi effettuare il login per aggiungere prodotti al carrello', 'error');
            return;
        }
        
        const userId = EudoraApp.currentUser.id;
        console.log(`🛒 Adding to cart: ${name} (${quantity}x) for user ${userId}`);
        
        // Controlla se il prodotto è già nel carrello
        const existingItem = this.cart.find(item => item.productId === productId);
        
        if (existingItem) {
            // Aggiorna la quantità
            existingItem.quantity += quantity;
            // Usa addToCart con quantità 0 per aggiornare, oppure rimuovi e ri-aggiungi
            Database.removeFromCart(userId, productId);
            Database.addToCart(userId, productId, existingItem.quantity);
            console.log(`📦 Updated cart item quantity: ${existingItem.quantity}`);
        } else {
            // Aggiungi nuovo item - usa addToCart del database
            Database.addToCart(userId, productId, quantity);
            
            // Ricarica il carrello per mantenere la sincronizzazione
            const updatedCart = Database.getCart(userId);
            this.cart = updatedCart.items || [];
            console.log(`✅ Added new cart item for product ${productId}`);
        }
        
        this.updateCartDisplay();
        Auth.showNotification(`${name} aggiunto al carrello`);
        
        // Trigger cart badge update in notification system
        if (window.NotificationSystem && NotificationSystem.refreshCartBadge) {
            NotificationSystem.refreshCartBadge();
        }
    },
    
    // Rimuove un prodotto dal carrello
    removeFromCart(productId) {
        if (!EudoraApp.currentUser) return;
        
        // Keep productId as-is since IDs are strings like 'id_1753785015764_kuoxs32do'
        const userId = EudoraApp.currentUser.id;
        console.log(`🗑️ Removing from cart: product ${productId}`);
        
        Database.removeFromCart(userId, productId);
        
        // Ricarica il carrello dal database
        const updatedCart = Database.getCart(userId);
        this.cart = updatedCart.items || [];
        
        this.updateCartDisplay();
        Auth.showNotification('Prodotto rimosso dal carrello');
        
        // Trigger cart badge update in notification system
        if (window.NotificationSystem && NotificationSystem.refreshCartBadge) {
            NotificationSystem.refreshCartBadge();
        }
    },
    
    // Aggiorna la quantità di un prodotto nel carrello
    updateCartQuantity(productId, newQuantity) {
        // Keep productId as-is since IDs are strings like 'id_1753785015764_kuoxs32do'
        newQuantity = parseInt(newQuantity);
        
        console.log(`🔄 Updating cart quantity for product: ${productId} to quantity: ${newQuantity}`);
        
        if (newQuantity <= 0) {
            this.removeFromCart(productId);
            return;
        }
        
        if (!EudoraApp.currentUser) return;
        
        const userId = EudoraApp.currentUser.id;
        const item = this.cart.find(item => item.productId === productId);
        
        if (item) {
            console.log(`📦 Found item in cart:`, item);
            // Rimuovi e ri-aggiungi con la nuova quantità
            Database.removeFromCart(userId, productId);
            Database.addToCart(userId, productId, newQuantity);
            
            // Ricarica il carrello
            const updatedCart = Database.getCart(userId);
            this.cart = updatedCart.items || [];
            this.updateCartDisplay();
            console.log(`✅ Updated cart quantity: ${newQuantity} for product ${productId}`);
            
            // Trigger cart badge update in notification system
            if (window.NotificationSystem && NotificationSystem.refreshCartBadge) {
                NotificationSystem.refreshCartBadge();
            }
        } else {
            console.log(`❌ Product ${productId} not found in cart`);
        }
    },
    
    // Svuota il carrello
    clearCart() {
        if (!EudoraApp.currentUser) return;
        
        const userId = EudoraApp.currentUser.id;
        console.log(`🧹 Clearing cart for user ${userId}`);
        
        Database.clearCart(userId);
        
        // Ricarica il carrello dal database
        const updatedCart = Database.getCart(userId);
        this.cart = updatedCart.items || [];
        this.updateCartDisplay();
        Auth.showNotification('Carrello svuotato');
        
        // Trigger cart badge update in notification system
        if (window.NotificationSystem && NotificationSystem.refreshCartBadge) {
            NotificationSystem.refreshCartBadge();
        }
    },
    
    // Aggiorna la visualizzazione del carrello
    updateCartDisplay() {
        console.log('🔄 Updating cart display...', this.cart);
        
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        const totalItems = this.cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
        
        if (cartCount) {
            cartCount.textContent = totalItems;
        }
        
        // Update cart count in tab - ALWAYS show badge when items exist
        const cartTabCount = document.getElementById('cart-tab-count');
        if (cartTabCount) {
            if (totalItems > 0) {
                cartTabCount.textContent = totalItems > 99 ? '99+' : totalItems;
                cartTabCount.classList.remove('hidden');
                console.log(`🛒 Cart badge shown: ${cartTabCount.textContent} items`);
            } else {
                cartTabCount.classList.add('hidden');
                console.log('🛒 Cart badge hidden: no items');
            }
        } else {
            console.log('❌ Cart tab count element not found!');
        }
        
        if (cartItems) {
            if (this.cart.length === 0) {
                cartItems.innerHTML = ``;
            } else {
                cartItems.innerHTML = this.cart.map(item => {
                    // Ensure productId is valid and safe for use in onclick
                    const safeProductId = item.productId || item.id || 0;
                    return `
                    <div class="flex items-center justify-between py-3 border-b">
                        <div class="flex-1">
                            <h4 class="font-medium">${item.name || 'Prodotto senza nome'}</h4>
                            <p class="text-sm text-gray-600">€${(item.price || 0).toFixed(2)} x ${item.quantity || 0}</p>
                        </div>
                        <div class="flex items-center space-x-2">
                            <button onclick="Customer.updateCartQuantity('${safeProductId}', ${(item.quantity || 1) - 1})" 
                                    class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300">
                                <i class="fas fa-minus text-xs"></i>
                            </button>
                            <span class="w-8 text-center">${item.quantity || 0}</span>
                            <button onclick="Customer.updateCartQuantity('${safeProductId}', ${(item.quantity || 1) + 1})" 
                                    class="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600">
                                <i class="fas fa-plus text-xs"></i>
                            </button>
                            <button onclick="Customer.removeFromCart('${safeProductId}')" 
                                    class="ml-2 text-red-500 hover:text-red-700">
                                <i class="fas fa-trash text-sm"></i>
                            </button>
                        </div>
                    </div>
                `}).join('');
            }
        }
        
        if (cartTotal) {
            cartTotal.textContent = `€${(totalPrice + 2.50).toFixed(2)}`;
        }
        
        // Update cart subtotal
        const cartSubtotal = document.getElementById('cart-subtotal');
        if (cartSubtotal) {
            cartSubtotal.textContent = `€${totalPrice.toFixed(2)}`;
        }
        
        // Update delivery cost
        const cartDelivery = document.getElementById('cart-delivery');
        if (cartDelivery) {
            cartDelivery.textContent = '€2.50';
        }
        
        // Show/hide empty cart message
        const emptyCart = document.getElementById('empty-cart');
        if (emptyCart) {
            if (this.cart.length === 0) {
                emptyCart.classList.remove('hidden');
            } else {
                emptyCart.classList.add('hidden');
            }
        }
        
        // Update cart checkout section independently
        this.updateCartCheckoutSection();
        
        // Trigger cart badge update in notification system for persistence
        if (window.NotificationSystem && NotificationSystem.refreshCartBadge) {
            setTimeout(() => NotificationSystem.refreshCartBadge(), 100);
        }
    },
    
    // Aggiorna la sezione checkout del carrello con indirizzi e metodi di pagamento dell'utente
    updateCartCheckoutSection() {
        console.log('🔄 Updating cart checkout section...');
        
        if (!EudoraApp.currentUser) {
            console.log('❌ No current user for checkout section');
            return;
        }
        
        const addressContainer = document.getElementById('cart-delivery-address-container');
        const paymentContainer = document.getElementById('cart-payment-method-container');
        const checkoutButton = document.getElementById('checkout-button');
        
        // Update delivery addresses
        if (addressContainer) {
            if (this.addresses.length > 0) {
                addressContainer.innerHTML = `
                    <select id="cart-delivery-address" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="" disabled ${!this.getDefaultAddress() ? 'selected' : ''}>Seleziona indirizzo...</option>
                        ${this.addresses.map(address => `
                            <option value="${address.id}" ${address.isDefault ? 'selected' : ''}>
                                ${address.label || 'Indirizzo'} - ${address.street || ''}, ${address.city || ''} ${address.postalCode || address.zipCode || address.cap || ''}
                            </option>
                        `).join('')}
                    </select>
                `;
            } else {
                addressContainer.innerHTML = `
                    <div class="text-center py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">Nessun indirizzo salvato</p>
                        <button onclick="Customer.showAddAddressModal()" 
                                class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <i class="fas fa-plus mr-1"></i>Aggiungi indirizzo
                        </button>
                    </div>
                `;
            }
        }
        
        // Update payment methods
        if (paymentContainer) {
            if (this.paymentMethods.length > 0) {
                paymentContainer.innerHTML = `
                    <div class="space-y-2">
                        ${this.paymentMethods.map(payment => `
                            <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition ${payment.isDefault ? 'border-blue-500 bg-blue-50' : ''}">
                                <input type="radio" name="cart-payment-method" value="${payment.id}" 
                                       class="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                                       ${payment.isDefault ? 'checked' : ''}>
                                <div class="ml-3 flex items-center space-x-3 flex-1">
                                    <div class="w-8 h-6 ${this.getCardColor(payment.cardType || payment.type)} rounded flex items-center justify-center flex-shrink-0">
                                        <i class="${this.getPaymentIcon(payment.type)} text-white text-xs"></i>
                                    </div>
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-2">
                                            <span class="font-medium text-gray-800">${payment.label || this.getPaymentTypeLabel(payment.type)}</span>
                                            ${payment.isDefault ? '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">Predefinito</span>' : ''}
                                        </div>
                                        <span class="text-sm text-gray-600">${this.getPaymentDescription(payment)}</span>
                                    </div>
                                </div>
                            </label>
                        `).join('')}
                    </div>
                `;
            } else {
                paymentContainer.innerHTML = `
                    <div class="text-center py-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p class="text-sm text-gray-600 mb-2">Nessun metodo di pagamento salvato</p>
                        <button onclick="Customer.showAddPaymentModal()" 
                                class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            <i class="fas fa-plus mr-1"></i>Aggiungi metodo
                        </button>
                    </div>
                `;
            }
        }
        
        // Update checkout button state
        if (checkoutButton) {
            const hasAddress = this.addresses.length > 0;
            const hasPayment = this.paymentMethods.length > 0;
            const hasItems = this.cart.length > 0;
            
            if (hasAddress && hasPayment && hasItems) {
                checkoutButton.disabled = false;
                checkoutButton.classList.remove('bg-gray-300', 'cursor-not-allowed');
                checkoutButton.classList.add('bg-green-600', 'hover:bg-green-700');
            } else {
                checkoutButton.disabled = true;
                checkoutButton.classList.add('bg-gray-300', 'cursor-not-allowed');
                checkoutButton.classList.remove('bg-green-600', 'hover:bg-green-700');
            }
        }
        
        console.log('✅ Cart checkout section updated:', {
            addresses: this.addresses.length,
            paymentMethods: this.paymentMethods.length,
            cartItems: this.cart.length
        });
    },
    
    // Renderizza la sezione checkout nel carrello
    renderCartCheckoutSection() {
        if (!EudoraApp.currentUser) return '';
        
        return `
            <div class="border-t mt-4 pt-4 space-y-4">
                <!-- Selezione Indirizzo -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-map-marker-alt mr-1"></i>Indirizzo di consegna
                    </label>
                    ${this.addresses.length > 0 ? `
                        <select id="cart-address-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                            ${this.addresses.map(address => `
                                <option value="${address.id}" ${address.isDefault ? 'selected' : ''}>
                                    ${address.label} - ${address.street}, ${address.city}
                                </option>
                            `).join('')}
                        </select>
                    ` : `
                        <div class="text-center py-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p class="text-sm text-gray-600 mb-2">Nessun indirizzo salvato</p>
                            <button onclick="Customer.showAddAddressModal()" 
                                    class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                <i class="fas fa-plus mr-1"></i>Aggiungi indirizzo
                            </button>
                        </div>
                    `}
                </div>
                
                <!-- Selezione Metodo di Pagamento -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        <i class="fas fa-credit-card mr-1"></i>Metodo di pagamento
                    </label>
                    ${this.paymentMethods.length > 0 ? `
                        <div class="space-y-2">
                            ${this.paymentMethods.map(payment => `
                                <label class="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition ${payment.isDefault ? 'border-blue-500 bg-blue-50' : ''}">
                                    <input type="radio" name="cart-payment-method" value="${payment.id}" 
                                           class="h-4 w-4 text-blue-600 focus:ring-blue-500" 
                                           ${payment.isDefault ? 'checked' : ''}>
                                    <div class="ml-3 flex items-center space-x-3 flex-1">
                                        <div class="w-8 h-6 ${this.getCardColor(payment.cardType || payment.type)} rounded flex items-center justify-center flex-shrink-0">
                                            <i class="${this.getPaymentIcon(payment.type)} text-white text-xs"></i>
                                        </div>
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-2">
                                                <span class="font-medium text-gray-800">${payment.label}</span>
                                                ${payment.isDefault ? '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">Predefinito</span>' : ''}
                                            </div>
                                            <span class="text-sm text-gray-600">${payment.description || this.getPaymentDescription(payment)}</span>
                                        </div>
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p class="text-sm text-gray-600 mb-2">Nessun metodo di pagamento salvato</p>
                            <button onclick="Customer.showAddPaymentModal()" 
                                    class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                <i class="fas fa-plus mr-1"></i>Aggiungi metodo
                            </button>
                        </div>
                    `}
                </div>
                
                <!-- Riepilogo Costi -->
                <div class="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div class="flex justify-between text-sm">
                        <span>Subtotale:</span>
                        <span>€${this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span>Consegna:</span>
                        <span>€2.50</span>
                    </div>
                    <div class="flex justify-between font-semibold text-base border-t pt-2">
                        <span>Totale:</span>
                        <span>€${(this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) + 2.50).toFixed(2)}</span>
                    </div>
                </div>
                
                <!-- Pulsante Checkout -->
                <button onclick="Customer.proceedToCheckout()" 
                        class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium ${this.addresses.length === 0 || this.paymentMethods.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${this.addresses.length === 0 || this.paymentMethods.length === 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart mr-2"></i>Procedi all'ordine
                </button>
                
                ${this.addresses.length === 0 || this.paymentMethods.length === 0 ? `
                    <p class="text-xs text-gray-500 text-center">
                        Aggiungi un indirizzo e un metodo di pagamento per completare l'ordine
                    </p>
                ` : ''}
            </div>
        `;
    },
    
    // Carica il profilo utente
    loadProfile() {
        console.log('🔄 loadProfile() called...');
        
        if (!EudoraApp.currentUser) {
            console.error('❌ No current user available for loadProfile');
            
            // Try to get user from Auth
            if (typeof Auth !== 'undefined' && Auth.getCurrentUser) {
                const authUser = Auth.getCurrentUser();
                if (authUser) {
                    EudoraApp.currentUser = authUser;
                    console.log('✅ Restored user from Auth module:', authUser.email);
                } else {
                    // Show error message in profile section
                    const profileSection = document.getElementById('customer-profile');
                    if (profileSection) {
                        profileSection.innerHTML = `
                            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
                                <h3 class="text-lg font-semibold text-red-800 mb-2">Errore di Autenticazione</h3>
                                <p class="text-red-700 mb-4">
                                    Non è stato possibile caricare il profilo utente. 
                                    Effettua nuovamente il login.
                                </p>
                                <button onclick="window.location.href='login.html'" 
                                        class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition">
                                    Vai al Login
                                </button>
                            </div>
                        `;
                    }
                    return;
                }
            } else {
                console.error('❌ Auth module not available');
                return;
            }
        }
        
        console.log('👤 Loading user profile for:', EudoraApp.currentUser.email);
        
        // Carica indirizzi e metodi di pagamento aggiornati dal database
        const userId = EudoraApp.currentUser.id;
        
        try {
            // Carica gli indirizzi
            const addresses = Database.getUserAddresses(userId);
            this.addresses = addresses || [];
            console.log(`📍 Loaded ${this.addresses.length} addresses for profile`);
            
            // Carica i metodi di pagamento
            const paymentMethods = Database.getUserPaymentMethods(userId);
            this.paymentMethods = paymentMethods || [];
            console.log(`💳 Loaded ${this.paymentMethods.length} payment methods for profile`);
        } catch (error) {
            console.error('❌ Error loading addresses/payment methods for profile:', error);
            // Continua comunque con i dati esistenti
        }
        
        const profileSection = document.getElementById('customer-profile');
        if (!profileSection) {
            console.error('❌ Profile section element not found');
            return;
        }
        
        console.log('✅ Profile section found, generating content...');
        
        const user = EudoraApp.currentUser;
        
        // Genera direttamente il contenuto senza schermata di caricamento
        try {
                profileSection.innerHTML = `
                    <div class="bg-white rounded-lg shadow-md p-6">
                        <h3 class="text-lg font-semibold text-gray-800 mb-4">Informazioni Personali</h3>
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                                    <input type="text" id="user-firstname" value="${user.firstName || user.name || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Cognome</label>
                                    <input type="text" id="user-lastname" value="${user.lastName || user.surname || ''}" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input type="email" id="user-email" value="${user.email || ''}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Telefono</label>
                                <input type="tel" id="user-phone" value="${user.phone || ''}" 
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            </div>
                            <button onclick="Customer.saveProfile()" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                <i class="fas fa-save mr-2"></i>Salva Modifiche
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6 mt-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">Indirizzi di Consegna</h3>
                            <button onclick="Customer.showAddAddressModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                <i class="fas fa-plus mr-2"></i>Aggiungi Indirizzo
                            </button>
                        </div>
                        <div id="addresses-list">
                            ${this.renderAddressesList()}
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-lg shadow-md p-6 mt-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold text-gray-800">Metodi di Pagamento</h3>
                            <button onclick="Customer.showAddPaymentModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                <i class="fas fa-plus mr-2"></i>Aggiungi Metodo
                            </button>
                        </div>
                        <div id="payment-methods-list">
                            ${this.renderPaymentMethodsList()}
                        </div>
                    </div>
                `;
                
                console.log('✅ Profile content generated successfully');
                console.log('📝 User data used:', {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone,
                    addresses: this.addresses.length,
                    paymentMethods: this.paymentMethods.length
                });
                
            } catch (error) {
                console.error('❌ Error generating profile content:', error);
                profileSection.innerHTML = `
                    <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
                        <h3 class="text-lg font-semibold text-red-800 mb-2">Errore nel Caricamento</h3>
                        <p class="text-red-700 mb-4">
                            Si è verificato un errore durante il caricamento del profilo.
                        </p>
                        <button onclick="Customer.loadProfile()" 
                                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            Riprova
                        </button>
                    </div>
                `;
            }
    },
    
    // Salva le modifiche al profilo
    saveProfile() {
        if (!EudoraApp.currentUser) return;
        
        const firstName = document.getElementById('user-firstname').value;
        const lastName = document.getElementById('user-lastname').value;
        const email = document.getElementById('user-email').value;
        const phone = document.getElementById('user-phone').value;
        
        // Aggiorna l'utente corrente
        EudoraApp.currentUser.firstName = firstName;
        EudoraApp.currentUser.lastName = lastName;
        EudoraApp.currentUser.name = `${firstName} ${lastName}`;
        EudoraApp.currentUser.email = email;
        EudoraApp.currentUser.phone = phone;
        
        // Aggiorna nel database
        Database.updateUser(EudoraApp.currentUser.id, EudoraApp.currentUser);
        
        Auth.showNotification('Profilo aggiornato con successo');
        console.log('👤 Profile updated:', EudoraApp.currentUser);
    },
    
    // Renderizza la lista degli indirizzi
    renderAddressesList() {
        if (this.addresses.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-map-marker-alt text-4xl mb-3"></i>
                    <p>Nessun indirizzo salvato</p>
                </div>
            `;
        }
        
        return this.addresses.map(address => `
            <div class="border rounded-lg p-4 mb-3 ${address.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-medium text-gray-800">${address.label || address.type || 'Indirizzo'}</h4>
                        <p class="text-gray-600">${address.street || 'Via non specificata'}</p>
                        <p class="text-gray-600">${address.city || 'Città'}, ${address.zipCode || address.cap || address.postalCode || 'CAP'} ${address.province ? '(' + address.province + ')' : ''}</p>
                        ${address.isDefault ? '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-2">Predefinito</span>' : ''}
                    </div>
                    <div class="flex flex-col space-y-1">
                        ${!address.isDefault ? 
                            `<button onclick="Customer.setDefaultAddress('${address.id}')" 
                                     class="text-blue-600 hover:text-blue-800 text-xs"
                                     title="Imposta come predefinito">
                                <i class="fas fa-star"></i>
                            </button>` : ''}
                        <button onclick="Customer.editAddress('${address.id}')" 
                                class="text-gray-600 hover:text-gray-800 text-xs"
                                title="Modifica">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="Customer.deleteAddress('${address.id}')" 
                                class="text-red-600 hover:text-red-800 text-xs"
                                title="Elimina">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    // Renderizza la lista dei metodi di pagamento
    renderPaymentMethodsList() {
        if (this.paymentMethods.length === 0) {
            return `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-credit-card text-4xl mb-3"></i>
                    <p>Nessun metodo di pagamento salvato</p>
                    <p class="text-sm mt-2">Aggiungi un metodo di pagamento per completare i tuoi ordini</p>
                </div>
            `;
        }
        
        return this.paymentMethods.map(payment => {
            const iconClass = this.getPaymentIcon(payment.type);
            const typeLabel = this.getPaymentTypeLabel(payment.type);
            const cardColor = this.getCardColor(payment.cardType);
            
            return `
                <div class="border rounded-lg p-4 mb-3 ${payment.isDefault ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} hover:shadow-md transition-shadow">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start space-x-3">
                            <!-- Icona del metodo di pagamento -->
                            <div class="flex-shrink-0">
                                <div class="w-12 h-8 ${cardColor} rounded flex items-center justify-center">
                                    <i class="${iconClass} text-white text-sm"></i>
                                </div>
                            </div>
                            
                            <!-- Informazioni del metodo -->
                            <div class="flex-1">
                                <div class="flex items-center space-x-2 mb-1">
                                    <h4 class="font-semibold text-gray-800">${payment.label || typeLabel}</h4>
                                    ${payment.isDefault ? '<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded font-medium">Predefinito</span>' : ''}
                                </div>
                                
                                <p class="text-sm text-gray-600 mb-2">${payment.description || this.getPaymentDescription(payment)}</p>
                                
                                <!-- Dettagli specifici per tipo -->
                                ${this.renderPaymentDetails(payment)}
                                
                                <!-- Tipo di pagamento -->
                                <div class="flex items-center mt-2">
                                    <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">${typeLabel}</span>
                                    ${payment.type === 'card' && payment.expiryDate ? 
                                        `<span class="text-xs text-gray-500 ml-2">Scade: ${payment.expiryDate}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Azioni -->
                        <div class="flex flex-col space-y-1">
                            ${!payment.isDefault ? 
                                `<button onclick="Customer.setDefaultPaymentMethod('${payment.id}')" 
                                         class="text-blue-600 hover:text-blue-800 text-xs"
                                         title="Imposta come predefinito">
                                    <i class="fas fa-star"></i>
                                </button>` : ''}
                            <button onclick="Customer.editPaymentMethod('${payment.id}')" 
                                    class="text-gray-600 hover:text-gray-800 text-xs"
                                    title="Modifica">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="Customer.deletePaymentMethod('${payment.id}')" 
                                    class="text-red-600 hover:text-red-800 text-xs"
                                    title="Elimina">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Ottiene l'icona per il tipo di pagamento
    getPaymentIcon(type) {
        const icons = {
            'card': 'fas fa-credit-card',
            'paypal': 'fab fa-paypal',
            'cash': 'fas fa-money-bill-wave',
            'bank_transfer': 'fas fa-university',
            'apple_pay': 'fab fa-apple-pay',
            'google_pay': 'fab fa-google-pay'
        };
        return icons[type] || 'fas fa-credit-card';
    },

    // Ottiene il colore per il tipo di carta
    getCardColor(cardType) {
        const colors = {
            'visa': 'bg-blue-600',
            'mastercard': 'bg-red-500',
            'american_express': 'bg-green-600',
            'postepay': 'bg-yellow-500',
            'paypal': 'bg-blue-500',
            'cash': 'bg-green-500',
            'bank_transfer': 'bg-gray-600'
        };
        return colors[cardType] || 'bg-gray-500';
    },

    // Ottiene l'etichetta per il tipo di pagamento
    getPaymentTypeLabel(type) {
        const labels = {
            'card': 'Carta di Credito/Debito',
            'paypal': 'PayPal',
            'cash': 'Contrassegno',
            'bank_transfer': 'Bonifico Bancario',
            'apple_pay': 'Apple Pay',
            'google_pay': 'Google Pay'
        };
        return labels[type] || 'Altro';
    },

    // Ottiene la descrizione automatica per il pagamento
    getPaymentDescription(payment) {
        switch (payment.type) {
            case 'card':
                return `${payment.cardType ? payment.cardType.toUpperCase() : 'Carta'} ${payment.cardNumber || '**** ****'}`;
            case 'paypal':
                return payment.email || 'Account PayPal';
            case 'cash':
                return 'Pagamento in contanti alla consegna';
            case 'bank_transfer':
                return payment.bankName ? `${payment.bankName} - ${payment.iban ? payment.iban.substring(0, 10) + '...' : ''}` : 'Bonifico bancario';
            default:
                return 'Metodo di pagamento';
        }
    },

    // Renderizza i dettagli specifici per ogni tipo di pagamento
    renderPaymentDetails(payment) {
        switch (payment.type) {
            case 'card':
                return `
                    <div class="text-xs text-gray-500 space-y-1">
                        ${payment.cardHolder ? `<div><i class="fas fa-user mr-1"></i>${payment.cardHolder}</div>` : ''}
                        ${payment.cardNumber ? `<div><i class="fas fa-credit-card mr-1"></i>${payment.cardNumber}</div>` : ''}
                    </div>
                `;
            case 'paypal':
                return `
                    <div class="text-xs text-gray-500">
                        <div><i class="fas fa-envelope mr-1"></i>${payment.email || 'Account PayPal'}</div>
                    </div>
                `;
            case 'bank_transfer':
                return `
                    <div class="text-xs text-gray-500 space-y-1">
                        ${payment.bankName ? `<div><i class="fas fa-university mr-1"></i>${payment.bankName}</div>` : ''}
                        ${payment.iban ? `<div><i class="fas fa-credit-card mr-1"></i>${payment.iban}</div>` : ''}
                    </div>
                `;
            case 'cash':
                return `
                    <div class="text-xs text-gray-500">
                        <div><i class="fas fa-truck mr-1"></i>Pagamento alla consegna</div>
                    </div>
                `;
            default:
                return '';
        }
    },

    // Imposta un metodo di pagamento come predefinito
    setDefaultPaymentMethod(paymentId) {
        if (!EudoraApp.currentUser) return;
        
        console.log('💳 Setting default payment method:', paymentId);

        // Trova il metodo di pagamento
        const payment = this.paymentMethods.find(pm => pm.id === paymentId);
        if (!payment) {
            console.error('Payment method not found:', paymentId);
            Auth.showNotification('Metodo di pagamento non trovato', 'error');
            return;
        }

        // Aggiorna nel database
        const success = Database.updateUserPaymentMethod(EudoraApp.currentUser.id, paymentId, { isDefault: true });
        if (success) {
            // Aggiorna localmente
            this.paymentMethods.forEach(pm => pm.isDefault = false);
            payment.isDefault = true;
            this.loadProfile();
            Auth.showNotification('Metodo di pagamento predefinito aggiornato');
        } else {
            console.error('Failed to update default payment method:', paymentId);
            Auth.showNotification('Errore nell\'aggiornamento del metodo predefinito', 'error');
        }
    },

    // Modifica un metodo di pagamento (placeholder per funzionalità futura)
    editPaymentMethod(paymentId) {
        Auth.showNotification('Funzionalità di modifica in arrivo!', 'info');
        // TODO: Implementare modal di modifica
    },
    
    // Mostra modal per aggiungere un indirizzo
    showAddAddressModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 class="text-lg font-semibold mb-4">Aggiungi Nuovo Indirizzo</h3>
                <form id="add-address-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Etichetta</label>
                        <input type="text" id="address-label" placeholder="es. Casa, Ufficio" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Indirizzo</label>
                        <input type="text" id="address-street" placeholder="Via, Numero civico" required
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Città</label>
                            <input type="text" id="address-city" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">CAP</label>
                            <input type="text" id="address-cap" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Provincia</label>
                            <input type="text" id="address-province" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Regione</label>
                            <input type="text" id="address-region" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="address-default" class="mr-2">
                        <label for="address-default" class="text-sm text-gray-700">Imposta come indirizzo predefinito</label>
                    </div>
                    <div class="flex space-x-3 pt-4">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition">
                            Annulla
                        </button>
                        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                            Salva
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('add-address-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addAddress();
            modal.remove();
        });
    },
    
    // Aggiunge un nuovo indirizzo
    addAddress() {
        if (!EudoraApp.currentUser) return;
        
        const newAddress = {
            label: document.getElementById('address-label').value,
            street: document.getElementById('address-street').value,
            city: document.getElementById('address-city').value,
            cap: document.getElementById('address-cap').value,
            province: document.getElementById('address-province').value,
            region: document.getElementById('address-region').value,
            isDefault: document.getElementById('address-default').checked
        };
        
        // Utilizza la nuova funzione del Database
        const savedAddress = Database.addUserAddress(EudoraApp.currentUser.id, newAddress);
        if (savedAddress) {
            this.addresses.push(savedAddress);
            this.loadProfile(); // Ricarica il profilo
            Auth.showNotification('Indirizzo aggiunto con successo');
        } else {
            Auth.showNotification('Errore nell\'aggiunta dell\'indirizzo', 'error');
        }
    },
    
    // Imposta un indirizzo come predefinito
    setDefaultAddress(addressId) {
        if (!EudoraApp.currentUser) return;
        
        console.log('🏠 Setting default address:', addressId);

        // Trova l'indirizzo
        const address = this.addresses.find(addr => addr.id === addressId);
        if (!address) {
            console.error('Address not found:', addressId);
            Auth.showNotification('Indirizzo non trovato', 'error');
            return;
        }

        // Aggiorna nel database (dobbiamo implementare questo metodo nel database)
        // Per ora aggiorniamo localmente
        this.addresses.forEach(addr => addr.isDefault = false);
        address.isDefault = true;
        
        // Aggiorna l'utente nel database
        const user = Database.getUserById(EudoraApp.currentUser.id);
        if (user && user.addresses) {
            user.addresses.forEach(addr => addr.isDefault = false);
            const userAddress = user.addresses.find(addr => addr.id === addressId);
            if (userAddress) {
                userAddress.isDefault = true;
                Database.updateUser(EudoraApp.currentUser.id, user);
            }
        }
        
        this.loadProfile();
        Auth.showNotification('Indirizzo predefinito aggiornato');
    },

    // Modifica un indirizzo (placeholder per funzionalità futura)
    editAddress(addressId) {
        Auth.showNotification('Funzionalità di modifica in arrivo!', 'info');
        // TODO: Implementare modal di modifica indirizzo
    },
    
    // Elimina un indirizzo
    deleteAddress(addressId) {
        console.log('🗑️ Deleting address:', addressId);
        if (confirm('Sei sicuro di voler eliminare questo indirizzo?')) {
            const success = Database.removeUserAddress(EudoraApp.currentUser.id, addressId);
            if (success) {
                this.addresses = this.addresses.filter(addr => addr.id !== addressId);
                this.loadProfile();
                Auth.showNotification('Indirizzo eliminato');
            } else {
                console.error('Failed to delete address:', addressId);
                Auth.showNotification('Errore nell\'eliminazione dell\'indirizzo', 'error');
            }
        }
    },
    
    // Mostra modal per aggiungere un metodo di pagamento
    showAddPaymentModal() {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-screen overflow-y-auto">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-semibold text-gray-800">Aggiungi Metodo di Pagamento</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="add-payment-form" class="space-y-6">
                    <!-- Selezione Tipo -->
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-3">Seleziona Tipo di Pagamento</label>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="payment-type-option border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition" data-type="cash">
                                <div class="text-center">
                                    <div class="w-12 h-8 bg-green-500 rounded mx-auto mb-2 flex items-center justify-center">
                                        <i class="fas fa-money-bill-wave text-white"></i>
                                    </div>
                                    <div class="text-sm font-medium">Contrassegno</div>
                                    <div class="text-xs text-gray-500">Pagamento alla consegna</div>
                                </div>
                            </div>
                            
                            <div class="payment-type-option border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition" data-type="card">
                                <div class="text-center">
                                    <div class="w-12 h-8 bg-blue-600 rounded mx-auto mb-2 flex items-center justify-center">
                                        <i class="fas fa-credit-card text-white"></i>
                                    </div>
                                    <div class="text-sm font-medium">Carta</div>
                                    <div class="text-xs text-gray-500">Credito/Debito</div>
                                </div>
                            </div>
                            
                            <div class="payment-type-option border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition" data-type="paypal">
                                <div class="text-center">
                                    <div class="w-12 h-8 bg-blue-500 rounded mx-auto mb-2 flex items-center justify-center">
                                        <i class="fab fa-paypal text-white"></i>
                                    </div>
                                    <div class="text-sm font-medium">PayPal</div>
                                    <div class="text-xs text-gray-500">Account PayPal</div>
                                </div>
                            </div>
                            
                            <div class="payment-type-option border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-300 transition" data-type="bank_transfer">
                                <div class="text-center">
                                    <div class="w-12 h-8 bg-gray-600 rounded mx-auto mb-2 flex items-center justify-center">
                                        <i class="fas fa-university text-white"></i>
                                    </div>
                                    <div class="text-sm font-medium">Bonifico</div>
                                    <div class="text-xs text-gray-500">Bancario</div>
                                </div>
                            </div>
                        </div>
                        <input type="hidden" id="payment-type" required>
                    </div>

                    <!-- Campi dinamici basati sul tipo -->
                    <div id="payment-details" class="space-y-4 hidden">
                        <!-- Base fields -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nome/Etichetta *</label>
                            <input type="text" id="payment-label" required
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                   placeholder="es. Carta principale, PayPal personale">
                        </div>

                        <!-- Card specific fields -->
                        <div id="card-fields" class="space-y-4 hidden">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Tipo Carta</label>
                                    <select id="card-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="visa">Visa</option>
                                        <option value="mastercard">Mastercard</option>
                                        <option value="american_express">American Express</option>
                                        <option value="postepay">Postepay</option>
                                        <option value="other">Altro</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Ultime 4 cifre</label>
                                    <input type="text" id="card-last-digits" maxlength="4" pattern="[0-9]{4}"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="1234">
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Scadenza</label>
                                    <input type="text" id="card-expiry" placeholder="MM/AA" maxlength="5"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Intestatario</label>
                                    <input type="text" id="card-holder"
                                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="Nome come sulla carta">
                                </div>
                            </div>
                        </div>

                        <!-- PayPal specific fields -->
                        <div id="paypal-fields" class="space-y-4 hidden">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Email PayPal</label>
                                <input type="email" id="paypal-email"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="email@example.com">
                            </div>
                        </div>

                        <!-- Bank transfer specific fields -->
                        <div id="bank-fields" class="space-y-4 hidden">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nome Banca</label>
                                <input type="text" id="bank-name"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="es. Intesa Sanpaolo">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">IBAN</label>
                                <input type="text" id="bank-iban" maxlength="27"
                                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                       placeholder="IT60 X054 2811 1010 0000 0123 456">
                            </div>
                        </div>

                        <!-- Cash specific info -->
                        <div id="cash-fields" class="hidden">
                            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div class="flex items-start">
                                    <i class="fas fa-info-circle text-yellow-600 mt-0.5 mr-2"></i>
                                    <div class="text-sm text-yellow-800">
                                        <p class="font-medium mb-1">Pagamento in Contrassegno</p>
                                        <p>Pagherai direttamente al momento della consegna. Potrebbero essere applicate commissioni aggiuntive.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Default checkbox -->
                        <div class="flex items-center pt-2">
                            <input type="checkbox" id="payment-default" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                            <label for="payment-default" class="ml-2 text-sm text-gray-700">Imposta come metodo predefinito</label>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex space-x-3 pt-4">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-medium">
                            <i class="fas fa-times mr-2"></i>Annulla
                        </button>
                        <button type="submit" id="save-payment-btn" disabled
                                class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-300 disabled:cursor-not-allowed">
                            <i class="fas fa-save mr-2"></i>Salva Metodo
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.setupPaymentModalLogic(modal);
    },

    // Configura la logica del modal di pagamento
    setupPaymentModalLogic(modal) {
        const typeOptions = modal.querySelectorAll('.payment-type-option');
        const paymentTypeInput = modal.querySelector('#payment-type');
        const paymentDetails = modal.querySelector('#payment-details');
        const saveBtn = modal.querySelector('#save-payment-btn');
        
        // Gestione selezione tipo
        typeOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove selection from all options
                typeOptions.forEach(opt => {
                    opt.classList.remove('border-blue-500', 'bg-blue-50');
                    opt.classList.add('border-gray-200');
                });
                
                // Select current option
                option.classList.remove('border-gray-200');
                option.classList.add('border-blue-500', 'bg-blue-50');
                
                const type = option.dataset.type;
                paymentTypeInput.value = type;
                
                // Show details section
                paymentDetails.classList.remove('hidden');
                
                // Hide all type-specific fields
                modal.querySelectorAll('#card-fields, #paypal-fields, #bank-fields, #cash-fields').forEach(field => {
                    field.classList.add('hidden');
                });
                
                // Show relevant fields
                modal.querySelector(`#${type}-fields`).classList.remove('hidden');
                
                // Enable save button
                saveBtn.disabled = false;
                
                // Set default label
                const labels = {
                    'cash': 'Contrassegno',
                    'card': 'Carta di Credito',
                    'paypal': 'PayPal',
                    'bank_transfer': 'Bonifico Bancario'
                };
                modal.querySelector('#payment-label').value = labels[type] || '';
            });
        });
        
        // Auto-format card expiry
        const expiryInput = modal.querySelector('#card-expiry');
        if (expiryInput) {
            expiryInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length >= 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2, 4);
                }
                e.target.value = value;
            });
        }
        
        // Auto-format IBAN
        const ibanInput = modal.querySelector('#bank-iban');
        if (ibanInput) {
            ibanInput.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\s/g, '').toUpperCase();
                // Add spaces every 4 characters
                value = value.replace(/(.{4})/g, '$1 ').trim();
                e.target.value = value;
            });
        }
        
        // Form submission
        modal.querySelector('#add-payment-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addPaymentMethod();
            modal.remove();
        });
    },
    
    // Aggiunge un nuovo metodo di pagamento
    addPaymentMethod() {
        if (!EudoraApp.currentUser) return;
        
        const type = document.getElementById('payment-type').value;
        const label = document.getElementById('payment-label').value;
        
        // Base payment object
        const newPayment = {
            type: type,
            label: label,
            isDefault: document.getElementById('payment-default').checked
        };

        // Add type-specific fields
        switch (type) {
            case 'card':
                const cardType = document.getElementById('card-type').value;
                const lastDigits = document.getElementById('card-last-digits').value;
                const expiry = document.getElementById('card-expiry').value;
                const holder = document.getElementById('card-holder').value;
                
                newPayment.cardType = cardType;
                newPayment.cardNumber = lastDigits ? `**** **** **** ${lastDigits}` : '';
                newPayment.expiryDate = expiry;
                newPayment.cardHolder = holder;
                newPayment.description = `${cardType.charAt(0).toUpperCase() + cardType.slice(1)} **** ${lastDigits}`;
                break;
                
            case 'paypal':
                const email = document.getElementById('paypal-email').value;
                newPayment.email = email;
                newPayment.description = email;
                break;
                
            case 'bank_transfer':
                const bankName = document.getElementById('bank-name').value;
                const iban = document.getElementById('bank-iban').value;
                newPayment.bankName = bankName;
                newPayment.iban = iban;
                newPayment.description = `${bankName} - ${iban ? iban.substring(0, 10) + '...' : ''}`;
                break;
                
            case 'cash':
                newPayment.description = 'Pagamento in contanti alla consegna';
                break;
                
            default:
                newPayment.description = 'Metodo di pagamento';
        }
        
        console.log('💳 Adding payment method:', newPayment);
        
        // Utilizza la nuova funzione del Database
        const savedPayment = Database.addUserPaymentMethod(EudoraApp.currentUser.id, newPayment);
        if (savedPayment) {
            this.paymentMethods.push(savedPayment);
            this.loadProfile(); // Ricarica il profilo
            Auth.showNotification('Metodo di pagamento aggiunto con successo');
        } else {
            Auth.showNotification('Errore nell\'aggiunta del metodo di pagamento', 'error');
        }
    },
    
    // Elimina un metodo di pagamento
    deletePaymentMethod(paymentId) {
        console.log('🗑️ Deleting payment method:', paymentId);
        if (confirm('Sei sicuro di voler eliminare questo metodo di pagamento?')) {
            const success = Database.removeUserPaymentMethod(EudoraApp.currentUser.id, paymentId);
            if (success) {
                this.paymentMethods = this.paymentMethods.filter(pm => pm.id !== paymentId);
                this.loadProfile();
                Auth.showNotification('Metodo di pagamento eliminato');
            } else {
                console.error('Failed to delete payment method:', paymentId);
                Auth.showNotification('Errore nell\'eliminazione del metodo di pagamento', 'error');
            }
        }
    },
    
    // Procede al checkout creando l'ordine con i dati selezionati nel carrello
    proceedToCheckout() {
        if (!EudoraApp.currentUser || this.cart.length === 0) {
            Auth.showNotification('Carrello vuoto o utente non autenticato', 'error');
            return;
        }
        
        // Ottieni indirizzo selezionato
        const addressSelect = document.getElementById('cart-delivery-address');
        const selectedAddressId = addressSelect ? addressSelect.value : null;
        const selectedAddress = this.addresses.find(addr => addr.id == selectedAddressId);
        
        // Ottieni metodo di pagamento selezionato
        const paymentRadios = document.querySelectorAll('input[name="cart-payment-method"]');
        let selectedPaymentId = null;
        
        for (const radio of paymentRadios) {
            if (radio.checked) {
                selectedPaymentId = radio.value;
                break;
            }
        }
        
        const selectedPayment = this.paymentMethods.find(pm => pm.id == selectedPaymentId);
        
        if (!selectedAddress) {
            Auth.showNotification('Seleziona un indirizzo di consegna', 'error');
            return;
        }
        
        if (!selectedPayment) {
            Auth.showNotification('Seleziona un metodo di pagamento', 'error');
            return;
        }
        
        // Get special instructions if any
        const specialInstructions = document.getElementById('cart-special-instructions');
        const notes = specialInstructions ? specialInstructions.value.trim() : '';
        
        // Calcola totali
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const deliveryFee = 3.50; // Updated to match the UI
        const total = subtotal + deliveryFee;
        
        // Crea l'ordine
        const order = {
            customerId: EudoraApp.currentUser.id,
            customerName: `${EudoraApp.currentUser.firstName} ${EudoraApp.currentUser.lastName}`,
            customerPhone: EudoraApp.currentUser.phone,
            pharmacyId: 1, // Default pharmacy per ora
            pharmacyName: 'Farmacia Centrale Milano',
            items: this.cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                requiresPrescription: false // Da implementare se necessario
            })),
            subtotal: subtotal,
            deliveryFee: deliveryFee,
            total: total,
            status: 'pending',
            deliveryAddress: {
                id: selectedAddress.id,
                label: selectedAddress.label,
                street: selectedAddress.street,
                city: selectedAddress.city,
                zipCode: selectedAddress.zipCode || selectedAddress.cap || selectedAddress.postalCode,
                province: selectedAddress.province
            },
            paymentMethod: {
                id: selectedPayment.id,
                type: selectedPayment.type,
                label: selectedPayment.label,
                description: this.getPaymentDescription(selectedPayment)
            },
            notes: notes,
            createdAt: new Date().toISOString()
        };
        
        console.log('🛒 Creating order from cart:', order);
        
        try {
            // Crea l'ordine nel database
            const createdOrder = Database.createOrder(order);
            
            if (createdOrder) {
                // Aggiorna la lista ordini locale
                this.orders.push(createdOrder);
                
                // Ricarica gli ordini dal database per assicurarsi che siano sincronizzati
                try {
                    const userId = EudoraApp.currentUser.id;
                    if (typeof Database.getOrdersByUser === 'function') {
                        const updatedOrders = Database.getOrdersByUser(userId);
                        this.orders = updatedOrders || [];
                        console.log(`📋 Reloaded ${this.orders.length} orders after checkout`);
                    } else if (typeof Database.getAllOrders === 'function') {
                        // Fallback: ottieni tutti gli ordini e filtra
                        const allOrders = Database.getAllOrders();
                        this.orders = allOrders.filter(order => 
                            order.customerId == userId || order.userId == userId
                        );
                        console.log(`📋 Reloaded ${this.orders.length} orders via fallback method`);
                    }
                } catch (error) {
                    console.error('❌ Error reloading orders after checkout:', error);
                }
                
                // Svuota il carrello
                this.clearCart();
                
                // Mostra notifica di successo
                Auth.showNotification(`Ordine #${createdOrder.orderNumber} creato con successo!`, 'success');
                
                console.log('✅ Order created successfully:', createdOrder);
                
                // Vai alla sezione ordini se disponibile
                if (typeof showCustomerSection === 'function') {
                    showCustomerSection('orders');
                    // Assicurati che gli ordini siano visualizzati correttamente
                    setTimeout(() => {
                        this.loadOrders();
                    }, 100);
                } else if (typeof showSection === 'function') {
                    showSection('orders');
                    // Assicurati che gli ordini siano visualizzati correttamente
                    setTimeout(() => {
                        this.loadOrders();
                    }, 100);
                } else {
                    // Fallback: prova a mostrare la sezione ordini manualmente
                    const ordersSection = document.getElementById('customer-orders');
                    if (ordersSection) {
                        // Nasconde tutte le sezioni
                        const allSections = document.querySelectorAll('.customer-section');
                        allSections.forEach(section => section.classList.add('hidden'));
                        // Mostra la sezione ordini
                        ordersSection.classList.remove('hidden');
                        // Carica e visualizza gli ordini
                        this.loadOrders();
                    }
                }
            } else {
                throw new Error('Failed to create order in database');
            }
        } catch (error) {
            console.error('❌ Error creating order:', error);
            Auth.showNotification('Errore nella creazione dell\'ordine. Riprova.', 'error');
        }
    },
    
    // Carica e visualizza gli ordini
    loadOrders() {
        console.log('📋 Loading customer orders...');
        console.log('📊 Current orders array:', this.orders);
        console.log('📊 Orders array length:', this.orders.length);
        
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) {
            console.error('❌ Orders list container not found');
            return;
        }
        
        console.log('✅ Orders list container found');
        
        // Inizializza i filtri avanzati se non esistono già
        this.initializeAdvancedFiltersUI();
        
        if (this.orders.length === 0) {
            console.log('⚠️ No orders found, showing empty message');
            ordersList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-shopping-bag text-4xl mb-3"></i>
                    <p>Nessun ordine trovato</p>
                    <p class="text-sm mt-2">I tuoi ordini appariranno qui una volta effettuati.</p>
                    <button onclick="showCustomerSection('shop')" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-store mr-2"></i>Inizia a fare Shopping
                    </button>
                </div>
            `;
            return;
        }

        console.log('✅ Rendering orders...');
        this.renderOrders();
        this.updateOrderStats();
    },

    // Inizializza l'interfaccia dei filtri avanzati
    initializeAdvancedFiltersUI() {
        const ordersSection = document.getElementById('customer-orders');
        if (!ordersSection) {
            console.error('❌ Orders section not found');
            return;
        }
        
        // Verifica se i filtri sono già stati aggiunti
        const existingFilters = ordersSection.querySelector('#toggle-advanced-filters');
        if (existingFilters) {
            console.log('✅ Advanced filters already initialized');
            return;
        }
        
        // Trova il contenitore degli ordini e inserisci i filtri prima
        const ordersList = document.getElementById('orders-list');
        if (ordersList) {
            const filtersHTML = this.renderAdvancedFiltersUI();
            ordersList.insertAdjacentHTML('beforebegin', filtersHTML);
            console.log('✅ Advanced filters UI initialized');
        }
    },

    // Renderizza gli ordini (con supporto per filtri)
    renderOrders(filter = 'all', advancedFilters = {}) {
        console.log('🎨 Rendering orders with filter:', filter, 'and advanced filters:', advancedFilters);
        
        const ordersList = document.getElementById('orders-list');
        if (!ordersList) {
            console.error('❌ Orders list element not found in renderOrders');
            return;
        }

        let filteredOrders = [...this.orders];
        console.log('📊 Total orders before filtering:', filteredOrders.length);

        // Applica filtro base per stato
        if (filter !== 'all') {
            switch(filter) {
                case 'active':
                    filteredOrders = filteredOrders.filter(order => 
                        ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(order.status)
                    );
                    break;
                case 'delivered':
                    filteredOrders = filteredOrders.filter(order => order.status === 'delivered');
                    break;
                case 'cancelled':
                    filteredOrders = filteredOrders.filter(order => order.status === 'cancelled');
                    break;
            }
        }

        // Applica filtri avanzati
        if (advancedFilters.dateRange) {
            const { startDate, endDate } = advancedFilters.dateRange;
            if (startDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) >= new Date(startDate)
                );
            }
            if (endDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) <= new Date(endDate + 'T23:59:59')
                );
            }
        }

        // Filtro per periodo di tempo predefinito
        if (advancedFilters.timePeriod) {
            const now = new Date();
            let startDate;
            
            switch(advancedFilters.timePeriod) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                    startDate = new Date(now.getFullYear(), quarterStart, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }
            
            if (startDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) >= startDate
                );
            }
        }

        // Filtro per range di prezzo
        if (advancedFilters.priceRange) {
            const { minPrice, maxPrice } = advancedFilters.priceRange;
            if (minPrice !== undefined && minPrice !== '') {
                filteredOrders = filteredOrders.filter(order => order.total >= parseFloat(minPrice));
            }
            if (maxPrice !== undefined && maxPrice !== '') {
                filteredOrders = filteredOrders.filter(order => order.total <= parseFloat(maxPrice));
            }
        }

        // Filtro per farmacia
        if (advancedFilters.pharmacy && advancedFilters.pharmacy !== 'all') {
            filteredOrders = filteredOrders.filter(order => 
                order.pharmacyId == advancedFilters.pharmacy || 
                order.pharmacyName?.toLowerCase().includes(advancedFilters.pharmacy.toLowerCase())
            );
        }

        // Ordinamento
        if (advancedFilters.sortBy) {
            filteredOrders.sort((a, b) => {
                switch(advancedFilters.sortBy) {
                    case 'date_desc':
                        return new Date(b.createdAt) - new Date(a.createdAt);
                    case 'date_asc':
                        return new Date(a.createdAt) - new Date(b.createdAt);
                    case 'price_desc':
                        return b.total - a.total;
                    case 'price_asc':
                        return a.total - b.total;
                    case 'status':
                        return a.status.localeCompare(b.status);
                    default:
                        return 0;
                }
            });
        }

        console.log('📊 Filtered orders count:', filteredOrders.length);

        if (filteredOrders.length === 0) {
            console.log('⚠️ No filtered orders found, showing filter message');
            ordersList.innerHTML = `
                <div class="text-center py-12 bg-white rounded-lg shadow-md">
                    <i class="fas fa-filter text-gray-300 text-6xl mb-4"></i>
                    <h4 class="text-lg font-medium text-gray-600 mb-2">Nessun ordine trovato</h4>
                    <p class="text-gray-500 mb-6">Non ci sono ordini per questo filtro</p>
                    <button onclick="Customer.filterOrders('all')" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
                        <i class="fas fa-list mr-2"></i>Mostra Tutti
                    </button>
                </div>
            `;
            return;
        }
        
        console.log('✅ Rendering', filteredOrders.length, 'orders...');
        
        // Aggiorna le statistiche dei filtri
        this.updateFilteredStatistics(filteredOrders);
        
        ordersList.innerHTML = filteredOrders.map(order => {
            const orderPayment = this.getRandomPaymentMethodForOrder(order);
            const isActiveOrder = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(order.status);
            
            return `
            <div class="bg-white rounded-lg shadow-md p-6 mb-4 ${this.getOrderCardClass(order.status)}">
                <!-- Header dell'ordine -->
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4">
                    <div class="mb-3 sm:mb-0">
                        <h3 class="text-lg font-semibold text-gray-800">Ordine #${order.id}</h3>
                        <p class="text-sm text-gray-600">${new Date(order.createdAt).toLocaleDateString('it-IT')}</p>
                    </div>
                    <div class="flex justify-between sm:text-right sm:block">
                        <span class="inline-block px-3 py-1 rounded-full text-sm font-medium ${this.getStatusClass(order.status)}">
                            ${this.getStatusText(order.status)}
                        </span>
                        <p class="text-lg font-bold text-gray-800 sm:mt-1">€${order.total.toFixed(2)}</p>
                    </div>
                </div>
                
                <!-- Prodotti -->
                <div class="border-t pt-4 mb-4">
                    <h4 class="font-medium text-gray-700 mb-3">Prodotti:</h4>
                    <div class="space-y-2">
                        ${order.items.map(item => `
                            <div class="flex justify-between items-center text-sm">
                                <div class="flex-1 mr-3">
                                    <span class="block font-medium">${item.name}</span>
                                    <span class="text-gray-500 text-xs">Quantità: ${item.quantity}</span>
                                </div>
                                <span class="font-semibold">€${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Dettagli ordine -->
                <div class="border-t pt-4">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <!-- Informazioni consegna -->
                        <div class="space-y-3 text-sm">
                            <div class="flex items-start">
                                <i class="fas fa-store text-gray-400 mr-2 mt-0.5" aria-hidden="true"></i>
                                <div>
                                    <span class="font-medium text-gray-700">Farmacia:</span>
                                    <span class="block text-gray-600">${order.pharmacyName || 'Farmacia Centrale'}</span>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <i class="fas fa-map-marker-alt text-gray-400 mr-2 mt-0.5" aria-hidden="true"></i>
                                <div>
                                    <span class="font-medium text-gray-700">Consegna:</span>
                                    <span class="block text-gray-600">${typeof order.deliveryAddress === 'object' ? 
                                        `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : 
                                        order.deliveryAddress || 'Indirizzo non specificato'}</span>
                                </div>
                            </div>
                            <div class="flex items-start">
                                <i class="${orderPayment.icon} ${orderPayment.color} mr-2 mt-0.5" aria-hidden="true"></i>
                                <div>
                                    <span class="font-medium text-gray-700">Pagamento:</span>
                                    <span class="block text-gray-600">${orderPayment.label}</span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Azioni ordine -->
                        <div class="flex flex-col lg:items-end space-y-2">
                            ${isActiveOrder ? 
                                `<button 
                                    onclick="Customer.openMapModal('${order.id}')" 
                                    class="w-full lg:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                    aria-label="Apri mappa per ordine ${order.id}">
                                    <i class="fas fa-map mr-2" aria-hidden="true"></i>Apri Mappa
                                 </button>` : ''}
                            ${order.status === 'pending' || order.status === 'accepted' ? 
                                `<button 
                                    onclick="Customer.confirmCancelOrder('${order.id}')" 
                                    class="w-full lg:w-auto bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    aria-label="Annulla ordine ${order.id}">
                                    <i class="fas fa-times mr-2" aria-hidden="true"></i>Annulla Ordine
                                 </button>` : ''}
                            ${order.status === 'delivered' ? 
                                `<button 
                                    onclick="Customer.reorderItems('${order.id}')" 
                                    class="w-full lg:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    aria-label="Riordina gli stessi prodotti dell'ordine ${order.id}">
                                    <i class="fas fa-redo mr-2" aria-hidden="true"></i>Riordina
                                 </button>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `}).join('');
    },

    // Filtra gli ordini per stato
    filterOrders(status) {
        console.log('🔍 Filtering orders by status:', status);
        
        // Aggiorna lo stato visivo dei filtri
        const filterButtons = document.querySelectorAll('.order-filter');
        filterButtons.forEach(button => {
            // Reset to inactive state
            button.classList.remove('active', 'bg-blue-600', 'text-white');
            button.classList.add('bg-gray-100', 'text-gray-700');
            button.setAttribute('aria-pressed', 'false');
        });
        
        // Attiva il filtro selezionato
        const activeButton = Array.from(filterButtons).find(button => {
            const buttonText = button.textContent.trim().toLowerCase();
            return (
                (status === 'all' && buttonText.includes('tutti')) ||
                (status === 'active' && buttonText.includes('attivi')) ||
                (status === 'delivered' && buttonText.includes('consegnati')) ||
                (status === 'cancelled' && buttonText.includes('annullati'))
            );
        });
        
        if (activeButton) {
            activeButton.classList.remove('bg-gray-100', 'text-gray-700');
            activeButton.classList.add('active', 'bg-blue-600', 'text-white');
            activeButton.setAttribute('aria-pressed', 'true');
        }
        
        // Renderizza gli ordini filtrati
        this.renderOrders(status);
        
        // Aggiorna le statistiche
        this.updateOrderStats();
    },

    // Applica filtri avanzati agli ordini
    applyAdvancedFilters() {
        console.log('🔍 Applying advanced filters...');
        
        // Raccogli i valori dai filtri
        const advancedFilters = this.getAdvancedFilterValues();
        console.log('📋 Advanced filters:', advancedFilters);
        
        // Ottieni il filtro di stato corrente
        const currentStatusFilter = this.getCurrentStatusFilter();
        
        // Applica i filtri
        this.renderOrders(currentStatusFilter, advancedFilters);
        
        // Aggiorna le statistiche con i filtri applicati
        this.updateOrderStats();
        
        // Mostra notifica con il numero di risultati
        const filteredCount = this.getFilteredOrdersCount(currentStatusFilter, advancedFilters);
        Auth.showNotification(`Filtri applicati: ${filteredCount} ordini trovati`, 'info');
    },

    // Raccoglie i valori dai controlli di filtro avanzato
    getAdvancedFilterValues() {
        const filters = {};
        
        // Filtro per periodo di tempo predefinito
        const timePeriodSelect = document.getElementById('filter-time-period');
        if (timePeriodSelect && timePeriodSelect.value !== 'all') {
            filters.timePeriod = timePeriodSelect.value;
        }
        
        // Filtro per range di date personalizzato
        const startDateInput = document.getElementById('filter-start-date');
        const endDateInput = document.getElementById('filter-end-date');
        if ((startDateInput && startDateInput.value) || (endDateInput && endDateInput.value)) {
            filters.dateRange = {
                startDate: startDateInput?.value || '',
                endDate: endDateInput?.value || ''
            };
        }
        
        // Filtro per range di prezzo
        const minPriceInput = document.getElementById('filter-min-price');
        const maxPriceInput = document.getElementById('filter-max-price');
        if ((minPriceInput && minPriceInput.value) || (maxPriceInput && maxPriceInput.value)) {
            filters.priceRange = {
                minPrice: minPriceInput?.value || '',
                maxPrice: maxPriceInput?.value || ''
            };
        }
        
        // Filtro per farmacia
        const pharmacySelect = document.getElementById('filter-pharmacy');
        if (pharmacySelect && pharmacySelect.value !== 'all') {
            filters.pharmacy = pharmacySelect.value;
        }
        
        // Ordinamento
        const sortSelect = document.getElementById('filter-sort');
        if (sortSelect && sortSelect.value) {
            filters.sortBy = sortSelect.value;
        }
        
        return filters;
    },

    // Ottiene il filtro di stato correntemente attivo
    getCurrentStatusFilter() {
        const activeButton = document.querySelector('.order-filter.active');
        if (!activeButton) return 'all';
        
        const buttonText = activeButton.textContent.trim().toLowerCase();
        if (buttonText.includes('attivi')) return 'active';
        if (buttonText.includes('consegnati')) return 'delivered';
        if (buttonText.includes('annullati')) return 'cancelled';
        return 'all';
    },

    // Conta gli ordini filtrati senza modificare la visualizzazione
    getFilteredOrdersCount(statusFilter = 'all', advancedFilters = {}) {
        let filteredOrders = [...this.orders];
        
        // Applica filtro di stato
        if (statusFilter !== 'all') {
            switch(statusFilter) {
                case 'active':
                    filteredOrders = filteredOrders.filter(order => 
                        ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(order.status)
                    );
                    break;
                case 'delivered':
                    filteredOrders = filteredOrders.filter(order => order.status === 'delivered');
                    break;
                case 'cancelled':
                    filteredOrders = filteredOrders.filter(order => order.status === 'cancelled');
                    break;
            }
        }
        
        // Applica filtri avanzati (stesso codice di renderOrders)
        if (advancedFilters.dateRange) {
            const { startDate, endDate } = advancedFilters.dateRange;
            if (startDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) >= new Date(startDate)
                );
            }
            if (endDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) <= new Date(endDate + 'T23:59:59')
                );
            }
        }
        
        if (advancedFilters.timePeriod) {
            const now = new Date();
            let startDate;
            
            switch(advancedFilters.timePeriod) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                    startDate = new Date(now.getFullYear(), quarterStart, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }
            
            if (startDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) >= startDate
                );
            }
        }
        
        if (advancedFilters.priceRange) {
            const { minPrice, maxPrice } = advancedFilters.priceRange;
            if (minPrice !== undefined && minPrice !== '') {
                filteredOrders = filteredOrders.filter(order => order.total >= parseFloat(minPrice));
            }
            if (maxPrice !== undefined && maxPrice !== '') {
                filteredOrders = filteredOrders.filter(order => order.total <= parseFloat(maxPrice));
            }
        }
        
        if (advancedFilters.pharmacy && advancedFilters.pharmacy !== 'all') {
            filteredOrders = filteredOrders.filter(order => 
                order.pharmacyId == advancedFilters.pharmacy || 
                order.pharmacyName?.toLowerCase().includes(advancedFilters.pharmacy.toLowerCase())
            );
        }
        
        return filteredOrders.length;
    },

    // Reset di tutti i filtri
    resetAllFilters() {
        console.log('🔄 Resetting all filters...');
        
        // Reset filtri di tempo
        const timePeriodSelect = document.getElementById('filter-time-period');
        if (timePeriodSelect) timePeriodSelect.value = 'all';
        
        const startDateInput = document.getElementById('filter-start-date');
        if (startDateInput) startDateInput.value = '';
        
        const endDateInput = document.getElementById('filter-end-date');
        if (endDateInput) endDateInput.value = '';
        
        // Reset filtri di prezzo
        const minPriceInput = document.getElementById('filter-min-price');
        if (minPriceInput) minPriceInput.value = '';
        
        const maxPriceInput = document.getElementById('filter-max-price');
        if (maxPriceInput) maxPriceInput.value = '';
        
        // Reset filtro farmacia
        const pharmacySelect = document.getElementById('filter-pharmacy');
        if (pharmacySelect) pharmacySelect.value = 'all';
        
        // Reset ordinamento
        const sortSelect = document.getElementById('filter-sort');
        if (sortSelect) sortSelect.value = 'date_desc';
        
        // Reset filtro di stato
        this.filterOrders('all');
        
        Auth.showNotification('Tutti i filtri sono stati rimossi', 'info');
    },

    // Genera le opzioni per il filtro farmacia
    getPharmacyFilterOptions() {
        const pharmacies = [...new Set(this.orders.map(order => order.pharmacyName).filter(Boolean))];
        return pharmacies.map(pharmacy => `
            <option value="${pharmacy}">${pharmacy}</option>
        `).join('');
    },

    // Mostra/nascondi i filtri avanzati
    toggleAdvancedFilters() {
        const advancedFiltersContainer = document.getElementById('advanced-filters-container');
        const toggleButton = document.getElementById('toggle-advanced-filters');
        
        if (advancedFiltersContainer && toggleButton) {
            const isHidden = advancedFiltersContainer.classList.contains('hidden');
            
            if (isHidden) {
                advancedFiltersContainer.classList.remove('hidden');
                toggleButton.innerHTML = '<i class="fas fa-chevron-up mr-2"></i>Nascondi Filtri Avanzati';
            } else {
                advancedFiltersContainer.classList.add('hidden');
                toggleButton.innerHTML = '<i class="fas fa-chevron-down mr-2"></i>Mostra Filtri Avanzati';
            }
        }
    },

    // Renderizza i controlli dei filtri avanzati
    renderAdvancedFiltersUI() {
        return `
            <!-- Filtri Avanzati -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">
                        <i class="fas fa-filter mr-2 text-blue-600"></i>Filtri Ordini
                    </h3>
                    <button 
                        id="toggle-advanced-filters"
                        onclick="Customer.toggleAdvancedFilters()" 
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors">
                        <i class="fas fa-chevron-down mr-2"></i>Mostra Filtri Avanzati
                    </button>
                </div>
                
                <!-- Filtri Base (sempre visibili) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Periodo</label>
                        <select id="filter-time-period" onchange="Customer.applyAdvancedFilters()" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all">Tutti i periodi</option>
                            <option value="today">Oggi</option>
                            <option value="week">Ultima settimana</option>
                            <option value="month">Ultimo mese</option>
                            <option value="quarter">Ultimo trimestre</option>
                            <option value="year">Ultimo anno</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Farmacia</label>
                        <select id="filter-pharmacy" onchange="Customer.applyAdvancedFilters()" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="all">Tutte le farmacie</option>
                            ${this.getPharmacyFilterOptions()}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Ordina per</label>
                        <select id="filter-sort" onchange="Customer.applyAdvancedFilters()" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="date_desc">Data (più recente)</option>
                            <option value="date_asc">Data (più vecchio)</option>
                            <option value="price_desc">Prezzo (più alto)</option>
                            <option value="price_asc">Prezzo (più basso)</option>
                            <option value="status">Stato</option>
                        </select>
                    </div>
                    
                    <div class="flex items-end">
                        <button onclick="Customer.resetAllFilters()" 
                                class="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                            <i class="fas fa-undo mr-2"></i>Reset Filtri
                        </button>
                    </div>
                </div>
                
                <!-- Filtri Avanzati (nascosti per default) -->
                <div id="advanced-filters-container" class="hidden">
                    <div class="border-t pt-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <!-- Filtro Data Personalizzato -->
                            <div class="space-y-3">
                                <h4 class="font-medium text-gray-700">
                                    <i class="fas fa-calendar-alt mr-2 text-blue-600"></i>Date Personalizzate
                                </h4>
                                <div class="space-y-2">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-600 mb-1">Data Inizio</label>
                                        <input type="date" id="filter-start-date" onchange="Customer.applyAdvancedFilters()"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-600 mb-1">Data Fine</label>
                                        <input type="date" id="filter-end-date" onchange="Customer.applyAdvancedFilters()"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Filtro Prezzo -->
                            <div class="space-y-3">
                                <h4 class="font-medium text-gray-700">
                                    <i class="fas fa-euro-sign mr-2 text-green-600"></i>Range Prezzo
                                </h4>
                                <div class="space-y-2">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-600 mb-1">Prezzo Minimo (€)</label>
                                        <input type="number" id="filter-min-price" min="0" step="0.01" placeholder="0.00"
                                               onchange="Customer.applyAdvancedFilters()"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-600 mb-1">Prezzo Massimo (€)</label>
                                        <input type="number" id="filter-max-price" min="0" step="0.01" placeholder="1000.00"
                                               onchange="Customer.applyAdvancedFilters()"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Statistiche Filtri -->
                            <div class="space-y-3">
                                <h4 class="font-medium text-gray-700">
                                    <i class="fas fa-chart-bar mr-2 text-purple-600"></i>Statistiche Filtrate
                                </h4>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600">Ordini trovati:</span>
                                        <span id="filtered-count" class="font-semibold text-blue-600">-</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600">Valore totale:</span>
                                        <span id="filtered-total-value" class="font-semibold text-green-600">€0.00</span>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <span class="text-gray-600">Valore medio:</span>
                                        <span id="filtered-avg-value" class="font-semibold text-purple-600">€0.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Azioni Filtri Avanzati -->
                        <div class="flex justify-between items-center mt-6 pt-4 border-t">
                            <div class="text-sm text-gray-500">
                                <i class="fas fa-info-circle mr-1"></i>
                                I filtri si applicano automaticamente ad ogni modifica
                            </div>
                            <div class="flex space-x-3">
                                <button onclick="Customer.exportFilteredOrders()" 
                                        class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm">
                                    <i class="fas fa-download mr-2"></i>Esporta Risultati
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Esporta gli ordini filtrati in formato CSV
    exportFilteredOrders() {
        console.log('📄 Exporting filtered orders...');
        
        const advancedFilters = this.getAdvancedFilterValues();
        const currentStatusFilter = this.getCurrentStatusFilter();
        
        // Ottieni gli ordini filtrati
        let filteredOrders = [...this.orders];
        
        // Applica gli stessi filtri del rendering
        if (currentStatusFilter !== 'all') {
            switch(currentStatusFilter) {
                case 'active':
                    filteredOrders = filteredOrders.filter(order => 
                        ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(order.status)
                    );
                    break;
                case 'delivered':
                    filteredOrders = filteredOrders.filter(order => order.status === 'delivered');
                    break;
                case 'cancelled':
                    filteredOrders = filteredOrders.filter(order => order.status === 'cancelled');
                    break;
            }
        }
        
        // Applica filtri avanzati (stesso codice del renderOrders)
        if (advancedFilters.dateRange) {
            const { startDate, endDate } = advancedFilters.dateRange;
            if (startDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) >= new Date(startDate)
                );
            }
            if (endDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) <= new Date(endDate + 'T23:59:59')
                );
            }
        }
        
        if (advancedFilters.timePeriod) {
            const now = new Date();
            let startDate;
            
            switch(advancedFilters.timePeriod) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'quarter':
                    const quarterStart = Math.floor(now.getMonth() / 3) * 3;
                    startDate = new Date(now.getFullYear(), quarterStart, 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
            }
            
            if (startDate) {
                filteredOrders = filteredOrders.filter(order => 
                    new Date(order.createdAt) >= startDate
                );
            }
        }
        
        if (advancedFilters.priceRange) {
            const { minPrice, maxPrice } = advancedFilters.priceRange;
            if (minPrice !== undefined && minPrice !== '') {
                filteredOrders = filteredOrders.filter(order => order.total >= parseFloat(minPrice));
            }
            if (maxPrice !== undefined && maxPrice !== '') {
                filteredOrders = filteredOrders.filter(order => order.total <= parseFloat(maxPrice));
            }
        }
        
        if (advancedFilters.pharmacy && advancedFilters.pharmacy !== 'all') {
            filteredOrders = filteredOrders.filter(order => 
                order.pharmacyId == advancedFilters.pharmacy || 
                order.pharmacyName?.toLowerCase().includes(advancedFilters.pharmacy.toLowerCase())
            );
        }
        
        if (filteredOrders.length === 0) {
            Auth.showNotification('Nessun ordine da esportare con i filtri attuali', 'warning');
            return;
        }
        
        // Crea il CSV
        const csvHeaders = [
            'ID Ordine',
            'Data',
            'Cliente',
            'Farmacia', 
            'Stato',
            'Totale (€)',
            'Indirizzo',
            'Metodo Pagamento',
            'Prodotti'
        ];
        
        const csvRows = filteredOrders.map(order => {
            const products = order.items.map(item => `${item.name} (x${item.quantity})`).join('; ');
            const address = typeof order.deliveryAddress === 'object' ? 
                `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : 
                order.deliveryAddress || '';
            const paymentMethod = typeof order.paymentMethod === 'object' ?
                order.paymentMethod.label || order.paymentMethod.type :
                order.paymentMethod || '';
                
            return [
                order.id || order.orderNumber || '',
                new Date(order.createdAt).toLocaleDateString('it-IT'),
                order.customerName || '',
                order.pharmacyName || '',
                this.getStatusText(order.status),
                order.total.toFixed(2),
                address,
                paymentMethod,
                products
            ];
        });
        
        const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
        
        // Download del file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ordini_filtrati_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        
        Auth.showNotification(`Esportati ${filteredOrders.length} ordini in formato CSV`, 'success');
    },

    // Aggiorna le statistiche dei filtri in tempo reale
    updateFilteredStatistics(filteredOrders) {
        if (!filteredOrders || filteredOrders.length === 0) {
            // Reset statistiche
            const countElement = document.getElementById('filtered-count');
            const totalElement = document.getElementById('filtered-total-value');
            const avgElement = document.getElementById('filtered-avg-value');
            
            if (countElement) countElement.textContent = '0';
            if (totalElement) totalElement.textContent = '€0.00';
            if (avgElement) avgElement.textContent = '€0.00';
            return;
        }
        
        const count = filteredOrders.length;
        const totalValue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
        const avgValue = totalValue / count;
        
        const countElement = document.getElementById('filtered-count');
        const totalElement = document.getElementById('filtered-total-value');
        const avgElement = document.getElementById('filtered-avg-value');
        
        if (countElement) countElement.textContent = count.toString();
        if (totalElement) totalElement.textContent = `€${totalValue.toFixed(2)}`;
        if (avgElement) avgElement.textContent = `€${avgValue.toFixed(2)}`;
    },

    // Aggiorna le statistiche degli ordini
    updateOrderStats() {
        const totalOrders = this.orders.length;
        const activeOrders = this.orders.filter(order => 
            ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery'].includes(order.status)
        ).length;
        const deliveredOrders = this.orders.filter(order => order.status === 'delivered').length;
        const cancelledOrders = this.orders.filter(order => order.status === 'cancelled').length;
        
        // Aggiorna gli elementi DOM
        const statsTotal = document.getElementById('stats-total');
        const statsActive = document.getElementById('stats-active');
        const statsDelivered = document.getElementById('stats-delivered');
        const statsCancelled = document.getElementById('stats-cancelled');
        
        if (statsTotal) statsTotal.textContent = totalOrders;
        if (statsActive) statsActive.textContent = activeOrders;
        if (statsDelivered) statsDelivered.textContent = deliveredOrders;
        if (statsCancelled) statsCancelled.textContent = cancelledOrders;
    },

    // Riordina gli stessi prodotti di un ordine precedente
    reorderItems(orderId) {
        console.log('🔄 Reordering items from order:', orderId);
        
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            Auth.showNotification('Ordine non trovato', 'error');
            return;
        }
        
        // Aggiungi tutti i prodotti dell'ordine al carrello
        let addedItems = 0;
        order.items.forEach(item => {
            this.addToCart(item.productId || item.id, item.name, item.price, item.quantity);
            addedItems++;
        });
        
        Auth.showNotification(`${addedItems} prodotti aggiunti al carrello`, 'success');
        
        // Passa alla sezione carrello
        if (typeof showCustomerSection === 'function') {
            showCustomerSection('cart');
        }
    },

    // Traccia un ordine in corso
    trackOrder(orderId) {
        console.log('📍 Tracking order:', orderId);
        
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            Auth.showNotification('Ordine non trovato', 'error');
            return;
        }
        
        // Mostra una modal di tracking (implementazione base)
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.innerHTML = `
                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div class="bg-white rounded-lg p-6 max-w-md w-full">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Tracciamento Ordine #${orderId}</h3>
                            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div class="space-y-4">
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                    <i class="fas fa-check text-white text-sm"></i>
                                </div>
                                <div>
                                    <p class="font-medium">Ordine Confermato</p>
                                    <p class="text-sm text-gray-500">${new Date(order.createdAt).toLocaleString('it-IT')}</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 ${order.status === 'preparing' || order.status === 'ready' || order.status === 'picked_up' ? 'bg-green-500' : 'bg-gray-300'} rounded-full flex items-center justify-center">
                                    <i class="fas fa-pills text-white text-sm"></i>
                                </div>
                                <div>
                                    <p class="font-medium">In Preparazione</p>
                                    <p class="text-sm text-gray-500">Farmacia sta preparando l'ordine</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 ${order.status === 'picked_up' ? 'bg-green-500' : 'bg-gray-300'} rounded-full flex items-center justify-center">
                                    <i class="fas fa-motorcycle text-white text-sm"></i>
                                </div>
                                <div>
                                    <p class="font-medium">Ritirato dal Rider</p>
                                    <p class="text-sm text-gray-500">In consegna verso di te</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center space-x-3">
                                <div class="w-8 h-8 ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'} rounded-full flex items-center justify-center">
                                    <i class="fas fa-home text-white text-sm"></i>
                                </div>
                                <div>
                                    <p class="font-medium">Consegnato</p>
                                    <p class="text-sm text-gray-500">Ordine completato</p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-6 text-center">
                            <button onclick="this.closest('.fixed').remove()" 
                                    class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            Auth.showNotification(`Stato ordine: ${this.getStatusText(order.status)}`, 'info');
        }
    },
    
    // Apre la modal della mappa per un ordine specifico
    openMapModal(orderId) {
        console.log('🗺️ Opening map modal for order:', orderId);
        
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            Auth.showNotification('Ordine non trovato', 'error');
            return;
        }
        
        // Chiudi eventuali modal esistenti
        this.closeMapModal();
        
        // Genera coordinate simulate per la demo
        const deliveryCoords = this.generateDeliveryCoordinates(order);
        const pharmacyCoords = this.generatePharmacyCoordinates(order);
        const riderCoords = this.generateRiderCoordinates(order, deliveryCoords, pharmacyCoords);
        
        const modalHTML = `
            <div class="map-modal" id="map-modal-${orderId}" role="dialog" aria-labelledby="modal-title-${orderId}" aria-modal="true">
                <div class="map-modal-content" role="document">
                    <!-- Header -->
                    <div class="p-6 border-b border-gray-200">
                        <div class="flex justify-between items-center">
                            <h2 id="modal-title-${orderId}" class="text-xl font-semibold text-gray-800">
                                Tracciamento Ordine #${orderId}
                            </h2>
                            <button 
                                onclick="Customer.closeMapModal('${orderId}')" 
                                class="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
                                aria-label="Chiudi modal">
                                <i class="fas fa-times text-xl" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Contenuto della modal -->
                    <div class="p-6">
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <!-- Mappa -->
                            <div class="lg:col-span-1">
                                <h3 class="text-lg font-medium text-gray-800 mb-3">Posizione in tempo reale</h3>
                                <div id="map-${orderId}" class="map-container-modal"></div>
                            </div>
                            
                            <!-- Dettagli dell'ordine -->
                            <div class="lg:col-span-1 space-y-4">
                                <!-- Status Timeline -->
                                <div>
                                    <h3 class="text-lg font-medium text-gray-800 mb-3">Stato consegna</h3>
                                    ${this.generateOrderTimeline(order)}
                                </div>
                                
                                <!-- Dettagli consegna -->
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <h4 class="font-medium text-gray-800 mb-3">Dettagli consegna</h4>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex items-start">
                                            <i class="fas fa-map-marker-alt text-gray-400 mr-2 mt-0.5" aria-hidden="true"></i>
                                            <div>
                                                <span class="font-medium">Indirizzo:</span>
                                                <span class="block text-gray-600">${typeof order.deliveryAddress === 'object' ? 
                                                    `${order.deliveryAddress.street}, ${order.deliveryAddress.city}` : 
                                                    order.deliveryAddress || 'Indirizzo non specificato'}</span>
                                            </div>
                                        </div>
                                        <div class="flex items-start">
                                            <i class="fas fa-clock text-gray-400 mr-2 mt-0.5" aria-hidden="true"></i>
                                            <div>
                                                <span class="font-medium">ETA stimato:</span>
                                                <span class="block text-gray-600">${this.getEstimatedDeliveryTime(order)} min</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Informazioni Farmacia -->
                                <div class="bg-blue-50 rounded-lg p-4">
                                    <h4 class="font-medium text-gray-800 mb-3">Farmacia</h4>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex items-center">
                                            <i class="fas fa-store text-blue-600 mr-2" aria-hidden="true"></i>
                                            <span class="font-medium">${order.pharmacyName || 'Farmacia Centrale'}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <i class="fas fa-phone text-blue-600 mr-2" aria-hidden="true"></i>
                                            <span>+39 02 1234567</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- Informazioni Rider -->
                                ${this.isOrderPickedUp(order) ? `
                                <div class="bg-green-50 rounded-lg p-4">
                                    <h4 class="font-medium text-gray-800 mb-3">Rider</h4>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex items-center">
                                            <i class="fas fa-user text-green-600 mr-2" aria-hidden="true"></i>
                                            <span class="font-medium">Marco D. (Rider #R001)</span>
                                        </div>
                                        <div class="flex items-center">
                                            <i class="fas fa-motorcycle text-green-600 mr-2" aria-hidden="true"></i>
                                            <span>Scooter - AB123CD</span>
                                        </div>
                                        <div class="flex items-center">
                                            <i class="fas fa-star text-green-600 mr-2" aria-hidden="true"></i>
                                            <span>Rating: 4.8/5</span>
                                        </div>
                                    </div>
                                </div>
                                ` : ''}
                                
                                <!-- Report Issue Button -->
                                <button 
                                    onclick="Customer.reportIssue('${orderId}')"
                                    class="w-full bg-yellow-600 text-white py-3 rounded-lg hover:bg-yellow-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2">
                                    <i class="fas fa-exclamation-triangle mr-2" aria-hidden="true"></i>
                                    Segnala un problema
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Aggiungi la modal al DOM
        const modalContainer = document.getElementById('modal-container') || document.body;
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
        
        // Aggiungi listener per la chiusura con ESC
        this.addEscapeKeyListener(orderId);
        
        // Inizializza la mappa dopo che la modal è stata aggiunta al DOM
        setTimeout(() => {
            this.initializeOrderMap(orderId, pharmacyCoords, deliveryCoords, riderCoords, order);
        }, 100);
    },
    
    // Chiude la modal della mappa
    closeMapModal(orderId = null) {
        if (orderId) {
            const modal = document.getElementById(`map-modal-${orderId}`);
            if (modal) {
                modal.remove();
            }
        } else {
            // Chiudi tutte le modal di mappa aperte
            const modals = document.querySelectorAll('[id^="map-modal-"]');
            modals.forEach(modal => modal.remove());
        }
        
        // Rimuovi il listener ESC
        document.removeEventListener('keydown', this.escapeKeyHandler);
    },
    
    // Aggiunge il listener per la chiusura con ESC
    addEscapeKeyListener(orderId) {
        this.escapeKeyHandler = (event) => {
            if (event.key === 'Escape') {
                this.closeMapModal(orderId);
            }
        };
        document.addEventListener('keydown', this.escapeKeyHandler);
    },
    
    // Inizializza la mappa per l'ordine
    initializeOrderMap(orderId, pharmacyCoords, deliveryCoords, riderCoords, order) {
        const mapElement = document.getElementById(`map-${orderId}`);
        if (!mapElement) {
            console.error('Map element not found');
            return;
        }
        
        // Calcola il centro e lo zoom della mappa
        const bounds = L.latLngBounds([pharmacyCoords, deliveryCoords]);
        if (riderCoords) {
            bounds.extend(riderCoords);
        }
        
        // Inizializza la mappa Leaflet
        const map = L.map(`map-${orderId}`).fitBounds(bounds, { padding: [20, 20] });
        
        // Aggiungi il layer della mappa
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Aggiungi marker per la farmacia
        const pharmacyIcon = L.divIcon({
            html: '<i class="fas fa-store text-blue-600 text-lg"></i>',
            iconSize: [30, 30],
            className: 'custom-div-icon'
        });
        L.marker(pharmacyCoords, { icon: pharmacyIcon })
            .addTo(map)
            .bindPopup(`<strong>Farmacia</strong><br>${order.pharmacyName || 'Farmacia Centrale'}`);
        
        // Aggiungi marker per la destinazione
        const homeIcon = L.divIcon({
            html: '<i class="fas fa-home text-green-600 text-lg"></i>',
            iconSize: [30, 30],
            className: 'custom-div-icon'
        });
        L.marker(deliveryCoords, { icon: homeIcon })
            .addTo(map)
            .bindPopup('<strong>Destinazione</strong><br>Il tuo indirizzo');
        
        // Aggiungi marker per il rider se l'ordine è stato ritirato
        if (riderCoords && this.isOrderPickedUp(order)) {
            const riderIcon = L.divIcon({
                html: '<i class="fas fa-motorcycle text-orange-600 text-lg"></i>',
                iconSize: [30, 30],
                className: 'custom-div-icon'
            });
            L.marker(riderCoords, { icon: riderIcon })
                .addTo(map)
                .bindPopup('<strong>Rider</strong><br>Marco D. - In consegna');
        }
        
        // Aggiungi la rotta se il rider è in movimento
        if (riderCoords && this.isOrderPickedUp(order)) {
            const routeCoords = [riderCoords, deliveryCoords];
            L.polyline(routeCoords, {
                color: '#f97316',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10'
            }).addTo(map);
        }
        
        // Linea dalla farmacia alla destinazione (rotta completa)
        const fullRoute = [pharmacyCoords, deliveryCoords];
        L.polyline(fullRoute, {
            color: '#3b82f6',
            weight: 3,
            opacity: 0.5
        }).addTo(map);
    },
    
    // Genera coordinate simulate per la consegna
    generateDeliveryCoordinates(order) {
        // Coordinate simulate per Milano
        const baseLat = 45.4642;
        const baseLng = 9.1900;
        return [
            baseLat + (Math.random() - 0.5) * 0.02,
            baseLng + (Math.random() - 0.5) * 0.02
        ];
    },
    
    // Genera coordinate simulate per la farmacia
    generatePharmacyCoordinates(order) {
        // Coordinate simulate per la farmacia centrale di Milano
        return [45.4654, 9.1859]; // Vicino al Duomo
    },
    
    // Genera coordinate simulate per il rider
    generateRiderCoordinates(order, deliveryCoords, pharmacyCoords) {
        if (!this.isOrderPickedUp(order)) {
            return null;
        }
        
        // Simula una posizione tra la farmacia e la destinazione
        const progress = Math.random() * 0.8 + 0.1; // 10-90% del percorso
        return [
            pharmacyCoords[0] + (deliveryCoords[0] - pharmacyCoords[0]) * progress,
            pharmacyCoords[1] + (deliveryCoords[1] - pharmacyCoords[1]) * progress
        ];
    },
    
    // Controlla se l'ordine è stato ritirato dal rider
    isOrderPickedUp(order) {
        return ['picked_up', 'out_for_delivery'].includes(order.status);
    },
    
    // Genera la timeline dello stato dell'ordine
    generateOrderTimeline(order) {
        const steps = [
            { status: 'pending', icon: 'fas fa-clock', label: 'Ordine ricevuto', completed: true },
            { status: 'accepted', icon: 'fas fa-check', label: 'Confermato dalla farmacia', completed: ['accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'].includes(order.status) },
            { status: 'preparing', icon: 'fas fa-pills', label: 'In preparazione', completed: ['preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered'].includes(order.status) },
            { status: 'ready', icon: 'fas fa-box', label: 'Pronto per il ritiro', completed: ['ready', 'picked_up', 'out_for_delivery', 'delivered'].includes(order.status) },
            { status: 'picked_up', icon: 'fas fa-motorcycle', label: 'Ritirato dal rider', completed: ['picked_up', 'out_for_delivery', 'delivered'].includes(order.status) },
            { status: 'delivered', icon: 'fas fa-home', label: 'Consegnato', completed: order.status === 'delivered' }
        ];
        
        return `
            <div class="space-y-3">
                ${steps.map(step => `
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 ${step.completed ? 'bg-green-500' : 'bg-gray-300'} rounded-full flex items-center justify-center">
                            <i class="${step.icon} text-white text-sm" aria-hidden="true"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium ${step.completed ? 'text-gray-800' : 'text-gray-500'}">${step.label}</p>
                            ${step.status === order.status ? '<p class="text-sm text-blue-600">In corso...</p>' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },
    
    // Calcola il tempo stimato di consegna
    getEstimatedDeliveryTime(order) {
        const statusTimes = {
            'pending': 45,
            'accepted': 35,
            'preparing': 25,
            'ready': 15,
            'picked_up': 10,
            'out_for_delivery': 5
        };
        
        return statusTimes[order.status] || 30;
    },
    
    // Gestisce la segnalazione di problemi
    reportIssue(orderId) {
        const issues = [
            'Ritardo nella consegna',
            'Prodotto mancante',
            'Indirizzo errato',
            'Problema con il rider',
            'Altro'
        ];
        
        const selectedIssue = prompt(`Seleziona il problema da segnalare per l'ordine #${orderId}:\n\n` + 
            issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n') + 
            '\n\nInserisci il numero corrispondente (1-5):');
        
        if (selectedIssue && selectedIssue >= 1 && selectedIssue <= 5) {
            const issue = issues[selectedIssue - 1];
            Auth.showNotification(`Problema segnalato: ${issue}. Ti contatteremo presto.`, 'success');
            console.log(`🚨 Issue reported for order ${orderId}: ${issue}`);
        }
    },
    
    // Conferma l'annullamento di un ordine
    confirmCancelOrder(orderId) {
        console.log('🚫 Showing cancel confirmation modal for order:', orderId);
        
        // Trova l'ordine per mostrare dettagli personalizzati
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            console.error(`❌ Order #${orderId} not found`);
            Auth.showNotification('Ordine non trovato', 'error');
            return;
        }

        // Crea il modal per la conferma di annullamento
        const modal = document.createElement('div');
        modal.className = 'cancel-modal';
        modal.id = `cancel-modal-${orderId}`;
        
        // Calcola il totale dell'ordine
        const orderTotal = order.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || order.total || 0;
        
        // Determina il motivo principale per l'annullamento in base allo stato
        let suggestedReasons = [];
        if (order.status === 'pending') {
            suggestedReasons = ['change_mind', 'wrong_products', 'address_change', 'payment_issue'];
        } else if (order.status === 'accepted') {
            suggestedReasons = ['emergency', 'address_change', 'payment_issue', 'other'];
        } else {
            suggestedReasons = ['emergency', 'other'];
        }

        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300">
                <!-- Header -->
                <div class="px-6 py-4 border-b border-gray-200 bg-red-50 rounded-t-lg">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <div class="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-exclamation-triangle text-red-600" aria-hidden="true"></i>
                            </div>
                            <div class="ml-3">
                                <h3 class="text-lg font-semibold text-red-800">Annulla Ordine</h3>
                                <p class="text-sm text-red-600">Ordine #${orderId}</p>
                            </div>
                        </div>
                        <button onclick="Customer.closeCancelModal('${orderId}')" 
                                class="text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-lg p-1"
                                aria-label="Chiudi modal">
                            <i class="fas fa-times text-xl" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="px-6 py-4">
                    <!-- Order Info -->
                    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div class="flex justify-between items-start text-sm">
                            <div>
                                <p class="font-medium text-gray-800">Farmacia: ${order.pharmacyName || 'N/A'}</p>
                                <p class="text-gray-600">${order.items?.length || 0} prodotto${(order.items?.length || 0) !== 1 ? 'i' : ''}</p>
                                <p class="text-gray-600">Stato: <span class="font-medium">${this.getStatusDisplayName(order.status)}</span></p>
                            </div>
                            <div class="text-right">
                                <p class="font-semibold text-lg text-gray-800">€${orderTotal.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Warning Message -->
                    <div class="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-yellow-400" aria-hidden="true"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-yellow-800">
                                    <strong>Attenzione:</strong> ${order.status === 'pending' ? 
                                        'L\'annullamento è gratuito finché l\'ordine non viene accettato.' : 
                                        order.status === 'accepted' || order.status === 'preparing' ? 
                                            'L\'ordine è già in elaborazione. L\'annullamento potrebbe non essere sempre possibile.' :
                                            'L\'annullamento di questo ordine potrebbe comportare delle limitazioni.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Cancellation Reason -->
                    <form id="cancel-order-form-${orderId}" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-clipboard-question mr-1"></i>Motivo dell'annullamento
                            </label>
                            <select id="cancel-reason-${orderId}" required
                                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500">
                                <option value="">Seleziona un motivo</option>
                                ${suggestedReasons.includes('change_mind') ? '<option value="change_mind">Ho cambiato idea</option>' : ''}
                                ${suggestedReasons.includes('wrong_products') ? '<option value="wrong_products">Prodotti sbagliati nel carrello</option>' : ''}
                                ${suggestedReasons.includes('address_change') ? '<option value="address_change">Devo cambiare indirizzo di consegna</option>' : ''}
                                ${suggestedReasons.includes('payment_issue') ? '<option value="payment_issue">Problemi con il pagamento</option>' : ''}
                                ${suggestedReasons.includes('emergency') ? '<option value="emergency">Situazione di emergenza</option>' : ''}
                                <option value="found_cheaper">Trovato più conveniente altrove</option>
                                <option value="delivery_time">Tempi di consegna troppo lunghi</option>
                                <option value="no_longer_needed">Non mi serve più</option>
                                <option value="other">Altro motivo</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-comment-dots mr-1"></i>Note aggiuntive <span class="text-gray-500">(opzionale)</span>
                            </label>
                            <textarea id="cancel-notes-${orderId}" rows="3" 
                                      placeholder="Dettagli aggiuntivi o suggerimenti per migliorare il servizio..."
                                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"></textarea>
                        </div>
                    </form>
                </div>
                
                <!-- Footer -->
                <div class="px-6 py-4 bg-gray-50 rounded-b-lg">
                    <div class="flex space-x-3">
                        <button type="button" onclick="Customer.closeCancelModal('${orderId}')" 
                                class="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors duration-200 font-medium">
                            <i class="fas fa-arrow-left mr-1"></i>Mantieni Ordine
                        </button>
                        <button type="button" onclick="Customer.processCancelOrder('${orderId}')" 
                                class="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium">
                            <i class="fas fa-ban mr-1"></i>Annulla Ordine
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add entrance animation
        modal.classList.add('cancel-modal-enter');
        
        // Add keyboard and click-outside support
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                this.closeCancelModal(orderId);
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        
        const handleClickOutside = (e) => {
            if (e.target === modal) {
                this.closeCancelModal(orderId);
                modal.removeEventListener('click', handleClickOutside);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        modal.addEventListener('click', handleClickOutside);
        
        // Focus sul primo elemento interattivo per accessibilità
        setTimeout(() => {
            const reasonSelect = document.getElementById(`cancel-reason-${orderId}`);
            if (reasonSelect) reasonSelect.focus();
        }, 300); // Increased delay to let animation complete
    },
    
    // Annulla un ordine
    cancelOrder(orderId) {
        console.log(`🚫 Cancelling order #${orderId}`);
        
        const order = this.orders.find(o => o.id === orderId);
        if (order) {
            order.status = 'cancelled';
            
            // Aggiorna nel database
            Database.updateOrder(orderId, { status: 'cancelled' });
            
            // Ricarica la visualizzazione
            this.loadOrders();
            
            Auth.showNotification('Ordine annullato con successo');
        }
    },

    // Chiude il modal di conferma annullamento
    closeCancelModal(orderId) {
        const modal = document.getElementById(`cancel-modal-${orderId}`);
        if (modal) {
            // Add exit animation
            modal.classList.remove('cancel-modal-enter');
            modal.classList.add('cancel-modal-exit');
            
            // Remove modal after animation completes
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 200); // Match animation duration
        }
    },

    // Processa l'annullamento dell'ordine con motivo
    processCancelOrder(orderId) {
        const reasonSelect = document.getElementById(`cancel-reason-${orderId}`);
        const notesTextarea = document.getElementById(`cancel-notes-${orderId}`);
        
        if (!reasonSelect || !reasonSelect.value) {
            // Highlight del campo obbligatorio
            if (reasonSelect) {
                reasonSelect.classList.add('border-red-500', 'ring-2', 'ring-red-500');
                reasonSelect.focus();
            }
            
            // Mostra messaggio di errore
            if (typeof dashboardNotificationManager !== 'undefined') {
                dashboardNotificationManager.warning('Campo Obbligatorio', 'Seleziona un motivo per l\'annullamento');
            } else if (typeof Auth !== 'undefined' && typeof Auth.showNotification === 'function') {
                Auth.showNotification('Seleziona un motivo per l\'annullamento', 'warning');
            }
            return;
        }

        const reason = reasonSelect.value;
        const notes = notesTextarea ? notesTextarea.value.trim() : '';
        
        console.log(`🚫 Processing order cancellation #${orderId} - Reason: ${reason}, Notes: ${notes}`);
        
        // Trova l'ordine
        const order = this.orders.find(o => o.id === orderId);
        if (!order) {
            console.error(`❌ Order #${orderId} not found`);
            if (typeof dashboardNotificationManager !== 'undefined') {
                dashboardNotificationManager.error('Errore', 'Ordine non trovato');
            }
            return;
        }

        // Controlla se l'annullamento è possibile in base allo stato
        const nonCancellableStates = ['picked_up', 'delivered'];
        if (nonCancellableStates.includes(order.status)) {
            if (typeof dashboardNotificationManager !== 'undefined') {
                dashboardNotificationManager.error(
                    'Annullamento Non Possibile', 
                    `Non è possibile annullare un ordine ${this.getStatusDisplayName(order.status).toLowerCase()}`
                );
            }
            this.closeCancelModal(orderId);
            return;
        }

        // Aggiorna l'ordine con i dettagli dell'annullamento
        order.status = 'cancelled';
        order.cancelledAt = new Date().toISOString();
        order.cancellationReason = reason;
        if (notes) {
            order.cancellationNotes = notes;
        }
        
        // Aggiorna nel database
        Database.updateOrder(orderId, {
            status: 'cancelled',
            cancelledAt: order.cancelledAt,
            cancellationReason: reason,
            cancellationNotes: notes
        });
        
        // Chiude il modal
        this.closeCancelModal(orderId);
        
        // Ricarica la visualizzazione degli ordini
        this.loadOrders();
        
        // Mostra notifica di successo personalizzata
        const reasonText = this.getCancellationReasonText(reason);
        if (typeof dashboardNotificationManager !== 'undefined') {
            dashboardNotificationManager.success(
                'Ordine Annullato', 
                `Ordine #${orderId} annullato con successo. Motivo: ${reasonText}`
            );
        } else if (typeof Auth !== 'undefined' && typeof Auth.showNotification === 'function') {
            Auth.showNotification(`Ordine #${orderId} annullato con successo`, 'success');
        }

        // Log per analytics/debugging
        console.log(`✅ Order #${orderId} cancelled successfully:`, {
            reason,
            notes,
            cancelledAt: order.cancelledAt,
            previousStatus: order.status
        });
    },

    // Helper per ottenere il testo leggibile del motivo di annullamento
    getCancellationReasonText(reason) {
        const reasonMap = {
            'change_mind': 'Ho cambiato idea',
            'wrong_products': 'Prodotti sbagliati nel carrello',
            'address_change': 'Devo cambiare indirizzo',
            'payment_issue': 'Problemi con il pagamento',
            'emergency': 'Situazione di emergenza',
            'found_cheaper': 'Trovato più conveniente altrove',
            'delivery_time': 'Tempi di consegna troppo lunghi',
            'no_longer_needed': 'Non mi serve più',
            'other': 'Altro motivo'
        };
        return reasonMap[reason] || reason;
    },

    // Helper per ottenere il nome display dello stato dell'ordine
    getStatusDisplayName(status) {
        const statusMap = {
            'pending': 'In attesa',
            'accepted': 'Accettato',
            'preparing': 'In preparazione',
            'ready': 'Pronto',
            'picked_up': 'Ritirato',
            'out_for_delivery': 'In consegna',
            'delivered': 'Consegnato',
            'cancelled': 'Annullato'
        };
        return statusMap[status] || status;
    },
    
    // Crea un nuovo ordine dal carrello
    createOrder() {
        if (!EudoraApp.currentUser || this.cart.length === 0) {
            Auth.showNotification('Carrello vuoto o utente non autenticato', 'error');
            return;
        }
        
        const defaultAddress = this.addresses.find(addr => addr.isDefault);
        const defaultPayment = this.paymentMethods.find(pm => pm.isDefault);
        
        if (!defaultAddress) {
            Auth.showNotification('Aggiungi un indirizzo di consegna prima di ordinare', 'error');
            return;
        }
        
        if (!defaultPayment) {
            Auth.showNotification('Aggiungi un metodo di pagamento prima di ordinare', 'error');
            return;
        }
        
        const order = {
            id: Date.now(),
            customerId: EudoraApp.currentUser.id,
            pharmacyId: 1, // Default pharmacy
            items: this.cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            status: 'pending',
            deliveryAddress: `${defaultAddress.street}, ${defaultAddress.city}`,
            paymentMethod: defaultPayment.label,
            createdAt: new Date().toISOString(),
            pharmacyName: 'Farmacia Centrale'
        };
        
        Database.createOrder(order);
        this.orders.push(order);
        this.clearCart();
        
        Auth.showNotification('Ordine creato con successo!');
        console.log('✅ Order created:', order);
        
        // Passa alla sezione ordini
        if (typeof showSection === 'function') {
            showSection('orders');
        }
    },
    
    // Restituisce la classe CSS per lo stato dell'ordine
    getStatusClass(status) {
        const classes = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'accepted': 'bg-blue-100 text-blue-800',
            'preparing': 'bg-orange-100 text-orange-800',
            'ready': 'bg-purple-100 text-purple-800',
            'picked_up': 'bg-indigo-100 text-indigo-800',
            'delivered': 'bg-green-100 text-green-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    },
    
    // Restituisce la classe CSS per il bordo della card dell'ordine
    getOrderCardClass(status) {
        return `order-card-${status}`;
    },
    
    // Restituisce un metodo di pagamento dell'utente per l'ordine
    getUserPaymentMethod() {
        // Se l'utente ha metodi di pagamento salvati, usane uno
        if (this.paymentMethods && this.paymentMethods.length > 0) {
            // Usa il metodo predefinito se disponibile
            const defaultMethod = this.paymentMethods.find(pm => pm.isDefault);
            if (defaultMethod) {
                return {
                    type: defaultMethod.type,
                    label: defaultMethod.label,
                    icon: this.getPaymentIcon(defaultMethod.type),
                    color: this.getPaymentIconColor(defaultMethod.type)
                };
            }
            
            // Altrimenti usa il primo disponibile
            const firstMethod = this.paymentMethods[0];
            return {
                type: firstMethod.type,
                label: firstMethod.label,
                icon: this.getPaymentIcon(firstMethod.type),
                color: this.getPaymentIconColor(firstMethod.type)
            };
        }
        
        // Fallback per utenti senza metodi di pagamento
        return {
            type: 'cash',
            label: 'Contanti alla Consegna',
            icon: 'fas fa-money-bill-wave',
            color: 'text-green-700'
        };
    },

    // Genera un metodo di pagamento casuale per ordini esistenti
    getRandomPaymentMethodForOrder(order) {
        // Se l'ordine ha già un metodo di pagamento, usalo
        if (order.paymentMethod && order.paymentMethod.type) {
            return {
                type: order.paymentMethod.type,
                label: order.paymentMethod.label || this.getPaymentTypeLabel(order.paymentMethod.type),
                icon: this.getPaymentIcon(order.paymentMethod.type),
                color: this.getPaymentIconColor(order.paymentMethod.type)
            };
        }

        // Altrimenti genera un metodo di pagamento casuale basato sui metodi disponibili
        const availablePaymentMethods = [
            {
                type: 'card',
                label: 'Visa **** 1234',
                icon: 'fas fa-credit-card',
                color: 'text-blue-600'
            },
            {
                type: 'card', 
                label: 'Mastercard **** 5678',
                icon: 'fas fa-credit-card',
                color: 'text-red-500'
            },
            {
                type: 'paypal',
                label: 'PayPal',
                icon: 'fab fa-paypal',
                color: 'text-blue-500'
            },
            {
                type: 'cash',
                label: 'Contrassegno',
                icon: 'fas fa-money-bill-wave',
                color: 'text-green-600'
            },
            {
                type: 'bank_transfer',
                label: 'Bonifico Bancario',
                icon: 'fas fa-university',
                color: 'text-gray-600'
            },
            {
                type: 'digital_wallet',
                label: 'Google Pay',
                icon: 'fab fa-google-pay',
                color: 'text-green-500'
            }
        ];

        // Usa l'ID dell'ordine come seed per la casualità, così sarà sempre lo stesso per lo stesso ordine
        const seed = order.id ? parseInt(order.id.toString().slice(-2)) : Math.floor(Math.random() * 100);
        const randomIndex = seed % availablePaymentMethods.length;
        
        return availablePaymentMethods[randomIndex];
    },

    // Ottiene il colore dell'icona per il tipo di pagamento
    getPaymentIconColor(type) {
        const colors = {
            'card': 'text-blue-600',
            'paypal': 'text-blue-500',
            'cash': 'text-green-700',
            'apple_pay': 'text-gray-800',
            'google_pay': 'text-red-600',
            'bank_transfer': 'text-indigo-600'
        };
        return colors[type] || 'text-gray-600';
    },
    
    // Restituisce il testo per lo stato dell'ordine
    getStatusText(status) {
        const texts = {
            'pending': 'In Attesa',
            'accepted': 'Accettato',
            'preparing': 'In Preparazione',
            'ready': 'Pronto',
            'picked_up': 'Ritirato',
            'out_for_delivery': 'In Consegna',
            'delivered': 'Consegnato',
            'cancelled': 'Annullato'
        };
        return texts[status] || status;
    },
    
    // === HELPER FUNCTIONS ===
    
    // Ottieni l'indirizzo predefinito dell'utente
    getDefaultAddress() {
        return this.addresses.find(addr => addr.isDefault) || null;
    },
    
    // Ottieni il metodo di pagamento predefinito dell'utente
    getDefaultPaymentMethod() {
        return this.paymentMethods.find(pm => pm.isDefault) || null;
    },
    
    // Ottieni l'icona per il tipo di pagamento
    getPaymentIcon(type) {
        const icons = {
            'card': 'fas fa-credit-card',
            'cash': 'fas fa-money-bill-wave',
            'paypal': 'fab fa-paypal',
            'bank_transfer': 'fas fa-university',
            'visa': 'fab fa-cc-visa',
            'mastercard': 'fab fa-cc-mastercard',
            'american_express': 'fab fa-cc-amex'
        };
        return icons[type] || 'fas fa-credit-card';
    },
    
    // Ottieni il colore per il tipo di carta
    getCardColor(cardType) {
        const colors = {
            'visa': 'bg-blue-600',
            'mastercard': 'bg-red-600',
            'american_express': 'bg-green-600',
            'postepay': 'bg-yellow-600',
            'paypal': 'bg-blue-500',
            'cash': 'bg-green-500',
            'bank_transfer': 'bg-gray-600',
            'card': 'bg-blue-600'
        };
        return colors[cardType] || 'bg-gray-600';
    },
    
    // Ottieni la descrizione per il metodo di pagamento
    getPaymentDescription(payment) {
        if (!payment) return 'Metodo di pagamento';
        
        switch (payment.type) {
            case 'card':
                const cardType = payment.cardType ? payment.cardType.toUpperCase() : 'CARTA';
                const cardNumber = payment.cardNumber || payment.cardLastDigits || '****';
                if (payment.cardLastDigits) {
                    return `${cardType} **** ${payment.cardLastDigits}`;
                } else if (payment.cardNumber) {
                    return `${cardType} ${payment.cardNumber}`;
                } else {
                    return `${cardType} **** ****`;
                }
            case 'paypal':
                return payment.email || payment.paypalEmail || 'Account PayPal';
            case 'cash':
                return 'Pagamento in contanti alla consegna';
            case 'bank_transfer':
                if (payment.bankName) {
                    const iban = payment.iban ? payment.iban.substring(0, 10) + '...' : '';
                    return `${payment.bankName}${iban ? ' - ' + iban : ''}`;
                }
                return 'Bonifico bancario';
            default:
                return payment.description || payment.label || 'Metodo di pagamento';
        }
    },
    
    // Ottieni il colore per l'icona del pagamento
    getPaymentIconColor(type) {
        const colors = {
            'card': 'text-blue-600',
            'cash': 'text-green-600',
            'paypal': 'text-blue-500',
            'bank_transfer': 'text-gray-600'
        };
        return colors[type] || 'text-gray-600';
    }
};

// Esponi le funzioni Customer globalmente
window.Customer = Customer;
window.addToCart = (productId, name, price) => Customer.addToCart(productId, name, price);
window.removeFromCart = (productId) => Customer.removeFromCart(productId);
window.updateCartQuantity = (productId, newQuantity) => Customer.updateCartQuantity(productId, newQuantity);
window.clearCart = () => Customer.clearCart();
window.proceedToCheckout = () => Customer.proceedToCheckout();
window.confirmCancelOrder = (orderId) => Customer.confirmCancelOrder(orderId);
window.setDefaultPaymentMethod = (paymentId) => Customer.setDefaultPaymentMethod(paymentId);
window.editPaymentMethod = (paymentId) => Customer.editPaymentMethod(paymentId);

console.log('🛍️ Customer module loaded');