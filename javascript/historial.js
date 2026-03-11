async function loadHistory() {

    const response = await fetch("../yaml/data.yaml")
    const text = await response.text()

    const data = jsyaml.load(text)

    renderProfile(data.web)
    renderHistory(data.historial)

}

function renderProfile(web) {

    const img = document.getElementById("profile-image")

    if (img) {
        img.src = web.profile_image
    }

}

function renderHistory(historial) {

    const container = document.getElementById("history-list")

    container.innerHTML = ""

    historial.forEach(ticket => {

        const div = document.createElement("div")
        div.className = "ticket-card"

        div.innerHTML = `
    <h3>${ticket.evento}</h3>
    
    <div class="ticket-info">
    
    <div><strong>Zona:</strong> ${ticket.zona}</div>
    <div><strong>Fecha evento:</strong> ${ticket.fecha_evento}</div>
    
    <div><strong>Localizador QR:</strong> ${ticket.localizador_qr}</div>
    <div><strong>Fecha compra:</strong> ${ticket.fecha_compra}</div>
    
    <div><strong>Estado:</strong> ${ticket.estado}</div>
    
    </div>
    `

        container.appendChild(div)

    })

}

loadHistory()