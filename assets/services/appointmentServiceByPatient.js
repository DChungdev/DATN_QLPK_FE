var bn;
var lichKham;
var dsBacSi;
var dsDichVu;
var userId = localStorage.getItem("userId");
$(document).ready(function () {
  console.log(userId);

  //Lấy danh sách phòng ban, bác sĩ điền vào select trong form đăng ký
  const departmentSelect = $("#appointment #department");
  const doctorSelect = $("#appointment #doctor");
  const appointmentTimeSelect = $("#appointment #appointment-time");
  const serviceSelect = $("#appointment #service");

  getAllService(serviceSelect);

  getAllDoctor(doctorSelect, appointmentTimeSelect);

  getAllDepartment(
    departmentSelect,
    doctorSelect,
    appointmentTimeSelect,
    serviceSelect
  );

  //Lấy danh sách phòng ban, bác sĩ điền vào select trong modal edit
  const departmentSelectEdit = $("#modalEditAppointment #department-edit");
  const doctorSelectEdit = $("#modalEditAppointment #doctor-edit");
  const appointmentTimeSelectEdit = $(
    "#modalEditAppointment #appointment-time-edit"
  );
  const serviceSelectEdit = $("#modalEditAppointment #service-edit");
  getAllService(serviceSelectEdit);

  getAllDoctor(doctorSelectEdit, appointmentTimeSelectEdit);

  getAllDepartment(
    departmentSelectEdit,
    doctorSelectEdit,
    appointmentTimeSelectEdit,
    serviceSelectEdit
  );

  //  console.log(bn);
  // getAppointmentLatest(bn.benhNhanId);

  //Xử lý khi nhấn Đặt lịch khám
  $("#btnDatLich").click(async function () {
    // Chờ hoàn tất việc lấy thông tin bệnh nhân
    await getPatientByUserId();
    //Gọi hàm xử lý khi Đặt lịch
    registerAppointment();
  });

  //Xử lý khi nhấn nút Xem lịch khám
  $("#btnXemLichKham").click(async function () {
    try {
      $("#modalEditAppointment .loading").show();
      // Chờ hoàn tất việc lấy thông tin bệnh nhân
      await getPatientByUserId();

      // Sau khi đã có bệnh nhân, lấy thông tin lịch khám gần nhất
      await getAppointmentLatest();

      // Điền thông tin vào modalEdit
      if (lichKham) {
        fillEditModal();
      } else {
        console.log("Không tìm thấy thông tin lịch khám!");
      }
      $("#modalEditAppointment .loading").hide();
    } catch (error) {
      console.error("Lỗi khi xử lý Xem lịch khám:", error);
    }
  });

  //Xử lý khi nhấn Sửa lịch khám
  $("#btnEditAppointment").click(function () {
    //Gọi hàm sửa lịch khám
    editAppointment();
  });

  //Xử lý khi nhấn Hủy lịch khám
  $("#btnCancel").click(function () {
    //Lấy lý do
    const reason = $("#modal-confirm-cancel #reason").val();
    // Kiểm tra nếu lý do trống
    if (!reason.trim()) {
      // Thêm class m-input-error vào ô input lý do
      $("#modal-confirm-cancel #reason").addClass("input-error");
      // Thêm thông báo title cho người dùng
      $("#modal-confirm-cancel #reason").attr("title", "Lý do từ chối không được để trống!");
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
});

//Lấy tất cả các dịch vụ
function getAllService(serviceSelect) {
  axiosJWT
    .get(`/api/Services`)
    .then(function (response) {
      dsDichVu = response.data;

      // Đổ dữ liệu vào select bác sĩ
      dsDichVu.forEach((item) => {
        const option = $("<option>").val(item.dichVuId).text(item.tenDichVu);
        serviceSelect.append(option);
      });
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}

//Xử lý Hủy lịch khám
function cancelAppointment(reason) {
  // Hiển thị trạng thái đang xử lý
  $("#modal-confirm-cancel #btnCancel")
    .prop("disabled", true)
    .text("Đang xử lý...");
  axiosJWT
  .post(
    `/api/v1/Appointments/cancel/${lichKham.lichKhamId}`,
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
      showPopup("success", "Thành công! Lịch khám đã được hủy.");
      $("#modal-confirm-cancel #btnCancel")
        .prop("disabled", false)
        .text("Đồng ý");
    })
    .catch(function (error) {
      $("#modal-confirm-cancel").modal("hide");
      showPopup("error", "Lỗi! Không thể hủy lịch khám.");
      $("#modal-confirm-cancel #btnCancel")
        .prop("disabled", false)
        .text("Đồng ý");
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

//Xử lý Thêm lịch khám mới
function editAppointment() {
  const patient = {
    maBenhNhan: "",
    hoTen: $("#modalEditAppointment #name-edit").val(),
    ngaySinh: $("#modalEditAppointment #dateOfBirth-edit").val(),
    loaiGioiTinh: parseInt($("#modalEditAppointment #gender-edit").val()),
    soDienThoai: $("#modalEditAppointment #phone-edit").val(),
    email: $("#modalEditAppointment #email-edit").val(),
    diaChi: $("#modalEditAppointment #address-edit").val(),
    tienSuBenhLy: $("#modalEditAppointment #message-edit").val(),
  };
  const appointment = {
    lichKhamId: lichKham.lichKhamId,
    benhNhanId: bn.benhNhanId,
    bacSiId: $("#modalEditAppointment #doctor-edit").val(),
    ngayKham: $("#modalEditAppointment #appointment-date-edit").val(),
    gioKham: $("#modalEditAppointment #appointment-time-edit").val(),
    trangThaiLichKham: "",
    dichVuId: $("#modalEditAppointment #service-edit").val(),
    benhNhan: patient,
  };
  //Check data hợp lệ
  checkData(appointment, "modalEditAppointment", "-edit");
}

// Hàm điền thông tin vào modal
function fillEditModal() {
  if (!lichKham) {
    console.error("Không có thông tin lịch khám để điền!");
    return;
  }
  // Điền thông tin lịch khám
  const formattedDate = lichKham.ngayKham
    ? new Date(lichKham.ngayKham).toLocaleDateString("en-CA") // Định dạng YYYY-MM-DD theo múi giờ cục bộ
    : "";
  $("#modalEditAppointment #appointment-date-edit").val(formattedDate);

  const doctorSelect = $("#modalEditAppointment #doctor-edit");
  const appointmentTimeSelect = $(
    "#modalEditAppointment #appointment-time-edit"
  );
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

    $("#modalEditAppointment #service-edit").val(lichKham.dichVuId);

  }
  if (
    lichKham.trangThaiLichKham === "Đã hủy" ||
    lichKham.trangThaiLichKham === "Hoàn thành"
  ) {
    $("#btnCancelAppointment").attr("disabled", true);
    $("#btnEditAppointment").attr("disabled", true);
  } else {
    $("#btnCancelAppointment").removeAttr("disabled");
    $("#btnEditAppointment").removeAttr("disabled");
  }
  // Xử lý thông tin bệnh nhân
  if (lichKham.benhNhanId) {
    axiosJWT
      .get(`/api/Patients/${lichKham.benhNhanId}`)
      .then((response) => {
        const benhNhan = response.data;
        $("#modalEditAppointment #name-edit").val(benhNhan.hoTen || "");
        $("#modalEditAppointment #phone-edit").val(benhNhan.soDienThoai || "");
        $("#modalEditAppointment #email-edit").val(benhNhan.email || "");
        $("#modalEditAppointment #gender-edit").val(
          benhNhan.loaiGioiTinh ?? ""
        );
        $("#modalEditAppointment #dateOfBirth-edit").val(
          benhNhan.ngaySinh
            ? new Date(benhNhan.ngaySinh).toLocaleDateString("en-CA") // Định dạng YYYY-MM-DD theo múi giờ cục bộ
            : ""
        );
        $("#modalEditAppointment #address-edit").val(benhNhan.diaChi || "");
        $("#modalEditAppointment #message-edit").val(
          benhNhan.tienSuBenhLy || ""
        );
      })
      .catch((error) => {
        console.error("Không lấy được thông tin bệnh nhân:", error);
        alert("Không thể lấy thông tin bệnh nhân!");
      });
  } else {
    // Đặt mặc định nếu không có bệnh nhân
    $("#modalEditAppointment #name-edit").val("");
    $("#modalEditAppointment #phone-edit").val("");
    $("#modalEditAppointment #email-edit").val("");
    $("#modalEditAppointment #gender-edit").val("");
    $("#modalEditAppointment #dateOfBirth-edit").val("");
    $("#modalEditAppointment #address-edit").val("");
    $("#modalEditAppointment #message-edit").val("");
  }
}

//Hàm lấy ra bệnh nhân theo userId
async function getPatientByUserId() {
  try {
    const response = await axiosJWT.get(`/api/Patients/getbyuserid/${userId}`);
    bn = response.data;
  } catch (error) {
    console.error("Lỗi không tìm được bệnh nhân: ", error);
  }
}

//Hàm lấy ra lịch khám gần nhất
async function getAppointmentLatest() {
  try {
    const response = await axiosJWT.get(
      `/api/v1/Appointments/appointment/${bn.benhNhanId}`
    );
    lichKham = response.data;
  } catch (error) {
    console.error("Lỗi không tìm được lịch khám: ", error);
  }
}

//Hàm xử lý đặt lịch khám
function registerAppointment() {
  const patient = {
    maBenhNhan: "",
    hoTen: $("#appointment #name").val(),
    ngaySinh: $("#appointment #dateOfBirth").val() || null,
    loaiGioiTinh: parseInt($("#appointment #gender").val()) || null,
    soDienThoai: $("#appointment #phone").val(),
    email: $("#appointment #email").val(),
    diaChi: $("#appointment #address").val(),
    tienSuBenhLy: $("#appointment #message").val(),
  };
  const appointment = {
    lichKhamId: "00c3e5ab-e2c2-4265-aea1-c97b08d80ba6",
    benhNhanId: bn.benhNhanId,
    bacSiId: $("#appointment #doctor").val(),
    ngayKham: $("#appointment #appointment-date").val(),
    gioKham: $("#appointment #appointment-time").val(),
    trangThaiLichKham: "",
    dichVuId:$("#appointment #service").val(),
    benhNhan: patient,
  };
  //Check data hợp lệ
  checkData(appointment, "appointment", "");
}

//Check Data hợp lệ
function checkData(appointment, formPrefix, str) {
  const errors = [];
  let firstErrorSelector = null; // Để lưu selector của lỗi đầu tiên
  const today = new Date().toISOString().split("T")[0]; // Ngày hiện tại

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
  if (!appointment.benhNhan.hoTen.trim()) {
    setError(`#${formPrefix} #name${str}`, "Họ tên không được để trống.");
  } else if (/\d/.test(appointment.benhNhan.hoTen)) {
    setError(`#${formPrefix} #name${str}`, "Họ tên không được chứa số.");
  } else {
    clearError(`#${formPrefix} #name${str}`);
  }

  // Kiểm tra ngày sinh
  if (appointment.benhNhan.ngaySinh) {
    if (appointment.benhNhan.ngaySinh >= today) {
      setError(
        `#${formPrefix} #dateOfBirth${str}`,
        "Ngày sinh phải nhỏ hơn ngày hiện tại."
      );
    } else {
      clearError(`#${formPrefix} #dateOfBirth${str}`);
    }
  } else {
    clearError(`#${formPrefix} #dateOfBirth${str}`);
  }

  // Kiểm tra số điện thoại
  if (!appointment.benhNhan.soDienThoai.trim()) {
    setError(
      `#${formPrefix} #phone${str}`,
      "Số điện thoại không được để trống."
    );
  } else if (/\D/.test(appointment.benhNhan.soDienThoai)) {
    setError(
      `#${formPrefix} #phone${str}`,
      "Số điện thoại không được chứa chữ."
    );
  } else {
    clearError(`#${formPrefix} #phone${str}`);
  }

  // Kiểm tra email
  if (!appointment.benhNhan.email.trim()) {
    setError(`#${formPrefix} #email${str}`, "Email không được để trống.");
  } else if (appointment.benhNhan.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(appointment.benhNhan.email)) {
      setError(`#${formPrefix} #email${str}`, "Email không đúng định dạng.");
    } else {
      clearError(`#${formPrefix} #email${str}`);
    }
  } else {
    clearError(`#${formPrefix} #email${str}`);
  }

  // Kiểm tra ngày khám
  if (!appointment.ngayKham.trim()) {
    setError(
      `#${formPrefix} #appointment-date${str}`,
      "Ngày khám không được để trống."
    );
  } else if (appointment.ngayKham < today) {
    setError(
      `#${formPrefix} #appointment-date${str}`,
      "Ngày khám không được nhỏ hơn ngày hiện tại."
    );
  } else {
    clearError(`#${formPrefix} #appointment-date${str}`);
  }
  // Kiểm tra bác sĩ
  if (!appointment.bacSiId) {
    setError(`#${formPrefix} #doctor${str}`, "Bác sĩ không được để trống.");
  } else {
    clearError(`#${formPrefix} #doctor${str}`);
  }

  // Kiểm tra ca khám
  if (!appointment.gioKham.trim()) {
    setError(
      `#${formPrefix} #appointment-time${str}`,
      "Ca khám không được để trống."
    );
  } else {
    clearError(`#${formPrefix} #appointment-time${str}`);
  }

  // Nếu có lỗi, hiển thị danh sách lỗi và focus vào lỗi đầu tiên
  if (errors.length > 0) {
    if (str === "-edit") {
      showErrorList("modalEditAppointment", errors, firstErrorSelector);
    } else {
      showErrorList("appointment", errors, firstErrorSelector);
    }

    // $(".sent-message").hide();
  } else {
    $(`#${formPrefix} .error-message`).hide();
    // Nếu không có lỗi, hiển thị thông báo thành công
    if (str === "-edit") {
      edit(appointment);
    } else {
      // $(".sent-message").show();
      register(appointment); // Hàm lưu dữ liệu
    }
  }
}

//Sửa lịch khám
function edit(appointment) {
  // Hiển thị trạng thái đang xử lý
  $("#modalEditAppointment .loading").show();
  // Gửi yêu cầu sửa tới API
  axiosJWT
    .put(`/api/v1/Appointments/${lichKham.lichKhamId}`, appointment)
    .then(function (response) {
      console.log("Sửa thành công:", response.data);
      // Hiển thị trạng thái thành công
      $("#modalEditAppointment .sent-message").show();
      $("#modalEditAppointment .loading").hide();
      setTimeout(function () {
        // Xóa nội dung trong các phần tử có class cụ thể
        $("#modalEditAppointment .sent-message").hide();
      }, 5000); // 5000ms = 5 giây
    })
    .catch(function (error) {
      console.error("Lỗi khi sửa lịch khám: ", error);
      $("#modalEditAppointment .sent-message").hide();
      $("#modalEditAppointment .loading").hide();
    });
}

//Lưu lịch khám
function register(appointment) {
  // Hiển thị trạng thái đang xử lý
  $("#appointment .loading").show();
  // Gửi yêu cầu đăng ký tới API
  axiosJWT
    .post(`/api/v1/Appointments`, appointment)
    .then(function (response) {
      console.log("Đăng ký thành công:", response.data);
      // Hiển thị trạng thái thành công
      $("#appointment .sent-message").show();
      $("#appointment .loading").hide();
      setTimeout(function () {
        // Xóa nội dung input
        $("#appointment input").val("");

        // Xóa lựa chọn trong select (trả về mặc định)
        $("#appointment select").prop("selectedIndex", 0);

        //Xóa nội dung trong text area
        $("#appointment #message").val("");

        // Xóa nội dung trong các phần tử có class cụ thể
        $("#appointment .sent-message").hide();
      }, 5000); // 5000ms = 5 giây
    })
    .catch(function (error) {
      console.error("Lỗi khi thêm lịch khám: ", error);
      $("#appointment .sent-message").hide();
      $("#appointment .loading").hide();
    });
}

//Hiển thị danh sách lỗi
function showErrorList(formPrefix, errors, firstErrorSelector) {
  const errorContent = $(`#${formPrefix} .error-message`);
  errorContent.empty(); // Xóa nội dung cũ

  // Thêm lỗi dạng danh sách <ul>
  const errorList = $("<ul></ul>");
  errors.forEach((error) => {
    errorList.append(`<li>${error}</li>`);
  });
  errorContent.append(errorList);

  // Hiển thị thông báo lỗi
  errorContent.show();

  // Focus vào ô có lỗi đầu tiên
  if (firstErrorSelector) {
    $(firstErrorSelector).focus();
  }
}

// Lấy toàn bộ Bác sĩ
function getAllDoctor(selectElement, appointmentTimeSelect) {
  axiosJWT
    .get(`/api/Doctors`)
    .then(function (response) {
      dsBacSi = response.data;

      // Đổ dữ liệu vào select bác sĩ
      dsBacSi.forEach((item) => {
        const option = $("<option>").val(item.bacSiId).text(item.hoTen);
        selectElement.append(option);
      });

      // Thêm sự kiện change
      selectElement.on("change", () => {
        addEventSelect(selectElement, dsBacSi, appointmentTimeSelect);
      });

      // Gọi hàm xử lý ban đầu
      addEventSelect(selectElement, dsBacSi, appointmentTimeSelect);
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });
}

//Tạo sự kiện khi chọn bác sĩ
function addEventSelect(selectElement, dsBacSi, appointmentTimeSelect) {
  const selectedDoctorId = selectElement.val();
  appointmentTimeSelect.html('<option value="">Chọn ca khám</option>'); // Reset giờ khám

  if (selectedDoctorId) {
    const selectedDoctor = dsBacSi.find(
      (doc) => doc.bacSiId == selectedDoctorId
    );
    if (selectedDoctor && selectedDoctor.gioLamViec) {
      const gioKhamArray = selectedDoctor.gioLamViec
        .split(",")
        .map((time) => time.trim());
      gioKhamArray.forEach((time) => {
        const timeOption = $("<option>").val(time).text(time);
        appointmentTimeSelect.append(timeOption);
      });
      appointmentTimeSelect.removeAttr("disabled");
    } else {
      appointmentTimeSelect.attr("disabled", true); // Disable nếu không có giờ khám
    }
  } else {
    appointmentTimeSelect.attr("disabled", true); // Disable nếu chưa chọn bác sĩ
  }
}

// Lấy toàn bộ khoa
function getAllDepartment(
  selectElement,
  doctorSelect,
  appointmentTimeSelect,
  serviceSelect
) {
  axiosJWT
    .get(`/api/v1/Departments`)
    .then(function (response) {
      const dsKhoa = response.data;

      // Đổ dữ liệu vào select khoa
      dsKhoa.forEach((item) => {
        const option = $("<option>").val(item.khoaId).text(item.tenKhoa);
        selectElement.append(option);
      });
    })
    .catch(function (error) {
      console.error("Lỗi không tìm được:", error);
    });

  // Lắng nghe sự kiện khi chọn Khoa
  selectElement.on("change", function () {
    const selectedKhoaId = selectElement.val();

    // Xóa các bác sĩ và dịch vụ cũ
    doctorSelect.html('<option value="">Chọn bác sĩ</option>');
    appointmentTimeSelect.html('<option value="">Chọn ca khám</option>');
    serviceSelect.html('<option value="">Chọn dịch vụ</option>'); // Reset dịch vụ

    if (selectedKhoaId) {
      // Lấy danh sách Bác sĩ theo Khoa
      axiosJWT
        .get(`/api/Doctors/doctor/${selectedKhoaId}`)
        .then(function (response) {
          const dsBacSi = response.data;

          // Đổ dữ liệu vào select bác sĩ
          dsBacSi.forEach((item) => {
            const option = $("<option>").val(item.bacSiId).text(item.hoTen);
            doctorSelect.append(option);
          });

          // Lắng nghe sự kiện chọn bác sĩ
          doctorSelect.off("change").on("change", function () {
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

          // Đổ dữ liệu vào select dịch vụ
          dsDichVu.forEach((item) => {
            const option = $("<option>")
              .val(item.dichVuId)
              .text(item.tenDichVu);
            serviceSelect.append(option);
          });
        })
        .catch(function (error) {
          console.error("Lỗi không tìm được dịch vụ:", error);
        });
    } else {
      // Nếu không chọn khoa, lấy toàn bộ bác sĩ và dịch vụ
      getAllDoctor(doctorSelect, appointmentTimeSelect);
      getAllService(serviceSelect);
    }
  });
}
