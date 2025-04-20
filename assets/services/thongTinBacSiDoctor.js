var doctor = null;
var departments = [];

$(document).ready(function () {
    getDoctorInfo();
    fetchDepartments();

    // Handle form submission for updating doctor information
    $('#suaThongTin').on('submit', async function (e) {
        e.preventDefault();
        await updateDoctorInfo();
    });

    // Handle password change
    $("#savePasswordBtn").click(function () {
        changePassword();
    });

    // Handle file input change for image preview
    $("#fileInput").on("change", function (event) {
        previewImage(event);
    });
});

// Fetch departments from API
function fetchDepartments() {
    axiosJWT
        .get('/api/departments')
        .then(function (response) {
            departments = response.data;
            populateDepartmentsDropdown();
        })
        .catch(function (error) {
            console.error("Error fetching departments:", error);
            showPopup("error", "Lỗi! Không thể lấy danh sách khoa.");
        });
}

// Populate departments dropdown
function populateDepartmentsDropdown() {
    const departmentSelect = $("#khoa");
    departmentSelect.empty();
    
    // Add default option
    departmentSelect.append(new Option("-- Chọn khoa --", ""));
    
    // Add departments to dropdown
    departments.forEach(function(department) {
        const option = new Option(department.name, department.departmentId);
        departmentSelect.append(option);
    });
    
    // If doctor is loaded, set selected department
    if (doctor && doctor.departmentId) {
        departmentSelect.val(doctor.departmentId);
        
        // Set the department name in a readable format
        const selectedDepartment = departments.find(d => d.departmentId === doctor.departmentId);
        if (selectedDepartment) {
            $("#departmentName").text(selectedDepartment.name);
        }
    }
}

// Get doctor information from API
function getDoctorInfo() {
    axiosJWT
        .get(`/api/doctors/findbyUsername/${localStorage.getItem("doctorName")}`)
        .then(function (response) {
            doctor = response.data;
            displayDoctorInfo();
            updateAvatar();
            // Update department dropdown if departments are already loaded
            if (departments.length > 0) {
                $("#khoa").val(doctor.departmentId);
            }
        })
        .catch(function (error) {
            console.error("Error fetching doctor information:", error);
            showPopup("error", "Lỗi! Không thể lấy thông tin bác sĩ.");
        });
}

// Display doctor information in the form
function displayDoctorInfo() {
    if (!doctor) return;

    // Set user name
    var username = localStorage.getItem("doctorName");
    $("#nameDoctor").text(doctor.fullName || "");
    $("#username").val(username || "");
    $("#hoten").val(doctor.fullName || "");
    
    // Set degree if available
    if (doctor.degree !== null && doctor.degree !== undefined) {
        $("#bangCap").val(doctor.degree);
    } else {
        $("#bangCap").val(""); // Default to empty if no degree
    }
    
    // Set department if available
    if (doctor.departmentId) {
        $("#khoa").val(doctor.departmentId);
        
        // If departments are loaded, also display the department name
        const selectedDepartment = departments.find(d => d.departmentId === doctor.departmentId);
        if (selectedDepartment) {
            $("#departmentName").text(selectedDepartment.name);
        } else {
            // If departments aren't loaded yet, we'll handle this in populateDepartmentsDropdown
            $("#departmentName").text("Đang tải thông tin khoa...");
        }
    } else {
        $("#departmentName").text("Chưa được phân công khoa");
    }
    
    // Set other fields
    $("#email").val(doctor.email || "");
    $("#sdt").val(doctor.phone || "");
    $("#diaChi").val(doctor.address || "");
    
    // Set experience (may not be in new JSON)
    $("#namKinhNghiem").val(doctor.experience || 0);
    
    // Format and set date of birth if available
    if (doctor.dateOfBirth) {
        const dateObj = new Date(doctor.dateOfBirth);
        const formattedDate = dateObj.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        $("#ngaySinh").val(formattedDate);
    }
    
    // Set gender if available
    if (doctor.gender) {
        if (doctor.gender === "Male") {
            $("#gioiTinh").val("Nam");
        } else if (doctor.gender === "Female") {
            $("#gioiTinh").val("Nữ");
        }
    }

    // Set avatar if available
    if (doctor.image) {
        $('#previewImage').attr('src', "http://localhost:8080" + doctor.image);
    }
}

