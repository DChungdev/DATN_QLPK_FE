/**
 * Notification Service
 * Handles notifications for the application
 */

// Store notification sound
let notificationSound = null;
let notificationPermission = false;
let notifications = [];
let unreadCount = 0;

// Initialize notification service
function initNotificationService() {
    loadNotificationSound();
    requestNotificationPermission();
    setupNotificationUI();
    loadNotifications();
    setInterval(checkNewNotifications, 30000); // Check for new notifications every 30 seconds
}

// Load notification sound
function loadNotificationSound() {
    notificationSound = new Audio('/assets/sounds/notification.mp3');
    notificationSound.load();
}

// Request permission for desktop notifications
function requestNotificationPermission() {
    if ("Notification" in window) {
        Notification.requestPermission().then(function(permission) {
            notificationPermission = permission === "granted";
            console.log("Notification permission: " + permission);
        });
    }
}

// Setup notification UI
function setupNotificationUI() {
    // Add notification dropdown to navbar if it doesn't exist
    if (!$("#notification-dropdown").length) {
        const notificationUI = `
            <li class="nav-item dropdown" id="notification-dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="notificationDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <i class="fas fa-bell"></i>
                    <span class="badge badge-danger notification-badge" style="display: none;">0</span>
                </a>
                <div class="dropdown-menu dropdown-menu-right notification-menu" aria-labelledby="notificationDropdown">
                    <div class="notification-header">
                        <span>Thông báo</span>
                        <a href="#" class="mark-all-read">Đánh dấu đã đọc tất cả</a>
                    </div>
                    <div class="notification-body">
                        <div class="notification-list"></div>
                    </div>
                    <div class="notification-footer">
                        <a href="#" class="view-all-notifications">Xem tất cả thông báo</a>
                    </div>
                </div>
            </li>
        `;
        
        // Add to navbar
        $(".navbar-nav").append(notificationUI);
        
        // Add event listeners
        $(".mark-all-read").click(function(e) {
            e.preventDefault();
            markAllNotificationsAsRead();
        });
        
        $(".view-all-notifications").click(function(e) {
            e.preventDefault();
            viewAllNotifications();
        });
        
        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#notification-dropdown').length) {
                $('.notification-menu').removeClass('show');
            }
        });
    }
}

// Load notifications from server
function loadNotifications() {
    // Get user info
    const userType = localStorage.getItem("userType");
    const userId = localStorage.getItem("userId");
    
    if (!userId || !userType) {
        console.error("User ID or type not found");
        return;
    }
    
    // API endpoint based on user type
    let endpoint = `/api/notifications/${userType.toLowerCase()}/${userId}`;
    
    axios.get(endpoint)
        .then(response => {
            if (response.data && Array.isArray(response.data)) {
                notifications = response.data;
                updateNotificationUI();
                updateUnreadCount();
            }
        })
        .catch(error => {
            console.error("Error loading notifications:", error);
        });
}

// Check for new notifications
function checkNewNotifications() {
    const userType = localStorage.getItem("userType");
    const userId = localStorage.getItem("userId");
    
    if (!userId || !userType) return;
    
    // For demo purposes, create a test notification
    if (Math.random() > 0.7) { // 30% chance of new notification
        createTestNotification();
        return;
    }
    
    let endpoint = `/api/notifications/${userType.toLowerCase()}/${userId}/unread`;
    
    axios.get(endpoint)
        .then(response => {
            if (response.data && Array.isArray(response.data)) {
                const newNotifications = response.data.filter(notification => 
                    !notifications.some(n => n.id === notification.id)
                );
                
                if (newNotifications.length > 0) {
                    // Add new notifications to the list
                    notifications = [...newNotifications, ...notifications];
                    
                    // Update UI
                    updateNotificationUI();
                    updateUnreadCount();
                    
                    // Play sound for new notifications
                    playNotificationSound();
                    
                    // Show desktop notification for the newest notification
                    if (newNotifications.length > 0) {
                        showDesktopNotification(newNotifications[0]);
                    }
                }
            }
        })
        .catch(error => {
            console.error("Error checking for new notifications:", error);
        });
}

