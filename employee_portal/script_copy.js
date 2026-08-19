/* =====================================================
   CIVIC CONNECT - USER PORTAL
===================================================== */


/* =====================================================
   DEMO COMPLAINT DATA
===================================================== */

let complaints = [

    {
        id: "CIV-1003",

        title: "Street light not working",

        category: "Street Light",

        location: "Kalyanpur",

        status: "Resolved",

        priority: "Medium",

        date: "10 Aug 2026",

        department: "Electrical Department"
    },

    {
        id: "CIV-1002",

        title: "Garbage overflowing near market",

        category: "Garbage",

        location: "Swaroop Nagar",

        status: "In Progress",

        priority: "High",

        date: "09 Aug 2026",

        department: "Sanitation Department"
    },

    {
        id: "CIV-1001",

        title: "Large pothole on main road",

        category: "Road / Pothole",

        location: "Panki",

        status: "Pending",

        priority: "High",

        date: "08 Aug 2026",

        department: "Road Department"
    }

];


/* =====================================================
   BOOTSTRAP MODALS
===================================================== */

const complaintModalElement =
    document.getElementById("complaintModal");

const emergencyModalElement =
    document.getElementById("emergencyModal");

const complaintModal =
    new bootstrap.Modal(complaintModalElement);

const emergencyModal =
    new bootstrap.Modal(emergencyModalElement);


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        renderComplaints();

        updateStatistics();

    }
);


/* =====================================================
   RENDER COMPLAINTS
===================================================== */

