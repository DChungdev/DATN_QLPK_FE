var userId = localStorage.getItem("userId");
var appointmentId = "";
$(document).ready(function () {
  console.log("User ID:", userId);

  // Get user avatar and appointment data when page loads
  getAppointmentData();

  // Listen for click events on option buttons
  $(document).on("click", ".optionButton", function () {
    // Find the closest parent with class .custom-card
    const parentCard = $(this).closest(".custom-card");

    // Get the appointmentId from the parent element
    appointmentId = parentCard.attr("appointmentId");
    console.log("Selected appointment ID:", appointmentId);
  });

  // Handle cancel confirmation button
  $("#btnCancel").click(function () {
    // Get reason
    const reason = $("#modal-confirm-cancel #reason").val();
    // Check if reason is empty
    if (!reason.trim()) {
      // Add error class to reason input
      $("#modal-confirm-cancel #reason").addClass("input-error");
      // Add title message for the user
      $("#modal-confirm-cancel #reason").attr(
        "title",
        "Lý do từ chối không được để trống!"
      );
      // Focus on input
      $("#modal-confirm-cancel #reason").focus();
    } else {
      // Remove error message if reason is not empty
      $("#modal-confirm-cancel #reason").removeClass("input-error");
      $("#modal-confirm-cancel #reason").removeAttr("title");
      // Call API to cancel appointment
      cancelAppointment(reason);
    }
  });

  // Handle delete confirmation button
  $("#btnDelete").click(function () {
    console.log("Deleting appointment:", appointmentId);
    // Call API to delete appointment
    deleteAppointment();
  });

  // Handle complete confirmation button
  $("#btnComplete").click(function () {
    console.log("Completing appointment:", appointmentId);
    // Call API to complete appointment
    completeAppointment();
  });

  // Handle view result option
  $(document).on("click", "#optionViewResult", function () {
    getResultAppointment();
  });

  // Thêm sự kiện click cho nút xem lý do hủy
  $(document).on("click", ".m-view-cancel", function () {
    const cancelBy = $(this).data('cancel-by');
    const cancelReason = $(this).data('cancel-reason');
    viewCancelReason(cancelBy, cancelReason);
  });
});

// Fetch appointment data with user ID from localStorage
function getAppointmentData() {
  // First, get the user avatar
  getUserAvatar();
  
  // Then get appointment data directly using userId from localStorage
  if (userId) {
    getAllAppointmentsByUserId(userId);
  } else {
    console.error("No user ID found in localStorage");
    showPopup("error", "Lỗi! Không tìm thấy thông tin người dùng.");
  }
}

// Get user avatar
function getUserAvatar() {
  axiosJWT
    .get(`/api/patients/findbyUsername/${localStorage.getItem("userName")}`)
    .then(function (response) {
      const patient = response.data;
      console.log("Patient data:", patient);
      if (patient.image) {
        $("#avatar").attr("src", "http://localhost:8080" + patient.image);
      }
    })
    .catch(function (error) {
      console.error("Error fetching patient data:", error);
    });
}

// Complete an appointment
function completeAppointment() {
  axiosJWT
    .put(`/api/appointments/${appointmentId}/status/completed`)
    .then(function (response) {
      console.log("Appointment completed successfully:", response.data);
      showPopup("success", "Thành công! Lịch khám đã được hoàn thành.");
      $("#modal-confirm-complete").modal("hide");
      getAppointmentData();
    })
    .catch(function (error) {
      showPopup("error", "Lỗi! Không thể hoàn thành lịch khám.");
      console.error("Error completing appointment:", error);
    });
}

// Get medical result for an appointment
async function getResultAppointment() {
  try {
    const response = await axiosJWT.get(`/api/medical-results/appointment/${appointmentId}`);
    const result = response.data;
    fillViewModal(result);
  } catch (error) {
    console.error("Error fetching medical results:", error);
    showPopup("error", "Lỗi! Không thể lấy kết quả khám.");
  }
}

// Fill the view modal with medical result data
function fillViewModal(result) {
  if (!result) {
    showPopup("error", "Lỗi! Không có kết quả khám!");
    return;
  }
  
  $("#diagnose").val(result.diagnosis || "Không có thông tin");
  $("#prescription").val(result.treatmentPlan || "Không có thông tin");
  $("#note").val(result.notes || "Không có thông tin");
}

