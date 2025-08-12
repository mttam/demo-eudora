// filepath: js/landing-page.js
// Landing page functionality - hero, sections, WhatsApp integration

const LandingPage = {
    init() {
        console.log('📄 Initializing Landing Page...');
        console.log('📄 Current page URL:', window.location.href);
        console.log('📄 Checking DOM elements...');
        
        // Check if we're on the landing page
        const heroElement = document.getElementById('hero');
        if (!heroElement) {
            console.log('📄 No hero element found - not on landing page, skipping initialization');
            return;
        }
        
        console.log('📄 Hero element found, proceeding with landing page initialization');
        
        this.loadPageData();
        this.setupWhatsAppLinks();
        this.initializeNavigation();
    },

    // Funzione per gestire i link WhatsApp
    getWhatsAppUrl(phoneNumber) {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return isMobile ? `whatsapp://send?phone=${phoneNumber}` : `https://wa.me/${phoneNumber}`;
    },

    // Funzione per aggiungere onclick handler ai link WhatsApp
    setupWhatsAppLinks() {
        document.querySelectorAll('a[href*="whatsapp://"]').forEach(link => {
            link.addEventListener('click', function(e) {
                const phoneNumber = this.href.match(/phone=(\d+)/)?.[1];
                if (phoneNumber) {
                    this.href = LandingPage.getWhatsAppUrl(phoneNumber);
                }
            });
        });
    },

    async loadPageData() {
        console.log('📊 Loading page data from data.json...');
        try {
            const response = await fetch('data.json');
            console.log('📊 Fetch response:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log('📊 Data loaded successfully:', data);
            
            console.log('🎨 Rendering hero section...');
            this.renderHeroSection(data.heroSection);
            
            console.log('🎨 Rendering how-to-order section...');
            this.renderHowToOrderSection(data.howToOrderSection);
            
            console.log('🎨 Rendering benefits section...');
            this.renderBenefitsSection(data.benefitsSection);
            
            console.log('🎨 Rendering work-with-us section...');
            this.renderWorkWithUsSection(data.workWithUsSection);
            
            console.log('🎨 Rendering CTA section...');
            this.renderCtaSection(data.ctaSection);
            
            // Setup WhatsApp links after rendering
            console.log('📱 Setting up WhatsApp links...');
            this.setupWhatsAppLinks();
            
            console.log('✅ All sections rendered successfully');
            
        } catch (error) {
            console.error('❌ Error loading page data:', error);
            console.error('❌ Error details:', error.message, error.stack);
            
            // Fallback: load basic content if data.json fails
            console.log('📄 Loading fallback content...');
            this.loadFallbackContent();
        }
    },

    loadFallbackContent() {
        console.log('📄 Loading fallback static content...');
        
        // Basic hero section
        const heroContainer = document.getElementById('hero');
        if (heroContainer) {
            heroContainer.innerHTML = `
                <section class="hero-gradient py-16 md:py-24">
                    <div class="container mx-auto px-4 flex flex-col md:flex-row items-center">
                        <div class="md:w-1/2 mb-10 md:mb-0 md:pr-10">
                            <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                                Consegna di farmaci a domicilio
                            </h1>
                            <p class="text-lg text-gray-600 mb-8">
                                Ordina tutti i prodotti della farmacia di cui hai bisogno, anche quelli con ricetta e ricevili direttamente dove vuoi
                            </p>
                            <div class="flex flex-col sm:flex-row gap-4">
                                <a href="whatsapp://send?phone=393500378569" 
                                   class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition">
                                    <i class="fab fa-whatsapp mr-2"></i>
                                    Ordina su WhatsApp
                                </a>
                                <a href="tel:3500378569" 
                                   class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition">
                                    <i class="fas fa-phone-alt mr-2"></i>
                                    Chiamaci ora
                                </a>
                            </div>
                        </div>
                        <div class="md:w-1/2">
                            <img src="public/base.png" alt="Medicine delivery" class="w-full h-auto rounded-lg shadow-lg">
                        </div>
                    </div>
                </section>`;
        }
        
        // Basic benefits section
        const benefitsContainer = document.getElementById('benefits');
        if (benefitsContainer) {
            benefitsContainer.innerHTML = `
                <section class="py-16 bg-gray-50">
                    <div class="container mx-auto px-4">
                        <div class="text-center mb-12">
                            <h2 class="text-3xl font-bold text-gray-800 mb-4">I nostri servizi</h2>
                            <p class="text-lg text-gray-600">Tutto quello che ti serve per la tua salute</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div class="text-center">
                                <div class="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-pills text-2xl text-blue-600"></i>
                                </div>
                                <h3 class="text-xl font-semibold mb-2">Farmaci da banco</h3>
                                <p class="text-gray-600">Tutti i farmaci disponibili senza ricetta medica</p>
                            </div>
                            <div class="text-center">
                                <div class="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-prescription-bottle-alt text-2xl text-green-600"></i>
                                </div>
                                <h3 class="text-xl font-semibold mb-2">Farmaci con ricetta</h3>
                                <p class="text-gray-600">Anche i farmaci che richiedono prescrizione medica</p>
                            </div>
                            <div class="text-center">
                                <div class="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-truck text-2xl text-purple-600"></i>
                                </div>
                                <h3 class="text-xl font-semibold mb-2">Consegna rapida</h3>
                                <p class="text-gray-600">Consegna in giornata o quando preferisci</p>
                            </div>
                        </div>
                    </div>
                </section>`;
        }
        
        // Basic work with us section
        const workContainer = document.getElementById('work-with-us');
        if (workContainer) {
            workContainer.innerHTML = `
                <section class="py-16">
                    <div class="container mx-auto px-4 text-center">
                        <h2 class="text-3xl font-bold text-gray-800 mb-4">Lavora con noi</h2>
                        <p class="text-lg text-gray-600 mb-8">Unisciti al nostro team</p>
                        <a href="whatsapp://send?phone=393500378569" 
                           class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium inline-flex items-center transition">
                            <i class="fab fa-whatsapp mr-2"></i>
                            Contattaci
                        </a>
                    </div>
                </section>`;
        }
        
        console.log('✅ Fallback content loaded');
    },

    renderHeroSection(data) {
        const heroContainer = document.getElementById('hero');
        if (!heroContainer) return;
        
        heroContainer.innerHTML = `
            <section class="hero-gradient py-16 md:py-24">
                <div class="container mx-auto px-4 flex flex-col md:flex-row items-center">
                    <div class="md:w-1/2 mb-10 md:mb-0 md:pr-10">
                        <h1 class="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-6">
                            ${data.title}
                        </h1>
                        <p class="text-lg md:text-xl text-gray-700 mb-8">
                            ${data.subtitle}
                        </p>
                        <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                            ${data.buttons.map(button => {
                                const isWhatsApp = button.url.includes('whatsapp://');
                                const url = isWhatsApp ? this.getWhatsAppUrl(button.url.match(/phone=(\d+)/)?.[1]) : button.url;
                                return `
                                <a href="${url}" ${button.url.startsWith('https') || button.url.startsWith('whatsapp://') ? 'target="_blank" rel="noopener noreferrer"' : ''}
                                   class="${button.bgColor} ${button.hoverColor} text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center transition">
                                    <i class="${button.iconClass} mr-2 text-xl"></i> ${button.text}
                                </a>
                            `}).join('')}
                        </div>
                    </div>
                    <div class="md:w-1/2">
                        <img src="${data.image.src}" 
                             alt="${data.image.alt}" 
                             class="rounded-xl shadow-xl w-full h-auto">
                    </div>
                </div>
            </section>
        `;
    },

    renderHowToOrderSection(data) {
        const howToOrderContainer = document.getElementById('how-to-order');
        if (!howToOrderContainer) return;
        
        howToOrderContainer.innerHTML = `
            <section class="py-16 bg-white">
                <div class="container mx-auto px-4">
                    <div class="text-center mb-16">
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">${data.title}</h2>
                        <p class="text-xl text-gray-600 max-w-2xl mx-auto">${data.subtitle}</p>
                    </div>
                    
                    <!-- Diagramma di flusso -->
                    <div class="max-w-6xl mx-auto">
                        <div class="flex flex-col lg:flex-row items-center justify-center space-y-8 lg:space-y-0 lg:space-x-8">
                            ${data.cards.map((card, index) => `
                                <div class="flex flex-col items-center">
                                    <!-- Numero del passaggio -->
                                    <div class="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-lg mb-4 shadow-lg">
                                        ${index + 1}
                                    </div>
                                    
                                    <!-- Card del passaggio -->
                                    <div class="how-to-card bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl shadow-lg border-2 border-gray-100 hover:border-blue-200 transition-all duration-300 transform hover:scale-105 max-w-xs">
                                        <div class="${card.iconColor} mb-4 text-center">
                                            <i class="${card.iconClass} text-4xl"></i>
                                        </div>
                                        <h3 class="text-lg font-bold mb-3 text-center">${card.title}</h3>
                                        <p class="text-gray-600 mb-4 text-center text-sm">${card.description}</p>
                                    </div>
                                </div>
                                
                                <!-- Freccia di collegamento -->
                                ${index < data.cards.length - 1 ? `
                                    <div class="hidden lg:block">
                                        <div class="flex items-center">
                                            <div class="w-8 h-0.5 bg-blue-300"></div>
                                            <i class="fas fa-chevron-right text-blue-400 text-xl mx-2"></i>
                                            <div class="w-8 h-0.5 bg-blue-300"></div>
                                        </div>
                                    </div>
                                    <div class="lg:hidden flex justify-center">
                                        <i class="fas fa-chevron-down text-blue-400 text-2xl"></i>
                                    </div>
                                ` : ''}
                            `).join('')}
                        </div>
                    </div>
                </div>
            </section>
        `;
    },

    renderBenefitsSection(data) {
        const benefitsContainer = document.getElementById('benefits');
        if (!benefitsContainer) return;
        
        benefitsContainer.innerHTML = `
            <section class="py-16 bg-gray-50">
                <div class="container mx-auto px-4">
                    <div class="text-center mb-16">
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">${data.title}</h2>
                        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                            ${data.subtitle}
                        </p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        ${data.benefits.map(benefit => `
                            <div class="benefit-card bg-white p-8 rounded-xl shadow-md border border-gray-100 transition duration-300">
                                <div class="${benefit.bgColor} w-16 h-16 rounded-full flex items-center justify-center mb-6">
                                    <i class="${benefit.iconClass} ${benefit.iconColor} text-2xl"></i>
                                </div>
                                <h3 class="text-xl font-bold mb-3">${benefit.title}</h3>
                                <p class="text-gray-600">
                                    ${benefit.description}
                                </p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    },

    renderWorkWithUsSection(data) {
        const workWithUsContainer = document.getElementById('work-with-us');
        if (!workWithUsContainer) return;
        
        workWithUsContainer.innerHTML = `
            <section class="py-16 bg-white">
                <div class="container mx-auto px-4">
                    <div class="text-center mb-16">
                        <h2 class="text-3xl md:text-4xl font-bold text-gray-800 mb-4">${data.title}</h2>
                        <p class="text-xl text-gray-600 max-w-3xl mx-auto">
                            ${data.subtitle}
                        </p>
                    </div>
                    
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        ${data.cards.map(card => `
                            <div class="${card.bgGradient} p-8 rounded-xl shadow-md border ${card.borderColor}">
                                <div class="flex flex-col md:flex-row">
                                    <div class="md:w-1/3 mb-6 md:mb-0 flex justify-center">
                                        <div class="${card.bgIconColor} w-24 h-24 rounded-full flex items-center justify-center">
                                            <i class="${card.iconClass} ${card.iconColor} text-4xl"></i>
                                        </div>
                                    </div>
                                    <div class="md:w-2/3 md:pl-6">
                                        <h3 class="text-2xl font-bold mb-3 ${card.titleColor}">${card.title}</h3>
                                        <p class="text-gray-700 mb-4">
                                            ${card.description}
                                        </p>
                                        <a href="${card.buttonUrl}" ${card.buttonUrl.startsWith('https') ? 'target="_blank" rel="noopener noreferrer"' : ''} class="inline-block ${card.buttonColor} ${card.buttonHover} text-white px-6 py-2 rounded-lg font-medium transition">
                                            ${card.buttonText}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    },

    renderCtaSection(data) {
        const ctaContainer = document.getElementById('cta');
        if (!ctaContainer) return;
        
        ctaContainer.innerHTML = `
            <section class="py-16 bg-blue-600 text-white">
                <div class="container mx-auto px-4 text-center">
                    <h2 class="text-3xl md:text-4xl font-bold mb-6">${data.title}</h2>
                    <p class="text-xl mb-8 max-w-2xl mx-auto">
                        ${data.subtitle}
                    </p>
                    <div class="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                        ${data.buttons.map(button => {
                            const isWhatsApp = button.url.includes('whatsapp://');
                            const url = isWhatsApp ? this.getWhatsAppUrl(button.url.match(/phone=(\d+)/)?.[1]) : button.url;
                            return `
                            <a href="${url}" ${button.url.startsWith('https') || button.url.startsWith('whatsapp://') ? 'target="_blank" rel="noopener noreferrer"' : ''}
                               class="${button.bgColor} ${button.textColor} ${button.hoverColor} px-8 py-3 rounded-lg font-bold text-lg flex items-center justify-center transition">
                                <i class="${button.iconClass} mr-3 text-xl"></i> ${button.text}
                            </a>
                        `}).join('')}
                    </div>
                </div>
            </section>
        `;
    },

    initializeNavigation() {
        // Initialize mobile menu and other navigation features
        console.log('📱 Navigation initialized');
        
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        console.log('📱 Mobile menu button found:', !!mobileMenuButton);
        console.log('📱 Mobile menu found:', !!mobileMenu);
        
        if (mobileMenuButton && mobileMenu) {
            console.log('📱 Setting up mobile menu event listeners...');
            const menuIcon = mobileMenuButton.querySelector('i');
            console.log('📱 Menu icon found:', !!menuIcon);
            
            mobileMenuButton.addEventListener('click', function(e) {
                console.log('📱 Mobile menu button clicked!');
                e.preventDefault();
                
                const isMenuOpen = !mobileMenu.classList.contains('hidden');
                console.log('📱 Menu currently open:', isMenuOpen);
                
                if (isMenuOpen) {
                    console.log('📱 Closing menu...');
                    closeMobileMenu();
                } else {
                    console.log('📱 Opening menu...');
                    openMobileMenu();
                }
            });
            
            function openMobileMenu() {
                console.log('📱 Opening mobile menu - removing hidden class');
                mobileMenu.classList.remove('hidden');
                mobileMenu.classList.add('block');
                if (menuIcon) {
                    menuIcon.classList.remove('fa-bars');
                    menuIcon.classList.add('fa-times');
                    console.log('📱 Changed icon to X');
                }
            }
            
            function closeMobileMenu() {
                console.log('📱 Closing mobile menu - adding hidden class');
                mobileMenu.classList.add('hidden');
                mobileMenu.classList.remove('block');
                if (menuIcon) {
                    menuIcon.classList.remove('fa-times');
                    menuIcon.classList.add('fa-bars');
                    console.log('📱 Changed icon to hamburger');
                }
            }
            
            // Make closeMobileMenu available globally
            window.closeMobileMenu = closeMobileMenu;
            
            // Make a global test function
            window.testMobileMenu = function() {
                console.log('🧪 Testing mobile menu...');
                console.log('🧪 Menu button:', mobileMenuButton);
                console.log('🧪 Menu element:', mobileMenu);
                console.log('🧪 Menu classes:', mobileMenu.className);
                openMobileMenu();
            };
            
            // Close mobile menu when clicking on links
            mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', function() {
                    console.log('📱 Menu link clicked, closing menu');
                    closeMobileMenu();
                });
            });
            
            console.log('✅ Mobile menu setup complete');
        } else {
            console.error('❌ Mobile menu elements not found!');
        }
    }
};
