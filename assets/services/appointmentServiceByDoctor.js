var dsLK;
var dsBacSi;
var dsDichVu;
var lkId = "";
var bnId = "";
var bsId = "";
$(document).ready(async function () {
  await getDoctorId();
  //Lấy tất cả dữ liệu
  getData();
  //Lấy danh sách bác sĩ điền vào select trong modal edit
  const doctorSelectEdit = document.querySelector(
    "#dialog-appointment-detail #doctor"
  );
  const appointmentTimeSelectEdit = document.querySelector(
    "#dialog-appointment-detail #appointmentTime"
  );
  const serviceSelectEdit = document.querySelector(
    "#dialog-appointment-detail #service"
  );
  getAllService(serviceSelectEdit);

  getAllDoctor(doctorSelectEdit);

  // Gắn sự kiện cho nút hiển thị modal xem chi tiết
  findLichKham(".m-detail.m-edit", fillEditModal);
  // Gắn sự kiện cho nút hiển thị modal xem chi tiết
  findLichKham(".m-agree.m-edit", () => {});

  //Gắn sự kiện khi nhấn đồng ý
  $("#btnAgree").click(function () {
    //Gọi API đồng ý
    acceptAppointment();
  });

  //Mở modal xác nhận hủy
  findLichKham(".m-refuse.m-edit", () => {});

  //Xử lý sự kiện khi nhấn nút xóa
  $("#btnRefuse").click(function () {
    //Lấy lý do
    const reason = $("#dialog-confirm-refuse #reason").val();
    // Kiểm tra nếu lý do trống
    if (!reason.trim()) {
      // Thêm class m-input-error vào ô input lý do
      $("#reason").addClass("m-input-error");
      // Thêm thông báo title cho người dùng
      $("#reason").attr("title", "Lý do từ chối không được để trống!");
      // Focus vào ô input
      $("#reason").focus();
    } else {
      // Xóa thông báo lỗi nếu lý do không trống
      $("#reason").removeClass("m-input-error");
      $("#reason").removeAttr("title");
      // Gọi API Hủy lịch khám
      cancelAppointment(reason);
    }
  });
  // Gắn sự kiện cho nút hiển thị modal xem chi tiết
  findLichKham(".m-addResult.m-edit", () => {});
  //Gắn sự kiện khi nhấn nút Tạo lịch khám
  $("#btnAddResult").click(function () {
    addResultAppointment();
  });

  //Xử lý sự kiện khi nhấn nút Refresh
  $(".m-toolbar-refresh").click(function () {
    getData();
  });
  //Xử lý sự kiện khi nhấn nút Export
  $(".m-toolbar-export").click(function () {
    exportToExcel();
  });

  // Sự kiện khi nhập vào ô tìm kiếm
  $(".m-input-search").on("keyup", function () {
    var value = $(this).val().toLowerCase();
    $("#tblAppointment tbody tr").filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });
});

function addResultAppointment() {
  const ketQua = {
    ketQuaKhamId: "d8a013a3-228d-4ccd-bae7-ca43b855d7b2",
    lichKhamId: lkId,
    chanDoan: $("#dialog-add-result #diagnose").val(),
    chiDinhThuoc: $("#dialog-add-result #prescription").val(),
    ghiChu: $("#dialog-add-result #note").val(),
    ngayTao: "2024-12-14T10:13:33.3215854",
    ngayCapNhat: "2024-12-14T10:13:33.3215854",
  };
  console.log(ketQua);
  //Check data hợp lệ
  checkData(ketQua);
}

