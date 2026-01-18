# **App Name**: HealthQueue Pro

## Core Features:

- Authentication: Secure user authentication with email and password using Firebase Authentication. Implement login, logout, and session persistence.
- User Roles: Implement admin, receptionist, and doctor roles. Store user roles in Firestore and enforce role-based access control.
- Dashboard: Display a dashboard with navigation tabs for Patient Registration, Queue Management, and Reports. The AI tool will suggest frequently accessed tabs for each type of user based on usage analysis, so they appear in the most convenient order for the current user.
- Patient Registration: Register patients by capturing their full name, phone number, and selected service type, along with a timestamp. Data will be stored in Firestore.
- Queue Management: Automatically generate queue numbers and manage the queue status (Waiting, Called, Completed). Doctors can call the next patient, adhering to a first-come, first-served logic.
- Reports: Generate daily, weekly, and monthly reports based on Firestore data, displaying the total number of patients and completed queues. The AI tool should allow users to specify the report type via free-form language in the reports dashboard.
- Firestore Integration: Utilize Firestore to store users, patients, queue data, and reports. Implement Firebase Security Rules to prevent unauthenticated access and enforce role-based access control.

## Style Guidelines:

- Primary color: A calming blue (#5DADE2) to inspire trust and reliability.
- Background color: Light blue (#EBF4FA), a desaturated version of the primary color.
- Accent color: A muted teal (#45B39D) to bring in a sense of medical care.
- Body and headline font: 'PT Sans' for a modern yet accessible feel.
- Note: currently only Google Fonts are supported.
- Use clear, professional icons representing different functionalities.
- A clean and professional layout with clear navigation for easy use by medical staff.
- Subtle animations to provide feedback on interactions, like loading or form submission.