// Delete an appointment
function deleteAppointment() {
  $("#btnDelete").prop("disabled", true).text("Đang xóa...");
  
  axiosJWT
    .delete(`/api/appointments/${appointmentId}`)
    .then(function (response) {
      console.log("Appointment deleted successfully:", response.data);
      showPopup("success", "Thành công! Lịch khám đã được xóa.");
      $("#modal-confirm-delete").modal("hide");
      $("#btnDelete").prop("disabled", false).text("Có");
      getAppointmentData();
    })
    .catch(function (error) {
      showPopup("error", "Lỗi! Không thể xóa lịch khám.");
      $("#btnDelete").prop("disabled", false).text("Có");
      console.error("Error deleting appointment:", error);
    });
}

// Cancel an appointment
function cancelAppointment(reason) {
  $("#btnCancel").prop("disabled", true).text("Đang xử lý...");
  
  axiosJWT
    .post(
      `/api/appointments/${appointmentId}/cancel`,
      { 
        cancelReason: reason,
        cancelBy: "patient"
      }
    )
    .then(function (response) {
      console.log("Appointment cancelled successfully:", response.data);
      showPopup("success", "Thành công! Lịch khám đã được hủy.");
      $("#modal-confirm-cancel").modal("hide");
      $("#btnCancel").prop("disabled", false).text("Có");
      // Lấy userId từ localStorage và gọi lại API
      const userId = localStorage.getItem("userId");
      if (userId) {
        getAllAppointmentsByUserId(userId);
      }
    })
    .catch(function (error) {
      showPopup("error", "Lỗi! Không thể hủy lịch khám.");
      $("#modal-confirm-cancel").modal("hide");
      $("#btnCancel").prop("disabled", false).text("Có");
      console.error("Error cancelling appointment:", error);
    });
}

// Show popup notification
function showPopup(type, message) {
  const popupItem = $(`.m-popup-item.m-popup-${type}`);

  // Clear previous content
  popupItem.find(".m-popup-text").empty();

  // Update notification content
  const [title, detail] = message.split("! ");
  popupItem
    .find(".m-popup-text")
    .append(`<span>${title}! </span>`)
    .append(detail);

  // Show popup
  popupItem.addClass("show");

  // Hide popup after 3 seconds
  setTimeout(() => {
    popupItem.removeClass("show");
  }, 3000);

  // Ensure popup closes when user clicks close button
  popupItem.find(".m-popup-close").on("click", function () {
    popupItem.removeClass("show");
  });
}

// Get appointments by user ID
function getAllAppointmentsByUserId(userId) {
  axiosJWT
    .get(`/api/appointments/patient/${userId}`)
    .then(function (response) {
      const appointments = response.data;
      console.log("Appointments data:", appointments);
      displayAppointments(appointments);
    })
    .catch(function (error) {
      console.error("Error fetching appointments:", error);
      showPopup("error", "Lỗi! Không thể lấy danh sách lịch khám.");
    });
}

// Get badge class based on status
function getBadgeClass(status) {
  switch (status) {
    case "pending":
      return "badge-booked";
    case "confirmed":
      return "bg-primary";
    case "canceled":
      return "bg-danger";
    case "completed":
      return "bg-success";
    default:
      return "bg-secondary";
  }
}

// Get status text based on status code
function getStatusText(status) {
  switch (status) {
    case "pending":
      return "Chờ xử lý";
    case "confirmed":
      return "Đã xác nhận";
    case "canceled":
      return "Đã hủy";
    case "completed":
      return "Hoàn thành";
    default:
      return "Không xác định";
  }
}

// Get doctor name by ID
async function getDoctorName(doctorId) {
  try {
    const response = await axiosJWT.get(`/api/doctors/${doctorId}`);
    const doctor = response.data;
    return doctor.fullName;
  } catch (error) {
    console.error(`Error fetching doctor with ID ${doctorId}:`, error);
    return "Không xác định";
  }
}

// Format date from ISO string to dd/MM/yyyy
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

// Format time from ISO string to HH:mm
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

// Format currency with Vietnamese format
function formatCurrency(amount) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// Get service names by their IDs
async function getServiceNames(serviceIds) {
  if (!serviceIds || serviceIds.length === 0) {
    return "Không có dịch vụ";
  }
  
  try {
    const response = await axiosJWT.get("/api/services");
    const services = response.data;
    
    const serviceNames = serviceIds.map(id => {
      const service = services.find(s => s.id === id);
      return service ? service.name : `Dịch vụ ${id}`;
    });
    
    return serviceNames.join(", ");
  } catch (error) {
    console.error("Error fetching services:", error);
    return serviceIds.join(", ");
  }
}

