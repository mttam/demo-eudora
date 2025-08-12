// filepath: js/test-data.js
// Test data module - manages sample data initialization

const TestData = {
    init() {
        console.log('🧪 Initializing Test Data...');
        this.initializeTestData();
    },

    initializeTestData() {
        console.log('Initializing test data...');
        
        // Force re-initialization if data exists
        const forceReset = !localStorage.getItem('testDataInitialized');
        
        // Initialize sample users if not present
        if (forceReset || !localStorage.getItem('sampleUsers')) {
            this.initializeSampleUsers();
        }

        // Initialize sample pharmacy orders if not present
        if (!localStorage.getItem('pharmacyOrders')) {
            this.initializePharmacyOrders();
        }

        // Initialize database orders if not present (for rider dashboard)
        if (!localStorage.getItem('eudora_orders')) {
            this.initializeDatabaseOrders();
        }

        // Initialize sample addresses if not present
        if (!localStorage.getItem('sampleAddresses')) {
            this.initializeSampleAddresses();
        }

        // Initialize sample payment methods if not present
        if (!localStorage.getItem('samplePaymentMethods')) {
            this.initializeSamplePaymentMethods();
        }

        // Initialize pharmacy products in localStorage if not present
        if (!localStorage.getItem('pharmacyProducts')) {
            this.initializePharmacyProducts();
        }

        // Initialize user preferences and settings
        if (!localStorage.getItem('userPreferences')) {
            this.initializeUserPreferences();
        }

        // Initialize user notifications history
        if (!localStorage.getItem('userNotifications')) {
            this.initializeUserNotifications();
        }

        // Initialize user favorites/wishlist
        if (!localStorage.getItem('userFavorites')) {
            this.initializeUserFavorites();
        }

        // Initialize user search history
        if (!localStorage.getItem('userSearchHistory')) {
            this.initializeUserSearchHistory();
        }

        console.log('✅ Test data initialized successfully!');
        
        // Show test data indicator
        setTimeout(() => {
            const indicator = document.getElementById('test-data-indicator');
            if (indicator) {
                indicator.classList.remove('hidden');
            }
            
            // Show notification toast
            this.showTestDataNotification();
        }, 2000);
        
        // Show available test accounts in console
        this.logTestAccounts();
        
        // Mark test data as initialized
        localStorage.setItem('testDataInitialized', 'true');
    },

    initializeSampleUsers() {
        const sampleUsers = [
            {
                id: 1,
                email: 'mario.rossi@email.com',
                password: 'password123',
                firstName: 'Mario',
                lastName: 'Rossi',
                phone: '3331234567',
                dateOfBirth: '1985-03-15',
                type: 'customer',
                role: 'customer',
                userType: 'customer',
                registeredAt: '2025-01-15T10:30:00Z',
                profileImage: 'https://via.placeholder.com/150x150?text=MR',
                fiscalCode: 'RSSMRA85C15H501Z',
                gender: 'M',
                profession: 'Ingegnere Software',
                preferences: {
                    newsletter: true,
                    smsNotifications: true,
                    promotionalOffers: false,
                    language: 'it',
                    currency: 'EUR'
                },
                healthInfo: {
                    allergies: ['Penicillina', 'Lattosio'],
                    chronicConditions: [],
                    emergencyContact: {
                        name: 'Anna Rossi',
                        phone: '3339876543',
                        relationship: 'Moglie'
                    }
                },
                loyaltyProgram: {
                    level: 'Gold',
                    points: 1250,
                    totalSpent: 789.50,
                    memberSince: '2025-01-15'
                },
                lastLogin: '2025-07-29T08:15:00Z',
                isActive: true,
                isEmailVerified: true,
                isPhoneVerified: true
            },
            {
                id: 2,
                email: 'admin@eudora.com',
                password: 'admin123',
                firstName: 'Admin',
                lastName: 'Eudora',
                phone: '3339876543',
                dateOfBirth: '1980-01-01',
                type: 'admin',
                role: 'admin',
                userType: 'admin',
                registeredAt: '2024-12-01T09:00:00Z',
                profileImage: 'https://via.placeholder.com/150x150?text=AE',
                role: 'Super Administrator',
                permissions: ['all'],
                department: 'IT Management',
                employeeId: 'EUD_ADM_001',
                lastLogin: '2025-07-29T07:30:00Z',
                isActive: true
            },
            {
                id: 3,
                email: 'farmacia.centrale@email.com',
                password: 'farmacia123',
                firstName: 'Farmacia',
                lastName: 'Centrale',
                phone: '0641234567',
                type: 'pharmacy',
                role: 'pharmacy',
                userType: 'pharmacy',
                pharmacyName: 'Farmacia Centrale',
                pharmacyAddress: 'Via Roma, 15 - Roma',
                registeredAt: '2024-11-15T14:20:00Z',
                profileImage: 'https://via.placeholder.com/150x150?text=FC',
                licenseNumber: 'FARM_RM_001_2024',
                vatNumber: 'IT12345678901',
                pharmacistName: 'Dott. Giuseppe Bianchi',
                pharmacistLicense: 'ODM_RM_12345',
                operatingHours: {
                    monday: { open: '08:30', close: '20:00' },
                    tuesday: { open: '08:30', close: '20:00' },
                    wednesday: { open: '08:30', close: '20:00' },
                    thursday: { open: '08:30', close: '20:00' },
                    friday: { open: '08:30', close: '20:00' },
                    saturday: { open: '09:00', close: '19:00' },
                    sunday: { closed: true }
                },
                services: ['Misurazione Pressione', 'Test Glicemia', 'Consulenza Farmaceutica', 'Preparazioni Galeniche'],
                deliveryZones: ['Centro Roma', 'Trastevere', 'Testaccio', 'San Lorenzo'],
                rating: 4.8,
                totalOrders: 1247,
                isActive: true,
                isVerified: true
            },
            {
                id: 4,
                email: 'rider@eudora.com',
                password: 'rider123',
                firstName: 'Giuseppe',
                lastName: 'Verdi',
                phone: '3335678901',
                type: 'rider',
                role: 'rider',
                userType: 'rider',
                vehicleType: 'scooter',
                licenseNumber: 'ABC123DE',
                registeredAt: '2025-01-20T16:45:00Z',
                profileImage: 'https://via.placeholder.com/150x150?text=GV',
                vehicleInfo: {
                    brand: 'Yamaha',
                    model: 'NMAX 125',
                    year: 2023,
                    plateNumber: 'AB123CD',
                    insuranceNumber: 'INS789456123',
                    insuranceExpiry: '2025-12-31'
                },
                workingZones: ['Centro Roma', 'EUR', 'Prati', 'Trastevere'],
                availability: {
                    monday: { start: '09:00', end: '18:00' },
                    tuesday: { start: '09:00', end: '18:00' },
                    wednesday: { start: '09:00', end: '18:00' },
                    thursday: { start: '09:00', end: '18:00' },
                    friday: { start: '09:00', end: '20:00' },
                    saturday: { start: '10:00', end: '16:00' },
                    sunday: { available: false }
                },
                stats: {
                    totalDeliveries: 342,
                    rating: 4.9,
                    onTimeDeliveryRate: 96.5,
                    avgDeliveryTime: 18,
                    totalEarnings: 2847.30
                },
                bankAccount: {
                    iban: 'IT60 X054 2811 1010 0000 0987 654',
                    bankName: 'Intesa Sanpaolo'
                },
                isActive: true,
                isAvailable: true,
                currentLocation: { lat: 41.9028, lng: 12.4964 }
            }
        ];
        localStorage.setItem('sampleUsers', JSON.stringify(sampleUsers));
    },

    initializePharmacyOrders() {
        const pharmacyOrders = [
            {
                id: 10001,
                customerId: 1,
                customerName: 'Mario Rossi',
                customerPhone: '3331234567',
                customerEmail: 'mario.rossi@email.com',
                date: '29/07/2025',
                time: '14:30',
                status: 'pending',
                items: [
                    { id: 1, name: 'Tachipirina 1000mg', quantity: 2, price: 8.50, total: 17.00 },
                    { id: 3, name: 'Aspirina 100mg', quantity: 1, price: 6.20, total: 6.20 }
                ],
                subtotal: 23.20,
                deliveryFee: 3.50,
                total: 26.70,
                deliveryAddress: {
                    label: 'Casa',
                    street: 'Via Roma, 123',
                    city: 'Roma',
                    cap: '00100',
                    floor: '2° piano',
                    notes: 'Citofono: Rossi'
                },
                paymentMethod: {
                    type: 'card',
                    label: 'Carta di Credito **** 1234'
                },
                pharmacy: 'centrale',
                estimatedDelivery: '15:30',
                notes: 'Consegna urgente per favore'
            },
            {
                id: 10002,
                customerId: 1,
                customerName: 'Mario Rossi',
                customerPhone: '3331234567',
                customerEmail: 'mario.rossi@email.com',
                date: '29/07/2025',
                time: '11:15',
                status: 'preparing',
                items: [
                    { id: 4, name: 'Vitamina C 1000mg', quantity: 1, price: 15.90, total: 15.90 },
                    { id: 5, name: 'Crema Solare SPF 50', quantity: 1, price: 18.50, total: 18.50 }
                ],
                subtotal: 34.40,
                deliveryFee: 3.50,
                total: 37.90,
                deliveryAddress: {
                    label: 'Ufficio',
                    street: 'Via Milano, 45',
                    city: 'Roma',
                    cap: '00187',
                    floor: '3° piano',
                    notes: 'Edificio B, scala 2'
                },
                paymentMethod: {
                    type: 'paypal',
                    label: 'PayPal'
                },
                pharmacy: 'centrale',
                estimatedDelivery: '12:30',
                acceptedAt: '11:20',
                notes: ''
            },
            {
                id: 10003,
                customerId: 1,
                customerName: 'Mario Rossi',
                customerPhone: '3331234567',
                customerEmail: 'mario.rossi@email.com',
                date: '28/07/2025',
                time: '16:45',
                status: 'completed',
                items: [
                    { id: 2, name: 'Amoxicillina 500mg', quantity: 1, price: 12.30, total: 12.30 }
                ],
                subtotal: 12.30,
                deliveryFee: 3.50,
                total: 15.80,
                deliveryAddress: {
                    label: 'Casa',
                    street: 'Via Roma, 123',
                    city: 'Roma',
                    cap: '00100',
                    floor: '2° piano',
                    notes: 'Citofono: Rossi'
                },
                paymentMethod: {
                    type: 'cash',
                    label: 'Contrassegno'
                },
                pharmacy: 'centrale',
                acceptedAt: '16:50',
                completedAt: '17:30',
                deliveredAt: '17:35',
                notes: 'Prescrizione medica allegata'
            }
        ];
        localStorage.setItem('pharmacyOrders', JSON.stringify(pharmacyOrders));
    },

    initializeDatabaseOrders() {
        console.log('🗄️ Initializing database orders for riders...');
        
        const databaseOrders = [
            {
                id: 'ord_ready_001',
                orderNumber: 'ORD25080501',
                customerId: 'cust_001',
                customerName: 'Mario Rossi',
                customerPhone: '3331234567',
                customerEmail: 'mario.rossi@email.com',
                pharmacyId: 'ph_001',
                pharmacyName: 'Farmacia San Marco',
                status: 'ready',
                items: [
                    { productId: 'prod_001', name: 'Tachipirina 1000mg', quantity: 2, price: 8.50 },
                    { productId: 'prod_002', name: 'Aspirina 100mg', quantity: 1, price: 6.20 }
                ],
                total: 26.70,
                deliveryFee: 3.50,
                customerAddress: 'Via Verdi 78, Roma',
                pharmacyAddress: 'Via Roma 123, Roma',
                createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
                updatedAt: new Date(Date.now() - 1800000).toISOString(),
                estimatedDeliveryTime: 25,
                notes: 'Consegna preferibilmente entro le 18:00'
            },
            {
                id: 'ord_ready_002',
                orderNumber: 'ORD25080502',
                customerId: 'cust_002',
                customerName: 'Anna Bianchi',
                customerPhone: '3339876543',
                customerEmail: 'anna.bianchi@email.com',
                pharmacyId: 'ph_002',
                pharmacyName: 'Farmacia Europa',
                status: 'ready',
                items: [
                    { productId: 'prod_003', name: 'Vitamina C 1000mg', quantity: 1, price: 15.90 },
                    { productId: 'prod_004', name: 'Crema Solare SPF 50', quantity: 1, price: 18.50 },
                    { productId: 'prod_005', name: 'Collutorio', quantity: 1, price: 7.30 }
                ],
                total: 45.20,
                deliveryFee: 4.50,
                customerAddress: 'Corso Italia 156, Roma',
                pharmacyAddress: 'Via Europa 45, Roma',
                createdAt: new Date(Date.now() - 2700000).toISOString(), // 45 minutes ago
                updatedAt: new Date(Date.now() - 2700000).toISOString(),
                estimatedDeliveryTime: 35,
                notes: 'Chiamare prima della consegna'
            },
            {
                id: 'ord_ready_003',
                orderNumber: 'ORD25080503',
                customerId: 'cust_003',
                customerName: 'Giuseppe Verdi',
                customerPhone: '3335551234',
                customerEmail: 'giuseppe.verdi@email.com',
                pharmacyId: 'ph_003',
                pharmacyName: 'Farmacia del Centro',
                status: 'ready',
                items: [
                    { productId: 'prod_006', name: 'Antibiotico', quantity: 1, price: 12.30 },
                    { productId: 'prod_007', name: 'Fermenti Lattici', quantity: 1, price: 8.90 }
                ],
                total: 24.70,
                deliveryFee: 3.00,
                customerAddress: 'Via Nazionale 89, Roma',
                pharmacyAddress: 'Piazza Centro 12, Roma',
                createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
                updatedAt: new Date(Date.now() - 900000).toISOString(),
                estimatedDeliveryTime: 20,
                notes: 'Ricetta medica già consegnata in farmacia'
            },
            {
                id: 'ord_accepted_001',
                orderNumber: 'ORD25080500',
                customerId: 'cust_004',
                customerName: 'Laura Neri',
                customerPhone: '3334445566',
                customerEmail: 'laura.neri@email.com',
                pharmacyId: 'ph_001',
                pharmacyName: 'Farmacia Centrale',
                riderId: '4', // Assigned to current test rider (Giuseppe Verdi)
                status: 'accepted',
                items: [
                    { productId: 'prod_008', name: 'Sciroppo per tosse', quantity: 1, price: 9.50 },
                    { productId: 'prod_009', name: 'Cerotti', quantity: 2, price: 4.20 }
                ],
                total: 21.40,
                deliveryFee: 3.50,
                customerAddress: 'Via Milano 45, Roma',
                pharmacyAddress: 'Via Roma 123, Roma',
                createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                updatedAt: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
                acceptedAt: new Date(Date.now() - 1800000).toISOString(),
                estimatedDeliveryTime: 30,
                notes: 'Consegna urgente'
            }
        ];
        
        localStorage.setItem('eudora_orders', JSON.stringify(databaseOrders));
        console.log('✅ Database orders initialized:', databaseOrders.length, 'orders');
    },

    initializeSampleAddresses() {
        const sampleAddresses = [
            {
                id: 1,
                userId: 1,
                label: 'Casa',
                street: 'Via Roma, 123',
                city: 'Roma',
                cap: '00100',
                province: 'RM',
                region: 'Lazio',
                floor: '2° piano',
                notes: 'Citofono: Rossi - Suonare anche al vicino se non rispondo',
                isDefault: true,
                coordinates: { lat: 41.9028, lng: 12.4964 },
                deliveryInstructions: 'Lasciare il pacco al portiere se assente'
            },
            {
                id: 2,
                userId: 1,
                label: 'Ufficio',
                street: 'Via Milano, 45',
                city: 'Roma',
                cap: '00187',
                province: 'RM',
                region: 'Lazio',
                floor: '3° piano',
                notes: 'Edificio B, scala 2 - Ufficio 305',
                isDefault: false,
                coordinates: { lat: 41.9109, lng: 12.4818 },
                deliveryInstructions: 'Consegna solo negli orari 9:00-18:00'
            },
            {
                id: 3,
                userId: 1,
                label: 'Casa dei Genitori',
                street: 'Via Nazionale, 78',
                city: 'Frascati',
                cap: '00044',
                province: 'RM',
                region: 'Lazio',
                floor: 'Piano terra',
                notes: 'Villa con cancello automatico - Codice: 1234',
                isDefault: false,
                coordinates: { lat: 41.8089, lng: 12.6801 },
                deliveryInstructions: 'Suonare il campanello del garage'
            }
        ];
        localStorage.setItem('sampleAddresses', JSON.stringify(sampleAddresses));
    },

    initializeSamplePaymentMethods() {
        const samplePaymentMethods = [
            {
                id: 1,
                userId: 1,
                type: 'card',
                label: 'Carta di Credito Principale',
                cardNumber: '4532 **** **** 1234',
                last4: '1234',
                brand: 'Visa',
                cardholderName: 'Mario Rossi',
                expiryMonth: '12',
                expiryYear: '2027',
                cvv: '***',
                isDefault: true,
                isVerified: true,
                addedDate: '2024-01-15T10:30:00Z',
                billingAddress: {
                    street: 'Via Roma, 123',
                    city: 'Roma',
                    cap: '00100',
                    country: 'Italia'
                }
            },
            {
                id: 2,
                userId: 1,
                type: 'card',
                label: 'Carta Aziendale',
                cardNumber: '5555 **** **** 9876',
                last4: '9876',
                brand: 'Mastercard',
                cardholderName: 'Mario Rossi',
                expiryMonth: '08',
                expiryYear: '2026',
                cvv: '***',
                isDefault: false,
                isVerified: true,
                addedDate: '2024-03-20T14:15:00Z',
                billingAddress: {
                    street: 'Via Milano, 45',
                    city: 'Roma',
                    cap: '00187',
                    country: 'Italia'
                }
            },
            {
                id: 3,
                userId: 1,
                type: 'paypal',
                label: 'PayPal Account',
                email: 'mario.rossi@email.com',
                accountId: 'PP_MARIO_ROSSI_2024',
                isDefault: false,
                isVerified: true,
                addedDate: '2024-02-10T09:45:00Z',
                balance: '€127.45'
            },
            {
                id: 4,
                userId: 1,
                type: 'bank_transfer',
                label: 'Bonifico Bancario',
                bankName: 'Unicredit',
                iban: 'IT60 X054 2811 1010 0000 0123 456',
                accountHolder: 'Mario Rossi',
                isDefault: false,
                isVerified: true,
                addedDate: '2024-01-25T16:20:00Z'
            },
            {
                id: 5,
                userId: 1,
                type: 'cash',
                label: 'Contrassegno',
                description: 'Pagamento alla consegna in contanti',
                maxAmount: 500.00,
                fee: 2.50,
                isDefault: false,
                isVerified: true
            },
            {
                id: 6,
                userId: 1,
                type: 'digital_wallet',
                label: 'Google Pay',
                walletId: 'GP_MARIO_ROSSI_2024',
                linkedCard: '4532 **** **** 1234',
                isDefault: false,
                isVerified: true,
                addedDate: '2024-04-05T11:30:00Z'
            }
        ];
        localStorage.setItem('samplePaymentMethods', JSON.stringify(samplePaymentMethods));
    },

    initializePharmacyProducts() {
        const pharmacyProducts = [
            {
                id: 101,
                name: 'Moment 200mg',
                category: 'farmaci',
                price: 7.80,
                description: 'Antinfiammatorio per dolori e febbre',
                pharmacy: 'centrale',
                stock: 18,
                prescription: false,
                addedAt: '2025-07-20T09:15:00Z'
            },
            {
                id: 102,
                name: 'Bentelan 1mg',
                category: 'farmaci',
                price: 9.50,
                description: 'Cortisonico per allergie e infiammazioni',
                pharmacy: 'centrale',
                stock: 8,
                prescription: true,
                addedAt: '2025-07-18T14:30:00Z'
            },
            {
                id: 103,
                name: 'Enterogermina',
                category: 'salute',
                price: 12.90,
                description: 'Fermenti lattici per il benessere intestinale',
                pharmacy: 'centrale',
                stock: 25,
                prescription: false,
                addedAt: '2025-07-15T11:20:00Z'
            }
        ];
        localStorage.setItem('pharmacyProducts', JSON.stringify(pharmacyProducts));
    },

    initializeUserPreferences() {
        const userPreferences = {
            userId: 1,
            notifications: {
                orderUpdates: true,
                promotions: false,
                newsletter: true,
                sms: true,
                email: true,
                push: true
            },
            privacy: {
                shareDataWithPartners: false,
                allowTargetedAds: false,
                showOnlineStatus: true
            },
            delivery: {
                preferredTimeSlot: 'morning',
                leaveAtDoor: false,
                requireSignature: true,
                specialInstructions: 'Suonare il citofono due volte'
            },
            language: 'it',
            currency: 'EUR',
            theme: 'light'
        };
        localStorage.setItem('userPreferences', JSON.stringify(userPreferences));
    },

    initializeUserNotifications() {
        const userNotifications = [
            {
                id: 1,
                userId: 1,
                type: 'order_update',
                title: 'Ordine in preparazione',
                message: 'Il tuo ordine #10002 è stato preso in carico dalla farmacia ed è in preparazione.',
                timestamp: '2025-07-29T11:20:00Z',
                isRead: false,
                icon: 'fas fa-cog',
                color: 'blue'
            },
            {
                id: 2,
                userId: 1,
                type: 'delivery_completed',
                title: 'Ordine consegnato',
                message: 'Il tuo ordine #10003 è stato consegnato con successo.',
                timestamp: '2025-07-28T17:35:00Z',
                isRead: true,
                icon: 'fas fa-check-circle',
                color: 'green'
            },
            {
                id: 3,
                userId: 1,
                type: 'promotion',
                title: 'Sconto del 15%',
                message: 'Usa il codice ESTATE15 per ottenere il 15% di sconto sul tuo prossimo ordine.',
                timestamp: '2025-07-27T09:00:00Z',
                isRead: true,
                icon: 'fas fa-tag',
                color: 'purple'
            },
            {
                id: 4,
                userId: 1,
                type: 'system',
                title: 'Nuovo metodo di pagamento',
                message: 'È stata aggiunta una nuova carta di credito al tuo account.',
                timestamp: '2025-07-26T14:15:00Z',
                isRead: true,
                icon: 'fas fa-credit-card',
                color: 'gray'
            }
        ];
        localStorage.setItem('userNotifications', JSON.stringify(userNotifications));
    },

    initializeUserFavorites() {
        const userFavorites = [
            { userId: 1, productId: 1, addedAt: '2025-07-20T10:30:00Z' },
            { userId: 1, productId: 4, addedAt: '2025-07-18T15:45:00Z' },
            { userId: 1, productId: 5, addedAt: '2025-07-15T09:20:00Z' }
        ];
        localStorage.setItem('userFavorites', JSON.stringify(userFavorites));
    },

    initializeUserSearchHistory() {
        const userSearchHistory = [
            { userId: 1, query: 'tachipirina', timestamp: '2025-07-29T08:30:00Z' },
            { userId: 1, query: 'vitamina c', timestamp: '2025-07-28T14:20:00Z' },
            { userId: 1, query: 'crema solare', timestamp: '2025-07-27T16:45:00Z' },
            { userId: 1, query: 'antibiotico', timestamp: '2025-07-26T11:15:00Z' },
            { userId: 1, query: 'fermenti lattici', timestamp: '2025-07-25T09:30:00Z' }
        ];
        localStorage.setItem('userSearchHistory', JSON.stringify(userSearchHistory));
    },

    showTestDataNotification() {
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 notification-slide-in max-w-sm';
        toast.innerHTML = `
            <div class="flex items-start">
                <i class="fas fa-database mt-1 mr-2"></i>
                <div class="flex-1">
                    <div class="font-medium">Dati di test completi caricati!</div>
                    <div class="text-sm opacity-90 mt-1">
                        Inclusi: carte di credito, indirizzi, ordini, notifiche e preferenze utente
                    </div>
                    <div class="text-xs opacity-75 mt-1">
                        Controlla la console per tutti i dettagli
                    </div>
                    <div class="text-xs opacity-75 mt-1">
                        <button onclick="TestData.reset()" class="underline hover:no-underline">Reset dati test</button>
                    </div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-white hover:text-gray-200 text-lg">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Auto-remove after 7 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 7000);
    },

    logTestAccounts() {
        console.log('🔑 Account di test disponibili:');
        console.log('👤 Cliente: mario.rossi@email.com / password123');
        console.log('🏥 Farmacia: farmacia.centrale@email.com / farmacia123');
        console.log('🚴 Rider: rider@eudora.com / rider123');
        console.log('⚙️ Admin: admin@eudora.com / admin123');
        console.log('\n📊 Dati fake inclusi:');
        console.log('💳 6 metodi di pagamento (Visa, Mastercard, PayPal, Bonifico, Contrassegno, Google Pay)');
        console.log('🏠 3 indirizzi di consegna completi con coordinate GPS');
        console.log('📦 3 ordini farmacia (pending, preparing, completed)');
        console.log('💊 Prodotti farmacia e catalogo generale');
        console.log('🔔 Cronologia notifiche utente');
        console.log('⭐ Lista preferiti e cronologia ricerche');
        console.log('⚙️ Preferenze utente e impostazioni privacy');
        console.log('📍 Dati geolocalizzazione e zone di consegna');
    },

    reset() {
        console.log('🔄 Resetting all test data...');
        
        // Clear all test data from localStorage
        const keysToRemove = [
            'testDataInitialized',
            'sampleUsers', 
            'sampleAddresses', 
            'samplePaymentMethods', 
            'sampleOrders',
            'userAddresses',
            'userPaymentMethods', 
            'userOrders',
            'userCart',
            'sampleNotifications',
            'samplePreferences',
            'userNotifications',
            'userPreferences',
            'pharmacyOrders',
            'pharmacyProducts',
            'eudora_orders'
        ];
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
        
        console.log('✅ All test data cleared');
        
        // Reinitialize test data
        this.initializeTestData();
        
        // Reload user data if logged in
        if (EudoraApp.currentUser) {
            Customer.loadData();
            if (EudoraApp.currentUser.type === 'customer') {
                Customer.loadProfile();
            }
        }
        
        // Show success notification
        Utils.showToast('Dati di test resettati e ricaricati!', 'success');
        console.log('🎉 Test data reset complete');
    }
};

// Make functions available globally
window.TestData = TestData;
window.resetTestData = () => TestData.reset();
