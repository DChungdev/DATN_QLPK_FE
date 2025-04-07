// Hàm lấy danh sách và đếm số lượng bác sĩ
function getDataDoctorsCount() {
    return axiosJWT
        .get("/api/Doctors") // API trả về danh sách tất cả bác sĩ
        .then(function (response) {
            var doctorList = response.data; // Danh sách bác sĩ
            var doctorCount = doctorList.length; // Đếm số lượng bác sĩ
            return doctorCount; // Trả về số lượng bác sĩ
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách bác sĩ:", error);
            return 0; // Trả về 0 nếu có lỗi
        });
}

// Hàm lấy danh sách và đếm số lượng bệnh nhân
function getDataPatientsCount() {
    return axiosJWT
        .get("/api/Patients") // API trả về danh sách tất cả bệnh nhân
        .then(function (response) {
            var patientList = response.data; // Danh sách bệnh nhân
            var patientCount = patientList.length; // Đếm số lượng bệnh nhân
            return patientCount; // Trả về số lượng bệnh nhân
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách bệnh nhân:", error);
            return 0; // Trả về 0 nếu có lỗi
        });
}

// Hàm gọi cả 2 hàm trên và hiển thị kết quả
function loadDashboardCounts() {
    Promise.all([getDataDoctorsCount(), getDataPatientsCount()])
        .then(function (results) {
            var doctorCount = results[0];291
            var patientCount = results[1];

            console.log("Số lượng bác sĩ:", doctorCount);
            console.log("Số lượng bệnh nhân:", patientCount);

            // Hiển thị số lượng lên trang HTML
            $("#count_doctor").text(doctorCount);
            $("#count_patient").text(patientCount);
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy dữ liệu thống kê:", error);
        });
}

// Gọi hàm khi trang được tải
$(document).ready(function () {
    loadDashboardCounts();
});
