async function loadUser() {

    const response = await fetch("../yaml/data.yaml")
    const text = await response.text()

    const data = jsyaml.load(text)

    renderProfile(data.web)
    renderUser(data.user)

}

function renderProfile(web) {

    const img = document.getElementById("profile-image")

    if (img) {
        img.src = web.profile_image
    }

}

function renderUser(user) {

    document.getElementById("user-dni").value = user.dni
    document.getElementById("user-name").value = user.nombre_apellidos
    document.getElementById("user-birth").value = user.fecha_nacimiento
    document.getElementById("user-card").value = user.num_tarjeta
    document.getElementById("user-address").value = user.direccion
    document.getElementById("user-email").value = user.email

}

document.getElementById("profile-form").addEventListener("submit", function (e) {

    e.preventDefault()
    alert("Cambios guardados (solo interfaz)")

})

loadUser()