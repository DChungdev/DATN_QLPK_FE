// Chat service for handling WebSocket connections and chat functionality
let stompClient = null;
let currentUserId = null;
let currentUserType = null; // 'patient' or 'doctor'
let activeContactId = null;
let unreadMessages = 0;
let chatContacts = [];
let chatMessages = {};
let isConnected = false;

// Expose key variables to window for debugging
window.stompClient = stompClient;
window.chatMessages = chatMessages;
window.chatContacts = chatContacts;
window.isConnected = isConnected;
window.currentUserId = currentUserId;
window.connectWebSocket = connectWebSocket;

// Initialize the chat service
function initChatService(userId, userType) {
    // Check for required dependencies
    if (!window.SockJS || !window.Stomp) {
        console.error('SockJS or Stomp libraries not found');
        if (typeof showError === 'function') {
            showError('Không thể khởi tạo dịch vụ chat: Thiếu thư viện WebSocket');
        }
        return;
    }
    
    // Check for required parameters
    if (!userId || !userType) {
        console.error('User ID or User Type not provided');
        return;
    }
    
    console.log(`Initializing chat service for ${userType} with ID ${userId}`);
    
    // Đảm bảo userId là chuỗi
    currentUserId = userId.toString();
    window.currentUserId = currentUserId;
    
    currentUserType = userType;
    
    // Lưu thông tin người dùng hiện tại vào localStorage để dùng cho trạng thái đã đọc
    localStorage.setItem('currentChatUserId', currentUserId);
    localStorage.setItem('currentChatUserType', currentUserType);
    
    // Add chat UI to the page
    addChatUI();
    
    // Connect to WebSocket
    connectWebSocket();
    
    // Get unread messages count
    getUnreadMessagesCount();
    
    // Load chat contacts
    loadChatContacts();
}

// Add chat UI to the page
function addChatUI() {
    // Add CSS for message status icons
    const style = document.createElement('style');
    style.textContent = `
        .chat-message-status .bi {
            font-size: 0.9em;
            margin-left: 4px;
        }
        .chat-message-status .bi-check {
            opacity: 0.7;
        }
        .chat-message-status .bi-check-all {
            opacity: 0.9;
        }
        .chat-message-status .bi-clock {
            opacity: 0.6;
            animation: pulse 1.5s infinite ease-in-out;
        }
        @keyframes pulse {
            0% { opacity: 0.3; }
            50% { opacity: 0.8; }
            100% { opacity: 0.3; }
        }
    `;
    document.head.appendChild(style);
    
    // Add the chat button to the page
    const chatButtonHTML = `
        <div class="chat-floating-button" id="chatButton">
            <i class="bi bi-chat-dots-fill"></i>
            <div class="chat-unread-badge" id="chatUnreadBadge" style="display: none;">0</div>
        </div>
    `;
    
    // Add the chat window to the page
    const chatWindowHTML = `
        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <div class="chat-back-btn" id="chatBackBtn" style="display: none;">
                    <i class="bi bi-arrow-left"></i>
                </div>
                <h3 id="chatHeaderTitle">${currentUserType === 'patient' ? 'Chat với bác sĩ' : 'Bệnh nhân của tôi'}</h3>
                <div class="close-btn" id="chatCloseBtn">
                    <i class="bi bi-x-lg"></i>
                </div>
            </div>
            <div class="chat-body">
                <div class="chat-contacts active" id="chatContacts">
                    <div class="chat-search">
                        <input type="text" placeholder="Tìm kiếm..." id="chatSearchInput">
                    </div>
                    <div class="chat-contacts-list" id="chatContactsList">
                        <div class="text-center p-3">Đang tải danh sách...</div>
                    </div>
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="chat-messages-container" id="chatMessagesContainer">
                        <div class="text-center p-3">Bắt đầu cuộc trò chuyện...</div>
                    </div>
                </div>
            </div>
            <div class="chat-footer">
                <input type="text" class="chat-input" id="chatInput" placeholder="Nhập tin nhắn...">
                <button class="chat-send-btn" id="chatSendBtn">
                    <i class="bi bi-send-fill"></i>
                </button>
            </div>
        </div>
    `;
    
    // Append to the body
    document.body.insertAdjacentHTML('beforeend', chatButtonHTML);
    document.body.insertAdjacentHTML('beforeend', chatWindowHTML);
    
    console.log('Chat UI added to the page');
    
    // Bind events
    bindChatEvents();
}

// Bind events to the chat UI
function bindChatEvents() {
    // Toggle chat window when chat button is clicked
    const chatButton = document.getElementById('chatButton');
    const chatWindow = document.getElementById('chatWindow');
    const chatCloseBtn = document.getElementById('chatCloseBtn');
    const chatBackBtn = document.getElementById('chatBackBtn');
    const chatInput = document.getElementById('chatInput');
    const chatSendBtn = document.getElementById('chatSendBtn');
    const chatSearchInput = document.getElementById('chatSearchInput');
    
    chatButton.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            updateUnreadBadge(0);
            // Refresh contacts list when opening chat window
            refreshContactsList();
        }
    });
    
    chatCloseBtn.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });
    
    chatBackBtn.addEventListener('click', () => {
        showContactsList();
    });
    
    chatSendBtn.addEventListener('click', sendMessage);
    
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    chatSearchInput.addEventListener('input', filterContacts);
}

