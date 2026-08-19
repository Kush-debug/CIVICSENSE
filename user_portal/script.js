/* =====================================================
   CIVIC CONNECT (SCISM) - CITIZEN PORTAL SCRIPT
   Full GIS Civic Map, Hotspots & Grievance Management
===================================================== */

const session = requireAuth("CITIZEN");
if (!session) throw new Error("Unauthorized");

// DOM Elements
const complaintList = document.getElementById("complaintList");
const searchComplaintInput = document.getElementById("searchComplaintInput");
const openComplaintModalBtn = document.getElementById("openComplaintModalBtn");
const closeComplaintModalBtn = document.getElementById("closeComplaintModalBtn");
const complaintModal = document.getElementById("complaintModal");
const complaintForm = document.getElementById("complaintForm");
const complaintPhotoInput = document.getElementById("complaintPhoto");
const photoPreviewBox = document.getElementById("photoPreviewBox");
const photoPreviewImg = document.getElementById("photoPreviewImg");
const quickTrackInput = document.getElementById("quickTrackInput");
const quickTrackBtn = document.getElementById("quickTrackBtn");
const logoutBtn = document.getElementById("logoutBtn");

// Slip Modal Elements
const acknowledgmentModal = document.getElementById("acknowledgmentModal");
const closeAckModalBtn = document.getElementById("closeAckModalBtn");
const printSlipBtn = document.getElementById("printSlipBtn");

// Feedback Modal Elements
const feedbackModal = document.getElementById("feedbackModal");
const closeFeedbackModalBtn = document.getElementById("closeFeedbackModalBtn");
const feedbackForm = document.getElementById("feedbackForm");
const starContainer = document.getElementById("starContainer");
const feedbackComplaintIdInput = document.getElementById("feedbackComplaintId");

// State Caches
let myComplaintsCache = [];
let allCityComplaintsCache = [];
let selectedRatingScore = 5;

// GIS Map Variables
let citizenMap = null;
let markersLayer = null;
let hotspotsLayer = null;
let currentMapFilter = "all";
let complaintMarkersMap = {};

// Modal Pin Picker Map
let modalPickerMap = null;
let modalPickerMarker = null;

// ==========================================
// 1. PROFILE & INITIALIZATION
// ==========================================

function initProfile() {
    document.getElementById("userBadge").textContent = session.name || "Citizen";
    document.getElementById("profileName").textContent = session.name || "Citizen User";
    document.getElementById("profileEmail").textContent = session.email || "";
    document.getElementById("profilePhone").textContent = session.phone || "+91 98765 43210";
    document.getElementById("profileWard").textContent = session.ward_no || "Ward 42 - Kalyanpur";
    document.getElementById("profileCityState").textContent = `${session.city || "Kanpur"}, ${session.state || "Uttar Pradesh"}`;
    document.getElementById("profileAvatar").textContent = (session.name || "C").charAt(0).toUpperCase();

    const defWardSelect = document.getElementById("complaintWard");
    if (defWardSelect && session.ward_no) {
        defWardSelect.value = session.ward_no;
    }
}
initProfile();

// Logout
logoutBtn.addEventListener("click", logout);

// ==========================================
// 2. DATA REFRESH & STATS
// ==========================================

// Fetch Citizen's Grievances
async function refreshComplaints() {
    try {
        const all = await apiFetchComplaints({ userId: session.id });
        myComplaintsCache = all;
        updateStats(all);
        renderComplaintsList(getFilteredList());
    } catch (e) {
        console.error("Error loading citizen complaints:", e);
    }
}