// Update notification UI
function updateNotificationUI() {
    const $notificationList = $(".notification-list");
    $notificationList.empty();
    
    if (notifications.length === 0) {
        $notificationList.append('<div class="no-notifications">Không có thông báo</div>');
        return;
    }
    
    // Sort notifications by date, newest first
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Display only the 5 most recent notifications
    const recentNotifications = notifications.slice(0, 5);
    
    recentNotifications.forEach(notification => {
        const notificationItem = `
            <div class="notification-item ${notification.read ? '' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">
                    <i class="fas ${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-text">${notification.message}</div>
                    <div class="notification-time">${formatNotificationTime(notification.createdAt)}</div>
                </div>
                <div class="notification-actions">
                    <button class="btn btn-sm mark-read-btn" ${notification.read ? 'style="display:none"' : ''}>
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `;
        
        $notificationList.append(notificationItem);
    });
    
    // Add click handlers for notifications
    $(".notification-item").click(function() {
        const notificationId = $(this).data('id');
        const notification = notifications.find(n => n.id === notificationId);
        
        if (notification && !notification.read) {
            markNotificationAsRead(notificationId);
        }
        
        // Handle navigation based on notification type
        handleNotificationClick(notification);
    });
    
    // Add handler for mark read button
    $(".mark-read-btn").click(function(e) {
        e.stopPropagation();
        const notificationId = $(this).closest('.notification-item').data('id');
        markNotificationAsRead(notificationId);
    });
}

// Update unread count
function updateUnreadCount() {
    unreadCount = notifications.filter(n => !n.read).length;
    
    const $badge = $(".notification-badge");
    
    if (unreadCount > 0) {
        $badge.text(unreadCount);
        $badge.show();
    } else {
        $badge.hide();
    }
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    const userType = localStorage.getItem("userType");
    const userId = localStorage.getItem("userId");
    
    if (!userId || !userType) return;
    
    let endpoint = `/api/notifications/${notificationId}/read`;
    
    axios.put(endpoint)
        .then(response => {
            // Update local notification
            const notification = notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                
                // Update UI
                $(`.notification-item[data-id="${notificationId}"]`).removeClass('unread');
                $(`.notification-item[data-id="${notificationId}"] .mark-read-btn`).hide();
                
                updateUnreadCount();
            }
        })
        .catch(error => {
            console.error("Error marking notification as read:", error);
        });
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    const userType = localStorage.getItem("userType");
    const userId = localStorage.getItem("userId");
    
    if (!userId || !userType) return;
    
    let endpoint = `/api/notifications/${userType.toLowerCase()}/${userId}/mark-all-read`;
    
    axios.put(endpoint)
        .then(response => {
            // Update local notifications
            notifications.forEach(notification => {
                notification.read = true;
            });
            
            // Update UI
            $(".notification-item").removeClass('unread');
            $(".mark-read-btn").hide();
            
            updateUnreadCount();
        })
        .catch(error => {
            console.error("Error marking all notifications as read:", error);
        });
}

// View all notifications
function viewAllNotifications() {
    // Navigate to notifications page based on user type
    const userType = localStorage.getItem("userType");
    
    if (userType === "PATIENT") {
        window.location.href = "/Patient/Notification.html";
    } else if (userType === "DOCTOR") {
        window.location.href = "/Doctor/Notification.html";
    } else if (userType === "ADMIN") {
        window.location.href = "/Admin/Notification.html";
    }
}

// Handle notification click based on type
function handleNotificationClick(notification) {
    if (!notification) return;
    
    const userType = localStorage.getItem("userType");
    
    switch(notification.type) {
        case "APPOINTMENT":
            if (userType === "PATIENT") {
                window.location.href = "/Patient/LichSuKhamBenh.html";
            } else if (userType === "DOCTOR") {
                window.location.href = "/Doctor/appointments.html";
            } else if (userType === "ADMIN") {
                window.location.href = "/Admin/QuanLyLichKham.html";
            }
            break;
        case "CHAT":
            // Open chat with the related user
            if (notification.relatedEntityId) {
                openChatWithUser(notification.relatedEntityId);
            }
            break;
        case "SYSTEM":
            // System notifications don't typically navigate anywhere
            break;
        default:
            // Default navigation to notifications page
            viewAllNotifications();
    }
}

