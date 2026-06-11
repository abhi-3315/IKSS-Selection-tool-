// --- START OF FILE script.js ---

const BACKEND_URL = 'http://localhost:5000';

if (!window.location.pathname.endsWith('login.html')) {
    if (!sessionStorage.getItem('isLoggedIn')) {
        window.location.href = 'login.html';
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'login.html';
}

let globalResults        = null;
let globalInputData      = null;
let globalDetailedResults = null;
let currentChillerType   = 'water';

// Document state
let currentDocCategory = '';
let currentDocYear = '';

// ==================== VIEW CONTROLLER ====================
function showView(viewName, tabName = '') {
    const calcView = document.getElementById('calculator-view');
    const gaView   = document.getElementById('ga-pid-view');
    const docView  = document.getElementById('document-view');

    if (calcView) calcView.style.display = 'none';
    if (gaView)   gaView.style.display   = 'none';
    if (docView)  docView.style.display  = 'none';

    // Also hide the results containers when switching views
    const summary  = document.getElementById('summaryView');
    const detailed = document.getElementById('detailedViewWrapper');
    if (summary)  summary.style.display  = 'none';
    if (detailed) detailed.style.display = 'none';

    if (viewName === 'calculator') {
        if (calcView) calcView.style.display = 'block';
        
        // Un-hide the input form if we are coming back to the calculator
        const topRow = document.querySelector('#calculator-view > div:first-child');
        const compCont = document.querySelector('.comparison-container');
        const submitBtn = document.querySelector('.submit-button-container');
        const respMsg = document.getElementById('response-message');
        
        if (topRow) topRow.style.display = 'grid';
        if (compCont) compCont.style.display = '';
        if (submitBtn) submitBtn.style.display = 'block';
        if (respMsg) respMsg.style.display = 'none';
    }
    else if (viewName === 'ga-pid') {
        if (gaView) {
            gaView.style.display = 'block';
            const inp = document.getElementById('ga-search-input');
            const res = document.getElementById('ga-pid-result');
            if (inp) inp.value = '';
            if (res) res.style.display = 'none';
            const old = document.getElementById('gapid-iframe');
            if (old) old.remove();
        }
    }
    else if (viewName === 'document') {
        if (docView) {
            docView.style.display = 'block';
            const tabs = document.getElementsByClassName('doc-tab');
            let tabFound = false;
            for (let i = 0; i < tabs.length; i++) {
                if (tabName && tabs[i].innerText.toUpperCase().includes(tabName.replace('Engg. Specification', 'SPECIFICATIONS').toUpperCase())) {
                    tabs[i].click();
                    tabFound = true;
                    break;
                }
            }
            if (!tabFound && tabs.length > 0) tabs[0].click();
        }
    }
}

// ==================== SIDEBAR ====================
function openNav() {
    var sb = document.getElementById('mySidebar');
    if (!sb) return;
    if (sb.classList.contains('new-sidebar')) {
        sb.classList.add('expanded');
        document.body.style.marginLeft = '210px';
    } else {
        sb.style.width = '220px';
        document.body.classList.add('sidebar-open');
    }
}
function closeNav() {
    var sb = document.getElementById('mySidebar');
    if (!sb) return;
    if (sb.classList.contains('new-sidebar')) {
        sb.classList.remove('expanded');
        document.body.style.marginLeft = '56px';
    } else {
        sb.style.width = '0';
        document.body.classList.remove('sidebar-open');
    }
}
function toggleNav() {
    var sb = document.getElementById('mySidebar');
    if (!sb) return;
    if (sb.classList.contains('expanded')) { closeNav(); } else { openNav(); }
}
function toggleSubMenu(subId) {
    var sb = document.getElementById('mySidebar');
    if (sb && !sb.classList.contains('expanded')) { openNav(); }
    var sub = document.getElementById(subId);
    if (!sub) return;
    var isOpen = sub.classList.contains('open');
    sub.classList.toggle('open');
    var arrowId = subId.replace('-sub', '-arrow');
    var arrow   = document.getElementById(arrowId);
    if (arrow) arrow.classList.toggle('open', !isOpen);
}
function switchChillerType(type) {
    showView('calculator');
    currentChillerType = type;
    const waterCond = document.getElementById('condenser-water-cooled');
    const airCond   = document.getElementById('condenser-air-cooled');
    const waterLink = document.getElementById('water-cooled-link');
    const airLink   = document.getElementById('air-cooled-link');
    const series    = document.getElementById('chiller-series');

    if (series) {
        series.innerHTML = '';
        if (type === 'water') {
            series.add(new Option('KWK', 'kwk'));
            series.add(new Option('KWS', 'kws'));
            series.add(new Option('KWI', 'kwi'));
        } else {
            series.add(new Option('KAF', 'kaf'));
            series.add(new Option('KAS', 'kas'));
            series.add(new Option('KAA', 'kaa'));
        }
    }
    if (waterCond && airCond) {
        if (type === 'water') {
            waterCond.style.display = 'block'; airCond.style.display = 'none';
            waterLink && waterLink.classList.add('active'); airLink && airLink.classList.remove('active');
        } else {
            waterCond.style.display = 'none'; airCond.style.display = 'block';
            airLink && airLink.classList.add('active'); waterLink && waterLink.classList.remove('active');
        }
    }
}

// ==================== DOCUMENTS / YEARLY FOLDER LOGIC ====================

let documentDatabase = {
    'ENGINEERING BULLETIN': {
        '13-14': ['EB-13-14-01_Touch Screen (7inch) for KWK and KWI Series.pdf', 'EB-13-14-03_KCPLCSS Software Release v1.3.3.pdf', 'EB-13-14-02_Addition of KWI Series in AHRI Listing.pdf', 'EB-13-14-09_KSmart Controller Features.pdf', 'EB-13-14-09_KSmart Controller Features.pdf', 'EB-13-14-06_Oil Heater for Old Oil Pump.pdf', 'EB-13-14-10_Various Operating Modes of WC Chillers.pdf', 'EB-13-14-08_Release of KWS - Brine Series Rating Chart.pdf', 'EB-13-14-07_KCPLCSS Software Release v1.3.4.pdf'],
        '14-15': ['EB-14-15-01_New Air-Cooled Series Release.pdf', 'EB-14-15-03_Rating Charts Heat Pump and Brine.pdf', 'EB-14-15-02_Cable Ratings.pdf', 'EB-14-15-07_Release of KCM Series Selection Software.pdf', 'EB-14-15-06_Adiabatic Air-Cooled Series.pdf', 'EB-14-15-04_Air-Cooled Series - R407C Release.pdf', 'EB-14-15-08_WCSS Software Release v1.3.6.pdf'],
        '15-16': ['EB_15_16_06_Minimum Chilled Water Temperatures without Brine.pdf', 'EB_15_16_05_Brine Chillers Operating Range and Other Details.pdf', 'EB_15_16_02_Expansion Valve Driver Board Programming Procedure.pdf', 'EB_15_16_11_Oil Cooler for Brine Chillers.pdf', 'EB_15_16_10_WCSS Software Release v1.3.8.pdf', 'EB_15_16_09_WCSS Software Release v1.3.7.pdf', 'EB_15_16_12 KWE Series.pdf'],
        '17-18': ['EB-17-18-005_WCSS Software Release v1.4.0.pdf', 'EB-17-18-004_WCSS Software Release v1.3.9.pdf', 'EB-17-18-003_Discontinuation of Economizer Option.pdf', 'EB-17-18-008_WCSS v1.4.1 and ACSS v1.4.0 Release.pdf', 'EB-17-18-007_KWI R1234ze Series.pdf', 'EB-17-18-05_Mesurement System Selection.pdf', 'EB-17-18-011_KWI R134a with Falling Film Evaporator.pdf', 'EB-17-18-010_Chillers with Refrigerant Cooled Oil Coolers.pdf', 'EB-17-18-08_Mesurement System Selection.pdf', 'EB-17-18-014_Modbus Address List R02.pdf', 'EB-17-18-013_WCSS Software Release v1.4.3.pdf', 'EB-17-18-012_Teksel v3.1.0 Release.pdf', 'EB-17-18-015_Various Chiller Monitoring Offerings.pdf'],
        '18-19': ['ESP-18-19-001_Sound Pressure Levels of All Screw Chiller Series.pdf', 'ESP-18-19-002_Recommended Water Quality requirement for Chillers.pdf', 'ESP-18-19-003_Physical and Chemical Properties of R134a.pdf', 'ESP-18-19-004_Thermal Insulation Specifications.pdf','ESP-18-19-005_Physical and Chemical Properties of R407C.pdf', 'ESP-18-19-006_Physical and Chemical Properties of R1234ze.pdf', 'ESP-18-19-017 IO List For Scroll Chiller (pCO OEM+ & pLDPRO) R03.pdf'],
        '19-20': ['EB-18-98-001_Teksel Software v3.2.0 Release.pdf', 'EB-18-98-002_KCPLCSS v1.4.4 Release.pdf', 'EB-18-98-003_Teksel version 3.2.1.pdf'],
        '20-21': ['EB_19-20_002_Introduction of Schneider make VFD.pdf', 'EB-19-20-001_KCPLCSS version 1.4.5.pdf', 'EB_19-20_004_KSM220.pdf', 'EB-19-20-006_KCM_XXX_1X_13.18.18 & 11.18.18.pdf', 'EB-19-20-005_KWE_XXX_1X_13.13.13.pdf', 'EB-19-20-003_KCPLCSS version 1.4.7.pdf', 'EB-19-20-010_KCPLCSS version 1.4.9.pdf', 'EB-19-20-009_KDM220M.pdf', 'EB-19-20-008_KCPLCSS version 1.4.8.pdf'],
        '21-22': ['EB-21-22-001_Scroll Chiller.pdf','EB-21-22-002_Rental Chiller.pdf','EB-21-22-003_Modification in centrifugal chiller oil pump.pdf'],
        '22-23': ['EB-22-23-001_Screw chiller software upgradation.pdf','EB-22-23-002_Special Step Brine Software Upgradation.pdf','EB-22-23-004_DELTA VFD Introduction.pdf','EB-22-23-005_Factory Fitted ATCS'],
        '23-24': ['EB-23-24-001_Siemens Software New Revision Updates.pdf','EB-23-24-004 Modification in Oil Cooler Requirement for Special Brine Series with FVRL Compressor.pdf','EB-23-24-003_Fanstech Fans MoDscan Activities.pdf','.EB-23-24-002_ATCS Control Philosophy & Settingspdf',],
        '25-26': ['EB-25-26-002Acoustic Insulation Engineering Bulletin (1).pdf']
    },
    'Engg. Specification': {
        '13-14': ['ESP-13-14-101_Insulation Thickness of Various Parts Chiller (R01).pdf', 'ESP-13-14-106_Fouling Correction Factors (R00).pdf', 'ESP-13-14-105_Flow Factors for Various Brine Percentage (R00).pdf', 'ESP-13-14-101_Insulation Thickness of Various Parts Chiller (R04).pdf', 'ESP-13-14-101_Insulation Thickness of Various Parts Chiller (R02).pdf'],
        '14-15': ['ESP-14-15-06 KWS R407C Heat Pump Rating (R02).pdf', 'ESP-14-15-05 KWS R134a Heat Pump Rating (R02).pdf', 'ESP-14-15-01_Al and Cu Cable Ratings (R01).pdf'],
        '15-16': ['ESP-15-16-110_VFD Setpoints for KWI Chiller.pdf', 'ESP-15-16-105_Calibration of Temperature Sensors (R00).pdf', 'ESP-15-16-103_Etch Primer Specifications and Painting Procedure (R00).pdf', 'ESP-15-16-102_Brine Chiller Pressure Setting (R01).pdf', 'ESP-15-16-101_Mechanical Cutout Setting for All Chillers (R01).pdf'],
        '17-18': ['ESP-17-18-117_KSC_XXX_1X Modbus List (R02).pdf', 'ESP-17-18-116_KCM_XXX_2X Modbus List (R02).pdf', 'ESP-17-18-115_KCM_XXX_1X Modbus List (R02).pdf', 'ESP-17-18-114_KWKI_XXX_2X Modbus List (R02).pdf', 'ESP-17-18-113_KWKI_XXX_1X Modbus List (R02).pdf', 'ESP-17-18-112_Conso_XXX_2X Modbus List (R02).pdf', 'ESP-17-18-111_Conso_XXX_1X Modbus List (R02).pdf', 'ESP-17-18-110-Maximum Limits in Content of Lubricating Oil of Centrifugal Compressor (R00).pdf', 'ESP-17-18-108-Maximum Limits in Content of Lubricating Oil of Screw (K) Compressor (R00).pdf', 'ESP-17-18-107_IO  List For Dual Circuit Screw Chiller (pCO5+ and pGD0) (R00).pdf', 'ESP-17-18-106_VFD Setpoints For KSC Chiller.pdf', 'ESP-17-18-101_STANDARD OFFERING FOR ELECTRICAL PANEL_R04.pdf', 'ESP-17-18-101_STANDARD OFFERING FOR ELECTRICAL PANEL_R02.pdf', 'ESP-17-18-101_Standard Offering For Electrical Panel_R01.pdf'],
        '18-19': ['ESP-18-19-017 IO List For Scroll Chiller (pCO OEM+ & pLDPRO) R03.pdf', 'ESP-18-19-006_Physical and Chemical Properties of R1234ze.pdf', 'ESP-18-19-005_Physical and Chemical Properties of R407C.pdf', 'ESP-18-19-004_Thermal Insulation Specifications.pdf', 'ESP-18-19-003_Physical and Chemical Properties of R134a.pdf', 'ESP-18-19-002_Recommended Water Quality requirement for Chillers.pdf', 'ESP-18-19-001_Sound Pressure Levels of All Screw Chiller Series.pdf'],
        '19-20': ['ESP-19-20-008_Konnect Installation Manual.pdf', 'ESP-19-20-008_Konnect Installation Manual R01.pdf', 'ESP-19-20-007_H.S.SLEEVE SELECTION CHART.pdf', 'ESP-19-20-006_VFD Set Points- KWI With Schneider make VFD.pdf', 'ESP-19-20-004_CABLE SELECTION CHART.pdf'],
        '20-21': ['ESP-20-21-022_MOTOR DATA FOR VFD SETPOINT.pdf', 'ESP-20-21-014 Setpoint list for KAC Scroll Chiller.pdf', 'ESP-20-21-012-MCCB setpoints for screw chiller.pdf', 'ESP-20-21-009 IO List For Single Circuit KWS Brine Chiller R03.pdf', 'ESP-20-21-008_DP Switch Selection.pdf', 'ESP-20-21-004_KWS, KAS & KWE New Chiller Software Development.pdf', 'ESP-20-21-003_VFD Set Points-KAS With Schneider make VFD.pdf', 'ESP-20-21-003_VFD Set Points-KAS With Schneider make VFD R00.pdf', 'ESP-20-21-002_VFD Set Points-KAS With Danfoss make VFD.pdf', 'ESP-20-21-002_VFD Set Points-KAS With Danfoss make VFD R00.pdf', 'ESP-20-21-001_Standard Painting Specification 01.09.2020.pdf', 'Chiller Design and Test Pressure_R10.pdf'],
        '21-22': [ 'Chiller Design and Test Pressure_R11.pdf', 'Chiller Design and Test Pressure_R12.pdf', 'Chiller Design and Test Pressure_R13.pdf', 'ESP-21-22-001_Softstarter datasheet.pdf', 'ESP-21-22-002_Universal Gateway Ethernet Setting User Manual.pdf', 'ESP-21-22-003_Procedure For Adding New Devices On Website.pdf', 'ESP-21-22-004_Modscan Check Procedure.pdf', 'ESP-21-22-005_MCD600 Softstarter parameter list.pdf'],
        '22-23': ['ESP-22-23-017_VFD Set Points-KWI With Delta make VFD.pdf', 'ESP-22-23-011_VFD Set Points-KAS_KWS With Delta make VFD.pdf', 'ESP-22-23-010_SIEMENS CONTROLLER DATASHEET.pdf', 'ESP-22-23-007 Controller Features With Different Screens & Communication Protocols With Converter R02.pdf', 'ESP-22-23-007 Controller Features With Different Screens & Communication Protocols With Converter R01.pdf', 'ESP-22-23-006_AHF Datasheet.pdf', 'ESP-22-23-005_CAREL EVD Datasheet.pdf', 'ESP-22-23-004_VFD Datasheet.pdf', 'ESP-22-23-003_VFD Retrofit cable schedule.pdf', 'ESP-22-23-002_LHD Setpoints for KSC chiller.pdf', 'ESP-22-23-001.pdf', 'ESP-11-12-130-R08.pdf', 'ESP-11-12-130 - R07.pdf', 'ESP-07-08-107.pdf'],
        '23-24': ['ESP-23-24-011_B-CPM_SALES_MANUAL Siemens Updated.pdf', 'ESP-23-24-011_A-CPM_SALES_MANUAL Carel Updated.pdf', 'ESP-23-24-010-HMI MONITERING USING COMMON NETWORK.pdf', 'ESP-23-24-009-IO List For KWK-2 (Siemens Double Circuit).pdf', 'ESP-23-24-008-IO List For KAS-2 (Siemens Double Circuit).pdf', 'ESP-23-24-007-IO List For KWS-2 (Siemens Double Circuit).pdf', 'ESP-23-24-006-IO List For KWK-1 (Siemens single Circuit).pdf', 'ESP-23-24-005-IO List For  KAS-I (Siemens single circuit).pdf', 'ESP-23-24-004 Pressure Sensor Technical Details.pdf', 'ESP-23-24-003 Temperature Sensor Technical Details.pdf', 'ESP-23-24-002 IO List For KWS-I (Siemens Single Circuit).pdf'],
        '25-26': ['ESP-25-26-001_Instrument Set Point List For DC chiller.pdf', 'ESP-25-26-001 KAS_2X_DATA_CENTRE_MODBUS_LIST.pdf', 'Chiller Design and Test Pressure_R16.pdf']
    },
    'Product Info': { 'Root': ['Advanced Features-Data Centres.pdf', 'EB102 KSmart features for screw chillers.pdf', 'ECOMax-HE- Automatic Tube Cleaning System.wmv', 'Main Product Brochure_Final_Web-Updated-LR.pdf', 'QAP_Unit_Assly_NEW.pdf', 'QAP_Unit_Assly_NEW.xlsx', 'Thumbs.db'] },
    'Certificates': { 'Root': ['AHRICertificate KAF.pdf', 'AHRICertificate CXH.pdf', 'AHRICertificate KWS.pdf', 'AHRICertificate KWI.pdf', 'AHRICertificate KXH.pdf'] }
};

function switchDocCategory(evt, categoryName) {
    let tabs = document.getElementsByClassName('doc-tab');
    for (let i = 0; i < tabs.length; i++) {
        tabs[i].className = tabs[i].className.replace(' active', '');
    }
    if(evt) evt.currentTarget.className += ' active';

    currentDocCategory = categoryName;

    let yearSelect = document.getElementById('doc-year-select');
    let dropdownContainer = document.getElementById('yearly-dropdown-container');
    yearSelect.innerHTML = '';
    
    let availableYears = Object.keys(documentDatabase[categoryName] || {});
    
    if (availableYears.length === 1 && availableYears[0] === 'Root') {
        dropdownContainer.style.display = 'none';
        currentDocYear = 'Root';
        loadDocumentsForYear();
        return;
    }
    
    dropdownContainer.style.display = 'flex';

    if(availableYears.length === 0) {
        yearSelect.innerHTML = '<option value="">No Folders Available</option>';
        document.getElementById('doc-radio-list').innerHTML = '<p style="color:#666;font-style:italic;">No documents in this category.</p>';
        return;
    }

    availableYears.forEach(yr => {
        let opt = document.createElement('option');
        opt.value = yr;
        opt.innerHTML = yr;
        yearSelect.appendChild(opt);
    });

    loadDocumentsForYear();
}

function loadDocumentsForYear() {
    if (currentDocCategory !== 'Certificates' && currentDocCategory !== 'Product Info') {
        currentDocYear = document.getElementById('doc-year-select').value;
    }
    
    let listDiv = document.getElementById('doc-radio-list');
    listDiv.innerHTML = '';

    if(!currentDocYear || !documentDatabase[currentDocCategory][currentDocYear]) {
        listDiv.innerHTML = '<p style="color:#666;font-style:italic;">No documents found for this selection.</p>';
        return;
    }

    let docs = documentDatabase[currentDocCategory][currentDocYear];
    
    if (docs.length === 0) {
        listDiv.innerHTML = '<p style="color:#666;font-style:italic;">No documents available in this folder.</p>';
        return;
    }

    docs.forEach((doc, index) => {
        let label = document.createElement('label');
        let radio = document.createElement('input');
        radio.type  = 'radio';
        radio.name  = 'docSelection';
        radio.value = doc;
        if (index === 0) radio.checked = true;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(doc));
        listDiv.appendChild(label);
    });
}

