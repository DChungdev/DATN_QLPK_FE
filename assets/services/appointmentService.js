var dsLK;
var dsBacSi;
var dsDichVu;
var lkId = "";
var bnId = "";
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

  getAllDepartment(
    departmentSelectEdit,
    doctorSelectEdit,
    appointmentTimeSelectEdit,
    serviceSelectEdit
  );

  // Gắn sự kiện cho nút hiển thị modal sửa
  $(document).on("click", ".m-edit", function () {
    const lichKhamId = $(this).closest("tr").attr("lk-id");
    lkId = lichKhamId;
    const lichKham = dsLK.find((lk) => lk.lichKhamId === lichKhamId); // Tìm lịch khám trong danh sách
    // console.log(lichKham);
    if (lichKham) {
      bnId = lichKham.benhNhanId;
      fillEditModal(lichKham); // Hiển thị thông tin lên modal
    } else {
      console.error("Không tìm thấy thông tin lịch khám!");
    }
  });

  //Xử lý sự kiện khi nhấn nút sửa
  $("#btnEdit").click(function () {
    //Gọi hàm Sửa
    editAppointment();
  });

  //Mở modal xác nhận xóa
  $(document).on("click", ".m-delete", function () {
    const lichKhamId = $(this).closest("tr").attr("lk-id");
    lkId = lichKhamId;
    console.log(lkId);
    const lichKham = dsLK.find((lk) => lk.lichKhamId === lichKhamId); // Tìm lịch khám trong danh sách
  });

  //Xử lý sự kiện khi nhấn nút xóa
  $("#btnDelete").click(function () {
    // Hiển thị trạng thái đang xử lý
    $("#dialog-confirm-delete #btnDelete")
      .prop("disabled", true)
      .text("Đang xóa...");
    axiosJWT
      .delete(`/api/v1/Appointments/${lkId}`)
      .then(function (response) {
        console.log("Xóa lịch khám thành công:", response.data);
        showPopup("success", "Thành công! Lịch khám đã được xóa.");
        $("#dialog-confirm-delete #btnDelete")
          .prop("disabled", false)
          .text("Xóa");
        $("#dialog-confirm-delete").modal("hide");
        getData(); // Tải lại dữ liệu sau khi cập nhật
      })
      .catch(function (error) {
        showPopup("error", "Lỗi! Không thể xóa lịch khám.");
        $("#dialog-confirm-delete #btnDelete")
          .prop("disabled", false)
          .text("Xóa");
        $("#dialog-confirm-delete").modal("hide");
        console.error("Lỗi khi xóa lịch khám: ", error);
      });
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

//Xử lý Thêm lịch khám mới
function editAppointment() {
  const patient = {
    maBenhNhan: "",
    hoTen: $("#dialog-appointment-edit #name").val(),
    ngaySinh: $("#dialog-appointment-edit #dOBirth").val(),
    loaiGioiTinh: parseInt($("#dialog-appointment-edit #gender").val()),
    soDienThoai: $("#dialog-appointment-edit #phone-number").val(),
    email: $("#dialog-appointment-edit #email").val(),
    diaChi: $("#dialog-appointment-edit #address").val(),
    tienSuBenhLy: $("#dialog-appointment-edit #medicalHistory").val(),
  };
  const appointment = {
    lichKhamId: lkId,
    benhNhanId: bnId,
    bacSiId: $("#dialog-appointment-edit #doctor").val(),
    ngayKham: $("#dialog-appointment-edit #appointmentDate").val(),
    gioKham: $("#dialog-appointment-edit #appointmentTime").val(),
    trangThaiLichKham: "",
    dichVuId:$("#dialog-appointment-edit #service").val(),
    benhNhan: patient,
  };
  //Check data hợp lệ
  checkData(appointment);
}

//Check Data hợp lệ
function checkData(appointment) {
  const errors = [];
  let firstErrorSelector = null; // Để lưu selector của lỗi đầu tiên
  const today = new Date().toISOString().split("T")[0]; // Ngày hiện tại

  // Hàm thêm lỗi cho input
  const setError = (selector, message) => {
    $(selector).addClass("m-input-error").attr("title", message);
    errors.push(message);
    if (!firstErrorSelector) firstErrorSelector = selector; // Lưu selector lỗi đầu tiên
  };

  // Hàm xóa lỗi khỏi input
  const clearError = (selector) => {
    $(selector).removeClass("m-input-error").removeAttr("title");
  };

  // Kiểm tra họ tên
  if (!appointment.benhNhan.hoTen.trim()) {
    setError("#dialog-appointment-edit #name", "Họ tên không được để trống.");
  } else if (/\d/.test(appointment.benhNhan.hoTen)) {
    setError("#dialog-appointment-edit #name", "Họ tên không được chứa số.");
  } else {
    clearError("#dialog-appointment-edit #name");
  }

  // Kiểm tra ngày sinh
  if (appointment.benhNhan.ngaySinh) {
    if (appointment.benhNhan.ngaySinh >= today) {
      setError(
        "#dialog-appointment-edit #dOBirth",
        "Ngày sinh phải nhỏ hơn ngày hiện tại."
      );
    } else {
      clearError("#dialog-appointment-edit #dOBirth");
    }
  } else {
    clearError("#dialog-appointment-edit #dOBirth");
  }

  // Kiểm tra số điện thoại
  if (!appointment.benhNhan.soDienThoai.trim()) {
    setError(
      "#dialog-appointment-edit #phone-number",
      "Số điện thoại không được để trống."
    );
  } else if (/\D/.test(appointment.benhNhan.soDienThoai)) {
    setError(
      "#dialog-appointment-edit #phone-number",
      "Số điện thoại không được chứa chữ."
    );
  } else {
    clearError("#dialog-appointment-edit #phone-number");
  }

  // Kiểm tra email
  if (appointment.benhNhan.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(appointment.benhNhan.email)) {
      setError(
        "#dialog-appointment-edit #email",
        "Email không đúng định dạng."
      );
    } else {
      clearError("#dialog-appointment-edit #email");
    }
  } else {
    clearError("#dialog-appointment-edit #email");
  }

  // Kiểm tra ngày khám
  if (!appointment.ngayKham.trim()) {
    setError(
      "#dialog-appointment-edit #appointmentDate",
      "Ngày khám không được để trống."
    );
  } else if (appointment.ngayKham < today) {
    setError(
      "#dialog-appointment-edit #appointmentDate",
      "Ngày khám không được nhỏ hơn ngày hiện tại."
    );
  } else {
    clearError("#dialog-appointment-edit #appointmentDate");
  }

  // Nếu có lỗi, hiển thị modal lỗi
  if (errors.length > 0) {
    showErrorList(errors, firstErrorSelector);
  } else {
    $("#dialog-errorList").modal("hide");
    // Nếu không có lỗi, có thể tiếp tục xử lý lưu lịch khám tại đây
    saveAppointment(appointment);
  }
}

//Lưu lịch khám
function saveAppointment(appointment) {
  // Hiển thị trạng thái đang xử lý
  $("#dialog-appointment-edit #btnEdit")
    .prop("disabled", true)
    .text("Đang lưu...");
  // Gửi yêu cầu cập nhật tới API
  axiosJWT
    .put(`/api/v1/Appointments/${appointment.lichKhamId}`, appointment)
    .then(function (response) {
      console.log("Cập nhật thành công:", response.data);
      // Hiển thị trạng thái thành công
      showPopup("success", "Thành công! Lịch khám đã được cập nhật.");
      $("#dialog-appointment-edit #btnEdit")
        .prop("disabled", false)
        .text("Lưu");
      $("#dialog-appointment-edit").modal("hide");
      getData(); // Tải lại dữ liệu sau khi cập nhật
    })
    .catch(function (error) {
      console.error("Lỗi khi cập nhật: ", error);
      showPopup("error", "Lỗi! Không thể cập nhật lịch khám.");
      $("#dialog-appointment-edit #btnEdit")
        .prop("disabled", false)
        .text("Lưu");
      $("#dialog-appointment-edit").modal("hide");
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
  $("#dialog-appointment-edit #appointmentDate").val(formattedDate);

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
    appointmentTimeSelect.prop("disabled", false).val(lichKham.gioKham); // Gán giá trị ca khám vào select

    $("#dialog-appointment-edit #service").val(lichKham.dichVuId);
  }
  // Xử lý thông tin bệnh nhân
  if (lichKham.benhNhanId) {
    axiosJWT
      .get(`/api/Patients/${lichKham.benhNhanId}`)
      .then((response) => {
        const benhNhan = response.data;
        $("#dialog-appointment-edit #name").val(benhNhan.hoTen || "");
        $("#dialog-appointment-edit #phone-number").val(
          benhNhan.soDienThoai || ""
        );
        $("#dialog-appointment-edit #email").val(benhNhan.email || "");
        $("#dialog-appointment-edit #gender").val(benhNhan.loaiGioiTinh ?? "");
        $("#dialog-appointment-edit #dOBirth").val(
          benhNhan.ngaySinh
            ? new Date(benhNhan.ngaySinh).toLocaleDateString("en-CA") // Định dạng YYYY-MM-DD theo múi giờ cục bộ
            : ""
        );
        $("#dialog-appointment-edit #address").val(benhNhan.diaChi || "");
        $("#dialog-appointment-edit #medicalHistory").val(
          benhNhan.tienSuBenhLy || ""
        );
      })
      .catch((error) => {
        console.error("Không lấy được thông tin bệnh nhân:", error);
        alert("Không thể lấy thông tin bệnh nhân!");
      });
  } else {
    // Đặt mặc định nếu không có bệnh nhân
    $("#dialog-appointment-edit #name").val("");
    $("#dialog-appointment-edit #phone-number").val("");
    $("#dialog-appointment-edit #email").val("");
    $("#dialog-appointment-edit #gender").val("");
    $("#dialog-appointment-edit #dOBirth").val("");
    $("#dialog-appointment-edit #address").val("");
    $("#dialog-appointment-edit #medicalHistory").val("");
  }
}

// Lấy toàn bộ lịch khám
function getData() {
  axiosJWT
    .get(`/api/v1/Appointments`)
    .then(function (response) {
      dsLK = response.data;
      console.log(dsLK);
      display(dsLK);
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}

// Lấy toàn bộ khoa
function getAllDepartment(
  selectElement,
  doctorSelect,
  appointmentTimeSelect,
  serviceSelectEdit
) {
  axiosJWT
    .get(`/api/v1/Departments`)
    .then(function (response) {
      const dsKhoa = response.data;
      dsKhoa.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.khoaId;
        option.textContent = item.tenKhoa;
        selectElement.appendChild(option);
      });
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });

  // Lắng nghe sự kiện khi chọn Khoa
  selectElement.addEventListener("change", () => {
    const selectedKhoaId = selectElement.value;

    // Xóa các bác sĩ và dịch vụ cũ
    doctorSelect.innerHTML = '<option value="">Chọn bác sĩ</option>';
    serviceSelectEdit.innerHTML = '<option value="">Chọn dịch vụ</option>'; // Reset dịch vụ

    if (selectedKhoaId) {
      // Lấy danh sách Bác sĩ theo Khoa
      axiosJWT
        .get(`/api/Doctors/doctor/${selectedKhoaId}`)
        .then(function (response) {
          const dsBacSi = response.data;
          dsBacSi.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.bacSiId;
            option.textContent = item.hoTen;
            doctorSelect.appendChild(option);
          });

          // Lắng nghe sự kiện khi chọn Bác sĩ
          doctorSelect.addEventListener("change", () => {
            addEventSelect(doctorSelect, dsBacSi, appointmentTimeSelect);
          });
        })
        .catch(function (error) {
          console.error("Lỗi không tìm được bác sĩ:", error);
        });

      // Lấy danh sách Dịch vụ theo Khoa
      axiosJWT
        .get(`/api/Services/${selectedKhoaId}`) // Giả sử API này trả về dịch vụ theo khoa
        .then(function (response) {
          const dsDichVu = response.data;
          dsDichVu.forEach((item) => {
            const option = document.createElement("option");
            option.value = item.dichVuId;
            option.textContent = item.tenDichVu;
            serviceSelectEdit.appendChild(option);
          });
        })
        .catch(function (error) {
          console.error("Lỗi không tìm được dịch vụ:", error);
        });
    } else {
      // Nếu không có khoa nào được chọn, reset bác sĩ và dịch vụ
      getAllDoctor(doctorSelect);
      getAllService(serviceSelectEdit);
    }
  });
}