//Check Data hợp lệ
function checkData(ketQua) {
  const errors = [];
  let firstErrorSelector = null; // Để lưu selector của lỗi đầu tiên

  // Hàm thêm lỗi cho input
  const setError = (selector, message) => {
    $(selector).addClass("input-error").attr("title", message);
    errors.push(message);
    if (!firstErrorSelector) firstErrorSelector = selector; // Lưu selector lỗi đầu tiên
  };

  // Hàm xóa lỗi khỏi input
  const clearError = (selector) => {
    $(selector).removeClass("input-error").removeAttr("title");
  };

  // Kiểm tra họ tên
  if (!ketQua.chanDoan.trim()) {
    setError("#dialog-add-result #diagnose", "Chẩn đoán không được để trống.");
  } else {
    clearError("#dialog-add-result #diagnose");
  }

  // Nếu có lỗi, hiển thị modal lỗi
  if (errors.length > 0) {
    $(firstErrorSelector).focus();
  } else {
    $("#dialog-errorList").modal("hide");
    // Nếu không có lỗi, có thể tiếp tục xử lý lưu lịch khám tại đây
    saveResulAppointment(ketQua);
  }
}

//Lưu kết quả khám
function saveResulAppointment(ketQua) {
  // Hiển thị trạng thái đang xử lý
  $("#dialog-add-result #btnAddResult")
    .prop("disabled", true)
    .text("Đang lưu...");
  // Gửi yêu cầu cập nhật tới API
  axiosJWT
    .post(`/api/Results`, ketQua)
    .then(function (response) {
      console.log("Cập nhật thành công:", response.data);
      // Hiển thị trạng thái thành công
      showPopup("success", "Thành công! Kết quả khám đã được tạo.");
      $("#dialog-add-result #btnAddResult").prop("disabled", false).text("Tạo");
      $("#dialog-add-result").modal("hide");
      getData(); // Tải lại dữ liệu sau khi cập nhật
    })
    .catch(function (error) {
      if (
        error.response.data.Error.LichKhamId === "Lich kham nay da co ket qua"
      ) {
        showPopup("error", "Lỗi! Lịch khám này đã có kết quả.");
      } else {
        console.error("Lỗi khi tạo: ", error);
        showPopup("error", "Lỗi! Không thể lưu kết quả khám.");
      }
      $("#dialog-add-result #btnAddResult").prop("disabled", false).text("Tạo");
      $("#dialog-add-result").modal("hide");
    });
}

// Hàm dùng chung để xử lý sự kiện
function findLichKham(selector, callback) {
  $(document).on("click", selector, function () {
    const lichKhamId = $(this).closest("tr").attr("lk-id");
    lkId = lichKhamId;
    const lichKham = dsLK.find((lk) => lk.lichKhamId === lichKhamId); // Tìm lịch khám trong danh sách
    if (lichKham) {
      bnId = lichKham.benhNhanId;
      callback(lichKham);
    } else {
      console.error("Không tìm thấy thông tin lịch khám!");
    }
  });
}

//Xử lý khi nhấn đồng ý hủy lịch khám
function cancelAppointment(reason) {
  // Hiển thị trạng thái đang xử lý
  $("#dialog-confirm-refuse #btnRefuse")
    .prop("disabled", true)
    .text("Đang xử lý...");
  axiosJWT
    .put(
      `/api/v1/Appointments/cancel/${lkId}`,
      JSON.stringify("Bác sĩ: " + reason),
      {
        headers: {
          "Content-Type": "application/json", // Đảm bảo header là application/json
        },
      }
    )
    .then(function (response) {
      console.log("Hủy lịch khám thành công:", response.data);
      showPopup("success", "Thành công! Lịch khám đã được hủy.");
      $("#dialog-confirm-refuse").modal("hide");
      $("#dialog-confirm-refuse #btnRefuse")
        .prop("disabled", false)
        .text("Đồng ý");
      getData(); // Tải lại dữ liệu sau khi cập nhật
    })
    .catch(function (error) {
      showPopup("error", "Lỗi! Không thể hủy lịch khám.");
      $("#dialog-confirm-refuse").modal("hide");
      $("#dialog-confirm-refuse #btnRefuse")
        .prop("disabled", false)
        .text("Đồng ý");
      console.error("Lỗi khi hủy lịch khám: ", error);
    });
}

