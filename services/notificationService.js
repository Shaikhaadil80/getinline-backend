const { admin } = require('../middleware/auth');
const User = require('../models/User');

/**
 * Send a push notification to a specific user by their UID
 * @param {string} uid - Firebase UID of the target user
 * @param {Object} notification - { title, body }
 * @param {Object} data - Additional data payload (optional)
 * @returns {Promise<void>}
 */
const sendNotificationToUser = async (uid, notification, data = {}) => {
  try {
    // Find the user's FCM token
    const user = await User.findOne({ uid });
    if (!user || !user.fcmToken) {
      console.log(`No FCM token found for user ${uid}`);
      return;
    }

    const message = {
      token: user.fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data, // any custom data (must be string values)
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent successfully:', response);
  } catch (error) {
    console.error('❌ Error sending notification:', error);
  }
};

/**
 * Send a push notification to all users with a specific role in an organization
 * @param {string} organizationId - Organization ID
 * @param {Array<string>} roles - Array of roles (e.g., ['admin', 'manager'])
 * @param {Object} notification - { title, body }
 * @param {Object} data - Additional data payload (optional)
 */
const sendNotificationToOrgRoles = async (organizationId, roles, notification, data = {}) => {
  try {
    // Find all users in this organization with specified roles and have fcmToken
    const users = await User.find({
      organizationId,
      role: { $in: roles },
      fcmToken: { $exists: true, $ne: null },
    });

    if (users.length === 0) {
      console.log(`No users with FCM tokens found for org ${organizationId} and roles ${roles}`);
      return;
    }

    // Send to each user individually (or use multicast)
    const tokens = users.map(u => u.fcmToken);
    
    // Multicast is more efficient for multiple tokens
    const message = {
      tokens: tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`✅ Notifications sent to ${response.successCount} users. Failures: ${response.failureCount}`);
    
    // Optionally handle failed tokens (remove invalid ones)
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
          // You might want to remove invalid tokens from DB
        }
      });
    }
  } catch (error) {
    console.error('❌ Error sending multicast notification:', error);
  }
};

/**
 * Send a notification to a topic
 * @param {string} topic - Topic name (e.g., "org_ORG123", "professional_PROF456")
 * @param {Object} notification - { title, body }
 * @param {Object} data - Additional data
 */
const sendNotificationToTopic = async (topic, notification, data = {}) => {
  try {
    const message = {
      topic: topic,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: data,
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Notification sent to topic ${topic}:`, response);
  } catch (error) {
    console.error(`❌ Error sending to topic ${topic}:`, error);
  }
};

module.exports = {
  sendNotificationToUser,
  sendNotificationToOrgRoles,
  sendNotificationToTopic,
};