var userId = localStorage.getItem("userId");
var lkId = "";
var kq;
$(document).ready(function () {
  console.log(userId);

  // Lắng nghe sự kiện click trên các nút .optionButton
  $(document).on("click", ".optionButton", function () {
    // Tìm phần tử cha gần nhất có lớp .custom-card
    const parentCard = $(this).closest(".custom-card");

    // Lấy giá trị lkId từ thuộc tính của phần tử cha
    lkId = parentCard.attr("lkId");
    console.log(lkId);
  });

  //Xử lý khi nhấn nút đồng ý hủy
  $("#btnCancel").click(function () {
    //Lấy lý do
    const reason = $("#modal-confirm-cancel #reason").val();
    // Kiểm tra nếu lý do trống
    if (!reason.trim()) {
      // Thêm class m-input-error vào ô input lý do
      $("#modal-confirm-cancel #reason").addClass("input-error");
      // Thêm thông báo title cho người dùng
      $("#modal-confirm-cancel #reason").attr(
        "title",
        "Lý do từ chối không được để trống!"
      );
      // Focus vào ô input
      $("#modal-confirm-cancel #reason").focus();
    } else {
      // Xóa thông báo lỗi nếu lý do không trống
      $("#modal-confirm-cancel #reason").removeClass("m-input-error");
      $("#modal-confirm-cancel #reason").removeAttr("title");
      // Gọi API Hủy lịch khám
      cancelAppointment(reason);
    }
  });
  //Xử lý khi nhấn nút đồng ý xóa
  $("#btnDelete").click(function () {
    console.log(lkId);
    //Gọi API Hủy lịch khám
    deleteAppointment();
  });
  //Xử lý khi nhấn nút đồng ý xóa
  $("#btnComplete").click(function () {
    console.log(lkId);
    //Gọi API Hủy lịch khám
    completeAppointment();
  });

  //Xử lý khi nhấn option xem
  $(document).on("click", "#optionViewResult", function () {
    getResultAppointment();
  });
  //Xử lý khi nhấn option xem
  $(document).on("click", "#completeAppointment", function () {
    completeAppointment();
  });
});

//Hoàn thành lịch khám
function completeAppointment() {
  axiosJWT
    .put(`/api/v1/Appointments/appointment/${lkId}`)
    .then(function (response) {
      console.log("Hoàn thành lịch khám thành công:", response.data);
      getAvata();
      showPopup("success", "Thành công! Lịch khám đã được hoàn thành.");
      $("#modal-confirm-complete #btnComplete")
        .prop("disabled", false)
        .text("Có");
    })
    .catch(function (error) {
      getAvata();
      showPopup("error", "Lỗi! Không thể hoàn thành lịch khám.");
      $("#modal-confirm-complete #btnComplete")
        .prop("disabled", false)
        .text("Có");
      console.error("Lỗi khi hủy lịch khám: ", error);
    });
}

//Lấy kết quả khám theo LichKhamId
async function getResultAppointment() {
  try {
    const response = await axiosJWT.get(`/api/Results/ketqua/${lkId}`);
    kq = response.data;
    fillViewModal();
  } catch (error) {
    console.error("Lỗi không tìm được kết quả khám: ", error);
  }
}

//Điền thông tin vào modal xem
function fillViewModal() {
  if (kq === null) {
    showPopup("error", "Lỗi! Không có kết quả khám!");
  } else {
    $("#diagnose").val(kq.chanDoan);
    $("#prescription").val(kq.chiDinhThuoc);
    $("#note").val(kq.ghiChu);
  }
}

