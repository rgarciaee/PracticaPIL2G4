async function loadEvent(){

    const response = await fetch("../yaml/data.yaml")
    const text = await response.text()
    
    const data = jsyaml.load(text)
    
    renderProfile(data.web)
    renderEvent(data.event_detail)
    
    }
    
    function renderProfile(web){
    
    const img = document.getElementById("profile-image")
    
    if(img){
    img.src = web.profile_image
    }
    
    }
    
    function renderEvent(event){
    
    document.getElementById("event-name").textContent = event.nombre
    document.getElementById("event-dates").textContent =
    event.fecha_inicio + " - " + event.fecha_fin
    
    
    /* artistas */
    
    const artistsContainer = document.getElementById("artists-list")
    
    event.artistas.forEach(artist => {
    
    const div = document.createElement("div")
    div.className = "artist-card"
    
    div.innerHTML = `
    <h3>${artist.nombre}</h3>
    <p>${artist.genero}</p>
    `
    
    artistsContainer.appendChild(div)
    
    })
    
    
    /* entradas */
    
    const ticketsContainer = document.getElementById("tickets-list")
    
    event.entradas.forEach(ticket => {
    
    const div = document.createElement("div")
    div.className = "ticket-card"
    
    div.innerHTML = `
    <h3>${ticket.tipo}</h3>
    <p>Zona: ${ticket.zona}</p>
    <p>Precio: ${ticket.precio} €</p>
    <button>Comprar entrada</button>
    `
    
    ticketsContainer.appendChild(div)
    
    })
    
    
    /* horario */
    
    const scheduleContainer = document.getElementById("schedule-list")
    
    event.horario.forEach(day => {
    
    const div = document.createElement("div")
    div.className = "schedule-day"
    
    let slots = ""
    
    day.slots.forEach(slot => {
    
    slots += `<div class="schedule-slot">${slot.hora} - ${slot.artista}</div>`
    
    })
    
    div.innerHTML = `
    <h3>${day.dia}</h3>
    ${slots}
    `
    
    scheduleContainer.appendChild(div)
    
    })
    
    
    /* puestos */
    
    const standsContainer = document.getElementById("stands-list")
    
    event.puestos.forEach(stand => {
    
    const div = document.createElement("div")
    div.className = "stand-card"
    
    div.innerHTML = `
    <h3>${stand.nombre}</h3>
    <p>Tipo: ${stand.tipo}</p>
    <p>Zona: ${stand.zona}</p>
    `
    
    standsContainer.appendChild(div)
    
    })
    
    }
    
    loadEvent()