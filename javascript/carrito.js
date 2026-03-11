async function loadYamlData() {

    const response = await fetch("../yaml/data.yaml")
    const yamlText = await response.text()

    const data = jsyaml.load(yamlText)

    renderProfile(data.web)
    renderCart(data.cart.entradas)

}


function renderProfile(web) {

    const img = document.getElementById("profile-image")

    if (img) {
        img.src = web.profile_image
    }

}


function renderCart(entradas) {

    let total = 0

    const previewContainer = document.getElementById("cart-preview")
    const fullContainer = document.getElementById("cart-full-list")

    previewContainer.innerHTML = ""
    fullContainer.innerHTML = ""

    entradas.forEach(entrada => {

        const subtotal = entrada.precio * entrada.cantidad
        total += subtotal


        /* vista desplegable */

        const previewItem = document.createElement("div")
        previewItem.className = "cart-item-preview"

        previewItem.innerHTML = `
    <strong>${entrada.evento}</strong><br>
    ${entrada.cantidad} x ${entrada.precio} €
    `

        previewContainer.appendChild(previewItem)


        /* vista completa */

        const fullItem = document.createElement("div")
        fullItem.className = "cart-full-item"

        fullItem.innerHTML = `
    <h3>${entrada.evento}</h3>
    <p>Zona: ${entrada.zona}</p>
    <p>Fecha: ${entrada.fecha}</p>
    <p>Asiento: ${entrada.asiento}</p>
    <p>Cantidad: ${entrada.cantidad}</p>
    <p>Precio unidad: ${entrada.precio} €</p>
    <p>Subtotal: ${subtotal} €</p>
    `

        fullContainer.appendChild(fullItem)

    })


    document.getElementById("cart-total-preview").textContent = total
    document.getElementById("cart-total-page").textContent = total

}


function setupCartDropdown() {

    const button = document.getElementById("cart-button")
    const dropdown = document.getElementById("cart-dropdown")

    button.addEventListener("click", () => {

        dropdown.classList.toggle("hidden")

    })

}


setupCartDropdown()
loadYamlData()