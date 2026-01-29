// netlify/functions/submit-order-to-google.js
// This function serves as a proxy to send order data to Google Apps Script
// It hides the Google Apps Script URL from the client-side code for security

exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse the request body
        let orderData;
        try {
            orderData = JSON.parse(event.body);
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid JSON in request body' })
            };
        }

        // Validate required fields
        if (!orderData || !orderData.customerName || !orderData.items) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required order fields' })
            };
        }

        // Google Apps Script URL (store in environment variable for security)
        const googleAppsScriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
        
        if (!googleAppsScriptUrl) {
            console.error('❌ GOOGLE_APPS_SCRIPT_URL environment variable not set');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Server configuration error' })
            };
        }

        console.log('📤 Sending order data to Google Apps Script...');
        console.log('Order Data:', orderData);

        // Genera il nome della sheet lato server basato sulla data (es: Orders_2026-01-29)
        const today = new Date();
        const dateString = today.toISOString().split('T')[0]; // formato: YYYY-MM-DD
        const sheetName = `Orders_${dateString}`;

        // Prepare data for Google Apps Script
        const payload = {
            // Customer information
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone || 'N/A',
            customerEmail: orderData.customerEmail || 'N/A',
            
            // Order details
            orderNumber: orderData.orderNumber || '',
            orderDate: orderData.createdAt || new Date().toISOString(),
            sheetName: sheetName,
            
            // Delivery information
            deliveryAddress: orderData.deliveryAddress?.street || '',
            deliveryCity: orderData.deliveryAddress?.city || '',
            deliveryZipCode: orderData.deliveryAddress?.zipCode || '',
            deliveryProvince: orderData.deliveryAddress?.province || '',
            
            // Payment method
            paymentMethod: orderData.paymentMethod?.type || 'N/A',
            paymentLabel: orderData.paymentMethod?.label || 'N/A',
            
            // Order items
            items: JSON.stringify(orderData.items),
            itemsCount: orderData.items?.length || 0,
            
            // Financial information
            subtotal: orderData.subtotal || 0,
            deliveryFee: orderData.deliveryFee || 0,
            total: orderData.total || 0,
            
            // Status and notes
            status: orderData.status || 'pending',
            notes: orderData.notes || '',
            
            // Additional metadata
            source: 'Netlify Proxy',
            timestamp: new Date().toISOString()
        };

        // Send data to Google Apps Script using doPost
        const googleResponse = await fetch(googleAppsScriptUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            timeout: 30000 // 30 second timeout
        });

        // Log the response
        console.log(`📨 Google Apps Script Response Status: ${googleResponse.status}`);

        if (!googleResponse.ok) {
            const errorText = await googleResponse.text();
            console.error('❌ Google Apps Script error:', errorText);
            return {
                statusCode: googleResponse.status,
                body: JSON.stringify({
                    error: 'Failed to submit order to Google Apps Script',
                    details: errorText
                })
            };
        }

        const responseData = await googleResponse.json();
        console.log('✅ Order successfully submitted to Google Apps Script:', responseData);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Order data sent to Google Apps Script',
                data: responseData
            })
        };

    } catch (error) {
        console.error('❌ Error in submit-order-to-google function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