// Fetch All City Complaints for City-Wide GIS Map & Hotspots
async function refreshCityMapComplaints() {
    try {
        const allCity = await apiFetchComplaints();
        allCityComplaintsCache = allCity;

        // Update Map Badge Counts
        const countAllEl = document.getElementById("mapCountAll");
        const countOpenEl = document.getElementById("mapCountOpen");
        if (countAllEl) countAllEl.textContent = allCity.length;
        if (countOpenEl) {
            const openCount = allCity.filter(c => c.status !== "Resolved" && c.status !== "Rejected").length;
            countOpenEl.textContent = openCount;
        }

        renderGisMapMarkers();
    } catch (e) {
        console.error("Error loading city GIS complaints:", e);
    }
}

// Update Metric Cards
function updateStats(list) {
    const total = list.length;
    const pending = list.filter(c => c.status === "Pending" || c.status === "Under Review").length;
    const inProgress = list.filter(c => c.status === "In Progress").length;
    const resolved = list.filter(c => c.status === "Resolved").length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statPending").textContent = pending;
    document.getElementById("statProgress").textContent = inProgress;
    document.getElementById("statResolved").textContent = resolved;
}

// Filter Complaints by Search
function getFilteredList() {
    const term = (searchComplaintInput.value || "").trim().toLowerCase();
    if (!term) return myComplaintsCache;
    return myComplaintsCache.filter(c => {
        return (
            c.id.toLowerCase().includes(term) ||
            c.title.toLowerCase().includes(term) ||
            c.category.toLowerCase().includes(term) ||
            c.ward_no.toLowerCase().includes(term) ||
            (c.landmark && c.landmark.toLowerCase().includes(term)) ||
            c.status.toLowerCase().includes(term)
        );
    });
}

// ==========================================
// 3. 5-STAGE AUDIT TIMELINE HTML
// ==========================================

function renderTimelineHtml(status) {
    let stage1 = "step-completed";
    let stage2 = "";
    let stage3 = "";
    let stage4 = "";
    let stage5 = "";

    if (status === "Under Review") {
        stage2 = "step-active";
    } else if (status === "In Progress") {
        stage2 = "step-completed";
        stage3 = "step-completed";
        stage4 = "step-active";
    } else if (status === "Resolved") {
        stage2 = "step-completed";
        stage3 = "step-completed";
        stage4 = "step-completed";
        stage5 = "step-completed";
    } else if (status === "Pending") {
        stage1 = "step-active";
    }

    return `
        <div class="gov-timeline-box">
            <div class="gov-timeline-title">
                <span>Grievance Audit Lifecycle</span>
                <span style="color: var(--gov-saffron-600); font-weight: 700;">Status: ${escapeHTML(status)}</span>
            </div>
            <div class="gov-timeline-steps">
                <div class="gov-timeline-step ${stage1}">
                    <div class="gov-step-circle">1</div>
                    <div class="gov-step-label">Lodged</div>
                </div>
                <div class="gov-timeline-step ${stage2}">
                    <div class="gov-step-circle">2</div>
                    <div class="gov-step-label">Review</div>
                </div>
                <div class="gov-timeline-step ${stage3}">
                    <div class="gov-step-circle">3</div>
                    <div class="gov-step-label">Assigned</div>
                </div>
                <div class="gov-timeline-step ${stage4}">
                    <div class="gov-step-circle">4</div>
                    <div class="gov-step-label">Action</div>
                </div>
                <div class="gov-timeline-step ${stage5}">
                    <div class="gov-step-circle">5</div>
                    <div class="gov-step-label">Resolved</div>
                </div>
            </div>
        </div>
    `;
}

// ==========================================
// 4. RENDER GRIEVANCE LIST TO DOM
// ==========================================