// Lấy toàn bộ Bác sĩ
function getAllDoctor(selectElement, appointmentTimeSelect) {
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
      selectElement.addEventListener("change", () => {
        addEventSelect(selectElement, dsBacSi, appointmentTimeSelect);
      });
      addEventSelect(selectElement, dsBacSi, appointmentTimeSelect);
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}
// Lấy toàn bộ dịch vụ
function getAllService(serviceSelectEdit) {
  axiosJWT
    .get(`/api/Services`)
    .then(function (response) {
      dsDichVu = response.data;
      console.log(dsDichVu);
      dsDichVu.forEach((item) => {
        const option = document.createElement("option");
        option.value = item.dichVuId;
        option.textContent = item.tenDichVu;
        serviceSelectEdit.appendChild(option);
      });
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}
function addEventSelect(selectElement, dsBacSi, appointmentTimeSelect) {
  const selectedDoctorId = selectElement.value;
  appointmentTimeSelect.innerHTML = '<option value="">Chọn ca khám</option>'; // Reset giờ khám

  if (selectedDoctorId) {
    const selectedDoctor = dsBacSi.find(
      (doc) => doc.bacSiId == selectedDoctorId
    );
    if (selectedDoctor && selectedDoctor.gioLamViec) {
      const gioKhamArray = selectedDoctor.gioLamViec
        .split(",")
        .map((time) => time.trim());
      gioKhamArray.forEach((time) => {
        const timeOption = document.createElement("option");
        timeOption.value = time;
        timeOption.textContent = time;
        appointmentTimeSelect.appendChild(timeOption);
      });
    }
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

// //Hiển thị dữ liệu lên bảng
//Hiển thị dữ liệu lên bảng
async function display(data) {
  const tableBody = document.querySelector("#tblAppointment tbody");
  tableBody.innerHTML = ""; // Xóa nội dung cũ nếu có

  // Tạo danh sách các Promise để lấy tên bệnh nhân
  const patientNamesPromises = data.map((item) =>
    getNameById("Patients", item.benhNhanId)
  );
  const patientNames = await Promise.all(patientNamesPromises); // Chờ tất cả Promise hoàn thành
  // Tạo danh sách các Promise để lấy tên bác sĩ
  const doctorNamesPromises = data.map((item) =>
    getNameById("Doctors", item.bacSiId)
  );
  const doctorNames = await Promise.all(doctorNamesPromises); // Chờ tất cả Promise hoàn thành

  data.forEach((item, index) => {
    // // Định dạng hiển thị dd/MM/yyyy
    const dateString = item.ngayKham;
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-GB"); // 'en-GB' chuẩn Anh (ngày/tháng/năm)

    // Lấy tên bệnh nhân từ mảng đã xử lý
    const patientName = patientNames[index];
    const doctorName = doctorNames[index];

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

    // Xử lý trạng thái của nút "m-edit"
    const editDisabled =
      status === "Đã hủy" || status === "Hoàn thành" ? "disabled" : "";
    const editClass =
      status === "Đã hủy" || status === "Hoàn thành" ? "disabled" : "";

    // Tạo hàng mới
    const row = document.createElement("tr");
    row.setAttribute("lk-id", item.lichKhamId);

    row.innerHTML = `
      <td style="text-align: center;">${index + 1}</td>
      <td style="padding-left: 7%;";>${patientName}</td>
      <td style="text-align: center";>${formattedDate}</td>
      <td style="text-align: center";>${item.gioKham}</td>
      <td style="padding-left: 4%;";>${doctorName}</td>
      <td style="text-align: center";><span class="badge rounded-pill ${bgColor}">${
      item.trangThaiLichKham
    }</span></td>
      <td>
        <div class="m-table-tool">
          <div
            class="m-edit m-tool-icon ${editClass}"
            data-bs-toggle="modal"
            data-bs-target="#dialog-appointment-edit"
            ${editDisabled}
          >
            <i class="fas fa-edit text-primary"></i>
          </div>
          <div
            class="m-delete m-tool-icon"
            data-bs-toggle="modal"
            data-bs-target="#dialog-confirm-delete"
          >
            <i class="fas fa-trash-alt text-danger"></i>
          </div>
        </div>
      </td>
    `;
    tableBody.appendChild(row); // Thêm hàng vào bảng
  });
}
