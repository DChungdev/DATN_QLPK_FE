/**
 * Notification System for Healthcare Application
 * Features:
 * - Sound notifications
 * - Queue management
 * - Auto-dismissal
 * - Server notification checks
 * - Role-based notifications (Doctor/Admin)
 */

// Global variables
let notificationSound = new Audio('/assets/sounds/notification.mp3');
let notificationQueue = [];
let isProcessingNotifications = false;
let notificationCheckInterval = null;

// Initialize notification system
document.addEventListener('DOMContentLoaded', function() {
    createNotificationContainer();
    
    // Start checking for notifications if user is logged in
    const userRole = localStorage.getItem('roles');
    if (userRole && (userRole.includes('ROLE_DOCTOR') || userRole.includes('ROLE_ADMIN'))) {
        // Check for notifications every 30 seconds
        notificationCheckInterval = setInterval(checkForNewNotifications, 30000);
        
        // Initial check
        checkForNewNotifications();
    }
    
    // Process notification queue every 3 seconds
    setInterval(processNotificationQueue, 3000);
});

/**
 * Check for new notifications from the server
 */
function checkForNewNotifications() {
    const userRole = localStorage.getItem('roles');
    const username = localStorage.getItem('userName');
    
    if (!username) return;
    
    let endpoint = '';
    
    // Determine endpoint based on user role
    if (userRole.includes('ROLE_DOCTOR')) {
        endpoint = `/api/notifications/doctor/${username}`;
    } else if (userRole.includes('ROLE_ADMIN')) {
        endpoint = `/api/notifications/admin/${username}`;
    } else {
        return; // Exit if not doctor or admin
    }
    
    // Fetch notifications from server
    axios.get(endpoint)
        .then(response => {
            if (response.data && Array.isArray(response.data)) {
                // Filter for unread notifications
                const unreadNotifications = response.data.filter(notification => !notification.read);
                
                // Add unread notifications to queue
                unreadNotifications.forEach(notification => {
                    // Avoid duplicates
                    if (!notificationQueue.some(item => item.id === notification.id)) {
                        notificationQueue.push(notification);
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error fetching notifications:', error);
        });
}

/**
 * Process notification queue
 */
function processNotificationQueue() {
    if (isProcessingNotifications || notificationQueue.length === 0) return;
    
    isProcessingNotifications = true;
    const notification = notificationQueue.shift();
    
    // Display notification
    showNotification(notification.title, notification.message, notification.type || 'info');
    
    // Mark notification as read in backend
    if (notification.id) {
        axios.post(`/api/notifications/${notification.id}/read`)
            .catch(error => {
                console.error('Error marking notification as read:', error);
            });
    }
    
    isProcessingNotifications = false;
}

/**
 * Show notification with sound
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, info, warning, error)
 * @param {number} duration - Duration in ms before auto-dismissal (default: 5000ms)
 */
function showNotification(title, message, type = 'info', duration = 5000) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-header">
            <strong>${title}</strong>
            <button class="notification-close">&times;</button>
        </div>
        <div class="notification-body">${message}</div>
    `;
    
    // Get notification container
    const container = document.getElementById('notification-container');
    if (!container) {
        createNotificationContainer();
    }
    
    // Add notification to container
    document.getElementById('notification-container').appendChild(notification);
    
    // Play sound
    notificationSound.play().catch(e => {
        console.warn('Could not play notification sound:', e);
    });
    
    // Add dismiss event listener
    notification.querySelector('.notification-close').addEventListener('click', function() {
        dismissNotification(notification);
    });
    
    // Auto dismiss after duration
    setTimeout(() => {
        if (document.body.contains(notification)) {
            dismissNotification(notification);
        }
    }, duration);
    
    // Show notification with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
}

/**
 * Dismiss notification with animation
 * @param {HTMLElement} notification - Notification element to dismiss
 */
function dismissNotification(notification) {
    notification.classList.remove('show');
    notification.classList.add('hiding');
    
    // Remove after animation completes
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 300);
}

/**
 * Create notification container if it doesn't exist
 */
function createNotificationContainer() {
    // Check if container already exists
    if (document.getElementById('notification-container')) {
        return;
    }
    
    const container = document.createElement('div');
    container.id = 'notification-container';
    document.body.appendChild(container);
    
    // Add styles if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            #notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                max-width: 350px;
            }
            
            .notification {
                background-color: white;
                border-left: 4px solid #ccc;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-bottom: 10px;
                opacity: 0;
                transform: translateX(50px);
                transition: all 0.3s ease;
                overflow: hidden;
                border-radius: 4px;
            }
            
            .notification.show {
                opacity: 1;
                transform: translateX(0);
            }
            
            .notification.hiding {
                opacity: 0;
                transform: translateX(50px);
            }
            
            .notification-success {
                border-left-color: #28a745;
            }
            
            .notification-info {
                border-left-color: #17a2b8;
            }
            
            .notification-warning {
                border-left-color: #ffc107;
            }
            
            .notification-error {
                border-left-color: #dc3545;
            }
            
            .notification-header {
                padding: 10px 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .notification-body {
                padding: 10px 15px;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 20px;
                line-height: 1;
                opacity: 0.5;
                transition: opacity 0.2s;
            }
            
            .notification-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Public function to manually trigger a notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, info, warning, error)
 * @param {number} duration - Duration in ms before auto-dismissal
 */
function notify(title, message, type = 'info', duration = 5000) {
    showNotification(title, message, type, duration);
}

// Export functions if using module system
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
        notify
    };
} 