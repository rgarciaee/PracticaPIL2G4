async function loadZones(){

    const response = await fetch("../yaml/data.yaml")
    const text = await response.text()
    
    const data = jsyaml.load(text)
    
    renderProfile(data.web)
    renderZones(data.zonas)
    
    }
    
    function renderProfile(web){
    
    const img = document.getElementById("profile-image")
    
    if(img){
    img.src = web.profile_image
    }
    
    }
    
    function renderZones(zonas){
    
    const container = document.getElementById("zones-list")
    
    container.innerHTML = ""
    
    zonas.forEach(zone => {
    
    const div = document.createElement("div")
    div.className = "zone-card"
    
    div.innerHTML = `
    <h3>${zone.nombre}</h3>
    
    <div class="zone-info">
    <p><strong>Evento:</strong> ${zone.evento}</p>
    <p><strong>Aforo máximo:</strong> ${zone.aforo_maximo}</p>
    <p><strong>Precio alquiler:</strong> ${zone.precio} €</p>
    </div>
    
    <button>Solicitar alquiler</button>
    `
    
    container.appendChild(div)
    
    })
    
    }
    
    loadZones()