function renderComplaintsList(list) {
    complaintList.innerHTML = "";

    if (list.length === 0) {
        complaintList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--gov-text-muted);">
                <div style="font-size: 3rem; margin-bottom: 10px;">📋</div>
                <h3 style="color: var(--gov-navy-900); margin-bottom: 6px;">No Grievances Found</h3>
                <p style="font-size: 0.88rem;">You have not reported any civic issues matching the search criteria.</p>
                <button type="button" class="gov-btn-primary" style="max-width: 220px; margin: 18px auto 0;" onclick="document.getElementById('openComplaintModalBtn').click()">
                    ⊕ Lodge Grievance
                </button>
            </div>
        `;
        return;
    }

    list.forEach(c => {
        const card = document.createElement("div");
        card.className = "gov-grievance-card";
        card.id = `complaint-card-${c.id}`;

        const photoHtml = c.photo_url
            ? `<img src="${escapeHTML(c.photo_url)}" class="gov-evidence-thumb" alt="Evidence Photo" loading="lazy">`
            : "";

        const resolutionHtml = (c.status === "Resolved" && c.resolution_remarks)
            ? `
                <div class="gov-resolution-banner">
                    <div class="gov-res-title">
                        <span>✓ Action Taken Report (ATR) by Municipal Authority</span>
                    </div>
                    <div class="gov-res-remarks">${escapeHTML(c.resolution_remarks)}</div>
                    ${c.resolution_photo_url ? `<img src="${escapeHTML(c.resolution_photo_url)}" style="max-height: 120px; border-radius: 6px; margin-top: 8px; border: 1px solid #86efac;" alt="Resolution Proof">` : ""}
                </div>
            `
            : "";

        const ratingBtnHtml = (c.status === "Resolved")
            ? `
                <button type="button" class="gov-btn-action gov-btn-rate" onclick="openRatingModal('${escapeHTML(c.id)}')">
                    ${c.citizen_rating ? `⭐ Rated: ${c.citizen_rating}/5` : "⭐ Rate Resolution"}
                </button>
            `
            : "";

        card.innerHTML = `
            <div class="gov-card-top">
                <div>
                    <span class="gov-token-tag">${escapeHTML(c.id)}</span>
                    <h3>${escapeHTML(c.title)}</h3>
                </div>
                <div>
                    ${getStatusBadge(c.status)}
                </div>
            </div>

            <div class="gov-meta-row">
                <span class="gov-meta-item">📁 ${escapeHTML(c.category)}</span>
                <span class="gov-meta-item">📍 ${escapeHTML(c.ward_no)}</span>
                <span class="gov-meta-item">📌 ${escapeHTML(c.landmark || "N/A")}</span>
                <span class="gov-meta-item">📅 ${escapeHTML(c.created_at)}</span>
                ${getPriorityBadge(c.priority)}
            </div>

            <p class="gov-card-desc">${escapeHTML(c.description)}</p>

            ${photoHtml}
            ${renderTimelineHtml(c.status)}
            ${resolutionHtml}

            <div class="gov-card-actions">
                <div style="font-size: 0.78rem; color: var(--gov-text-muted);">
                    🏢 <strong>${escapeHTML(c.department || "Municipal Administration")}</strong>
                    ${c.assigned_officer_name ? ` · Nodal: ${escapeHTML(c.assigned_officer_name)}` : ""}
                </div>
                <div class="gov-action-btn-group">
                    <button type="button" class="gov-btn-action" style="color: var(--gov-saffron-600); border-color: var(--gov-saffron-500);" onclick="focusMapOnComplaint('${escapeHTML(c.id)}')">
                        🗺️ View on GIS Map
                    </button>
                    <button type="button" class="gov-btn-action" onclick="openSlipModal('${escapeHTML(c.id)}')">
                        📄 Acknowledgment Slip
                    </button>
                    ${ratingBtnHtml}
                </div>
            </div>
        `;

        complaintList.appendChild(card);
    });
}

// ==========================================
// 5. CITY-WIDE GIS CIVIC MAP & HOTSPOTS ENGINE
// ==========================================

function getCategoryEmoji(cat = "") {
    const c = cat.toLowerCase();
    if (c.includes("road") || c.includes("pothole")) return "🕳️";
    if (c.includes("sanitation") || c.includes("waste") || c.includes("garbage")) return "🗑️";
    if (c.includes("water") || c.includes("jal") || c.includes("pipeline")) return "🚰";
    if (c.includes("light") || c.includes("discom") || c.includes("vidyut")) return "💡";
    if (c.includes("drain") || c.includes("sewer")) return "🌊";
    if (c.includes("health") || c.includes("dengue") || c.includes("malaria")) return "🏥";
    return "🏛️";
}

function getStatusColorClass(status) {
    if (status === "Under Review") return "gis-pin-review";
    if (status === "In Progress") return "gis-pin-progress";
    if (status === "Resolved") return "gis-pin-resolved";
    return "gis-pin-pending";
}

function initCitizenGisMap() {
    const mapEl = document.getElementById("citizenGisMap");
    if (!mapEl || typeof L === "undefined") return;

    if (!citizenMap) {
        // Center on Kanpur Municipal Corporation
        citizenMap = L.map("citizenGisMap", {
            center: [26.4600, 80.3200],
            zoom: 12.5,
            zoomControl: true,
            scrollWheelZoom: false
        });

        // Crisp, high-contrast OpenStreetMap / CartoDB Voyager basemap
        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a> | SCISM GIS Engine'
        }).addTo(citizenMap);

        // Layer Groups
        hotspotsLayer = L.layerGroup().addTo(citizenMap);
        markersLayer = L.layerGroup().addTo(citizenMap);

        // Map Filter Pills
        const filterBtns = document.querySelectorAll(".gov-map-filter-bar .gov-map-pill[data-map-filter]");
        filterBtns.forEach(btn => {
            btn.addEventListener("click", function () {
                filterBtns.forEach(b => b.classList.remove("active"));
                this.classList.add("active");
                currentMapFilter = this.dataset.mapFilter || "all";
                renderGisMapMarkers();
            });
        });

        // Center / Reset Kanpur View Button
        const centerBtn = document.getElementById("centerMapKanpurBtn");
        if (centerBtn) {
            centerBtn.addEventListener("click", () => {
                citizenMap.flyTo([26.4600, 80.3200], 12.5, {
                    animate: true,
                    duration: 1.2
                });
            });
        }
    }

    refreshCityMapComplaints();
}

function renderGisMapMarkers() {
    if (!citizenMap || !markersLayer || !hotspotsLayer) return;

    markersLayer.clearLayers();
    hotspotsLayer.clearLayers();
    complaintMarkersMap = {};

    const filtered = allCityComplaintsCache.filter(c => {
        if (currentMapFilter === "open") {
            return c.status !== "Resolved" && c.status !== "Rejected";
        }
        if (currentMapFilter === "potholes") {
            return (c.category || "").toLowerCase().includes("road") || (c.category || "").toLowerCase().includes("pothole");
        }
        if (currentMapFilter === "sanitation") {
            return (c.category || "").toLowerCase().includes("sanitation") || (c.category || "").toLowerCase().includes("waste") || (c.category || "").toLowerCase().includes("garbage");
        }
        if (currentMapFilter === "resolved") {
            return c.status === "Resolved";
        }
        return true; // 'all'
    });

    // 1. Calculate Ward Hotspot Densities for Active Issues
    const wardDensities = {};
    allCityComplaintsCache.forEach(c => {
        if (c.status !== "Resolved" && c.status !== "Rejected") {
            const w = c.ward_no || "General Ward";
            wardDensities[w] = (wardDensities[w] || 0) + 1;
        }
    });

    // Render Hotspot Circles for Wards with grievances
    Object.entries(wardDensities).forEach(([ward, count]) => {
        const centroid = parseGeoCoords(null, ward);
        const radius = Math.min(1200, 450 + (count * 200));
        let color = "#3b82f6";
        let fillOpacity = 0.15;

        if (count >= 3) {
            color = "#ef4444";
            fillOpacity = 0.25;
        } else if (count >= 2) {
            color = "#f59e0b";
            fillOpacity = 0.20;
        }

        const circle = L.circle(centroid, {
            color: color,
            weight: 2,
            dashArray: "4, 6",
            fillColor: color,
            fillOpacity: fillOpacity,
            radius: radius
        });

        circle.bindTooltip(`<strong>📍 ${escapeHTML(ward)}</strong><br>⚠️ ${count} Active Hotspot Issue(s)<br><small>Click to zoom into ward</small>`, {
            sticky: true,
            direction: "top"
        });

        circle.on("click", () => {
            citizenMap.flyTo(centroid, 14.5, { animate: true, duration: 1 });
        });

        hotspotsLayer.addLayer(circle);
    });

    // 2. Render Complaint Pins
    filtered.forEach(c => {
        const coords = parseGeoCoords(c.geo_coords, c.ward_no);
        const statusCls = getStatusColorClass(c.status);
        const priorityCls = (c.priority === "High" || c.priority === "Emergency") && c.status !== "Resolved"
            ? "gis-pin-emergency"
            : "";
        const emoji = getCategoryEmoji(c.category);

        const customIcon = L.divIcon({
            className: "gis-div-icon",
            html: `<div class="gis-marker-pin ${statusCls} ${priorityCls}"><span class="gis-pin-icon">${emoji}</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -28]
        });

        const marker = L.marker(coords, { icon: customIcon });

        const photoImg = c.photo_url
            ? `<img src="${escapeHTML(c.photo_url)}" class="gov-map-popup-thumb" alt="Evidence" loading="lazy">`
            : "";

        const popupHtml = `
            <div class="gov-map-popup-card">
                <div class="gov-map-popup-header">
                    <span class="gov-map-popup-token">${escapeHTML(c.id)}</span>
                    ${getStatusBadge(c.status)}
                </div>
                <div class="gov-map-popup-title">${escapeHTML(c.title)}</div>
                <div class="gov-map-popup-meta">
                    <span>📁 <strong>${escapeHTML(c.category)}</strong></span>
                    <span>📍 ${escapeHTML(c.ward_no)} · ${escapeHTML(c.landmark || "Kanpur")}</span>
                    <span>📅 Lodged: ${escapeHTML(c.created_at || "Recent")}</span>
                    ${getPriorityBadge(c.priority)}
                </div>
                ${photoImg}
                <div class="gov-map-popup-actions">
                    <button type="button" class="gov-map-popup-btn" onclick="scrollToGrievanceInList('${escapeHTML(c.id)}')">
                        📋 View in List / Track
                    </button>
                    ${c.status !== "Resolved" ? `
                        <button type="button" class="gov-map-popup-btn gov-map-popup-btn-sec" onclick="handleMapUpvote('${escapeHTML(c.id)}')">
                            👍 Upvote (${c.upvotes || 0})
                        </button>
                    ` : ""}
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml, { maxWidth: 300 });
        markersLayer.addLayer(marker);
        complaintMarkersMap[c.id] = marker;
    });
}

// Focus Map on a specific complaint from Card
window.focusMapOnComplaint = function (id) {
    const mapSection = document.getElementById("gisMapSection");
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    let marker = complaintMarkersMap[id];
    if (!marker) {
        // Reset filter to 'all' in case it's currently filtered out
        const allBtn = document.querySelector(".gov-map-filter-bar .gov-map-pill[data-map-filter='all']");
        if (allBtn) allBtn.click();
        marker = complaintMarkersMap[id];
    }

    if (marker && citizenMap) {
        citizenMap.flyTo(marker.getLatLng(), 15, {
            animate: true,
            duration: 1.2
        });
        setTimeout(() => {
            marker.openPopup();
        }, 800);
    } else {
        showToast("Locating issue on GIS layer...", "info");
    }
};

// Scroll to Grievance in the list from Map Popup
window.scrollToGrievanceInList = function (id) {
    searchComplaintInput.value = "";
    renderComplaintsList(myComplaintsCache);

    const card = document.getElementById(`complaint-card-${id}`);
    if (card) {
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        card.classList.add("card-highlight-flash");
        setTimeout(() => card.classList.remove("card-highlight-flash"), 2500);
    } else {
        // Grievance was lodged by another citizen, quick track it
        searchComplaintInput.value = id;
        renderComplaintsList(getFilteredList());
        const filteredCard = document.getElementById(`complaint-card-${id}`);
        if (filteredCard) {
            filteredCard.scrollIntoView({ behavior: "smooth", block: "center" });
            filteredCard.classList.add("card-highlight-flash");
            setTimeout(() => filteredCard.classList.remove("card-highlight-flash"), 2500);
        } else {
            showToast(`Grievance ${id} loaded. Check official tracking records.`, "info");
        }
    }
};

// Map Upvote Handler
window.handleMapUpvote = async function (id) {
    const res = await apiUpvoteComplaint(id, session.id, session.name);
    if (res && res.success) {
        showToast(res.message || "Grievance upvoted successfully!", "success");
        await refreshCityMapComplaints();
        await refreshComplaints();
    } else {
        showToast(res?.message || "Already supported this issue.", "info");
    }
};

// ==========================================
// 6. MODAL MAP PIN PICKER & GPS LOCATOR
// ==========================================

function initModalMapPicker() {
    const pickerEl = document.getElementById("modalMapPicker");
    if (!pickerEl || typeof L === "undefined") return;

    if (!modalPickerMap) {
        const initialCoords = [26.4952, 80.2829]; // Default Kalyanpur
        modalPickerMap = L.map("modalMapPicker", {
            center: initialCoords,
            zoom: 13,
            zoomControl: true
        });

        L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors | SCISM'
        }).addTo(modalPickerMap);

        const pickerIcon = L.divIcon({
            className: "gis-div-icon",
            html: `<div class="gis-marker-pin gis-pin-pending"><span class="gis-pin-icon">📍</span></div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32]
        });

        modalPickerMarker = L.marker(initialCoords, {
            draggable: true,
            icon: pickerIcon
        }).addTo(modalPickerMap);

        const updateCoords = (lat, lng) => {
            const formatted = formatGeoCoords(lat, lng);
            const inputEl = document.getElementById("complaintGeoCoords");
            const displayEl = document.getElementById("geoCoordsDisplay");
            if (inputEl) inputEl.value = formatted;
            if (displayEl) displayEl.textContent = formatted;
        };

        modalPickerMarker.on("dragend", function (e) {
            const pos = e.target.getLatLng();
            updateCoords(pos.lat, pos.lng);
        });

        modalPickerMap.on("click", function (e) {
            modalPickerMarker.setLatLng(e.latlng);
            updateCoords(e.latlng.lat, e.latlng.lng);
        });

        // Ward Selection Sync
        const wardSelect = document.getElementById("complaintWard");
        if (wardSelect) {
            wardSelect.addEventListener("change", function () {
                const targetCentroid = parseGeoCoords(null, this.value);
                modalPickerMap.flyTo(targetCentroid, 14, { animate: true, duration: 0.8 });
                modalPickerMarker.setLatLng(targetCentroid);
                updateCoords(targetCentroid[0], targetCentroid[1]);
            });
        }

        // Auto-Detect GPS Button
        const gpsBtn = document.getElementById("detectGpsBtn");
        if (gpsBtn) {
            gpsBtn.addEventListener("click", () => {
                if (!navigator.geolocation) {
                    showToast("GPS Geolocation is not supported by your browser.", "error");
                    return;
                }

                gpsBtn.textContent = "📡 Acquiring Satellite GPS...";
                gpsBtn.disabled = true;

                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        modalPickerMap.flyTo([lat, lng], 15, { animate: true, duration: 1 });
                        modalPickerMarker.setLatLng([lat, lng]);
                        updateCoords(lat, lng);
                        gpsBtn.textContent = "✓ GPS Coordinates Acquired";
                        gpsBtn.disabled = false;
                        showToast(`GPS pinpointed (Accuracy: ±${Math.round(position.coords.accuracy)}m)`, "success");
                    },
                    (err) => {
                        console.warn("GPS detection failed:", err);
                        gpsBtn.textContent = "📍 Auto-Detect My GPS Location";
                        gpsBtn.disabled = false;
                        showToast("Could not access live GPS. You can drag the pin manually on the map.", "info");
                    },
                    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
                );
            });
        }
    }

    setTimeout(() => {
        if (modalPickerMap) modalPickerMap.invalidateSize();
    }, 250);
}

