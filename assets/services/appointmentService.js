var dsLK;
var dsBacSi;
var dsDichVu;
var lkId = "";
var bnId = "";
var currentPage = 1;
const recordsPerPage = 10;
var filteredData = [];
var appointmentId = "";

$(document).ready(function () {
  //Lấy tất cả dữ liệu
  getData();
  //Lấy danh sách phòng ban, bác sĩ điền vào select trong modal edit
  const departmentSelectEdit = document.querySelector(
    "#dialog-appointment-edit #department"
  );
  const doctorSelectEdit = document.querySelector(
    "#dialog-appointment-edit #doctor"
  );
  const appointmentTimeSelectEdit = document.querySelector(
    "#dialog-appointment-edit #appointmentTime"
  );

  const serviceSelectEdit = document.querySelector(
    "#dialog-appointment-edit #service"
  );
  console.log(serviceSelectEdit);

  //Hiển thị tất cả các dịch vụ
  getAllService(serviceSelectEdit);

  getAllDoctor(doctorSelectEdit, appointmentTimeSelectEdit);

  getAllDepartment(departmentSelectEdit);

  // Gắn sự kiện cho nút hiển thị modal sửa
  $(document).on("click", ".m-edit", function () {
    console.log("có chạy")
    const rowId = $(this).closest("tr").attr("lk-id");
    console.log("ID lịch khám:", rowId);
    const appointment = dsLK.find((lk) => lk.appointmentId == rowId);
    if (appointment) {
      fillEditModal(appointment);
      // Gọi hàm addEventSelect để tạo khung giờ
      addEventSelect(doctorSelectEdit, dsBacSi, appointmentTimeSelectEdit);
    } else {
      console.error("Không tìm thấy thông tin lịch khám!");
    }
  });

  //Xử lý sự kiện khi nhấn nút sửa
  $("#btnEdit").click(function () {
    editAppointment();
  });

  //Mở modal xác nhận xóa
  $(document).on("click", ".m-delete", function () {
    const appointmentId = $(this).closest("tr").attr("lk-id");
    appointmentId = appointmentId;
    console.log(appointmentId);
    const appointment = dsLK.find((lk) => lk.appointmentId === appointmentId); // Tìm lịch khám trong danh sách
  });

  //Xử lý sự kiện khi nhấn nút xóa
  $("#btnDelete").click(function () {
    deleteAppointment();
  });

  //Xử lý sự kiện khi nhấn nút Refresh
  $(".m-toolbar-refresh").click(function () {
    getData();
    refreshUI();
  });
  //Xử lý sự kiện khi nhấn nút Export
  $(".m-toolbar-export").click(function () {
    exportToExcel();
  });

  // Sự kiện khi nhập vào ô tìm kiếm
  $(".m-input-search").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    if (value === "") {
      filteredData = [];
      refreshUI();
      return;
    }

    filteredData = dsLK.filter(function (item) {
      return (
        (item.reason && item.reason.toLowerCase().includes(value)) ||
        (item.patientId && item.patientId.toString().includes(value)) ||
        (item.doctorId && item.doctorId.toString().includes(value)) ||
        (item.appointmentDate && item.appointmentDate.includes(value)) 
      );
    });

    refreshUI();
  });
});