// Connect to WebSocket
function connectWebSocket() {
    const token = localStorage.getItem('accessToken');
    console.log("Token from localStorage:", token);
    
    if (!token) {
        console.error("No token found in localStorage");
        return;
    }
    
    // Disconnect existing client if any
    if (stompClient && stompClient.connected) {
        console.log("Disconnecting existing WebSocket connection");
        stompClient.disconnect();
    }
    
    const socket = new SockJS('http://localhost:8080/ws');
    stompClient = Stomp.over(socket);
    window.stompClient = stompClient;
    
    // Enable debugging mode in development only
    const isProduction = window.location.hostname !== 'localhost';
    if (!isProduction) {
        stompClient.debug = function(str) {
            console.log("STOMP Debug:", str);
        };
    } else {
        stompClient.debug = null; // Disable debug in production
    }
    
    // Giảm thiểu headers, chỉ dùng Authorization
    const headers = {
        Authorization: `Bearer ${token}`
    };
    console.log("Connecting with headers:", headers);
    
    // Setup reconnection attempt count
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connectWithRetry = function() {
        stompClient.connect(headers, 
            function(frame) { // success callback
                console.log('Connected: ' + frame);
                isConnected = true;
                window.isConnected = true;
                reconnectAttempts = 0; // Reset reconnect attempts on successful connection
                
                // Chỉ subscribe đến endpoint cụ thể
                const userId = currentUserId.toString();
                const subscriptionEndpoint = '/user/' + userId + '/queue/messages';
                console.log(`Subscribing to WebSocket endpoint: ${subscriptionEndpoint}`);
                
                stompClient.subscribe(subscriptionEndpoint, function(message) {
                    try {
                        console.log('===== WebSocket Message Received! =====');
                        console.log('Raw message:', message);
                        
                        const payload = message;
                        const messageData = JSON.parse(payload.body);
                        console.log('Parsed message data:', messageData);
                        
                        // Process the message
                        processReceivedMessage(messageData);
                    } catch (e) {
                        console.error("Error processing received message:", e, message);
                    }
                });
                
                console.log('Connected to WebSocket successfully!');
            }, 
            function(error) { // error callback
                console.error('WebSocket connection error:', error);
                isConnected = false;
                window.isConnected = false;
                
                // Try to reconnect with exponential backoff
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    const timeout = Math.min(30000, Math.pow(2, reconnectAttempts) * 1000);
                    console.log(`Reconnection attempt ${reconnectAttempts}/${maxReconnectAttempts} in ${timeout/1000} seconds`);
                    setTimeout(connectWithRetry, timeout);
                } else {
                    console.error("Maximum reconnection attempts reached. Please refresh the page.");
                    if (typeof showErrorToast === 'function') {
                        showErrorToast('Kết nối trò chuyện bị mất. Vui lòng làm mới trang.');
                    }
                }
            }
        );
    };
    
    // Start connection
    connectWithRetry();
}

// Xử lý tin nhắn nhận được từ WebSocket
function processReceivedMessage(message) {
    console.log('Processing message:', message);
    
    // Đảm bảo ID người gửi và người nhận là chuỗi để so sánh chính xác
    const senderId = message.senderId.toString();
    const receiverId = message.receiverId.toString();
    
    console.log('Message from sender ID:', senderId, 'to receiver ID:', receiverId);
    console.log('Current user ID:', currentUserId);
    
    // Chắc chắn rằng tin nhắn liên quan đến người dùng hiện tại
    if (senderId !== currentUserId && receiverId !== currentUserId) {
        console.log('Message is not related to current user, ignoring');
        return;
    }
    
    // Lưu tin nhắn vào bộ nhớ
    // Sử dụng ID người gửi nếu người nhận là người dùng hiện tại,
    // ngược lại sử dụng ID người nhận
    const chatPartnerId = (senderId === currentUserId) ? receiverId : senderId;
    
    console.log('Chat partner ID:', chatPartnerId);
    
    if (!chatMessages[chatPartnerId]) {
        chatMessages[chatPartnerId] = [];
    }
    
    // Kiểm tra xem tin nhắn đã tồn tại trong mảng chưa
    const messageExists = chatMessages[chatPartnerId].some(msg => msg.id === message.id);
    if (!messageExists) {
        chatMessages[chatPartnerId].push(message);
        window.chatMessages = chatMessages;
        
        // Update UI if the sender or receiver is the active contact
        if (activeContactId === chatPartnerId) {
            console.log('Updating active chat with new message');
            appendMessage(message);
            scrollToBottom();
            
            // Mark message as read if current user is the receiver
            if (senderId !== currentUserId) {
                markMessageAsRead(message.id);
            }
        } else {
            // Increment unread count only if current user is the receiver
            if (senderId !== currentUserId) {
                unreadMessages++;
                updateUnreadBadge(unreadMessages);
            }
            
            // Update contact's last message in the list
            updateContactLastMessage(chatPartnerId, message);
            console.log('Updated contact list with new message');
            
            // Thông báo cho người dùng về tin nhắn mới nếu người dùng hiện tại là người nhận
            if (senderId !== currentUserId) {
                showDesktopNotification(message);
            }
        }
        
        // Đảm bảo danh sách liên hệ được cập nhật nếu đang hiển thị
        if (!activeContactId && document.getElementById('chatContacts').classList.contains('active')) {
            refreshContactsList();
        }
    } else {
        console.log('Message already exists in chat history, skipping');
    }
}