function getSelectedDoc() {
    let radios = document.getElementsByName('docSelection');
    for (let i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            return radios[i].value;
        }
    }
    return null;
}

function viewSelectedDoc() {
    let docName = getSelectedDoc();
    if (!docName) return alert("Please select a document first.");
    
    let filePath = currentDocYear === 'Root' ? docName : `${currentDocYear}/${docName}`;
    let url = `${BACKEND_URL}/api/document/${encodeURIComponent(currentDocCategory)}/${encodeURIComponent(filePath)}`;
    
    console.log("Attempting to view:", url);
    window.open(url, '_blank');
}

function downloadSelectedDoc() {
    let docName = getSelectedDoc();
    if (!docName) return alert("Please select a document first.");
    
    let filePath = currentDocYear === 'Root' ? docName : `${currentDocYear}/${docName}`;
    let url = `${BACKEND_URL}/api/download-document/${encodeURIComponent(currentDocCategory)}/${encodeURIComponent(filePath)}`;
    
    console.log("Attempting to download:", url);
    let a = document.createElement('a');
    a.href = url;
    a.download = docName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==================== KNOWLEDGE REPOSITORY PDF VIEWER ====================
function openTdsDoc(docName) {
    let folderName = encodeURIComponent('tds data');
    let fileName = encodeURIComponent(docName);
    
    let url = `${BACKEND_URL}/api/document/${folderName}/${fileName}`;
    
    console.log("Attempting to open:", url);
    window.open(url, '_blank');
}

// ==================== GA & P&ID SEARCH ====================
async function performGAPIDSearch() {
    const searchInput = document.getElementById('ga-search-input');
    const searchType  = document.getElementById('ga-search-type');
    const resultsDiv  = document.getElementById('ga-pid-result');
    const docLabel    = document.getElementById('ga-pid-doc-name');
    const statusMsg   = document.getElementById('ga-search-status');

    function showStatus(msg, isError) {
        if (statusMsg) {
            statusMsg.textContent    = msg;
            statusMsg.style.color   = isError ? '#c0392b' : '#555';
            statusMsg.style.display = 'block';
        } else if (isError) { alert(msg); }
    }
    function hideStatus() { if (statusMsg) statusMsg.style.display = 'none'; }

    const searchVal = searchInput ? searchInput.value.trim() : '';
    const typeVal   = searchType  ? searchType.value         : 'so';

    if (!searchVal) return alert('Please enter an SO Number or Model Name to search.');

    hideStatus();
    if (resultsDiv) resultsDiv.style.display = 'none';
    const iframeContainer = document.getElementById('gapid-iframe-container');
    if (iframeContainer) iframeContainer.innerHTML = '';
    const oldIframe = document.getElementById('gapid-iframe');
    if (oldIframe) oldIframe.remove();

    showStatus('🔍 Searching…', false);

    try {
        const authUser = sessionStorage.getItem('currentUser') || '';
        const url = `${BACKEND_URL}/search-gapid?query=${encodeURIComponent(searchVal)}&search_type=${encodeURIComponent(typeVal)}&auth_user=${encodeURIComponent(authUser)}`;
        const res = await fetch(url);
        let data;
        try { data = await res.json(); } catch (_) {
            showStatus('❌ Server returned an unexpected response.', true); return;
        }
        hideStatus();
        if (res.status === 401) {
            alert('Session expired. Please log in again.');
            window.location.href = 'login.html'; return;
        }

        if (data.found) {
            const previewLink = data.link.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview');
            if (docLabel) docLabel.innerHTML = `<strong>SO:</strong> ${data.so} &nbsp;|&nbsp; <strong>Model:</strong> ${data.model}` + (data.customer ? ` &nbsp;|&nbsp; <strong>Customer:</strong> ${data.customer}` : '');
            
            if (resultsDiv) {
                resultsDiv.style.display = 'flex';
                resultsDiv.style.flexDirection = 'column';
                resultsDiv.style.gap = '10px';
            }

            const openBtn = document.getElementById('gapid-open-btn');
            const dlBtn   = document.getElementById('gapid-download-btn');
            if (openBtn) openBtn.onclick = function() { window.open(data.link, '_blank'); };
            if (dlBtn)   dlBtn.onclick   = function() { window.open(data.link, '_blank'); };

            const iframe = document.createElement('iframe');
            iframe.id = 'gapid-iframe'; iframe.src = previewLink;
            iframe.width = '100%'; iframe.height = '720px';
            iframe.style.border = '1px solid #ccc'; iframe.style.borderRadius = '6px';
            iframe.style.display = 'block'; iframe.allow = 'autoplay'; iframe.setAttribute('allowfullscreen', '');

            if (iframeContainer) iframeContainer.appendChild(iframe);
            else if (resultsDiv) resultsDiv.appendChild(iframe);
        } else {
            showStatus('❌ ' + (data.error || 'No matching document found.'), true);
        }
    } catch (err) {
        showStatus('❌ Connection error: ' + err.message + '. Make sure backend server is running.', true);
    }
}

// ==================== FOULING FACTOR & CONVERSIONS ====================
const foulingFactorOptions = {
    metric: [
        { label: '0.0180', value: 0.0180 }, { label: '0.0352', value: 0.0352 },
        { label: '0.0440', value: 0.0440 }, { label: '0.0880', value: 0.0880 },
        { label: '0.1320', value: 0.1320 }, { label: '0.1760', value: 0.1760 }
    ],
    imperial: [
        { label: '0.0001',  value: 0.0001  }, { label: '0.00025', value: 0.00025 },
        { label: '0.0005',  value: 0.0005  }, { label: '0.001',   value: 0.001   }
    ]
};

const celsiusToFahrenheit = c => (c * 9 / 5) + 32;
const fahrenheitToCelsius = f => (f - 32) * 5 / 9;
const kwToTonR            = kw => kw * 0.284345;
const tonRToKw            = t  => t  / 0.284345;

function initializeFoulingFactorInputs() {
    const evapSel = document.getElementById('evap-fouling-factor');
    const condSel = document.getElementById('cond-fouling-factor');
    if (!evapSel || !condSel) return;
    evapSel.innerHTML = ''; condSel.innerHTML = '';
    foulingFactorOptions.metric.forEach(o => { evapSel.add(new Option(o.label, o.value)); condSel.add(new Option(o.label, o.value)); });
    evapSel.value = 0.0180; evapSel.dataset.baseValue = 0.0180;
    condSel.value = 0.0440; condSel.dataset.baseValue = 0.0440;
    const eUnit = document.getElementById('evap-fouling-factor-unit');
    const cUnit = document.getElementById('cond-fouling-factor-unit');
    if (eUnit) eUnit.value = 'm²·K/kW'; if (cUnit) cUnit.value = 'm²·K/kW';
}

function handleInput(inputId, type) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.tagName === 'SELECT') { input.dataset.baseValue = parseFloat(input.value); return; }
    const unitSelect = document.getElementById(inputId + '-unit');
    const value = parseFloat(input.value);
    if (isNaN(value) || input.value === '') { input.dataset.baseValue = ''; return; }
    const unit = unitSelect ? unitSelect.value : null;
    let base;
    switch (type) {
        case 'temperature': base = (unit === '°F') ? fahrenheitToCelsius(value) : value; break;
        case 'capacity':    base = (unit === 'tonR') ? tonRToKw(value) : value; break;
        case 'altitude':    base = (unit === 'ft') ? value * 0.3048 : value; break;
        default:            base = value;
    }
    input.dataset.baseValue = base;
}

