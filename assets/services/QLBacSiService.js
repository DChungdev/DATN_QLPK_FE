var dsBS;
var bsID = "";
var dsKhoa;
var currentPage = 1;
const recordsPerPage = 10;
var filteredData = []; // Thêm biến để lưu dữ liệu đã lọc

$(document).ready(function () {
  getData();
  refreshUI();
  
  $("#refresh-data").click(function () {
    getData(); // Gọi hàm getData
    refreshUI();
  });
  const departmentSelectAdd = document.querySelector(
    "#modalThemBacSi #add-khoa"
  );
  getAllDepartment(departmentSelectAdd);
  const departmentSelectEdit = document.querySelector(
    "#modalSuaBacSi #edit-khoa"
  );
  getAllDepartment(departmentSelectEdit);

  // Gắn sự kiện cho nút hiển thị modal sửa
  $(document).on("click", ".m-edit", function () {
    // const benhNhanId = $(this).data("id"); // Lấy id từ thuộc tính data-id
    const doctorId = $(this).closest("tr").attr("bs-id");
    bsID = doctorId;
    console.log(bsID);
    const bacSi = dsBS.find((bs) => bs.doctorId == doctorId); // Tìm bệnh nhân trong danh sách

    if (bacSi) {
      fillEditModal(bacSi); // Hiển thị thông tin lên modal
    } else {
      console.error("Không tìm thấy thông tin bác sĩ!");
    }
  });

  // // Gắn sự kiện cho nút hiển thị modal Thêm
  // $("#btnOpenModalAdd").click(function () {
  //   let maBSNext = getMaxBacSiCode(dsBS);
  //   $("#add-mabs").val(maBSNext);
  // });
  // Gắn sự kiện cho nút Thêm
  $("#btnAdd").click(function () {
    const bangCapValue = parseInt($("#add-bangCap").val());
    const khoaIdValue = $("#add-khoa").val();
    const imageFile = $("#image-upload-add")[0].files[0];
    
    // Tạo đối tượng bác sĩ mới
    const newDoctor = {
      fullName: $("#add-tenbs").val(),
      phone: $("#add-sdt").val() || null,
      degree: bangCapValue,
      address: $("#add-diaChi").val() || null,
      gender: $("#add-gioiTinh").val() || null,
      dateOfBirth: $("#add-ngaysinh").val() || null,
      departmentId: khoaIdValue || null
    };

    // Nếu có ảnh, upload ảnh trước
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);

      axiosJWT
        .post('/api/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(function (response) {
          // Thêm đường dẫn ảnh vào đối tượng bác sĩ
          newDoctor.image = response.data;
          // Gửi request thêm bác sĩ
          return axiosJWT.post(`/api/doctors`, newDoctor);
        })
        .then(function (response) {
          notificationService.showSuccess("Thêm bác sĩ thành công!");
          console.log("Thêm thành công:", response.data);
          getData();
          refreshUI();
        })
        .catch(function (error) {
          notificationService.showError(error.response?.data || "Không thể thêm bác sĩ");
          console.error("Lỗi khi thêm:", error);
        });
    } else {
      // Nếu không có ảnh, gửi request thêm bác sĩ ngay
      axiosJWT
        .post(`/api/doctors`, newDoctor)
        .then(function (response) {
          notificationService.showSuccess("Thêm bác sĩ thành công!");
          console.log("Thêm thành công:", response.data);
          getData();
          refreshUI();
        })
        .catch(function (error) {
          notificationService.showError(error.response?.data || "Không thể thêm bác sĩ");
          console.error("Lỗi khi thêm:", error);
        });
    }
  });

  // Gắn sự kiện cho nút Sửa
  $("#btnEdit").click(function () {
    const bangCapValue = parseInt($("#edit-bangCap").val());
    const khoaIdValue = $("#edit-khoa").val();
    const imageFile = $("#image-upload-edit")[0].files[0];
    
    // Tạo đối tượng bác sĩ cập nhật
    const updatedDoctor = {
      fullName: $("#edit-tenbs").val(),
      phone: $("#edit-sdt").val() || null,
      degree: bangCapValue,
      address: $("#edit-diaChi").val() || null,
      gender: $("#edit-gioiTinh").val() || null,
      dateOfBirth: $("#edit-ngaysinh").val() || null,
      departmentId: khoaIdValue || null
    };

    // Nếu có ảnh mới, upload ảnh trước
    if (imageFile) {
      const formData = new FormData();
      formData.append('file', imageFile);

      axiosJWT
        .post('/api/upload/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        .then(function (response) {
          // Thêm đường dẫn ảnh vào đối tượng bác sĩ
          updatedDoctor.image = response.data;
          // Gửi request cập nhật bác sĩ
          return axiosJWT.put(`/api/doctors/${bsID}`, updatedDoctor);
        })
        .then(function (response) {
          notificationService.showSuccess("Cập nhật bác sĩ thành công!");
          console.log("Cập nhật thành công:", response.data);
          getData();
          refreshUI();
        })
        .catch(function (error) {
          notificationService.showError(error.response?.data || "Không thể cập nhật bác sĩ");
          console.error("Lỗi khi cập nhật:", error);
        });
    } else {
      // Nếu không có ảnh mới, gửi request cập nhật ngay
      axiosJWT
        .put(`/api/doctors/${bsID}`, updatedDoctor)
        .then(function (response) {
          notificationService.showSuccess("Cập nhật bác sĩ thành công!");
          console.log("Cập nhật thành công:", response.data);
          getData();
          refreshUI();
        })
        .catch(function (error) {
          notificationService.showError(error.response?.data || "Không thể cập nhật bác sĩ");
          console.error("Lỗi khi cập nhật:", error);
        });
    }
  });

  //Mở modal xác nhận xóa
  $(document).on("click", ".m-delete", function () {
    const doctorId = $(this).closest("tr").attr("bs-id");
    bsID = doctorId;
    console.log(bsID);
    const bacSi = dsBS.find((bs) => bs.doctorId === doctorId); // Tìm bác sĩ trong danh sách
  });

  $("#btnDelete").click(function () {
    axiosJWT
      .delete(`/api/doctors/${bsID}`)
      .then(function (response) {
        notificationService.showSuccess("Xóa bác sĩ thành công!");
        console.log("Xóa thành công:", response.data);
        getData(); // Tải lại dữ liệu sau khi cập nhật
        refreshUI();
      })
      .catch(function (error) {
        notificationService.showError(error.response?.data || "Không thể xóa bác sĩ");
        console.error("Lỗi khi xóa:", error);
      });
  });
  // Sự kiện khi nhập vào ô tìm kiếm
  $(".m-input-search").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    if (value === "") {
      filteredData = [];
      refreshUI();
      return;
    }

    filteredData = dsBS.filter(function (item) {
      return (
        (item.fullName && item.fullName.toLowerCase().includes(value)) ||
        (item.phone && item.phone.toLowerCase().includes(value)) ||
        (item.address && item.address.toLowerCase().includes(value)) ||
        (item.gender && item.gender.toLowerCase().includes(value))

      );
    });

    refreshUI();
  });

  // Sự kiện khi thay đổi ngày
  $("#startDate, #endDate").on("change", function () {
    filterByDate();
  });

  // Sự kiện khi click nút lọc
  $("#btnFilter").click(function () {
    filterByDate();
  });

  // Thêm sự kiện cho input file trong modal thêm
  $("#image-upload-add").change(function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        $("#preview-add").attr("src", e.target.result);
      }
      reader.readAsDataURL(file);
    }
  });

  // Thêm sự kiện cho input file trong modal sửa
  $("#image-upload-edit").change(function() {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        $("#preview-edit").attr("src", e.target.result);
      }
      reader.readAsDataURL(file);
    }
  });

  // Thêm sự kiện click cho ảnh preview trong modal thêm
  $("#preview-add").click(function() {
    const enlargedImage = document.getElementById('enlargedImage');
    enlargedImage.src = this.src;
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    imageModal.show();
  });

  // Thêm sự kiện click cho ảnh preview trong modal sửa
  $("#preview-edit").click(function() {
    const enlargedImage = document.getElementById('enlargedImage');
    enlargedImage.src = this.src;
    const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
    imageModal.show();
  });

  // Add event listener for export button
  $("#exportButton").click(function() {
    exportToExcel();
  });
});

