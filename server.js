const mqtt = require('mqtt');

// Hubungkan ke MQTT Broker saat webhook dipanggil
module.exports = async (req, res) => {
  // Hanya izinkan metode POST dari payment gateway
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const dataPembayaran = req.body;
  console.log('Webhook diterima:', dataPembayaran);

  // Validasi pembayaran sukses atau nominal sesuai
  if (dataPembayaran && (dataPembayaran.status === 'success' || dataPembayaran.amount >= 15000)) {
    
    // Kirim sinyal MQTT menggunakan Promise agar Vercel sempat mengirim data sebelum tertutup
    try {
      await kirimMQTT();
      return res.status(200).json({ status: 'success', message: 'Mesin dipicu via MQTT' });
    } catch (err) {
      return res.status(500).json({ status: 'error', message: 'Gagal kirim MQTT: ' + err.message });
    }

  } else {
    return res.status(400).json({ status: 'failed', message: 'Pembayaran belum valid' });
  }
};

// Fungsi pembantu untuk koneksi dan publish MQTT
function kirimMQTT() {
  return new Promise((resolve, reject) => {
    const client = mqtt.connect('mqtt://broker.hivemq.com');

    client.on('connect', () => {
      client.publish('bojongkembar/vending/shuttle', 'BAYAR', (err) => {
        client.end(); // Tutup koneksi setelah terkirim
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
    });

    client.on('error', (err) => {
      client.end();
      reject(err);
    });
  });
}