function handleFoulingFactorChange(selectId) {
    const el = document.getElementById(selectId);
    if (el) el.dataset.baseValue = parseFloat(el.value);
}

function convertAndDisplay(selectId, type) {
    const inputId = selectId.replace('-unit', '');
    const input = document.getElementById(inputId);
    const unitSelect = document.getElementById(selectId);
    if (!input || !unitSelect) return;

    if (type === 'foulingFactor') {
        const newUnit = unitSelect.value;
        const opts = (newUnit === 'm²·K/kW') ? foulingFactorOptions.metric : foulingFactorOptions.imperial;
        const foulingEl = document.getElementById(inputId);
        foulingEl.innerHTML = '';
        opts.forEach(o => foulingEl.add(new Option(o.label, o.value)));
        foulingEl.value = opts[0].value; foulingEl.dataset.baseValue = opts[0].value;
        return;
    }

    const base = parseFloat(input.dataset.baseValue);
    if (isNaN(base) || input.dataset.baseValue === '') return;

    const unit = unitSelect.value;
    let display;
    switch (type) {
        case 'temperature': display = (unit === '°F') ? celsiusToFahrenheit(base) : base; break;
        case 'capacity':    display = (unit === 'tonR') ? kwToTonR(base) : base; break;
        case 'altitude':    display = (unit === 'ft') ? base / 0.3048 : base; break;
        default:            display = base;
    }
    input.value = display.toFixed(2);
}