// Modal Controls
openComplaintModalBtn.addEventListener("click", () => {
    complaintModal.style.display = "flex";
    initModalMapPicker();
});

closeComplaintModalBtn.addEventListener("click", () => {
    complaintModal.style.display = "none";
});

// Photo Preview
complaintPhotoInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            photoPreviewImg.src = e.target.result;
            photoPreviewBox.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        photoPreviewBox.style.display = "none";
    }
});

// Submit Grievance Form
complaintForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const submitBtn = document.getElementById("submitComplaintBtn");
    submitBtn.disabled = true;
    submitBtn.textContent = "Registering with Nagar Nigam...";

    const coords = document.getElementById("complaintGeoCoords")?.value || "26.4952° N, 80.2829° E";

    const formData = new FormData();
    formData.append("user_id", session.id);
    formData.append("reported_by", session.name);
    formData.append("phone", session.phone || "+91 98765 43210");
    formData.append("title", document.getElementById("complaintTitle").value);
    formData.append("category", document.getElementById("complaintCategory").value);
    formData.append("ward_no", document.getElementById("complaintWard").value);
    formData.append("landmark", document.getElementById("complaintLandmark").value);
    formData.append("priority", document.getElementById("complaintPriority").value);
    formData.append("description", document.getElementById("complaintDescription").value);
    formData.append("geo_coords", coords);

    if (complaintPhotoInput.files[0]) {
        formData.append("photo", complaintPhotoInput.files[0]);
    }

    const res = await apiCreateComplaint(formData);

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Grievance to Municipal Authority ➔";

    if (!res.success) {
        showToast(res.message || "Failed to submit grievance.", "error");
        return;
    }

    showToast(`Grievance registered! Token: ${res.complaint.id}`, "success");
    complaintForm.reset();
    photoPreviewBox.style.display = "none";
    complaintModal.style.display = "none";

    await refreshComplaints();
    await refreshCityMapComplaints();

    // Auto-open Acknowledgment Slip
    openSlipModal(res.complaint.id);

    // Focus the new issue on the GIS map
    setTimeout(() => {
        focusMapOnComplaint(res.complaint.id);
    }, 1200);
});

