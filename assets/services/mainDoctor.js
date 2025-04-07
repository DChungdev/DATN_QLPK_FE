var dsBN = []; // Danh sách bệnh nhân
var dsLK = []; // Danh sách lịch khám
var dsKQ = []; // Danh sách kết quả khám
var bsId = ""; // ID bác sĩ

$(document).ready(async function () {
    await getDoctorId(); // Lấy ID bác sĩ
    await getDoctorPatients(); // Lấy danh sách bệnh nhân theo bác sĩ
    await getDoctorAppointments(); // Lấy danh sách lịch khám theo bác sĩ
    await getDoctorResults();

    // Hiển thị số lượng bệnh nhân vào ô input
    displayPatientCount();

    // Hiển thị số lượng lịch khám vào ô input
    displayAppointmentCount();

    displayResultsCount();
});

// Hàm lấy ID bác sĩ từ API
async function getDoctorId() {
    try {
        let userId = localStorage.getItem("doctorId");
        const response = await axiosJWT.get(`/api/Doctors/getbyuserid/${userId}`);
        bsId = response.data.bacSiId; // Lấy giá trị ID bác sĩ
    } catch (error) {
        console.error("Lỗi khi lấy ID bác sĩ:", error);
        showErrorPopup("Không thể tải ID bác sĩ.");
    }
}

// Hàm lấy danh sách bệnh nhân theo ID bác sĩ
async function getDoctorPatients() {
    try {
        const response = await axiosJWT.get(`/api/Patients/getbydoctorid/${bsId}`);
        dsBN = response.data; // Lưu danh sách bệnh nhân từ API
    } catch (error) {
        console.error("Lỗi khi lấy danh sách bệnh nhân:", error);
        showErrorPopup("Không thể tải danh sách bệnh nhân.");
    }
}

// Hàm lấy danh sách lịch khám theo ID bác sĩ
async function getDoctorAppointments() {
    try {
        const response = await axiosJWT.get(`/api/v1/Appointments/doctor/${bsId}`);
        dsLK = response.data; // Lưu danh sách lịch khám từ API
    } catch (error) {
        console.error("Lỗi khi lấy danh sách lịch khám:", error);
        showErrorPopup("Không thể tải danh sách lịch khám.");
    }
}

// Hàm lấy danh sách kết quả khám theo ID bác sĩ
async function getDoctorResults() {
    try {
        const response = await axiosJWT.get(`/api/Results/doctor/${bsId}`);
        dsKQ = response.data; // Lưu danh sách lịch khám từ API
    } catch (error) {
        console.error("Lỗi khi lấy danh sách lịch khám:", error);
        showErrorPopup("Không thể tải danh sách lịch khám.");
    }
}

// Hàm hiển thị số lượng bệnh nhân vào ô input
function displayPatientCount() {
    const soBenhNhan = dsBN.length; // Đếm số lượng bệnh nhân

    if (soBenhNhan === 0) {
        $("#soBenhNhan").val("0 bệnh nhân"); // Nếu không có bệnh nhân
    } else {
        $("#soBenhNhan").val(`${soBenhNhan} bệnh nhân`); // Hiển thị số lượng bệnh nhân
    }
}

// Hàm hiển thị số lượng lịch khám vào ô input
function displayAppointmentCount() {
    const soLichKham = dsLK.length; // Đếm số lượng lịch khám

    if (soLichKham === 0) {
        $("#soLichKham").val("0 lịch khám"); // Nếu không có lịch khám
    } else {
        $("#soLichKham").val(`${soLichKham} lịch khám`); // Hiển thị số lượng lịch khám
    }
}

function displayResultsCount() {
    const soKetQua = dsKQ.length; // Đếm số lượng lịch khám

    if (soKetQua === 0) {
        $("#soKetQua").val("0 kết quả"); // Nếu không có lịch khám
    } else {
        $("#soKetQua").val(`${soKetQua} kết quả`); // Hiển thị số lượng lịch khám
    }
}
// Hàm hiển thị thông báo lỗi
function showErrorPopup(message) {
    const errorPopup = $("#error-popup");
    errorPopup.find(".m-popup-text-error span").text(message);
    errorPopup.css("visibility", "visible");

    // Ẩn popup sau 3 giây
    setTimeout(() => {
        errorPopup.css("visibility", "hidden");
    }, 3000);
}