// Hiển thị thông báo desktop cho tin nhắn mới
function showDesktopNotification(message) {
    if (!("Notification" in window)) {
        console.log("Trình duyệt không hỗ trợ thông báo");
        return;
    }
    
    // Skip notification for messages from self
    if (message.senderId.toString() === currentUserId) {
        return;
    }
    
    if (Notification.permission === "granted") {
        // Tìm thông tin người gửi
        const contact = chatContacts.find(c => c.id.toString() === message.senderId.toString());
        const title = contact ? contact.name : "Tin nhắn mới";
        
        try {
            const notification = new Notification(title, {
                body: message.content,
                icon: "../assets/img/logo-benh-vien.jpg",
                tag: 'chat-notification'
            });
            
            notification.onclick = function() {
                window.focus();
                // Mở chat với người gửi
                if (contact) {
                    openChatWithContact(contact.id);
                }
            };
            
            // Phát âm thanh thông báo
            playNotificationSound();
        } catch (e) {
            console.error("Lỗi khi hiển thị thông báo:", e);
        }
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

// Send a message
function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const messageContent = chatInput.value.trim();
    
    if (messageContent && activeContactId) {
        // Clear input ngay lập tức để ngăn gửi tin nhắn trùng lặp
        chatInput.value = '';
        
        // Xử lý đặc biệt cho chatbot
        if (activeContactId === 'chatbot') {
            handleChatbotMessage(messageContent);
            return;
        }
        
        const chatMessage = {
            content: messageContent,
            senderId: currentUserId,
            receiverId: activeContactId
        };
        
        console.log('Sending message:', chatMessage);
        
        // Tạo phiên bản tin nhắn local để hiển thị ngay lập tức
        const localMessage = {
            ...chatMessage,
            id: new Date().getTime(), // Temporary ID
            createdAt: new Date().toISOString(), // Use createdAt instead of timestamp
            read: false
        };
        
        // Add a flag to identify this as a temporary local message
        localMessage._isLocalMessage = true;
        
        // Save the message locally and update UI ngay lập tức
        if (!chatMessages[activeContactId]) {
            chatMessages[activeContactId] = [];
        }
        chatMessages[activeContactId].push(localMessage);
        window.chatMessages = chatMessages;
        
        // Add message to UI
        appendMessage(localMessage);
        scrollToBottom();
        
        // Update contact's last message in the list
        updateContactLastMessage(activeContactId, localMessage);
        
        // Gửi tin nhắn
        if (isConnected && stompClient && stompClient.connected) {
            console.log('Sending via WebSocket to /app/chat.sendMessage');
            stompClient.send('/app/chat.sendMessage', {}, JSON.stringify(chatMessage));
        } else {
            console.log('WebSocket not connected, sending via REST API');
            sendMessageViaRest(chatMessage);
        }
    }
}

// Send message via REST API
function sendMessageViaRest(chatMessage) {
    axiosJWT.post('/api/chat/send', chatMessage)
        .then(response => {
            console.log('Message sent via REST API:', response.data);
            
            // Replace the temporary message with the confirmed one from the server
            updateLocalMessageWithServerResponse(response.data);
        })
        .catch(error => {
            console.error('Error sending message via REST API:', error);
            showErrorToast('Không thể gửi tin nhắn. Vui lòng thử lại sau.');
        });
}

// Update a temporary local message with the server response
function updateLocalMessageWithServerResponse(serverMessage) {
    if (!chatMessages[serverMessage.receiverId]) return;
    
    // Find the temporary message in the chat history
    const messageIndex = chatMessages[serverMessage.receiverId].findIndex(
        msg => msg._isLocalMessage && msg.content === serverMessage.content && 
              msg.senderId === serverMessage.senderId && msg.receiverId === serverMessage.receiverId
    );
    
    if (messageIndex !== -1) {
        // Replace the temporary message with the confirmed one
        chatMessages[serverMessage.receiverId][messageIndex] = serverMessage;
        
        // Also update the UI if this is the current active chat
        if (activeContactId === serverMessage.receiverId.toString()) {
            // Update the message in the UI
            const messageElements = document.querySelectorAll('.chat-message[data-local="true"]');
            for (const element of messageElements) {
                // Update data attributes
                element.setAttribute('data-id', serverMessage.id);
                element.removeAttribute('data-local');
                
                // Update status icon
                const statusElement = element.querySelector('.chat-message-status');
                if (statusElement) {
                    statusElement.innerHTML = serverMessage.read ? 
                        '<i class="bi bi-check-all text-primary" title="Đã xem"></i>' : 
                        '<i class="bi bi-check" title="Đã gửi"></i>';
                }
            }
        }
    }
}

// Add these functions before handleChatbotMessage
async function getDepartmentsInfo() {
    try {
        const response = await axiosJWT.get('/api/departments');
        const departments = response.data;
        return departments.map(dept => `
            ${dept.departmentId}. ${dept.name}
            - ${dept.description}
        `).join('\n\n');
    } catch (error) {
        console.error('Error fetching departments:', error);
        return '';
    }
}

async function getDoctorsByDepartment1(departmentId) {
    try {
        const response = await axiosJWT.get(`/api/doctors/findbyDepartmentId/${departmentId}`);
        console.log("ALOOOOO");
        return response.data;
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return [];
    }
}

async function getDoctorBookedDates(doctorId) {
    try {
        const response = await axiosJWT.get(`/api/appointments/doctor/${doctorId}/dates`);
        return response.data;
    } catch (error) {
        console.error('Error fetching doctor dates:', error);
        return [];
    }
}

async function createAppointment(appointmentData) {
    try {
        const response = await axiosJWT.post('/api/appointments', appointmentData);
        return response.data;
    } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
    }
}

// Update appointmentState
let appointmentState = {
    isBooking: false,
    step: 0,
    data: {
        patientId: null,
        doctorId: null,
        appointmentDate: null,
        reason: null,
        departmentId: null
    },
    availableDates: [], // Thêm để lưu danh sách thời gian có thể đặt
    isConfirmed: false, // Thêm trạng thái xác nhận
    selectedTime: null // Thêm để lưu thời gian đã chọn
};

