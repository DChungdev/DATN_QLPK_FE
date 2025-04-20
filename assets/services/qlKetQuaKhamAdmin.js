var dsKetQua = [];
var currentPage = 1;
const recordsPerPage = 10;
var filteredData = [];
var resultId = "";

$(document).ready(function () {
  // Lấy dữ liệu kết quả khám
  getData();

  // Sự kiện khi nhấn nút làm mới
  $("#refresh-data").click(function () {
    getData();
  });

  // Sự kiện khi nhấn nút xuất dữ liệu
  $("#exportButton").click(function () {
    exportToExcel();
  });

  // Sự kiện khi nhấn nút lọc theo ngày
  $("#btnFilter").click(function () {
    filterByDate();
  });

  // Sự kiện khi nhập vào ô tìm kiếm
  $(".m-input-search").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    if (value === "") {
      filteredData = [];
      refreshUI();
      return;
    }

    filteredData = dsKetQua.filter(function (item) {
      return (
        (item.diagnosis && item.diagnosis.toLowerCase().includes(value)) ||
        (item.symptoms && item.symptoms.toLowerCase().includes(value)) ||
        (item.patientName && item.patientName.toLowerCase().includes(value)) ||
        (item.doctorName && item.doctorName.toLowerCase().includes(value)) ||
        (item.appointmentId && item.appointmentId.toString().includes(value))
      );
    });

    refreshUI();
  });

  // Sự kiện khi nhấn vào nút xem chi tiết
  $(document).on("click", ".btn-view", function () {
    const resultId = $(this).closest("tr").attr("result-id");
    const result = dsKetQua.find((kq) => kq.id == resultId);
    if (result) {
      fillViewModal(result);
    }
  });

  // Sự kiện khi nhấn vào nút sửa
  $(document).on("click", ".btn-edit", function () {
    const resultId = $(this).closest("tr").attr("result-id");
    const result = dsKetQua.find((kq) => kq.id == resultId);
    if (result) {
      fillEditModal(result);
    }
  });

  // Sự kiện khi nhấn vào nút xóa
  $(document).on("click", ".btn-delete", function () {
    resultId = $(this).closest("tr").attr("result-id");
  });

  // Sự kiện khi nhấn nút xác nhận xóa
  $("#btnDelete").click(function () {
    deleteResult();
  });

  // Sự kiện khi nhấn nút lưu chỉnh sửa
  $("#btnSaveEdit").click(function () {
    saveEditResult();
  });
});

// Lấy dữ liệu kết quả khám từ API
function getData() {
  axiosJWT
    .get(`/api/medical-results`)
    .then(function (response) {
      dsKetQua = response.data;
      console.log("Dữ liệu kết quả khám từ API:", dsKetQua);
      if (dsKetQua && dsKetQua.length > 0) {
        refreshUI();
      } else {
        console.log("Không có dữ liệu kết quả khám");
      }
    })
    .catch(function (error) {
      console.error("Lỗi khi lấy dữ liệu:", error);
      showErrorPopup("Lỗi khi lấy dữ liệu kết quả khám");
    });
}

// Hiển thị dữ liệu và cập nhật phân trang
function refreshUI() {
  displayData(currentPage);
  updatePagination();
}

