// Department service for handling department operations
const departmentService = {
    // Get all departments
    getAllDepartments: async function() {
        try {
            const response = await axiosJWT.get('/api/departments');
            return response.data;
        } catch (error) {
            console.error('Error getting departments:', error);
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
            throw error;
        }
    }
};

// Export the service
window.departmentService = departmentService;
