import React, { useState } from 'react';
import axios from 'axios';
import usePageTitle from '../usePageTitle';


function VehicleEntry() {
  usePageTitle("Vehicle Entry");
  const [plateNumber, setPlateNumber] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Payload must match VehicleLog field name
      const payload = { plateNumber };

      const res = await axios.post(
        'https://anpr-api.gconnectt.com/log-vehicleEntry',
        payload,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      setMessage(`Vehicle entry logged: ID ${res.data.id}`);
      setPlateNumber('');
    } catch (err) {
      console.error(err);
      setMessage('Failed to log vehicle entry');
    }
  };

  return (
    <div>
      <h2>Log Vehicle Entry</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Plate Number"
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          required
        />
        <button type="submit">Log Entry</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default VehicleEntry;