// Hiển thị dữ liệu trên bảng
function displayData(page) {
  const tableBody = document.querySelector("#tblKetQuaKham tbody");
  
  if (!tableBody) {
    console.error("Không tìm thấy phần tử tbody");
    return;
  }

  tableBody.innerHTML = "";

  const dataToDisplay = filteredData.length > 0 ? filteredData : dsKetQua;

  if (!dataToDisplay || dataToDisplay.length === 0) {
    console.log("Không có dữ liệu để hiển thị");
    tableBody.innerHTML = `<tr><td colspan="11" class="text-center">Không có dữ liệu kết quả khám</td></tr>`;
    return;
  }

  const startIndex = (page - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = dataToDisplay.slice(startIndex, endIndex);

  paginatedData.forEach((item, index) => {
    const symptomsSummary = truncateText(item.symptoms, 30);
    const diagnosisSummary = truncateText(item.diagnosis, 30);
    const notesSummary = truncateText(item.notes, 30);
    const treatmentPlanSummary = truncateText(item.treatmentPlan, 30);
    
    const row = `
      <tr result-id="${item.id}">
        <td class="text-center">${startIndex + index + 1}</td>
        <td>${item.id}</td>
        <td>${item.appointment}</td>
        <td>${item.patientName || "Không có thông tin"}</td>
        <td>${item.doctorName || "Không có thông tin"}</td>
        <td>${formatDateTime(item.appointmentDate) || "Không có thông tin"}</td>
        <td>${symptomsSummary}</td>
        <td>${diagnosisSummary}</td>
        <td>${notesSummary}</td>
        <td>${treatmentPlanSummary}</td>
        <td>
          <div class="m-table-tool">
            <div class="btn-view m-tool-icon" data-bs-toggle="modal" data-bs-target="#modalChiTietKetQua" title="Xem chi tiết">
              <i class="fas fa-eye text-info"></i>
            </div>
            <div class="btn-edit m-tool-icon" data-bs-toggle="modal" data-bs-target="#modalSuaKetQua" title="Sửa">
              <i class="fas fa-edit text-primary"></i>
            </div>
            <div class="btn-delete m-tool-icon" data-bs-toggle="modal" data-bs-target="#confirm-delete" title="Xóa">
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

// Cắt ngắn văn bản nếu quá dài
function truncateText(text, maxLength) {
  if (!text) return "Không có thông tin";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// Cập nhật phân trang
function updatePagination() {
  let paginationContainer = document.querySelector(".pagination");
  
  if (!paginationContainer) {
    console.error("Không tìm thấy phần tử .pagination");
    return;
  }

  paginationContainer.innerHTML = "";

  const dataToDisplay = filteredData.length > 0 ? filteredData : dsKetQua;

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

// Định dạng ngày giờ
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

// Điền thông tin kết quả khám vào modal xem chi tiết
function fillViewModal(result) {
  // Lấy thông tin chi tiết từ API nếu cần
  axiosJWT.get(`/api/medical-results/${result.id}`)
    .then(function(response) {
      const detailResult = response.data;
      
      // Thông tin bệnh nhân
      $("#detail-patientId").text(detailResult.patientId || "Không có thông tin");
      $("#detail-patientName").text(detailResult.patientName || "Không có thông tin");
      $("#detail-patientDob").text(formatDate(detailResult.patientDob) || "Không có thông tin");
      $("#detail-patientGender").text(detailResult.patientGender || "Không có thông tin");
      
      // Thông tin lịch khám
      $("#detail-appointmentId").text(detailResult.appointment || "Không có thông tin");
      $("#detail-doctorName").text(detailResult.doctorName || "Không có thông tin");
      $("#detail-appointmentDate").text(formatDateTime(detailResult.appointmentDate) || "Không có thông tin");
      $("#detail-services").text(detailResult.services || "Không có thông tin");
      
      // Thông tin kết quả khám
      $("#detail-symptoms").text(detailResult.symptoms || "Không có thông tin");
      $("#detail-diagnosis").text(detailResult.diagnosis || "Không có thông tin");
      $("#detail-notes").text(detailResult.notes || "Không có thông tin");
      $("#detail-treatmentPlan").text(detailResult.treatmentPlan || "Không có thông tin");
    })
    .catch(function(error) {
      console.error("Lỗi khi lấy thông tin chi tiết kết quả khám:", error);
      showErrorPopup("Không thể lấy thông tin chi tiết kết quả khám");
    });
}

// Định dạng ngày tháng
function formatDate(dateString) {
  if (!dateString) return "Chưa có";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  } catch (error) {
    console.error("Lỗi khi format ngày tháng:", error);
    return "Chưa có";
  }
}

// Điền thông tin kết quả khám vào modal sửa
function fillEditModal(result) {
  $("#edit-resultId").val(result.id);
  $("#edit-symptoms").val(result.symptoms || "");
  $("#edit-diagnosis").val(result.diagnosis || "");
  $("#edit-notes").val(result.notes || "");
  $("#edit-treatmentPlan").val(result.treatmentPlan || "");
}

// Lưu kết quả khám đã chỉnh sửa
function saveEditResult() {
  const updatedResult = {
    id: $("#edit-resultId").val(),
    symptoms: $("#edit-symptoms").val(),
    diagnosis: $("#edit-diagnosis").val(),
    notes: $("#edit-notes").val(),
    treatmentPlan: $("#edit-treatmentPlan").val()
  };

  axiosJWT
    .put(`/api/medical-results/${updatedResult.id}`, updatedResult)
    .then(function (response) {
      console.log("Cập nhật thành công:", response.data);
      $("#modalSuaKetQua").modal("hide");
      showSuccessPopup("Cập nhật kết quả khám thành công");
      getData(); // Tải lại dữ liệu
    })
    .catch(function (error) {
      console.error("Lỗi khi cập nhật:", error);
      showErrorPopup("Không thể cập nhật kết quả khám");
    });
}

// Xóa kết quả khám
function deleteResult() {
  axiosJWT
    .delete(`/api/medical-results/${resultId}`)
    .then(function (response) {
      console.log("Xóa thành công:", response.data);
      showSuccessPopup("Xóa kết quả khám thành công");
      getData(); // Tải lại dữ liệu
    })
    .catch(function (error) {
      console.error("Lỗi khi xóa:", error);
      showErrorPopup("Không thể xóa kết quả khám");
    });
}

// Lọc theo ngày
function filterByDate() {
  const startDate = $("#startDate").val();
  const endDate = $("#endDate").val();
  
  if (!startDate && !endDate) {
    filteredData = [];
    refreshUI();
    return;
  }
  
  filteredData = dsKetQua.filter(function(item) {
    if (!item.appointmentDate) return false;
    
    const itemDate = new Date(item.appointmentDate);
    const formattedItemDate = itemDate.toISOString().split('T')[0];
    
    if (startDate && endDate) {
      return formattedItemDate >= startDate && formattedItemDate <= endDate;
    } else if (startDate) {
      return formattedItemDate >= startDate;
    } else if (endDate) {
      return formattedItemDate <= endDate;
    }
    
    return true;
  });
  
  refreshUI();
}

// Xuất dữ liệu ra Excel
function exportToExcel() {
  try {
    const dataToExport = filteredData.length > 0 ? filteredData : dsKetQua;
    
    if (!dataToExport || dataToExport.length === 0) {
      showErrorPopup("Không có dữ liệu để xuất");
      return;
    }
    
    const formattedData = dataToExport.map(item => ({
      "Mã kết quả": item.id,
      "Mã lịch khám": item.appointment,
      "Bệnh nhân": item.patientName || "Không có thông tin",
      "Bác sĩ": item.doctorName || "Không có thông tin",
      "Ngày khám": formatDateTime(item.appointmentDate) || "Không có thông tin",
      "Triệu chứng": item.symptoms || "Không có thông tin",
      "Chẩn đoán": item.diagnosis || "Không có thông tin",
      "Ghi chú": item.notes || "Không có thông tin",
      "Kế hoạch điều trị": item.treatmentPlan || "Không có thông tin"
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KetQuaKham");
    
    // Đặt độ rộng cột
    const wscols = [
      { wch: 10 }, // Mã kết quả
      { wch: 12 }, // Mã lịch khám
      { wch: 25 }, // Bệnh nhân
      { wch: 25 }, // Bác sĩ
      { wch: 20 }, // Ngày khám
      { wch: 40 }, // Triệu chứng
      { wch: 40 }, // Chẩn đoán
      { wch: 40 }, // Ghi chú
      { wch: 40 }  // Kế hoạch điều trị
    ];
    worksheet['!cols'] = wscols;
    
    XLSX.writeFile(workbook, "KetQuaKham.xlsx");
    showSuccessPopup("Xuất dữ liệu thành công");
  } catch (error) {
    console.error("Lỗi khi xuất dữ liệu:", error);
    showErrorPopup("Không thể xuất dữ liệu");
  }
}

// Hiển thị popup thông báo lỗi
function showErrorPopup(message = "Có lỗi xảy ra. Vui lòng thử lại!") {
  const popup = $("#error-popup");
  popup.find(".m-popup-text-error").html(`<span>${message}</span>`);
  popup.css("visibility", "visible");
  setTimeout(() => {
    popup.css("visibility", "hidden");
  }, 3000);
}

// Hiển thị popup thông báo thành công
function showSuccessPopup(message = "Thành công!") {
  const popup = $("#success-popup");
  popup.find(".m-popup-text-success").html(`<span>${message}</span>`);
  popup.css("visibility", "visible");
  setTimeout(() => {
    popup.css("visibility", "hidden");
  }, 3000);
}
