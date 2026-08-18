const API_BASE_URL = 'http://localhost:8000';
async function test() {
  try {
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'CAN.log');
    console.log('Sending request...');
    const response = await fetch(`${API_BASE_URL}/api/analysis/upload`, {
      method: 'POST',
      body: formData,
    });
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
