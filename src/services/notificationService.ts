
'use server';

import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

interface NotificationData {
    title: string;
    message: string;
    targetRole: string;
}

/**
 * Sends an SMS message to a given phone number.
 * TODO: Replace this with your actual SMS provider API call (e.g., Twilio).
 * @param phoneNumber The recipient's phone number.
 * @param message The message to send.
 */
async function sendSms(phoneNumber: string, message: string) {
    console.log(`--- SIMULATING SMS ---`);
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log(`--------------------`);
    // Example with Twilio:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //     body: message,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //     to: phoneNumber
    // });
    return Promise.resolve();
}

/**
 * Sends a WhatsApp message to a given phone number.
 * TODO: Replace this with your actual WhatsApp provider API call (e.g., Twilio for WhatsApp).
 * @param phoneNumber The recipient's phone number.
 * @param message The message to send.
 */
async function sendWhatsApp(phoneNumber: string, message: string) {
    console.log(`--- SIMULATING WHATSAPP ---`);
    console.log(`To: ${phoneNumber}`);
    console.log(`Message: ${message}`);
    console.log(`-------------------------`);
    // Example with Twilio for WhatsApp:
    // const twilio = require('twilio');
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await client.messages.create({
    //    body: message,
    //    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    //    to: `whatsapp:${phoneNumber}`
    // });
    return Promise.resolve();
}


/**
 * Dispatches a notification to users via SMS or other channels.
 * This function runs on the server and is triggered after a notification is created.
 * It's designed to run in the background and should not block the UI.
 * For production apps, consider using a Cloud Function triggered by a new document
 * in the 'notifications' collection for better scalability and reliability.
 * @param notification The notification data.
 */
export async function dispatchNotification(notification: NotificationData) {
    // We need to initialize a separate Firebase admin instance or use the client SDK on the server.
    // For this purpose, we'll re-initialize the client SDK.
    const { db } = initializeFirebase();
    
    let usersQuery;
    if (notification.targetRole === 'all') {
        usersQuery = query(collection(db, 'users'), where('phone', '!=', null));
    } else {
        usersQuery = query(collection(db, 'users'), where('role', '==', notification.targetRole), where('phone', '!=', null));
    }
    
    try {
        const querySnapshot = await getDocs(usersQuery);
        const users = querySnapshot.docs.map(doc => doc.data());

        const message = `${notification.title}\n\n${notification.message}`;
        
        const dispatchPromises = users.map(user => {
            if (user.phone) {
                // Here you can decide whether to send SMS, WhatsApp, or both
                return sendSms(user.phone, message);
            }
            return Promise.resolve();
        });
        
        await Promise.all(dispatchPromises);
        console.log(`Dispatched notification to ${users.length} users.`);

    } catch (error) {
        console.error("Error dispatching notifications:", error);
    }
}