// Play notification sound
function playNotificationSound() {
    if (notificationSound) {
        notificationSound.play().catch(error => {
            console.error("Error playing notification sound:", error);
        });
    }
}

// Show desktop notification
function showDesktopNotification(notification) {
    if (!notificationPermission || !notification) return;
    
    const title = "PhongKham Nhóm 7";
    const options = {
        body: notification.message,
        icon: "/assets/images/logo.png",
        tag: notification.id
    };
    
    const desktopNotification = new Notification(title, options);
    
    desktopNotification.onclick = function() {
        window.focus();
        handleNotificationClick(notification);
        this.close();
    };
    
    // Auto close after 5 seconds
    setTimeout(() => {
        desktopNotification.close();
    }, 5000);
}

// Get icon class based on notification type
function getNotificationIcon(type) {
    switch(type) {
        case "APPOINTMENT":
            return "fa-calendar-check";
        case "CHAT":
            return "fa-comment";
        case "SYSTEM":
            return "fa-bell";
        default:
            return "fa-bell";
    }
}

// Format notification time to relative time
function formatNotificationTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) {
        return "vừa xong";
    } else if (diffMin < 60) {
        return `${diffMin} phút trước`;
    } else if (diffHour < 24) {
        return `${diffHour} giờ trước`;
    } else if (diffDay < 7) {
        return `${diffDay} ngày trước`;
    } else {
        return date.toLocaleDateString('vi-VN');
    }
}

// Create a test notification for demo purposes
function createTestNotification() {
    const notificationTypes = ['appointment', 'result', 'reminder', 'system'];
    const messageTemplates = {
        'appointment': [
            'Bạn có một cuộc hẹn mới vào ngày mai lúc 9:00',
            'Lịch hẹn của bạn vào lúc 14:30 đã được xác nhận',
            'Cuộc hẹn của bạn đã được thay đổi thời gian'
        ],
        'result': [
            'Kết quả xét nghiệm của bạn đã có',
            'Bác sĩ đã cập nhật kết quả khám của bạn',
            'Có kết quả mới từ phòng xét nghiệm'
        ],
        'reminder': [
            'Nhắc nhở: Bạn có lịch khám vào ngày mai',
            'Vui lòng uống thuốc theo đơn đã kê',
            'Đừng quên tái khám vào tuần sau'
        ],
        'system': [
            'Hệ thống vừa được cập nhật tính năng mới',
            'Lịch làm việc phòng khám có thay đổi',
            'Chúc mừng năm mới từ phòng khám'
        ]
    };
    
    // Generate a random notification
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const messages = messageTemplates[type];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    // Create a unique ID
    const id = 'test-' + Date.now();
    
    // Add to notifications array
    const newNotification = {
        id: id,
        type: type,
        message: message,
        createdAt: new Date().toISOString(),
        read: false
    };
    
    notifications = [newNotification, ...notifications];
    
    // Update UI
    updateNotificationUI();
    updateUnreadCount();
    
    // Play sound and show desktop notification
    playNotificationSound();
    showDesktopNotification(newNotification);
    
    // Also show a toast notification
    showInfo(message, true);
}

