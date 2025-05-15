var dsKhoa;
var dsBacSi;
var selectedDoctorId;
var selectedDate;
var selectedTime;
var patientInfo;
const baseFee = 100000;
var fee = baseFee;
function calculateFee(degree, baseFee) {
    // Tạo một mảng chứa tỷ lệ phần trăm phí theo từng mức độ bằng cấp
    const feePercentage = {
        0: 1.8,    // Giáo sư Y khoa 
        1: 1.5,  // Phó Giáo sư Y khoa
        2: 1.4,  // Tiến sĩ Y khoa
        3: 1.3,  // Bác sĩ Chuyên khoa 2
        4: 1.2,  // Thạc sĩ Y khoa
        5: 1.1,  // Bác sĩ Chuyên khoa 1
        6: 1     // Bác sĩ Đa khoa - 100%
    };

    // Lấy tỷ lệ phí cho bằng cấp, mặc định là 1 nếu không tìm thấy bằng cấp
    const percentage = feePercentage[degree] || 1;

    // Tính toán phí dựa trên tỷ lệ phần trăm
    const fee = baseFee * percentage;

    return fee;
}

$(document).ready(function () {
    // Lấy thông tin bệnh nhân
    getPatientInfo();
    
    // Lấy danh sách khoa
    getAllDepartment();
    
    // Sự kiện khi chọn khoa
    $("#department").on('change', function() {
        console.log("Department change event triggered");
        const departmentId = $(this).val();
        console.log("Department changed to:", departmentId);
        if (departmentId) {
            console.log("Calling getDoctorsByDepartment");
            getDoctorsByDepartment(departmentId);
        } else {
            console.log("No department selected, clearing doctor select");
            $("#doctor").empty().append('<option value="">Chọn bác sĩ</option>');
        }
    });
    
    // Sự kiện khi chọn bác sĩ
    $("#doctor").on('change', function() {
        selectedDoctorId = $(this).val();
        console.log("Doctor changed to:", selectedDoctorId);
        if (selectedDoctorId) {
            // Reset các trường liên quan đến ngày giờ
            $("#appointment-date").val('');
            $("#appointment-time").prop('disabled', true);
            $("#appointment-time").empty().append('<option value="">Chọn ca khám</option>');
        }
    });
    
    // Sự kiện khi chọn ngày
    $("#appointment-date").on('change', function() {
        selectedDate = $(this).val();
        console.log("Date changed to:", selectedDate);
        if (selectedDate && selectedDoctorId) {
            getAvailableTimeSlots(selectedDoctorId, selectedDate);
        }
    });
    
    // Sự kiện khi chọn giờ
    $("#appointment-time").on('change', function() {
        selectedTime = $(this).val();
        console.log("Time changed to:", selectedTime);
    });
    
    // Sự kiện khi click nút đặt lịch
    $("#btnDatLich").on('click', function() {
        if (validateAppointmentForm()) {
            showConfirmationModal();
        }
    });
    
    // Sự kiện khi xác nhận đặt lịch
    $("#confirmAppointmentBtn").on('click', function() {
        submitAppointment();
    });
});

// Lấy thông tin bệnh nhân
function getPatientInfo() {
    const userName = localStorage.getItem("userName");
    axiosJWT
        .get(`/api/patients/findbyUsername/${userName}`)
        .then(function (response) {
            patientInfo = response.data;
            // Điền thông tin bệnh nhân vào form
            $("#name").val(patientInfo.fullName);
            $("#phone").val(patientInfo.phone);
            $("#dateOfBirth").val(patientInfo.dateOfBirth ? patientInfo.dateOfBirth.split('T')[0] : '');
            $("#gender").val(patientInfo.gender);
            $("#address").val(patientInfo.address);
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy thông tin bệnh nhân:", error);
            const errorMessage = error.response?.data || "Có lỗi xảy ra khi lấy thông tin bệnh nhân";
            showErrorPopup(errorMessage);
        });
}

// Lấy danh sách khoa
function getAllDepartment() {
    axiosJWT
        .get(`/api/departments`)
        .then(function (response) {
            dsKhoa = response.data;
            const select = $("#department");
            select.empty().append('<option value="">Chọn khoa</option>');
            dsKhoa.forEach((item) => {
                const option = document.createElement("option");
                option.value = item.departmentId;
                option.textContent = item.name;
                select.append(option);
            });
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách khoa:", error);
            const errorMessage = error.response?.data || "Có lỗi xảy ra khi lấy danh sách khoa";
            showErrorPopup(errorMessage);
        });
}

// Lấy danh sách bác sĩ theo khoa
function getDoctorsByDepartment(departmentId) {
    console.log("getDoctorsByDepartment called with departmentId:", departmentId);
    if (!departmentId) {
        console.log("No departmentId provided");
        return;
    }

    console.log("Making API call to get doctors...");
    axiosJWT
        .get(`/api/doctors/findbyDepartmentId/${departmentId}`)
        .then(function (response) {
            console.log("API call successful");
            console.log("API response:", response.data);
            if (!response.data || !Array.isArray(response.data)) {
                console.error("Invalid response data format");
                return;
            }
            
            dsBacSi = response.data;
            const select = $("#doctor");
            if (!select.length) {
                console.error("Doctor select element not found");
                return;
            }

            select.empty().append('<option value="">Chọn bác sĩ</option>');
            dsBacSi.forEach((item) => {
                if (!item.doctorId || !item.fullName) {
                    console.warn("Invalid doctor data:", item);
                    return;
                }
                const option = document.createElement("option");
                option.value = item.doctorId;
                option.textContent = item.fullName;
                select.append(option);
            });
            console.log("Updated doctor select with", dsBacSi.length, "doctors");
        })
        .catch(function (error) {
            console.error("Error fetching doctors:", error);
            console.error("Error details:", {
                message: error.message,
                response: error.response,
                status: error.response?.status
            });
            const errorMessage = error.response?.data || "Có lỗi xảy ra khi lấy danh sách bác sĩ";
            showErrorPopup(errorMessage);
        });
}