// ==================== DATA COLLECTION & BACKEND ====================
function getBaseValue(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const b = el.dataset.baseValue;
    if (b === '' || b === undefined || isNaN(parseFloat(b))) {
        const v = parseFloat(el.value);
        return isNaN(v) ? 0 : v;
    }
    return parseFloat(b);
}

function getCondenserData() {
    if (currentChillerType === 'water') {
        return {
            condEnteringTemp: getBaseValue('cond-entering-temp'),
            condLeavingTemp: getBaseValue('cond-leaving-temp'),
            condFoulingFactor: parseFloat(document.getElementById('cond-fouling-factor')?.value) || 0,
            condTubeMaterial: document.getElementById('cond-tube-material')?.value || '',
            condPasses: parseInt(document.getElementById('cond-passes')?.value) || 0,
            condPercentOfBrine: getBaseValue('cond-brine-percent')
        };
    } else {
        return {
            ambientTemp: getBaseValue('ambient-temp'), altitude: getBaseValue('altitude'),
            finMaterial: document.getElementById('fin-material')?.value || '', wetBulbTemp: getBaseValue('wet-bulb-temp')
        };
    }
}

function collectFormData() {
    const evapFouling = document.getElementById('evap-fouling-factor');
    const seriesSel   = document.getElementById('chiller-series');
    const inputData = {
        chillerType: currentChillerType, chillerSeries: seriesSel ? seriesSel.value : '',
        requiredCapacity: getBaseValue('required-capacity'), evapEnteringTemp: getBaseValue('evap-entering-temp'),
        evapLeavingTemp: getBaseValue('evap-leaving-temp'), evapFoulingFactor: parseFloat(evapFouling?.value) || 0,
        evapTubeMaterial: document.getElementById('evap-tube-material')?.value || '',
        evapPasses: parseInt(document.getElementById('evap-passes')?.value) || 0,
        evapPercentOfBrine: getBaseValue('evap-brine-percent'), ...getCondenserData()
    };
    return { inputData };
}