// Quick Track by Token ID
quickTrackBtn.addEventListener("click", () => {
    const token = quickTrackInput.value.trim();
    if (!token) {
        showToast("Please enter a valid Grievance Token ID.", "error");
        return;
    }
    searchComplaintInput.value = token;
    renderComplaintsList(getFilteredList());
    const section = document.getElementById("complaints");
    if (section) section.scrollIntoView({ behavior: "smooth" });
});

// Search input listener
searchComplaintInput.addEventListener("input", () => {
    renderComplaintsList(getFilteredList());
});

// ==========================================
// 7. ACKNOWLEDGMENT SLIP MODAL
// ==========================================

window.openSlipModal = function (complaintId) {
    const c = myComplaintsCache.find(x => x.id === complaintId) || allCityComplaintsCache.find(x => x.id === complaintId);
    if (!c) return;

    document.getElementById("slipTokenId").textContent = c.id;
    document.getElementById("slipDate").textContent = c.created_at;
    document.getElementById("slipCitizenName").textContent = c.reported_by || session.name;
    document.getElementById("slipCitizenPhone").textContent = c.phone || session.phone || "+91 98765 43210";
    document.getElementById("slipWard").textContent = c.ward_no;
    document.getElementById("slipLandmark").textContent = c.landmark;
    document.getElementById("slipCategory").textContent = c.category;
    document.getElementById("slipDept").textContent = c.department || "Municipal Administration";
    document.getElementById("slipSla").textContent = `${c.sla_hours || 48} Hours Service Level Agreement`;
    document.getElementById("slipStatus").textContent = c.status;
    document.getElementById("slipTitle").textContent = c.title;
    document.getElementById("slipBarcode").textContent = `*${c.id}*`;

    acknowledgmentModal.style.display = "flex";
};

