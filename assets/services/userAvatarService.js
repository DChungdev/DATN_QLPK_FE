// Function to get and display user avatar
function getUserAvatar() {
    axiosJWT
        .get(`/api/patients/findbyUsername/${localStorage.getItem("userName")}`)
        .then(function (response) {
            const patient = response.data;
            console.log("Patient data:", patient);
            if (patient.image) {
                // Update avatar in header
                $("#avatar").attr("src", "http://localhost:8080" + patient.image);
                // Update avatar in sidebar if exists
                $("#uploadedImage").attr("src", "http://localhost:8080" + patient.image);
            }
        })
        .catch(function (error) {
            console.error("Error fetching patient data:", error);
        });
}

// Call this function when document is ready
$(document).ready(function() {
    getUserAvatar();
}); 