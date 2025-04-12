var dsBS;
var bsID = "";
var dsKhoa;
var currentPage = 1;
const recordsPerPage = 4;
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
    const khoaIdValue = $("#add-khoa").val(); // Lấy ID khoa từ combobox
    const newDoctor = {
      fullName: $("#add-tenbs").val(),
      phone: $("#add-sdt").val() || null,
      degree: bangCapValue,
      address: $("#add-diaChi").val() || null,
      gender: $("#add-gioiTinh").val() || null,
      dateOfBirth: $("#add-ngaysinh").val() || null,
      departmentId: khoaIdValue || null,
    };
    console.log("Dữ liệu thêm:", newDoctor);

    // Gửi yêu cầu add tới API
    axiosJWT
      .post(`/api/doctors`, newDoctor)
      .then(function (response) {
        console.log("Thêm thành công:", response.data);
        getData(); // Tải lại dữ liệu sau khi cập nhật
        refreshUI();
      })
      .catch(function (error) {
        showErrorPopup();
        console.error("Lỗi khi thêm:", error);
      });
  });

  // Gắn sự kiện cho nút Sửa
  $("#btnEdit").click(function () {
    const bangCapValue = parseInt($("#edit-bangCap").val());
    const khoaIdValue = $("#edit-khoa").val(); // Lấy ID khoa từ combobox
    const updatedDoctor = {
      fullName: $("#edit-tenbs").val(),
      phone: $("#edit-sdt").val() || null,
      degree: bangCapValue,
      address: $("#edit-diaChi").val() || null,
      gender: $("#edit-gioiTinh").val() || null,
      dateOfBirth: $("#edit-ngaysinh").val() || null,
      departmentId: khoaIdValue || null,
    };

    console.log("Dữ liệu cập nhật:", updatedDoctor);

    // Gửi yêu cầu cập nhật tới API
    axiosJWT
      .put(`/api/doctors/${bsID}`, updatedDoctor)
      .then(function (response) {
        console.log("Cập nhật thành công:", response.data);
        getData(); // Tải lại dữ liệu sau khi cập nhật
        showSuccessPopup();
      })
      .catch(function (error) {
        showErrorPopup();
        console.error("Lỗi khi cập nhật:", error);
      });
  });

  //Mở modal xác nhận xóa
  $(document).on("click", ".m-delete", function () {
    const doctorId = $(this).closest("tr").attr("bs-id");
    bsID = doctorId;
    console.log(bsID);
    const bacSi = dsBS.find((bs) => bs.doctorId === doctorId); // Tìm bệnh nhân trong danh sách
  });

  $("#btnDelete").click(function () {
    axiosJWT
      .delete(`/api/doctors/${bsID}`)
      .then(function (response) {
        console.log("Xóa thành công:", response.data);
        getData(); // Tải lại dữ liệu sau khi cập nhật
        refreshUI();
      })
      .catch(function (error) {
        showErrorPopup();
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
      console.log("Dữ liệu bác sĩ từ API:", dsBS); // Debug log
      if (dsBS && dsBS.length > 0) {
        refreshUI();
      } else {
        console.log("Không có dữ liệu bác sĩ"); // Debug log
      }
    })
    .catch(function (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
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
    const row = `
      <tr bs-id="${item.doctorId}">
        <td style="display: none"></td>
        <td class="text-center">${startIndex + index + 1}</td>
        <td class="m-data-left">${item.fullName || "Chưa có"}</td>
        <td class="m-data-left">${formatDate(item.dateOfBirth) || "Chưa có"}</td>
        <td class="m-data-left">${item.gender || "Chưa có"}</td>
        <td class="m-data-left">${item.degree || "Chưa có"}</td>
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
      console.error("Lỗi không tìm được:", error);
    });
}

// Hàm điền thông tin vào modal
function fillEditModal(bacSi) {
  // Gán dữ liệu vào các trường input của modal
  $("#edit-mabs").val(bacSi.doctorId); // Mã bệnh nhân
  $("#edit-tenbs").val(bacSi.fullName); // Họ tên
  const formattedDate = bacSi.dateOfBirth
        ? new Date(bacSi.dateOfBirth).toLocaleDateString('en-CA') // Định dạng YYYY-MM-DD theo múi giờ cục bộ
        : "";
  $("#edit-ngaysinh").val(formattedDate);
  $("#edit-sdt").val(bacSi.phone); // Số điện thoại
  // $("#edit-email").val(bacSi.email || ""); // Email
  // Gán bằng cấp
  const bangCapValue = bacSi.degree;
  $("#edit-bangCap").val(bangCapValue);
  $("#edit-namKinhNghiem").val(bacSi.soNamKinhNghiem); // Số năm kinh nghiệm
  // Gán địa chỉ
  $("#edit-diaChi").val(bacSi.address || "");
  // $("#edit-gioLamViec").val(bacSi.gioLamViec); // Giờ làm việc
  // Gán bằng cấp
  const khoaIdValue = bacSi.departmentId;
  $("#edit-khoa").val(khoaIdValue);
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