// Create a notification CSS style
function addNotificationStyles() {
    const styles = `
        <style>
            .notification-badge {
                position: absolute;
                top: 0;
                right: 0;
                font-size: 10px;
                padding: 3px 5px;
                border-radius: 50%;
            }
            
            .notification-menu {
                width: 350px;
                padding: 0;
                max-height: 500px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .notification-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                border-bottom: 1px solid #eee;
                font-weight: bold;
            }
            
            .notification-body {
                flex: 1;
                overflow-y: auto;
                max-height: 350px;
            }
            
            .notification-list {
                padding: 0;
            }
            
            .notification-item {
                display: flex;
                padding: 10px 15px;
                border-bottom: 1px solid #f5f5f5;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .notification-item:hover {
                background-color: #f9f9f9;
            }
            
            .notification-item.unread {
                background-color: #f0f7ff;
            }
            
            .notification-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background-color: #e9ecef;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 10px;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-text {
                font-size: 14px;
                margin-bottom: 5px;
            }
            
            .notification-time {
                font-size: 12px;
                color: #6c757d;
            }
            
            .notification-actions {
                display: flex;
                align-items: center;
            }
            
            .mark-read-btn {
                background: none;
                border: none;
                color: #007bff;
                padding: 0;
                font-size: 12px;
            }
            
            .notification-footer {
                padding: 10px 15px;
                text-align: center;
                border-top: 1px solid #eee;
            }
            
            .no-notifications {
                padding: 20px;
                text-align: center;
                color: #6c757d;
            }
        </style>
    `;
    
    // Add styles to head if not already added
    if (!$("head").find("style:contains('.notification-badge')").length) {
        $("head").append(styles);
    }
}

// Initialize notification service on document ready
$(document).ready(function() {
    addNotificationStyles();
    initNotificationService();
    
    // For testing: Add a button to create a test notification
    if (window.location.href.includes("debug=true")) {
        $("body").append(`
            <button id="test-notification" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
                Test Notification
            </button>
        `);
        
        $("#test-notification").click(function() {
            createTestNotification();
        });
    }
});

// Export functions for use in other files
window.NotificationService = {
    initNotificationService,
    loadNotifications,
    playNotificationSound,
    showDesktopNotification
};

/**
 * Notification Service - Provides functions for displaying notifications with sound
 */

/**
 * Displays a notification with optional sound
 * @param {string} message - The notification message
 * @param {string} type - The type of notification (success, error, warning, info)
 * @param {boolean} playSound - Whether to play a notification sound
 */
function showNotification(message, type = 'info', playSound = true) {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('app-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'app-notification';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '9999';
        notification.style.maxWidth = '300px';
        document.body.appendChild(notification);
    }

    // Create the notification toast
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    
    // Add notification content
    toast.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
        </button>
    `;
    
    // Add to notification container
    notification.appendChild(toast);
    
    // Play sound if enabled
    if (playSound) {
        notificationSound.play().catch(err => {
            console.warn('Could not play notification sound:', err);
        });
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (notification.contains(toast)) {
                notification.removeChild(toast);
            }
        }, 300);
    }, 5000);
    
    // Add click handler for close button
    const closeButton = toast.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', function() {
            toast.classList.remove('show');
            setTimeout(() => {
                if (notification.contains(toast)) {
                    notification.removeChild(toast);
                }
            }, 300);
        });
    }
}

/**
 * Success notification
 * @param {string} message - The notification message
 * @param {boolean} playSound - Whether to play a notification sound
 */
function showSuccess(message, playSound = true) {
    showNotification(message, 'success', playSound);
}

/**
 * Error notification
 * @param {string} message - The notification message
 * @param {boolean} playSound - Whether to play a notification sound
 */
function showError(message, playSound = true) {
    showNotification(message, 'danger', playSound);
}

/**
 * Warning notification
 * @param {string} message - The notification message
 * @param {boolean} playSound - Whether to play a notification sound
 */
function showWarning(message, playSound = true) {
    showNotification(message, 'warning', playSound);
}

/**
 * Info notification
 * @param {string} message - The notification message
 * @param {boolean} playSound - Whether to play a notification sound
 */
function showInfo(message, playSound = true) {
    showNotification(message, 'info', playSound);
}

/**
 * Test function to demonstrate different notification types
 */
function demoNotifications() {
    // Show success notification
    setTimeout(() => {
        showSuccess("Đây là thông báo thành công!");
    }, 1000);
    
    // Show error notification
    setTimeout(() => {
        showError("Đây là thông báo lỗi!");
    }, 3000);
    
    // Show warning notification
    setTimeout(() => {
        showWarning("Đây là thông báo cảnh báo!");
    }, 5000);
    
    // Show info notification
    setTimeout(() => {
        showInfo("Đây là thông báo thông tin!");
    }, 7000);
} 