document.addEventListener("DOMContentLoaded", async function () {

    try {
        // Check if the user token is available in local storage
        const token = localStorage.getItem("enterpriseToken");

        // If token is not available, redirect to enterprise login page
        if (!token) {
            window.location.href = "loginEnterprise.html";
            return;
        }

        // Fetch the enterprise name regardless of whether jobs are available
        const nameResponse = await fetch(`http://localhost:5001/enterprise/${token}`);
        const nameData = await nameResponse.json();

        // If enterprise name is fetched successfully, display it
        if (nameData.status_code === 200) {
            const enterpriseName = document.getElementById("username");
            const enterpriseUrl = document.getElementById("url");
            const enterpriseCallCenter = document.getElementById("callcenter");
            const enterpriseAddres = document.getElementById("address");
            enterpriseName.textContent = ` ${nameData.data.name} Information`;
            enterpriseUrl.textContent = `URL: ${nameData.data.url}`;
            enterpriseCallCenter.textContent = `Call Center: ${nameData.data.callcenter}`;
            enterpriseAddres.textContent = `Address: ${nameData.data.address}`;
        } else {
            console.error('Error fetching enterprise name:', nameData.status_message);
        }

        // If token is available, fetch jobs associated with the enterprise
        if (token) {
            const response = await fetch(`http://localhost:5001/job/${token}`);
            const data = await response.json();

            // If jobs are fetched successfully, display them
            if (data.status_code === 200) {
                await displayJobs(data.data);
            } else if (data.status_code === 404) {
                // If no jobs found, display a message
                const tableBody = document.querySelector('#jobTable tbody');
                const noJobsElement = document.getElementById('noJobs');
                tableBody.innerHTML = '<tr><td colspan="8">No jobs found</td></tr>';

                if (noJobsElement) {
                    noJobsElement.style.display = 'block';
                    noJobsElement.textContent = 'No jobs found';
                } else {
                    console.log('No jobs found');
                    const noPeopleInterested = document.getElementById('noPeopleInterested');
                    noPeopleInterested.textContent = 'No people interested';
                }
            } else {
                console.error('Error fetching jobs:', data.status_message);
            }
        } else {
            console.error("No enterprise token found in localStorage.");
        }
    } catch (error) {
        console.error('Error fetching jobs:', error);
    }

    // Function to display jobs
    async function displayJobs(jobs) {
        const tableBody = document.querySelector('#jobTable tbody');
        const peopleListDiv = document.getElementById('peopleList');
        const noJobsElement = document.getElementById('noJobs');
        peopleListDiv.innerHTML = '';

        // Check if jobs is an array
        if (!Array.isArray(jobs)) {
            jobs = [jobs];
        }

        // If jobs exist
        if (jobs.length > 0) {
            tableBody.innerHTML = '';
            for (const job of jobs) {
                // Insert job row into the table
                insertJobRow(job, tableBody, peopleListDiv);
                await displayInterestedPeopleCertifications(job.titlejob, job.interested_people, peopleListDiv);
            }


            // Hide the "No jobs found" message if it exists
            if (noJobsElement) {
                noJobsElement.style.display = 'none';
            }
        } else {
            // If no jobs found, display message
            tableBody.innerHTML = '<tr><td colspan="8">No jobs found</td></tr>';
            // Show the "No jobs found" message
            if (noJobsElement) {
                noJobsElement.style.display = 'block';
                noJobsElement.textContent = 'No jobs found';
            } else {
                console.log('No jobs found');
            }
        }
    }

    // Function to display interested people and their certifications
    async function displayInterestedPeopleCertifications(jobTitle, interestedPeople, peopleListDiv) {
        const jobTitleHeader = document.createElement('h2');
        jobTitleHeader.textContent = `People interested in ${jobTitle}`;
        peopleListDiv.appendChild(jobTitleHeader);

        if (interestedPeople.length === 0) {
            const noPeopleInterested = document.createElement('p');
            noPeopleInterested.textContent = 'No people interested in this job';
            peopleListDiv.appendChild(noPeopleInterested);
            return; // Exit the function if there are no interested people
        }

        for (const personId of interestedPeople) {
            try {
                // Fetch person details
                const person = await getPerson(personId);
                if (!person) {
                    console.error(`Person with ID ${personId} not found.`);
                    continue; // Skip to the next iteration of the loop if the person is not found
                }

                // Fetch person certifications
                const certifications = await getCertifications(personId);
                if (Array.isArray(certifications) && certifications.length > 0) {
                    const title = document.createElement('h3');
                    title.textContent = person.name;
                    peopleListDiv.appendChild(title);

                    const certificationsList = document.createElement('ul');
                    certifications.forEach(certification => {
                        const item = document.createElement('li');
                        item.textContent = certification.description;
                        certificationsList.appendChild(item);
                    });
                    peopleListDiv.appendChild(certificationsList);
                } else {
                    const message = document.createElement('p');
                    message.textContent = `${person.name} does not have any certifications.`;
                    peopleListDiv.appendChild(message);
                }
            } catch (error) {
                console.error('Error fetching certifications:', error);
            }
        }
    }

    // Function to insert job row into the table
    function insertJobRow(job, tableBody, peopleListDiv) {
        const row = tableBody.insertRow();

        const titleCell = row.insertCell();
        titleCell.textContent = job.titlejob;

        const descriptionCell = row.insertCell();
        descriptionCell.textContent = job.description;

        const hiringTypeCell = row.insertCell();
        hiringTypeCell.textContent = job.hiringtype;

        const requirementsList = job.requirements.map(req => Object.values(req)[0]).join(', ');
        const requirementsCell = row.insertCell();
        requirementsCell.textContent = requirementsList;

        const salaryCell = row.insertCell();
        salaryCell.textContent = job.salary;

        const interestedPeopleCell = row.insertCell();
        interestedPeopleCell.textContent = job.interested_people.length;

        const editButtonCell = row.insertCell();
        editButtonCell.innerHTML = `<button onclick="updateJob('${job.id}')" class="btn btn-primary">Modify</button>`;
        editButtonCell.innerHTML += `<button onclick="deleteJob('${job.id}')" class="btn btn-danger">Delete</button>`;
    }
});