closeAckModalBtn.addEventListener("click", () => {
    acknowledgmentModal.style.display = "none";
});

printSlipBtn.addEventListener("click", () => {
    window.print();
});

// ==========================================
// 8. CITIZEN 5-STAR RATING & FEEDBACK
// ==========================================

window.openRatingModal = function (complaintId) {
    feedbackComplaintIdInput.value = complaintId;
    selectedRatingScore = 5;
    renderStarSelection(5);
    feedbackModal.style.display = "flex";
};

closeFeedbackModalBtn.addEventListener("click", () => {
    feedbackModal.style.display = "none";
});

function renderStarSelection(score) {
    const stars = starContainer.querySelectorAll(".gov-star");
    stars.forEach(s => {
        const val = parseInt(s.dataset.score, 10);
        s.classList.toggle("selected", val <= score);
    });
}

starContainer.querySelectorAll(".gov-star").forEach(star => {
    star.addEventListener("click", function () {
        selectedRatingScore = parseInt(this.dataset.score, 10);
        renderStarSelection(selectedRatingScore);
    });

    star.addEventListener("mouseenter", function () {
        const val = parseInt(this.dataset.score, 10);
        starContainer.querySelectorAll(".gov-star").forEach(s => {
            s.classList.toggle("hovered", parseInt(s.dataset.score, 10) <= val);
        });
    });

    star.addEventListener("mouseleave", function () {
        starContainer.querySelectorAll(".gov-star").forEach(s => s.classList.remove("hovered"));
    });
});

feedbackForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const id = feedbackComplaintIdInput.value;
    const feedback = document.getElementById("feedbackText").value;
    const submitBtn = document.getElementById("submitFeedbackBtn");

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    const res = await apiSubmitFeedback(id, selectedRatingScore, feedback, session.name);

    submitBtn.disabled = false;
    submitBtn.textContent = "Submit Official Rating ➔";

    if (!res.success) {
        showToast("Failed to record feedback.", "error");
        return;
    }

    showToast("Thank you! Citizen feedback recorded.", "success");
    feedbackModal.style.display = "none";
    feedbackForm.reset();
    await refreshComplaints();
    await refreshCityMapComplaints();
});

// Close modals when clicking outside
window.addEventListener("click", (e) => {
    if (e.target === complaintModal) complaintModal.style.display = "none";
    if (e.target === acknowledgmentModal) acknowledgmentModal.style.display = "none";
    if (e.target === feedbackModal) feedbackModal.style.display = "none";
});

// Helper for upvoting API
async function apiUpvoteComplaint(id, userId, citizenName) {
    try {
        const res = await fetch(`${API_BASE}/api/complaints/${id}/upvote`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, citizen_name: citizenName })
        });
        return await res.json();
    } catch (e) {
        console.warn("Upvote error:", e);
        return { success: false, message: "Could not connect to upvote gateway." };
    }
}

// ==========================================
// 9. INITIAL LOAD
// ==========================================
refreshComplaints();
initCitizenGisMap();
