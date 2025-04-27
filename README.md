# Phòng Khám - Healthcare System

## Notification System

The application now includes a real-time notification system with sound alerts.

### Features:
- Real-time notifications appear in the top-right corner
- Different types of notifications: success, error, warning, info
- Sound alerts for important notifications
- Notifications auto-disappear after 5 seconds
- Desktop notifications (when browser permissions are granted)
- Notification history accessible from the navbar

### Demo the Notification System:
1. Log in to any user account (Admin, Doctor, or Patient)
2. Click on the "Test Notifications" button in the bottom-right corner
3. Various notification types will appear in sequence

### Implementation:
The notification system is built with:
- Vanilla JavaScript for DOM manipulation
- Custom CSS for styling notifications
- Audio elements for sound effects

The system is designed to be lightweight and non-intrusive, providing important information without disrupting the user experience.

### Customizing Notifications:
Developers can use the following functions to display notifications:
- `showSuccess(message, playSound)` - Shows a success notification
- `showError(message, playSound)` - Shows an error notification
- `showWarning(message, playSound)` - Shows a warning notification
- `showInfo(message, playSound)` - Shows an info notification

## Additional Features
[Existing content...] 