// Update handleChatbotMessage function
async function handleChatbotMessage(messageContent) {
    const OPENROUTER_API_KEY = '';
    const MODEL = 'deepseek/deepseek-chat-v3-0324:free';
    
    // Tạo tin nhắn local cho người dùng
    const userMessage = {
        id: new Date().getTime(),
        content: messageContent,
        senderId: currentUserId,
        receiverId: 'chatbot',
        createdAt: new Date().toISOString(),
        read: true,
        _isLocalMessage: true
    };
    
    // Thêm tin nhắn vào UI
    appendMessage(userMessage);
    scrollToBottom();

    // Xử lý đặt lịch
    if (messageContent.toLowerCase().includes('đặt lịch') || appointmentState.isBooking) {
        if (!appointmentState.isBooking) {
            appointmentState.isBooking = true;
            appointmentState.step = 1;
            appointmentState.data.patientId = localStorage.getItem('userId');
            
            const botMessage = {
                id: new Date().getTime() + 1,
                content: "Vui lòng cho biết lý do khám của bạn?",
                senderId: 'chatbot',
                receiverId: currentUserId,
                createdAt: new Date().toISOString(),
                read: true,
                _isLocalMessage: true
            };
            
            setTimeout(() => {
                appendMessage(botMessage);
                scrollToBottom();
            }, 500);
            return;
        }

        // Xử lý các bước đặt lịch
        switch (appointmentState.step) {
            case 1: // Nhận lý do khám và xác định khoa
                try {
                    const departmentsInfo = await getDepartmentsInfo();
                    console.log(departmentsInfo);
                    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: MODEL,
                            messages: [
                                {
                                    role: "system",
                                    content: `Bạn là trợ lý phân tích bệnh. Dựa vào lý do khám của bệnh nhân, hãy chọn khoa phù hợp nhất từ danh sách sau:

${departmentsInfo}

Chỉ trả về ID của khoa phù hợp nhất, không cần giải thích thêm, không có cái nào phù hợp thì trả về 1.`
                                },
                                { role: "user", content: messageContent }
                            ]
                        })
                    });

                    const data = await response.json();
                    const departmentId = parseInt(data.choices[0].message.content.trim());
                    appointmentState.data.departmentId = departmentId;
                    appointmentState.data.reason = messageContent;

                    // Lấy danh sách bác sĩ của khoa
                    const doctors = await getDoctorsByDepartment1(departmentId);
                    console.log(doctors);
                    if (doctors.length === 0) {
                        throw new Error('Không tìm thấy bác sĩ phù hợp');
                    }

                    // Lấy lịch đã đặt của bác sĩ đầu tiên
                    const bookedDates = await getDoctorBookedDates(doctors[0].doctorId);
                    appointmentState.data.doctorId = doctors[0].doctorId;

                    appointmentState.step = 2;
                    const botMessage = {
                        id: new Date().getTime() + 1,
                        content: "Vui lòng cho biết ngày bạn muốn khám (ví dụ: 15/4):",
                        senderId: 'chatbot',
                        receiverId: currentUserId,
                        createdAt: new Date().toISOString(),
                        read: true,
                        _isLocalMessage: true
                    };

                    setTimeout(() => {
                        appendMessage(botMessage);
                        scrollToBottom();
                    }, 500);
                } catch (error) {
                    console.error('Error in step 1:', error);
                    const errorMessage = {
                        id: new Date().getTime() + 1,
                        content: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
                        senderId: 'chatbot',
                        receiverId: currentUserId,
                        createdAt: new Date().toISOString(),
                        read: true,
                        _isLocalMessage: true
                    };
                    setTimeout(() => {
                        appendMessage(errorMessage);
                        scrollToBottom();
                    }, 500);
                    appointmentState.isBooking = false;
                }
                break;

            case 2: // Xử lý ngày khám
                try {
                    const selectedDate = parseDate(messageContent);
                    if (!selectedDate) {
                        throw new Error('Ngày không hợp lệ');
                    }

                    // Kiểm tra xem ngày có trong tương lai không
                    const now = new Date();
                    if (selectedDate < now) {
                        throw new Error('Ngày khám phải trong tương lai');
                    }

                    // Lưu ngày đã chọn
                    appointmentState.data.appointmentDate = selectedDate;
                    
                    appointmentState.step = 3;
                    const botMessage = {
                        id: new Date().getTime() + 1,
                        content: "Vui lòng chọn giờ khám (từ 7h đến 20h, ví dụ: 9h30):",
                        senderId: 'chatbot',
                        receiverId: currentUserId,
                        createdAt: new Date().toISOString(),
                        read: true,
                        _isLocalMessage: true
                    };

                    setTimeout(() => {
                        appendMessage(botMessage);
                        scrollToBottom();
                    }, 500);
                } catch (error) {
                    console.error('Error in step 2:', error);
                    const errorMessage = {
                        id: new Date().getTime() + 1,
                        content: error.message || "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
                        senderId: 'chatbot',
                        receiverId: currentUserId,
                        createdAt: new Date().toISOString(),
                        read: true,
                        _isLocalMessage: true
                    };
                    setTimeout(() => {
                        appendMessage(errorMessage);
                        scrollToBottom();
                    }, 500);
                }
                break;

            case 3: // Xử lý giờ khám
                try {
                    const selectedTime = parseTime(messageContent);
                    if (!selectedTime) {
                        throw new Error('Giờ không hợp lệ');
                    }

                    // Kết hợp ngày và giờ đã chọn
                    const appointmentDate = new Date(appointmentState.data.appointmentDate);
                    appointmentDate.setHours(selectedTime.hours, selectedTime.minutes, 0, 0);

                    // Kiểm tra xem thời gian này đã bị đặt chưa
                    const bookedDates = await getDoctorBookedDates(appointmentState.data.doctorId);
                    const isBooked = bookedDates.some(date => {
                        const booked = new Date(date);
                        return booked.getTime() === appointmentDate.getTime();
                    });

                    if (isBooked) {
                        throw new Error('Thời gian này đã được đặt. Vui lòng chọn thời gian khác.');
                    }

                    // Lưu thời gian đã chọn vào state
                    appointmentState.data.appointmentDate = appointmentDate.toISOString();

                    // Nếu chưa xác nhận, hiển thị thông tin và yêu cầu xác nhận
                    if (!appointmentState.isConfirmed) {
                        appointmentState.step = 4;
                        const confirmMessage = {
                            id: new Date().getTime() + 1,
                            content: `Vui lòng xác nhận thông tin đặt lịch:\nThời gian: ${formatDate(appointmentDate)}\nLý do: ${appointmentState.data.reason}\n\nNhập "đồng ý" hoặc "ok" để xác nhận, hoặc "hủy" để hủy đặt lịch.`,
                            senderId: 'chatbot',
                            receiverId: currentUserId,
                            createdAt: new Date().toISOString(),
                            read: true,
                            _isLocalMessage: true
                        };

                        setTimeout(() => {
                            appendMessage(confirmMessage);
                            scrollToBottom();
                        }, 500);
                        return;
                    }

                    // Nếu đã xác nhận, tạo lịch hẹn
                    const appointment = await createAppointment(appointmentState.data);
                    
                    const successMessage = {
                        id: new Date().getTime() + 1,
                        content: `Đặt lịch thành công!\nThời gian: ${formatDate(appointmentDate)}\nLý do: ${appointmentState.data.reason}`,
                        senderId: 'chatbot',
                        receiverId: currentUserId,
                        createdAt: new Date().toISOString(),
                        read: true,
                        _isLocalMessage: true
                    };

                    setTimeout(() => {
                        appendMessage(successMessage);
                        scrollToBottom();
                    }, 500);

                    // Reset trạng thái đặt lịch
                    appointmentState.isBooking = false;
                    appointmentState.step = 0;
                    appointmentState.isConfirmed = false;
                    appointmentState.data = {
                        patientId: null,
                        doctorId: null,
                        appointmentDate: null,
                        reason: null,
                        departmentId: null
                    };
                } catch (error) {
                    console.error('Error in step 3:', error);
                    const errorMessage = {
                        id: new Date().getTime() + 1,
                        content: error.message || "Xin lỗi, có lỗi xảy ra khi đặt lịch. Vui lòng thử lại sau.",
                        senderId: 'chatbot',
                        receiverId: currentUserId,
                        createdAt: new Date().toISOString(),
                        read: true,
                        _isLocalMessage: true
                    };
                    setTimeout(() => {
                        appendMessage(errorMessage);
                        scrollToBottom();
                    }, 500);
                }
                break;

            case 4: // Xử lý xác nhận đặt lịch
                try {
                    const response = messageContent.toLowerCase().trim();
                    if (response === 'đồng ý' || response === 'ok') {
                        appointmentState.isConfirmed = true;
                        // Tạo lịch hẹn trực tiếp với thời gian đã lưu trong state
                        const appointment = await createAppointment(appointmentState.data);
                        
                        const successMessage = {
                            id: new Date().getTime() + 1,
                            content: `Đặt lịch thành công!\nThời gian: ${formatDate(new Date(appointmentState.data.appointmentDate))}\nLý do: ${appointmentState.data.reason}`,
                            senderId: 'chatbot',
                            receiverId: currentUserId,
                            createdAt: new Date().toISOString(),
                            read: true,
                            _isLocalMessage: true
                        };

                        setTimeout(() => {
                            appendMessage(successMessage);
                            scrollToBottom();
                        }, 500);

                        // Reset trạng thái đặt lịch
                        appointmentState.isBooking = false;
                        appointmentState.step = 0;
                        appointmentState.isConfirmed = false;
                        appointmentState.data = {
                            patientId: null,
                            doctorId: null,
                            appointmentDate: null,
                            reason: null,
                            departmentId: null
                        };
                    } else if (response === 'hủy') {
                        const cancelMessage = {
                            id: new Date().getTime() + 1,
                            content: "Đã hủy đặt lịch. Bạn có thể đặt lịch khác bằng cách nhập 'đặt lịch'.",
                            senderId: 'chatbot',
                            receiverId: currentUserId,
                            createdAt: new Date().toISOString(),
                            read: true,
                            _isLocalMessage: true
                        };

                        setTimeout(() => {
                            appendMessage(cancelMessage);
                            scrollToBottom();
                        }, 500);

                        // Reset trạng thái đặt lịch
                        appointmentState.isBooking = false;
                        appointmentState.step = 0;
                        appointmentState.isConfirmed = false;
                        appointmentState.data = {
                            patientId: null,
                            doctorId: null,
                            appointmentDate: null,
                            reason: null,
                            departmentId: null
                        };
                    } else {
                        throw new Error('Vui lòng nhập "đồng ý" hoặc "hủy" để tiếp tục.');
                    }
                } catch (error) {
                    console.error('Error in step 4:', error);
                    const errorMessage = {
                        id: new Date().getTime() + 1,
                        content: error.message || "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau.",
                        senderId: 'chatbot',
                        receiverId: currentUserId,
                        createdAt: new Date().toISOString(),
                        read: true,
                        _isLocalMessage: true
                    };
                    setTimeout(() => {
                        appendMessage(errorMessage);
                        scrollToBottom();
                    }, 500);
                }
                break;
        }
        return;
    }

    // Xử lý tin nhắn thông thường
    try {
        const departmentsInfo = await getDepartmentsInfo();
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [
                    { 
                        role: "system", 
                        content: `Bạn là trợ lý tư vấn cho "Phòng khám đa khoa Đức Chung".

Thông tin cơ bản:
- Địa chỉ: 123 Lý Thường Kiệt, Quận 10, TP.HCM
- Hotline: 0909 123 456
- Giờ làm việc: Từ 7h00 đến 20h00, tất cả các ngày trong tuần (bao gồm cả thứ 7, Chủ nhật)

Danh sách khoa và chuyên môn:
${departmentsInfo}

Dịch vụ cung cấp:
- Khám tổng quát
- Khám chuyên khoa: Nội khoa, Tai Mũi Họng, Da liễu
- Xét nghiệm máu, nước tiểu
- Siêu âm tổng quát
- Tiêm chủng và khám sức khỏe định kỳ

Chi phí:
- Khám thường: 100.000 VNĐ/lượt
- Khám chuyên khoa: 150.000 VNĐ/lượt

Hướng dẫn đặt lịch:
- Cách 1: Gọi trực tiếp đến số hotline 0909 123 456
- Cách 2: Đặt lịch qua biểu mẫu trên website chính thức
- Cách 3: Chat với tôi để đặt lịch trực tuyến

Câu hỏi thường gặp:

1. Tôi có thể đặt lịch khám online không?  
→ Có. Bạn có thể gọi hotline, điền biểu mẫu trên website hoặc chat với tôi để đặt lịch.

2. Phòng khám có làm việc ngày lễ không?  
→ Có. Phòng khám hoạt động tất cả các ngày, bao gồm lễ và cuối tuần.

3. Cần mang theo gì khi đi khám?  
→ Bạn nên mang theo CMND/CCCD, thẻ BHYT (nếu có), và kết quả khám trước đó (nếu có).

4. Có khám ngoài giờ không?  
→ Phòng khám mở cửa đến 20h mỗi ngày, nên bạn có thể đến sau giờ hành chính.

Hãy trả lời người dùng một cách tự nhiên, lịch sự, rõ ràng và đúng theo thông tin trên.` 
                    },
                    { role: "user", content: messageContent }
                ]
            })
        });
        
        const data = await response.json();
        const botReply = data.choices?.[0]?.message?.content || "Xin lỗi, tôi không thể trả lời ngay lúc này.";
        
        const botMessage = {
            id: new Date().getTime() + 1,
            content: botReply,
            senderId: 'chatbot',
            receiverId: currentUserId,
            createdAt: new Date().toISOString(),
            read: true,
            _isLocalMessage: true
        };
        
        setTimeout(() => {
            appendMessage(botMessage);
            scrollToBottom();
        }, 500);
        
    } catch (error) {
        console.error('Error getting chatbot response:', error);
        const errorMessage = {
            id: new Date().getTime() + 1,
            content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
            senderId: 'chatbot',
            receiverId: currentUserId,
            createdAt: new Date().toISOString(),
            read: true,
            _isLocalMessage: true
        };
        
        setTimeout(() => {
            appendMessage(errorMessage);
            scrollToBottom();
        }, 500);
    }
}