// Display all appointments
async function displayAppointments(appointments) {
  const container = $("#container_lk .row");
  container.empty();
  
  if (!appointments || appointments.length === 0) {
    container.append('<div class="col-12 text-center mt-5"><h4>Không có lịch sử khám</h4></div>');
    return;
  }
  
  // Process all appointments in parallel
  const processedAppointments = await Promise.all(
    appointments.map(async (appointment) => {
      const doctorName = await getDoctorName(appointment.doctorId);
      const serviceNames = await getServiceNames(appointment.serviceIds);
      
      return {
        ...appointment,
        doctorName,
        serviceNames,
        formattedDate: formatDate(appointment.appointmentDate),
        formattedTime: formatTime(appointment.appointmentDate),
        appointmentTimestamp: new Date(appointment.appointmentDate).getTime()
      };
    })
  );
  
  // Sort appointments by date (newest first)
  processedAppointments.sort((a, b) => b.appointmentTimestamp - a.appointmentTimestamp);
  
  // Create a new row every 3 appointments for proper grid layout
  let currentRow;
  
  // Display each appointment
  processedAppointments.forEach((appointment, index) => {
    // Create a new row every 3 appointments
    if (index % 3 === 0) {
      currentRow = $('<div class="row mb-3"></div>');
      container.append(currentRow);
    }
    
    const status = appointment.status;
    const statusText = getStatusText(status);
    
    // Determine which buttons to enable/disable based on status
    const viewResultDisabled = status !== "completed" ? "disabled" : "";
    const cancelDisabled = (status !== "pending" && status !== "confirmed") ? "disabled" : "";
    
    const card = $(`
      <div class="col-md-4 mb-4">
        <div class="card custom-card" appointmentId="${appointment.appointmentId}">
          <div class="d-flex justify-content-between align-items-start">
            <span class="badge rounded-pill ${getBadgeClass(status)}" style="min-width: 80px">
              ${statusText}
            </span>
            <span class="dropdown">
              <button class="optionButton btn btn-link dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-ellipsis-v"></i>
              </button>
              <ul class="dropdown-menu">
                <li>
                  <div id="optionViewResult" class="dropdown-item ${viewResultDisabled}" data-bs-target="#modal-view-result" data-bs-toggle="modal">
                    <i class="fas fa-eye me-2" style="color: rgb(28, 212, 212)"></i> Xem kết quả khám
                  </div>
                </li>
                <li>
                  <div class="dropdown-item ${cancelDisabled}" data-bs-target="#modal-confirm-cancel" data-bs-toggle="modal">
                    <i class="fas fa-times-circle me-2" style="color: rgb(255, 123, 0)"></i> Hủy lịch khám
                  </div>
                </li>
                <li>
                  <div class="dropdown-item m-view-cancel" data-bs-target="#dialog-view-cancel" data-bs-toggle="modal" style="display: ${status === 'canceled' ? 'block' : 'none'}" 
                    data-cancel-by="${appointment.cancelBy}"
                    data-cancel-reason="${appointment.cancelReason}">
                    <i class="fas fa-info-circle me-2" style="color: rgb(255, 193, 7)"></i> Xem lý do hủy
                  </div>
                </li>
              </ul>
            </span>
          </div>
          <div class="mt-2">
            <h5 class="mb-1">Bác sĩ: ${appointment.doctorName}</h5>
            <p class="mb-1">Ngày khám: ${appointment.formattedDate}</p>
            <p class="mb-1">Giờ khám: ${appointment.formattedTime}</p>
            <p class="mb-1">Lý do khám: ${appointment.reason || "Không có"}</p>
            <p class="mb-1">Phí khám: ${formatCurrency(appointment.baseFee)}</p>
            <p class="mb-1">Tổng phí: ${formatCurrency(appointment.totalFee)}</p>
            <p class="mb-0">Dịch vụ: ${appointment.serviceNames}</p>
          </div>
        </div>
      </div>
    `);
    
    // Add the card to the current row
    currentRow.append(card);
  });
}

// Hàm xem lý do hủy
function viewCancelReason(cancelBy, cancelReason) {
  // Hiển thị thông tin hủy
  const cancelByText = cancelBy === "doctor" ? "Bác sĩ" : "Bệnh nhân";
  $("#view-cancel-by").text(cancelByText);
  $("#view-cancel-reason").text(cancelReason || "Không có lý do");
}
