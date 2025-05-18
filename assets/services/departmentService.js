// Department service for handling department operations
const departmentService = {
    // Get all departments
    getAllDepartments: async function() {
        try {
            const response = await axiosJWT.get('/api/departments');
            return response.data;
        } catch (error) {
            console.error('Error getting departments:', error);
            notificationService.showError("Lỗi! Không thể lấy danh sách khoa.");
            throw error;
        }
    },

    // Get department by ID
    getDepartmentById: async function(id) {
        try {
            const response = await axiosJWT.get(`/api/departments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error getting department:', error);
            notificationService.showError("Lỗi! Không thể lấy thông tin khoa.");
            throw error;
        }
    },

    // Create new department
    createDepartment: async function(department) {
        try {
            const response = await axiosJWT.post('/api/departments', department);
            return response.data;
        } catch (error) {
            console.error('Error creating department:', error);
            notificationService.showError("Lỗi! Không thể tạo khoa.");
            throw error;
        }
    },

    // Update department
    updateDepartment: async function(id, department) {
        try {
            const response = await axiosJWT.put(`/api/departments/${id}`, department);
            return response.data;
        } catch (error) {
            console.error('Error updating department:', error);
            notificationService.showError("Lỗi! Không thể cập nhật khoa.");
            throw error;
        }
    },

    // Delete department
    deleteDepartment: async function(id) {
        try {
            const response = await axiosJWT.delete(`/api/departments/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting department:', error);
            notificationService.showError("Lỗi! Không thể xóa khoa.");
            throw error;
        }
    }
};

// Export the service
window.departmentService = departmentService;

$(document).ready(() => {
    showSuccessNotification("Chạy");
})

// Function to show success notification
function showSuccessNotification(message) {
    console.log("Chay")
    const successPopup = document.getElementById('success-popup');
    const successText = successPopup.querySelector('.m-popup-text-success span');
    successText.textContent = message;
    successPopup.style.display = 'block';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      successPopup.style.display = 'none';
    }, 3000);
}

// Function to show error notification
function showErrorNotification(message) {
    const errorPopup = document.getElementById('error-popup');
    const errorText = errorPopup.querySelector('.m-popup-text-error span');
    errorText.textContent = message;
    errorPopup.style.display = 'block';
    
    // Auto hide after 3 seconds
    setTimeout(() => {
      errorPopup.style.display = 'none';
    }, 3000);
}