function getData() {
  axiosJWT
    .get(`/api/appointments`)
    .then(function (response) {
      dsLK = response.data;
      console.log("Dữ liệu lịch khám từ API:", dsLK);
      if (dsLK && dsLK.length > 0) {
        refreshUI();
      } else {
        console.log("Không có dữ liệu lịch khám");
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

function displayData(page) {
  const tableBody = document.querySelector("#tblAppointment tbody");
  
  if (!tableBody) {
    console.error("Không tìm thấy phần tử tbody");
    return;
  }

  tableBody.innerHTML = "";

  const dataToDisplay = filteredData.length > 0 ? filteredData : dsLK;

  if (!dataToDisplay || dataToDisplay.length === 0) {
    console.log("Không có dữ liệu để hiển thị");
    return;
  }

  const startIndex = (page - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = dataToDisplay.slice(startIndex, endIndex);

  paginatedData.forEach((item, index) => {
    const row = `
      <tr lk-id="${item.appointmentId}">
        <td class="text-center">${startIndex + index + 1}</td>
        <td>${item.patientId}</td>
        <td>${item.doctorId}</td>
        <td>${formatDateTime(item.appointmentDate)}</td>
        <td>${item.reason || "Chưa có"}</td>
        <td>${formatCurrency(item.baseFee)}</td>
        <td>${formatCurrency(item.totalFee)}</td>
        <td>${getStatusBadge(item.status)}</td>
        <td>${formatServices(item.serviceIds)}</td>
        <td>
          <div class="m-table-tool">
            <div class="m-edit m-tool-icon" data-bs-toggle="modal" data-bs-target="#dialog-appointment-edit">
              <i class="fas fa-edit text-primary"></i>
            </div>
            <div class="m-delete m-tool-icon" data-bs-toggle="modal" data-bs-target="#dialog-confirm-delete">
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

function updatePagination() {
  let paginationContainer = document.querySelector(".pagination");
  
  if (!paginationContainer) {
    const container = document.createElement("div");
    container.className = "pagination-container";
    container.innerHTML = '<ul class="pagination"></ul>';
    document.querySelector(".data-table").after(container);
    paginationContainer = container.querySelector(".pagination");
  }

  paginationContainer.innerHTML = "";

  const dataToDisplay = filteredData.length > 0 ? filteredData : dsLK;

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

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return "Chưa có";
  try {
    const date = new Date(dateTimeString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (error) {
    console.error("Lỗi khi format ngày giờ:", error);
    return "Chưa có";
  }
}

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "0 VNĐ";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function getStatusBadge(status) {
  let badgeClass = "";
  let statusText = "";

  switch (status) {
    case "confirmed":
      badgeClass = "bg-primary";
      statusText = "Đã xác nhận";
      break;
    case "pending":
      badgeClass = "bg-warning";
      statusText = "Chờ xử lý";
      break;
    case "completed":
      badgeClass = "bg-success";
      statusText = "Hoàn thành";
      break;
    case "cancelled":
      badgeClass = "bg-danger";
      statusText = "Đã hủy";
      break;
    default:
      badgeClass = "bg-secondary";
      statusText = "Không xác định";
  }

  return `<span class="badge rounded-pill ${badgeClass}">${statusText}</span>`;
}

function formatServices(serviceIds) {
  if (!serviceIds || serviceIds.length === 0) return "Chưa có dịch vụ";
  return serviceIds.join(", ");
}

function fillEditModal(appointment) {
  // Lấy thông tin bệnh nhân
  axiosJWT.get(`/api/patients/${appointment.patientId}`)
    .then(function(response) {
      const patient = response.data;
      console.log(patient)
      $("#dialog-appointment-edit #name").val(patient.fullName || "");
      $("#dialog-appointment-edit #phone-number").val(patient.phone || "");
      $("#dialog-appointment-edit #gender").val(patient.gender || "");
      $("#dialog-appointment-edit #dOBirth").val(patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : "");
      $("#dialog-appointment-edit #address").val(patient.address || "");
    })
    .catch(function(error) {
      console.error("Lỗi khi lấy thông tin bệnh nhân:", error);
    });

  // Lấy thông tin bác sĩ
  axiosJWT.get(`/api/doctors/${appointment.doctorId}`)
    .then(function(response) {
      const doctor = response.data;
      console.log(doctor);
      
      // Đầu tiên set khoa
      $("#dialog-appointment-edit #department").val(doctor.departmentId);
      
      // Sau đó lấy danh sách bác sĩ theo khoa
      getDoctorsByDepartment(doctor.departmentId, document.querySelector("#dialog-appointment-edit #doctor"))
        .then(() => {
          // Khi đã có danh sách bác sĩ, chọn bác sĩ theo doctorId
          $("#dialog-appointment-edit #doctor").val(doctor.doctorId);
          
          // Tạo các option cho ca khám và chọn ca khám tương ứng
          const appointmentTimeSelect = document.querySelector("#dialog-appointment-edit #appointmentTime");
          addEventSelect(document.querySelector("#dialog-appointment-edit #doctor"), dsBacSi, appointmentTimeSelect);
          
          // Lấy giờ từ appointmentDate và set vào appointmentTime
          const appointmentDate = new Date(appointment.appointmentDate);
          const hours = appointmentDate.getHours().toString().padStart(2, '0');
          const minutes = appointmentDate.getMinutes().toString().padStart(2, '0');
          const timeString = `${hours}:${minutes}`;
          $("#dialog-appointment-edit #appointmentTime").val(timeString);
        });
    })
    .catch(function(error) {
      console.error("Lỗi khi lấy thông tin bác sĩ:", error);
    });

  // Hiển thị thông tin lịch khám
  const appointmentDate = new Date(appointment.appointmentDate);
  $("#dialog-appointment-edit #appointmentDate").val(appointmentDate.toISOString().split('T')[0]);

  // Hiển thị dịch vụ (nhiều lựa chọn)
  if (appointment.serviceIds && appointment.serviceIds.length > 0) {
    $("#dialog-appointment-edit #service").val(appointment.serviceIds);
  }

  // Hiển thị lý do khám
  $("#dialog-appointment-edit #reason").val(appointment.reason || "");

  // Lưu appointmentId để sử dụng khi cập nhật
  appointmentId = appointment.appointmentId;
}

function editAppointment() {
  // Lấy ngày và giờ từ form
  const selectedDate = $("#dialog-appointment-edit #appointmentDate").val();
  const selectedTime = $("#dialog-appointment-edit #appointmentTime").val();
  
  // Kết hợp ngày và giờ thành một chuỗi datetime
  const appointmentDateTime = `${selectedDate}T${selectedTime}:00`;

  const appointment = {
    appointmentId: appointmentId,
    doctorId: $("#dialog-appointment-edit #doctor").val(),
    appointmentDate: appointmentDateTime,
    reason: $("#dialog-appointment-edit #reason").val(),
    serviceIds: Array.from($("#dialog-appointment-edit #service").val() || []).map(id => parseInt(id))
  };

  console.log(appointment);
  axiosJWT
    .put(`/api/appointments/${appointmentId}`, appointment)
    .then(function (response) {
      console.log("Cập nhật thành công:", response.data);
      showPopup("success", "Thành công! Lịch khám đã được cập nhật.");
      $("#dialog-appointment-edit").modal("hide");
      getData();
    })
    .catch(function (error) {
      console.error("Lỗi khi cập nhật:", error);
      showPopup("error", "Lỗi! Không thể cập nhật lịch khám.");
    });
}

function deleteAppointment() {
  axiosJWT
    .delete(`/api/appointments/${appointmentId}`)
    .then(function (response) {
      console.log("Xóa thành công:", response.data);
      showPopup("success", "Thành công! Lịch khám đã được xóa.");
      $("#dialog-confirm-delete").modal("hide");
      getData();
    })
    .catch(function (error) {
      console.error("Lỗi khi xóa:", error);
      showPopup("error", "Lỗi! Không thể xóa lịch khám.");
    });
}

function showPopup(type, message) {
  const popupItem = $(`.m-popup-item.m-popup-${type}`);
  popupItem.find(".m-popup-text").empty();
  const [title, detail] = message.split("! ");
  popupItem.find(".m-popup-text").append(`<span>${title}! </span>`).append(detail);
  popupItem.addClass("show");
  setTimeout(() => {
    popupItem.removeClass("show");
  }, 3000);
  popupItem.find(".m-popup-close").on("click", function () {
    popupItem.removeClass("show");
  });
}

async function exportToExcel() {
  try {
    const formattedData = dsLK.map(item => ({
      "Mã bệnh nhân": item.patientId,
      "Mã bác sĩ": item.doctorId,
      "Ngày khám": formatDateTime(item.appointmentDate),
      "Lý do khám": item.reason,
      "Phí cơ bản": formatCurrency(item.baseFee),
      "Tổng phí": formatCurrency(item.totalFee),
      "Trạng thái": getStatusText(item.status),
      "Dịch vụ": formatServices(item.serviceIds)
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LichKham");
    XLSX.writeFile(workbook, "LichKham.xlsx");
  } catch (error) {
    console.error("Lỗi khi xuất dữ liệu:", error);
    showPopup("error", "Không thể xuất dữ liệu!");
  }
}

function getStatusText(status) {
  switch (status) {
    case "confirmed": return "Đã xác nhận";
    case "pending": return "Chờ xử lý";
    case "completed": return "Hoàn thành";
    case "cancelled": return "Đã hủy";
    default: return "Không xác định";
  }
}

// Lấy toàn bộ khoa
function getAllDepartment(selectElement) {
  axiosJWT
    .get(`/api/departments`)
    .then(function (response) {
      dsKhoa = response.data;
      selectElement.innerHTML = '<option value="">Chọn khoa</option>';
      dsKhoa.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.departmentId;
        option.textContent = item.name;
        selectElement.appendChild(option);
      });

      // Thêm sự kiện khi chọn khoa
      selectElement.addEventListener("change", function() {
        const departmentId = this.value;
        const doctorSelect = document.querySelector("#dialog-appointment-edit #doctor");
        if (departmentId) {
          getDoctorsByDepartment(departmentId, doctorSelect);
        } else {
          doctorSelect.innerHTML = '<option value="">Chọn bác sĩ</option>';
        }
      });
    })
    .catch(function (error) {
      console.error("Lỗi khi lấy danh sách khoa:", error);
    });
}

// Lấy bác sĩ theo khoa
function getDoctorsByDepartment(departmentId, selectElement) {
  return new Promise((resolve, reject) => {
      axiosJWT
      .get(`/api/doctors/findbyDepartmentId/${departmentId}`)
        .then(function (response) {
        const doctors = response.data;
        selectElement.innerHTML = '<option value="">Chọn bác sĩ</option>';
        doctors.forEach((doctor) => {
            const option = document.createElement("option");
          option.value = doctor.doctorId;
          option.textContent = doctor.fullName;
          selectElement.appendChild(option);
        });
        resolve();
        })
        .catch(function (error) {
        console.error("Lỗi khi lấy danh sách bác sĩ:", error);
        reject(error);
        });
  });
}

// Lấy toàn bộ Bác sĩ (chỉ dùng khi mở modal lần đầu)
function getAllDoctor(selectElement, appointmentTimeSelect) {
  // Reset select
  selectElement.innerHTML = '<option value="">Chọn bác sĩ</option>';
  
  // Thêm sự kiện khi chọn bác sĩ
      selectElement.addEventListener("change", () => {
        addEventSelect(selectElement, dsBacSi, appointmentTimeSelect);
    });
}

// Lấy toàn bộ dịch vụ
function getAllService(serviceSelectEdit) {
  axiosJWT
    .get(`/api/services`)
    .then(function (response) {
      dsDichVu = response.data;
      console.log("Danh sách dịch vụ:", dsDichVu);
      
      // Xóa các option cũ
      serviceSelectEdit.innerHTML = '<option value="">Chọn dịch vụ</option>';
      
      // Thêm các option mới
      dsDichVu.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = `${item.name} - ${formatCurrency(item.price)}`;
        serviceSelectEdit.appendChild(option);
      });
    })
    .catch(function (error) {
      console.error("Lỗi khi lấy danh sách dịch vụ:", error);
    });
}

function addEventSelect(selectElement, dsBacSi, appointmentTimeSelect) {
  appointmentTimeSelect.innerHTML = '<option value="">Chọn ca khám</option>'; // Reset giờ khám

  // Tạo các lựa chọn từ 7:00 đến 17:30, cách nhau 15 phút
  const startTime = 7 * 60; // 7:00 in minutes
  const endTime = 17 * 60 + 30; // 17:30 in minutes
  const interval = 15; // 15 minutes interval

  for (let time = startTime; time <= endTime; time += interval) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
        const timeOption = document.createElement("option");
    timeOption.value = timeString;
    timeOption.textContent = timeString;
        appointmentTimeSelect.appendChild(timeOption);
  }
}

//Lấy thông tin bệnh nhân theo id
async function getNameById(controller, id) {
  try {
    const response = await axiosJWT.get(`/api/${controller}/${id}`);
    const object = response.data;
    return object.hoTen; // Trả về họ tên
  } catch (error) {
    console.error("Lỗi không tìm được bệnh nhân: ", error);
    return null; // Trả về null nếu có lỗi
  }
}