//Xử lý khi nhấn đồng ý lịch khám
function acceptAppointment() {
  // Hiển thị trạng thái đang xử lý
  $("#dialog-confirm-agree #btnAgree")
    .prop("disabled", true)
    .text("Đang xử lý...");
  axiosJWT
    .put(`/api/v1/Appointments/doctor/${lkId}`)
    .then(function (response) {
      console.log("Xác nhận lịch khám thành công:", response.data);
      showPopup("success", "Thành công! Lịch khám đã được chấp nhận.");
      $("#dialog-confirm-agree #btnAgree")
        .prop("disabled", false)
        .text("Đồng ý");
      getData(); // Tải lại dữ liệu sau khi cập nhật
    })
    .catch(function (error) {
      showPopup("error", "Lỗi! Không thể xác nhận lịch khám.");
      $("#dialog-confirm-agree #btnAgree")
        .prop("disabled", false)
        .text("Đồng ý");
      console.error("Lỗi khi xác nhận lịch khám: ", error);
    });
}

// Xử lý khi nhấn xuất file
async function exportToExcel() {
  try {
    // Lấy tên bệnh nhân và bác sĩ đồng thời cho tất cả các mục trong dsLK
    const formattedData = await Promise.all(
      dsLK.map(async (item) => {
        const patientName = await getNameById("Patients", item.benhNhanId); // Lấy tên bệnh nhân
        const doctorName = await getNameById("Doctors", item.bacSiId); // Lấy tên bác sĩ

        return {
          "Mã lịch khám": item.lichKhamId,
          "Mã bệnh nhân": item.benhNhanId,
          "Mã bác sĩ": item.bacSiId,
          "Tên bệnh nhân": patientName, // Sử dụng tên bệnh nhân lấy từ API
          "Ngày khám": new Date(item.ngayKham).toLocaleDateString("en-GB"),
          "Giờ khám": item.gioKham,
          "Tên bác sĩ": doctorName, // Sử dụng tên bác sĩ lấy từ API
          "Trạng thái": item.trangThaiLichKham,
        };
      })
    );

    // Tạo workbook và worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LichKham");

    // Xuất file Excel
    XLSX.writeFile(workbook, "LichKham.xlsx");
  } catch (error) {
    console.error("Lỗi khi xuất dữ liệu:", error);
    // Hiển thị thông báo lỗi nếu cần
    showPopup("error", "Không thể xuất dữ liệu!");
  }
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

//Hiển thị danh sách lỗi
function showErrorList(errors, firstErrorSelector) {
  const errorContent = $("#dialog-errorList .content");
  errorContent.empty(); // Xóa nội dung cũ

  // Thêm lỗi dạng danh sách <ul>
  const errorList = $("<ul></ul>");
  errors.forEach((error) => {
    errorList.append(`<li>${error}</li>`);
  });
  errorContent.append(errorList);

  // Hiển thị modal lỗi
  $("#dialog-errorList").modal("show");

  // Xử lý focus vào ô lỗi đầu tiên khi modal lỗi bị đóng
  $("#dialog-errorList #btnClose")
    .off("click")
    .on("click", () => {
      if (firstErrorSelector) {
        $(firstErrorSelector).focus();
      }
    });
}

// Hàm điền thông tin vào modal
function fillEditModal(lichKham) {
  // Điền thông tin lịch khám
  const formattedDate = lichKham.ngayKham
    ? new Date(lichKham.ngayKham).toLocaleDateString("en-CA") // Định dạng YYYY-MM-DD theo múi giờ cục bộ
    : "";
  $("#dialog-appointment-detail #appointmentDate").val(formattedDate);

  const doctorSelect = $("#doctor");
  const appointmentTimeSelect = $("#appointmentTime");
  // Điền thông tin bác sĩ vào select
  doctorSelect.val(lichKham.bacSiId); // Gán bác sĩ đã chọn
  // Lấy danh sách các ca khám của bác sĩ đã chọn (nếu cần)
  // Lấy ra id của bác sĩ trong lịch khám
  const doctorId = lichKham.bacSiId;
  // Lấy ra bác sĩ theo id
  const doctor = dsBacSi.find((d) => d.bacSiId === doctorId);
  if (doctor && doctor.gioLamViec) {
    const gioKhamArray = doctor.gioLamViec
      .split(",")
      .map((time) => time.trim());
    appointmentTimeSelect.empty(); // Xóa hết các option cũ
    appointmentTimeSelect.append('<option value="">Chọn ca khám</option>');

    gioKhamArray.forEach(function (time) {
      appointmentTimeSelect.append(`<option value="${time}">${time}</option>`);
    });

    // Sau khi điền danh sách ca khám, gán lại giá trị ca khám (gioKham)
    appointmentTimeSelect.val(lichKham.gioKham); // Gán giá trị ca khám vào select

    $("#dialog-appointment-detail #service").val(lichKham.dichVuId);
    
    $("#dialog-appointment-detail #reason").val(lichKham.lyDo);

  }
  // Xử lý thông tin bệnh nhân
  if (lichKham.benhNhanId) {
    axiosJWT
      .get(`/api/Patients/${lichKham.benhNhanId}`)
      .then((response) => {
        const benhNhan = response.data;
        $("#dialog-appointment-detail #name").val(benhNhan.hoTen || "");
        $("#dialog-appointment-detail #phone-number").val(
          benhNhan.soDienThoai || ""
        );
        $("#dialog-appointment-detail #email").val(benhNhan.email || "");
        $("#dialog-appointment-detail #gender").val(
          benhNhan.loaiGioiTinh ?? ""
        );
        $("#dialog-appointment-detail #dOBirth").val(
          benhNhan.ngaySinh
            ? new Date(benhNhan.ngaySinh).toLocaleDateString("en-CA") // Định dạng YYYY-MM-DD theo múi giờ cục bộ
            : ""
        );
        $("#dialog-appointment-detail #address").val(benhNhan.diaChi || "");
        $("#dialog-appointment-detail #medicalHistory").val(
          benhNhan.tienSuBenhLy || ""
        );
      })
      .catch((error) => {
        console.error("Không lấy được thông tin bệnh nhân:", error);
        alert("Không thể lấy thông tin bệnh nhân!");
      });
  } else {
    // Đặt mặc định nếu không có bệnh nhân
    $("#dialog-appointment-detail #name").val("");
    $("#dialog-appointment-detail #phone-number").val("");
    $("#dialog-appointment-detail #email").val("");
    $("#dialog-appointment-detail #gender").val("");
    $("#dialog-appointment-detail #dOBirth").val("");
    $("#dialog-appointment-detail #address").val("");
    $("#dialog-appointment-detail #medicalHistory").val("");
  }
  //Xử lý khi trạng thái khác "Đang xử lý" thì không cho chấp nhận hay hủy lịch khám
  const btnRefuse = $("#btnRefuse1");
  const btnAgree = $("#btnAgree1");
  if (lichKham.trangThaiLichKham !== "Đang xử lý") {
    btnAgree.prop("disabled", true);
    btnRefuse.prop("disabled", true);
  } else {
    btnAgree.prop("disabled", false);
    btnRefuse.prop("disabled", false);
  }
}

// Lấy toàn bộ lịch khám
function getData() {
  axiosJWT
    .get(`/api/v1/Appointments/doctor/${bsId}`)
    .then(function (response) {
      dsLK = response.data;
      console.log(dsLK);
      display(dsLK);
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}

async function getDoctorId() {
  try {
    let userId = localStorage.getItem("doctorId");
    const response = await axiosJWT.get(`/api/Doctors/getbyuserid/${userId}`);
    bsId = response.data.bacSiId; // Lấy giá trị ID bác sĩ
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
  }
}

// Lấy toàn bộ Bác sĩ
function getAllDoctor(selectElement) {
  axiosJWT
    .get(`/api/Doctors`)
    .then(function (response) {
      dsBacSi = response.data;
      dsBacSi.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.bacSiId;
        option.textContent = item.hoTen;
        selectElement.appendChild(option);
      });
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}
// Lấy toàn bộ dịch vụ
function getAllService(serviceSelect) {
  axiosJWT
    .get(`/api/Services`)
    .then(function (response) {
      dsDichVu = response.data;
      dsDichVu.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.dichVuId;
        option.textContent = item.tenDichVu;
        serviceSelect.appendChild(option);
      });
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
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

//Hiển thị dữ liệu lên bảng
async function display(data) {
  const tableBody = document.querySelector("#tblAppointment tbody");
  tableBody.innerHTML = ""; // Xóa nội dung cũ nếu có

  // Tạo danh sách các Promise để lấy tên bệnh nhân
  const patientNamesPromises = data.map((item) =>
    getNameById("Patients", item.benhNhanId)
  );
  const patientNames = await Promise.all(patientNamesPromises); // Chờ tất cả Promise hoàn thành

  data.forEach((item, index) => {
    // // Định dạng hiển thị dd/MM/yyyy
    const dateString = item.ngayKham;
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-GB"); // 'en-GB' chuẩn Anh (ngày/tháng/năm)

    // Lấy tên bệnh nhân từ mảng đã xử lý
    const patientName = patientNames[index];

    // Xử lý màu badge
    const status = item.trangThaiLichKham;
    let bgColor = "";
    if (status === "Đã hủy") {
      bgColor = "bg-danger";
    } else if (status === "Đang xử lý") {
      bgColor = "bg-warning";
    } else if (status === "Đã đặt") {
      bgColor = "bg-primary";
    } else {
      bgColor = "bg-success";
    }

    // Xử lý trạng thái của các control
    const editDisabled = status !== "Đang xử lý" ? "disabled" : "";
    const editClass = status !== "Đang xử lý" ? "disabled" : "";
    const addDisabled = status !== "Đã đặt" ? "disabled" : "";
    const addClass = status !== "Đã đặt" ? "disabled" : "";

    // Tạo hàng mới
    const row = document.createElement("tr");
    row.setAttribute("lk-id", item.lichKhamId);

    row.innerHTML = `
      <td style="text-align: center;">${index + 1}</td>
      <td class="patient-name">${patientName}</td>
      <td style="text-align: center";>${formattedDate}</td>
      <td style="text-align: center";>${item.gioKham}</td>
      <td style="text-align: center";><span class="badge rounded-pill ${bgColor}">${
      item.trangThaiLichKham
    }</span></td>
      <td>
        <div class="m-table-tool">
                      <div
                        class="m-detail m-edit m-tool-icon"
                        data-bs-toggle="modal"
                        data-bs-target="#dialog-appointment-detail"
                      >
                        <i class="fas fa-eye text-primary"></i>
                      </div>
                      <div
                        class="m-agree m-edit m-tool-icon ${editClass}" 
                        data-bs-toggle="modal"
                        data-bs-target="#dialog-confirm-agree"
                        ${editDisabled}
                      >
                        <i class="fas fa-check text-success"></i>
                      </div>
                      <div
                        class="m-refuse m-edit m-tool-icon ${editClass}"
                        data-bs-toggle="modal"
                        data-bs-target="#dialog-confirm-refuse" 
                        ${editDisabled}
                      >
                        <i class="fas fa-times text-danger"></i>
                      </div>
                      <div
                        class="m-addResult m-edit m-tool-icon ${addClass}"
                        data-bs-toggle="modal"
                        data-bs-target="#dialog-add-result" 
                        ${addDisabled}
                      >
                        <i class="fas fa-plus text-warning"></i>
                      </div>
                    </div>
      </td>
    `;
    tableBody.appendChild(row); // Thêm hàng vào bảng
  });
}
