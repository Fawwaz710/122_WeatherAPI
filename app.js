const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;
const apiKey = 'TmW3n2IbOKaZxkghOoYB';

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/lokasi', async (req, res) => {
  const kota = req.query.city ? String(req.query.city).trim() : 'jakarta';

  if (!kota) {
    return res.status(400).json({ message: 'Kota tidak boleh kosong' });
  }

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json?key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;
    const feature = data?.features?.[0];

    if (!feature) {
      return res.status(404).json({ message: 'Lokasi tidak ditemukan' });
    }

    const context = Array.isArray(feature.context) ? feature.context : [];
    const placeType = Array.isArray(feature.place_type) ? feature.place_type[0] : '';
    const negara = context.find((item) => /country\./i.test(item?.id || '') || /country/i.test(item?.text || ''))?.text || 'Tidak diketahui';
    const provinsi = context.find((item) => /region\./i.test(item?.id || '') || /province|state|region/i.test(item?.text || ''))?.text || (placeType === 'region' ? feature.text : 'Tidak diketahui');
    const kecamatan = placeType === 'county' || placeType === 'locality' || placeType === 'neighborhood' || placeType === 'district' ? feature.text : provinsi || feature.text || kota;
    const [longitude, latitude] = feature.center || feature.geometry?.coordinates || [null, null];

    res.json({
      lokasi: feature.text || kota,
      negara,
      provinsi,
      kecamatan,
      longitude,
      latitude,
    });
  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      message: 'Gagal mengambil data dari MapTiler',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