// Update doctor information
async function updateDoctorInfo() {
    try {
        let imageUrl = doctor.image;  // Keep existing image by default
        let fileInput = document.getElementById('fileInput');
        let file = fileInput.files[0];

        // If a new file is selected, upload it first
        if (file) {
            try {
                var formData = new FormData();
                formData.append("file", file);

                const uploadResponse = await axiosJWT.post('/api/upload/image', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                imageUrl = uploadResponse.data;
                console.log("File uploaded successfully:", imageUrl);
            } catch (error) {
                console.error("Error uploading file:", error);
                showPopup("error", "Lỗi! Không thể tải lên hình ảnh.");
                return;
            }
        }

        // Get gender value in English format for API
        let genderValue = doctor.gender; // Default to existing value
        if ($("#gioiTinh").val() === "Nam") {
            genderValue = "Male";
        } else if ($("#gioiTinh").val() === "Nữ") {
            genderValue = "Female";
        }

        // Prepare doctor data for update
        const updatedDoctor = {
            doctorId: doctor.doctorId,
            fullName: $("#hoten").val(),
            dateOfBirth: doctor.dateOfBirth,
            gender: genderValue,
            phone: $("#sdt").val(),
            address: $("#diaChi").val(),
            degree: $("#bangCap").val() || null,
            departmentId: parseInt($("#khoa").val(), 10) || doctor.departmentId,
            image: imageUrl
        };

        // Send update request
        const updateResponse = await axiosJWT.put(`/api/doctors/${doctor.doctorId}`, updatedDoctor);
        console.log('Doctor information updated successfully:', updateResponse.data);
        
        // Refresh doctor information
        getDoctorInfo();
        showPopup("success", "Thành công! Thông tin bác sĩ đã được cập nhật.");
    } catch (error) {
        console.error("Error updating doctor information:", error);
        showPopup("error", "Lỗi! Không thể cập nhật thông tin bác sĩ.");
    }
}

// Change password
function changePassword() {
    const currentPassword = $("#currentPassword").val();
    const newPassword = $("#newPassword").val();
    const confirmPassword = $("#confirmPassword").val();
    const username = localStorage.getItem('doctorName');
    
    // Validate password match
    if (newPassword !== confirmPassword) {
        $("#msg").text("Mật khẩu xác nhận không giống!");
        return;
    }
    
    // Prepare password change data
    const passwordData = {
        username: username,
        currentPassword: currentPassword,
        newPassword: newPassword
    };
    
    axiosJWT
        .post(`/api/auth/change-password`, passwordData)
        .then(function (response) {
            showPopup("success", "Thành công! Mật khẩu đã được thay đổi.");
            $("#currentPassword").val("");
            $("#newPassword").val("");
            $("#confirmPassword").val("");
            // Close modal after success
            $('#changePasswordModal').modal('hide');
        })
        .catch(function (error) {
            console.error("Error changing password:", error);
            showPopup("error", "Lỗi! Không thể thay đổi mật khẩu.");
        });
}

// Update avatar image
function updateAvatar() {
    if (doctor && doctor.image) {
        $('#avatar').attr('src', "http://localhost:8080" + doctor.image);
    }
}

// Preview image before upload
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            $('#previewImage').attr('src', e.target.result);
        };
        reader.readAsDataURL(file);
    }
}

// Validate phone number
function validatePhone() {
    const phoneInput = $("#sdt");
    const phone = phoneInput.val();
    const phoneRegex = /^[0-9]{10,11}$/;

    if (phoneRegex.test(phone)) {
        phoneInput.removeClass("input-error");
        return true;
    } else {
        phoneInput.addClass("input-error");
        return false;
    }
}

// Validate email
function validateEmail() {
    const emailInput = $("#email");
    const email = emailInput.val();
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

    if (emailRegex.test(email)) {
        emailInput.removeClass("input-error");
        return true;
    } else {
        emailInput.addClass("input-error");
        return false;
    }
}

// Validate password
function validatePassword() {
    const passwordInput = $("#newPassword");
    const password = passwordInput.val();
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (passwordRegex.test(password)) {
        passwordInput.removeClass("input-error");
        $("#pass-msg").text("");
        return true;
    } else {
        passwordInput.addClass("input-error");
        $("#pass-msg").text("Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.");
        return false;
    }
}

// Check if passwords match
function checkPasswordMatch() {
    const password = $("#newPassword").val();
    const confirmPassword = $("#confirmPassword").val();
    
    if (password !== confirmPassword) {
        $("#msg").text("Mật khẩu xác nhận không giống!");
        $("#savePasswordBtn").prop("disabled", true);
        return false;
    } else {
        $("#msg").text("");
        $("#savePasswordBtn").prop("disabled", false);
        return true;
    }
}

// Show success popup
function showSuccessPopup(message = "Thành công!") {
    showPopup("success", message);
}

// Show error popup
function showErrorPopup(message = "Có lỗi xảy ra!") {
    showPopup("error", message);
}

// Generic popup function
function showPopup(type, message) {
    const popupItem = $(`.m-popup-item.m-popup-${type}`);
    
    // Update message
    if (type === "success") {
        $(".m-popup-text-success").html(`<span>${message}</span>`);
    } else if (type === "error") {
        $(".m-popup-text-error").html(`<span>${message}</span>`);
    }
    
    // Show popup
    $(`#${type}-popup`).css("visibility", "visible");
    
    // Hide popup after 3 seconds
    setTimeout(() => {
        $(`#${type}-popup`).css("visibility", "hidden");
    }, 3000);
}