// Lấy các khung giờ khám còn trống
function getAvailableTimeSlots(doctorId, date) {
    axiosJWT
        .get(`/api/appointments/doctor/${doctorId}/dates`)
        .then(function (response) {
            const bookedSlots = response.data;
            const timeSelect = $("#appointment-time");
            timeSelect.empty().append('<option value="">Chọn ca khám</option>');
            
            // Tạo danh sách các khung giờ trong ngày
            const timeSlots = [
                "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
                "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
                "16:00", "16:30", "17:00", "17:30"
            ];
            
            // Thêm các khung giờ vào select, disable các khung giờ đã được đặt
            timeSlots.forEach(slot => {
                const option = document.createElement("option");
                const slotDateTime = `${date}T${slot}:00.000+07:00`;
                const isBooked = bookedSlots.includes(slotDateTime);
                
                option.value = slotDateTime;
                option.textContent = slot;
                option.disabled = isBooked;
                if (isBooked) {
                    option.style.color = "gray";
                }
                timeSelect.append(option);
            });
            
            timeSelect.prop('disabled', false);
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy khung giờ khám:", error);
            const errorMessage = error.response?.data || "Có lỗi xảy ra khi lấy khung giờ khám";
            showErrorPopup(errorMessage);
        });
}

// Kiểm tra form đặt lịch
function validateAppointmentForm() {
    if (!selectedDoctorId) {
        showErrorPopup("Vui lòng chọn bác sĩ");
        return false;
    }
    if (!selectedDate) {
        showErrorPopup("Vui lòng chọn ngày khám");
        return false;
    }
    if (!selectedTime) {
        showErrorPopup("Vui lòng chọn ca khám");
        return false;
    }
    if (!$("#reason").val()) {
        showErrorPopup("Vui lòng nhập lý do khám");
        return false;
    }
    return true;
}

// Hiển thị modal xác nhận
function showConfirmationModal() {
    try{
        const doctor = dsBacSi.find(d => d.doctorId == selectedDoctorId);
        const department = dsKhoa.find(d => d.departmentId == doctor.departmentId);
        $("#confirmPatientName").text(patientInfo.fullName);
        $("#confirmPhone").text(patientInfo.phone);
        $("#confirmDepartment").text(department.name);
        $("#confirmDoctor").text(doctor.fullName);
        $("#confirmDate").text(selectedDate);
        $("#confirmTime").text(selectedTime.split('T')[1].substring(0, 5));
        $("#confirmReason").text($("#reason").val());
        fee = calculateFee(doctor.degree, baseFee);
        $("#baseFee").text(fee);
        
        $("#confirmationModal").modal('show');
    }
    catch{
        showErrorPopup("Vui lòng nhập đầy đủ thông tin!");
    }

}

// Gửi yêu cầu đặt lịch
function submitAppointment() {
    const appointmentData = {
        patientId: patientInfo.patientId,
        doctorId: selectedDoctorId,
        appointmentDate: selectedTime,
        reason: $("#reason").val(),
        baseFee: fee
    };
    
    axiosJWT
        .post('/api/appointments', appointmentData)
        .then(function (response) {
            showSuccessPopup("Đặt lịch khám thành công!");
            resetForm();
        })
        .catch(function (error) {
            console.error("Lỗi khi đặt lịch:", error);
            const errorMessage = error.response?.data || "Đặt lịch thất bại. Vui lòng thử lại!";
            showErrorPopup(errorMessage);
        });
}

// Reset form
function resetForm() {
    $("#department").val('');
    $("#doctor").empty().append('<option value="">Chọn bác sĩ</option>');
    $("#appointment-date").val('');
    $("#appointment-time").prop('disabled', true);
    $("#appointment-time").empty().append('<option value="">Chọn ca khám</option>');
    $("#reason").val('');
    selectedDoctorId = null;
    selectedDate = null;
    selectedTime = null;
    showSuccessModalAndReload();
}
function showSuccessModalAndReload() {
    // Hiển thị modal
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();

    // Sau 3 giây, reload lại trang
    setTimeout(() => {
        location.reload();
    }, 3000);
}
// Hiển thị popup thông báo lỗi
function showErrorPopup(message = "Có lỗi xảy ra. Vui lòng thử lại!") {
    const popup = document.getElementById("error-popup");
    popup.querySelector(".m-popup-text").textContent = message;
    popup.style.visibility = "visible";
    setTimeout(() => {
        popup.style.visibility = "hidden";
    }, 3000);
}

// Hiển thị popup thông báo thành công
function showSuccessPopup(message = "Thành công!") {
    const popup = document.getElementById("success-popup");
    popup.querySelector(".m-popup-text").textContent = message;
    popup.style.visibility = "visible";
    setTimeout(() => {
        popup.style.visibility = "hidden";
    }, 3000);
}