//Xử lý khi nhấn đồng ý xóa lịch khám
function deleteAppointment() {
  // Hiển thị trạng thái đang xử lý
  $("#modal-confirm-cancel #btnDelete")
    .prop("disabled", true)
    .text("Đang xóa...");
  axiosJWT
    .delete(`/api/v1/Appointments/${lkId}`)
    .then(function (response) {
      console.log("Xóa lịch khám thành công:", response.data);
      getAvata();
      showPopup("success", "Thành công! Lịch khám đã được xóa.");
      $("#modal-confirm-cancel #btnDelete").prop("disabled", false).text("Xóa");
    })
    .catch(function (error) {
      showPopup("error", "Lỗi! Không thể xóa lịch khám.");
      $("#modal-confirm-cancel #btnDelete").prop("disabled", false).text("Xóa");
      getAvata();
      console.error("Lỗi khi xóa lịch khám: ", error);
    });
}
//Xử lý khi nhấn đồng ý hủy lịch khám
function cancelAppointment(reason) {
  // Hiển thị trạng thái đang xử lý
  $("#modal-confirm-cancel #btnCancel")
    .prop("disabled", true)
    .text("Đang xử lý...");
  axiosJWT
    .put(
      `/api/v1/Appointments/cancel/${lkId}`,
      JSON.stringify("Bệnh nhân: " + reason),
      {
        headers: {
          "Content-Type": "application/json", // Đảm bảo header là application/json
        },
      }
    )
    .then(function (response) {
      console.log("Hủy lịch khám thành công:", response.data);
      $("#modal-confirm-cancel").modal("hide");
      getAvata();
      showPopup("success", "Thành công! Lịch khám đã được hủy.");
      $("#modal-confirm-cancel #btnCancel").prop("disabled", false).text("Có");
    })
    .catch(function (error) {
      $("#modal-confirm-cancel").modal("hide");
      getAvata();
      showPopup("error", "Lỗi! Không thể hủy lịch khám.");
      $("#modal-confirm-cancel #btnCancel").prop("disabled", false).text("Có");
      console.error("Lỗi khi hủy lịch khám: ", error);
    });
}
//Hàm hiển thị popup thông báo
function showPopup(type, message) {
  const popupItem = $(`.m-popup-item.m-popup-${type}`);

  // Xóa nội dung trước đó
  popupItem.find(".m-popup-text").empty();

  // Cập nhật nội dung thông báo
  const [title, detail] = message.split("! ");
  popupItem
    .find(".m-popup-text")
    .append(`<span>${title}! </span>`)
    .append(detail);

  // Hiển thị popup block
  popupItem.addClass("show");

  // Ẩn popup sau 3 giây
  setTimeout(() => {
    popupItem.removeClass("show");
  }, 3000);

  // Đảm bảo tắt popup nếu người dùng đóng
  popupItem.find(".m-popup-close").on("click", function () {
    // Đóng popup
    popupItem.removeClass("show");
  });
}
//Lấy avartar
function getAvata() {
  axiosJWT
    .get(`/api/Patients/getbyuserid/${userId}`)
    .then(function (response) {
      const bn = response.data;
      console.log(bn);
      if (bn.hinhAnh != null) {
        $("#avatar").attr("src", "http://localhost:37649" + bn.hinhAnh);
      }
      //Lấy ra danh sách lịch khám theo benhNhanId
      getAllAppointmentByBenhNhanId(bn.benhNhanId);
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}
//Lấy danh sách lịch khám
function getAllAppointmentByBenhNhanId(benhNhanId) {
  console.log(benhNhanId);
  axiosJWT
    .get(`/api/v1/Appointments/patient/${benhNhanId}`)
    .then(function (response) {
      const dsLK = response.data;
      display1(dsLK);
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}
// Hàm để chuyển trạng thái thành lớp CSS
function getBadgeClass(trangThai) {
  switch (trangThai) {
    case "Đã đặt":
      return "badge-booked";
    case "Đang xử lý":
      return "bg-primary";
    case "Đã hủy":
      return "bg-danger";
    default:
      return "bg-success";
  }
}

//Lấy tên bác sĩ theo id
async function getNameById(id) {
  try {
    const response = await axiosJWT.get(`/api/Doctors/${id}`);
    const object = response.data;
    return object.hoTen; // Trả về họ tên
  } catch (error) {
    console.error("Lỗi không tìm được bác sĩ: ", error);
    return null; // Trả về null nếu có lỗi
  }
}

//Hiển thị lịch khám theo benhNhanId
async function display1(dsLK) {
  console.log(dsLK);
  // Hiển thị dữ liệu
  const container = $("#container_lk .row");
  container.empty(); // Xóa nội dung cũ

  // Tạo danh sách các Promise để lấy tên bác sĩ
  const doctorNamesPromises = dsLK.map((item) => getNameById(item.bacSiId));
  const doctorNames = await Promise.all(doctorNamesPromises); // Chờ tất cả Promise hoàn thành

  const response = await axiosJWT.get(`/api/Services`);
  const dsDichVu = response.data;
  console.log(dsDichVu);
  // Kiểm tra dsDichVu có tồn tại và là một mảng không
  if (!Array.isArray(dsDichVu)) {
    console.error("dsDichVu không phải là mảng hợp lệ.");
  }
  dsLK.forEach((lichKham, index) => {
    // Lấy tên bệnh nhân từ mảng đã xử lý
    const doctorName = doctorNames[index];
    // // Định dạng hiển thị dd/MM/yyyy
    const dateString = lichKham.ngayKham;
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-GB"); // 'en-GB' chuẩn Anh (ngày/tháng/năm)
    // Xử lý trạng thái lịch khám
    const status = lichKham.trangThaiLichKham;

    const completeDisabled = status === "Hoàn thành" ? "" : "disabled";
    let readDisabled = status === "Hoàn thành" ? "" : "disabled";
    readDisabled = status === "Đã hoàn thành" ? "" : "disabled";
    const editDisabled =
      status === "Đang xử lý" || status === "Đã đặt" ? "" : "disabled";

    const readReason = status === "Đã hủy" ? "" : "d-none";
    const readService = status !== "Đã hủy" ? "" : "d-none";

    //Hiển thị dịch vụ
    // Tìm dịch vụ tương ứng với lichKham.dichVuId trong dsDichVu
    const service = dsDichVu.find(
      (dichVu) => dichVu.dichVuId === lichKham.dichVuId
    );
    const serviceName = service ? service.tenDichVu : "Chưa xác định";
    const col = `
          <div class="col-md-4">
              <div class="card custom-card" lkId="${lichKham.lichKhamId}">
                  <div class="d-flex justify-content-between align-items-start">
                      <span class="badge rounded-pill ${getBadgeClass(
                        status
                      )}" style="min-width: 70px">
                          ${status}
                      </span>
                      <span class="dropdown">
                          <button class="optionButton btn btn-link dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                              <i class="fas fa-ellipsis-v"></i>
                          </button>
                          <ul class="dropdown-menu">
                              <li>
                                  <div class="dropdown-item ${completeDisabled}" data-bs-target="#modal-confirm-complete" data-bs-toggle="modal">
                                      <i class="fas fa-check me-2" style="color: rgb(28, 212, 37)"></i> Hoàn thành
                                  </div>
                              </li>
                              <li>
                                  <div id="optionViewResult" class="dropdown-item ${readDisabled}" data-bs-target="#modal-view-result" data-bs-toggle="modal">
                                      <i class="fas fa-eye me-2" style="color: rgb(28, 212, 212)"></i> Xem kết quả khám
                                  </div>
                              </li>
                              <li>
                                  <div class="dropdown-item ${editDisabled}" data-bs-target="#modal-confirm-cancel" data-bs-toggle="modal">
                                      <i class="fas fa-times-circle me-2" style="color: rgb(255, 123, 0)"></i> Hủy
                                  </div>
                              </li>
                              <li>
                                  <div class=" dropdown-item" data-bs-target="#modal-confirm-delete" data-bs-toggle="modal">
                                      <i class="fas fa-trash-alt me-2" style="color: rgb(245, 76, 76)"></i> Xóa
                                  </div>
                              </li>
                          </ul>
                      </span>
                  </div>
                  <div class="mt-2">
                      <h5 class="mb-1">Bác sĩ: ${doctorName}</h5>
                      <p class="mb-1">Ngày khám: ${formattedDate}</p>
                      <p class="mb-1">Ca khám: ${lichKham.gioKham}</p>
                      <p class="mb-1 ${readReason}">Lý do hủy: ${
      lichKham.lyDo
    }</p>
                      <p class="mb-0 ${readService}">Dịch vụ: ${serviceName}</p>

                  </div>
              </div>
          </div>
      `;

    container.append(col);
  });
}
