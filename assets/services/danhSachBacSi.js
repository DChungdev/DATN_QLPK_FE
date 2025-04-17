var doctors; //Khai báo mảng lưu trữ danh sách các bác sĩ được lấy từ API.
var bsID; 
var dsKhoa; //Khai báo danh sách khoa
const degreeMap = {
    0: "Giáo sư Y khoa",
    1: "Phó Giáo sư Y khoa",
    2: "Tiến sĩ Y khoa",
    3: "Bác sĩ Chuyên khoa 2",
    4: "Thạc sĩ Y khoa",
    5: "Bác sĩ Chuyên khoa 1",
    6: "Bác sĩ Đa khoa"
};

$(document).ready(function () {
    getAllDepartmentByDoctorsList();
    // loadDoctors(); //lấy danh sách bác sĩ từ API.
    
});
function loadDoctors() {
    axiosJWT
        .get(`/api/doctors`) //Gửi một yêu cầu GET đến API /api/Doctors để lấy danh sách bác sĩ.
        .then(function (response) {
            doctors = response.data; // Lưu dữ liệu từ API
            console.log(doctors);
            displayDoctors(doctors); // Hiển thị toàn bộ dịch vụ
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách bác sĩ", error);
        });
}
// Hàm hiển thị danh sách bác sĩ lên giao diện
function displayDoctors(data) {
    const doctorsList = $("#doctorsList"); // Vùng chứa danh sách bác sĩ
    doctorsList.empty(); // làm sạch danh sách trước khi thêm mới.

    if (data.length === 0) {
        doctorsList.append(`<p>Không tìm thấy bác sĩ nào.</p>`);
        return;
    }

      // Tạo một Map để ánh xạ từ khoaId sang tenKhoa
    const khoaMap = new Map();
    if(dsKhoa != null) {
        dsKhoa.forEach((item) => {
            khoaMap.set(item.departmentId, item.name);
        });
    }
    // Lặp qua danh sách bác sĩ và tạo HTML cho từng bác sĩ
    data.forEach((doctor) => {
      const tenKhoa = khoaMap.get(doctor.departmentId) || "Chưa có khoa"; // Lấy tên khoa từ Map
      const tenBangCap = degreeMap[doctor.degree] || "Chưa có bằng cấp";
      const imageUrl = doctor.image ? `http://localhost:8080${doctor.image}` : "../assets/img/doctors/doctors-1.jpg"; // URL hình ảnh từ API hoặc ảnh mặc định
        const doctorHTML = `
            <div class="col-lg-6" data-aos="fade-up" data-aos-delay="100" id="doctorInfor">
                <div bs-id="${doctor.doctorId}"></div>
                    <div class="team-member d-flex align-items-start">
                    <div class="pic"><img src="${imageUrl}" class="img-fluid" alt="${doctor.fullName}" style="border: 0; width: 200px; aspect-ratio: 1 / 1; object-fit: cover;"></div>
                    <div class="member-info">
                        <h4 id="tenBacSi">${doctor.fullName}</h4>
                        <span id="tenBangCap">${tenBangCap}</span>
                        <p>${tenKhoa}</p>
                        <div class="social">
                            <a href="https://x.com"><i class="bi bi-twitter-x"></i></a>
                            <a href="https://www.facebook.com"><i class="bi bi-facebook"></i></a>
                            <a href="https://www.instagram.com"><i class="bi bi-instagram"></i></a>
                            <a href="https://www.linkedin.com"> <i class="bi bi-linkedin"></i> </a>
                            
                        </div>
                        <button class="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#modalThemBacSi" data-id="${doctor.doctorId}">
                            Xem chi tiết
                        </button>
                    </div>
                    </div>
            </div>
        `;
        doctorsList.append(doctorHTML); // Thêm bác sĩ vào vùng chứa
    });
     // Thêm sự kiện click cho nút "Xem chi tiết"
     $(".btn-primary").click(function () {
        
        const bacSiId = $(this).data("id");
        console.log(bacSiId)
        const doctorDetails = doctors.find(doctor => doctor.doctorId === bacSiId);
        if (doctorDetails) {
            displayDoctorDetails(doctorDetails);
        }
    });
}
// Hàm hiển thị chi tiết bác sĩ trong modal
function displayDoctorDetails(doctor) {
    const modalBody = $("#modalThemBacSi .modal-body");
    modalBody.empty(); // Làm sạch nội dung modal trước khi thêm mới.

    const tenKhoa = dsKhoa.find(khoa => khoa.departmentId === doctor.departmentId)?.name || "Chưa có khoa";
    const tenBangCap = degreeMap[doctor.degree] || "Chưa có bằng cấp";
    const imageUrl = doctor.image ? `http://localhost:8080${doctor.image}` : "../assets/img/doctors/doctors-1.jpg"; // URL hình ảnh từ API hoặc ảnh mặc định

    const modalContent = `
        <div class="row d-flex justify-content-center align-items-stretch mt-3">
            <!-- Card 1 -->
            <div class="col-lg-4 d-flex align-items-center" data-aos="fade-up" data-aos-delay="100">
                <div class="team-member card text-center p-3 d-flex flex-column align-items-center w-100">
                    <div class="pic mb-3">
                        <img
                            src="${imageUrl}"
                            class="img-fluid rounded-circle"
                            alt="${doctor.fullName}"
                            style="width: 150px; height: 150px; object-fit: cover;"
                        />
                    </div>
                    <h4>${doctor.fullName}</h4>
                    <span>${tenBangCap}</span>
                    <div class="social mt-2 justify-content-center">
                        <a href="https://x.com"><i class="bi bi-twitter-x"></i></a>
                        <a href="https://www.facebook.com"><i class="bi bi-facebook"></i></a>
                        <a href="https://www.instagram.com"><i class="bi bi-instagram"></i></a>
                        <a href="https://www.linkedin.com"><i class="bi bi-linkedin"></i></a>
                    </div>
                </div>
            </div>

            <!-- Card 2 -->
            <div class="col-lg-6 d-flex align-items-center" data-aos="fade-up" data-aos-delay="200">
                <div class="team-member card p-3 d-flex flex-column justify-content-start w-100">
                    <h4 class="mb-2">${doctor.fullName}</h4>
                    <span class="text-muted mb-3">${tenBangCap}</span>
                    <p class="mb-2">Chuyên khoa: ${tenKhoa}</p>
                    <p class="mb-2">SĐT: ${doctor.phone}</p>
                    <p class="mb-2">Email: ${doctor.gender}</p>
                    <p class="mb-2">Địa chỉ: ${doctor.address}</p>
                    <p class="mb-2">Ngày sinh: ${doctor.dateOfBirth ? convertDate(doctor.dateOfBirth) : "Chưa có thông tin"}</p>
                </div>
            </div>
        </div>
    `;

    modalBody.append(modalContent);
}
// Lấy toàn bộ khoa
function getAllDepartmentByDoctorsList() {
    axiosJWT
      .get(`/api/departments`)
      .then(function (response) {
        dsKhoa = response.data;
        console.log("Danh sách khoa:", dsKhoa); // Kiểm tra dữ liệu khoa
        loadDoctors(); // Chỉ gọi loadDoctors sau khi dsKhoa đã được gán
      })
      .catch(function (error) {
        console.error("Lỗi không tìm được:", error);
      });
}


function convertDate(dateString) {
    const date = new Date(dateString); // Chuyển chuỗi thành đối tượng Date
    const day = String(date.getDate()).padStart(2, '0'); // Lấy ngày và đảm bảo 2 chữ số
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Lấy tháng, nhớ cộng thêm 1 vì getMonth() bắt đầu từ 0
    const year = date.getFullYear(); // Lấy năm

    return `${day}/${month}/${year}`; // Trả về định dạng ngày/tháng/năm
}