// Function to fetch enterprise details
async function getEnterprise(enterpriseId) {
    try {
        const response = await fetch(`http://localhost:5001/enterprise?id=${enterpriseId}`);
        const data = await response.json();
        if (data.status_code === 200) {
            return data.data;
        } else {
            console.error(`Error fetching enterprise data: ${data.status_message}`);
            return null;
        }
    } catch (error) {
        console.error('Error fetching enterprise data:', error);
        return null;
    }
}

// Function to fetch person details
async function getPerson(personId) {
    try {
        const response = await fetch(`http://localhost:5001/${personId}/me`);
        const data = await response.json();
        if (data.status_code === 200) {
            return data.data.user;
        } else {
            console.error(`Error fetching person with ID ${personId}:`, data.status_message);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching person with ID ${personId}:`, error);
        return null;
    }
}

// Function to fetch certifications for a person
async function getCertifications(personId) {
    try {
        const response = await fetch(`http://localhost:5001/${personId}/certification`);
        const data = await response.json();
        if (data.status_code === 200) {
            return data.data;
        } else {
            console.error(`Error fetching certifications for person with ID ${personId}: ${data.status_message}`);
            return [];
        }
    } catch (error) {
        console.error(`Error fetching certifications for person with ID ${personId}: ${error}`);
        return [];
    }
}

// Function to redirect to enterprise update page
function updateEnterprise() {
    const token = localStorage.getItem("enterpriseToken");

    if (token) {
        window.location.href = `updateEnterprise.html?token=${token}`;
    } else {
        console.error("No enterprise token found in localStorage.");
    }
}

// Function to redirect to job insertion page
function insertJob() {
    const token = localStorage.getItem("enterpriseToken");

    if (token) {
        window.location.href = `insertJob.html?token=${token}`;
    } else {
        console.error("No enterprise token found in localStorage.");
    }
}

// Function to delete a job
function deleteJob(jobId) {
    if (confirm("Are you sure you want to delete this job?")) {
        fetch(`http://localhost:5001/job/${jobId}`, {
            method: "DELETE",
        })
            .then((response) => {
                if (response.ok) {
                    return response.json();
                } else {
                    return response.json().then((data) => {
                        throw new Error(`Error deleting job: ${data.status_message}`);
                    });
                }
            })
            .then((data) => {
                if (data.status_code === 200) {
                    window.location.reload();
                } else {
                    alert("Error deleting job. Please try again.");
                    console.error("Error deleting job:", data.status_message);
                }
            })
            .catch((error) => {
                alert("Error deleting job. Please try again.");
                console.error("Error deleting job:", error.message);
            });
    }
}

// Function to logout
function logout() {
    localStorage.removeItem("enterpriseToken");
    window.location.href = "loginEnterprise.html";
}

// Function to redirect to job update page
function updateJob(jobId) {
    window.location.href = `updateJob.html?id=${jobId}`;
}