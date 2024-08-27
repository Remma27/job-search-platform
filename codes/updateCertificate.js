document.addEventListener("DOMContentLoaded", async function () {
    // Get the access token from localStorage
    const token = localStorage.getItem("accessToken");
    if (!token) {
        window.location.href = "login.html";
        return;
    }

    // Get the certificate ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const certId = urlParams.get('certId');
    if (!certId) {
        alert("Certificate ID not provided in the URL.");
        return;
    }

    // Fetch the certificate data from the server
    try {
        const response = await fetch(`http://localhost:5001/${token}/certification/${certId}`);
        if (response.ok) {
            const certData = await response.json();
            fillForm(certData);
        } else {
            alert(`Failed to fetch certificate data. Status: ${response.status}`);
        }
    } catch (error) {
        alert("Error fetching certificate data.");
    }
});

function fillForm(certData) {
    const certificateData = certData.data;
    const form = document.getElementById('updateCertificationForm');
    form.elements['certificationId'].value = certificateData.id;
    form.elements['description'].value = certificateData.description;
    form.elements['category'].value = certificateData.category;
    form.elements['studycenter'].value = certificateData.studycenter;

    if (typeof certificateData.year === 'number' && !isNaN(certificateData.year)) {
        form.elements['year'].value = certificateData.year.toString();
    } else {
        alert("Invalid 'year' value in certificate data.");
        form.elements['year'].value = '';
    }
}

const token = localStorage.getItem("accessToken");

document.getElementById('updateCertificationForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(this);

    const yearValue = formData.get('year');
    if (typeof yearValue === 'string' && !isNaN(parseInt(yearValue))) {
        try {
            const response = await fetch(`http://localhost:5001/${token}/certification/${formData.get('certificationId')}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: formData.get('description'),
                    category: formData.get('category'),
                    studycenter: formData.get('studycenter'),
                    year: parseInt(yearValue)
                })
            });
            if (response.ok) {
                const responseData = await response.json();
                alert('Certificate updated successfully.');
                window.location.href = 'index.html';
            } else {
                alert(`Failed to update certificate. Status: ${response.status}`);
            }
        } catch (error) {
            alert('Error updating certificate.');

        }
    } else {
        alert("Invalid 'year' value in form data.");
    }
});

