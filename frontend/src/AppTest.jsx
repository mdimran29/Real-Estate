import { useState } from 'react';

function AppTest() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'blue' }}>PropToken Frontend Test</h1>
      <p>If you see this, React is working!</p>
      <button 
        onClick={() => setCount(count + 1)}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        Count: {count}
      </button>
      <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0' }}>
        <h2>Status:</h2>
        <ul>
          <li>✅ React is rendering</li>
          <li>✅ State management works</li>
          <li>✅ Event handlers work</li>
        </ul>
      </div>
    </div>
  );
}

export default AppTest;