async function sendToBackend() {
    const { inputData } = collectFormData();
    const values = [
        inputData.evapEnteringTemp, inputData.evapLeavingTemp, inputData.evapFoulingFactor, inputData.evapTubeMaterial, inputData.evapPasses,
        inputData.condEnteringTemp || 0, inputData.condLeavingTemp || 0, inputData.condFoulingFactor || 0, inputData.condTubeMaterial || 'N/A',
        inputData.condPasses || 0, inputData.evapPercentOfBrine, inputData.condPercentOfBrine || 0, inputData.requiredCapacity, inputData.chillerType,
        inputData.ambientTemp || 0, inputData.altitude || 0, inputData.finMaterial || 'N/A', inputData.wetBulbTemp || 0
    ];

    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'block';
    showMessage('Processing your request…', 'loading');

    try {
        const response = await fetch(`${BACKEND_URL}/write-excel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-Auth-User': sessionStorage.getItem('currentUser') || '' },
            body: JSON.stringify({ values, chillerType: inputData.chillerType, chillerSeries: inputData.chillerSeries })
        });
        const data = await response.json();

        if (response.ok) {
            if (loadingDiv) loadingDiv.style.display = 'none';
            
            // HIDE FORM INPUTS
            const topRow = document.querySelector('#calculator-view > div:first-child');
            const compCont = document.querySelector('.comparison-container');
            const submitBtn = document.querySelector('.submit-button-container');
            const respMsg = document.getElementById('response-message');

            if (topRow) topRow.style.display = 'none';
            if (compCont) compCont.style.display = 'none';
            if (submitBtn) submitBtn.style.display = 'none';
            if (respMsg) respMsg.style.display = 'none';

            globalResults = data.results;
            globalDetailedResults = data.detailed_results;
            globalInputData = inputData;
            
            displayResults(globalResults, globalDetailedResults);
            
            // *** FIX: Explicitly show the summary view after populating it. ***
            const summaryView = document.getElementById('summaryView');
            if(summaryView) {
                summaryView.style.display = 'block';
            }
            
        } else {
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                window.location.href = 'login.html'; return;
            }
            showMessage(`❌ Error: ${data.error}`, 'error');
            if (loadingDiv) loadingDiv.style.display = 'none';
        }
    } catch (err) {
        showMessage(`❌ Connection Error: ${err.message}`, 'error');
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

function showMessage(message, type) {
    const div = document.getElementById('response-message');
    if (div) { div.textContent = message; div.className = `message ${type}`; div.style.display = 'block'; }
    else if (type === 'error') { alert(message); }
}

// ==================== RESULTS DISPLAY & TABLES ====================
function formatValue(v) {
    if (v === null || v === undefined || v === '') return '<span style="color:#999;">N/A</span>';
    if (typeof v === 'number') return Number.isInteger(v) ? v.toString() : v.toFixed(4);
    return v;
}

function generateRows(data, suffix) {
    return [100, 90, 80, 75, 70, 60, 50, 40, 30, 25, 20, 10].map(p => `
        <tr>
            <td><strong>${p}%</strong></td>
            <td>${formatValue(data[`Part Load ${p}% Capacity (TR)${suffix}`])}</td>
            <td>${formatValue(data[`Part Load ${p}% Power (kW)${suffix}`])}</td>
            <td>${formatValue(data[`Part Load ${p}% Efficiency (kW/TR)${suffix}`])}</td>
        </tr>
    `).join('');
}

function showDetailedView() {
    document.getElementById('summaryView').style.display = 'none';
    document.getElementById('detailedViewWrapper').style.display = 'block';
}

function showSummaryView() {
    document.getElementById('detailedViewWrapper').style.display = 'none';
    document.getElementById('summaryView').style.display = 'block';
}

function displayResults(results, detailedResults) {
    const summaryContainer  = document.getElementById('summaryView');
    const detailedContainer = document.getElementById('detailedViewContent');

    if (!summaryContainer || !detailedContainer) {
        console.error("Result containers not found in DOM.");
        return;
    }
    if (!detailedResults) { 
        summaryContainer.innerHTML = '<p style="color:red;">❌ No results data received from server.</p>'; 
        return; 
    }

    const capTR = detailedResults['Cooling/Heating Capacity (TR)'] || 0;
    const capKw = (capTR * 3.51685).toFixed(1);
    const pwrKw = detailedResults['Power Input (kW)'] || 0;

    const evapLPM = detailedResults['Evaporator Flow Rate (LPM)'] || 0;
    const evapM3h = (evapLPM * 0.06).toFixed(2);
    const evapPD  = detailedResults['Evaporator Pressure Drop (kPa)'] || '-';
    const evapModel = detailedResults['Evaporator Model & Cu Tube Count'] || '-';

    const condLPM = detailedResults['Condenser Flow Rate (LPM)'] || 0;
    const condM3h = (condLPM * 0.06).toFixed(2);
    const condPD  = detailedResults['Condenser Side Pressure Drop (kPa)'] || '-';
    const condModel = detailedResults['Condenser Model & Cu Tube Count'] || '-';

    summaryContainer.innerHTML = `
        <div style="overflow-x:auto;">
            <table class="summary-table">
                <thead><tr>
                    <th>Models</th><th>Capacity<br>(kW)</th><th>Power<br>(kW)</th><th>Evaporator<br>Model</th>
                    <th>Evap. Flow Rate<br>(m3/h)</th><th>Evap. Pressure Drop<br>(kPa)</th><th>Condenser<br>Model</th>
                    <th>Cond. Flow Rate<br>(m3/h)</th><th>Cond. Pressure Drop<br>(kPa)</th><th>Efficient<br>Models</th><th>Economy<br>Models</th>
                </tr></thead>
                <tbody><tr>
                    <td><button class="btn-model" onclick="showDetailedView()">${formatValue(detailedResults['Model'])}</button></td>
                    <td>${capKw}</td><td>${formatValue(pwrKw)}</td><td>${formatValue(evapModel)}</td><td>${evapM3h}</td>
                    <td>${formatValue(evapPD)}</td><td>${formatValue(condModel)}</td><td>${condM3h}</td><td>${formatValue(condPD)}</td>
                    <td><input type="checkbox"></td><td><input type="checkbox"></td>
                </tr></tbody>
            </table>
        </div>
    `;

    let html = `
        <div class="table-container">
            <h3>Model Information</h3>
            <table class="styled-table">
                <thead><tr><th style="width:60%">Parameter</th><th>Value</th></tr></thead>
                <tbody>
                    <tr><td>Model</td><td>${formatValue(detailedResults['Model'])}</td></tr>
                    <tr><td>Compressor</td><td>${formatValue(detailedResults['Compressor'])}</td></tr>
                    <tr><td>Cooling/Heating Capacity (TR)</td><td><strong>${formatValue(detailedResults['Cooling/Heating Capacity (TR)'])}</strong></td></tr>
                    <tr><td>Power Input (kW)</td><td><strong>${formatValue(detailedResults['Power Input (kW)'])}</strong></td></tr>
                </tbody>
            </table>
        </div>
    `;

    if (currentChillerType === 'water') {
        html += `
            <div class="table-container">
                <h3>Evaporator &amp; Condenser (Water-Cooled)</h3>
                <table class="styled-table">
                    <thead><tr><th>Parameter</th><th>Evaporator</th><th>Condenser</th></tr></thead>
                    <tbody>
                        <tr><td>Inlet Temp (°C)</td><td>${formatValue(detailedResults['Evaporator Inlet Temp (°C)'])}</td><td>${formatValue(detailedResults['Condenser Water Inlet Temp (°C)'])}</td></tr>
                        <tr><td>Outlet Temp (°C)</td><td>${formatValue(detailedResults['Evaporator Outlet Temp (°C)'])}</td><td>${formatValue(detailedResults['Condenser Water Outlet Temp (°C)'])}</td></tr>
                        <tr><td>Flow Rate (LPM)</td><td>${formatValue(detailedResults['Evaporator Flow Rate (LPM)'])}</td><td>${formatValue(detailedResults['Condenser Flow Rate (LPM)'])}</td></tr>
                        <tr><td>MEG (%)</td><td>${formatValue(detailedResults['Evaporator MEG (%)'])}</td><td>${formatValue(detailedResults['Condenser MEG (%)'])}</td></tr>
                        <tr><td>Model &amp; Tube Count</td><td>${formatValue(detailedResults['Evaporator Model & Cu Tube Count'])}</td><td>${formatValue(detailedResults['Condenser Model & Cu Tube Count'])}</td></tr>
                        <tr><td>Tube Material</td><td>${formatValue(detailedResults['Evaporator Tube Material'])}</td><td>${formatValue(detailedResults['Condenser Tube Material'])}</td></tr>
                        <tr><td>Passes</td><td>${formatValue(detailedResults['Evaporator Number of Passes (nos)'])}</td><td>${formatValue(detailedResults['Condenser Number of Passes (nos)'])}</td></tr>
                        <tr><td>Fouling Factor</td><td>${formatValue(detailedResults['Evaporator Fouling Factor (m²·K/kW)'])}</td><td>${formatValue(detailedResults['Condenser Fouling Factor (m²·K/kW)'])}</td></tr>
                        <tr><td>Saturation Temp (°C)</td><td>${formatValue(detailedResults['Evaporator Saturation Temp (°C)'])}</td><td>${formatValue(detailedResults['Condenser Saturation Temp (°C)'])}</td></tr>
                        <tr><td>Velocity (m/s)</td><td>${formatValue(detailedResults['Evaporator Velocity (m/s)'])}</td><td>${formatValue(detailedResults['Condenser Velocity (m/s)'])}</td></tr>
                        <tr><td>Pressure Drop (kPa)</td><td>${formatValue(detailedResults['Evaporator Pressure Drop (kPa)'])}</td><td>${formatValue(detailedResults['Condenser Side Pressure Drop (kPa)'])}</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    } else {
        html += `
            <div class="table-container">
                <h3>Evaporator (Air-Cooled)</h3>
                <table class="styled-table">
                    <thead><tr><th style="width:60%">Parameter</th><th>Value</th></tr></thead>
                    <tbody>
                        <tr><td>Inlet Temp (°C)</td><td>${formatValue(detailedResults['Evaporator Inlet Temp (°C)'])}</td></tr>
                        <tr><td>Outlet Temp (°C)</td><td>${formatValue(detailedResults['Evaporator Outlet Temp (°C)'])}</td></tr>
                        <tr><td>Flow Rate (LPM)</td><td>${formatValue(detailedResults['Evaporator Flow Rate (LPM)'])}</td></tr>
                        <tr><td>MEG (%)</td><td>${formatValue(detailedResults['Evaporator MEG (%)'])}</td></tr>
                        <tr><td>Model &amp; Tube Count</td><td>${formatValue(detailedResults['Evaporator Model & Cu Tube Count'])}</td></tr>
                        <tr><td>Tube Material</td><td>${formatValue(detailedResults['Evaporator Tube Material'])}</td></tr>
                        <tr><td>Passes</td><td>${formatValue(detailedResults['Evaporator Number of Passes (nos)'])}</td></tr>
                        <tr><td>Fouling Factor</td><td>${formatValue(detailedResults['Evaporator Fouling Factor (m²·K/kW)'])}</td></tr>
                        <tr><td>Saturation Temp (°C)</td><td>${formatValue(detailedResults['Evaporator Saturation Temp (°C)'])}</td></tr>
                        <tr><td>Velocity (m/s)</td><td>${formatValue(detailedResults['Evaporator Velocity (m/s)'])}</td></tr>
                        <tr><td>Pressure Drop (kPa)</td><td>${formatValue(detailedResults['Evaporator Pressure Drop (kPa)'])}</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="table-container">
                <h3>Condenser (Air-Cooled)</h3>
                <table class="styled-table">
                    <thead><tr><th style="width:60%">Parameter</th><th>Value</th></tr></thead>
                    <tbody>
                        <tr><td>Ambient Temp (°C)</td><td>${formatValue(detailedResults['Ambient Temperature (°C)'])}</td></tr>
                        <tr><td>Altitude (m)</td><td>${formatValue(detailedResults['Altitude (m)'])}</td></tr>
                        <tr><td>Fin Material</td><td>${formatValue(detailedResults['Fin Material'])}</td></tr>
                        <tr><td>Wet Bulb Temp (°C)</td><td>${formatValue(detailedResults['Wet Bulb Temperature (°C)'])}</td></tr>
                        <tr><td>No of Fan &amp; Coil</td><td>${formatValue(detailedResults['No of Fan & Coil'])}</td></tr>
                        <tr><td>Fan Type</td><td>${formatValue(detailedResults['Fan Type'])}</td></tr>
                        <tr><td>Cooling Type</td><td>${formatValue(detailedResults['Cooling Type'])}</td></tr>
                        <tr><td>Refrigerant Charge</td><td>${formatValue(detailedResults['Refrigerant charge'])}</td></tr>
                        <tr><td>Saturation Temp D (°C)</td><td>${formatValue(detailedResults['Saturation Temp D (°C)'])}</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    html += `
        <div class="table-container" style="margin-top:15px;">
            <h3>AHRI – Relief Condition</h3>
            <table class="styled-table">
                <thead><tr><th>Load %</th><th>Capacity (TR)</th><th>Power (kW)</th><th>Efficiency (kW/TR)</th></tr></thead>
                <tbody>
                    ${generateRows(detailedResults, '_AHRIF')}
                    <tr>
                        <td colspan="3" style="text-align:left;"><strong>IPLV/NPLV.IP</strong></td>
                        <td><strong>${formatValue(detailedResults['IPLV/NPLV.IP_AHRIF'])}</strong></td>
                    </tr>
                </tbody>
            </table>
            <div style="margin-top:8px;text-align:right;">
                <button onclick="generateAndDownloadPDF('AHRI')" class="btn"><i class="fas fa-file-pdf"></i> Download AHRI Report</button>
            </div>
        </div>
    `;

    const table4Title  = currentChillerType === 'water' ? 'CCWET Condition' : 'CAT Condition';
    const table4Suffix = currentChillerType === 'water' ? '_CCWET' : '_CAT';
    const reportLabel  = currentChillerType === 'water' ? 'CCWET' : 'CAT';

    html += `
        <div class="table-container" style="margin-top:15px;">
            <h3>${table4Title}</h3>
            <table class="styled-table">
                <thead><tr><th>Load %</th><th>Capacity (TR)</th><th>Power (kW)</th><th>Efficiency (kW/TR)</th></tr></thead>
                <tbody>${generateRows(detailedResults, table4Suffix)}</tbody>
            </table>
            <div style="margin-top:8px;text-align:right;">
                <button onclick="generateAndDownloadPDF('${reportLabel}')" class="btn"><i class="fas fa-file-pdf"></i> Download ${reportLabel} Report</button>
            </div>
        </div>
    `;

    detailedContainer.innerHTML = html;
    // *** FIX: Removed showSummaryView() from here. Visibility is handled in sendToBackend(). ***
}


// ==================== PDF GENERATION ====================
function formatValueForPDF(v) {
    if (v === null || v === undefined || v === 'N/A' || v === '') return 'N/A';
    if (typeof v === 'string') return v;
    if (typeof v === 'number') return Number.isInteger(v) ? v.toString() : v.toFixed(3);
    return String(v);
}

async function generateAndDownloadPDF(reportType) {
    if (!globalResults || !globalInputData || !globalDetailedResults) {
        alert('No data available. Please submit the form first.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const companyName    = 'Kirloskar Chillers Private Limited';
        const softwareName   = 'Chiller Selection Software';
        const versionText    = 'Version: 1.1.1';
        const releaseDateTxt = 'Release Date: March 2026';
        const printDate      = `Printed on: ${new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' })}`;

        const darkBlue  = [0, 51, 102];
        const white     = [255, 255, 255];
        const black     = [0, 0, 0];
        const lightGray = [245, 245, 245];

        let logoDataUrl = null;
        try {
            const logoEl = document.querySelector('.header-logo');
            if (logoEl) {
                const canvas  = document.createElement('canvas');
                canvas.width  = logoEl.naturalWidth;
                canvas.height = logoEl.naturalHeight;
                canvas.getContext('2d').drawImage(logoEl, 0, 0);
                logoDataUrl = canvas.toDataURL('image/png');
            }
        } catch (e) {}

        const pageHook = (data) => {
            doc.setFillColor(...white); doc.rect(0, 0, 210, 28, 'F');
            doc.setFontSize(12); doc.setTextColor(...darkBlue); doc.setFont('helvetica', 'bold');
            doc.text(companyName, 10, 10);
            doc.setFontSize(8); doc.setFont('helvetica', 'normal');
            doc.text(softwareName, 10, 16);
            doc.text(`${versionText}   |   ${releaseDateTxt}`, 10, 22);
            if (logoDataUrl) doc.addImage(logoDataUrl, 'PNG', 165, 4, 35, 12);
            doc.setFontSize(7);
            doc.text(printDate, 200, 22, { align: 'right' });
            doc.line(10, 26, 200, 26);
            doc.text(`Page ${data.pageNumber}`, 105, 290, { align: 'center' });
        };

        const secHead  = { fillColor: darkBlue, textColor: white, fontStyle: 'bold', halign: 'center', fontSize: 8.5 };
        const tblStyle = { lineWidth: 0.1, lineColor: black, fontSize: 8, cellPadding: 1.5 };

        doc.autoTable({
            didDrawPage: pageHook,
            margin: { top: 30, left: 10, right: 10, bottom: 10 },
            head: [[{ content: 'MODEL INFORMATION', colSpan: 2, styles: secHead }]],
            body: [
                ['Model',         formatValueForPDF(globalDetailedResults['Model'])],
                ['Compressor',    formatValueForPDF(globalDetailedResults['Compressor'])],
                ['Capacity (TR)', formatValueForPDF(globalDetailedResults['Cooling/Heating Capacity (TR)'])],
                ['Power (kW)',    formatValueForPDF(globalDetailedResults['Power Input (kW)'])]
            ],
            theme: 'plain', styles: tblStyle,
            columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' }, 1: { cellWidth: 120 } }
        });

        let lastY = doc.lastAutoTable.finalY;

        if (currentChillerType === 'water') {
            doc.autoTable({
                didDrawPage: pageHook, startY: lastY + 4, margin: { left: 10, right: 10 },
                head: [
                    [{ content: 'DETAILS (WATER-COOLED)', colSpan: 3, styles: secHead }],
                    [{ content: 'Parameter', styles: { fontStyle: 'bold' } }, 'Evaporator', 'Condenser']
                ],
                body: [
                    ['Inlet Temp',   formatValueForPDF(globalDetailedResults['Evaporator Inlet Temp (°C)']),       formatValueForPDF(globalDetailedResults['Condenser Water Inlet Temp (°C)'])],
                    ['Outlet Temp',  formatValueForPDF(globalDetailedResults['Evaporator Outlet Temp (°C)']),      formatValueForPDF(globalDetailedResults['Condenser Water Outlet Temp (°C)'])],
                    ['Flow Rate',    formatValueForPDF(globalDetailedResults['Evaporator Flow Rate (LPM)']),       formatValueForPDF(globalDetailedResults['Condenser Flow Rate (LPM)'])],
                    ['MEG %',        formatValueForPDF(globalDetailedResults['Evaporator MEG (%)']),               formatValueForPDF(globalDetailedResults['Condenser MEG (%)'])],
                    ['Model',        formatValueForPDF(globalDetailedResults['Evaporator Model & Cu Tube Count']), formatValueForPDF(globalDetailedResults['Condenser Model & Cu Tube Count'])],
                    ['Material',     formatValueForPDF(globalDetailedResults['Evaporator Tube Material']),         formatValueForPDF(globalDetailedResults['Condenser Tube Material'])],
                    ['Passes',       formatValueForPDF(globalDetailedResults['Evaporator Number of Passes (nos)']),formatValueForPDF(globalDetailedResults['Condenser Number of Passes (nos)'])],
                    ['Fouling',      formatValueForPDF(globalDetailedResults['Evaporator Fouling Factor (m²·K/kW)']),formatValueForPDF(globalDetailedResults['Condenser Fouling Factor (m²·K/kW)'])],
                    ['Sat Temp',     formatValueForPDF(globalDetailedResults['Evaporator Saturation Temp (°C)']),  formatValueForPDF(globalDetailedResults['Condenser Saturation Temp (°C)'])],
                    ['Velocity',     formatValueForPDF(globalDetailedResults['Evaporator Velocity (m/s)']),        formatValueForPDF(globalDetailedResults['Condenser Velocity (m/s)'])],
                    ['Press Drop',   formatValueForPDF(globalDetailedResults['Evaporator Pressure Drop (kPa)']),   formatValueForPDF(globalDetailedResults['Condenser Side Pressure Drop (kPa)'])]
                ],
                theme: 'plain', styles: tblStyle
            });
        } else {
            const colW   = 92;
            const startY = lastY + 4;
            doc.autoTable({
                didDrawPage: pageHook, startY, margin: { left: 10 }, tableWidth: colW,
                head: [[{ content: 'EVAPORATOR', colSpan: 2, styles: secHead }]],
                body: [
                    ['Inlet Temp',  formatValueForPDF(globalDetailedResults['Evaporator Inlet Temp (°C)'])],
                    ['Outlet Temp', formatValueForPDF(globalDetailedResults['Evaporator Outlet Temp (°C)'])],
                    ['Flow Rate',   formatValueForPDF(globalDetailedResults['Evaporator Flow Rate (LPM)'])],
                    ['MEG %',       formatValueForPDF(globalDetailedResults['Evaporator MEG (%)'])],
                    ['Model',       formatValueForPDF(globalDetailedResults['Evaporator Model & Cu Tube Count'])],
                    ['Material',    formatValueForPDF(globalDetailedResults['Evaporator Tube Material'])],
                    ['Passes',      formatValueForPDF(globalDetailedResults['Evaporator Number of Passes (nos)'])],
                    ['Fouling',     formatValueForPDF(globalDetailedResults['Evaporator Fouling Factor (m²·K/kW)'])],
                    ['Sat Temp',    formatValueForPDF(globalDetailedResults['Evaporator Saturation Temp (°C)'])],
                    ['Velocity',    formatValueForPDF(globalDetailedResults['Evaporator Velocity (m/s)'])],
                    ['Press Drop',  formatValueForPDF(globalDetailedResults['Evaporator Pressure Drop (kPa)'])]
                ],
                theme: 'plain', styles: tblStyle
            });
            const evapY = doc.lastAutoTable.finalY;
            doc.autoTable({
                didDrawPage: pageHook, startY, margin: { left: 108 }, tableWidth: colW,
                head: [[{ content: 'CONDENSER', colSpan: 2, styles: secHead }]],
                body: [
                    ['Ambient',    formatValueForPDF(globalDetailedResults['Ambient Temperature (°C)'])],
                    ['Altitude',   formatValueForPDF(globalDetailedResults['Altitude (m)'])],
                    ['Fin Mat',    formatValueForPDF(globalDetailedResults['Fin Material'])],
                    ['Wet Bulb',   formatValueForPDF(globalDetailedResults['Wet Bulb Temperature (°C)'])],
                    ['Fans/Coil',  formatValueForPDF(globalDetailedResults['No of Fan & Coil'])],
                    ['Fan Type',   formatValueForPDF(globalDetailedResults['Fan Type'])],
                    ['Cool Type',  formatValueForPDF(globalDetailedResults['Cooling Type'])],
                    ['Ref Charge', formatValueForPDF(globalDetailedResults['Refrigerant charge'])],
                    ['Sat Temp D', formatValueForPDF(globalDetailedResults['Saturation Temp D (°C)'])]
                ],
                theme: 'plain', styles: tblStyle
            });
            lastY = Math.max(evapY, doc.lastAutoTable.finalY);
        }

        lastY = doc.lastAutoTable.finalY;

        const getPDFRows = (s) => [100,90,80,75,70,60,50,40,30,25,20,10].map(p => [
            `${p}%`,
            formatValueForPDF(globalDetailedResults[`Part Load ${p}% Capacity (TR)${s}`]),
            formatValueForPDF(globalDetailedResults[`Part Load ${p}% Power (kW)${s}`]),
            formatValueForPDF(globalDetailedResults[`Part Load ${p}% Efficiency (kW/TR)${s}`])
        ]);

        const plHead  = [['Load', 'Capacity', 'Power', 'ikW/TR']];
        const plStyle = { lineWidth: 0.1, lineColor: black, fontSize: 7.5, cellPadding: 1.2 };

        if (reportType === 'AHRI' || reportType === 'AHRIF') {
            doc.autoTable({
                didDrawPage: pageHook, startY: lastY + 5, margin: { left: 10, right: 10 },
                head: [[{ content: 'AHRI – RELIEF CONDITION', colSpan: 4, styles: secHead }], ...plHead],
                body: getPDFRows('_AHRIF'),
                foot: [[
                    { content: 'IPLV', styles: { fillColor: lightGray, fontStyle: 'bold' } },
                    { content: formatValueForPDF(globalDetailedResults['IPLV/NPLV.IP_AHRIF']), colSpan: 3, styles: { fillColor: lightGray, fontStyle: 'bold' } }
                ]],
                theme: 'plain', styles: plStyle
            });
        } else {
            const suffix = (reportType === 'CCWET') ? '_CCWET' : '_CAT';
            const title  = (reportType === 'CCWET') ? 'CCWET CONDITION' : 'CAT CONDITION';
            doc.autoTable({
                didDrawPage: pageHook, startY: lastY + 5, margin: { left: 10, right: 10 },
                head: [[{ content: title, colSpan: 4, styles: secHead }], ...plHead],
                body: getPDFRows(suffix),
                theme: 'plain', styles: plStyle
            });
        }

        doc.save(`${reportType}_Report.pdf`);
        showMessage('PDF downloaded successfully!', 'success');

    } catch (err) {
        alert('PDF Error: ' + err.message);
    }
}

// ==================== APP INIT ====================
window.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('evap-fouling-factor')) {
        initializeFoulingFactorInputs();
        switchChillerType('water');
        showView('calculator');
    }

    var gaInput = document.getElementById('ga-search-input');
    if (gaInput) { gaInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') performGAPIDSearch(); }); }
    var searchBtn = document.querySelector('#ga-pid-view .btn');
    if (searchBtn) { searchBtn.onclick = performGAPIDSearch; }
});