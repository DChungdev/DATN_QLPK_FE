var doctors = []; // Lưu danh sách dịch vụ toàn bộ
var dsKhoa;
var patientInfo; // Lưu thông tin cá nhân

$(document).ready(function () {
    getAllDepartmentByDoctors();
    getDataDoctors();
    getPatientInfo(); // Lấy thông tin cá nhân khi trang được tải
});

// Hàm lấy thông tin cá nhân từ API
function getPatientInfo() {
    const userName = localStorage.getItem('userName');
    if (!userName) {
        console.error("Không tìm thấy userName trong localStorage");
        return;
    }

    axiosJWT
        .get(`/api/patients/findbyUsername/${userName}`)
        .then(function (response) {
            patientInfo = response.data;
            displayPatientInfo(patientInfo);
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy thông tin cá nhân:", error);
        });
}

// Hàm hiển thị thông tin cá nhân lên các trường
function displayPatientInfo(patient) {
    if (!patient) return;

    // Hiển thị thông tin cơ bản
    $("#username").val(localStorage.getItem('userName'));
    $("#hoten").val(patient.fullName || '');
    $("#sdt").val(patient.phone || '');
    $("#ngaysinh").val(patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '');
    $("#diachi").val(patient.address || '');

    // Hiển thị giới tính
    if (patient.gender === "Nam") {
        $('#male').prop('checked', true);
    } else if (patient.gender === "Nữ") {
        $('#female').prop('checked', true);
    } else {
        $('#other').prop('checked', true);
    }

    // Hiển thị ảnh
    if (patient.image) {
        $('#previewImage').attr('src', `http://localhost:8080${patient.image}`);
        $('#uploadedImage').attr('src', `http://localhost:8080${patient.image}`);
    } else {
        $('#previewImage').attr('src', '../assets/img/user.png');
        $('#uploadedImage').attr('src', '../assets/img/user.png');
    }
}

// Hàm lấy danh sách dịch vụ từ API
function getDataDoctors() {
    axiosJWT
        .get(`/api/Doctors`)
        .then(function (response) {
            doctors = response.data;
            displayDoctors(doctors);
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách bác sĩ:", error);
        });
}

// Hàm hiển thị danh sách dịch vụ
function displayDoctors(data) {
    const Doctorslist = $("#Doctorslist");
    Doctorslist.empty();

    if (data.length === 0) {
        Doctorslist.append(`<p>Không tìm thấy bác sĩ nào.</p>`);
        return;
    }

    const khoaMap = new Map();
    if(dsKhoa != null) {
        dsKhoa.forEach((item) => {
            khoaMap.set(item.khoaId, item.tenKhoa);
        });
    }

    const displayDoctors = data.slice(0, 4);

    displayDoctors.forEach((doctor) => {
        const tenKhoa = khoaMap.get(doctor.khoaId) || "Chưa có khoa";
        const imageUrl = doctor.hinhAnh ? `http://localhost:37649${doctor.hinhAnh}` : "../assets/img/doctors/doctors-1.jpg";
        const doctorHTML = `
            <div class="col-lg-6" data-aos="fade-up" data-aos-delay="100">
                <div class="team-member d-flex align-items-start">
                    <div class="pic"><img src="${imageUrl}" class="img-fluid" alt="${doctor.hoTen}"></div>
                    <div class="member-info">
                        <h4>${doctor.hoTen}</h4>
                        <span>${doctor.tenBangCap}</span>
                        <p>${tenKhoa}</p>
                    </div>
                </div>
            </div>
        `;
        Doctorslist.append(doctorHTML);
    });
}

// Lấy toàn bộ khoa
function getAllDepartmentByDoctors() {
    axiosJWT
        .get(`/api/v1/Departments`)
        .then(function (response) {
            dsKhoa = response.data;
        })
        .catch(function (error) {
            console.error("Lỗi không tìm được:", error);
        });
}