function filterByDate() {
  const startDate = $("#startDate").val();
  const endDate = $("#endDate").val();

  if (!startDate && !endDate) {
    filteredData = [];
    refreshUI();
    return;
  }

  filteredData = dsBS.filter(function (item) {
    const itemDate = new Date(item.dateOfBirth);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && end) {
      return itemDate >= start && itemDate <= end;
    } else if (start) {
      return itemDate >= start;
    } else if (end) {
      return itemDate <= end;
    }
    return true;
  });

  refreshUI();
}

function getData() {
  axiosJWT
    .get(`/api/doctors`)
    .then(function (response) {
      dsBS = response.data;
      filteredData = dsBS; // Khởi tạo filteredData với toàn bộ dữ liệu
      console.log(dsBS);
      refreshUI();
    })
    .catch(function (error) {
      notificationService.showError("Không thể tải danh sách bác sĩ");
      console.error("Lỗi không tìm được:", error);
      dsBS = [];
      filteredData = [];
      refreshUI();
    });
}

function refreshUI() {
  displayData(currentPage);
  updatePagination();
}   

// function getAppointmentCounts(dsBS) {
//   // Lấy số lượng ca khám của từng bác sĩ
//   axiosJWT
//     .get(`/api/Doctors/countAppointments`)
//     .then(function (response) {
//       const appointmentCounts = response.data;

