document.addEventListener('DOMContentLoaded', function () {
  const navHome = document.getElementById('nav-home');
  const navMaps = document.getElementById('nav-maps');
  const allNavItems = document.querySelectorAll('.nav-item');

  const homeContent = document.getElementById('home-content');
  const mapContent = document.getElementById('map-content');
  const aboutContent = document.getElementById('about-content');

  const ctaButton = document.querySelector('.cta-button');

  let map;
  let mapInitialized = false;
  let allUmkmData = null; // Variabel global untuk menyimpan semua data UMKM
  let umkmMarkers = L.featureGroup(); // Layer untuk menampung semua marker UMKM

  const typeFilterSelect = document.getElementById('type-filter-select');
  const umkmSelect = document.getElementById('UMKM-select');
  const umkmInfo = document.getElementById('UMKM-info');
  const infoTitle = document.getElementById('info-title');
  const infoAddress = document.getElementById('info-address');
  const infoTelp = document.getElementById('info-telp');
  const infoDeskripsi = document.getElementById('info-deskripsi');
  const infoPhoto = document.getElementById('info-photo');


  function showHome() {
    homeContent.classList.remove('hidden');
    mapContent.classList.add('hidden');
    aboutContent.classList.add('hidden');
    allNavItems.forEach(item => item.classList.remove('active'));
    navHome.classList.add('active');
  }

  function showMaps() {
    homeContent.classList.add('hidden');
    aboutContent.classList.add('hidden');
    mapContent.classList.remove('hidden');
    allNavItems.forEach(item => item.classList.remove('active'));
    navMaps.classList.add('active');

    if (!mapInitialized) {
      initializeMap();
      mapInitialized = true;
    } else {
      setTimeout(() => map.invalidateSize(), 10);
    }
  }

  function showAbout() {
    homeContent.classList.add('hidden');
    mapContent.classList.add('hidden');
    aboutContent.classList.remove('hidden');
    allNavItems.forEach(item => item.classList.remove('active'));
    // Tambahkan class 'active' ke nav-about jika ada
    // const navAbout = document.getElementById('nav-about');
    // if (navAbout) navAbout.classList.add('active');
  }

  navHome.addEventListener('click', showHome);
  navMaps.addEventListener('click', showMaps);
  ctaButton.addEventListener('click', showMaps);

  // Fungsi untuk mengisi filter kategori berdasarkan data GeoJSON
  function populateCategoryFilter(data) {
    const categories = new Set();
    data.features.forEach(feature => {
      if (feature.properties && feature.properties.Kategori) {
        categories.add(feature.properties.Kategori);
      }
    });

    typeFilterSelect.innerHTML = '<option value="all">Semua Tipe</option>';
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      typeFilterSelect.appendChild(option);
    });
  }

  // Fungsi untuk memfilter dan menampilkan marker UMKM
  function filterUMKMMarkers() {
    umkmMarkers.clearLayers(); // Hapus semua marker yang ada

    const selectedCategory = typeFilterSelect.value;
    const selectedUmkmName = umkmSelect.value;

    const filteredFeatures = allUmkmData.features.filter(feature => {
      const isCategoryMatch = selectedCategory === 'all' ||
                              (feature.properties && feature.properties.Kategori === selectedCategory);
      const isUmkmMatch = !selectedUmkmName ||
                            (feature.properties && feature.properties.Nama_Usaha === selectedUmkmName);
      return isCategoryMatch && isUmkmMatch;
    });

    addUMKMMarkers(filteredFeatures); // Panggil fungsi untuk menambahkan marker yang sudah difilter

    // Sesuaikan tampilan peta agar semua marker terlihat setelah difilter
    if (filteredFeatures.length > 0) {
      const bounds = L.geoJSON({type: 'FeatureCollection', features: filteredFeatures}).getBounds();
      map.fitBounds(bounds);
    } else {
        // Jika tidak ada marker yang cocok, mungkin set ulang tampilan peta ke default atau sesuaikan
        map.setView([-7.78, 110.38], 13);
    }
  }

  // Fungsi untuk menambahkan marker ke peta
  function addUMKMMarkers(features) {
    features.forEach(feature => {
      const lat = feature.geometry.coordinates[1];
      const lng = feature.geometry.coordinates[0];
      const namaUsaha = feature.properties.Nama_Usaha || 'Nama Usaha Tidak Tersedia';
      const kategori = feature.properties.Kategori || 'Kategori Tidak Tersedia';
      // Pastikan properti ini ada di GeoJSON Anda. Jika tidak, sesuaikan atau hapus.
      const address = feature.properties.Alamat || 'Alamat tidak tersedia';
      const telp = feature.properties.Telepon || 'Telepon tidak tersedia';
      const deskripsi = feature.properties.Deskripsi || 'Deskripsi tidak tersedia';
      const photo = feature.properties.Gambar || 'https://via.placeholder.com/150'; // Placeholder jika tidak ada foto

      const marker = L.marker([lat, lng]).addTo(umkmMarkers);

      let popupContent = `<b>${namaUsaha}</b><br>Kategori: ${kategori}`;
      if (address !== 'Alamat tidak tersedia') popupContent += `<br>Alamat: ${address}`;
      if (telp !== 'Telepon tidak tersedia') popupContent += `<br>Telp: ${telp}`;
      if (deskripsi !== 'Deskripsi tidak tersedia') popupContent += `<br>Deskripsi: ${deskripsi}`;
      if (photo !== 'https://via.placeholder.com/150') popupContent += `<br><img src="${photo}" alt="${namaUsaha}" style="width:100px; height:auto;">`;

      marker.bindPopup(popupContent);

      // Tambahkan event listener untuk menampilkan info di sidebar saat marker diklik
      marker.on('click', function() {
          infoTitle.textContent = namaUsaha;
          infoAddress.textContent = address;
          infoTelp.textContent = telp;
          infoDeskripsi.textContent = deskripsi;
          infoPhoto.src = photo;
          umkmInfo.classList.remove('hidden');
      });
    });
    umkmMarkers.addTo(map); // Tambahkan semua marker ke peta
  }

  // Fungsi untuk mengisi dropdown UMKM berdasarkan kategori terpilih
  function populateUmkmSelect(category) {
    umkmSelect.innerHTML = '<option value="">--Pilih dari Peta--</option>';
    let filteredUmkmNames = [];

    if (allUmkmData) {
      const featuresToDisplay = category === 'all' ?
                                allUmkmData.features :
                                allUmkmData.features.filter(f => f.properties && f.properties.Kategori === category);

      const uniqueNames = new Set(featuresToDisplay.map(f => f.properties.Nama_Usaha).filter(name => name));
      filteredUmkmNames = Array.from(uniqueNames).sort();
    }

    filteredUmkmNames.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      umkmSelect.appendChild(option);
    });
  }

  // Tambahkan event listener untuk filter kategori
  typeFilterSelect.addEventListener('change', function() {
    populateUmkmSelect(this.value); // Perbarui dropdown UMKM saat kategori berubah
    filterUMKMMarkers(); // Filter marker berdasarkan kategori baru
  });

  // Tambahkan event listener untuk filter UMKM
  umkmSelect.addEventListener('change', function() {
    const selectedUmkmName = this.value;
    umkmMarkers.clearLayers(); // Hapus semua marker yang ada

    if (selectedUmkmName) {
      const feature = allUmkmData.features.find(f => f.properties && f.properties.Nama_Usaha === selectedUmkmName);
      if (feature) {
        addUMKMMarkers([feature]); // Hanya tambahkan marker yang dipilih
        map.setView([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], 17); // Zoom ke marker terpilih
        // Tampilkan info UMKM di sidebar juga
        infoTitle.textContent = feature.properties.Nama_Usaha || 'Nama Usaha Tidak Tersedia';
        infoAddress.textContent = feature.properties.Alamat || 'Alamat tidak tersedia';
        infoTelp.textContent = feature.properties.Telepon || 'Telepon tidak tersedia';
        infoDeskripsi.textContent = feature.properties.Deskripsi || 'Deskripsi tidak tersedia';
        infoPhoto.src = feature.properties.Gambar || 'https://via.placeholder.com/150';
        umkmInfo.classList.remove('hidden');
      }
    } else {
      filterUMKMMarkers(); // Jika "Pilih dari Peta" dipilih, filter ulang semua marker berdasarkan kategori yang aktif
      umkmInfo.classList.add('hidden'); // Sembunyikan panel info
    }
  });


  function initializeMap() {
    map = L.map('map').setView([-7.78, 110.38], 13);

     const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    });
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri'
    });
    const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CartoDB'
    });
    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)'
    });
    
    osm.addTo(map);
    
 const baseMaps = {
        "Default": osm,
        "Satelit": satellite,
        "Mode Gelap": dark,
        "Topografi": topo
    };
    // MUAT FILE GEOJSON
    fetch('3.geojson') // <--- Pastikan nama file ini sesuai dengan nama file GeoJSON Anda
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
      })
      .then(data => {
        allUmkmData = data;
        populateCategoryFilter(data);
        populateUmkmSelect('all'); // Isi dropdown UMKM pertama kali
        filterUMKMMarkers(); // Tampilkan semua marker pertama kali

        // Sesuaikan tampilan peta agar semua marker terlihat setelah dimuat
        if (data.features && data.features.length > 0) {
          const bounds = L.geoJSON(data).getBounds();
          map.fitBounds(bounds);
        }
      })
      .catch(error => console.error('Error loading GeoJSON:', error));

    // Anda dapat menambahkan kode untuk opacity slider atau color slider di sini jika diperlukan
    // const opacitySlider = document.getElementById('geojson-opacity-slider');
    // const opacityValueSpan = document.getElementById('geojson-opacity-value');
    // if (opacitySlider) {
    //   opacitySlider.addEventListener('input', function() {
    //     const opacity = parseFloat(this.value);
    //     if (geojsonLayer) {
    //       geojsonLayer.setStyle({ opacity: opacity, fillOpacity: opacity });
    //     }
    //     opacityValueSpan.textContent = opacity;
    //   });
    // }

    // const colorSlider = document.getElementById('geojson-color-slider');
    // if (colorSlider) {
    //   colorSlider.addEventListener('input', function() {
    //     const hue = parseInt(this.value);
    //     const color = `hsl(${hue}, 70%, 50%)`; // Contoh warna
    //     if (geojsonLayer) {
    //       geojsonLayer.setStyle({ color: color, fillColor: color });
    //     }
    //   });
    // }
  }
});