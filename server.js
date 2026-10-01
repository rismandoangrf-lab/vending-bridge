const express = require('express');
const mqtt = require('mqtt');
const app = express();

// Agar server bisa membaca format JSON dari webhook pembayaran
app.use(express.json());

// Hubungkan ke MQTT Broker yang sama dengan NodeMCU Anda
const client = mqtt.connect('mqtt://broker.hivemq.com');

client.on('connect', () => {
  console.log('Skrip Bridge berhasil terhubung ke MQTT Broker 24 Jam!');
});

// 1. Endpoint Webhook (Alamat inilah yang akan didaftarkan ke Payment Gateway QRIS Anda)
app.post('/webhook-qris', (req, res) => {
  const dataPembayaran = req.body;
  
  console.log('Webhook diterima dari server pembayaran:', dataPembayaran);

  // Lakukan pengecekan sederhana (misalnya status sukses dan nominal sesuai Rp15.000)
  // (Format 'status' dan 'amount' disesuaikan dengan dokumentasi payment gateway yang Anda pakai)
  if (dataPembayaran.status === 'success' || dataPembayaran.amount >= 15000) {
    
    // Kirim sinyal ke NodeMCU via MQTT
    client.publish('bojongkembar/vending/shuttle', 'BAYAR', (err) => {
      if (!err) {
        console.log('SUKSES: Sinyal BAYAR dikirim ke NodeMCU!');
        return res.status(200).json({ status: 'success', message: 'Mesin dipicu' });
      } else {
        console.log('GAGAL kirim MQTT:', err);
        return res.status(500).json({ status: 'error', message: 'Gagal kirim ke MQTT' });
      }
    });
    
  } else {
    res.status(400).json({ status: 'failed', message: 'Pembayaran belum valid / nominal salah' });
  }
});

// Jalankan server di port dinamis cloud
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server bridge aktif dan mendengarkan di port ${PORT}`);
});