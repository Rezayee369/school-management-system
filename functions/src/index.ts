
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * An HTTPS callable function to get dashboard statistics.
 *
 * This function is intended to be called by authenticated admin users only.
 * It verifies the user's admin role via their ID token's custom claim
 * before performing aggregation queries.
 *
 * @throws {functions.https.HttpsError} 'unauthenticated' - if the user is not authenticated.
 * @throws {functions.https.HttpsError} 'permission-denied' - if the user is not an admin.
 * @returns {Promise<object>} An object containing the counts for students, teachers, staff, and classes.
 */
export const getDashboardStats = functions.https.onCall(async (_, context) => {
  // 1. Authentication and Authorization Check
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  // Check for admin custom claim on the user's token.
  // Note: You must set this claim for your admin users, e.g., using the Admin SDK.
  const isAdmin = context.auth.token.admin === true;
  if (!isAdmin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "The function must be called by an admin user."
    );
  }

  const db = admin.firestore();

  try {
    // 2. Perform Aggregation Queries
    const usersCollection = db.collection("users");
    const classesCollection = db.collection("classes");

    const [
      studentsSnapshot,
      teachersSnapshot,
      staffSnapshot,
      classesSnapshot,
    ] = await Promise.all([
      usersCollection.where("role", "==", "student").count().get(),
      usersCollection.where("role", "==", "teacher").count().get(),
      usersCollection.where("role", "==", "staff").count().get(),
      classesCollection.count().get(),
    ]);

    // 3. Return the data
    return {
      studentsCount: studentsSnapshot.data().count,
      teachersCount: teachersSnapshot.data().count,
      staffCount: staffSnapshot.data().count,
      classesCount: classesSnapshot.data().count,
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while fetching the dashboard statistics."
    );
  }
});