function renderComplaints(list = complaints) {

    const container =
        document.getElementById("complaintsContainer");


    if (list.length === 0) {

        container.innerHTML = `

            <div class="text-center py-5">

                <i
                    class="bi bi-file-earmark-x"
                    style="font-size:45px;color:#94a3b8"
                ></i>

                <h5 class="mt-3">
                    No complaints found
                </h5>

                <p class="text-secondary">
                    Try another search.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML = list.map(
        complaint => createComplaintHTML(complaint)
    ).join("");

}


/* =====================================================
   CREATE COMPLAINT HTML
===================================================== */

function createComplaintHTML(complaint) {

    let statusClass = "";

    let statusIcon = "";


    if (complaint.status === "Pending") {

        statusClass = "status-pending";

        statusIcon =
            "bi-hourglass-split";

    }

    else if (complaint.status === "In Progress") {

        statusClass = "status-progress";

        statusIcon =
            "bi-arrow-repeat";

    }

    else if (complaint.status === "Resolved") {

        statusClass = "status-resolved";

        statusIcon =
            "bi-check-circle";

    }


    return `

        <div class="complaint-item">

            <div
                class="d-flex
                       justify-content-between
                       align-items-start
                       gap-3"
            >

                <div>

                    <div class="complaint-title">

                        ${escapeHTML(complaint.title)}

                    </div>


                    <div class="complaint-meta">

                        ${complaint.id}

                        <span class="mx-1">
                            •
                        </span>

                        ${escapeHTML(complaint.category)}

                        <span class="mx-1">
                            •
                        </span>

                        <i class="bi bi-geo-alt"></i>

                        ${escapeHTML(complaint.location)}

                    </div>

                </div>


                <span
                    class="status-badge ${statusClass}"
                >

                    <i class="bi ${statusIcon}"></i>

                    ${complaint.status}

                </span>

            </div>


            <div
                class="d-flex
                       justify-content-between
                       align-items-center
                       mt-3"
            >

                <div class="complaint-meta">

                    ${complaint.date}

                    <span class="mx-1">
                        •
                    </span>

                    ${complaint.priority} priority

                </div>


                <button
                    class="btn btn-sm btn-outline-primary"
                    onclick="viewComplaint('${complaint.id}')"
                >

                    <i class="bi bi-eye"></i>

                    View

                </button>

            </div>

        </div>

    `;

}


/* =====================================================
   STATISTICS
===================================================== */

function updateStatistics() {

    const total =
        complaints.length;


    const pending =
        complaints.filter(
            complaint =>
                complaint.status === "Pending"
        ).length;


    const progress =
        complaints.filter(
            complaint =>
                complaint.status === "In Progress"
        ).length;


    const resolved =
        complaints.filter(
            complaint =>
                complaint.status === "Resolved"
        ).length;


    document.getElementById(
        "totalComplaints"
    ).textContent = total;


    document.getElementById(
        "pendingComplaints"
    ).textContent = pending;


    document.getElementById(
        "progressComplaints"
    ).textContent = progress;


    document.getElementById(
        "resolvedComplaints"
    ).textContent = resolved;

}


/* =====================================================
   OPEN COMPLAINT MODAL
===================================================== */

function openComplaintModal() {

    complaintModal.show();

}


/* =====================================================
   OPEN EMERGENCY MODAL
===================================================== */

function openEmergencyModal() {

    emergencyModal.show();

}


/* =====================================================
   SUBMIT COMPLAINT
===================================================== */

function submitComplaint() {

    const title =
        document.getElementById(
            "complaintTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "complaintCategory"
        ).value;


    const description =
        document.getElementById(
            "complaintDescription"
        ).value.trim();


    const location =
        document.getElementById(
            "complaintLocation"
        ).value.trim();


    const priority =
        document.getElementById(
            "complaintPriority"
        ).value;


    if (
        title === "" ||
        category === "" ||
        description === "" ||
        location === ""
    ) {

        showNotification(
            "Please fill all required fields."
        );

        return;
    }


    /*
       Generate demo complaint ID.

       In the real Spring Boot backend,
       this ID should be generated by
       the database/backend.
    */

    const newId =
        generateComplaintId();


    const today =
        new Date().toLocaleDateString(
            "en-GB",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );


    const newComplaint = {

        id: newId,

        title: title,

        category: category,

        location: location,

        status: "Pending",

        priority: priority,

        date: today,

        department:
            "Pending AI Assignment",

        description: description

    };


    complaints.unshift(
        newComplaint
    );


    renderComplaints();

    updateStatistics();


    /*
       Reset form
    */

    document
        .getElementById("complaintForm")
        .reset();


    document
        .getElementById(
            "imagePreviewContainer"
        )
        .innerHTML = "";


    document
        .getElementById(
            "locationStatus"
        )
        .textContent = "";


    complaintModal.hide();


    showNotification(
        `Complaint ${newId} submitted successfully.`
    );


    /*
       Future Spring Boot API:

       fetch(
           "http://localhost:8080/api/complaints",
           {
               method: "POST",
               headers: {
                   "Authorization":
                       "Bearer " + token
               },
               body: formData
           }
       );
    */

}


/* =====================================================
   GENERATE COMPLAINT ID
===================================================== */

function generateComplaintId() {

    let maxNumber = 1000;


    complaints.forEach(
        complaint => {

            const number =
                parseInt(
                    complaint.id.replace(
                        "CIV-",
                        ""
                    )
                );


            if (
                !isNaN(number) &&
                number > maxNumber
            ) {

                maxNumber = number;

            }

        }
    );


    return "CIV-" +
        (maxNumber + 1);

}


/* =====================================================
   EMERGENCY SUBMISSION
===================================================== */

function submitEmergency() {

    const type =
        document.getElementById(
            "emergencyType"
        ).value;


    const description =
        document.getElementById(
            "emergencyDescription"
        ).value.trim();


    const location =
        document.getElementById(
            "emergencyLocation"
        ).value.trim();


    if (
        description === "" ||
        location === ""
    ) {

        showNotification(
            "Please enter emergency description and location."
        );

        return;

    }


    emergencyModal.hide();


    showNotification(
        `Emergency report for ${type} submitted.`
    );


    /*
       In the real system:

       POST /api/emergency

       Backend should immediately:

       1. Create emergency complaint
       2. Set priority = EMERGENCY
       3. Notify appropriate authority
       4. Send notification to control room
       5. Track response
    */

}


/* =====================================================
   SEARCH
===================================================== */

function searchComplaints() {

    const search =
        document
            .getElementById(
                "searchInput"
            )
            .value
            .toLowerCase()
            .trim();


    if (search === "") {

        renderComplaints();

        return;

    }


    const filtered =
        complaints.filter(
            complaint => {

                const data =
                    (
                        complaint.id +
                        " " +
                        complaint.title +
                        " " +
                        complaint.category +
                        " " +
                        complaint.location +
                        " " +
                        complaint.status
                    ).toLowerCase();


                return data.includes(
                    search
                );

            }
        );


    renderComplaints(
        filtered
    );

}


/* =====================================================
   VIEW COMPLAINT
===================================================== */

function viewComplaint(id) {

    const complaint =
        complaints.find(
            item =>
                item.id === id
        );


    if (!complaint) {

        showNotification(
            "Complaint not found."
        );

        return;

    }


    const message =

        `Complaint ID: ${complaint.id}\n\n` +

        `Title: ${complaint.title}\n` +

        `Category: ${complaint.category}\n` +

        `Location: ${complaint.location}\n` +

        `Priority: ${complaint.priority}\n` +

        `Status: ${complaint.status}\n` +

        `Department: ${complaint.department}`;


    alert(message);

}


/* =====================================================
   IMAGE PREVIEW
===================================================== */

function previewImage(event) {

    const file =
        event.target.files[0];


    const container =
        document.getElementById(
            "imagePreviewContainer"
        );


    container.innerHTML = "";


    if (!file) {

        return;

    }


    if (
        !file.type.startsWith(
            "image/"
        )
    ) {

        showNotification(
            "Please select an image file."
        );

        event.target.value = "";

        return;

    }


    const reader =
        new FileReader();


    reader.onload =
        function (e) {

            container.innerHTML = `

                <img
                    src="${e.target.result}"
                    class="preview-image"
                    alt="Complaint Preview"
                >

            `;

        };


    reader.readAsDataURL(
        file
    );

}


/* =====================================================
   GET USER LOCATION
===================================================== */

function getLocation() {

    const status =
        document.getElementById(
            "locationStatus"
        );


    if (
        !navigator.geolocation
    ) {

        status.textContent =
            "Geolocation is not supported.";

        return;

    }


    status.textContent =
        "Detecting location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;


            const longitude =
                position.coords.longitude;


            status.textContent =
                `Location detected: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;


            /*
               Real application:

               Send latitude and longitude
               to Spring Boot.

               Example:

               {
                   latitude: latitude,
                   longitude: longitude
               }

               You can later reverse-geocode
               these coordinates into an address.
            */

        },

        function () {

            status.textContent =
                "Unable to detect location.";

        }

    );

}


/* =====================================================
   SCROLL TO PROFILE
===================================================== */

function scrollToProfile() {

    document
        .getElementById("profile")
        .scrollIntoView({
            behavior: "smooth"
        });

}


/* =====================================================
   LOGOUT
===================================================== */

function logout() {

    /*
       When JWT authentication is implemented:

       localStorage.removeItem("token");

       window.location.href =
           "/login.html";
    */

    showNotification(
        "Logout will be connected to Spring Security/JWT."
    );

}


/* =====================================================
   NOTIFICATION
===================================================== */

let notificationTimer;


function showNotification(message) {

    const notification =
        document.getElementById(
            "notification"
        );


    notification.textContent =
        message;


    notification.classList.add(
        "show"
    );


    clearTimeout(
        notificationTimer
    );


    notificationTimer =
        setTimeout(
            function () {

                notification.classList.remove(
                    "show"
                );

            },

            3000
        );

}


/* =====================================================
   HTML SECURITY HELPER
===================================================== */

function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}