async function loadYamlData() {

    const response = await fetch("../yaml/data.yaml");
    const yamlText = await response.text();
  
    const data = jsyaml.load(yamlText);
  
    renderWebInfo(data.web);
    renderEvents(data.events);
    renderNews(data.news);
  }
  
  
  function renderWebInfo(web){
  
    document.getElementById("web-title").textContent = web.title;
    document.getElementById("general-description").textContent = web.description;
    document.getElementById("profile-image").src = web.profile_image;
  
  }
  
  
  function renderEvents(events){
  
    const list = document.getElementById("events-list");
    list.innerHTML="";
  
    events.forEach(e => {
  
      const div = document.createElement("div");
      div.className="event-item";
  
      div.innerHTML = `
        <h3>${e.nombre}</h3>
        <div class="event-date">${e.fecha}</div>
        <p>${e.descripcion}</p>
      `;
  
      list.appendChild(div);
  
    });
  
  }
  
  
  function renderNews(news){
  
    const list = document.getElementById("news-list");
    list.innerHTML="";
  
    news.forEach(n => {
  
      const div = document.createElement("div");
      div.className="news-item";
  
      div.innerHTML = `
        <h3>${n.titulo}</h3>
        <p>${n.contenido}</p>
      `;
  
      list.appendChild(div);
  
    });
  
  }
  
  
  loadYamlData();