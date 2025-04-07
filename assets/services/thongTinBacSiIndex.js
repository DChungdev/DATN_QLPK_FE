var doctors = []; // Lưu danh sách dịch vụ toàn bộ
var dsKhoa;
$(document).ready(function () {
   getAllDepartmentByDoctors();
  getDataDoctors();

    // Xử lý sự kiện tìm kiếm
  
});

// Hàm lấy danh sách dịch vụ từ API
function getDataDoctors() {
    axiosJWT
        .get(`/api/Doctors`)
        .then(function (response) {
            doctors = response.data; // Lưu dữ liệu từ API
            displayDoctors(doctors); // Hiển thị toàn bộ dịch vụ
        })
        .catch(function (error) {
            console.error("Lỗi khi lấy danh sách bác sĩ:", error);
        });
}

// Hàm hiển thị danh sách dịch vụ
function displayDoctors(data) {
    const Doctorslist = $("#Doctorslist"); // Vùng chứa danh sách dịch vụ
    Doctorslist.empty(); // Xóa các dịch vụ cũ

    if (data.length === 0) {
      Doctorslist.append(`<p>Không tìm thấy bác sĩ nào.</p>`);
        return;
    }

    // Tạo một Map để ánh xạ từ khoaId sang tenKhoa
  const khoaMap = new Map();
  if(dsKhoa != null) {
    dsKhoa.forEach((item) => {
        khoaMap.set(item.khoaId, item.tenKhoa);
      });
  }
    // Lấy 4 bác sĩ đầu tiên
    const displayDoctors = data.slice(0, 4);

    // Lặp qua 4 bác sĩ đầu tiên và tạo HTML cho từng bác sĩ
    displayDoctors.forEach((doctor) => {
      const tenKhoa = khoaMap.get(doctor.khoaId) || "Chưa có khoa"; // Lấy tên khoa từ Map
      const imageUrl = doctor.hinhAnh ? `http://localhost:37649${doctor.hinhAnh}` : "../assets/img/doctors/doctors-1.jpg"; // URL hình ảnh từ API hoặc ảnh mặc định
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
        Doctorslist.append(doctorHTML); // Thêm bác sĩ vào vùng chứa
    }); 
}
// Lấy toàn bộ khoa
function getAllDepartmentByDoctors() {
  axiosJWT
    .get(`/api/v1/Departments`)
    .then(function (response) {
      dsKhoa = response.data;;
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}