//       // Tạo một map để ánh xạ từ bacSiId sang số lượng ca khám
//       const appointmentMap = new Map();
//       appointmentCounts.forEach(item => {
//         appointmentMap.set(item.bacSiId, item.appointmentCount);
//       });

//       // Sau khi có số lượng ca khám, gọi hàm display để hiển thị dữ liệu
//       display(dsBS, appointmentMap);
//     })
//     .catch(function (error) {
//       console.error("Lỗi không lấy được số lượng ca khám:", error);
//     });
// }
function displayData(page) {
  const tableBody = document.querySelector("#tblBacSi tbody");
  
  if (!tableBody) {
    console.error("Không tìm thấy phần tử tbody");
    return;
  }

  tableBody.innerHTML = ""; // Xóa nội dung cũ

  const dataToDisplay = filteredData.length > 0 ? filteredData : dsBS;

  if (!dataToDisplay || dataToDisplay.length === 0) {
    console.log("Không có dữ liệu để hiển thị");
    return;
  }

  // Tính toán các chỉ số cho phân trang
  const startIndex = (page - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = dataToDisplay.slice(startIndex, endIndex);

  // Lặp qua danh sách bác sĩ đã phân trang và xây dựng các hàng bảng
  paginatedData.forEach((item, index) => {
    // Tạo URL ảnh từ API hoặc sử dụng ảnh mặc định
    const imageUrl = item.image ? `http://localhost:8080${item.image}` : 'http://localhost:8080/uploads/no-img.jpg';

    const row = `
      <tr bs-id="${item.doctorId}">
        <td style="display: none"></td>
        <td class="text-center">${startIndex + index + 1}</td>
        <td>
          <div class="image-preview" style="width: 50px; height: 50px; cursor: pointer;">
            <img src="${imageUrl}" alt="Doctor Image" class="img-thumbnail" style="width: 100%; height: 100%; object-fit: cover;">
          </div>
        </td>
        <td class="m-data-left">${item.fullName || "Chưa có"}</td>
        <td class="m-data-left">${formatDate(item.dateOfBirth) || "Chưa có"}</td>
        <td class="m-data-left">${item.gender || "Chưa có"}</td>
        <td class="m-data-left">${getBangCapText(item.degree) || "Chưa có"}</td>
        <td class="m-data-left">${item.departmentId || "Chưa có"}</td>
        <td class="m-data-left">${item.phone || "Chưa có"}</td>
        <td class="m-data-left">${item.address || "Chưa có"}</td>
        <td>
          <div class="m-table-tool">
            <div class="m-edit m-tool-icon" data-bs-toggle="modal" data-bs-target="#modalSuaBacSi" data-id="${item.doctorId}">
              <i class="fas fa-edit text-primary"></i>
            </div>
            <div class="m-delete m-tool-icon" data-bs-toggle="modal" data-bs-target="#confirm-delete">
              <i class="fas fa-trash-alt text-danger"></i>
            </div>
          </div>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });

  // Thêm sự kiện click cho tất cả ảnh sau khi đã render xong bảng
  const imageElements = tableBody.querySelectorAll('.image-preview img');
  imageElements.forEach(img => {
    img.addEventListener('click', function() {
      const enlargedImage = document.getElementById('enlargedImage');
      enlargedImage.src = this.src;
      const imageModal = new bootstrap.Modal(document.getElementById('imageModal'));
      imageModal.show();
    });
  });

  currentPage = page;
}

function getBangCapText(bangCap) {
  const bangCapMap = {
    0: "Giáo sư Y khoa",
    1: "Phó Giáo sư Y khoa",
    2: "Tiến sĩ Y khoa",
    3: "Bác sĩ Chuyên khoa 2",
    4: "Thạc sĩ Y khoa",
    5: "Bác sĩ Chuyên khoa 1",
    6: "Bác sĩ Đa khoa"
  };
  return bangCapMap[bangCap] || "Chưa có";
}

function updatePagination() {
  let paginationContainer = document.querySelector(".pagination");
  
  // Nếu không tìm thấy container, tạo mới
  if (!paginationContainer) {
    const container = document.createElement("div");
    container.className = "pagination-container";
    container.innerHTML = '<ul class="pagination"></ul>';
    document.querySelector(".data-table").after(container);
    paginationContainer = container.querySelector(".pagination");
  }

  paginationContainer.innerHTML = "";

  const dataToDisplay = filteredData.length > 0 ? filteredData : dsBS;

  if (!dataToDisplay || dataToDisplay.length === 0) {
    return;
  }

  const totalPages = Math.ceil(dataToDisplay.length / recordsPerPage);

  // Nút Trước
  const prevLi = document.createElement("li");
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" tabindex="-1" ${currentPage === 1 ? 'aria-disabled="true"' : ''}>Trước</a>`;
  prevLi.addEventListener("click", function (e) {
    e.preventDefault();
    if (currentPage > 1) {
      currentPage--;
      refreshUI();
    }
  });
  paginationContainer.appendChild(prevLi);

  // Các nút số trang
  for (let i = 1; i <= totalPages; i++) {
    const pageLi = document.createElement("li");
    pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
    pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    pageLi.addEventListener("click", function (e) {
      e.preventDefault();
      currentPage = i;
      refreshUI();
    });
    paginationContainer.appendChild(pageLi);
  }

  // Nút Sau
  const nextLi = document.createElement("li");
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" ${currentPage === totalPages ? 'aria-disabled="true"' : ''}>Sau</a>`;
  nextLi.addEventListener("click", function (e) {
    e.preventDefault();
    if (currentPage < totalPages) {
      currentPage++;
      refreshUI();
    }
  });
  paginationContainer.appendChild(nextLi);
}

// Lấy toàn bộ khoa
function getAllDepartment(selectElement) {
  axiosJWT
    .get(`/api/departments`)
    .then(function (response) {
      dsKhoa = response.data;
      dsKhoa.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.departmentId;
        option.textContent = item.name;
        selectElement.appendChild(option);
      });
    })
    .catch(function (error) {
      notificationService.showError("Không thể tải danh sách khoa");
      console.error("Lỗi không tìm được:", error);
    });
}

// Hàm điền thông tin vào modal
function fillEditModal(bacSi) {
  // Gán dữ liệu vào các trường input của modal
  $("#edit-mabs").val(bacSi.doctorId);
  $("#edit-tenbs").val(bacSi.fullName);
  const formattedDate = bacSi.dateOfBirth
        ? new Date(bacSi.dateOfBirth).toLocaleDateString('en-CA')
        : "";
  $("#edit-ngaysinh").val(formattedDate);
  $("#edit-sdt").val(bacSi.phone);
  const bangCapValue = bacSi.degree;
  $("#edit-bangCap").val(bangCapValue);
  $("#edit-namKinhNghiem").val(bacSi.soNamKinhNghiem);
  $("#edit-diaChi").val(bacSi.address || "");
  const khoaIdValue = bacSi.departmentId;
  $("#edit-khoa").val(khoaIdValue);
  
  // Hiển thị ảnh
  const imageUrl = bacSi.image ? `http://localhost:8080${bacSi.image}` : 'http://localhost:8080/uploads/no-img.jpg';
  $("#preview-edit").attr("src", imageUrl);
}

function formatDate(dateString) {
  if (!dateString) return "Chưa có";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch (error) {
    console.error("Lỗi khi format ngày:", error);
    return "Chưa có";
  }
}

function showErrorPopup() {
  const errorPopup = document.getElementById("error-popup");
  errorPopup.style.visibility = "visible";

  // Ẩn popup sau 3 giây
  setTimeout(() => {
    hideErrorPopup();
  }, 3000);
}
function hideErrorPopup() {
  const errorPopup = document.getElementById("error-popup");
  errorPopup.style.visibility = "hidden";
}

function showSuccessPopup() {
  // Hiển thị popup
  const popup = document.getElementById("success-popup");
  popup.style.visibility = "visible"; // Hoặc có thể dùng popup.classList.add('visible');

  // Tự động ẩn popup sau 3 giây (3000ms)
  setTimeout(() => {
    closePopup();
  }, 3000);
}

function closePopup() {
  const popup = document.getElementById("success-popup");
  popup.style.visibility = "hidden"; // Ẩn popup
}
function kiemTraTen() {
  const ten = document.getElementById("add-tenbs");
  const specialCharRegex = /[^a-zA-Z0-9\s\u00C0-\u1EF9]/; // Tìm bất kỳ ký tự nào không phải là chữ cái, chữ số hoặc khoảng trắng

  if (specialCharRegex.test(ten.value)) {
    ten.style.border = "2px solid red"; // Thêm viền đỏ khi có ký tự đặc biệt
    ten.setCustomValidity("Tên không được chứa ký tự đặc biệt!");
  } else {
    ten.style.border = ""; // Xóa viền nếu không có ký tự đặc biệt
    ten.setCustomValidity("");
  }
}
function kiemTraEmail() {
  const emailInput = document.getElementById("add-email");
  // Biểu thức chính quy kiểm tra định dạng email hợp lệ
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  // Kiểm tra nếu email trống
  if (emailInput.value.trim() === "") {
    emailInput.style.border = "2px solid red"; // Viền đỏ khi trống
    emailInput.setCustomValidity("Email không được để trống");
  }
  // Kiểm tra email hợp lệ
  else if (!emailRegex.test(emailInput.value)) {
    emailInput.style.border = "2px solid red"; // Viền đỏ nếu email không hợp lệ
    emailInput.setCustomValidity("Email không hợp lệ");
  } else {
    emailInput.style.border = ""; // Xóa viền đỏ nếu email hợp lệ
    emailInput.setCustomValidity(""); // Không có lỗi
  }
}

// Function to export data to Excel
function exportToExcel() {
  try {
    const dataToExport = filteredData.length > 0 ? filteredData : dsBS;
    
    if (!dataToExport || dataToExport.length === 0) {
      notificationService.showError("Không có dữ liệu để xuất");
      return;
    }
    
    const formattedData = dataToExport.map(item => ({
      "Mã bác sĩ": item.doctorId,
      "Họ tên": item.fullName || "Chưa có",
      "Ngày sinh": formatDate(item.dateOfBirth) || "Chưa có",
      "Giới tính": item.gender || "Chưa có",
      "Bằng cấp": getBangCapText(item.degree) || "Chưa có",
      "Khoa": item.departmentId || "Chưa có",
      "Số điện thoại": item.phone || "Chưa có",
      "Địa chỉ": item.address || "Chưa có"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachBacSi");
    
    // Set column widths
    const wscols = [
      { wch: 15 }, // Mã bác sĩ
      { wch: 30 }, // Họ tên
      { wch: 15 }, // Ngày sinh
      { wch: 10 }, // Giới tính
      { wch: 25 }, // Bằng cấp
      { wch: 15 }, // Khoa
      { wch: 15 }, // Số điện thoại
      { wch: 40 }  // Địa chỉ
    ];
    worksheet['!cols'] = wscols;
    
    XLSX.writeFile(workbook, "DanhSachBacSi.xlsx");
    notificationService.showSuccess("Xuất dữ liệu thành công");
  } catch (error) {
    console.error("Lỗi khi xuất dữ liệu:", error);
    notificationService.showError("Không thể xuất dữ liệu");
  }
}