// Helper functions for appointment booking
function parseDate(dateStr) {
    // Hỗ trợ các định dạng: DD/MM, DD-MM, DD.MM
    const match = dateStr.match(/(\d{1,2})[\/\-\.](\d{1,2})/);
    if (!match) return null;

    const day = parseInt(match[1]);
    const month = parseInt(match[2]) - 1; // Tháng trong JS bắt đầu từ 0
    const year = new Date().getFullYear();

    const date = new Date(year, month, day);
    
    // Kiểm tra tính hợp lệ của ngày
    if (date.getDate() !== day || date.getMonth() !== month) {
        return null;
    }

    return date;
}

function parseTime(timeStr) {
    // Hỗ trợ các định dạng: HHh, HHhMM, HH:MM
    const match = timeStr.match(/(\d{1,2})(?:h|:)?(\d{2})?/);
    if (!match) return null;

    const hours = parseInt(match[1]);
    const minutes = match[2] ? parseInt(match[2]) : 0;

    // Kiểm tra tính hợp lệ của giờ
    if (hours < 7 || hours > 20 || minutes < 0 || minutes > 59) {
        return null;
    }

    return { hours, minutes };
}

function formatDate(date) {
    return date.toLocaleString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Load chat contacts
function loadChatContacts() {
    let apiUrl = '';
    
    if (currentUserType === 'patient') {
        // For patients: Load all doctors
        apiUrl = '/api/doctors';
    } else {
        console.log("Lấy danh sách bệnh nhân cho bác sĩ có ID:", localStorage.getItem("doctorId"));
        // For doctors: Load patients who have appointments with this doctor
        apiUrl = `/api/patients/getbydoctorid/${localStorage.getItem("doctorId")}`;
    }
    
    axiosJWT.get(apiUrl)
        .then(response => {
            const contacts = response.data;
            console.log("Danh sách liên hệ nhận được:", contacts);
            
            // Chắc chắn rằng có accountId cho mỗi liên hệ
            if (contacts.length > 0 && contacts[0].accountId === undefined) {
                console.error("Không tìm thấy trường accountId trong dữ liệu liên hệ:", contacts[0]);
                showErrorToast("Không thể tải danh sách liên hệ: Thiếu thông tin accountId");
                return;
            }
            
            chatContacts = contacts
            .filter(contact => contact.accountId !== null)
            .map(contact => {
                return {
                    id: contact.accountId.toString(), // Đảm bảo ID luôn là chuỗi
                    originalId: currentUserType === 'patient' ? contact.doctorId : contact.patientId,
                    name: contact.fullName,
                    avatar: contact.image ? contact.image : null,
                    unreadCount: 0,
                    lastMessage: null,
                    lastMessageTime: null
                };
            });

            // Thêm chatbot vào đầu danh sách contact
            const chatbotContact = {
                id: 'chatbot',
                name: 'Chatbot Tư Vấn',
                avatar: '/uploads/chatbot.avif',
                unreadCount: 0,
                lastMessage: null,
                lastMessageTime: null
            };
            chatContacts.unshift(chatbotContact);
            
            window.chatContacts = chatContacts;
            
            // Load last messages for each contact
            loadLastMessages();
            
            // Render contacts list
            renderContactsList();
        })
        .catch(error => {
            console.error('Error loading contacts:', error);
            document.getElementById('chatContactsList').innerHTML = `
                <div class="text-center p-3 text-danger">
                    Không thể tải danh sách liên hệ. Vui lòng thử lại sau.
                </div>
            `;
        });
}

// Load last messages for each contact
function loadLastMessages() {
    // For each contact, get the last message
    chatContacts.forEach(contact => {
        // Bỏ qua chatbot vì không cần lịch sử
        if (contact.id === 'chatbot') {
            contact.lastMessage = "Bắt đầu trò chuyện";
            contact.lastMessageTime = new Date().toISOString();
            updateContactItem(contact);
            return;
        }

        getChatHistory(currentUserId, contact.id, 1)
            .then(messages => {
                if (messages && messages.length > 0) {
                    const lastMessage = messages[0];
                    contact.lastMessage = lastMessage.content;
                    contact.lastMessageTime = lastMessage.createdAt;
                    
                    // Check if the message is unread
                    if (!lastMessage.read && lastMessage.receiverId === currentUserId) {
                        contact.unreadCount++;
                        unreadMessages++;
                    }
                    
                    // Update UI
                    updateUnreadBadge(unreadMessages);
                    updateContactItem(contact);
                }
            })
            .catch(error => {
                console.error(`Error loading last message for contact ${contact.id}:`, error);
            });
    });
}

// Get chat history between two users
function getChatHistory(userId1, userId2, limit = 50) {
    return new Promise((resolve, reject) => {
        axiosJWT.get(`/api/chat/history/${userId1}/${userId2}?limit=${limit}`)
            .then(response => {
                const messages = response.data;
                console.log(messages);
                
                // Debug để kiểm tra format timestamp
                if (messages && messages.length > 0) {
                    console.log("Sample message createdAt:", messages[0].createdAt);
                    console.log("Sample message date object:", new Date(messages[0].createdAt));
                }
                
                // Save messages
                chatMessages[userId2] = messages;
                
                resolve(messages);
            })
            .catch(error => {
                console.error('Error getting chat history:', error);
                reject(error);
            });
    });
}

// Get unread messages count
function getUnreadMessagesCount() {
    axiosJWT.get(`/api/chat/unread/${currentUserId}`)
        .then(response => {
            unreadMessages = response.data;
            updateUnreadBadge(unreadMessages);
        })
        .catch(error => {
            console.error('Error getting unread messages count:', error);
        });
}

// Mark message as read
function markMessageAsRead(messageId) {
    axiosJWT.put(`/api/chat/read/${messageId}`)
        .then(response => {
            console.log('Message marked as read:', response.data);
        })
        .catch(error => {
            console.error('Error marking message as read:', error);
        });
}

// Update unread badge
function updateUnreadBadge(count) {
    const badge = document.getElementById('chatUnreadBadge');
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Render contacts list
function renderContactsList() {
    const contactsList = document.getElementById('chatContactsList');
    
    if (chatContacts.length === 0) {
        contactsList.innerHTML = `
            <div class="text-center p-3">
                Không có liên hệ nào.
            </div>
        `;
        return;
    }
    
    // Sort contacts by last message time (most recent first)
    chatContacts.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
    });
    
    // Generate HTML
    let html = '';
    chatContacts.forEach(contact => {
        const initials = contact.name ? contact.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
        
        html += `
            <div class="chat-contact-item ${contact.unreadCount > 0 ? 'unread' : ''}" data-id="${contact.id}">
                <div class="chat-contact-avatar">
                    ${contact.avatar 
                        ? `<img src="http://localhost:8080${contact.avatar}" alt="${contact.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`
                        : initials
                    }
                </div>
                <div class="chat-contact-info">
                    <div class="chat-contact-name">
                        ${contact.name}
                        ${contact.unreadCount > 0 
                            ? `<div class="chat-contact-unread">${contact.unreadCount}</div>`
                            : ''
                        }
                    </div>
                    <div class="chat-contact-last-message">
                        ${contact.lastMessage || 'Chưa có tin nhắn'}
                    </div>
                </div>
                ${contact.lastMessageTime 
                    ? `<div class="chat-contact-time">${formatMessageTime(contact.lastMessageTime)}</div>`
                    : ''
                }
            </div>
        `;
    });
    
    contactsList.innerHTML = html;
    
    // Add event listeners to contact items
    document.querySelectorAll('.chat-contact-item').forEach(item => {
        item.addEventListener('click', () => {
            const contactId = item.getAttribute('data-id');
            openChatWithContact(contactId);
        });
    });
    
    console.log('Contacts list rendered with', chatContacts.length, 'contacts');
}

// Update contact item in the list
function updateContactItem(contact) {
    const contactItem = document.querySelector(`.chat-contact-item[data-id="${contact.id}"]`);
    
    if (contactItem) {
        const unreadBadge = contactItem.querySelector('.chat-contact-unread');
        const lastMessageEl = contactItem.querySelector('.chat-contact-last-message');
        const lastMessageTimeEl = contactItem.querySelector('.chat-contact-time');
        
        if (contact.unreadCount > 0) {
            contactItem.classList.add('unread');
            if (unreadBadge) {
                unreadBadge.textContent = contact.unreadCount;
            } else {
                const nameEl = contactItem.querySelector('.chat-contact-name');
                const badge = document.createElement('div');
                badge.className = 'chat-contact-unread';
                badge.textContent = contact.unreadCount;
                nameEl.appendChild(badge);
            }
        } else {
            contactItem.classList.remove('unread');
            if (unreadBadge) {
                unreadBadge.remove();
            }
        }
        
        if (lastMessageEl && contact.lastMessage) {
            lastMessageEl.textContent = contact.lastMessage;
        }
        
        if (lastMessageTimeEl && contact.lastMessageTime) {
            lastMessageTimeEl.textContent = formatMessageTime(contact.lastMessageTime);
        } else if (contact.lastMessageTime) {
            const timeEl = document.createElement('div');
            timeEl.className = 'chat-contact-time';
            timeEl.textContent = formatMessageTime(contact.lastMessageTime);
            contactItem.appendChild(timeEl);
        }
        
        // Move contact to the top of the list if it has a new message
        if (contact.lastMessageTime) {
            const parentList = contactItem.parentNode;
            parentList.insertBefore(contactItem, parentList.firstChild);
        }
    } else {
        // Contact not in list, refresh the list
        renderContactsList();
    }
}

// Update contact's last message
function updateContactLastMessage(contactId, message) {
    const contact = chatContacts.find(c => c.id == contactId);
    
    if (contact) {
        contact.lastMessage = message.content;
        contact.lastMessageTime = message.createdAt;
        
        if (message.senderId !== currentUserId && !message.read) {
            contact.unreadCount++;
        }
        
        updateContactItem(contact);
    }
}

// Open chat with a contact
function openChatWithContact(contactId) {
    activeContactId = contactId;
    
    // Update UI
    const contact = chatContacts.find(c => c.id == contactId);
    
    if (contact) {
        // Update header
        document.getElementById('chatHeaderTitle').textContent = contact.name;
        
        // Show back button
        document.getElementById('chatBackBtn').style.display = 'block';
        
        // Show messages panel
        document.getElementById('chatContacts').classList.remove('active');
        document.getElementById('chatMessages').classList.add('active');
        
        // Reset contact unread count
        if (contact.unreadCount > 0) {
            unreadMessages -= contact.unreadCount;
            contact.unreadCount = 0;
            updateUnreadBadge(unreadMessages);
            updateContactItem(contact);
        }
        
        // Load chat history
        loadChatMessages(contactId);
    }
}

// Load chat messages for a contact
function loadChatMessages(contactId) {
    const messagesContainer = document.getElementById('chatMessagesContainer');
    messagesContainer.innerHTML = '<div class="text-center p-3">Đang tải tin nhắn...</div>';
    
    // Xử lý đặc biệt cho chatbot
    if (contactId === 'chatbot') {
        // Mỗi lần mở chat với chatbot sẽ bắt đầu cuộc trò chuyện mới
        const welcomeMessage = {
            id: new Date().getTime(),
            content: "Xin chào! Tôi là chatbot tư vấn của phòng khám. Tôi có thể giúp gì cho bạn?",
            senderId: 'chatbot',
            receiverId: currentUserId,
            createdAt: new Date().toISOString(),
            read: true,
            _isLocalMessage: true
        };
        
        // Reset chat history cho chatbot
        chatMessages[contactId] = [welcomeMessage];
        renderMessages(chatMessages[contactId]);
        return;
    }
    
    // Check if we have messages in memory
    if (chatMessages[contactId] && chatMessages[contactId].length > 0) {
        renderMessages(chatMessages[contactId]);
    } else {
        // Load from API
        getChatHistory(currentUserId, contactId)
            .then(messages => {
                renderMessages(messages);
            })
            .catch(error => {
                console.error('Error loading chat messages:', error);
                messagesContainer.innerHTML = `
                    <div class="text-center p-3 text-danger">
                        Không thể tải tin nhắn. Vui lòng thử lại sau.
                    </div>
                `;
            });
    }
}

// Render messages
function renderMessages(messages) {
    const messagesContainer = document.getElementById('chatMessagesContainer');
    
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = `
            <div class="text-center p-3">
                Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
            </div>
        `;
        return;
    }
    
    // Sort messages by timestamp (oldest first)
    messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    
    // Group messages by date
    const groupedMessages = groupMessagesByDate(messages);
    
    // Generate HTML
    let html = '';
    
    Object.entries(groupedMessages).forEach(([date, msgs]) => {
        html += `
            <div class="chat-date-divider">
                <span>${formatMessageDate(date)}</span>
            </div>
        `;
        
        msgs.forEach(message => {
            const isSent = message.senderId == currentUserId;
            const isLocalMessage = message._isLocalMessage === true;
            
            html += `
                <div class="chat-message ${isSent ? 'sent' : 'received'}" 
                     data-id="${message.id}" 
                     ${isLocalMessage ? 'data-local="true"' : ''}>
                    <div class="chat-message-content">
                        ${message.content}
                        <div class="chat-message-time">
                            ${formatMessageTime(message.createdAt)}
                            ${isSent ? 
                                `<span class="chat-message-status">
                                    ${getMessageStatusText(message)}
                                </span>` : 
                                ''
                            }
                        </div>
                    </div>
                </div>
            `;
            
            // Mark received messages as read
            if (!isSent && !message.read && !isLocalMessage) {
                markMessageAsRead(message.id);
                message.read = true;
            }
        });
    });
    
    messagesContainer.innerHTML = html;
    scrollToBottom();
}

// Append a new message to the chat
function appendMessage(message) {
    const messagesContainer = document.getElementById('chatMessagesContainer');
    
    // Check if we need to add a new date divider
    const messageDate = new Date(message.createdAt).toDateString();
    const lastDateDivider = messagesContainer.querySelector('.chat-date-divider:last-child span');
    
    if (!lastDateDivider || lastDateDivider.textContent !== formatMessageDate(messageDate)) {
        messagesContainer.innerHTML += `
            <div class="chat-date-divider">
                <span>${formatMessageDate(messageDate)}</span>
            </div>
        `;
    }
    
    // Add the message
    const isSent = message.senderId == currentUserId;
    const isLocalMessage = message._isLocalMessage === true;
    
    const messageHTML = `
        <div class="chat-message ${isSent ? 'sent' : 'received'}" 
             data-id="${message.id}" 
             ${isLocalMessage ? 'data-local="true"' : ''}>
            <div class="chat-message-content">
                ${message.content}
                <div class="chat-message-time">
                    ${formatMessageTime(message.createdAt)}
                    ${isSent ? 
                        `<span class="chat-message-status">
                            ${getMessageStatusText(message)}
                        </span>` : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
    
    messagesContainer.innerHTML += messageHTML;
    
    // Mark received messages as read
    if (!isSent && !message.read && !isLocalMessage) {
        markMessageAsRead(message.id);
        message.read = true;
    }
}

// Get message status text based on message state
function getMessageStatusText(message) {
    if (message._isLocalMessage) {
        return '<i class="bi bi-clock" title="Đang gửi..."></i>';
    } else if (message.read) {
        return '<i class="bi bi-check-all text-primary" title="Đã xem"></i>';
    } else {
        return '<i class="bi bi-check" title="Đã gửi"></i>';
    }
}

// Show contacts list
function showContactsList() {
    activeContactId = null;
    
    // Update UI
    document.getElementById('chatHeaderTitle').textContent = 
        currentUserType === 'patient' ? 'Chat với bác sĩ' : 'Bệnh nhân của tôi';
    
    // Hide back button
    document.getElementById('chatBackBtn').style.display = 'none';
    
    // Show contacts panel
    document.getElementById('chatMessages').classList.remove('active');
    document.getElementById('chatContacts').classList.add('active');
    
    // Cập nhật lại danh sách liên hệ với tin nhắn mới nhất
    refreshContactsList();
}

// Cập nhật lại danh sách liên hệ với tin nhắn mới nhất
function refreshContactsList() {
    // Cập nhật tin nhắn mới nhất cho mỗi liên hệ
    for (const contact of chatContacts) {
        if (chatMessages[contact.id] && chatMessages[contact.id].length > 0) {
            // Sắp xếp tin nhắn theo thời gian để lấy tin nhắn mới nhất
            const messages = [...chatMessages[contact.id]].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            
            const lastMessage = messages[0];
            contact.lastMessage = lastMessage.content;
            contact.lastMessageTime = lastMessage.createdAt;
        }
    }
    
    // Render lại danh sách liên hệ
    renderContactsList();
}

// Filter contacts
function filterContacts() {
    const searchInput = document.getElementById('chatSearchInput');
    const query = searchInput.value.toLowerCase().trim();
    
    if (!query) {
        // Show all contacts
        document.querySelectorAll('.chat-contact-item').forEach(item => {
            item.style.display = 'flex';
        });
        return;
    }
    
    // Filter contacts
    document.querySelectorAll('.chat-contact-item').forEach(item => {
        const name = item.querySelector('.chat-contact-name').textContent.toLowerCase();
        if (name.includes(query)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Group messages by date
function groupMessagesByDate(messages) {
    const grouped = {};
    
    messages.forEach(message => {
        try {
            const timestamp = message.createdAt;
            // console.log(timestamp);
            let dateKey;
            
            // Cố gắng phân tích ngày và tạo chuỗi toDateString để gom nhóm
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                dateKey = date.toDateString();
            } else {
                console.error("Invalid date for grouping:", timestamp);
                dateKey = "Invalid Date";
            }
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            
            grouped[dateKey].push(message);
        } catch (e) {
            console.error("Error grouping message by date:", e, message);
            // Nếu lỗi, đưa vào nhóm "Unknown"
            if (!grouped["Unknown"]) {
                grouped["Unknown"] = [];
            }
            grouped["Unknown"].push(message);
        }
    });
    
    return grouped;
}

// Format message date
function formatMessageDate(dateString) {
    try {
        // Kiểm tra và phân tích đúng chuỗi ngày
        let date;
        if (typeof dateString === 'string') {
            if (dateString.match(/^\d{4}-\d{2}-\d{2}.*$/)) {
                // YYYY-MM-DD format
                date = new Date(dateString);
            } else if (dateString.includes('T') && dateString.includes('Z')) {
                // ISO format
                date = new Date(dateString);
            } else {
                // Có thể là ngày dạng plain text
                date = new Date(dateString);
            }
        } else {
            date = new Date(dateString);
        }
        
        // Kiểm tra nếu date hợp lệ
        if (isNaN(date.getTime())) {
            console.error("Invalid date:", dateString);
            return "N/A";
        }
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Hôm nay';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Hôm qua';
        } else {
            return date.toLocaleDateString('vi-VN', { 
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }
    } catch (e) {
        console.error("Error formatting message date:", e, dateString);
        return "N/A";
    }
}

// Format message time
function formatMessageTime(timestamp) {
    try {
        // Kiểm tra nếu timestamp là string và đảm bảo định dạng đúng
        let date;
        if (typeof timestamp === 'string') {
            // Hỗ trợ nhiều định dạng khác nhau
            if (timestamp.includes('T') && timestamp.includes('Z')) {
                // ISO format
                date = new Date(timestamp);
            } else if (timestamp.match(/^\d{4}-\d{2}-\d{2}.*$/)) {
                // YYYY-MM-DD format
                date = new Date(timestamp);
            } else {
                // Unix timestamp (milliseconds)
                date = new Date(parseInt(timestamp));
            }
        } else {
            date = new Date(timestamp);
        }
        
        // Kiểm tra nếu date hợp lệ
        if (isNaN(date.getTime())) {
            console.error("Invalid date from timestamp:", timestamp);
            return "N/A";
        }
        
        return date.toLocaleTimeString('vi-VN', { 
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        console.error("Error formatting message time:", e, timestamp);
        return "N/A";
    }
}

// Scroll to bottom of chat
function scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessagesContainer');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Play notification sound
function playNotificationSound() {
    const audio = new Audio('/assets/sounds/notification.mp3');
    audio.play().catch(e => console.log('Could not play notification sound'));
}

// Show error toast
function showErrorToast(message) {
    if (typeof showError === 'function') {
        showError(message);
    } else {
        console.error(message);
    }
} 