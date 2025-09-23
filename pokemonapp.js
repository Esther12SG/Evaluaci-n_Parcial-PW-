// Detalles
const pokeName = document.querySelector('[data-poke-name]');
const pokeImg  = document.querySelector('[data-poke-img]');
const pokeId   = document.querySelector('[data-poke-id]');
const pokeTypes= document.querySelector('[data-poke-types]');
const pokeStats= document.querySelector('[data-poke-stats]');

//lista
const listado   = document.getElementById('listado');
const onlyFavs  = document.getElementById('onlyFavs');
const clearFavs = document.getElementById('clearFavs');

//Utils 
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
const MAX_STAT = 255;
const STAT_LABEL = {
  hp:'HP', attack:'Ataque', defense:'Defensa',
  'special-attack':'Ataque especial','special-defense':'Defensa especial', speed:'Velocidad'
};
const API = {
  list: (limit=151)=>`https://pokeapi.co/api/v2/pokemon?limit=${limit}`,
  byIdOrName: v => `https://pokeapi.co/api/v2/pokemon/${v}`,
  art: id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`, 
  artHD: id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
};
const getIdFromUrl = url => Number(url.split('/').filter(Boolean).pop());

// favoritos en localStorage
const FAV_KEY = 'pokemonapp:favs:list';
const getFavs = ()=> new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]'));
const setFavs = s  => localStorage.setItem(FAV_KEY, JSON.stringify([...s]));

// Búsqueda
function searchPokemon(e){
  e.preventDefault();
  const { value } = e.target.pokemon;
  showLoading();
  fetch(API.byIdOrName(value.toLowerCase()))
    .then(r=>{ if(!r.ok) throw 0; return r.json(); })
    .then(renderDetail)
    .catch(showNotFound);
}
window.searchPokemon = searchPokemon;

function renderDetail(p){
  pokeName.textContent = cap(p.name);
  pokeImg.src = p.sprites.other?.['official-artwork']?.front_default || API.artHD(p.id) || 'poke.png';
  pokeId.textContent = `Nº ${p.id}`;

  // tipos
  pokeTypes.innerHTML = '';
  p.types.forEach(t=>{
    const el = document.createElement('div');
    el.textContent = t.type.name;
    pokeTypes.appendChild(el);
  });

  // stats
  pokeStats.innerHTML = '';
  p.stats.forEach(s=>{
    const row = document.createElement('div'); row.className = 'stat';
    const name = document.createElement('div'); name.className = 'stat__name';
    name.textContent = STAT_LABEL[s.stat.name] || s.stat.name;
    const bar = document.createElement('div'); bar.className = 'stat__bar';
    const fill = document.createElement('span'); fill.className = 'stat__bar-fill';
    fill.style.width = Math.min(100, Math.round((s.base_stat / MAX_STAT) * 100)) + '%';
    const val = document.createElement('div'); val.className = 'stat__val'; val.textContent = s.base_stat;
    bar.appendChild(fill); row.appendChild(name); row.appendChild(bar); row.appendChild(val);
    pokeStats.appendChild(row);
  });
}

function showLoading(){
  pokeName.textContent = 'Buscando…';
  pokeImg.src = 'poke.png'; pokeId.textContent = '';
  pokeTypes.innerHTML = ''; pokeStats.innerHTML = '';
}
function showNotFound(){
  pokeName.textContent = 'No encontrado';
  pokeImg.src = 'poke.png'; pokeId.textContent = '';
  pokeTypes.innerHTML = ''; pokeStats.innerHTML = '';
}

//Lista
let LIST = [];

function loadList(){
  fetch(API.list())
    .then(r=>r.json())
    .then(d=>{
      LIST = d.results.map(r=>{
        const id = getIdFromUrl(r.url);
        return { id, name: r.name };
      });
      renderList();
    })
    .catch(console.error);
}

function renderList(){
  const favs = getFavs();
  const only = onlyFavs.checked;
  listado.innerHTML = '';

  LIST.filter(p=>!only || favs.has(p.id)).forEach(p=>{
    const li = document.createElement('li');
    li.className = 'item';

    const idEl  = document.createElement('span');
    idEl.className = 'item__id';
    idEl.textContent = '#' + String(p.id).padStart(3,'0');

    const img   = document.createElement('img');
    img.className = 'item__img';
    img.loading = 'lazy';
    img.src = API.art(p.id);
    img.alt = p.name;

    const name  = document.createElement('span');
    name.className = 'item__name';
    name.textContent = p.name;

    const favBtn = document.createElement('span');
    favBtn.className = 'item__fav';
    favBtn.setAttribute('aria-pressed', favs.has(p.id));
    favBtn.textContent = favs.has(p.id) ? '♥' : '♡';

   
    li.addEventListener('click', (e)=>{
      if(e.target === favBtn) return; 
      showLoading();
      fetch(API.byIdOrName(p.id)).then(r=>r.json()).then(renderDetail).catch(showNotFound);
    });

 
    favBtn.addEventListener('click', ()=>{
      const set = getFavs();
      set.has(p.id) ? set.delete(p.id) : set.add(p.id);
      setFavs(set);
      renderList();
    });

    li.append(idEl, img, name, favBtn);
    listado.appendChild(li);
  });
}

onlyFavs.addEventListener('change', renderList);
clearFavs.addEventListener('click', ()=>{ setFavs(new Set()); renderList(); });

// Inicial
loadList();
