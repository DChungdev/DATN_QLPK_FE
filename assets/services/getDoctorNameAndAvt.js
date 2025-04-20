// Declare doctor variable to avoid conflicts with other scripts
var headerDoctor = null;

$(document).ready(function(){
  getDoctorInfo();
});


function getDoctorInfo() {
  axiosJWT
      .get(`/api/doctors/findbyUsername/${localStorage.getItem("doctorName")}`)
      .then(function (response) {
          headerDoctor = response.data;
          updateAvatar();
          updateDoctorName();
      })
      .catch(function (error) {
          console.error("Error fetching doctor information:", error);
          console.log("Error details:", error.response || error.message);
      });
}

// Update avatar image
function updateAvatar() {
  if (headerDoctor && headerDoctor.image) {
      $('#avatar').attr('src', "http://localhost:8080" + headerDoctor.image);
  }
}

// Update doctor name in header
function updateDoctorName() {
  if (headerDoctor && headerDoctor.fullName) {
      $('#nameDoctor').text(headerDoctor.fullName);
  }
}